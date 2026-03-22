from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from products.models import SalesTransaction


class SalesTrendView(APIView):
    def get(self, request):
        granularity = request.query_params.get('granularity', 'daily')
        days        = int(request.query_params.get('days', 90))
        since       = timezone.now().date() - timedelta(days=days)
        qs          = SalesTransaction.objects.filter(sold_date__gte=since)

        if granularity == 'monthly':
            qs = (qs.annotate(period=TruncMonth('sold_at'))
                    .values('period')
                    .annotate(revenue=Sum('total_amount'),
                              volume=Sum('quantity'),
                              txn_count=Count('id'))
                    .order_by('period'))
            data = [
                {
                    'period':       r['period'].strftime('%Y-%m'),
                    'revenue':      round(float(r['revenue']), 2),
                    'volume':       round(float(r['volume']), 2),
                    'transactions': r['txn_count'],
                }
                for r in qs
            ]
        elif granularity == 'weekly':
            qs = (qs.values('sold_year', 'sold_week')
                    .annotate(revenue=Sum('total_amount'),
                              volume=Sum('quantity'),
                              txn_count=Count('id'))
                    .order_by('sold_year', 'sold_week'))
            data = [
                {
                    'period':       f"{r['sold_year']}-W{r['sold_week']:02d}",
                    'revenue':      round(float(r['revenue']), 2),
                    'volume':       round(float(r['volume']), 2),
                    'transactions': r['txn_count'],
                }
                for r in qs
            ]
        else:
            qs = (qs.values('sold_date')
                    .annotate(revenue=Sum('total_amount'),
                              volume=Sum('quantity'),
                              txn_count=Count('id'))
                    .order_by('sold_date'))
            data = [
                {
                    'period':       str(r['sold_date']),
                    'revenue':      round(float(r['revenue']), 2),
                    'volume':       round(float(r['volume']), 2),
                    'transactions': r['txn_count'],
                }
                for r in qs
            ]

        return Response({'granularity': granularity, 'data': data})


class CategorySummaryView(APIView):
    def get(self, request):
        days  = int(request.query_params.get('days', 90))
        since = timezone.now().date() - timedelta(days=days)

        qs = (SalesTransaction.objects
              .filter(sold_date__gte=since)
              .values(category=F('product__category__name'))
              .annotate(
                  revenue   = Sum('total_amount'),
                  volume    = Sum('quantity'),
                  txn_count = Count('id'),
                  avg_order = Avg('total_amount'),
              )
              .order_by('-revenue'))

        total_revenue = sum(float(r['revenue']) for r in qs)

        data = [
            {
                'category':        r['category'],
                'revenue':         round(float(r['revenue']), 2),
                'revenue_pct':     round(float(r['revenue']) / total_revenue * 100, 1) if total_revenue else 0,
                'volume':          round(float(r['volume']), 2),
                'transactions':    r['txn_count'],
                'avg_order_value': round(float(r['avg_order']), 2),
            }
            for r in qs
        ]
        return Response({'period_days': days, 'categories': data})


class TopProductsView(APIView):
    def get(self, request):
        days  = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        since = timezone.now().date() - timedelta(days=days)

        qs = (SalesTransaction.objects
              .filter(sold_date__gte=since)
              .values(
                  sku      = F('product__sku'),
                  name     = F('product__name'),
                  category = F('product__category__name'),
              )
              .annotate(
                  revenue   = Sum('total_amount'),
                  volume    = Sum('quantity'),
                  txn_count = Count('id'),
              )
              .order_by('-revenue')[:limit])

        return Response({
            'period_days': days,
            'products': [
                {
                    'sku':          r['sku'],
                    'name':         r['name'],
                    'category':     r['category'],
                    'revenue':      round(float(r['revenue']), 2),
                    'volume':       round(float(r['volume']), 2),
                    'transactions': r['txn_count'],
                }
                for r in qs
            ]
        })


class StorePerformanceView(APIView):
    def get(self, request):
        days  = int(request.query_params.get('days', 90))
        since = timezone.now().date() - timedelta(days=days)

        qs = (SalesTransaction.objects
              .filter(sold_date__gte=since)
              .values(
                  code       = F('store__code'),
                  store_name = F('store__name'),
                  city       = F('store__city'),
              )
              .annotate(
                  revenue   = Sum('total_amount'),
                  volume    = Sum('quantity'),
                  txn_count = Count('id'),
                  avg_order = Avg('total_amount'),
              )
              .order_by('-revenue'))

        return Response({
            'period_days': days,
            'stores': [
                {
                    'code':            r['code'],
                    'name':            r['store_name'],
                    'city':            r['city'],
                    'revenue':         round(float(r['revenue']), 2),
                    'volume':          round(float(r['volume']), 2),
                    'transactions':    r['txn_count'],
                    'avg_order_value': round(float(r['avg_order']), 2),
                }
                for r in qs
            ]
        })


