# Generated manually for Booking model

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('assistant', '0007_contactindex'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Booking',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('preferred_date', models.DateTimeField()),
                ('preferred_time', models.TimeField()),
                ('message', models.TextField(blank=True, help_text='Additional message for the agent')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('confirmed', 'Confirmed'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('contact_phone', models.CharField(blank=True, max_length=20)),
                ('contact_email', models.EmailField(blank=True, max_length=254)),
                ('agent_response', models.TextField(blank=True)),
                ('agent_available_times', models.JSONField(default=list, help_text='Available time slots from agent')),
                ('agent_notes', models.TextField(blank=True, help_text='Additional notes from agent')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('confirmed_at', models.DateTimeField(blank=True, null=True)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='assistant.conversation')),
                ('listing', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='assistant.listing')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='auth.user')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['listing', 'status'], name='assistant_bo_listing_6b8c8a_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['user', 'status'], name='assistant_bo_user_id_8c9d2e_idx'),
        ),
        migrations.AddIndex(
            model_name='booking',
            index=models.Index(fields=['preferred_date'], name='assistant_bo_prefer_4a8b1c_idx'),
        ),
    ]


