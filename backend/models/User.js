const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  password: {
    type: String,
    required: true,
    minlength: 6
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
// Note: email index is automatically created by unique: true
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user object without password
userSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    email: this.email,
    name: this.name,
    watchlist: this.watchlist,
    preferences: this.preferences,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema);