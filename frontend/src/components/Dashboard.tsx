import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Button,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  ShowChart,
  Assessment
} from '@mui/icons-material';
import { stockAPI } from '../services/api';
import { StockData } from '../types/stock';

interface DashboardProps {
  onStockSelect: (symbol: string) => void;
}

interface MarketStats {
  totalStocks: number;
  topGainers: StockData[];
  topLosers: StockData[];
  mostActive: StockData[];
  lastUpdated: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onStockSelect }) => {
  const [trendingStocks, setTrendingStocks] = useState<StockData[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [trending, stats] = await Promise.all([
        stockAPI.getTrendingStocks(8),
        stockAPI.getMarketStats()
      ]);
      
      setTrendingStocks(trending);
      setMarketStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatChange = (change: number | undefined, changePercent: number | undefined) => {
    const isPositive = (change ?? 0) >= 0;
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        {isPositive ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
        <Typography
          color={isPositive ? 'success.main' : 'error.main'}
          fontWeight="medium"
        >
          {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(2) : '--'} ({isPositive ? '+' : ''}{typeof changePercent === 'number' ? changePercent.toFixed(2) : '--'}%)
        </Typography>
      </Box>
    );
  };

  const StockCard: React.FC<{ stock: StockData; onClick: () => void }> = ({ stock, onClick }) => (
    <Card 
      sx={{ 
        cursor: 'pointer', 
        '&:hover': { 
          transform: 'translateY(-2px)',
          transition: 'transform 0.2s ease-in-out',
          boxShadow: 3
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {stock.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {stock.name}
            </Typography>
          </Box>
          <Chip 
            label={stock.sector || 'Unknown'} 
            size="small" 
            variant="outlined"
          />
        </Box>
        
        <Typography variant="h6" color="primary" fontWeight="bold" mb={1}>
          {formatPrice(stock.current_price)}
        </Typography>
        
        {formatChange(stock.change, stock.change_percent)}
        
        {stock.volume > 0 && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Volume: {stock.volume.toLocaleString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const StatCard: React.FC<{ title: string; stocks: StockData[]; color: 'success' | 'error' | 'primary' }> = ({ title, stocks, color }) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <ShowChart color={color} />
          {title}
        </Typography>
        {stocks.slice(0, 3).map((stock) => (
          <Box 
            key={stock.symbol} 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
            py={0.5}
            sx={{ cursor: 'pointer' }}
            onClick={() => onStockSelect(stock.symbol)}
          >
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {stock.symbol}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatPrice(stock.current_price)}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              color={typeof stock.change_percent === 'number' && stock.change_percent >= 0 ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {typeof stock.change_percent === 'number' && stock.change_percent >= 0 ? '+' : ''}{typeof stock.change_percent === 'number' ? stock.change_percent.toFixed(2) : '--'}%
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Market Dashboard
          </Typography>
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
        
        <Grid container spacing={3} mb={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
        
        <Typography variant="h5" gutterBottom>
          Trending Stocks
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton variant="rectangular" height={160} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={1}>
          <Assessment color="primary" />
          Market Dashboard
        </Typography>
        <IconButton onClick={handleRefresh} disabled={refreshing}>
          <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Market Stats */}
      {marketStats && (
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              title="Top Gainers" 
              stocks={marketStats.topGainers} 
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              title="Top Losers" 
              stocks={marketStats.topLosers} 
              color="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              title="Most Active" 
              stocks={marketStats.mostActive} 
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Market Overview
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {marketStats.totalStocks}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tracked Stocks
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Last updated: {new Date(marketStats.lastUpdated).toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Trending Stocks */}
      <Typography variant="h5" gutterBottom display="flex" alignItems="center" gap={1}>
        <TrendingUp color="primary" />
        Trending Stocks
      </Typography>
      
      <Grid container spacing={2}>
        {trendingStocks.map((stock) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={stock.symbol}>
            <StockCard 
              stock={stock} 
              onClick={() => onStockSelect(stock.symbol)}
            />
          </Grid>
        ))}
      </Grid>

      {trendingStocks.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No trending stocks available at the moment. Try refreshing the page.
        </Alert>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default Dashboard;