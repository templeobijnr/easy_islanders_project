from django.core.management.base import BaseCommand
from django.db import connection
from assistant.models import Listing, Conversation, Message, KnowledgeBase, ServiceProvider


class Command(BaseCommand):
    help = 'Check database counts for all models'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Database Counts ==='))
        
        # Count Listings
        total_listings = Listing.objects.count()
        active_listings = Listing.objects.filter(is_active=True).count()
        
        self.stdout.write(f'Listings: {total_listings} total, {active_listings} active')
        
        # Count Conversations and Messages
        total_conversations = Conversation.objects.count()
        total_messages = Message.objects.count()
        
        self.stdout.write(f'Conversations: {total_conversations}')
        self.stdout.write(f'Messages: {total_messages}')
        
        # Count Knowledge Base and Service Providers
        total_kb = KnowledgeBase.objects.count()
        active_kb = KnowledgeBase.objects.filter(is_active=True).count()
        
        total_services = ServiceProvider.objects.count()
        active_services = ServiceProvider.objects.filter(is_active=True).count()
        
        self.stdout.write(f'Knowledge Base: {total_kb} total, {active_kb} active')
        self.stdout.write(f'Service Providers: {total_services} total, {active_services} active')
        
        # Show some sample listing data
        if active_listings > 0:
            self.stdout.write('\n=== Sample Active Listings ===')
            sample_listings = Listing.objects.filter(is_active=True)[:5]
            
            for listing in sample_listings:
                self.stdout.write(f'ID: {listing.id}, Type: {listing.listing_type}, Location: {listing.location}, Price: {listing.price} {listing.currency}')
        
        # Show database table info
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name, table_rows 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                AND table_name LIKE 'assistant_%'
                ORDER BY table_name
            """)
            
            tables = cursor.fetchall()
            if tables:
                self.stdout.write('\n=== Database Tables ===')
                for table_name, row_count in tables:
                    self.stdout.write(f'{table_name}: {row_count} rows')
        
        self.stdout.write(self.style.SUCCESS('\n=== End of Report ==='))
