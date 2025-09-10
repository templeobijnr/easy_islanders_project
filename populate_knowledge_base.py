#!/usr/bin/env python3
"""
Populate the Easy Islanders Knowledge Base with accurate North Cyprus information
"""
import os
import sys
import django
from datetime import datetime

# Setup Django
sys.path.append('/Users/apple_trnc/Desktop/work/easy_islanders_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
django.setup()

from assistant.models import KnowledgeBase, LinkSource

def create_knowledge_entries():
    """Create comprehensive knowledge base entries for North Cyprus"""
    
    # Cost of Living Information (in GBP)
    cost_of_living = KnowledgeBase.objects.create(
        title="Cost of Living in North Cyprus",
        category="general",
        content_en="""
# Cost of Living in North Cyprus (2024)

## Housing Costs (Monthly)
- **1-bedroom apartment (city center)**: £250-400 GBP
- **1-bedroom apartment (outside center)**: £180-300 GBP
- **3-bedroom apartment (city center)**: £400-650 GBP
- **3-bedroom apartment (outside center)**: £300-500 GBP
- **House rental (3-4 bedrooms)**: £500-800 GBP

## Utilities (Monthly for 85m² apartment)
- **Electricity, heating, cooling, water, garbage**: £50-120 GBP
- **Internet (60 Mbps, unlimited)**: £25-40 GBP
- **Mobile phone (unlimited calls/texts)**: £15-25 GBP

## Groceries (Monthly per person)
- **Basic groceries**: £80-150 GBP
- **Imported goods**: 20-30% more expensive
- **Local produce**: Very affordable

## Dining Out
- **Inexpensive restaurant meal**: £4-8 GBP
- **Mid-range restaurant (3-course for 2)**: £20-40 GBP
- **Fast food meal**: £3-6 GBP
- **Local beer (0.5L)**: £2-4 GBP
- **Coffee (cappuccino)**: £1.50-3 GBP

## Transportation
- **Monthly public transport pass**: £25-40 GBP
- **Gasoline (1 liter)**: £1.00-1.20 GBP
- **Taxi (1km)**: £0.80-1.20 GBP
- **Car rental (daily)**: £25-40 GBP

## Healthcare
- **Private health insurance**: £25-50 GBP/month
- **Doctor visit (private)**: £15-30 GBP
- **Dentist checkup**: £20-40 GBP

## Entertainment & Lifestyle
- **Cinema ticket**: £4-8 GBP
- **Gym membership**: £20-40 GBP/month
- **Swimming pool access**: £3-6 GBP/day
- **Museum entrance**: £2-5 GBP

## Education
- **International school (monthly)**: £200-400 GBP
- **Language courses**: £50-100 GBP/month
- **University tuition (local)**: £1,000-2,000 GBP/year

## Shopping
- **Clothing (mid-range)**: Similar to UK prices
- **Electronics**: 10-20% more expensive than UK
- **Local crafts**: Very affordable

## Key Notes:
- North Cyprus uses Turkish Lira (TL) locally, but GBP is widely accepted
- Imported goods are more expensive due to shipping costs
- Local produce and services are very affordable
- Cost of living is 30-40% lower than UK
- Popular expat areas (Kyrenia, Famagusta) may be 10-20% more expensive
""",
        content_tr="""
# Kuzey Kıbrıs'ta Yaşam Maliyeti (2024)

## Konut Maliyetleri (Aylık)
- **1 yatak odalı daire (şehir merkezi)**: £250-400 GBP
- **1 yatak odalı daire (merkez dışı)**: £180-300 GBP
- **3 yatak odalı daire (şehir merkezi)**: £400-650 GBP
- **3 yatak odalı daire (merkez dışı)**: £300-500 GBP
- **Ev kiralama (3-4 yatak odası)**: £500-800 GBP

## Faturalar (85m² daire için aylık)
- **Elektrik, ısıtma, soğutma, su, çöp**: £50-120 GBP
- **İnternet (60 Mbps, sınırsız)**: £25-40 GBP
- **Cep telefonu (sınırsız arama/mesaj)**: £15-25 GBP

## Market Alışverişi (Kişi başı aylık)
- **Temel gıdalar**: £80-150 GBP
- **İthal ürünler**: %20-30 daha pahalı
- **Yerel ürünler**: Çok uygun fiyatlı

## Dışarıda Yemek
- **Ucuz restoran yemeği**: £4-8 GBP
- **Orta seviye restoran (2 kişi için 3 yemek)**: £20-40 GBP
- **Fast food yemeği**: £3-6 GBP
- **Yerel bira (0.5L)**: £2-4 GBP
- **Kahve (cappuccino)**: £1.50-3 GBP
""",
        keywords="cost of living, expenses, housing, rent, utilities, groceries, dining, transportation, healthcare, entertainment, education, shopping, GBP, pounds, budget, money, prices, affordable, cheap, expensive, lifestyle, monthly costs, annual costs, living expenses, North Cyprus, TRNC, Turkish Republic of Northern Cyprus",
        is_active=True
    )
    
    # Tourism and Attractions
    tourism_info = KnowledgeBase.objects.create(
        title="Tourism and Attractions in North Cyprus",
        category="general",
        content_en="""
# Tourism and Attractions in North Cyprus

## Historical Sites
- **Salamis Ancient City**: Magnificent Greek and Roman ruins near Famagusta, including amphitheater, gymnasium, and baths
- **Kyrenia Castle**: 16th-century castle in Kyrenia harbor with shipwreck museum and panoramic views
- **St. Hilarion Castle**: Fairy-tale castle perched on mountains with rich history and legends
- **Bellapais Abbey**: 13th-century Gothic abbey in Bellapais village with stunning views
- **Othello's Tower**: Venetian tower in Famagusta with Shakespeare connections

## Beaches and Coastal Areas
- **Alagadi Turtle Beach**: Famous turtle nesting site with conservation programs
- **Golden Beach (Karpaz)**: Untouched beauty with kilometers of golden sand
- **Escape Beach**: Popular beach with water sports and beach clubs
- **Acapulco Beach**: Resort beach with excellent facilities and shallow waters
- **Glapsides Beach**: Popular beach near Famagusta with vibrant beach bars

## Natural Attractions
- **Kyrenia Mountains**: Hiking trails with scenic coastal views
- **Karpaz Peninsula**: Remote area with wild donkeys and pristine nature
- **Five Finger Mountains**: Spectacular mountain range with hiking opportunities
- **Güzelyurt (Morphou)**: Citrus-growing region with beautiful countryside

## Cultural Experiences
- **Bellapais Village**: Charming village with traditional Cypriot cuisine
- **Nicosia (Lefkoşa)**: Capital city with rich history and cultural sites
- **Famagusta (Mağusa)**: Historic city with Venetian walls and ghost town
- **Kyrenia (Girne)**: Beautiful harbor town with castle and old town

## Activities and Entertainment
- **Scuba Diving**: Clear waters with rich marine life and shipwrecks
- **Boat Tours**: Coastal exploration with swimming and snorkeling
- **Hiking**: Mountain trails with panoramic views
- **Casinos**: Several casinos in Kyrenia and Famagusta
- **Nightlife**: Vibrant bars, clubs, and restaurants in Kyrenia
- **Shopping**: Local markets, crafts, and modern shopping centers

## Practical Information
- **Best Time to Visit**: April-June and September-November
- **Weather**: Mediterranean climate with hot summers and mild winters
- **Currency**: Turkish Lira (TL) locally, GBP widely accepted
- **Language**: Turkish (official), English widely spoken
- **Transportation**: Car rental recommended, public transport available
- **Accommodation**: Hotels, resorts, apartments, and villas available
""",
        content_tr="""
# Kuzey Kıbrıs'ta Turizm ve Gezilecek Yerler

## Tarihi Yerler
- **Salamis Antik Kenti**: Mağusa yakınında görkemli Yunan ve Roma kalıntıları
- **Girne Kalesi**: 16. yüzyıl kalesi, gemi enkazı müzesi ve panoramik manzara
- **St. Hilarion Kalesi**: Dağlarda peri masalı gibi kale, zengin tarih ve efsaneler
- **Bellapais Manastırı**: 13. yüzyıl Gotik manastır, muhteşem manzara
- **Othello Kulesi**: Mağusa'da Venedik kulesi, Shakespeare bağlantılı

## Plajlar ve Sahil Bölgeleri
- **Alagadi Kaplumbağa Plajı**: Ünlü kaplumbağa yuvalama alanı
- **Altın Plaj (Karpaz)**: Dokunulmamış güzellik, kilometrelerce altın kum
- **Escape Plajı**: Su sporları ve plaj kulüpleri ile popüler plaj
- **Acapulco Plajı**: Mükemmel tesisler ve sığ sular
- **Glapsides Plajı**: Mağusa yakınında canlı plaj barları
""",
        keywords="tourism, attractions, beaches, historical sites, castles, ancient ruins, Salamis, Kyrenia Castle, St. Hilarion, Bellapais, Othello's Tower, Alagadi, Golden Beach, Escape Beach, Acapulco, Glapsides, Kyrenia Mountains, Karpaz, Five Finger Mountains, Güzelyurt, Morphou, Nicosia, Lefkoşa, Famagusta, Mağusa, Kyrenia, Girne, scuba diving, boat tours, hiking, casinos, nightlife, shopping, activities, entertainment, sightseeing, culture, history, nature, Mediterranean, climate, weather, best time to visit, practical information, travel tips",
        is_active=True
    )
    
    # Job Market and Employment
    job_market = KnowledgeBase.objects.create(
        title="Job Market and Employment in North Cyprus",
        category="general",
        content_en="""
# Job Market and Employment in North Cyprus

## Major Employment Sectors

### Education Sector
- **Near East University (NEU)**: Largest university, various academic and administrative positions
- **Eastern Mediterranean University (EMU)**: Quality education and research, international staff
- **Cyprus International University (CIU)**: Growing university with diverse opportunities
- **Private Schools**: International schools requiring English teachers and administrators

### Hospitality and Tourism
- **Merit Hotels**: Luxury hotel chain with high standards
- **Acapulco Resort**: Hotel management, entertainment, F&B, spa services
- **Local Hotels and Resorts**: Various positions in tourism industry
- **Restaurants and Cafes**: Service industry opportunities

### Banking and Finance
- **Turkish Bank Ltd**: Financial services, customer service, specialized roles
- **Creditwest Bank**: Banking solutions across North Cyprus
- **Local Credit Unions**: Community banking opportunities

### Real Estate and Construction
- **Noyanlar Group**: Leading real estate development and construction
- **Local Construction Companies**: Project management, sales, marketing
- **Real Estate Agencies**: Sales, property management, marketing

### IT and Technology
- **Softtech**: Growing tech industry opportunities
- **Freelance IT Work**: Remote work opportunities
- **Digital Marketing**: Online business and marketing roles

### Retail and Consumer Goods
- **Lemar Supermarkets**: Retail positions, supply chain, logistics
- **Local Retail Chains**: Various retail opportunities

## Job Search Resources

### Online Job Portals
- **Kıbrıs İş İlanları**: Local job website
- **Cyprus Jobs**: International job portal
- **Erdemli İş**: Local employment site
- **LinkedIn**: Professional networking and job postings

### Traditional Methods
- **Local Newspapers**: Kıbrıs Postası, Havadis classified sections
- **University Career Offices**: EMU, NEU career services
- **Recruitment Agencies**: Specialized North Cyprus recruiters
- **Direct Applications**: Company websites and speculative applications

## Work Requirements

### Work Permits
- **Required for non-citizens**: Work permit necessary for employment
- **Employer-sponsored**: Usually facilitated by employing company
- **Residency requirements**: May need residency permit first

### Language Requirements
- **English**: Essential for most international positions
- **Turkish**: Official language, significantly improves prospects
- **Other languages**: Arabic, Russian, German useful for specific sectors

### Salary Expectations
- **Education sector**: £800-2,000 GBP/month
- **Hospitality**: £400-800 GBP/month
- **Banking/Finance**: £600-1,500 GBP/month
- **IT/Tech**: £800-2,500 GBP/month
- **Retail**: £300-600 GBP/month

## Networking Opportunities
- **Expat Facebook Groups**: Job postings and networking
- **Professional Associations**: Industry-specific groups
- **Business Forums**: Networking events and seminars
- **University Alumni Networks**: EMU, NEU alumni connections

## Remote Work Opportunities
- **IT and Software Development**: High demand for remote work
- **Digital Marketing**: Online business opportunities
- **Content Creation**: Writing, design, video production
- **Consulting**: Various professional consulting opportunities

## Starting a Business
- **Tourism and Hospitality**: Restaurants, hotels, tour services
- **Real Estate**: Property development, sales, management
- **Education**: Language schools, tutoring services
- **Technology**: Software development, digital services
- **Retail**: Import/export, local retail businesses
""",
        keywords="jobs, employment, work, career, job market, job search, work permit, salary, wages, income, education sector, hospitality, tourism, banking, finance, real estate, construction, IT, technology, retail, supermarkets, universities, NEU, EMU, CIU, Merit Hotels, Acapulco Resort, Turkish Bank, Creditwest Bank, Noyanlar Group, Softtech, Lemar, job portals, Kıbrıs İş İlanları, Cyprus Jobs, Erdemli İş, LinkedIn, newspapers, Kıbrıs Postası, Havadis, recruitment agencies, networking, expat groups, professional associations, remote work, freelancing, starting business, entrepreneurship, work requirements, language requirements, Turkish, English, networking opportunities, business forums, university alumni",
        is_active=True
    )
    
    # Legal Information
    legal_info = KnowledgeBase.objects.create(
        title="Legal Information and Residence Permits",
        category="legal",
        content_en="""
# Legal Information and Residence Permits in North Cyprus

## Residence Permit Types

### Tourist Residence Permit
- **Duration**: 90 days (can be extended)
- **Requirements**: Passport, proof of accommodation, financial means
- **Extension**: Can be extended for additional 90 days
- **Cost**: £50-100 GBP

### Student Residence Permit
- **Duration**: 1 year (renewable)
- **Requirements**: University acceptance letter, financial proof, health insurance
- **Benefits**: Can work part-time, access to student services
- **Cost**: £100-200 GBP

### Work Residence Permit
- **Duration**: 1-2 years (renewable)
- **Requirements**: Job offer, work permit, health insurance, clean criminal record
- **Process**: Employer usually handles application
- **Cost**: £200-400 GBP

### Family Residence Permit
- **Duration**: 1-2 years (renewable)
- **Requirements**: Marriage certificate, spouse's residence permit, financial proof
- **Benefits**: Can work, access to healthcare
- **Cost**: £150-300 GBP

### Investor Residence Permit
- **Duration**: 2-5 years (renewable)
- **Requirements**: Property investment (£50,000+), financial proof
- **Benefits**: Can work, business opportunities
- **Cost**: £500-1,000 GBP

## Work Permit Requirements

### For Employees
- **Job offer**: Valid employment contract
- **Employer sponsorship**: Company must apply on behalf
- **Health insurance**: Mandatory coverage
- **Clean criminal record**: Background check required
- **Valid passport**: Minimum 6 months validity

### For Self-Employed
- **Business plan**: Detailed business proposal
- **Financial proof**: Bank statements, investment capital
- **Professional qualifications**: Relevant certifications
- **Health insurance**: Mandatory coverage

## Property Ownership

### Foreign Ownership Rights
- **Residential property**: Foreigners can own up to 1 property
- **Commercial property**: No restrictions for foreigners
- **Land ownership**: Limited to certain areas
- **Investment threshold**: Minimum £50,000 for residence permit

### Property Purchase Process
- **Title deed search**: Verify ownership and encumbrances
- **Contract signing**: Legal purchase agreement
- **Transfer tax**: 6% of property value
- **Legal fees**: 1-2% of property value
- **Registration**: Property registration with land registry

## Healthcare System

### Public Healthcare
- **Residents**: Access to public hospitals and clinics
- **Emergency care**: Available to all residents
- **Prescription drugs**: Subsidized for residents
- **Cost**: Free for residents with valid permits

### Private Healthcare
- **Health insurance**: Recommended for comprehensive coverage
- **Private hospitals**: Modern facilities in major cities
- **Cost**: £25-50 GBP/month for basic coverage
- **Coverage**: Varies by policy and provider

## Banking and Finance

### Opening Bank Accounts
- **Requirements**: Residence permit, passport, proof of address
- **Currency**: Turkish Lira (TL) and foreign currencies
- **International transfers**: Available with proper documentation
- **Credit cards**: Available for residents with income proof

### Tax Obligations
- **Income tax**: 15-35% depending on income level
- **Property tax**: Annual property tax based on value
- **VAT**: 18% on most goods and services
- **Tax residency**: 183+ days per year

## Driving and Transportation

### Driving License
- **International license**: Valid for 6 months
- **Local license**: Required for long-term residents
- **Requirements**: Valid residence permit, health certificate
- **Cost**: £50-100 GBP

### Vehicle Registration
- **Import duty**: 20-40% of vehicle value
- **Registration fee**: £100-200 GBP
- **Insurance**: Mandatory third-party coverage
- **Annual tax**: Based on engine size and age

## Important Contacts

### Government Offices
- **Immigration Office**: Residence permit applications
- **Tax Office**: Tax registration and payments
- **Land Registry**: Property transactions
- **Ministry of Interior**: General legal matters

### Legal Services
- **Lawyers**: Specialized in immigration and property law
- **Notaries**: Document authentication and certification
- **Translators**: Official document translation services
""",
        keywords="legal, residence permit, work permit, visa, immigration, citizenship, property ownership, foreign ownership, property purchase, title deed, transfer tax, legal fees, healthcare, public healthcare, private healthcare, health insurance, banking, bank account, currency, Turkish Lira, TL, international transfers, tax, income tax, property tax, VAT, tax residency, driving license, vehicle registration, import duty, insurance, government offices, immigration office, tax office, land registry, ministry of interior, lawyers, notaries, translators, legal services, tourist residence, student residence, work residence, family residence, investor residence, business plan, professional qualifications, criminal record, background check, passport validity, employment contract, employer sponsorship, marriage certificate, property investment, investment threshold, title deed search, contract signing, registration, public hospitals, private hospitals, prescription drugs, emergency care, income proof, credit cards, annual tax, third-party coverage, document authentication, official translation",
        is_active=True
    )
    
    print("✅ Knowledge base entries created successfully!")
    print(f"- Cost of Living: {cost_of_living.id}")
    print(f"- Tourism and Attractions: {tourism_info.id}")
    print(f"- Job Market: {job_market.id}")
    print(f"- Legal Information: {legal_info.id}")

if __name__ == "__main__":
    create_knowledge_entries()
