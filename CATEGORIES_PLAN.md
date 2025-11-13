# Category & Subcategory System - Comprehensive Plan

## Overview
A robust, extensible categorization system supporting diverse marketplaces: real estate, vehicles, products, events, activities, services, and appointments.

---

## 1. REAL ESTATE
**is_bookable:** Yes (rentals, short-term stays)  
**icon:** `home` | **color:** `#FF6B6B`

### Subcategories & Dynamic Fields

| Subcategory | Type | Key Fields | Notes |
|---|---|---|---|
| **House** | Sale/Rent | bedrooms, bathrooms, sqft, furnished, garden, garage, year_built, heating_type, property_condition | Full detached or semi-detached |
| **Apartment** | Sale/Rent | bedrooms, bathrooms, sqft, furnished, floor_number, building_amenities, pet_friendly, has_elevator | High-rise or low-rise |
| **Villa** | Sale/Rent | bedrooms, bathrooms, sqft, furnished, pool, garden_size, security_features, year_built, land_area | Luxury property |
| **Bungalow** | Sale/Rent | bedrooms, bathrooms, sqft, furnished, garden, single_story, renovation_status | Single-level living |
| **Townhouse** | Sale/Rent | bedrooms, bathrooms, sqft, furnished, parking, community_amenities | Row-style homes |
| **Penthouse** | Sale/Rent | bedrooms, bathrooms, sqft, furnished, terrace, views, luxury_amenities | Top-floor luxury |
| **Hotel/Resort** | Booking | rooms_count, star_rating, amenities, check_in_policy, cancellation_policy, photos_url | Hospitality focus |
| **Office/Commercial** | Sale/Rent | sqft, parking_spaces, meeting_rooms, furnished, lease_term, zoning_type | Business use |
| **Land/Plot** | Sale | area_sqft, zoning, utilities_available, road_access, documentation_status | Raw/developed |

**Common Listing Fields:**
- `transaction_type`: "sale" | "rent"
- `rental_period`: "daily" | "weekly" | "monthly" | "yearly" (if rent)
- `price_per_unit`: price for sale; price_per_month/day if rent
- `location`, `latitude`, `longitude`
- `photos`: array of ListingImage references

---

## 2. VEHICLES
**is_bookable:** Yes (rentals, ride-sharing)  
**icon:** `car` | **color:** `#4ECDC4`

### Subcategories & Dynamic Fields

| Subcategory | Key Fields | Availability Types |
|---|---|---|
| **Car** | make, model, year, mileage, transmission, fuel_type, color, num_doors, trunk_space, condition | Sale / Short-term Rental / Long-term Rental |
| **Motorcycle/Scooter** | make, model, year, mileage, engine_cc, fuel_type, color, condition | Sale / Rental |
| **Truck/Commercial** | make, model, year, mileage, payload_capacity, cargo_dimensions, condition | Sale / Rental |
| **Bus/Coach** | make, model, year, seating_capacity, mileage, fuel_type, route_capability | Sale / Rental / Charter |
| **Bicycle** | type, brand, year, condition, frame_size, gear_count | Sale / Rental |
| **Electric Scooter** | brand, model, range_km, max_speed, battery_condition | Sale / Rental |
| **Boat/Yacht** | length_ft, engine_type, year, condition, capacity, features | Sale / Charter / Rental |
| **RV/Campervan** | sleeping_capacity, year, mileage, amenities, kitchen_equipped, bathroom | Sale / Rental |

**Dynamic Field Template:**
- `transaction_type`: "sale" | "rental"
- `rental_period`: "daily" | "weekly" | "monthly" (if rental)
- `insurance_included`: boolean (for rentals)
- `mileage`: number
- `fuel_status`: "empty" | "half" | "full"
- `service_history`: text/array
- `document_status`: "complete" | "pending"

---

## 3. ELECTRONICS
**is_bookable:** No (some could be rental, but primarily sales)  
**icon:** `zap` | **color:** `#95E1D3`

### Subcategories & Dynamic Fields

