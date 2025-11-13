"""
P2P Consumer API URL Configuration
"""

from django.urls import path
from . import p2p_consumer_views

app_name = 'p2p'

urlpatterns = [
    # My P2P posts (consumer)
    path('my-posts/', p2p_consumer_views.my_p2p_posts, name='my_p2p_posts'),
    path('posts/create/', p2p_consumer_views.create_p2p_post, name='create_p2p_post'),
    path('posts/<str:post_id>/', p2p_consumer_views.p2p_post_detail, name='p2p_post_detail'),
    path('posts/<str:post_id>/update/', p2p_consumer_views.update_p2p_post, name='update_p2p_post'),
    path('posts/<str:post_id>/delete/', p2p_consumer_views.delete_p2p_post, name='delete_p2p_post'),
    
    # Browse P2P posts
    path('browse/', p2p_consumer_views.browse_p2p_posts, name='browse_p2p_posts'),
    
    # Exchange proposals
    path('posts/<str:post_id>/propose-exchange/', p2p_consumer_views.propose_exchange, name='propose_exchange'),
    path('my-proposals/', p2p_consumer_views.my_exchange_proposals, name='my_exchange_proposals'),
    path('proposals/<str:proposal_id>/respond/', p2p_consumer_views.respond_to_proposal, name='respond_to_proposal'),
]
