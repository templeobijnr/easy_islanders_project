from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0006_add_subcategory_display_order'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='domain',
            field=models.SlugField(blank=True, help_text="Top-level domain slug, e.g. 'real-estate', 'vehicles', 'services'", max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='listing',
            name='listing_kind',
            field=models.CharField(choices=[('offer', 'Offer'), ('request', 'Request')], default='offer', max_length=20),
        ),
        migrations.AddField(
            model_name='listing',
            name='transaction_type',
            field=models.CharField(choices=[('sale', 'For Sale'), ('rent_short', 'Short-Term Rent'), ('rent_long', 'Long-Term Rent'), ('booking', 'Bookable'), ('project', 'Project/Off-plan')], default='sale', max_length=20),
        ),
    ]

