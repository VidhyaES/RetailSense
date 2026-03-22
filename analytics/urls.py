from django.urls import path
from .views import (
    SalesTrendView, CategorySummaryView,
    TopProductsView, StorePerformanceView,
    SeasonalityView, AnomalyDetectionView,
)

urlpatterns = [
    path('sales-trend/',       SalesTrendView.as_view(),       name='sales-trend'),
    path('category-summary/',  CategorySummaryView.as_view(),  name='category-summary'),
    path('top-products/',      TopProductsView.as_view(),      name='top-products'),
    path('store-performance/', StorePerformanceView.as_view(), name='store-performance'),
    path('seasonality/',       SeasonalityView.as_view(),      name='seasonality'),
    path('anomalies/',         AnomalyDetectionView.as_view(), name='anomalies'),
]