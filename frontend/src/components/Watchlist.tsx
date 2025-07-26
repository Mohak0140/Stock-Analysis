import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  CircularProgress,
  Button,
  Fab
} from '@mui/material';
import { 
  Bookmark, 
  Delete as DeleteIcon, 
  TrendingUp, 
  TrendingDown,
  Add as AddIcon 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';

interface WatchlistProps {
  onStockSelect: (symbol: string) => void;
}

interface WatchlistItem {
  symbol: string;
  addedAt: string;
  alertPrice?: number;
  notes?: string;
  stockData?: {
    symbol: string;
    name: string;
    currentPrice: number;
    change: number;
    changePercent: number;
    volume: number;
    sector?: string;
  };
}

const Watchlist: React.FC<WatchlistProps> = ({ onStockSelect }) => {
  const { user, refreshUser } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const watchlistData = await userAPI.getWatchlist(true); // populate with stock data
      setWatchlist(watchlistData);
    } catch (err: any) {
      setError(err.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (symbol: string) => {
    try {
      await userAPI.removeFromWatchlist(symbol);
      setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
      await refreshUser(); // Update user context
    } catch (err: any) {
      setError(err.message || 'Failed to remove from watchlist');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const WatchlistCard: React.FC<{ item: WatchlistItem }> = ({ item }) => (
    <Card 
      sx={{ 
        cursor: 'pointer', 
        '&:hover': { 
          transform: 'translateY(-2px)',
          transition: 'transform 0.2s ease-in-out',
          boxShadow: 3
        }
      }}
      onClick={() => onStockSelect(item.symbol)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {item.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {item.stockData?.name || 'Loading...'}
            </Typography>
            {item.stockData?.sector && (
              <Chip 
                label={item.stockData.sector} 
                size="small" 
                variant="outlined" 
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
          <Box textAlign="right">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFromWatchlist(item.symbol);
              }}
              sx={{ ml: 1 }}
            >
              <DeleteIcon color="error" />
            </IconButton>
          </Box>
        </Box>
        
        {item.stockData && (
          <>
            <Typography variant="h6" color="primary" fontWeight="bold" mb={1}>
              {formatPrice(item.stockData.currentPrice)}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={0.5}>
              {item.stockData.changePercent >= 0 ? 
                <TrendingUp color="success" fontSize="small" /> : 
                <TrendingDown color="error" fontSize="small" />
              }
              <Typography
                color={typeof item.stockData.changePercent === 'number' && item.stockData.changePercent >= 0 ? 'success.main' : 'error.main'}
                fontWeight="medium"
                variant="body2"
              >
                {typeof item.stockData.changePercent === 'number' && item.stockData.changePercent >= 0 ? '+' : ''}
                {typeof item.stockData.change === 'number' ? item.stockData.change.toFixed(2) : '--'} 
                ({typeof item.stockData.changePercent === 'number' && item.stockData.changePercent >= 0 ? '+' : ''}
                {typeof item.stockData.changePercent === 'number' ? item.stockData.changePercent.toFixed(2) : '--'}%)
              </Typography>
            </Box>

            {item.alertPrice && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Alert at: {formatPrice(item.alertPrice)}
              </Typography>
            )}

            {item.notes && (
              <Typography variant="caption" color="text.secondary" display="block">
                Note: {item.notes}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" mb={3} display="flex" alignItems="center" gap={1}>
          <Bookmark color="primary" />
          My Watchlist
        </Typography>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3} display="flex" alignItems="center" gap={1}>
        <Bookmark color="primary" />
        My Watchlist
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {watchlist.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Bookmark sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your watchlist is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Add stocks to your watchlist to track their performance and get personalized insights.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => onStockSelect('')} // This will navigate to search or dashboard
          >
            Browse Stocks
          </Button>
        </Box>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" mb={3}>
            You're watching {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''}
          </Typography>
          
          <Grid container spacing={2}>
            {watchlist.map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.symbol}>
                <WatchlistCard item={item} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Watchlist;