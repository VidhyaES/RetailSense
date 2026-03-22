from django.core.management.base import BaseCommand
from django.db import transaction
from products.models import Category, Product, Store
from decimal import Decimal

CATEGORIES_DATA = [
    {'name': 'Grocery',        'description': 'Daily essentials, food, and beverages'},
    {'name': 'Electronics',    'description': 'Gadgets and consumer electronics'},
    {'name': 'Clothing',       'description': 'Apparel and fashion'},
    {'name': 'Home & Kitchen', 'description': 'Kitchenware and home essentials'},
    {'name': 'Personal Care',  'description': 'Skincare and grooming products'},
]

PRODUCTS_DATA = [
    {'category': 'Grocery', 'sku': 'GRO-RICE-001', 'name': 'Rice (5kg)',        'unit_price': 285.00, 'cost_price': 210.00, 'unit': 'pack'},
    {'category': 'Grocery', 'sku': 'GRO-ATTA-001', 'name': 'Atta (10kg)',       'unit_price': 320.00, 'cost_price': 235.00, 'unit': 'pack'},
    {'category': 'Grocery', 'sku': 'GRO-COIL-001', 'name': 'Cooking Oil (1L)',  'unit_price': 145.00, 'cost_price': 105.00, 'unit': 'bottle'},
    {'category': 'Grocery', 'sku': 'GRO-SUGR-001', 'name': 'Sugar (1kg)',       'unit_price':  48.00, 'cost_price':  34.00, 'unit': 'pack'},
    {'category': 'Grocery', 'sku': 'GRO-MILK-001', 'name': 'Milk (1L)',         'unit_price':  68.00, 'cost_price':  52.00, 'unit': 'bottle'},
    {'category': 'Grocery', 'sku': 'GRO-BRED-001', 'name': 'Bread',             'unit_price':  45.00, 'cost_price':  30.00, 'unit': 'piece'},
    {'category': 'Grocery', 'sku': 'GRO-EGGS-001', 'name': 'Eggs (12pc)',       'unit_price':  98.00, 'cost_price':  72.00, 'unit': 'dozen'},
    {'category': 'Electronics', 'sku': 'ELE-USBC-001', 'name': 'USB-C Cable',         'unit_price':  299.00, 'cost_price':  150.00, 'unit': 'piece'},
    {'category': 'Electronics', 'sku': 'ELE-EARB-001', 'name': 'Earbuds',             'unit_price':  999.00, 'cost_price':  550.00, 'unit': 'piece'},
    {'category': 'Electronics', 'sku': 'ELE-PBNK-001', 'name': 'Power Bank 10000mAh', 'unit_price': 1299.00, 'cost_price':  750.00, 'unit': 'piece'},
    {'category': 'Electronics', 'sku': 'ELE-SWTC-001', 'name': 'Smart Watch',         'unit_price': 3499.00, 'cost_price': 2100.00, 'unit': 'piece'},
    {'category': 'Electronics', 'sku': 'ELE-BTSP-001', 'name': 'Bluetooth Speaker',   'unit_price': 1999.00, 'cost_price': 1100.00, 'unit': 'piece'},
    {'category': 'Clothing', 'sku': 'CLO-CTSH-001', 'name': 'Cotton T-Shirt', 'unit_price':  399.00, 'cost_price': 180.00, 'unit': 'piece'},
    {'category': 'Clothing', 'sku': 'CLO-DENM-001', 'name': 'Denim Jeans',    'unit_price': 1299.00, 'cost_price': 650.00, 'unit': 'piece'},
    {'category': 'Clothing', 'sku': 'CLO-FRSH-001', 'name': 'Formal Shirt',   'unit_price':  799.00, 'cost_price': 380.00, 'unit': 'piece'},
    {'category': 'Clothing', 'sku': 'CLO-KURT-001', 'name': 'Kurta',          'unit_price':  699.00, 'cost_price': 320.00, 'unit': 'piece'},
    {'category': 'Clothing', 'sku': 'CLO-SHOE-001', 'name': 'Running Shoes',  'unit_price': 1799.00, 'cost_price': 950.00, 'unit': 'pair'},
    {'category': 'Home & Kitchen', 'sku': 'HMK-PANN-001', 'name': 'Non-stick Pan',       'unit_price':  699.00, 'cost_price': 380.00, 'unit': 'piece'},
    {'category': 'Home & Kitchen', 'sku': 'HMK-BOTL-001', 'name': 'Water Bottle 1L',     'unit_price':  299.00, 'cost_price': 140.00, 'unit': 'piece'},
    {'category': 'Home & Kitchen', 'sku': 'HMK-TFFN-001', 'name': 'Stainless Tiffin Box','unit_price':  399.00, 'cost_price': 190.00, 'unit': 'piece'},
    {'category': 'Home & Kitchen', 'sku': 'HMK-PRES-001', 'name': 'Pressure Cooker 3L',  'unit_price': 1199.00, 'cost_price': 680.00, 'unit': 'piece'},
    {'category': 'Home & Kitchen', 'sku': 'HMK-MIXR-001', 'name': 'Mixer Grinder',        'unit_price': 2499.00, 'cost_price':1400.00, 'unit': 'piece'},
    {'category': 'Personal Care', 'sku': 'PRC-SHMP-001', 'name': 'Shampoo 400ml',    'unit_price': 299.00, 'cost_price': 150.00, 'unit': 'bottle'},
    {'category': 'Personal Care', 'sku': 'PRC-FACW-001', 'name': 'Face Wash 150ml',  'unit_price': 199.00, 'cost_price':  95.00, 'unit': 'tube'},
    {'category': 'Personal Care', 'sku': 'PRC-MOIS-001', 'name': 'Moisturiser SPF30','unit_price': 349.00, 'cost_price': 170.00, 'unit': 'bottle'},
    {'category': 'Personal Care', 'sku': 'PRC-TPST-001', 'name': 'Toothpaste 150g',  'unit_price':  89.00, 'cost_price':  45.00, 'unit': 'tube'},
    {'category': 'Personal Care', 'sku': 'PRC-DEOD-001', 'name': 'Deodorant',         'unit_price': 199.00, 'cost_price':  95.00, 'unit': 'piece'},
]

