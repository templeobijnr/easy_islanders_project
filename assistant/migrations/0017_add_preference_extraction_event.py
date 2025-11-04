from django.db import migrations, models
import uuid
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ("assistant", "0016_add_preference_vector_index"),
    ]

    operations = [
        migrations.CreateModel(
            name="PreferenceExtractionEvent",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("thread_id", models.CharField(max_length=255, db_index=True)),
                ("message_id", models.UUIDField(db_index=True)),
                ("utterance", models.TextField()),
                ("extracted_preferences", models.JSONField(default=list)),
                ("confidence_scores", models.JSONField(default=dict)),
                ("extraction_method", models.CharField(max_length=50, choices=[
                    ("llm", "LLM (OpenAI)"),
                    ("rule", "Rule-based"),
                    ("hybrid", "Hybrid (LLM + Rules)"),
                    ("fallback", "Fallback Only"),
                ])),
                ("llm_reasoning", models.TextField(blank=True)),
                ("contradictions_detected", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("processing_time_ms", models.IntegerField(null=True)),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "preference_extraction_events",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["user", "-created_at"], name="pref_ext_user_created_idx"),
                    models.Index(fields=["thread_id", "-created_at"], name="pref_ext_thread_created_idx"),
                    models.Index(fields=["-created_at"], name="pref_ext_created_at_idx"),
                ],
            },
        ),
    ]