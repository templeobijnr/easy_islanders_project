# Generated manually to add SellerProfile and seller FK to Listing

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0003_booking'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SellerProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('business_name', models.CharField(max_length=255)),
                ('verified', models.BooleanField(default=False, help_text='Whether this seller has been verified by admins')),
                ('rating', models.FloatField(default=0.0, help_text='Average rating from 0.0 to 5.0')),
                ('total_listings', models.PositiveIntegerField(default=0, help_text='Total number of active listings')),
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
        migrations.AddField(
            model_name='listing',
            name='seller',
            field=models.ForeignKey(blank=True, help_text='Business seller (if applicable)', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='listings', to='listings.sellerprofile'),
        ),
        migrations.AddIndex(
            model_name='sellerprofile',
            index=models.Index(fields=['verified', '-rating'], name='listings_se_verifie_a8f4d2_idx'),
        ),
        migrations.AddIndex(
            model_name='sellerprofile',
            index=models.Index(fields=['user'], name='listings_se_user_id_7c5e1b_idx'),
        ),
    ]
