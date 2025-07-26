import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  InputAdornment,
  Chip
} from '@mui/material';
import { Search, TrendingUp, TrendingDown } from '@mui/icons-material';
import { stockAPI } from '../services/api';
import { StockData } from '../types/stock';

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchStocks = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await stockAPI.searchStocks(query, 20);
        setResults(searchResults);
      } catch (err: any) {
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const StockCard: React.FC<{ stock: StockData }> = ({ stock }) => (
    <Card 
      sx={{ 
        cursor: 'pointer', 
        '&:hover': { 
          transform: 'translateY(-2px)',
          transition: 'transform 0.2s ease-in-out',
          boxShadow: 3
        }
      }}
      onClick={() => onStockSelect(stock.symbol)}
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
            {stock.sector && (
              <Chip 
                label={stock.sector} 
                size="small" 
                variant="outlined" 
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
          <Box textAlign="right">
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatPrice(stock.current_price)}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              {stock.change_percent >= 0 ? 
                <TrendingUp color="success" fontSize="small" /> : 
                <TrendingDown color="error" fontSize="small" />
              }
              <Typography
                color={typeof stock.change_percent === 'number' && stock.change_percent >= 0 ? 'success.main' : 'error.main'}
                fontWeight="medium"
                variant="body2"
              >
                {typeof stock.change_percent === 'number' && stock.change_percent >= 0 ? '+' : ''}{typeof stock.change_percent === 'number' ? stock.change_percent.toFixed(2) : '--'}%
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {stock.volume > 0 && (
          <Typography variant="caption" color="text.secondary">
            Volume: {stock.volume.toLocaleString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3} display="flex" alignItems="center" gap={1}>
        <Search color="primary" />
        Search Stocks
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by symbol or company name (e.g., AAPL, Apple Inc.)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: loading && (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {query.length > 0 && !loading && results.length === 0 && !error && (
        <Alert severity="info">
          No stocks found for "{query}". Try searching with a different term.
        </Alert>
      )}

      {results.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Search Results ({results.length})
          </Typography>
          <Grid container spacing={2}>
            {results.map((stock) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={stock.symbol}>
                <StockCard stock={stock} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {query.length === 0 && (
        <Box textAlign="center" py={4}>
          <Search sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Start typing to search for stocks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can search by stock symbol (e.g., AAPL) or company name (e.g., Apple Inc.)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StockSearch;