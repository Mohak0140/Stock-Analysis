import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import requests
import json

class StockService:
    def __init__(self):
        # Popular stock symbols for trending
        self.popular_symbols = [
            'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
            'META', 'NVDA', 'NFLX', 'AMD', 'PYPL'
        ]
    
    def get_current_price(self, symbol):
        """Get real-time stock data for a symbol"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="2d")
            
            if len(hist) < 2:
                raise ValueError(f"Insufficient data for {symbol}")
            
            current_price = hist['Close'].iloc[-1]
            previous_close = hist['Close'].iloc[-2]
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100
            
            return {
                "symbol": symbol,
                "name": info.get('longName', symbol),
                "current_price": round(float(current_price), 2),
                "change": round(float(change), 2),
                "change_percent": round(float(change_percent), 2),
                "volume": int(hist['Volume'].iloc[-1]) if not pd.isna(hist['Volume'].iloc[-1]) else 0,
                "market_cap": info.get('marketCap'),
                "pe_ratio": info.get('trailingPE'),
                "sector": info.get('sector'),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise Exception(f"Error fetching data for {symbol}: {str(e)}")
    
    def get_historical_data(self, symbol, period="1y"):
        """Get historical stock data"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            if hist.empty:
                raise ValueError(f"No historical data found for {symbol}")
            
            # Convert to list of dictionaries for JSON serialization
            data = []
            for date, row in hist.iterrows():
                data.append({
                    "date": date.strftime('%Y-%m-%d'),
                    "open": round(float(row['Open']), 2),
                    "high": round(float(row['High']), 2),
                    "low": round(float(row['Low']), 2),
                    "close": round(float(row['Close']), 2),
                    "volume": int(row['Volume']) if not pd.isna(row['Volume']) else 0
                })
            
            return {
                "symbol": symbol,
                "period": period,
                "data": data
            }
        except Exception as e:
            raise Exception(f"Error fetching historical data for {symbol}: {str(e)}")
    
    def get_trending_stocks(self):
        """Get trending/popular stocks with current prices"""
        try:
            trending_data = []
            for symbol in self.popular_symbols:
                try:
                    stock_data = self.get_current_price(symbol)
                    trending_data.append(stock_data)
                except:
                    continue  # Skip if data not available
            
            return {
                "trending": trending_data,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise Exception(f"Error fetching trending stocks: {str(e)}")
    
    def search_stocks(self, query):
        """Search for stocks by symbol or company name"""
        try:
            # For simplicity, we'll search within our popular symbols
            # In a production app, you'd integrate with a proper search API
            results = []
            query_lower = query.lower()
            
            for symbol in self.popular_symbols:
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    company_name = info.get('longName', '').lower()
                    
                    if (query_lower in symbol.lower() or 
                        query_lower in company_name):
                        stock_data = self.get_current_price(symbol)
                        results.append(stock_data)
                except:
                    continue
            
            return {
                "query": query,
                "results": results,
                "count": len(results)
            }
        except Exception as e:
            raise Exception(f"Error searching stocks: {str(e)}")