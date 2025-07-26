const express = require('express');
const stockService = require('../services/stockService');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get stock price predictions
// @route   GET /api/predictions/:symbol
// @access  Public
router.get('/:symbol', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const days = parseInt(req.query.days) || 30;

    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        error: 'Days must be between 1 and 365'
      });
    }

    const predictions = await stockService.getPredictions(symbol, days);
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    // If prediction service is down, return a meaningful error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Prediction service is currently unavailable. Please try again later.'
      });
    }
    next(error);
  }
});

// @desc    Get prediction service health
// @route   GET /api/predictions/health
// @access  Public
router.get('/health', async (req, res, next) => {
  try {
    const axios = require('axios');
    const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://localhost:8000';
    
    const response = await axios.get(`${predictionServiceUrl}/health`, {
      timeout: 5000
    });
    
    res.json({
      success: true,
      data: {
        predictionService: response.data,
        status: 'available'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Prediction service is unavailable',
      data: {
        status: 'unavailable'
      }
    });
  }
});

module.exports = router;