from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Category(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    category   = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    sku        = models.CharField(max_length=50, unique=True, db_index=True)
    name       = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2,
                                     validators=[MinValueValidator(Decimal('0.01'))])
    cost_price = models.DecimalField(max_digits=10, decimal_places=2,
                                     validators=[MinValueValidator(Decimal('0.01'))])
    unit       = models.CharField(max_length=20, default='piece')
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.sku} — {self.name}'

    @property
    def margin_pct(self):
        if self.unit_price > 0:
            return round((self.unit_price - self.cost_price) / self.unit_price * 100, 2)
        return 0.0


class Store(models.Model):
    STORE_TYPES = [
        ('physical', 'Physical'),
        ('online', 'Online'),
        ('kiosk', 'Kiosk'),
    ]
    code       = models.CharField(max_length=20, unique=True, db_index=True)
    name       = models.CharField(max_length=150)
    city       = models.CharField(max_length=100)
    state      = models.CharField(max_length=100)
    store_type = models.CharField(max_length=20, choices=STORE_TYPES, default='physical')
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.code} — {self.name}'


class SalesTransaction(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('wallet', 'Digital Wallet'),
    ]
    product        = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='transactions')
    store          = models.ForeignKey(Store, on_delete=models.PROTECT, related_name='transactions')
    transaction_id = models.CharField(max_length=50, db_index=True)
    quantity       = models.DecimalField(max_digits=10, decimal_places=3,
                                         validators=[MinValueValidator(Decimal('0.001'))])
    unit_price     = models.DecimalField(max_digits=10, decimal_places=2)
    discount_pct   = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_amount   = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    sold_at        = models.DateTimeField(db_index=True)
    sold_date      = models.DateField(db_index=True)
    sold_year      = models.SmallIntegerField()
    sold_month     = models.SmallIntegerField()
    sold_week      = models.SmallIntegerField()
    sold_dow       = models.SmallIntegerField()

    class Meta:
        ordering = ['-sold_at']
        indexes = [
            models.Index(fields=['sold_date', 'product']),
            models.Index(fields=['sold_date', 'store']),
            models.Index(fields=['sold_year', 'sold_month']),
        ]

    def __str__(self):
        return f'{self.transaction_id} | {self.product.sku} | {self.sold_date}'


class ForecastLog(models.Model):
    MODEL_TYPES = [
        ('random_forest', 'Random Forest'),
        ('sarima', 'SARIMA'),
        ('ensemble', 'Ensemble'),
    ]
    product       = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='forecasts')
    store         = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='forecasts')
    forecast_date = models.DateField(db_index=True)
    generated_at  = models.DateTimeField(auto_now_add=True)
    model_type    = models.CharField(max_length=30, choices=MODEL_TYPES)
    predicted_qty = models.DecimalField(max_digits=10, decimal_places=3)
    lower_bound   = models.DecimalField(max_digits=10, decimal_places=3)
    upper_bound   = models.DecimalField(max_digits=10, decimal_places=3)
    mae           = models.FloatField(null=True, blank=True)
    rmse          = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('product', 'store', 'forecast_date', 'model_type')
        ordering = ['forecast_date']

    def __str__(self):
        return f'{self.model_type} | {self.product.sku} | {self.forecast_date}'