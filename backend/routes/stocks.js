const express = require('express');
const stockService = require('../services/stockService');
const Stock = require('../models/Stock');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get trending stocks
// @route   GET /api/stocks/trending
// @access  Public
router.get('/trending', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const stocks = await stockService.getTrendingStocks(limit);
    
    res.json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Search stocks
// @route   GET /api/stocks/search
// @access  Public
router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const stocks = await stockService.searchStocks(query, limit);
    
    res.json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get stock by symbol
// @route   GET /api/stocks/:symbol
// @access  Public
router.get('/:symbol', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await stockService.getStock(symbol);
    
    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get historical data for a stock
// @route   GET /api/stocks/:symbol/history
// @access  Public
router.get('/:symbol/history', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days) || 30;
    
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }

    const historicalData = stock.getPriceHistory(days);
    
    res.json({
      success: true,
      symbol,
      period: `${days} days`,
      count: historicalData.length,
      data: historicalData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get multiple stocks
// @route   POST /api/stocks/batch
// @access  Public
router.post('/batch', async (req, res, next) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Symbols array is required'
      });
    }

    if (symbols.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 symbols allowed per request'
      });
    }

    const result = await stockService.getMultipleStocks(symbols);
    
    res.json({
      success: true,
      count: result.stocks.length,
      data: result.stocks,
      errors: result.errors
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update stock data (admin only)
// @route   PUT /api/stocks/:symbol/update
// @access  Private
router.put('/:symbol/update', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await stockService.updateStockData(symbol);
    
    res.json({
      success: true,
      message: 'Stock data updated successfully',
      data: stock
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get market statistics
// @route   GET /api/stocks/market/stats
// @access  Public
router.get('/market/stats', async (req, res, next) => {
  try {
    const totalStocks = await Stock.countDocuments({ isActive: true });
    const topGainers = await Stock.find({ isActive: true })
      .sort({ changePercent: -1 })
      .limit(5)
      .select('symbol name currentPrice changePercent');
    
    const topLosers = await Stock.find({ isActive: true })
      .sort({ changePercent: 1 })
      .limit(5)
      .select('symbol name currentPrice changePercent');

    const mostActive = await Stock.find({ isActive: true })
      .sort({ volume: -1 })
      .limit(5)
      .select('symbol name currentPrice volume');

    res.json({
      success: true,
      data: {
        totalStocks,
        topGainers,
        topLosers,
        mostActive,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;