class SeasonalityView(APIView):
    DOW_NAMES   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday',
                   'Friday', 'Saturday', 'Sunday']
    MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    def get(self, request):
        dow_qs = (SalesTransaction.objects
                  .values('sold_dow')
                  .annotate(avg_revenue=Avg('total_amount'), txn_count=Count('id'))
                  .order_by('sold_dow'))

        month_qs = (SalesTransaction.objects
                    .values('sold_month')
                    .annotate(avg_revenue=Avg('total_amount'), txn_count=Count('id'))
                    .order_by('sold_month'))

        return Response({
            'day_of_week': [
                {
                    'dow':          r['sold_dow'],
                    'label':        self.DOW_NAMES[r['sold_dow']],
                    'avg_revenue':  round(float(r['avg_revenue']), 2),
                    'transactions': r['txn_count'],
                }
                for r in dow_qs
            ],
            'monthly': [
                {
                    'month':        r['sold_month'],
                    'label':        self.MONTH_NAMES[r['sold_month'] - 1],
                    'avg_revenue':  round(float(r['avg_revenue']), 2),
                    'transactions': r['txn_count'],
                }
                for r in month_qs
            ],
        })


class AnomalyDetectionView(APIView):
    def get(self, request):
        import pandas as pd
        from .anomaly import detect_anomalies

        days     = int(request.query_params.get('days', 90))
        severity = request.query_params.get('severity', 'all')
        limit    = int(request.query_params.get('limit', 50))
        since    = timezone.now().date() - timedelta(days=days)

        qs = (SalesTransaction.objects
              .filter(sold_date__gte=since)
              .values(
                  'sold_date',
                  product_sku  = F('product__sku'),
                  product_name = F('product__name'),
                  store_code   = F('store__code'),
                  store_name   = F('store__name'),
                  category     = F('product__category__name'),
              )
              .annotate(
                  daily_qty     = Sum('quantity'),
                  daily_revenue = Sum('total_amount'),
              )
              .order_by('sold_date'))

        if not qs.exists():
            return Response({'anomalies': [], 'summary': {}})

        df = pd.DataFrame(list(qs))
        df.rename(columns={'sold_date': 'date'}, inplace=True)
        df['daily_qty']     = df['daily_qty'].astype(float)
        df['daily_revenue'] = df['daily_revenue'].astype(float)

        result_df = detect_anomalies(df)

        if result_df.empty:
            return Response({'anomalies': [], 'summary': {}})

        anomalies = result_df[result_df['anomaly'] == True].copy()

        if severity != 'all':
            anomalies = anomalies[anomalies['severity'] == severity]

        anomalies = anomalies.sort_values('anomaly_score', ascending=False).head(limit)

        summary = {
            'total_anomalies': int(result_df['anomaly'].sum()),
            'critical':  int((result_df['severity'] == 'critical').sum()),
            'high':      int((result_df['severity'] == 'high').sum()),
            'medium':    int((result_df['severity'] == 'medium').sum()),
            'spikes':    int((result_df['direction'] == 'spike').sum()),
            'drops':     int((result_df['direction'] == 'drop').sum()),
            'period_days': days,
        }

        data = [
            {
                'date':          str(row['date']),
                'product_sku':   row['product_sku'],
                'product_name':  row['product_name'],
                'store_code':    row['store_code'],
                'store_name':    row['store_name'],
                'category':      row['category'],
                'daily_qty':     round(float(row['daily_qty']), 1),
                'daily_revenue': round(float(row['daily_revenue']), 2),
                'anomaly_score': round(float(row['anomaly_score']), 3),
                'severity':      row['severity'],
                'direction':     row['direction'],
                'rolling_mean':  round(float(row['rolling_mean_7']), 1),
                'deviation_pct': round(
                    abs(row['daily_qty'] - row['rolling_mean_7']) /
                    max(row['rolling_mean_7'], 0.1) * 100, 1
                ),
            }
            for _, row in anomalies.iterrows()
        ]

        return Response({'anomalies': data, 'summary': summary})