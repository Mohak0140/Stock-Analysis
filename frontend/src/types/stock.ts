export interface StockData {
  symbol: string;
  name: string;
  current_price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap?: number;
  pe_ratio?: number;
  sector?: string;
  timestamp: string;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistoryResponse {
  symbol: string;
  period: string;
  data: HistoricalData[];
}

export interface PredictionData {
  date: string;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
  change_from_current: number;
  change_percent: number;
}

export interface PredictionResponse {
  symbol: string;
  current_price: number;
  prediction_period: string;
  predictions: PredictionData[];
  model_info: {
    methods_used: string[];
    ensemble: string;
    accuracy_metrics: {
      recent_volatility_percent: number;
      trend_direction: string;
      data_points_used: number;
    };
  };
  timestamp: string;
}

export interface TrendingStocksResponse {
  trending: StockData[];
  timestamp: string;
}

export interface SearchResponse {
  query: string;
  results: StockData[];
  count: number;
}