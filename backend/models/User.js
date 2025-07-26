const mongoose = require('mongoose');

const watchlistItemSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  alertPrice: {
    type: Number
  },
  notes: {
    type: String,
    trim: true
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  watchlist: [watchlistItemSchema],
  preferences: {
    defaultTimePeriod: {
      type: String,
      enum: ['1D', '5D', '1M', '3M', '6M', '1Y', '2Y', '5Y'],
      default: '1M'
    },
    alertsEnabled: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'watchlist.symbol': 1 });

// Method to add stock to watchlist
userSchema.methods.addToWatchlist = function(symbol, alertPrice = null, notes = '') {
  const existingItem = this.watchlist.find(item => item.symbol === symbol.toUpperCase());
  
  if (existingItem) {
    existingItem.alertPrice = alertPrice;
    existingItem.notes = notes;
  } else {
    this.watchlist.push({
      symbol: symbol.toUpperCase(),
      alertPrice,
      notes
    });
  }
  
  return this.save();
};

// Method to remove stock from watchlist
userSchema.methods.removeFromWatchlist = function(symbol) {
  this.watchlist = this.watchlist.filter(item => item.symbol !== symbol.toUpperCase());
  return this.save();
};

// Method to get watchlist symbols
userSchema.methods.getWatchlistSymbols = function() {
  return this.watchlist.map(item => item.symbol);
};

module.exports = mongoose.model('User', userSchema);