from django.db import models
from django.utils import timezone
import uuid

# Create your models here.
class UserRequest(models.Model):
  LANGUAGE_CHOICES = [
    ('en','English'),
    ('ru','Russian'),
    ('pl','Polish'),
    ('de','German'),
  ]

  REQUEST_TYPES = [
    ('car_rental','Car Rental'),
    ('accomodation', 'Accomodation'),
    ('activities','Things to Do'),
    ('dining', 'Restaurants & Dining'),
    ('transportation','Transportation'),
    ('legal','Legal Services'),
    ('medical', 'Medical Services'),
    ('shopping','Shopping'),
    ('human_assistance', 'Human Assistance'),
    ('other', 'Other'),
  ]
  STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
  ]

  # User Information
  name = models.CharField(max_length=100, blank=True)
  phone_number = models.CharField(max_length=20)
  email = models.EmailField(blank=True)
  preferred_language = models.CharField(max_length=2, choices= LANGUAGE_CHOICES, default='en')

  # Request Details
  request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
  message = models.TextField()
  original_message = models.TextField()

  # Additional Context from AI
  location_preference = models.CharField(max_length=100, blank=True)
  budget_range = models.CharField(max_length=50, blank=True)
  dates_needed = models.CharField(max_length=100, blank=True)
  number_of_peope = models.IntegerField(default=1)

  # Status and tracking for Admins
  status = models.CharField(max_length=20, choices= STATUS_CHOICES, default='pending')
  priority = models.IntegerField(default=3) #1= High, 2=Medium, 3=Low

  # Timestamps
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  # Admin Notes
  admin_notes = models.TextField(blank=True)
  assigned_to = models.CharField(max_length=100, blank=True)

  class Meta:
    ordering = ['-created_at']

  def __str__(self):
    return f"{self.name or 'Anonymous'} - {self.get_request_type_display()} ({self.phone_number})"
  
class ServiceProvider(models.Model):
  CATEGORY_CHOICES = [
    ('car_rental', 'Car Rental'),
    ('accomodation', 'Accomodation'),
    ('activities', 'Activities & Tours'),
    ('dining', 'Restaurants'),
    ('transportation', 'Transportation'),
    ('legal', 'Legal Services'),
    ('transportaion', 'Transporation'),
    ('medical', 'Medical Services'),
    ('shopping', 'Shopping'),
  ]

  name = models.CharField(max_length=200)
  category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
  contact_phone = models.CharField(max_length=20)
  contact_email = models.EmailField(blank=True)
  location = models.CharField(max_length=100)
  description = models.TextField()
  website = models.URLField(blank=True)
  booking_url = models.URLField(blank=True, help_text='Direct Link for booking/reservations')
  image_url = models.URLField(blank=True)
  rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
  price_range = models.CharField(max_length=50, blank=True, help_text="e.g., '$25-45/day' or '$$$'")
  is_active = models.BooleanField(default=True)
  is_featured = models.BooleanField(default=False)

  # Multilingual fields
  description_ru = models.TextField(blank=True)
  description_pl = models.TextField(blank=True)
  description_de = models.TextField(blank=True)

  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"{self.name} - {self.get_category_display()}"
  
  def get_description(self, language='en'):
    desc = getattr(self, f'description_{language}', None)
    return desc if desc else self.description
  
class ServiceFeature(models.Model):
  service_provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='features')
  feature_name = models.CharField(max_length=100, blank=True)
  # Multilingual fields
  feature_name_ru = models.CharField(max_length=100, blank=True)
  feature_name_pl = models.CharField(max_length=100, blank=True)
  feature_name_de = models.CharField(max_length=100, blank=True)
  
  def get_name(self, language='en'):
    name = getattr(self, f'feature_name_{language}', None)
    return name if name else self.feature_name
  
class Booking(models.Model):
  STATUS_CHOICES = [
    ('pending', 'Pending Confirmation'),
    ('confirmed','Confirmed'),
    ('cancelled', 'Cancelled'),
    ('completed', 'Completed'),
  ]

  service_provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE)
  customer_name = models.CharField(max_length=100)
  customer_phone = models.CharField(max_length=20)
  customer_email = models.EmailField(blank=True)

  booking_date = models.DateField()
  booking_time = models.TimeField(blank=True, null=True)
  number_of_people = models.IntegerField(default=1)
  duration_days = models.IntegerField(default=1)

  special_requests = models.TextField(blank=True)
  total_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

  status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
  booking_reference = models.CharField(max_length=20, unique=True, editable=False)

  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def save(self, *args, **kwargs):
    if not self.booking_reference:
      self.booking_reference = str(uuid.uuid4())[:8].upper()
    super().save(*args, **kwargs)

  def __str__(self):
    return f'Booking {self.booking_reference} - {self.service_provider.name}'
  

class LinkSource(models.Model):
   """ A trusted URL that ths system can ingest for knowledge
   """
   url = models.URLField(unique=True)
   category = models.CharField(max_length=50, help_text='e.g., Residency, Banking, Car Imports')
   language = models.CharField(max_length=2, choices=UserRequest.LANGUAGE_CHOICES, default='en')
   last_ingested = models.DateTimeField(null=True, blank=True)
   is_active = models.BooleanField(default=True)

   def __str__(self):
      return self.url

   
class KnowledgeBase(models.Model):
  CATEGORY_CHOICES = [
    ('general', 'General Information'),
    ('legal', 'Legal Information'),
  ]
  source_link = models.ForeignKey(LinkSource, on_delete=models.SET_NULL, null=True, blank=True)
  title = models.CharField(max_length=200)
  category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
  content_en = models.TextField(help_text='Content in English')
  content_ru = models.TextField(blank=True, help_text='Content in Russian')
  content_pl = models.TextField(blank=True, help_text='Content in Polish')
  content_de = models.TextField(blank=True, help_text='Content in German')
  keywords = models.CharField(max_length=500, help_text='Comma-separaated keywords for AI search')
  is_active = models.BooleanField(default=True)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return self.title
  
  def get_content(self, language='en'):
    content = getattr(self, f'content_{language}', None)
    return content if content else self.content_en
  

