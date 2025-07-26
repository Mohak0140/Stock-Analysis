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

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
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
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // If it's not a login/register request, redirect to login
      const currentPath = window.location.pathname;
      if (!currentPath.includes('login') && !currentPath.includes('register')) {
        window.location.href = '/login';
      }
    }
    
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

export const authAPI = {
  // Register user
  register: async (name: string, email: string, password: string): Promise<any> => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      
      // Store token in localStorage
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        // Update axios default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<any> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store token in localStorage
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        // Update axios default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<any> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (name?: string, email?: string): Promise<any> => {
    try {
      const response = await api.put('/auth/me', { name, email });
      return response.data.data.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    try {
      const response = await api.put('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Logout user
  logout: async (): Promise<any> => {
    try {
      const response = await api.post('/auth/logout');
      
      // Remove token from localStorage
      localStorage.removeItem('token');
      // Remove from axios default headers
      delete api.defaults.headers.common['Authorization'];
      
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if the API call fails, clear local storage
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (password: string): Promise<any> => {
    try {
      const response = await api.delete('/auth/me', { data: { password } });
      
      // Remove token from localStorage
      localStorage.removeItem('token');
      // Remove from axios default headers
      delete api.defaults.headers.common['Authorization'];
      
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Initialize auth (set token in headers)
  initializeAuth: (): void => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

export const userAPI = {
  // Get user's watchlist
  getWatchlist: async (populate: boolean = true): Promise<any[]> => {
    try {
      const response = await api.get(`/users/watchlist?populate=${populate}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  },

  // Add stock to watchlist
  addToWatchlist: async (symbol: string, alertPrice?: number, notes?: string): Promise<any> => {
    try {
      const response = await api.post(`/users/watchlist`, {
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
  removeFromWatchlist: async (symbol: string): Promise<any> => {
    try {
      const response = await api.delete(`/users/watchlist/${symbol.toUpperCase()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },

  // Update user preferences
  updatePreferences: async (preferences: any): Promise<any> => {
    try {
      const response = await api.put(`/users/preferences`, preferences);
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