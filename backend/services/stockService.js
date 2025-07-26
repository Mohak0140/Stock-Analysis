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
  }

  // Get real-time stock data using Finnhub API
  async getRealTimeData(symbol) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
        params: {
          symbol: symbol.toUpperCase(),
          token: this.finnhubKey
        },
        timeout: 5000
      });

      const data = response.data;
      if (!data.c) {
        throw new Error('No data available for this symbol');
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
      logger.error(`Error fetching real-time data for ${symbol}:`, error.message);
      throw error;
    }
  }

  // Get company profile
  async getCompanyProfile(symbol) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2`, {
        params: {
          symbol: symbol.toUpperCase(),
          token: this.finnhubKey
        },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching company profile for ${symbol}:`, error.message);
      return null;
    }
  }

  // Get historical data using Alpha Vantage
  async getHistoricalData(symbol, period = 'daily', outputSize = 'compact') {
    try {
      const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol.toUpperCase(),
          outputsize: outputSize,
          apikey: this.alphaVantageKey
        },
        timeout: 10000
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
      logger.error(`Error fetching historical data for ${symbol}:`, error.message);
      throw error;
    }
  }

  // Update or create stock in database
  async updateStockData(symbol) {
    try {
      // Get real-time data
      const realTimeData = await this.getRealTimeData(symbol);
      
      // Get company profile
      const profile = await this.getCompanyProfile(symbol);

      // Find existing stock or create new one
      let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      
      if (!stock) {
        stock = new Stock({
          symbol: symbol.toUpperCase(),
          name: profile?.name || symbol.toUpperCase(),
          sector: profile?.finnhubIndustry,
          industry: profile?.industry,
          description: profile?.description
        });
      }

      // Update current data
      stock.currentPrice = realTimeData.currentPrice;
      stock.change = realTimeData.change;
      stock.changePercent = realTimeData.changePercent;
      stock.marketCap = profile?.marketCapitalization;
      stock.peRatio = profile?.peRatio;

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
    } catch (error) {
      logger.error(`Error updating stock data for ${symbol}:`, error.message);
      throw error;
    }
  }

  // Get stock from database or fetch and store
  async getStock(symbol) {
    try {
      let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      
      // If stock doesn't exist or data is old (> 5 minutes), update it
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (!stock || stock.lastUpdated < fiveMinutesAgo) {
        stock = await this.updateStockData(symbol);
      }

      return stock;
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
      // First try to get from database
      let stocks = await Stock.findTrending(limit);
      
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
          .sort((a, b) => b.changePercent - a.changePercent)
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
      const stocks = await Stock.searchStocks(query, limit);
      
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
      throw error;
    }
  }
}

module.exports = new StockService();