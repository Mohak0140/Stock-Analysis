# 📈 Stock Analysis Platform

A modern, full-stack stock analysis website built with the **MERN stack** (MongoDB, Express.js, React, Node.js) and **Python** for advanced predictive analytics. Features real-time stock prices, interactive charts, and auto-regression based price predictions.

## ✨ Features

### 🚀 Real-time Stock Data
- Live stock prices and market data
- Real-time updates with automatic refresh
- Support for major stock exchanges

### 📊 Advanced Analytics
- **Auto-regression models** for price prediction
- **Ensemble prediction** using multiple algorithms:
  - AutoRegression (AR)
  - Linear Regression with technical indicators
  - ARIMA models
- Confidence intervals and volatility analysis

### 💻 Modern User Interface
- **Responsive design** with Material-UI components
- **Dark/Light theme** support
- **Mobile-first** approach
- Interactive charts and visualizations

### 🔍 Smart Features
- Stock search and discovery
- Personal watchlists
- Market trends and statistics
- Top gainers/losers tracking

## 🏗️ Architecture

```
📦 stock-analysis-platform/
├── 🖥️  frontend/          # React TypeScript application
├── 🛠️  backend/           # Node.js/Express API server
├── 🧠 prediction-service/ # Python FastAPI prediction service
└── 📊 database/          # MongoDB data storage
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) for components
- Recharts for data visualization
- Axios for API communication

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Winston logging

**Prediction Service:**
- Python FastAPI
- scikit-learn & statsmodels for ML
- yfinance for stock data
- Pandas & NumPy for data processing

**External APIs:**
- Alpha Vantage (historical data)
- Finnhub (real-time quotes)
- Yahoo Finance (backup data source)

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **Python** >= 3.8
- **MongoDB** (local or cloud)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/stock-analysis-platform.git
cd stock-analysis-platform
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm run setup

# Or install individually:
npm run install-backend
npm run install-frontend
npm run install-prediction
```

### 3. Environment Configuration

Create environment files for each service:

**Backend (.env):**
```bash
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stock_analysis
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
PREDICTION_SERVICE_URL=http://localhost:8000

# API Keys (get from respective providers)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key
```

**Frontend (.env):**
```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_PREDICTION_URL=http://localhost:8000
```

### 4. Start MongoDB

Make sure MongoDB is running locally or configure a cloud connection.

```bash
# For local MongoDB
mongod

# Or use MongoDB Compass/Atlas for cloud setup
```

### 5. Start the Application

```bash
# Start all services in development mode
npm run dev

# Or start individually:
npm run dev-backend    # Backend API (port 5000)
npm run dev-frontend   # React app (port 3000)
npm run dev-prediction # Python service (port 8000)
```

### 6. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Prediction Service:** http://localhost:8000/docs (FastAPI docs)

## 📚 API Documentation

### Backend Endpoints

#### Stocks
- `GET /api/stocks/trending` - Get trending stocks
- `GET /api/stocks/search?q={query}` - Search stocks
- `GET /api/stocks/{symbol}` - Get stock details
- `GET /api/stocks/{symbol}/history` - Get historical data
- `POST /api/stocks/batch` - Get multiple stocks
- `GET /api/stocks/market/stats` - Market statistics

#### Predictions
- `GET /api/predictions/{symbol}?days={days}` - Get price predictions
- `GET /api/predictions/health` - Prediction service health

#### Users
- `POST /api/users` - Create/get user
- `GET /api/users/{email}/watchlist` - Get user watchlist
- `POST /api/users/{email}/watchlist` - Add to watchlist
- `DELETE /api/users/{email}/watchlist/{symbol}` - Remove from watchlist

### Prediction Service Endpoints

- `GET /predict/{symbol}?days={days}` - Generate predictions
- `GET /health` - Service health check
- `GET /models/info` - Model information
- `GET /docs` - Interactive API documentation

## 🔧 Configuration

### API Keys Setup

1. **Alpha Vantage** (Historical Data):
   - Register at [alphavantage.co](https://www.alphavantage.co/support/#api-key)
   - Add key to `backend/.env`

2. **Finnhub** (Real-time Data):
   - Register at [finnhub.io](https://finnhub.io/register)
   - Add key to `backend/.env`

### Database Configuration

**Local MongoDB:**
```bash
# Default connection
MONGODB_URI=mongodb://localhost:27017/stock_analysis
```

**MongoDB Atlas (Cloud):**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stock_analysis
```

## 🚀 Production Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy 'build' folder to your hosting service
```

### Prediction Service Deployment
```bash
cd prediction-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker Deployment (Optional)

Create Docker containers for each service:

```dockerfile
# Example Dockerfile for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Python service tests
cd prediction-service && python -m pytest
```

## 📈 Performance Optimization

### Backend Optimizations
- Database indexing for fast queries
- Request rate limiting
- Response compression
- Caching strategies

### Frontend Optimizations
- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- PWA capabilities

### Prediction Service Optimizations
- Model caching
- Async processing
- Connection pooling
- Result memoization

## 🛠️ Development

### Project Structure

```
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   └── package.json
├── backend/
│   ├── models/             # MongoDB models
│   ├── routes/             # Express routes
│   ├── services/           # Business logic
│   ├── middleware/         # Custom middleware
│   └── utils/              # Helper functions
├── prediction-service/
│   ├── models/             # Pydantic models
│   ├── services/           # ML/prediction logic
│   └── main.py             # FastAPI application
└── package.json            # Root package.json
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📧 Email: support@stockanalysis.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/stock-analysis-platform/issues)
- 📖 Documentation: [Wiki](https://github.com/yourusername/stock-analysis-platform/wiki)

## 🎯 Roadmap

- [ ] Real-time WebSocket connections
- [ ] Advanced charting with TradingView
- [ ] News sentiment analysis
- [ ] Portfolio tracking
- [ ] Mobile app (React Native)
- [ ] Machine learning model improvements
- [ ] Social trading features

---

**Built with ❤️ using the MERN stack and Python**