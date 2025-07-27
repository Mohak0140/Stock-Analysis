# Stock Analysis Platform - Setup Guide

## Quick Fix for API Errors

The error you're experiencing is due to missing or invalid API keys. Here's how to fix it:

### 🔧 Step 1: Get Free API Keys

#### Alpha Vantage API Key (Free - 25 requests/day)
1. Visit: https://www.alphavantage.co/support/#api-key
2. Click "Get your free API key today"
3. Fill out the registration form
4. Copy your API key

#### Finnhub API Key (Free - 60 calls/minute)
1. Visit: https://finnhub.io/register
2. Create a free account
3. Go to your dashboard
4. Copy your API key

### 🔧 Step 2: Update Environment Variables

1. Open `backend/.env` file
2. Replace the demo keys with your real API keys:

```env
# Replace these with your actual API keys
ALPHA_VANTAGE_API_KEY=your_actual_alpha_vantage_key_here
FINNHUB_API_KEY=your_actual_finnhub_key_here
```

### 🔧 Step 3: Start the Backend

```bash
cd backend
npm start
```

### 🔧 Step 4: Test the API

Test the AAPL stock endpoint:
```bash
curl "http://localhost:5000/api/stocks/AAPL"
```

## ⚠️ Current Fallback Behavior

If you don't have valid API keys, the system will:
- ✅ Still work with **mock data**
- ✅ Generate realistic stock prices and charts
- ✅ Provide all functionality for testing
- ⚠️ Data won't be real market data

## 🗄️ Database Setup (Optional)

The system works without MongoDB, but for persistence:

### Install MongoDB (Ubuntu/Debian)
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Alternative: Use MongoDB Atlas (Cloud)
1. Visit: https://www.mongodb.com/atlas
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

## 🚀 Quick Start Without Setup

If you want to test immediately without API keys:

1. Start the backend: `cd backend && npm start`
2. The system will use mock data automatically
3. All endpoints will work with realistic fake data

## 📊 Available Endpoints

- `GET /api/health` - Check system status
- `GET /api/stocks/AAPL` - Get stock data
- `GET /api/stocks/trending` - Get trending stocks
- `GET /api/stocks/search?q=apple` - Search stocks

## 🔍 Troubleshooting

### Check API Key Status
```bash
curl "http://localhost:5000/api/health"
```

This will show:
- Database connection status
- API key configuration status
- System warnings

### Common Issues

1. **"demo" API keys**: Replace with real keys from the providers
2. **Rate limiting**: Free tiers have limits (25/day for Alpha Vantage)
3. **Invalid symbols**: Use valid stock symbols (AAPL, GOOGL, MSFT, etc.)

## 🎯 Next Steps

1. **Get real API keys** for live market data
2. **Set up MongoDB** for data persistence
3. **Configure prediction service** for ML predictions
4. **Set up frontend** for the complete experience

## 📧 Support

If you continue to have issues:
1. Check the logs in the terminal
2. Verify your API keys are active
3. Ensure the stock symbol exists
4. Check network connectivity

---

**Note**: The system is designed to work gracefully with or without valid API keys, so you can explore all features even without immediate setup!