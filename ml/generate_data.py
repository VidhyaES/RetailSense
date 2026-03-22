import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from faker import Faker

fake = Faker('en_IN')
random.seed(42)
np.random.seed(42)

CATEGORIES = {
    'Grocery':        {'weekend_mult': 1.3, 'peak_months': [11, 12, 1], 'base_volume': 25},
    'Electronics':    {'weekend_mult': 1.5, 'peak_months': [10, 11, 12], 'base_volume': 3},
    'Clothing':       {'weekend_mult': 1.6, 'peak_months': [10, 11, 4, 5], 'base_volume': 8},
    'Home & Kitchen': {'weekend_mult': 1.4, 'peak_months': [11, 12], 'base_volume': 5},
    'Personal Care':  {'weekend_mult': 1.1, 'peak_months': [12, 1, 2], 'base_volume': 15},
}

PRODUCTS = [
    {'sku': 'GRO-RICE-001', 'category': 'Grocery',        'price': 285.00},
    {'sku': 'GRO-ATTA-001', 'category': 'Grocery',        'price': 320.00},
    {'sku': 'GRO-COIL-001', 'category': 'Grocery',        'price': 145.00},
    {'sku': 'GRO-SUGR-001', 'category': 'Grocery',        'price':  48.00},
    {'sku': 'GRO-MILK-001', 'category': 'Grocery',        'price':  68.00},
    {'sku': 'GRO-BRED-001', 'category': 'Grocery',        'price':  45.00},
    {'sku': 'GRO-EGGS-001', 'category': 'Grocery',        'price':  98.00},
    {'sku': 'ELE-USBC-001', 'category': 'Electronics',    'price':  299.00},
    {'sku': 'ELE-EARB-001', 'category': 'Electronics',    'price':  999.00},
    {'sku': 'ELE-PBNK-001', 'category': 'Electronics',    'price': 1299.00},
    {'sku': 'ELE-SWTC-001', 'category': 'Electronics',    'price': 3499.00},
    {'sku': 'ELE-BTSP-001', 'category': 'Electronics',    'price': 1999.00},
    {'sku': 'CLO-CTSH-001', 'category': 'Clothing',       'price':  399.00},
    {'sku': 'CLO-DENM-001', 'category': 'Clothing',       'price': 1299.00},
    {'sku': 'CLO-FRSH-001', 'category': 'Clothing',       'price':  799.00},
    {'sku': 'CLO-KURT-001', 'category': 'Clothing',       'price':  699.00},
    {'sku': 'CLO-SHOE-001', 'category': 'Clothing',       'price': 1799.00},
    {'sku': 'HMK-PANN-001', 'category': 'Home & Kitchen', 'price':  699.00},
    {'sku': 'HMK-BOTL-001', 'category': 'Home & Kitchen', 'price':  299.00},
    {'sku': 'HMK-TFFN-001', 'category': 'Home & Kitchen', 'price':  399.00},
    {'sku': 'HMK-PRES-001', 'category': 'Home & Kitchen', 'price': 1199.00},
    {'sku': 'HMK-MIXR-001', 'category': 'Home & Kitchen', 'price': 2499.00},
    {'sku': 'PRC-SHMP-001', 'category': 'Personal Care',  'price':  299.00},
    {'sku': 'PRC-FACW-001', 'category': 'Personal Care',  'price':  199.00},
    {'sku': 'PRC-MOIS-001', 'category': 'Personal Care',  'price':  349.00},
    {'sku': 'PRC-TPST-001', 'category': 'Personal Care',  'price':   89.00},
    {'sku': 'PRC-DEOD-001', 'category': 'Personal Care',  'price':  199.00},
]

STORES = ['KCH001', 'KCH002', 'TVM001', 'BLR001', 'BLR002', 'WEB001']
STORE_WEIGHTS = [15, 15, 15, 20, 15, 20]
PAYMENT_METHODS = ['cash', 'card', 'upi', 'wallet']
PAYMENT_WEIGHTS = [0.15, 0.30, 0.45, 0.10]


def get_multiplier(date, category):
    cat = CATEGORIES[category]
    seasonal   = random.uniform(1.3, 1.8) if date.month in cat['peak_months'] else (
                 random.uniform(0.7, 0.9) if date.month in [6, 7, 8] else 1.0)
    dow_mult   = cat['weekend_mult'] if date.weekday() >= 5 else 1.0
    promo_mult = random.uniform(1.8, 2.5) if random.random() < 0.05 else 1.0
    return seasonal * dow_mult * promo_mult


def generate(days=365):
    end_date   = datetime.now().date() - timedelta(days=1)
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start_date, end_date, freq='D')

    rows = []
    txn_counter = 1

    for date in date_range:
        for product in PRODUCTS:
            category   = product['category']
            base_vol   = CATEGORIES[category]['base_volume']
            multiplier = get_multiplier(date.to_pydatetime(), category)
            daily_qty  = int(np.random.poisson(base_vol * multiplier))

            if daily_qty == 0:
                continue

            n_txns    = min(random.randint(1, 5), daily_qty)
            qty_splits = np.random.multinomial(daily_qty, [1/n_txns] * n_txns)

            for qty in qty_splits:
                if qty == 0:
                    continue

                unit_price   = round(product['price'] * random.uniform(0.95, 1.05), 2)
                discount_pct = random.choices([0, 5, 10, 15, 20], weights=[60, 15, 12, 8, 5])[0]
                store_code   = random.choices(STORES, STORE_WEIGHTS)[0]
                hour         = random.randint(9, 21)
                minute       = random.randint(0, 59)
                sold_at      = datetime.combine(date.date(),
                               datetime.min.time()).replace(hour=hour, minute=minute)

                rows.append({
                    'transaction_id': f'TXN{txn_counter:08d}',
                    'product_sku':    product['sku'],
                    'store_code':     store_code,
                    'quantity':       qty,
                    'unit_price':     unit_price,
                    'discount_pct':   discount_pct,
                    'payment_method': random.choices(PAYMENT_METHODS, PAYMENT_WEIGHTS)[0],
                    'sold_at':        sold_at.isoformat(),
                })
                txn_counter += 1

    df = pd.DataFrame(rows)
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/sales_transactions.csv', index=False)
    print(f'Generated {len(df):,} transactions')
    print(f'Date range: {df["sold_at"].min()[:10]} to {df["sold_at"].max()[:10]}')
    print(f'Saved to data/sales_transactions.csv')
    return df


if __name__ == '__main__':
    generate(days=365)