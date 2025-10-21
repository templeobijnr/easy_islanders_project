# Generated migration to add category/subcategory fields to BusinessProfile

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('listings', '0001_initial'),  # Ensure listings app is migrated first
    ]

    operations = [
        # Use SeparateDatabaseAndState to handle circular dependency
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='businessprofile',
                    name='category',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to='listings.Category'
                    ),
                ),
                migrations.AddField(
                    model_name='businessprofile',
                    name='subcategory',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to='listings.Subcategory'
                    ),
                ),
            ],
            database_operations=[
                # If tables need to be created in database, add them here
                # For now, just update state since the columns may not exist yet
            ]
        ),
    ]
