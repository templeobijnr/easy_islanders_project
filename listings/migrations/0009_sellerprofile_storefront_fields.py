from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0008_add_domain_detail_models'),
    ]

    operations = [
        migrations.AddField(
            model_name='sellerprofile',
            name='slug',
            field=models.SlugField(default='', help_text='Public storefront handle', max_length=64, unique=True),
        ),
        migrations.AddField(
            model_name='sellerprofile',
            name='storefront_config',
            field=models.JSONField(blank=True, default=dict, help_text='Theme, hero, socials, hours, policy links'),
        ),
        migrations.AddField(
            model_name='sellerprofile',
            name='storefront_published',
            field=models.BooleanField(default=True),
        ),
    ]

