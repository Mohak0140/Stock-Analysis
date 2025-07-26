import React from 'react';
import {
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Bookmark } from '@mui/icons-material';

interface WatchlistProps {
  onStockSelect: (symbol: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ onStockSelect }) => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3} display="flex" alignItems="center" gap={1}>
        <Bookmark color="primary" />
        My Watchlist
      </Typography>

      <Alert severity="info">
        Watchlist functionality will be implemented with user authentication. 
        For now, you can explore stocks through the Dashboard and Search features.
      </Alert>
    </Box>
  );
};

export default Watchlist;