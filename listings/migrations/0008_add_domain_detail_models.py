from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0007_add_domain_and_classification'),
    ]

    operations = [
        migrations.CreateModel(
            name='CarListing',
            fields=[
                ('listing', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='car', serialize=False, to='listings.listing')),
                ('is_for_sale', models.BooleanField(default=False)),
                ('is_for_rent', models.BooleanField(default=False)),
                ('vehicle_type', models.CharField(choices=[('car', 'Car'), ('suv', 'SUV'), ('van', 'Van'), ('truck', 'Truck'), ('motorcycle', 'Motorcycle'), ('other', 'Other')], default='car', max_length=30)),
                ('make', models.CharField(max_length=100)),
                ('model', models.CharField(max_length=100)),
                ('year', models.PositiveIntegerField()),
                ('mileage_km', models.PositiveIntegerField(blank=True, null=True)),
                ('transmission', models.CharField(choices=[('manual', 'Manual'), ('automatic', 'Automatic')], default='automatic', max_length=20)),
                ('fuel_type', models.CharField(choices=[('petrol', 'Petrol'), ('diesel', 'Diesel'), ('electric', 'Electric'), ('hybrid', 'Hybrid'), ('other', 'Other')], default='petrol', max_length=20)),
                ('sale_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('rental_price_per_day', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('rental_price_per_month', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='EventListing',
            fields=[
                ('listing', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='event', serialize=False, to='listings.listing')),
                ('start_datetime', models.DateTimeField()),
                ('end_datetime', models.DateTimeField()),
                ('venue_name', models.CharField(blank=True, max_length=255)),
                ('max_capacity', models.PositiveIntegerField(blank=True, null=True)),
                ('has_tickets', models.BooleanField(default=True)),
                ('base_ticket_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='ProductListing',
            fields=[
                ('listing', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='product', serialize=False, to='listings.listing')),
                ('brand', models.CharField(blank=True, max_length=100)),
                ('sku', models.CharField(blank=True, max_length=100)),
                ('stock_quantity', models.PositiveIntegerField(default=1)),
                ('is_new', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='ServiceListing',
            fields=[
                ('listing', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='service', serialize=False, to='listings.listing')),
                ('pricing_model', models.CharField(choices=[('fixed', 'Fixed Price'), ('per_hour', 'Per Hour'), ('per_session', 'Per Session'), ('quote', 'Quote Based')], default='per_hour', max_length=20)),
                ('base_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('supports_online', models.BooleanField(default=False)),
                ('supports_on_site', models.BooleanField(default=True)),
                ('max_group_size', models.PositiveIntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                # NOTE: db_constraint=False to avoid FK type mismatch in legacy DBs where
                # SubCategory primary key type changed after this migration was generated.
                # This keeps the column while skipping the problematic FK constraint.
                ('service_subcategory', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='service_listings', to='listings.subcategory', db_constraint=False)),
            ],
        ),
    ]

