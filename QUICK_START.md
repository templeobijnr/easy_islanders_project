# 🚀 Easy Islanders MVP - Quick Start Guide

## **Get Your MVP Live in 30 Minutes!**

### **Step 1: Set Up Environment (5 minutes)**

```bash
# 1. Copy environment template
cp env.example .env

# 2. Edit .env with your values
nano .env  # or use any text editor
```

**Required values in .env:**
```env
SECRET_KEY=your-secret-key-here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
OPENAI_API_KEY=your_openai_key
```

### **Step 2: Deploy Locally (10 minutes)**

```bash
# Run the deployment script
python deploy.py
```

**Or manually:**
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### **Step 3: Deploy to Production (15 minutes)**

#### **Option A: Railway (Recommended - $5/month)**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables
4. Deploy automatically!

#### **Option B: DigitalOcean App Platform ($12/month)**
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Create new app from GitHub
3. Configure environment variables
4. Deploy!

### **Step 4: Test Your MVP**

1. **Test Chat**: Send a message like "I need a 2 bedroom apartment in Girne"
2. **Test Agent Outreach**: Click "Contact Agent" on a listing
3. **Test WhatsApp**: Send images to your webhook URL
4. **Test Images**: Verify images appear in cards

---

## **🎯 MVP Features Ready**

### ✅ **Core Features**
- [x] AI-powered property search
- [x] Multilingual support (EN, TR, RU, PL)
- [x] WhatsApp agent outreach
- [x] Image processing and display
- [x] Real-time card updates
- [x] Mobile-responsive UI

### ✅ **Security Features**
- [x] Webhook signature validation
- [x] Environment-based configuration
- [x] Rate limiting ready
- [x] CORS protection

### ✅ **Production Ready**
- [x] PostgreSQL database support
- [x] Redis caching ready
- [x] Static file serving
- [x] Error handling
- [x] Logging

---

## **💰 Cost Breakdown**

### **Development (Free)**
- Local development: $0
- SQLite database: $0
- OpenAI API: Pay per use (~$10-50/month)

### **Production (Railway)**
- App hosting: $5/month
- PostgreSQL: $5/month
- Redis: $5/month
- **Total: $15/month**

### **Production (DigitalOcean)**
- App Platform: $12/month
- Managed PostgreSQL: $15/month
- Managed Redis: $15/month
- **Total: $42/month**

---

## **🚨 Common Issues & Solutions**

### **Issue: "Module not found"**
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

### **Issue: "Database error"**
```bash
# Solution: Run migrations
python manage.py migrate
```

### **Issue: "Twilio webhook not working"**
```bash
# Solution: Check webhook URL in Twilio console
# Should be: https://yourdomain.com/api/webhooks/twilio/
```

### **Issue: "Images not displaying"**
```bash
# Solution: Check media settings
# Ensure MEDIA_URL and MEDIA_ROOT are correct
```

---

## **📞 Support**

### **If you get stuck:**
1. Check the logs: `python manage.py runserver --verbosity=2`
2. Check Django admin: `http://localhost:8000/admin/`
3. Check API endpoints: `http://localhost:8000/api/`

### **For production issues:**
1. Check Railway/DigitalOcean logs
2. Check environment variables
3. Check database connectivity

---

## **🎉 Success!**

Once deployed, your MVP will have:
- ✅ Professional AI assistant
- ✅ WhatsApp integration
- ✅ Image processing
- ✅ Mobile-responsive UI
- ✅ Production-ready security

**Ready to launch your North Cyprus property platform! 🏝️**

---

**Next Steps After MVP:**
1. Get user feedback
2. Add more features
3. Scale infrastructure
4. Raise funding
5. Expand to other services



