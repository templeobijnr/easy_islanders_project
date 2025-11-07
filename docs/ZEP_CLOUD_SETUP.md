# Zep Cloud Setup Guide

## Overview

This application uses **Zep Cloud** for long-term memory storage. Zep provides semantic memory retrieval and context management for AI agents.

## Prerequisites

1. **Zep Cloud Account**: Sign up at https://cloud.getzep.com
2. **API Key**: Generate an API key from your Zep Cloud dashboard

---

## Setup Instructions

### Step 1: Get Your Zep Cloud API Key

1. Go to https://cloud.getzep.com
2. Sign up or log in
3. Navigate to **Settings** → **API Keys**
4. Click **Create New API Key**
5. Copy the generated API key (it starts with `z_`)

**Important**: Save this key securely - you won't be able to see it again!

---

### Step 2: Update `.env.docker`

Edit `.env.docker` in the project root and replace the placeholder with your actual API key:

**Before**:
```bash
ZEP_API_KEY=REPLACE_WITH_YOUR_ZEP_CLOUD_API_KEY
```

**After**:
```bash
ZEP_API_KEY=z_abc123yourActualKeyHere
```

**Full Zep Configuration** (should look like this):
```bash
# Zep Memory Service (Zep Cloud)
# NOTE: Replace ZEP_API_KEY with your actual Zep Cloud API key from https://cloud.getzep.com
ZEP_ENABLED=true
ZEP_BASE_URL=https://api.getzep.com
ZEP_URL=https://api.getzep.com
ZEP_API_KEY=z_your_actual_key_here  # ← Replace this!
ZEP_TIMEOUT_MS=5000
ZEP_API_VERSION=v1
FLAG_ZEP_WRITE=true
FLAG_ZEP_READ=true
```

---

### Step 3: Restart Docker Containers

After updating the API key, rebuild and restart:

```bash
# Stop all containers
docker compose down

# Rebuild (optional, but recommended after env changes)
docker compose build

# Start all services
docker compose up -d

# Verify Celery workers started successfully
docker compose ps
```

---

## Verification

### Check Logs for Successful Connection

```bash
# Watch Celery chat worker logs
docker logs -f easy_islanders_celery_chat

# Look for these success messages:
✅ "[ZEP] Created session {thread_id}"
✅ "[ZEP] Successfully added memory after creating session"
✅ "Initialising Zep client (timeout=5000ms)"
```

### Check for Errors

If you see these errors, your API key is **NOT** set correctly:

```bash
❌ "[ZEP] create_session failed 404: 404 page not found"
❌ "[ZEP] Failed to create session {thread_id}, cannot add memory"
❌ "zep_session_creation_failed"
```

**Solution**: Double-check your API key in `.env.docker` and restart containers.

---

## Test Zep Integration

### Send a Test Message

```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "message": "I need a 2 bedroom apartment in Kyrenia",
    "thread_id": "test-zep-123"
  }'
```

### Check Zep Cloud Dashboard

1. Go to https://cloud.getzep.com
2. Navigate to **Sessions**
3. You should see a session with ID `test-zep-123`
4. Click on it to view the stored conversation

---

## Troubleshooting

### Error: "404 page not found"

**Cause**: Invalid or missing API key

**Fix**:
1. Verify API key starts with `z_`
2. Check for extra spaces or quotes in `.env.docker`
3. Restart containers: `docker compose restart celery_chat celery_default celery_background`

### Error: "401 Unauthorized"

**Cause**: API key is incorrect or expired

**Fix**:
1. Generate a new API key from Zep Cloud dashboard
2. Update `.env.docker`
3. Restart containers

### Error: "zep_http_status_unexpected"

**Cause**: Network issues or Zep Cloud service problems

**Fix**:
1. Check Zep Cloud status: https://status.getzep.com
2. Verify internet connectivity from Docker containers
3. Check firewall rules

---

## Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `ZEP_ENABLED` | `true` | Enable Zep integration |
| `ZEP_BASE_URL` | `https://api.getzep.com` | Zep Cloud API endpoint |
| `ZEP_URL` | `https://api.getzep.com` | Alias for base URL |
| `ZEP_API_KEY` | `z_your_key` | **Your Zep Cloud API key** |
| `ZEP_TIMEOUT_MS` | `5000` | Request timeout (5 seconds) |
| `ZEP_API_VERSION` | `v1` | API version |
| `FLAG_ZEP_WRITE` | `true` | Enable memory writes |
| `FLAG_ZEP_READ` | `true` | Enable memory reads |

---

## FAQ

### Q: Can I use local Zep instead of Zep Cloud?

**A**: Yes! Update `.env.docker`:

```bash
ZEP_BASE_URL=http://zep:8000
ZEP_URL=http://zep:8000
ZEP_API_KEY=local-dev-key
ZEP_TIMEOUT_MS=8000
```

Then uncomment the `zep` and `zep_db` services in `docker-compose.yml`.

### Q: How much does Zep Cloud cost?

**A**: Check current pricing at https://www.getzep.com/pricing

Free tier includes:
- 50,000 messages/month
- 30-day data retention
- Basic features

### Q: Where is my memory data stored?

**A**:
- **Zep Cloud**: Stored securely on Zep's cloud servers
- **Local Zep**: Stored in PostgreSQL container (`zep_db`)

### Q: Can I migrate from local to cloud?

**A**: Yes, but you'll need to manually export sessions from local Zep and import them to Zep Cloud. Contact Zep support for migration assistance.

---

## Support

- **Zep Documentation**: https://docs.getzep.com
- **Zep Discord**: https://discord.gg/W8Kw6bsgXQ
- **GitHub Issues**: https://github.com/getzep/zep

---

**Last Updated**: 2025-11-07
**Related Commits**: e4222811, aa583d7f