STORES_DATA = [
    {'code': 'KCH001', 'name': 'RetailSense Kochi MG Road',        'city': 'Kochi',      'state': 'Kerala',    'store_type': 'physical'},
    {'code': 'KCH002', 'name': 'RetailSense Kochi Edapally',       'city': 'Kochi',      'state': 'Kerala',    'store_type': 'physical'},
    {'code': 'TVM001', 'name': 'RetailSense Trivandrum Central',   'city': 'Trivandrum', 'state': 'Kerala',    'store_type': 'physical'},
    {'code': 'BLR001', 'name': 'RetailSense Bangalore Indiranagar','city': 'Bangalore',  'state': 'Karnataka', 'store_type': 'physical'},
    {'code': 'BLR002', 'name': 'RetailSense Bangalore Whitefield', 'city': 'Bangalore',  'state': 'Karnataka', 'store_type': 'physical'},
    {'code': 'WEB001', 'name': 'RetailSense Online',                'city': 'Online',     'state': 'Pan-India', 'store_type': 'online'},
]


class Command(BaseCommand):
    help = 'Seeds the database with categories, products, and stores'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...\n')
        with transaction.atomic():
            cat_map = {}
            for cat in CATEGORIES_DATA:
                obj, created = Category.objects.get_or_create(
                    name=cat['name'], defaults={'description': cat['description']}
                )
                cat_map[obj.name] = obj
                self.stdout.write(f"  Category: {obj.name} ({'created' if created else 'exists'})")

            p_count = 0
            for p in PRODUCTS_DATA:
                _, created = Product.objects.get_or_create(
                    sku=p['sku'],
                    defaults={
                        'category':   cat_map[p['category']],
                        'name':       p['name'],
                        'unit_price': Decimal(str(p['unit_price'])),
                        'cost_price': Decimal(str(p['cost_price'])),
                        'unit':       p['unit'],
                        'is_active':  True,
                    }
                )
                if created:
                    p_count += 1
            self.stdout.write(f'  Products: {p_count} created')

            s_count = 0
            for s in STORES_DATA:
                _, created = Store.objects.get_or_create(
                    code=s['code'],
                    defaults={
                        'name': s['name'], 'city': s['city'],
                        'state': s['state'], 'store_type': s['store_type'],
                        'is_active': True,
                    }
                )
                if created:
                    s_count += 1
            self.stdout.write(f'  Stores: {s_count} created')

        self.stdout.write(self.style.SUCCESS('\nDone! Ready to upload sales CSV.'))