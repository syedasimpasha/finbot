from flask import Flask, request, jsonify, render_template
import yfinance as yf
import ta
import os
import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Technical Analysis Engine
def calculate_technical(df):
    try:
        df['RSI'] = ta.momentum.RSIIndicator(df['Close']).rsi()
        df['MACD'] = ta.trend.MACD(df['Close']).macd_diff()
        df['SMA_20'] = ta.trend.SMAIndicator(df['Close'], 20).sma_indicator()
        return df.tail(5).to_dict()
    except Exception as e:
        return {"error": str(e)}

# Prediction Model
def simple_prediction(df):
    last_price = df['Close'].iloc[-1]
    return {
        'intraday': round(last_price * 1.002, 2),
        'short_term': round(last_price * 1.015, 2),
        'long_term': round(last_price * 1.05, 2)
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    symbol = data.get('symbol', 'BTC-USD')
    asset_type = data.get('type', 'crypto')
    
    try:
        if asset_type == 'crypto':
            response = requests.get(
                f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={symbol}"
            )
            data = response.json()[0]
            return jsonify({
                'price': data['current_price'],
                'change': data['price_change_percentage_24h']
            })
        else:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period="1y")
            
            return jsonify({
                'technical': calculate_technical(df),
                'predictions': simple_prediction(df),
                'current_price': round(df['Close'].iloc[-1], 2)
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def widget():
    return render_template('widget.html')

if __name__ == '__main__':
    app.run(port=3000)