| Subcategory | Key Fields |
|---|---|
| **Mobile Phones** | brand, model, storage_gb, ram_gb, color, condition, unlocked, imei_verified |
| **Computers/Laptops** | brand, model, processor, ram_gb, storage_gb, screen_size, graphics, condition |
| **Tablets** | brand, model, storage_gb, screen_size, wifi_only_or_cellular, condition |
| **Gaming Consoles** | model (PS5, Xbox Series X, Nintendo Switch, etc.), condition, included_games, accessories |
| **Cameras** | type (DSLR, mirrorless, compact, action cam), brand, model, megapixels, lens_included |
| **Audio Equipment** | type (headphones, speakers, microphones), brand, model, wireless_or_wired, condition |
| **TVs** | brand, model, screen_size_inches, resolution (4K, Full HD), smart_tv, condition |
| **Printers/Scanners** | brand, model, type, color_capable, page_yield_remaining |
| **Accessories** | type (chargers, cables, cases, adapters), brand, compatibility, quantity |

**Dynamic Field Template:**
- `condition`: "new" | "like_new" | "used" | "refurbished"
- `warranty_months`: number (0 if expired/none)
- `original_box`: boolean
- `accessories_included`: array
- `testing_status`: "tested_working" | "untested"

---

## 4. HOUSEHOLD ITEMS
**is_bookable:** No (mostly sales)  
**icon:** `home` | **color:** `#FFD93D`

### Subcategories & Dynamic Fields

| Subcategory | Key Fields |
|---|---|
| **Kitchen Appliances** | type, brand, model, capacity, color, condition, energy_rating, age |
| **Refrigerators** | type (French door, side-by-side, top/bottom freezer), capacity_liters, color, ice_maker, condition |
| **Washing Machines** | type (front-load, top-load), capacity_kg, color, smart_features, condition |
| **Furniture - Bedroom** | type (bed frame, wardrobe, dresser), material, size, color, condition, age |
| **Furniture - Living Room** | type (sofa, chairs, tables, shelves), material, seating_capacity, color, condition |
| **Dining Sets** | pieces_included, material (wood, glass, metal), seating_capacity, condition, expandable |
| **Bedding** | type (mattress, pillow, duvet), size, material, condition, firmness_level |
| **Lighting** | type (ceiling, floor, table, wall), material, wattage, smart_capable, color_temp |
| **Decor & Accessories** | material, style, dimensions, condition, quantity |

**Dynamic Field Template:**
- `condition`: "new" | "like_new" | "used" | "damaged_but_functional"`
- `material`: string
- `dimensions`: {height_cm, width_cm, depth_cm}
- `color`: string
- `age_years`: number
- `delivery_available`: boolean

---

## 5. PRODUCTS (General/Misc)
**is_bookable:** No  
**icon:** `shopping-bag` | **color:** `#A8E6CF`

### Subcategories

- **Books** (genre, author, condition, edition)
- **Clothing & Fashion** (size, brand, material, color, style, condition)
- **Shoes & Footwear** (size, brand, type, material, color, condition)
- **Sports Equipment** (type, brand, condition, usage, size/fit)
- **Toys & Games** (type, age_range, completeness, condition)
- **Beauty & Personal Care** (type, brand, expiration, quantity)
- **Pet Supplies** (type, pet_type, size, quantity)
- **Tools & Hardware** (type, brand, condition, completeness)

---

## 6. EVENTS
**is_bookable:** Yes (attendees book spots or reserve tickets)  
**icon:** `calendar` | **color:** `#F38181`

### Subcategories & Dynamic Fields

| Subcategory | Key Fields | Example Activities |
|---|---|---|
| **Conference/Workshop** | date, time, duration_hours, location, capacity, registration_link | Tech talks, business seminars, skill training |
| **Party/Social Gathering** | date, time, duration_hours, location, capacity, dress_code, age_restriction | Birthday, wedding, reunion, themed party |
| **Concert/Music Event** | date, time, duration_hours, venue, artists, capacity, ticket_tiers | Live music, DJ night, festival |
| **Sports Event** | date, time, duration_hours, venue, sport_type, level, capacity | Marathon, tournament, match |
| **Art/Creative Workshop** | date, time, duration_hours, location, capacity, skill_level_required, materials_included | Painting, pottery, photography, dance |
| **Fitness Class** | date, time, duration_mins, location, capacity, instructor, level, equipment_needed | Yoga, pilates, CrossFit, zumba |
| **Wellness/Spa Day** | date, time, duration_hours, services_offered, capacity, pamper_packages | Massage, facial, meditation, sauna |
| **Educational Course** | start_date, end_date, duration_weeks, format (online/in_person/hybrid), capacity, instructor, syllabus_link | Languages, coding, certifications |
| **Networking Event** | date, time, location, target_industry, capacity, agenda_link | Meetup, expo, panel discussion |
| **Festival/Fair** | date, duration_days, location, capacity, vendor_count, activities_list | Food festival, craft fair, cultural celebration |

