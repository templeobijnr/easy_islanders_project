# Generated manually for real_estate.Listing enhancements

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('real_estate', '0002_add_listing_bridge'),
    ]

    operations = [
        # Add new property detail fields
        migrations.AddField(
            model_name='listing',
            name='ad_number',
            field=models.CharField(
                blank=True,
                db_index=True,
                default='',
                help_text="Listing reference/ad number (e.g., 'RE-2024-001')",
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='listing',
            name='year_built',
            field=models.IntegerField(
                blank=True,
                help_text='Year the property was built',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='listing',
            name='parking_spaces',
            field=models.IntegerField(
                blank=True,
                help_text='Number of parking spaces available',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='listing',
            name='furnished',
            field=models.BooleanField(
                blank=True,
                help_text='Is the property furnished',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='listing',
            name='pet_friendly',
            field=models.BooleanField(
                blank=True,
                help_text='Are pets allowed',
                null=True,
            ),
        ),
        # Add sale-related fields
        migrations.AddField(
            model_name='listing',
            name='is_for_sale',
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text='True if property is for sale, False if for rent',
            ),
        ),
        migrations.AddField(
            model_name='listing',
            name='sale_price',
            field=models.IntegerField(
                blank=True,
                db_index=True,
                help_text='Sale price (applicable if is_for_sale=True)',
                null=True,
            ),
        ),
        # Add owner field (required for proper listing ownership)
        migrations.AddField(
            model_name='listing',
            name='owner',
            field=models.ForeignKey(
                # Use a default user ID of 1 for existing listings
                # In production, you would want to handle this more carefully
                default=1,
                help_text='User who owns/manages this property',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='real_estate_listings',
                to=settings.AUTH_USER_MODEL,
            ),
            preserve_default=False,  # Don't keep the default after migration
        ),
        # Update rent_type field help text
        migrations.AlterField(
            model_name='listing',
            name='rent_type',
            field=models.CharField(
                choices=[
                    ('short_term', 'short_term'),
                    ('long_term', 'long_term'),
                    ('both', 'both'),
                ],
                db_index=True,
                default='both',
                help_text='short_term (nightly), long_term (monthly), or both (only applies if is_for_sale=False)',
                max_length=10,
            ),
        ),
    ]
