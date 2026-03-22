import logging
import pandas as pd
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction
from django.db.models import Sum

from products.models import Product, Store, SalesTransaction, ForecastLog
from products.serializers import ForecastLogSerializer
from .engine import ForecastingEngine

logger = logging.getLogger(__name__)


class RunForecastView(APIView):
    def post(self, request):
        product_id = request.data.get('product_id')
        store_id   = request.data.get('store_id')
        horizon    = int(request.data.get('horizon', 30))

        if not product_id or not store_id:
            return Response(
                {'error': 'product_id and store_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(pk=product_id)
            store   = Store.objects.get(pk=store_id)
        except (Product.DoesNotExist, Store.DoesNotExist) as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

        qs = (SalesTransaction.objects
              .filter(product=product, store=store)
              .values('sold_date')
              .annotate(qty=Sum('quantity'))
              .order_by('sold_date'))

        if not qs.exists():
            return Response(
                {'error': 'No sales history found for this product/store combination.'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        dates  = [row['sold_date'] for row in qs]
        values = [float(row['qty']) for row in qs]
        series = pd.Series(values, index=pd.DatetimeIndex(dates))

        full_index = pd.date_range(series.index.min(), series.index.max(), freq='D')
        series     = series.reindex(full_index, fill_value=0)

        if len(series) < 30:
            return Response(
                {'error': f'Need at least 30 days of data, found {len(series)}.'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        engine  = ForecastingEngine()
        results = engine.run(series, horizon=horizon)

        saved_logs = []
        with db_transaction.atomic():
            for model_type, result in results.items():
                if not result.success:
                    continue

                ForecastLog.objects.filter(
                    product=product, store=store, model_type=model_type
                ).delete()

                ForecastLog.objects.bulk_create([
                    ForecastLog(
                        product       = product,
                        store         = store,
                        forecast_date = date,
                        model_type    = model_type,
                        predicted_qty = Decimal(str(qty)),
                        lower_bound   = Decimal(str(lb)),
                        upper_bound   = Decimal(str(ub)),
                        mae           = result.mae,
                        rmse          = result.rmse,
                    )
                    for date, qty, lb, ub in zip(
                        result.forecast_dates,
                        result.predicted_qty,
                        result.lower_bound,
                        result.upper_bound,
                    )
                ])
                saved_logs.append({
                    'model': model_type,
                    'mae':   result.mae,
                    'rmse':  result.rmse,
                })

        return Response({
            'product': {'id': product.id, 'sku': product.sku, 'name': product.name},
            'store':   {'id': store.id,   'code': store.code, 'name': store.name},
            'models':  saved_logs,
            'message': f'Forecast generated for {horizon} days ahead.',
        })


class ForecastResultsView(APIView):
    def get(self, request):
        product_id = request.query_params.get('product_id')
        store_id   = request.query_params.get('store_id')
        model_type = request.query_params.get('model_type', 'ensemble')

        if not product_id or not store_id:
            return Response(
                {'error': 'product_id and store_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = ForecastLog.objects.filter(
            product_id = product_id,
            store_id   = store_id,
            model_type = model_type,
        ).select_related('product', 'store').order_by('forecast_date')

        if not qs.exists():
            return Response(
                {'error': 'No forecast found. Run POST /api/forecast/run/ first.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'model_type': model_type,
            'count':      qs.count(),
            'forecasts':  ForecastLogSerializer(qs, many=True).data,
        })