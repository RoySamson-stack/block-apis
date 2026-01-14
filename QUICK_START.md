# Quick Start Guide - Run Your Monetized API 🚀

## ✅ What's Ready

Your API now has:
- ✅ Full Stripe integration for subscriptions
- ✅ Webhook system for real-time alerts
- ✅ Advanced risk scoring (optional)
- ✅ Complete billing and usage tracking
- ✅ Security headers and CORS configured

---

## 🚀 Start the API

### Option 1: Using Docker (Recommended)

```bash
# Start infrastructure services
cd /home/ralan/personal-projects/blockchain-transaction-api
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait a few seconds for services to start
sleep 5

# Start API
cd apps/api
npm run dev
```

### Option 2: Using Existing Docker Services

If you have postgres/redis already running:

```bash
cd apps/api

# Update DATABASE_URL if needed (check your .env)
# DATABASE_URL="postgresql://user:password@localhost:5432/blockchain_api"

# Run database migration
npx prisma db push
npx prisma generate

# Start API
npm run dev
```

---

## 🔧 Configuration

### 1. Database Connection

Check your `.env` file:
```env
DATABASE_URL="postgresql://riot:riot9334@localhost:5432/blockchain_api"
```

If using Docker containers, you might need:
```env
DATABASE_URL="postgresql://riot:riot9334@host.docker.internal:5432/blockchain_api"
```

### 2. Stripe Setup (For Monetization)

1. Get Stripe keys from https://dashboard.stripe.com/test/apikeys
2. Add to `.env`:
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # From webhook settings
STRIPE_PRICE_DEVELOPER="price_..."
STRIPE_PRICE_PROFESSIONAL="price_..."
STRIPE_PRICE_ENTERPRISE="price_..."
```

### 3. Other Required Variables

```env
ADMIN_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
API_KEY_SALT="your-salt"
CORS_ORIGINS="http://localhost:3000"
```

---

## 🧪 Test the API

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Create API Key (Admin)
```bash
curl -X POST http://localhost:3000/api/v1/admin/api-keys \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key","tier":"developer"}'
```

### 3. Test Transaction Endpoint
```bash
curl http://localhost:3000/api/v1/bitcoin/transaction/YOUR_TX_HASH \
  -H "X-API-Key: YOUR_API_KEY"
```

### 4. Create Subscription (Monetization)
```bash
curl -X POST http://localhost:3000/api/v1/billing/subscribe \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1234567890",
    "email": "customer@example.com"
  }'
```

---

## 📊 API Endpoints

### Billing & Monetization
- `GET /api/v1/billing/pricing` - Get pricing tiers
- `GET /api/v1/billing/usage` - Get usage statistics
- `POST /api/v1/billing/subscribe` - Create subscription
- `GET /api/v1/billing/subscribe` - Get subscription
- `POST /api/v1/billing/subscribe/cancel` - Cancel subscription
- `POST /api/v1/billing/subscribe/upgrade` - Upgrade/downgrade

### Webhooks
- `POST /api/v1/webhooks` - Register webhook
- `GET /api/v1/webhooks` - List webhooks
- `DELETE /api/v1/webhooks/:id` - Delete webhook

### Transactions
- `GET /api/v1/bitcoin/transaction/:hash` - Get Bitcoin transaction
- `GET /api/v1/ethereum/transaction/:hash` - Get Ethereum transaction
- `GET /api/v1/bitcoin/transaction/:hash/risk` - Get risk analysis

---

## 🐛 Troubleshooting

**Database connection fails:**
```bash
# Check if postgres is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL

# Try connecting directly
psql $DATABASE_URL
```

**API won't start:**
```bash
# Check for errors
npm run dev

# Check if port 3000 is in use
lsof -i :3000

# Install dependencies
npm install
```

**Stripe errors:**
- Make sure `STRIPE_SECRET_KEY` is set
- Use test keys for development
- Check webhook secret matches Stripe dashboard

---

## 🎯 Next Steps

1. **Test API** - Make sure all endpoints work
2. **Set up Stripe** - Create products and prices
3. **Test Subscriptions** - Create test subscription
4. **Deploy** - Deploy to production when ready

---

**Your API is ready to monetize! 💰**

