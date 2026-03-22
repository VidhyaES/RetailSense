from django.urls import path
from .views import SalesUploadView, DatabaseStatusView

urlpatterns = [
    path('upload/', SalesUploadView.as_view(), name='sales-upload'),
    path('status/', DatabaseStatusView.as_view(), name='db-status'),
]