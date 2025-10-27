from django.urls import path
from . import views

urlpatterns = [
    path('route/', views.route_intent, name='router-route'),
    path('feedback/', views.router_feedback, name='router-feedback'),
    path('registry/agents/', views.list_registered_agents, name='router-agents'),
]

