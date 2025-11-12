from django.contrib import admin
from .models import IntentExemplar, AgentRegistry, DomainCentroid, RouterEvent, CalibrationParams


@admin.register(IntentExemplar)
class IntentExemplarAdmin(admin.ModelAdmin):
    list_display = ("exemplar_id", "intent_key", "locale", "geo_region", "created_at")
    search_fields = ("intent_key", "text", "locale", "geo_region")
    readonly_fields = ("exemplar_id", "created_at")


@admin.register(AgentRegistry)
class AgentRegistryAdmin(admin.ModelAdmin):
    list_display = ("agent_id", "domain", "version")
    search_fields = ("agent_id", "domain", "description")


@admin.register(DomainCentroid)
class DomainCentroidAdmin(admin.ModelAdmin):
    list_display = ("domain", "support_n", "updated_at")
    search_fields = ("domain",)
    readonly_fields = ("updated_at",)


@admin.register(RouterEvent)
class RouterEventAdmin(admin.ModelAdmin):
    list_display = ("event_id", "created_at", "domain_pred", "domain_conf", "action", "latency_ms")
    search_fields = ("thread_id", "utterance", "domain_pred", "in_domain_intent")
    readonly_fields = ("event_id", "created_at")
    date_hierarchy = "created_at"


@admin.register(CalibrationParams)
class CalibrationParamsAdmin(admin.ModelAdmin):
    list_display = ("domain", "method", "version", "ece", "support_n", "evaluated_on")
    list_filter = ("method", "version", "evaluated_on")
    search_fields = ("domain",)
    readonly_fields = ("evaluated_on",)
    
    fieldsets = (
        ("Calibration", {
            "fields": ("domain", "method", "version")
        }),
        ("Parameters", {
            "fields": ("params", "ece", "support_n"),
            "classes": ("collapse",)
        }),
        ("Metadata", {
            "fields": ("evaluated_on",),
            "classes": ("collapse",)
        })
    )

