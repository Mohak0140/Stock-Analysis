from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any

class PredictionData(BaseModel):
    date: str = Field(..., description="Prediction date in YYYY-MM-DD format")
    predicted_price: float = Field(..., description="Predicted stock price")
    lower_bound: float = Field(..., description="Lower confidence bound")
    upper_bound: float = Field(..., description="Upper confidence bound")
    change_from_current: float = Field(..., description="Change from current price")
    change_percent: float = Field(..., description="Percentage change from current price")

class AccuracyMetrics(BaseModel):
    recent_volatility_percent: float = Field(..., description="Recent volatility percentage")
    trend_direction: str = Field(..., description="Overall trend direction")
    data_points_used: int = Field(..., description="Number of historical data points used")

class ModelInfo(BaseModel):
    methods_used: List[str] = Field(..., description="List of prediction methods used")
    ensemble: str = Field(..., description="Ensemble method description")
    accuracy_metrics: AccuracyMetrics = Field(..., description="Model accuracy metrics")

class PredictionResponse(BaseModel):
    symbol: str = Field(..., description="Stock symbol")
    current_price: float = Field(..., description="Current stock price")
    prediction_period: str = Field(..., description="Prediction time period")
    predictions: List[PredictionData] = Field(..., description="List of predictions")
    model_info: ModelInfo = Field(..., description="Information about the prediction models")
    timestamp: datetime = Field(..., description="Timestamp when prediction was generated")

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status")
    timestamp: datetime = Field(..., description="Health check timestamp")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")

class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Error message")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")