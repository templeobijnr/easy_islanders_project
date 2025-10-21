# Generated migration to add actual database columns for category and subcategory

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_businessprofile_categories'),
        ('listings', '0001_initial'),
    ]

    operations = [
        # Add the actual database columns
        migrations.AddField(
            model_name='businessprofile',
            name='category',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='listings.category'
            ),
        ),
        migrations.AddField(
            model_name='businessprofile',
            name='subcategory',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='listings.subcategory'
            ),
        ),
    ]
