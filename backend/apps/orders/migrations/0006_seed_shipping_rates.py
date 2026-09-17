from decimal import Decimal
from django.db import migrations

PROVINCES = [
    'Koshi',
    'Madhesh',
    'Bagmati',
    'Gandaki',
    'Lumbini',
    'Karnali',
    'Sudurpashchim',
]

# Same province = 100
# Nearby provinces = 200
# Remote provinces = 300
# Default fallback = 200

SAME_PROVINCE = Decimal('100.00')
NEARBY = Decimal('200.00')
REMOTE = Decimal('300.00')
FALLBACK = Decimal('200.00')

NEARBY_MAP = {
    'Koshi': ['Madhesh', 'Bagmati'],
    'Madhesh': ['Koshi', 'Bagmati'],
    'Bagmati': ['Koshi', 'Madhesh', 'Gandaki', 'Lumbini'],
    'Gandaki': ['Bagmati', 'Lumbini'],
    'Lumbini': ['Bagmati', 'Gandaki'],
    'Karnali': ['Gandaki', 'Sudurpashchim'],
    'Sudurpashchim': ['Karnali'],
}


def get_cost(origin, destination):
    if origin == destination:
        return SAME_PROVINCE
    if destination in NEARBY_MAP.get(origin, []):
        return NEARBY
    return REMOTE


def seed_rates(apps, schema_editor):
    ShippingRate = apps.get_model('orders', 'ShippingRate')
    rates = []
    for origin in PROVINCES:
        for destination in PROVINCES:
            rates.append(ShippingRate(
                origin_province=origin,
                destination_province=destination,
                cost=get_cost(origin, destination),
            ))
    ShippingRate.objects.bulk_create(rates, ignore_conflicts=True)


def reverse_seed(apps, schema_editor):
    ShippingRate = apps.get_model('orders', 'ShippingRate')
    ShippingRate.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_shippingrate'),
    ]

    operations = [
        migrations.RunPython(seed_rates, reverse_seed),
    ]
