from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='RouterEvent',
            fields=[
                ('event_id', models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4, serialize=False)),
                ('thread_id', models.CharField(max_length=64, blank=True)),
                ('utterance', models.TextField()),
                ('context_hint', models.JSONField(default=dict)),
                ('stage1_safe', models.BooleanField(default=True)),
                ('domain_pred', models.CharField(max_length=64, blank=True)),
                ('domain_conf', models.FloatField(default=0.0)),
                ('in_domain_intent', models.CharField(max_length=64, blank=True)),
                ('action', models.CharField(max_length=32, blank=True)),
                ('latency_ms', models.IntegerField(default=0)),
                ('cost_cents', models.FloatField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'indexes': [models.Index(fields=['created_at'], name='router_even_created_Idx'), models.Index(fields=['domain_pred'], name='router_even_domain_Idx')]},
        ),
        migrations.CreateModel(
            name='IntentExemplar',
            fields=[
                ('exemplar_id', models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4, serialize=False)),
                ('intent_key', models.CharField(max_length=128)),
                ('text', models.TextField()),
                ('vector', models.JSONField(default=list)),
                ('locale', models.CharField(max_length=16, blank=True)),
                ('geo_region', models.CharField(max_length=32, blank=True)),
                ('metadata', models.JSONField(default=dict, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'indexes': [models.Index(fields=['intent_key'], name='intent_exem_intent_Idx')]},
        ),
        migrations.CreateModel(
            name='AgentRegistry',
            fields=[
                ('agent_id', models.CharField(primary_key=True, max_length=64, serialize=False)),
                ('domain', models.CharField(max_length=64)),
                ('description', models.TextField()),
                ('coverage', models.JSONField(default=dict)),
                ('version', models.CharField(max_length=16, default='v1')),
            ],
        ),
        migrations.CreateModel(
            name='DomainCentroid',
            fields=[
                ('domain', models.CharField(primary_key=True, max_length=64, serialize=False)),
                ('vector', models.JSONField(default=list)),
                ('support_n', models.IntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]

