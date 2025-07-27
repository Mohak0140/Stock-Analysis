const mongoose = require('mongoose');

const historicalDataSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  close: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true,
    default: 0
  }
});

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  sector: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  marketCap: {
    type: Number
  },
  peRatio: {
    type: Number
  },
  currentPrice: {
    type: Number,
    required: true
  },
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  volume: {
    type: Number,
    default: 0
  },
  averageVolume: {
    type: Number
  },
  historicalData: [historicalDataSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
// Note: symbol index is automatically created by unique: true
stockSchema.index({ name: 'text', description: 'text' });
stockSchema.index({ sector: 1 });
stockSchema.index({ lastUpdated: -1 });
stockSchema.index({ 'historicalData.date': -1 });

// Virtual for formatted market cap
stockSchema.virtual('formattedMarketCap').get(function() {
  if (!this.marketCap) return null;
  if (this.marketCap >= 1e12) return `${(this.marketCap / 1e12).toFixed(2)}T`;
  if (this.marketCap >= 1e9) return `${(this.marketCap / 1e9).toFixed(2)}B`;
  if (this.marketCap >= 1e6) return `${(this.marketCap / 1e6).toFixed(2)}M`;
  return this.marketCap.toString();
});

// Method to get latest historical data
stockSchema.methods.getLatestPrice = function() {
  if (this.historicalData && this.historicalData.length > 0) {
    const sorted = this.historicalData.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0];
  }
  return null;
};

// Method to get price history for a specific period
stockSchema.methods.getPriceHistory = function(days = 30) {
  if (!this.historicalData || this.historicalData.length === 0) return [];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.historicalData
    .filter(data => new Date(data.date) >= cutoffDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Static method to find trending stocks
stockSchema.statics.findTrending = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ changePercent: -1, volume: -1 })
    .limit(limit)
    .select('-historicalData');
};

// Static method to search stocks
stockSchema.statics.searchStocks = function(query, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { symbol: searchRegex },
          { name: searchRegex },
          { description: searchRegex }
        ]
      }
    ]
  })
  .limit(limit)
  .select('-historicalData');
};

// Pre-save middleware to update lastUpdated
stockSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Stock', stockSchema);