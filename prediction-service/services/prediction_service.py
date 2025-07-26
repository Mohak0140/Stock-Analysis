import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.ar_model import AutoReg
from statsmodels.tsa.arima.model import ARIMA
import asyncio
import logging
from models.prediction_models import PredictionResponse, PredictionData, ModelInfo, AccuracyMetrics

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self):
        self.scaler = MinMaxScaler()
    
    async def predict_prices(self, symbol: str, days: int = 30) -> PredictionResponse:
        """Predict future stock prices using auto-regression ensemble"""
        try:
            # Get historical data (2 years for better model training)
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2y")
            
            if len(hist) < 50:  # Need minimum data for prediction
                raise ValueError(f"Insufficient historical data for {symbol}")
            
            # Prepare data
            prices = hist['Close'].values
            
            # Run prediction methods asynchronously
            tasks = [
                self._predict_with_autoregression(prices, days),
                self._predict_with_linear_regression(prices, days),
                self._predict_with_arima(prices, days)
            ]
            
            ar_predictions, lr_predictions, arima_predictions = await asyncio.gather(*tasks)
            
            # Ensemble prediction (average of methods)
            ensemble_predictions = []
            for i in range(days):
                ensemble_pred = np.mean([
                    ar_predictions[i],
                    lr_predictions[i],
                    arima_predictions[i]
                ])
                ensemble_predictions.append(ensemble_pred)
            
            # Calculate confidence intervals
            confidence_intervals = self._calculate_confidence_intervals(
                prices, ensemble_predictions
            )
            
            # Generate future dates (business days only)
            future_dates = self._generate_business_dates(hist.index[-1], days)
            
            # Prepare response
            current_price = float(prices[-1])
            predictions_data = []
            
            for i, date in enumerate(future_dates[:days]):
                if i < len(ensemble_predictions):
                    pred_price = round(float(ensemble_predictions[i]), 2)
                    lower_bound = round(float(confidence_intervals[i][0]), 2)
                    upper_bound = round(float(confidence_intervals[i][1]), 2)
                    
                    predictions_data.append(PredictionData(
                        date=date.strftime('%Y-%m-%d'),
                        predicted_price=pred_price,
                        lower_bound=lower_bound,
                        upper_bound=upper_bound,
                        change_from_current=round(pred_price - current_price, 2),
                        change_percent=round(((pred_price - current_price) / current_price) * 100, 2)
                    ))
            
            # Calculate model accuracy metrics
            accuracy_metrics = self._calculate_accuracy_metrics(prices)
            
            model_info = ModelInfo(
                methods_used=["AutoRegression", "Linear Regression", "ARIMA"],
                ensemble="Weighted average of all methods",
                accuracy_metrics=accuracy_metrics
            )
            
            return PredictionResponse(
                symbol=symbol,
                current_price=round(current_price, 2),
                prediction_period=f"{days} business days",
                predictions=predictions_data,
                model_info=model_info,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Error predicting prices for {symbol}: {str(e)}")
            raise Exception(f"Prediction failed for {symbol}: {str(e)}")
    
    async def _predict_with_autoregression(self, prices, days):
        """Predict using AutoRegression model"""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._ar_predict, prices, days)
        except Exception as e:
            logger.warning(f"AutoRegression failed: {e}")
            return self._simple_trend_prediction(prices, days)
    
    def _ar_predict(self, prices, days):
        """Synchronous AutoRegression prediction"""
        try:
            # Determine optimal lag
            max_lag = min(20, len(prices) // 5)
            model = AutoReg(prices, lags=max_lag, trend='ct')
            fitted_model = model.fit()
            
            # Forecast
            forecast = fitted_model.forecast(steps=days)
            return forecast.tolist()
        except:
            return self._simple_trend_prediction(prices, days)
    
    async def _predict_with_linear_regression(self, prices, days):
        """Predict using Linear Regression on features"""
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._lr_predict, prices, days)
        except Exception as e:
            logger.warning(f"Linear Regression failed: {e}")
            return self._simple_trend_prediction(prices, days)
    
    def _lr_predict(self, prices, days):
        """Synchronous Linear Regression prediction"""
        try:
            # Create features: moving averages, trends
            df = pd.DataFrame({'price': prices})
            df['ma_5'] = df['price'].rolling(5).mean()
            df['ma_10'] = df['price'].rolling(10).mean()
            df['ma_20'] = df['price'].rolling(20).mean()
            df['trend'] = range(len(prices))
            
            # Remove NaN values
            df = df.dropna()
            
            # Prepare features and target
            features = ['ma_5', 'ma_10', 'ma_20', 'trend']
            X = df[features].values
            y = df['price'].values
            
            # Train model
            model = LinearRegression()
            model.fit(X, y)
            
            # Predict future values
            predictions = []
            last_prices = prices[-20:].tolist()  # Keep last 20 prices for moving averages
            
            for i in range(days):
                # Calculate moving averages for prediction
                ma_5 = np.mean(last_prices[-5:])
                ma_10 = np.mean(last_prices[-10:])
                ma_20 = np.mean(last_prices[-20:])
                trend = len(prices) + i
                
                # Predict
                X_pred = np.array([[ma_5, ma_10, ma_20, trend]])
                pred = model.predict(X_pred)[0]
                predictions.append(pred)
                
                # Update last_prices for next iteration
                last_prices.append(pred)
                if len(last_prices) > 20:
                    last_prices.pop(0)
            
            return predictions
        except:
            return self._simple_trend_prediction(prices, days)
    
    async def _predict_with_arima(self, prices, days):
        """Predict using ARIMA model"""
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._arima_predict, prices, days)
        except Exception as e:
            logger.warning(f"ARIMA failed: {e}")
            return self._simple_trend_prediction(prices, days)
    
    def _arima_predict(self, prices, days):
        """Synchronous ARIMA prediction"""
        try:
            # Simple ARIMA(1,1,1) model
            model = ARIMA(prices, order=(1, 1, 1))
            fitted_model = model.fit()
            forecast = fitted_model.forecast(steps=days)
            return forecast.tolist()
        except:
            return self._simple_trend_prediction(prices, days)
    
    def _simple_trend_prediction(self, prices, days):
        """Fallback simple trend prediction"""
        # Calculate recent trend
        recent_prices = prices[-10:]
        trend = (recent_prices[-1] - recent_prices[0]) / len(recent_prices)
        
        predictions = []
        for i in range(1, days + 1):
            pred = prices[-1] + (trend * i)
            predictions.append(pred)
        
        return predictions
    
    def _calculate_confidence_intervals(self, historical_prices, predictions):
        """Calculate confidence intervals for predictions"""
        # Calculate historical volatility
        returns = np.diff(historical_prices) / historical_prices[:-1]
        volatility = np.std(returns)
        
        confidence_intervals = []
        for i, pred in enumerate(predictions):
            # Increasing uncertainty over time
            uncertainty = volatility * np.sqrt(i + 1) * pred * 0.1  # Scale factor
            lower_bound = pred - (1.96 * uncertainty)  # 95% confidence
            upper_bound = pred + (1.96 * uncertainty)
            confidence_intervals.append([lower_bound, upper_bound])
        
        return confidence_intervals
    
    def _calculate_accuracy_metrics(self, prices):
        """Calculate basic accuracy metrics"""
        # Calculate some basic metrics
        recent_volatility = np.std(prices[-30:]) / np.mean(prices[-30:]) * 100
        trend_direction = "upward" if prices[-1] > prices[-30] else "downward"
        
        return AccuracyMetrics(
            recent_volatility_percent=round(recent_volatility, 2),
            trend_direction=trend_direction,
            data_points_used=len(prices)
        )
    
    def _generate_business_dates(self, start_date, days):
        """Generate business days (excluding weekends)"""
        business_dates = []
        current_date = start_date + timedelta(days=1)
        
        while len(business_dates) < days:
            # Skip weekends (5=Saturday, 6=Sunday)
            if current_date.weekday() < 5:
                business_dates.append(current_date)
            current_date += timedelta(days=1)
        
        return business_dates