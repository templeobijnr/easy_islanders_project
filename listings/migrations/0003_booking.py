# Generated manually for Booking model
# Dependencies: python3 manage.py migrate (when Django is available)

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Booking',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('booking_type', models.CharField(
                    choices=[('short_term', 'Short Term'), ('long_term', 'Long Term')],
                    default='short_term',
                    max_length=20
                )),
                ('check_in', models.DateField(blank=True, null=True)),
                ('check_out', models.DateField(blank=True, null=True)),
                ('total_price', models.DecimalField(
                    blank=True,
                    decimal_places=2,
                    help_text='Total booking price',
                    max_digits=10,
                    null=True
                )),
                ('currency', models.CharField(default='EUR', max_length=10)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('confirmed', 'Confirmed'),
                        ('cancelled', 'Cancelled'),
                        ('completed', 'Completed')
                    ],
                    default='pending',
                    max_length=20
                )),
                ('notes', models.TextField(blank=True, help_text='Additional booking notes')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('listing', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='bookings',
                    to='listings.listing'
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='bookings',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['user', 'status'], name='listings_bo_user_id_3a8f9c_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['listing', 'booking_type', 'status'], name='listings_bo_listing_b7e4d2_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['check_in', 'check_out'], name='listings_bo_check_i_5f8a1e_idx'),
        ),
    ]
