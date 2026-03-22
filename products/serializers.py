from rest_framework import serializers
from .models import Category, Product, Store, SalesTransaction, ForecastLog


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model  = Category
        fields = ('id', 'name', 'description', 'product_count', 'created_at')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    margin_pct    = serializers.ReadOnlyField()

    class Meta:
        model  = Product
        fields = ('id', 'sku', 'name', 'category', 'category_name',
                  'unit_price', 'cost_price', 'margin_pct', 'unit', 'is_active')


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Store
        fields = ('id', 'code', 'name', 'city', 'state', 'store_type', 'is_active')


class SalesTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku  = serializers.CharField(source='product.sku',  read_only=True)
    store_name   = serializers.CharField(source='store.name',   read_only=True)

    class Meta:
        model  = SalesTransaction
        fields = ('id', 'transaction_id', 'product', 'product_name', 'product_sku',
                  'store', 'store_name', 'quantity', 'unit_price', 'discount_pct',
                  'total_amount', 'payment_method', 'sold_at', 'sold_date')


class ForecastLogSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku  = serializers.CharField(source='product.sku',  read_only=True)

    class Meta:
        model  = ForecastLog
        fields = ('id', 'product', 'product_name', 'product_sku', 'store',
                  'forecast_date', 'model_type', 'predicted_qty', 'lower_bound',
                  'upper_bound', 'mae', 'rmse', 'generated_at')