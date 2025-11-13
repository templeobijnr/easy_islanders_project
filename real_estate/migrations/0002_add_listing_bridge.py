from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0006_add_subcategory_display_order'),
        ('real_estate', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='listing',
            field=models.OneToOneField(blank=True, help_text='Generic listing used for cross-domain features (dashboard, storefront, bookings)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='real_estate_property', to='listings.listing'),
        ),
    ]

