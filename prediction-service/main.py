from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List
import logging
import warnings
from services.prediction_service import PredictionService
from models.prediction_models import PredictionResponse, HealthResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress warnings
warnings.filterwarnings('ignore')

app = FastAPI(
    title="Stock Prediction Service",
    description="Auto-regression based stock price prediction service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize prediction service
prediction_service = PredictionService()

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Stock Prediction Service",
        "version": "1.0.0",
        "description": "Auto-regression based stock price prediction",
        "endpoints": {
            "predict": "/predict/{symbol}",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        service="prediction-service",
        version="1.0.0"
    )

@app.get("/predict/{symbol}", response_model=PredictionResponse)
async def predict_stock_price(
    symbol: str,
    days: int = Query(default=30, ge=1, le=365, description="Number of days to predict")
):
    """
    Predict stock prices using auto-regression models
    
    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL)
        days: Number of days to predict (1-365)
    
    Returns:
        Prediction data with confidence intervals and model information
    """
    try:
        logger.info(f"Generating predictions for {symbol} for {days} days")
        
        # Get predictions from service
        predictions = await prediction_service.predict_prices(symbol.upper(), days)
        
        return predictions
        
    except ValueError as e:
        logger.error(f"Validation error for {symbol}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error predicting prices for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/models/info")
async def get_model_info():
    """Get information about available prediction models"""
    return {
        "available_models": [
            {
                "name": "AutoRegression",
                "description": "Time series autoregression using statsmodels",
                "optimal_for": "Short to medium term predictions"
            },
            {
                "name": "Linear Regression",
                "description": "Linear regression with technical indicators",
                "optimal_for": "Trend-based predictions"
            },
            {
                "name": "ARIMA",
                "description": "AutoRegressive Integrated Moving Average",
                "optimal_for": "Time series with trends and seasonality"
            }
        ],
        "ensemble_method": "Average of all models",
        "confidence_interval": "95% confidence bounds"
    }

@app.get("/supported-symbols")
async def get_supported_symbols():
    """Get list of supported stock symbols"""
    popular_symbols = [
        'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
        'META', 'NVDA', 'NFLX', 'AMD', 'PYPL',
        'SPY', 'QQQ', 'IWM', 'DIA', 'VOO'
    ]
    
    return {
        "popular_symbols": popular_symbols,
        "note": "Service supports any valid stock symbol available on Yahoo Finance"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)