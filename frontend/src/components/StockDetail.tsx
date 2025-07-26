import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Button
} from '@mui/material';
import { TrendingUp, TrendingDown, Bookmark, BookmarkAdded } from '@mui/icons-material';
import { stockAPI, userAPI } from '../services/api';
import { StockData } from '../types/stock';
import { useAuth } from '../contexts/AuthContext';

interface StockDetailProps {
  symbol: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ symbol }) => {
  const { user, refreshUser } = useAuth();
  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  useEffect(() => {
    const loadStock = async () => {
      try {
        setLoading(true);
        setError(null);
        const stockData = await stockAPI.getStock(symbol);
        setStock(stockData);
        
        // Check if stock is in user's watchlist
        if (user?.watchlist) {
          const inWatchlist = user.watchlist.some(item => item.symbol === symbol.toUpperCase());
          setIsInWatchlist(inWatchlist);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [symbol, user?.watchlist]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleWatchlistToggle = async () => {
    if (!stock) return;
    
    try {
      setAddingToWatchlist(true);
      
      if (isInWatchlist) {
        await userAPI.removeFromWatchlist(stock.symbol);
        setIsInWatchlist(false);
      } else {
        await userAPI.addToWatchlist(stock.symbol);
        setIsInWatchlist(true);
      }
      
      // Refresh user data to update watchlist
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update watchlist');
    } finally {
      setAddingToWatchlist(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!stock) {
    return (
      <Alert severity="info">
        No data available for {symbol}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {stock.symbol}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {stock.name}
          </Typography>
        </Box>
        <Button
          variant={isInWatchlist ? "contained" : "outlined"}
          startIcon={isInWatchlist ? <BookmarkAdded /> : <Bookmark />}
          onClick={handleWatchlistToggle}
          disabled={addingToWatchlist}
          color={isInWatchlist ? "success" : "primary"}
        >
          {addingToWatchlist 
            ? 'Updating...' 
            : isInWatchlist 
              ? 'In Watchlist' 
              : 'Add to Watchlist'
          }
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Price
              </Typography>
              <Typography variant="h3" color="primary" fontWeight="bold" gutterBottom>
                {formatPrice(stock.current_price)}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {stock.change_percent >= 0 ? 
                  <TrendingUp color="success" /> : 
                  <TrendingDown color="error" />
                }
                <Typography
                  color={stock.change_percent >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                  variant="h6"
                >
                  {typeof stock.change === 'number' && stock.change >= 0 ? '+' : ''}{typeof stock.change === 'number' ? stock.change.toFixed(2) : '--'} 
                  ({typeof stock.change_percent === 'number' && stock.change_percent >= 0 ? '+' : ''}{typeof stock.change_percent === 'number' ? stock.change_percent.toFixed(2) : '--'}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Information
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {stock.sector && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Sector:</Typography>
                    <Chip label={stock.sector} size="small" />
                  </Box>
                )}
                {stock.volume > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Volume:</Typography>
                    <Typography>{stock.volume.toLocaleString()}</Typography>
                  </Box>
                )}
                {stock.market_cap && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Market Cap:</Typography>
                    <Typography>{stock.market_cap.toLocaleString()}</Typography>
                  </Box>
                )}
                {stock.pe_ratio && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">P/E Ratio:</Typography>
                    <Typography>{typeof stock.pe_ratio === 'number' ? stock.pe_ratio.toFixed(2) : '--'}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StockDetail;