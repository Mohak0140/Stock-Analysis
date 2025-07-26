const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.header('Authorization');
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    } else {
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token is not valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error in authentication'
    });
  }
};

// Optional auth middleware - doesn't require authentication but adds user if token is present
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    } else {
      token = req.cookies?.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // If token is invalid, just continue without user
        logger.warn('Invalid token in optional auth:', error.message);
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { auth, optionalAuth };