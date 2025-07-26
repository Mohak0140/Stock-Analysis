const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get current user's watchlist
// @route   GET /api/users/watchlist
// @access  Private
router.get('/watchlist', auth, async (req, res, next) => {
  try {
    const user = req.user;

    // Optionally populate with current stock data
    const populateStocks = req.query.populate === 'true';
    let watchlistData = user.watchlist;

    if (populateStocks) {
      const stockService = require('../services/stockService');
      const symbols = user.getWatchlistSymbols();
      
      if (symbols.length > 0) {
        const { stocks } = await stockService.getMultipleStocks(symbols);
        
        // Merge watchlist data with current stock data
        watchlistData = user.watchlist.map(watchItem => {
          const stockData = stocks.find(stock => stock.symbol === watchItem.symbol);
          return {
            ...watchItem.toObject(),
            stockData
          };
        });
      }
    }

    res.json({
      success: true,
      count: watchlistData.length,
      data: watchlistData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add stock to watchlist
// @route   POST /api/users/watchlist
// @access  Private
router.post('/watchlist', auth, async (req, res, next) => {
  try {
    const { symbol, alertPrice, notes } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    const user = await User.findById(req.user._id);
    await user.addToWatchlist(symbol, alertPrice, notes);

    res.json({
      success: true,
      message: 'Stock added to watchlist',
      data: user.watchlist
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Remove stock from watchlist
// @route   DELETE /api/users/watchlist/:symbol
// @access  Private
router.delete('/watchlist/:symbol', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    await user.removeFromWatchlist(req.params.symbol);

    res.json({
      success: true,
      message: 'Stock removed from watchlist',
      data: user.watchlist
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { defaultTimePeriod, alertsEnabled, theme, currency } = req.body;

    if (defaultTimePeriod) user.preferences.defaultTimePeriod = defaultTimePeriod;
    if (typeof alertsEnabled === 'boolean') user.preferences.alertsEnabled = alertsEnabled;
    if (theme) user.preferences.theme = theme;
    if (currency) user.preferences.currency = currency;

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });
  } catch (error) {
    next(error);
  }
});

// Legacy routes for backward compatibility (these will be deprecated)
// @desc    Get or create user
// @route   POST /api/users
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required. Please use /api/auth/register for new users.'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        message: 'User found. Please use /api/auth/login for authentication.',
        data: user.toAuthJSON()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found. Please register using /api/auth/register.'
      });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Get user by email (deprecated)
// @route   GET /api/users/:email
// @access  Public
router.get('/:email', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'This endpoint is deprecated. Please use authenticated routes.',
      data: user.toAuthJSON()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;