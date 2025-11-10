# Generated manually to add BuyerRequest and BroadcastMessage models

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0004_sellerprofile_add_seller_fk'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BuyerRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField(help_text='Detailed request description')),
                ('location', models.CharField(blank=True, max_length=128)),
                ('budget', models.DecimalField(blank=True, decimal_places=2, help_text='Maximum budget', max_digits=10, null=True)),
                ('currency', models.CharField(default='EUR', max_length=10)),
                ('is_fulfilled', models.BooleanField(default=False, help_text='Whether buyer found what they needed')),
                ('response_count', models.PositiveIntegerField(default=0, help_text='Number of seller responses received')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('buyer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='buyer_requests', to=settings.AUTH_USER_MODEL)),
                ('category', models.ForeignKey(blank=True, help_text='Category of request (real estate, services, etc.)', null=True, on_delete=django.db.models.deletion.SET_NULL, to='listings.category')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BroadcastMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('target_audience', models.JSONField(blank=True, default=dict, help_text='Filters for targeting, e.g. {"city": "Kyrenia", "budget_min": 500}')),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('active', 'Active'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='draft', max_length=32)),
                ('views_count', models.PositiveIntegerField(default=0)),
                ('response_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('category', models.ForeignKey(blank=True, help_text='Category this broadcast relates to', null=True, on_delete=django.db.models.deletion.SET_NULL, to='listings.category')),
                ('seller', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='broadcasts', to='listings.sellerprofile')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='buyerrequest',
            index=models.Index(fields=['category', '-created_at'], name='listings_bu_categor_8a1d4e_idx'),
        ),
        migrations.AddIndex(
            model_name='buyerrequest',
            index=models.Index(fields=['buyer', '-created_at'], name='listings_bu_buyer_i_9c2e1f_idx'),
        ),
        migrations.AddIndex(
            model_name='buyerrequest',
            index=models.Index(fields=['is_fulfilled'], name='listings_bu_is_fulf_3d4a5b_idx'),
        ),
        migrations.AddIndex(
            model_name='broadcastmessage',
            index=models.Index(fields=['seller', 'status'], name='listings_br_seller__6f7c8d_idx'),
        ),
        migrations.AddIndex(
            model_name='broadcastmessage',
            index=models.Index(fields=['category', 'status'], name='listings_br_categor_9e8a1c_idx'),
        ),
        migrations.AddIndex(
            model_name='broadcastmessage',
            index=models.Index(fields=['-published_at'], name='listings_br_publish_2b3d4f_idx'),
        ),
    ]
