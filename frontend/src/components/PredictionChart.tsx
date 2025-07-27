import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  ButtonGroup,
  Chip
} from '@mui/material';
import { Timeline, Psychology } from '@mui/icons-material';
import { stockAPI } from '../services/api';
import { PredictionResponse } from '../types/stock';

interface PredictionChartProps {
  symbol: string;
}

const PredictionChart: React.FC<PredictionChartProps> = ({ symbol }) => {
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const dayOptions = [7, 14, 30, 60];

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true);
        setError(null);
        const predictionData = await stockAPI.getPredictions(symbol, selectedDays);
        setPredictions(predictionData);
      } catch (err: any) {
        setError(err.message || 'Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, [symbol, selectedDays]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
            <Psychology color="primary" />
            Price Predictions
          </Typography>
          <ButtonGroup size="small">
            {dayOptions.map((days) => (
              <Button
                key={days}
                variant={selectedDays === days ? 'contained' : 'outlined'}
                onClick={() => setSelectedDays(days)}
              >
                {days}D
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        {predictions && (
          <Box>
            <Box display="flex" gap={2} mb={3}>
              <Chip 
                label={`Current: ${formatPrice(predictions.current_price)}`} 
                color="primary" 
                variant="outlined" 
              />
              {predictions.model_info?.methods_used && (
                <Chip 
                  label={`Methods: ${predictions.model_info.methods_used.join(', ')}`} 
                  variant="outlined" 
                />
              )}
              {predictions.model_info?.accuracy_metrics?.trend_direction && (
                <Chip 
                  label={`Trend: ${predictions.model_info.accuracy_metrics.trend_direction}`} 
                  color={predictions.model_info.accuracy_metrics.trend_direction === 'upward' ? 'success' : 'error'}
                  variant="outlined" 
                />
              )}
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {predictions.isMockData ? (
                  <>Predictions are generated using mock data for demonstration purposes. 
                  Real predictions require a configured prediction service.</>
                ) : (
                  <>Predictions are generated using ensemble auto-regression models including 
                  AutoRegression, Linear Regression, and ARIMA. These are estimates and should 
                  not be used as the sole basis for investment decisions.</>
                )}
              </Typography>
            </Alert>

            {predictions.predictions && predictions.predictions.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Prediction Summary
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {predictions.predictions.slice(0, 5).map((pred, index) => (
                    <Card key={index} variant="outlined" sx={{ minWidth: 150 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {pred.date}
                        </Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {formatPrice(pred.predicted_price)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color={pred.change_percent >= 0 ? 'success.main' : 'error.main'}
                        >
                          {pred.change_percent >= 0 ? '+' : ''}{pred.change_percent.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              {predictions.model_info?.accuracy_metrics?.recent_volatility_percent && (
                <>Volatility: {predictions.model_info.accuracy_metrics.recent_volatility_percent.toFixed(2)}% | </>
              )}
              {predictions.model_info?.accuracy_metrics?.data_points_used && (
                <>Data points: {predictions.model_info.accuracy_metrics.data_points_used} | </>
              )}
              Generated: {new Date(predictions.timestamp).toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictionChart;