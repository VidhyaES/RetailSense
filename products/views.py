from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from .models import Category, Product, Store, SalesTransaction
from .serializers import (CategorySerializer, ProductSerializer,
                           StoreSerializer, SalesTransactionSerializer)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset         = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['name']


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset         = Product.objects.select_related('category').filter(is_active=True)
    serializer_class = ProductSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['sku', 'name', 'category__name']
    ordering_fields  = ['name', 'unit_price']
    ordering         = ['name']

    @action(detail=True, methods=['get'])
    def sales_summary(self, request, pk=None):
        product = self.get_object()
        since   = timezone.now().date() - timedelta(days=30)
        summary = product.transactions.filter(sold_date__gte=since).aggregate(
            total_units=Sum('quantity'),
            total_revenue=Sum('total_amount'),
            transaction_count=Count('id'),
        )
        return Response({'product': product.sku, 'period_days': 30, **summary})


class StoreViewSet(viewsets.ReadOnlyModelViewSet):
    queryset         = Store.objects.filter(is_active=True)
    serializer_class = StoreSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['code', 'name', 'city']


class SalesTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset         = SalesTransaction.objects.select_related('product', 'store').order_by('-sold_at')
    serializer_class = SalesTransactionSerializer