import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Commission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('budget_min', models.DecimalField(decimal_places=2, max_digits=10)),
                ('budget_max', models.DecimalField(decimal_places=2, max_digits=10)),
                ('reference_images', models.JSONField(blank=True, default=list)),
                ('deadline', models.DateField()),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('accepted', 'Accepted'),
                        ('in_progress', 'In Progress'),
                        ('delivered', 'Delivered'),
                        ('completed', 'Completed'),
                        ('cancelled', 'Cancelled'),
                        ('declined', 'Declined'),
                    ],
                    default='pending',
                    max_length=20,
                )),
                ('revision_limit', models.IntegerField(default=2)),
                ('current_revision', models.IntegerField(default=0)),
                ('rejection_reason', models.TextField(blank=True)),
                ('response_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('artist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='commission_assignments', to=settings.AUTH_USER_MODEL)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='commission_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'commissions',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CommissionDeliverable',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('file', models.FileField(upload_to='commissions/deliverables/')),
                ('notes', models.TextField(blank=True)),
                ('revision_number', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('commission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deliverables', to='commissions.commission')),
            ],
            options={
                'db_table': 'commission_deliverables',
            },
        ),
        migrations.CreateModel(
            name='CommissionReferenceImage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('image', models.ImageField(upload_to='commissions/references/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('commission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reference_image_objects', to='commissions.commission')),
            ],
            options={
                'db_table': 'commission_reference_images',
            },
        ),
    ]
