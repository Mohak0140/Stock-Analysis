const axios = require('axios');
const Stock = require('../models/Stock');
const logger = require('../utils/logger');

class StockService {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.finnhubKey = process.env.FINNHUB_API_KEY;
    this.predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://localhost:8000';
    
    // Popular stock symbols for fallback
    this.popularSymbols = [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
      'META', 'NVDA', 'NFLX', 'AMD', 'PYPL'
    ];

    // Check if API keys are properly set
    this.hasValidKeys = this.checkApiKeys();
  }

  checkApiKeys() {
    const hasAlphaVantage = this.alphaVantageKey && this.alphaVantageKey !== 'demo';
    const hasFinnhub = this.finnhubKey && this.finnhubKey !== 'demo';
    
    if (!hasAlphaVantage || !hasFinnhub) {
      logger.warn('API keys not properly configured. Some features may not work correctly.');
      logger.warn('Please get API keys from:');
      logger.warn('- Alpha Vantage: https://www.alphavantage.co/support/#api-key');
      logger.warn('- Finnhub: https://finnhub.io/register');
    }
    
    return hasAlphaVantage && hasFinnhub;
  }

  // Generate mock data for demo purposes
  generateMockStockData(symbol) {
    const basePrice = 100 + Math.random() * 400; // Random price between 100-500
    const change = (Math.random() - 0.5) * 10; // Random change between -5 to +5
    const changePercent = (change / basePrice) * 100;

    return {
      symbol: symbol.toUpperCase(),
      currentPrice: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      high: Math.round((basePrice + Math.abs(change) + Math.random() * 5) * 100) / 100,
      low: Math.round((basePrice - Math.abs(change) - Math.random() * 5) * 100) / 100,
      open: Math.round((basePrice - change + (Math.random() - 0.5) * 2) * 100) / 100,
      previousClose: Math.round((basePrice - change) * 100) / 100,
      timestamp: new Date(),
      isMockData: true
    };
  }

  // Get real-time stock data using Finnhub API
  async getRealTimeData(symbol) {
    try {
      // If no valid API key, return mock data
      if (!this.finnhubKey || this.finnhubKey === 'demo') {
        logger.info(`Using mock data for ${symbol} - demo API key detected`);
        return this.generateMockStockData(symbol);
      }

      const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
        params: {
          symbol: symbol.toUpperCase(),
          token: this.finnhubKey
        },
        timeout: 3000 // Reduced timeout for faster fallback
      });

      const data = response.data;
      if (!data.c) {
        logger.warn(`No real data available for ${symbol}, using mock data`);
        return this.generateMockStockData(symbol);
      }

      return {
        symbol: symbol.toUpperCase(),
        currentPrice: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: new Date()
      };
    } catch (error) {
      if (this.finnhubKey === 'demo') {
        logger.info(`Using mock data for ${symbol} - demo API key cannot access real data`);
      } else {
        logger.error(`Error fetching real-time data for ${symbol}:`, error.message);
      }
      logger.info(`Falling back to mock data for ${symbol}`);
      return this.generateMockStockData(symbol);
    }
  }

  // Get company profile
  async getCompanyProfile(symbol) {
    try {
      // If no valid API key, return basic mock profile
      if (!this.finnhubKey || this.finnhubKey === 'demo') {
        logger.info(`Using mock profile for ${symbol} - demo API key detected`);
        return {
          name: `${symbol.toUpperCase()} Inc.`,
          finnhubIndustry: 'Technology',
          industry: 'Software',
          description: `Mock description for ${symbol.toUpperCase()}`,
          isMockData: true
        };
      }

      const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2`, {
        params: {
          symbol: symbol.toUpperCase(),
          token: this.finnhubKey
        },
        timeout: 3000 // Reduced timeout for faster fallback
      });

      return response.data;
    } catch (error) {
      if (this.finnhubKey === 'demo') {
        logger.info(`Using mock profile for ${symbol} - demo API key cannot access real data`);
      } else {
        logger.error(`Error fetching company profile for ${symbol}:`, error.message);
      }
      return {
        name: `${symbol.toUpperCase()} Inc.`,
        finnhubIndustry: 'Technology',
        industry: 'Software',
        description: `Mock description for ${symbol.toUpperCase()}`,
        isMockData: true
      };
    }
  }

  // Get historical data using Alpha Vantage
  async getHistoricalData(symbol, period = 'daily', outputSize = 'compact') {
    try {
      // If no valid API key, generate mock historical data
      if (!this.alphaVantageKey || this.alphaVantageKey === 'demo') {
        logger.info(`Using mock historical data for ${symbol} - demo API key detected`);
        return this.generateMockHistoricalData(symbol);
      }

      const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol.toUpperCase(),
          outputsize: outputSize,
          apikey: this.alphaVantageKey
        },
        timeout: 5000 // Reduced timeout for faster fallback
      });

      const data = response.data;
      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || data['Note']);
      }

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('No historical data available');
      }

      const historicalData = [];
      for (const [date, values] of Object.entries(timeSeries)) {
        historicalData.push({
          date: new Date(date),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'])
        });
      }

      return historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      if (this.alphaVantageKey === 'demo') {
        logger.info(`Using mock historical data for ${symbol} - demo API key cannot access real data`);
      } else {
        logger.error(`Error fetching historical data for ${symbol}:`, error.message);
      }
      logger.info(`Falling back to mock historical data for ${symbol}`);
      return this.generateMockHistoricalData(symbol);
    }
  }

  // Generate mock historical data
  generateMockHistoricalData(symbol) {
    const historicalData = [];
    const basePrice = 100 + Math.random() * 400;
    let currentPrice = basePrice;
    
    // Generate 30 days of mock data
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Random walk for price movement
      const change = (Math.random() - 0.5) * currentPrice * 0.05; // 5% max change
      currentPrice = Math.max(currentPrice + change, 1); // Ensure price doesn't go below 1
      
      const open = currentPrice + (Math.random() - 0.5) * currentPrice * 0.02;
      const high = Math.max(open, currentPrice) + Math.random() * currentPrice * 0.03;
      const low = Math.min(open, currentPrice) - Math.random() * currentPrice * 0.03;
      const volume = Math.floor(1000000 + Math.random() * 5000000);

      historicalData.push({
        date: new Date(date.toDateString()), // Remove time component
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(Math.max(low, 1) * 100) / 100,
        close: Math.round(currentPrice * 100) / 100,
        volume: volume,
        isMockData: true
      });
    }

    return historicalData;
  }

  // Transform stock data to match frontend expectations
  transformStockData(stockData) {
    return {
      symbol: stockData.symbol,
      name: stockData.name,
      current_price: stockData.currentPrice,
      change: stockData.change,
      change_percent: stockData.changePercent,
      volume: stockData.volume || 0,
      market_cap: stockData.marketCap,
      pe_ratio: stockData.peRatio,
      sector: stockData.sector,
      timestamp: stockData.lastUpdated || stockData.timestamp || new Date().toISOString(),
      isMockData: stockData.isMockData
    };
  }

  // Update or create stock in database
  async updateStockData(symbol) {
    try {
      // Get real-time data
      const realTimeData = await this.getRealTimeData(symbol);
      
      // Get company profile
      const profile = await this.getCompanyProfile(symbol);

      const stockData = {
        symbol: symbol.toUpperCase(),
        name: profile?.name || `${symbol.toUpperCase()} Inc.`,
        sector: profile?.finnhubIndustry,
        industry: profile?.industry,
        description: profile?.description,
        currentPrice: realTimeData.currentPrice,
        change: realTimeData.change,
        changePercent: realTimeData.changePercent,
        marketCap: profile?.marketCapitalization,
        peRatio: profile?.peRatio,
        lastUpdated: new Date(),
        isMockData: realTimeData.isMockData || profile?.isMockData || false
      };

      // If MongoDB is connected, use database
      if (global.mongoConnected) {
        // Find existing stock or create new one
        let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
        
        if (!stock) {
          stock = new Stock(stockData);
        } else {
          Object.assign(stock, stockData);
        }

        // Try to get and update historical data
        try {
          const historicalData = await this.getHistoricalData(symbol);
          if (historicalData && historicalData.length > 0) {
            // Keep only last 365 days of data
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            stock.historicalData = historicalData.filter(
              data => new Date(data.date) >= oneYearAgo
            );
          }
        } catch (histError) {
          logger.warn(`Could not update historical data for ${symbol}:`, histError.message);
        }

        await stock.save();
        return stock;
      } else {
        // Use in-memory storage
        if (!this.memoryCache) {
          this.memoryCache = new Map();
        }

        // Add historical data for in-memory storage
        try {
          const historicalData = await this.getHistoricalData(symbol);
          if (historicalData && historicalData.length > 0) {
            stockData.historicalData = historicalData;
          }
        } catch (histError) {
          logger.warn(`Could not get historical data for ${symbol}:`, histError.message);
        }

        this.memoryCache.set(symbol.toUpperCase(), stockData);
        return stockData;
      }
    } catch (error) {
      logger.error(`Error updating stock data for ${symbol}:`, error.message);
      throw error;
    }
  }

  // Get stock from database or fetch and store
  async getStock(symbol) {
    try {
      let stock = null;
      
      if (global.mongoConnected) {
        stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      } else {
        // Use in-memory cache
        if (!this.memoryCache) {
          this.memoryCache = new Map();
        }
        stock = this.memoryCache.get(symbol.toUpperCase());
      }
      
      // If stock doesn't exist or data is old (> 5 minutes), update it
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (!stock || !stock.lastUpdated || new Date(stock.lastUpdated) < fiveMinutesAgo) {
        stock = await this.updateStockData(symbol);
      }

      // Transform data for frontend compatibility
      return this.transformStockData(stock);
    } catch (error) {
      logger.error(`Error getting stock ${symbol}:`, error.message);
      throw error;
    }
  }

  // Get multiple stocks
  async getMultipleStocks(symbols) {
    const results = [];
    const errors = [];

    for (const symbol of symbols) {
      try {
        const stock = await this.getStock(symbol);
        results.push(stock);
      } catch (error) {
        errors.push({ symbol, error: error.message });
      }
    }

    return { stocks: results, errors };
  }

  // Get trending stocks
  async getTrendingStocks(limit = 10) {
    try {
      let stocks = [];
      
      if (global.mongoConnected) {
        // Try to get from database
        const dbStocks = await Stock.find({ isActive: true })
          .sort({ changePercent: -1 })
          .limit(limit);
        
        // Transform database stocks to frontend format
        stocks = dbStocks.map(stock => this.transformStockData(stock));
      }
      
      // If we don't have enough stocks, fetch popular ones
      if (stocks.length < limit) {
        const symbolsToFetch = this.popularSymbols.slice(0, limit);
        const { stocks: fetchedStocks } = await this.getMultipleStocks(symbolsToFetch);
        
        // Combine and deduplicate
        const allStocks = [...stocks, ...fetchedStocks];
        const uniqueStocks = allStocks.filter((stock, index, self) => 
          index === self.findIndex(s => s.symbol === stock.symbol)
        );
        
        stocks = uniqueStocks
          .sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0))
          .slice(0, limit);
      }

      return stocks;
    } catch (error) {
      logger.error('Error getting trending stocks:', error.message);
      throw error;
    }
  }

  // Search stocks
  async searchStocks(query, limit = 20) {
    try {
      let stocks = [];
      
      if (global.mongoConnected) {
        const dbStocks = await Stock.find({
          $or: [
            { symbol: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        }).limit(limit);
        
        // Transform database stocks to frontend format
        stocks = dbStocks.map(stock => this.transformStockData(stock));
      } else {
        // Search in memory cache
        if (this.memoryCache) {
          const allStocks = Array.from(this.memoryCache.values());
          const matchingStocks = allStocks.filter(stock => 
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            (stock.name && stock.name.toLowerCase().includes(query.toLowerCase()))
          ).slice(0, limit);
          
          // Transform memory cache stocks to frontend format
          stocks = matchingStocks.map(stock => this.transformStockData(stock));
        }
      }
      
      // If no results found and query looks like a symbol, try to fetch it
      if (stocks.length === 0 && query.length <= 5) {
        try {
          const stock = await this.getStock(query);
          return [stock];
        } catch (error) {
          // If fetching fails, return empty array
          return [];
        }
      }

      return stocks;
    } catch (error) {
      logger.error(`Error searching stocks with query "${query}":`, error.message);
      throw error;
    }
  }

  // Call prediction service
  async getPredictions(symbol, days = 30) {
    try {
      const response = await axios.get(`${this.predictionServiceUrl}/predict/${symbol}`, {
        params: { days },
        timeout: 30000 // 30 seconds timeout for prediction
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting predictions for ${symbol}:`, error.message);
      
      // Return mock predictions as fallback with proper structure
      const currentStock = this.memoryCache?.get(symbol.toUpperCase());
      const currentPrice = currentStock?.currentPrice || 100 + Math.random() * 400;
      const predictions = this.generateMockPredictions(symbol, days);
      
      return {
        symbol: symbol.toUpperCase(),
        current_price: currentPrice,
        prediction_period: `${days} days`,
        predictions: predictions.map(pred => ({
          ...pred,
          lower_bound: pred.predicted_price * 0.95,
          upper_bound: pred.predicted_price * 1.05,
          change_from_current: pred.predicted_price - currentPrice,
          change_percent: ((pred.predicted_price - currentPrice) / currentPrice) * 100
        })),
        model_info: {
          methods_used: ['AutoRegression', 'Linear Regression', 'ARIMA'],
          ensemble: 'ensemble_auto_regression',
          accuracy_metrics: {
            recent_volatility_percent: Math.random() * 5 + 2, // 2-7% volatility
            trend_direction: Math.random() > 0.5 ? 'upward' : 'downward',
            data_points_used: Math.floor(Math.random() * 50) + 100 // 100-150 data points
          }
        },
        timestamp: new Date().toISOString(),
        isMockData: true,
        message: 'Prediction service unavailable - showing mock data'
      };
    }
  }

  // Generate mock predictions
  generateMockPredictions(symbol, days) {
    const predictions = [];
    const currentStock = this.memoryCache?.get(symbol.toUpperCase());
    let basePrice = currentStock?.currentPrice || 100 + Math.random() * 400;
    
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Random walk with slight upward bias
      const change = (Math.random() - 0.45) * basePrice * 0.02; // Slight upward bias
      basePrice = Math.max(basePrice + change, 1);
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        predicted_price: Math.round(basePrice * 100) / 100,
        confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
      });
    }
    
    return predictions;
  }
}

module.exports = new StockService();