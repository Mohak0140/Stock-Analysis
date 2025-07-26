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
import { TrendingUp, TrendingDown, Bookmark } from '@mui/icons-material';
import { stockAPI } from '../services/api';
import { StockData } from '../types/stock';

interface StockDetailProps {
  symbol: string;
}

const StockDetail: React.FC<StockDetailProps> = ({ symbol }) => {
  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStock = async () => {
      try {
        setLoading(true);
        setError(null);
        const stockData = await stockAPI.getStock(symbol);
        setStock(stockData);
      } catch (err: any) {
        setError(err.message || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [symbol]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
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
          variant="outlined"
          startIcon={<Bookmark />}
          onClick={() => {
            // TODO: Implement add to watchlist
            console.log('Add to watchlist:', stock.symbol);
          }}
        >
          Add to Watchlist
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Price
              </Typography>
              <Typography variant="h3" color="primary" fontWeight="bold" gutterBottom>
                {formatPrice(stock.currentPrice)}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {stock.changePercent >= 0 ? 
                  <TrendingUp color="success" /> : 
                  <TrendingDown color="error" />
                }
                <Typography
                  color={stock.changePercent >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                  variant="h6"
                >
                  {stock.changePercent >= 0 ? '+' : ''}{stock.change.toFixed(2)} 
                  ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
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
                    <Typography>{stock.pe_ratio.toFixed(2)}</Typography>
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