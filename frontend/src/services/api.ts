import axios from 'axios';
import { StockData, StockHistoryResponse, PredictionResponse, TrendingStocksResponse, SearchResponse } from '../types/stock';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 503) {
      throw new Error('Service temporarily unavailable. Please try again later.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please slow down and try again.');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    
    throw error;
  }
);

export const stockAPI = {
  // Get trending stocks
  getTrendingStocks: async (limit: number = 10): Promise<StockData[]> => {
    try {
      const response = await api.get(`/stocks/trending?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trending stocks:', error);
      throw error;
    }
  },

  // Search stocks
  searchStocks: async (query: string, limit: number = 20): Promise<StockData[]> => {
    try {
      const response = await api.get(`/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw error;
    }
  },

  // Get stock by symbol
  getStock: async (symbol: string): Promise<StockData> => {
    try {
      const response = await api.get(`/stocks/${symbol.toUpperCase()}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching stock ${symbol}:`, error);
      throw error;
    }
  },

  // Get historical data
  getHistoricalData: async (symbol: string, days: number = 30): Promise<any[]> => {
    try {
      const response = await api.get(`/stocks/${symbol.toUpperCase()}/history?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  },

  // Get multiple stocks
  getMultipleStocks: async (symbols: string[]): Promise<{ stocks: StockData[], errors: any[] }> => {
    try {
      const response = await api.post('/stocks/batch', { symbols });
      return {
        stocks: response.data.data,
        errors: response.data.errors || []
      };
    } catch (error) {
      console.error('Error fetching multiple stocks:', error);
      throw error;
    }
  },

  // Get market statistics
  getMarketStats: async (): Promise<any> => {
    try {
      const response = await api.get('/stocks/market/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching market stats:', error);
      throw error;
    }
  },

  // Get predictions
  getPredictions: async (symbol: string, days: number = 30): Promise<PredictionResponse> => {
    try {
      const response = await api.get(`/predictions/${symbol.toUpperCase()}?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching predictions for ${symbol}:`, error);
      throw error;
    }
  },

  // Check prediction service health
  getPredictionServiceHealth: async (): Promise<any> => {
    try {
      const response = await api.get('/predictions/health');
      return response.data.data;
    } catch (error) {
      console.error('Error checking prediction service health:', error);
      throw error;
    }
  }
};

export const userAPI = {
  // Get or create user
  getOrCreateUser: async (email: string, name: string): Promise<any> => {
    try {
      const response = await api.post('/users', { email, name });
      return response.data.data;
    } catch (error) {
      console.error('Error getting/creating user:', error);
      throw error;
    }
  },

  // Get user by email
  getUser: async (email: string): Promise<any> => {
    try {
      const response = await api.get(`/users/${encodeURIComponent(email)}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Get user's watchlist
  getWatchlist: async (email: string, populate: boolean = true): Promise<any[]> => {
    try {
      const response = await api.get(`/users/${encodeURIComponent(email)}/watchlist?populate=${populate}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  },

  // Add stock to watchlist
  addToWatchlist: async (email: string, symbol: string, alertPrice?: number, notes?: string): Promise<any> => {
    try {
      const response = await api.post(`/users/${encodeURIComponent(email)}/watchlist`, {
        symbol,
        alertPrice,
        notes
      });
      return response.data.data;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  // Remove stock from watchlist
  removeFromWatchlist: async (email: string, symbol: string): Promise<any> => {
    try {
      const response = await api.delete(`/users/${encodeURIComponent(email)}/watchlist/${symbol.toUpperCase()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },

  // Update user preferences
  updatePreferences: async (email: string, preferences: any): Promise<any> => {
    try {
      const response = await api.put(`/users/${encodeURIComponent(email)}/preferences`, preferences);
      return response.data.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }
};

// Health check
export const healthCheck = async (): Promise<any> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;