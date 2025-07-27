const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const logger = require('./utils/logger');
const stockRoutes = require('./routes/stocks');
const predictionRoutes = require('./routes/predictions');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Global flag to track MongoDB connection status
global.mongoConnected = false;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Database connection with fallback
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_analysis');
    global.mongoConnected = true;
    logger.info('Connected to MongoDB');
  } catch (error) {
    global.mongoConnected = false;
    logger.warn('MongoDB connection failed:', error.message);
    logger.warn('Running in fallback mode without database persistence');
    logger.warn('Data will be stored in memory only');
    logger.info('To fix this issue:');
    logger.info('1. Install MongoDB: sudo apt-get install mongodb-org');
    logger.info('2. Start MongoDB: sudo systemctl start mongod');
    logger.info('3. Or use a cloud MongoDB service like MongoDB Atlas');
  }
};

// Attempt to connect to MongoDB
connectToMongoDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/users', userRoutes);

// Favicon handler to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: global.mongoConnected ? 'connected' : 'disconnected (using fallback)',
    apiKeys: {
      alphaVantage: process.env.ALPHA_VANTAGE_API_KEY !== 'demo' ? 'configured' : 'demo/missing',
      finnhub: process.env.FINNHUB_API_KEY !== 'demo' ? 'configured' : 'demo/missing'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Stock Analysis Platform API',
    version: '1.0.0',
    status: global.mongoConnected ? 'Ready' : 'Running in fallback mode',
    warnings: global.mongoConnected ? [] : [
      'MongoDB not connected - using memory storage only',
      'Data will not persist between server restarts'
    ],
    endpoints: {
      auth: '/api/auth',
      stocks: '/api/stocks',
      predictions: '/api/predictions',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (global.mongoConnected) {
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  if (global.mongoConnected) {
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  if (!global.mongoConnected) {
    logger.warn('⚠️  Running without database - some features may be limited');
  }
  if (process.env.ALPHA_VANTAGE_API_KEY === 'demo' || process.env.FINNHUB_API_KEY === 'demo') {
    logger.warn('⚠️  Using demo API keys - please configure real API keys for full functionality');
  }
});