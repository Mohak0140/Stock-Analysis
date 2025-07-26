from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from services.stock_service import StockService
from services.prediction_service import PredictionService

app = Flask(__name__)
CORS(app)

# Initialize services
stock_service = StockService()
prediction_service = PredictionService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    """Get current stock data for a symbol"""
    try:
        data = stock_service.get_current_price(symbol.upper())
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stock/<symbol>/history', methods=['GET'])
def get_stock_history(symbol):
    """Get historical stock data"""
    try:
        period = request.args.get('period', '1y')  # Default to 1 year
        data = stock_service.get_historical_data(symbol.upper(), period)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stock/<symbol>/predict', methods=['GET'])
def predict_stock_price(symbol):
    """Get stock price predictions using auto-regression"""
    try:
        days = int(request.args.get('days', 30))  # Default to 30 days
        data = prediction_service.predict_prices(symbol.upper(), days)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/stocks/trending', methods=['GET'])
def get_trending_stocks():
    """Get trending/popular stocks"""
    try:
        data = stock_service.get_trending_stocks()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/search/<query>', methods=['GET'])
def search_stocks(query):
    """Search for stocks by symbol or company name"""
    try:
        data = stock_service.search_stocks(query)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)