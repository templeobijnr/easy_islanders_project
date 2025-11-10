"""
Marketplace signals for integrating with Zep Graph Memory.

Automatically syncs marketplace listings to the Zep knowledge graph
when they are created, updated, or deleted.
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import GenericListing, SellerProfile

logger = logging.getLogger(__name__)


@receiver(post_save, sender=GenericListing)
def sync_listing_to_zep(sender, instance, created, **kwargs):
    """
    Sync new listings to Zep Graph when created.

    Creates knowledge triplets connecting:
    - Seller -> offers_[category] -> Listing
    - Listing -> located_in -> Location
    - Listing -> priced_at -> Price
    """
    if not created:
        return  # Only sync on creation for now

    try:
        from assistant.memory.graph_manager import get_graph_manager

        graph_mgr = get_graph_manager()
        if not graph_mgr:
            logger.debug("[Marketplace] Zep Graph Manager not available, skipping sync")
            return

        user_id = str(instance.seller.user.id)

        # Create triplet: Seller offers Category
        graph_mgr.add_fact_triplet(
            user_id=user_id,
            source_node_name=instance.seller.business_name,
            target_node_name=instance.title,
            fact=f"offers_{instance.category}",
            confidence=0.9,
        )

        # Create triplet: Listing located in Location (if location exists)
        if instance.location:
            graph_mgr.add_fact_triplet(
                user_id=user_id,
                source_node_name=instance.title,
                target_node_name=instance.location,
                fact="located_in",
                confidence=0.95,
            )

        # Create triplet: Listing has price (if price exists)
        if instance.price:
            price_node = f"{instance.currency} {instance.price}"
            graph_mgr.add_fact_triplet(
                user_id=user_id,
                source_node_name=instance.title,
                target_node_name=price_node,
                fact="priced_at",
                confidence=1.0,
            )

        logger.info(
            f"[Marketplace] Synced listing '{instance.title}' to Zep Graph "
            f"for user {user_id}"
        )

    except ImportError:
        logger.debug("[Marketplace] Zep Graph Manager not installed, skipping sync")
    except Exception as e:
        logger.warning(
            f"[Marketplace] Failed to sync listing {instance.id} to Zep: {e}",
            exc_info=True
        )


@receiver(post_save, sender=SellerProfile)
def sync_seller_to_zep(sender, instance, created, **kwargs):
    """
    Sync new seller profiles to Zep Graph when created.

    Creates knowledge triplets connecting:
    - User -> operates_as -> Business
    - Business -> verified_seller (if verified)
    - Business -> specializes_in -> Categories
    """
    if not created:
        return  # Only sync on creation for now

    try:
        from assistant.memory.graph_manager import get_graph_manager

        graph_mgr = get_graph_manager()
        if not graph_mgr:
            logger.debug("[Marketplace] Zep Graph Manager not available, skipping sync")
            return

        user_id = str(instance.user.id)

        # Create triplet: User operates as Business
        graph_mgr.add_fact_triplet(
            user_id=user_id,
            source_node_name=instance.user.username,
            target_node_name=instance.business_name,
            fact="operates_as",
            confidence=1.0,
        )

        # Create triplet: Business verified status
        if instance.verified:
            graph_mgr.add_fact_triplet(
                user_id=user_id,
                source_node_name=instance.business_name,
                target_node_name="verified_seller",
                fact="has_status",
                confidence=1.0,
            )

        # Create triplets for each category
        for category in instance.categories:
            graph_mgr.add_fact_triplet(
                user_id=user_id,
                source_node_name=instance.business_name,
                target_node_name=category,
                fact="specializes_in",
                confidence=0.9,
            )

        logger.info(
            f"[Marketplace] Synced seller profile '{instance.business_name}' "
            f"to Zep Graph for user {user_id}"
        )

    except ImportError:
        logger.debug("[Marketplace] Zep Graph Manager not installed, skipping sync")
    except Exception as e:
        logger.warning(
            f"[Marketplace] Failed to sync seller {instance.id} to Zep: {e}",
            exc_info=True
        )


@receiver(post_delete, sender=GenericListing)
def remove_listing_from_zep(sender, instance, **kwargs):
    """
    Remove listing from Zep Graph when deleted.

    Note: Zep Graph doesn't support direct deletion of nodes/edges yet,
    so this is a placeholder for future implementation.
    """
    logger.debug(
        f"[Marketplace] Listing '{instance.title}' deleted "
        f"(Zep Graph cleanup not implemented yet)"
    )