**Dynamic Field Template:**
- `event_date`: date
- `event_time`: time
- `duration_minutes`: number
- `location`: string
- `online_meeting_link`: URL (if virtual)
- `capacity`: number
- `current_registrations`: number (auto-incremented)
- `ticket_price`: decimal (free or paid)
- `registration_deadline`: datetime
- `cancellation_policy`: text
- `minimum_age`: number (optional)
- `prerequisites`: text (optional)
- `organizer_contact`: email/phone

---

## 7. SERVICES
**is_bookable:** Yes (clients book service slots/appointments)  
**icon:** `briefcase` | **color:** `#AA96DA`

### Subcategories & Dynamic Fields

| Subcategory | Key Fields | Pricing Model |
|---|---|---|
| **Home Services** | type (cleaning, repair, installation), availability_hours, service_area, guaranteed_response_time | Per hour / Flat rate / Per job |
| **Plumbing** | emergency_available, types_of_work, warranty_months, service_area | Per hour / Per job |
| **Electrical** | residential_or_commercial, license_number, insurance_verified, service_area | Per hour / Per job |
| **Carpentry/Handyman** | skills_list, materials_included_or_extra, service_area, portfolio_link | Per hour / Per job |
| **Cleaning Services** | type (house, office, deep clean), frequency_options, eco_friendly, staff_count | Per visit / Monthly subscription |
| **Painting & Decoration** | interior_or_exterior, paint_type, color_consultation, service_area | Per sqft / Per job |
| **HVAC Services** | equipment_brands_serviced, maintenance_plans_available, emergency_available | Per visit / Maintenance plan |
| **Pest Control** | pest_types, eco_friendly, warranty_months, service_area | Per visit / Contract basis |
| **Car Wash & Detailing** | services_offered (wash, polish, interior detail), vehicle_types, location_or_mobile, turnaround_time | Tiered pricing |
| **Auto Repair** | types_of_repair, brands_serviced, warranty_months, diagnostic_fee, mobile_or_shop | Per hour / Per job |
| **Legal Services** | specialties (corporate, family, real estate), hourly_rate, consultation_available, bar_license_verified | Hourly / Flat fee / Contingency |
| **Accounting/Tax Services** | services_offered, business_size_specialty, response_time, years_experience | Hourly / Monthly retainer / Per project |
| **IT Support** | types_of_support (helpdesk, network, cloud), response_time_sla, remote_or_onsite, managed_services | Hourly / Monthly retainer / Per incident |
| **Tutoring/Education** | subject, level, format (in_person, online, hybrid), student_count, experience_level | Per hour / Per package |
| **Photography Services** | type (portrait, event, real estate, product), package_options, turnaround_time, editing_included, location_or_studio | Per hour / Per package / Per day |
| **Videography** | video_type (wedding, corporate, promotional), duration_included, editing_included, turnaround_time | Per hour / Per day / Per project |
| **Web Design/Development** | specialties (website, app, e-commerce), technologies, timeline_estimate, maintenance_included | Per project / Hourly / Monthly retainer |
| **Graphic Design** | design_types (logo, branding, marketing), revisions_included, turnaround_time | Per project / Hourly |
| **Translation Services** | languages, specialization (technical, medical, legal), turnaround_time, certification_available | Per word / Per hour |
| **Fitness Coaching** | specialties (strength, endurance, nutrition), certification, online_or_in_person, duration_programs | Per session / Per month / Per package |
| **Nutritionist/Dietitian** | specializations, format (online, in-person), meal_plan_included, follow_up_support | Per consultation / Per package |
| **Mental Health Counseling** | specializations, format (online, in-person, phone), license_verified, crisis_support_available | Per session / Per package |
| **Beauty Services** | type (haircut, styling, nails, makeup, waxing), experience_level, duration, color_services_available | Per service / Package deals |
| **Massage Therapy** | massage_types, duration_options, location (mobile, studio, client's home), certification_level | Per session / Package deals |
| **Veterinary Services** | species_treated, services (checkup, surgery, grooming), emergency_available, facility_type | Per visit / Per procedure |
| **Event Planning** | event_types_handled, team_size, budget_range, portfolio_link, full_service_or_partial | Per event / Hourly / Percentage of budget |
| **Interior Design** | specializations, design_styles, project_size_range, 3d_rendering_available, installation_coordination | Per project / Hourly / Monthly retainer |
| **Landscaping/Gardening** | services_offered, design_consultation, maintenance_frequency, seasonal_specialty | Per project / Monthly contract |

**Dynamic Field Template:**
- `hourly_rate`: decimal (if applicable)
- `flat_rate`: decimal (if applicable)
- `service_area`: string or array of locations
- `availability_hours`: JSON {Mon-Sun: [start, end]}
- `response_time_hours`: number
- `certification_license`: text (if regulated)
- `years_experience`: number
- `languages_spoken`: array
- `travel_included`: boolean
- `minimum_booking_hours`: number (if hourly)
- `cancellation_policy`: text
- `emergency_surcharge_percent`: number (optional)

---

## 8. ACTIVITIES
**is_bookable:** Yes (time-slot or enrollment based)  
**icon:** `activity` | **color:** `#F6A192`

### Subcategories & Dynamic Fields

| Subcategory | Type | Key Fields | Booking Model |
|---|---|---|---|
| **Fitness & Wellness** | Class/Session | intensity_level, duration_mins, equipment_needed, trainer_level, capacity, music_type | Per session / Monthly membership |
| **Dance Classes** | Class/Session | dance_style (ballet, hip-hop, salsa, contemporary), level, music_provided, dance_floor_available, capacity | Per session / Per package |
| **Yoga & Meditation** | Class/Session | yoga_style, meditation_type, level, props_provided, music_included, outdoor_or_indoor, capacity | Per session / Per month |
| **Swimming** | Class/Session | stroke_type (freestyle, backstroke, butterfly, breaststroke), level, water_temp, pool_size, instructor_certification, capacity | Per session / Per package |
| **Martial Arts** | Class/Session | discipline (karate, taekwondo, judo, kung fu), belt_level, age_group, competition_prep, contact_level, capacity | Per session / Monthly / Per belt test |
| **Sports Training** | Class/Session | sport_type, position_specialty, age_group, skill_level, coach_certification, capacity, outdoor_or_indoor | Per session / Per package |
| **Art & Crafts** | Workshop/Class | art_form (painting, drawing, sculpting, pottery), materials_included, finished_product_kept, level, class_duration, capacity | Per workshop / Per course |
| **Music Lessons** | Class/Session | instrument, music_level, lesson_duration_mins, one_on_one_or_group, lesson_materials_included, instructor_experience | Per lesson / Per month / Per course |
| **Language Classes** | Course/Class | language, level, class_duration_weeks, online_or_in_person, homework_included, certification_available, capacity | Per course / Per month |
| **Cooking Classes** | Workshop/Class | cuisine_type, difficulty_level, recipe_count, ingredients_provided, takeaway_packaging, class_size, dietary_accommodation | Per class / Per course |
| **Photography Workshop** | Workshop | technique_focus, equipment_needed, outdoor_or_studio, portfolio_review_included, photos_processing_tutorial, capacity | Per workshop |
| **Sports Recreation** | Activity | sport_type, intensity, age_group, equipment_provided, group_size, duration, experience_required | Per session / Per membership |
| **Outdoor Adventures** | Activity | activity_type (hiking, camping, rock climbing, kayaking), difficulty_level, guide_provided, equipment_included, group_size, duration_hours | Per outing / Per package |
| **Gaming & Esports** | Activity | game_type, skill_level, tournament_or_casual, equipment_provided, coached_or_uncoached, capacity | Per session / Per tournament |
| **Hobby Clubs** | Membership/Activity | hobby_type (reading, board games, model building, collecting), meeting_frequency, membership_included, capacity | Per meeting / Monthly membership |
| **Personal Training** | Session | fitness_goal, training_style, duration_mins, one_on_one_or_small_group, nutrition_coaching_included, trainer_experience | Per session / Per package / Per month |
| **Pilates** | Class/Session | pilates_style (mat, reformer, clinical), level, instructor_certification, equipment_available, capacity, class_duration | Per session / Per package |
| **CrossFit** | Class/Session | workout_type, scaling_options_available, coach_certification, rig_equipped, capacity, intensity_level | Per class / Per month |
| **Boxing/Kickboxing** | Class/Session | style, level, equipment_provided, sparring_available, coach_certification, capacity | Per class / Per package |
| **Corporate Wellness** | Activity | activity_type, team_size, duration, stress_relief_focused, health_benefit_measured, facilitator_certified | Per session / Per program |
| **Spa & Relaxation Activities** | Session | activity_type (meditation, aromatherapy, sound bath, float therapy), duration, ambience_setup, guided_or_unguided, capacity | Per session / Per package |
| **Workshop/Seminar** | Event/Workshop | topic, instructor_expertise, duration_hours, certificate_of_completion, networking_included, capacity | Per workshop |
| **Kids Activities** | Class/Activity | activity_type, age_group, safety_measures, parental_supervision_required, educational_component, capacity | Per session / Per term |
| **Team Building** | Activity | activity_type, group_size_capacity, duration, competitive_or_collaborative, instructor_provided, indoor_or_outdoor | Per event / Per package |

**Dynamic Field Template:**
- `activity_type`: string
- `skill_level`: "beginner" | "intermediate" | "advanced" | "all_levels"
- `class_duration_minutes`: number
- `schedule_type`: "single_session" | "recurring" | "course"
- `start_date`: date (for courses/recurring)
- `end_date`: date (for courses)
- `recurring_days`: array (Mon-Sun) (if recurring)
- `start_time`: time
- `end_time`: time
- `location`: string
- `online_or_in_person`: "in_person" | "online" | "hybrid"
- `meeting_link`: URL (if online/hybrid)
- `capacity`: number
- `current_registrations`: number (auto-incremented)
- `price_per_session`: decimal
- `equipment_provided`: boolean
- `materials_included`: boolean
- `instructor_name`: string
- `instructor_certifications`: array
- `age_requirement_min`: number (optional)
- `age_requirement_max`: number (optional)
- `physical_requirement_level`: "low" | "moderate" | "high"
- `cancellation_policy`: text
- `booking_deadline_hours_before`: number

---

## 9. APPOINTMENTS
**is_bookable:** Yes (time-slot based bookings)  
**icon:** `calendar` | **color:** `#FECDC3`

### Subcategories & Dynamic Fields

| Subcategory | Booking Type | Duration | Key Fields |
|---|---|---|---|
| **Hair Services** | Appointment (slot) | 30-120 mins | hairstyle_type, colorist_available, blow_dry_included, expertise_level |
| **Dental** | Appointment (slot) | 30-60 mins | service_type (cleaning, filling, extraction, orthodontics), dentist_specialty, patient_comfort_options |
| **Medical Checkup** | Appointment (slot) | 15-30 mins | specialty (general, cardiology, dermatology, etc.), doctor_license, patient_reviews |
| **Haircut/Beard Trim** | Appointment (slot) | 30-60 mins | barber_expertise, beard_style_specialty, straight_razor_available |
| **Manicure/Pedicure** | Appointment (slot) | 30-60 mins | service_type (gel, acrylic, polish), artist_experience, design_options_available |
| **Massage** | Appointment (slot) | 30-120 mins | massage_type (Swedish, deep tissue, hot stone, Thai), therapist_certification, oils_available |
| **Spa/Facial** | Appointment (slot) | 30-90 mins | facial_type, skin_type_specialization, products_brand, aromatherapy_available |
| **Eye Exam/Optometry** | Appointment (slot) | 20-45 mins | optometrist_license, contact_lens_fitting, glasses_available |
| **Veterinary Checkup** | Appointment (slot) | 15-30 mins | animal_type, vet_license, emergency_care_available, vaccination_services |
| **Therapy/Counseling** | Appointment (slot) | 45-60 mins | therapist_license, specialization, telehealth_available, insurance_accepted |
| **Physical Therapy** | Appointment (slot) | 30-60 mins | pt_license, condition_specialization, home_exercise_guidance_included |
| **Tattoo Appointment** | Appointment (slot) | 60-240 mins | artist_specialty, design_consultation, sterilization_certified, portfolio_link |
| **Piercing Appointment** | Appointment (slot) | 10-30 mins | piercer_certification, jewelry_provided, aftercare_instructions |
| **Fitness Consultation** | Appointment (slot) | 30-60 mins | trainer_certification, specialty (strength, cardio, flexibility), diet_coaching_included |
| **Car Service Appointment** | Appointment (slot) | 30-480 mins (varies) | mechanic_certification, service_type (oil change, repair, inspection), warranty_on_work |

**Dynamic Field Template:**
- `available_slots`: array of {date, start_time, end_time, capacity}
- `slot_duration_minutes`: number
- `professional_name`: string
- `qualifications`: array (license, certification, experience)
- `cancellation_policy`: text (how far in advance)
- `reminder_option`: boolean (SMS/email reminder)
- `deposit_required`: decimal (optional)
- `deposit_refundable`: boolean
- `max_advance_booking_days`: number
- `telehealth_available`: boolean
- `client_intake_form_required`: boolean
- `notes_for_client`: text

---

## Implementation Strategy

### Phase 1: Seed Data & Migration
1. Create Django management command: `python manage.py seed_categories.py`
2. Insert all categories with schemas and metadata
3. Insert subcategories for each category
4. Validate schemas are valid JSON

### Phase 2: Admin Interface
1. Customize `CategoryAdmin` & `SubCategoryAdmin` in admin.py
2. Add schema builder UI (JSON editor or form builder) for admins
3. Add bulk import tool for categories

### Phase 3: API Endpoints
1. `GET /api/categories/` - List all categories with their schemas
2. `GET /api/categories/{id}/subcategories/` - Get subcategories for a category
3. `POST /api/listings/` - Accept category + subcategory + dynamic_fields
4. Frontend validates dynamic fields against category schema

### Phase 4: Frontend Integration
1. Dynamic form renderer based on category schema
2. Conditional field display (e.g., rental_period only shows if is_bookable=True)
3. Validation based on field types and rules in schema

### Phase 5: Search & Filtering
1. Full-text search across title + description
2. Category/subcategory filtering
3. Dynamic field filtering (price range, condition, amenities, etc.)

---

## Schema Definition Format (JSON Example)

```json
{
  "category": "Real Estate",
  "fields": [
    {
      "name": "transaction_type",
      "type": "select",
      "label": "Type",
      "choices": ["sale", "rent"],
      "required": true
    },
    {
      "name": "bedrooms",
      "type": "number",
      "label": "Bedrooms",
      "min": 1,
      "max": 20,
      "required": true
    },
    {
      "name": "furnished",
      "type": "boolean",
      "label": "Furnished",
      "required": false
    },
    {
      "name": "rental_period",
      "type": "select",
      "label": "Rental Period",
      "choices": ["daily", "weekly", "monthly", "yearly"],
      "required_if": "transaction_type==rent"
    }
  ]
}
```

---

## Database Optimization Notes

1. **Indexes**: Category lookup is frequent → ensure indexed on `slug`, `is_active`
2. **SubCategory**: UNIQUE constraint on (category, slug) prevents duplicates
3. **Listing.dynamic_fields**: JSON field allows flexible data but keep searchable fields as separate columns (e.g., price, location)
4. **Full-Text Search**: Consider PostgreSQL GiST/GIN indexes on title + description if needed

---

## Next Steps

1. **Confirm** this structure meets your vision
2. Create `seed_categories.py` management command
3. Build out API serializers and views
4. Create test fixtures for each category
5. Build frontend dynamic form renderer
6. Implement category-specific booking logic
