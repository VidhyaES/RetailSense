from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, StoreViewSet, SalesTransactionViewSet

router = DefaultRouter()
router.register('categories',   CategoryViewSet,         basename='category')
router.register('items',        ProductViewSet,          basename='product')
router.register('stores',       StoreViewSet,            basename='store')
router.register('transactions', SalesTransactionViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
]