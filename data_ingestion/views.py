import logging
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Min, Max

from products.models import SalesTransaction, Product, Store, Category
from .pipeline import SalesETLPipeline

logger = logging.getLogger(__name__)


class SalesUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response(
                {'error': 'No file provided. Send CSV as form-data with key "file".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not file_obj.name.endswith('.csv'):
            return Response(
                {'error': 'Only CSV files are supported.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pipeline = SalesETLPipeline()
        result   = pipeline.run(file_obj)

        response_data = {
            'success':        result.success,
            'rows_processed': result.rows_processed,
            'rows_inserted':  result.rows_inserted,
            'rows_skipped':   result.rows_skipped,
            'warnings':       result.warnings,
            'errors':         result.errors,
            'summary':        result.summary,
        }
        http_status = status.HTTP_200_OK if result.success else status.HTTP_422_UNPROCESSABLE_ENTITY
        return Response(response_data, status=http_status)


class DatabaseStatusView(APIView):
    def get(self, request):
        tx_agg = SalesTransaction.objects.aggregate(
            total_transactions=Count('id'),
            total_revenue=Sum('total_amount'),
            date_from=Min('sold_date'),
            date_to=Max('sold_date'),
        )
        return Response({
            'database': {
                'products':   Product.objects.filter(is_active=True).count(),
                'stores':     Store.objects.filter(is_active=True).count(),
                'categories': Category.objects.count(),
            },
            'transactions': {
                'count':     tx_agg['total_transactions'] or 0,
                'revenue':   round(float(tx_agg['total_revenue'] or 0), 2),
                'date_from': str(tx_agg['date_from']) if tx_agg['date_from'] else None,
                'date_to':   str(tx_agg['date_to'])   if tx_agg['date_to']   else None,
            },
        })