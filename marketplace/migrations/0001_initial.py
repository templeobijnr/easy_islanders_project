# Generated manually for marketplace app initial models

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SellerProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('business_name', models.CharField(max_length=255)),
                ('categories', models.JSONField(default=list, help_text='List of categories this seller operates in, e.g. ["real_estate", "vehicles"]')),
                ('verified', models.BooleanField(default=False, help_text='Whether this seller has been verified by admins')),
                ('rating', models.FloatField(default=0.0, help_text='Average rating from 0.0 to 5.0')),
                ('total_listings', models.PositiveIntegerField(default=0, help_text='Total number of active listings across all categories')),
                ('ai_agent_enabled', models.BooleanField(default=True, help_text='Whether AI agent can auto-respond to buyer requests')),
                ('phone', models.CharField(blank=True, max_length=50)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('website', models.URLField(blank=True)),
                ('description', models.TextField(blank=True)),
                ('logo_url', models.URLField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='seller_profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='GenericListing',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('category', models.CharField(choices=[('marketplace', 'Marketplace'), ('vehicles', 'Vehicles'), ('services', 'Services'), ('events', 'Events'), ('activities', 'Activities')], max_length=64)),
                ('price', models.DecimalField(blank=True, decimal_places=2, help_text='Price in specified currency', max_digits=10, null=True)),
                ('currency', models.CharField(default='EUR', max_length=10)),
                ('location', models.CharField(blank=True, max_length=255, null=True)),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('image_url', models.URLField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict, help_text='Category-specific fields stored as JSON')),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('pending', 'Pending Verification'), ('sold', 'Sold/Completed')], default='active', max_length=20)),
                ('is_featured', models.BooleanField(default=False)),
                ('views_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('seller', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='listings', to='marketplace.sellerprofile')),
            ],
            options={
                'verbose_name': 'Generic Listing',
                'verbose_name_plural': 'Generic Listings',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ListingImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image_url', models.URLField()),
                ('caption', models.CharField(blank=True, max_length=255)),
                ('display_order', models.PositiveIntegerField(default=0)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='marketplace.genericlisting')),
            ],
            options={
                'ordering': ['display_order', '-uploaded_at'],
            },
        ),
        migrations.AddIndex(
            model_name='sellerprofile',
            index=models.Index(fields=['verified', '-rating'], name='marketplace_verifie_8f4a5c_idx'),
        ),
        migrations.AddIndex(
            model_name='sellerprofile',
            index=models.Index(fields=['user'], name='marketplace_user_id_4b7e9a_idx'),
        ),
        migrations.AddIndex(
            model_name='genericlisting',
            index=models.Index(fields=['category', 'status'], name='marketplace_categor_7c2e1f_idx'),
        ),
        migrations.AddIndex(
            model_name='genericlisting',
            index=models.Index(fields=['seller', 'status'], name='marketplace_seller__9a3d4b_idx'),
        ),
        migrations.AddIndex(
            model_name='genericlisting',
            index=models.Index(fields=['-created_at'], name='marketplace_created_6e8f2d_idx'),
        ),
        migrations.AddIndex(
            model_name='genericlisting',
            index=models.Index(fields=['location'], name='marketplace_locatio_1f5b8c_idx'),
        ),
    ]
