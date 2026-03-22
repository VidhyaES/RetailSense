from django.urls import path
from .views import RunForecastView, ForecastResultsView

urlpatterns = [
    path('run/',     RunForecastView.as_view(),     name='forecast-run'),
    path('results/', ForecastResultsView.as_view(), name='forecast-results'),
]