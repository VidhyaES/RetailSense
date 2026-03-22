import pandas as pd
import numpy as np
import logging
from dataclasses import dataclass, field
from typing import Optional
from decimal import Decimal

from django.db import transaction

from products.models import Product, Store, SalesTransaction

logger = logging.getLogger(__name__)


@dataclass
class ETLResult:
    success: bool = False
    rows_processed: int = 0
    rows_inserted:  int = 0
    rows_skipped:   int = 0
    errors: list  = field(default_factory=list)
    warnings: list = field(default_factory=list)
    summary: dict = field(default_factory=dict)

    def add_error(self, msg):
        self.errors.append(msg)
        logger.error(msg)

    def add_warning(self, msg):
        self.warnings.append(msg)
        logger.warning(msg)


REQUIRED_COLUMNS = {'transaction_id', 'product_sku', 'store_code',
                    'quantity', 'unit_price', 'sold_at'}


class Extractor:
    def extract(self, file_obj):
        result = ETLResult(success=False)
        try:
            df = pd.read_csv(file_obj, dtype=str)
        except Exception as e:
            result.add_error(f'Failed to read CSV: {e}')
            return None, result

        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

        missing = REQUIRED_COLUMNS - set(df.columns)
        if missing:
            result.add_error(f'Missing required columns: {missing}')
            return None, result

        result.rows_processed = len(df)
        result.success = True
        return df, result


class Validator:
    def validate(self, df, result):
        valid_mask = pd.Series([True] * len(df), index=df.index)

        for col in ['quantity', 'unit_price']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            bad = df[col].isna()
            if bad.any():
                result.add_warning(f'{bad.sum()} rows have non-numeric {col} — skipped')
                valid_mask &= ~bad

        if 'discount_pct' in df.columns:
            df['discount_pct'] = pd.to_numeric(df['discount_pct'], errors='coerce').fillna(0)
        else:
            df['discount_pct'] = 0.0

        bad_qty = df['quantity'] <= 0
        if bad_qty.any():
            result.add_warning(f'{bad_qty.sum()} rows with quantity <= 0 — skipped')
            valid_mask &= ~bad_qty

        bad_price = df['unit_price'] <= 0
        if bad_price.any():
            result.add_warning(f'{bad_price.sum()} rows with unit_price <= 0 — skipped')
            valid_mask &= ~bad_price

        df['sold_at'] = pd.to_datetime(df['sold_at'], errors='coerce', utc=True)
        bad_dt = df['sold_at'].isna()
        if bad_dt.any():
            result.add_warning(f'{bad_dt.sum()} rows with invalid sold_at — skipped')
            valid_mask &= ~bad_dt

        df['product_sku'] = df['product_sku'].str.strip().str.upper()
        df['store_code']  = df['store_code'].str.strip().str.upper()

        existing_skus   = set(Product.objects.values_list('sku', flat=True))
        existing_stores = set(Store.objects.values_list('code', flat=True))

        bad_sku = ~df['product_sku'].isin(existing_skus)
        if bad_sku.any():
            result.add_warning(f'{bad_sku.sum()} rows with unknown SKUs — skipped')
            valid_mask &= ~bad_sku

        bad_store = ~df['store_code'].isin(existing_stores)
        if bad_store.any():
            result.add_warning(f'{bad_store.sum()} rows with unknown store codes — skipped')
            valid_mask &= ~bad_store

        result.rows_skipped = int((~valid_mask).sum())
        return df[valid_mask].copy()


class Transformer:
    def transform(self, df):
        df = df.copy()
        df['total_amount'] = (
            df['unit_price'] * df['quantity'] * (1 - df['discount_pct'] / 100)
        ).round(2)

        df['sold_date']  = df['sold_at'].dt.date
        df['sold_year']  = df['sold_at'].dt.year
        df['sold_month'] = df['sold_at'].dt.month
        df['sold_week']  = df['sold_at'].dt.isocalendar().week.astype(int)
        df['sold_dow']   = df['sold_at'].dt.dayofweek

        valid_methods = {'cash', 'card', 'upi', 'wallet'}
        if 'payment_method' in df.columns:
            df['payment_method'] = df['payment_method'].str.strip().str.lower()
            df['payment_method'] = df['payment_method'].where(
                df['payment_method'].isin(valid_methods), other='cash'
            )
        else:
            df['payment_method'] = 'cash'

        df['transaction_id'] = df['transaction_id'].str.strip()
        return df


class Loader:
    BATCH_SIZE = 500

    def load(self, df, result):
        product_map = {p.sku: p for p in Product.objects.all()}
        store_map   = {s.code: s for s in Store.objects.all()}

        transactions = []
        for _, row in df.iterrows():
            product = product_map.get(row['product_sku'])
            store   = store_map.get(row['store_code'])
            if not product or not store:
                result.rows_skipped += 1
                continue

            transactions.append(SalesTransaction(
                product        = product,
                store          = store,
                transaction_id = row['transaction_id'],
                quantity       = Decimal(str(row['quantity'])),
                unit_price     = Decimal(str(row['unit_price'])),
                discount_pct   = Decimal(str(row['discount_pct'])),
                total_amount   = Decimal(str(row['total_amount'])),
                payment_method = row['payment_method'],
                sold_at        = row['sold_at'],
                sold_date      = row['sold_date'],
                sold_year      = int(row['sold_year']),
                sold_month     = int(row['sold_month']),
                sold_week      = int(row['sold_week']),
                sold_dow       = int(row['sold_dow']),
            ))

        inserted = 0
        try:
            with transaction.atomic():
                for i in range(0, len(transactions), self.BATCH_SIZE):
                    batch = transactions[i:i + self.BATCH_SIZE]
                    SalesTransaction.objects.bulk_create(batch, ignore_conflicts=True)
                    inserted += len(batch)
        except Exception as e:
            result.add_error(f'Database insert failed: {e}')
            result.success = False
            return result

        result.rows_inserted = inserted
        result.success = True
        return result


class SalesETLPipeline:
    def __init__(self):
        self.extractor   = Extractor()
        self.validator   = Validator()
        self.transformer = Transformer()
        self.loader      = Loader()

    def run(self, file_obj):
        df, result = self.extractor.extract(file_obj)
        if not result.success:
            return result

        df = self.validator.validate(df, result)
        if df.empty:
            result.add_error('No valid rows after validation')
            result.success = False
            return result

        df = self.transformer.transform(df)
        result = self.loader.load(df, result)

        if result.success:
            result.summary = {
                'date_range': {
                    'from': str(df['sold_date'].min()),
                    'to':   str(df['sold_date'].max()),
                },
                'unique_products': int(df['product_sku'].nunique()),
                'unique_stores':   int(df['store_code'].nunique()),
                'total_revenue':   round(float(df['total_amount'].sum()), 2),
            }
        return result