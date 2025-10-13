from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import json
from datetime import datetime
from advanced_model import EVPricePredictor

app = Flask(__name__)
CORS(app)

# Global variables for model and encoders
model = None
brand_encoder = LabelEncoder()
condition_encoder = LabelEncoder()
fuel_type_encoder = LabelEncoder()
transmission_encoder = LabelEncoder()

# Advanced AI predictor
ai_predictor = EVPricePredictor()

def load_or_train_model():
    """Load existing model or train a new one with sample data"""
    global model, brand_encoder, condition_encoder, fuel_type_encoder, transmission_encoder, ai_predictor
    
    # Try to load advanced model first
    if ai_predictor.load_model():
        print("Advanced AI model loaded successfully")
        return
    
    # Fallback to simple model
    model_path = 'models/price_prediction_model.pkl'
    
    if os.path.exists(model_path):
        # Load existing model
        model_data = joblib.load(model_path)
        model = model_data['model']
        brand_encoder = model_data['brand_encoder']
        condition_encoder = model_data['condition_encoder']
        fuel_type_encoder = model_data['fuel_type_encoder']
        transmission_encoder = model_data['transmission_encoder']
        print("Simple model loaded successfully")
    else:
        # Train new advanced model
        print("Training new advanced AI model...")
        ai_predictor.train_model()
        ai_predictor.save_model()
        print("Advanced AI model trained and saved")

def train_sample_model():
    """Train model with sample EV data"""
    global model, brand_encoder, condition_encoder, fuel_type_encoder, transmission_encoder
    
    # Sample data for Vietnamese EV market
    sample_data = {
        'brand': ['VinFast', 'Tesla', 'BMW', 'Mercedes', 'Audi', 'VinFast', 'Tesla', 'BMW', 'Mercedes', 'Audi',
                  'VinFast', 'Tesla', 'BMW', 'Mercedes', 'Audi', 'VinFast', 'Tesla', 'BMW', 'Mercedes', 'Audi'],
        'model': ['VF8', 'Model 3', 'iX3', 'EQC', 'e-tron', 'VF9', 'Model Y', 'iX', 'EQS', 'Q4 e-tron',
                  'VF8', 'Model S', 'i3', 'EQA', 'e-tron GT', 'VF9', 'Model X', 'i4', 'EQB', 'e-tron Sportback'],
        'year': [2023, 2023, 2023, 2023, 2023, 2024, 2024, 2024, 2024, 2024,
                 2022, 2022, 2022, 2022, 2022, 2021, 2021, 2021, 2021, 2021],
        'mileage': [5000, 10000, 15000, 8000, 12000, 2000, 5000, 7000, 3000, 9000,
                    25000, 30000, 20000, 18000, 22000, 40000, 35000, 45000, 38000, 42000],
        'condition': ['excellent', 'excellent', 'good', 'excellent', 'good', 'excellent', 'excellent', 'good', 'excellent', 'good',
                      'good', 'good', 'fair', 'good', 'fair', 'fair', 'fair', 'poor', 'fair', 'poor'],
        'fuelType': ['electric', 'electric', 'electric', 'electric', 'electric', 'electric', 'electric', 'electric', 'electric', 'electric',
                     'electric', 'electric', 'electric', 'electric', 'electric', 'electric', 'electric', 'electric', 'electric', 'electric'],
        'transmission': ['automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic',
                         'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic', 'automatic'],
        'price': [1200000000, 1500000000, 1800000000, 2000000000, 2200000000, 1400000000, 1700000000, 2000000000, 2200000000, 2400000000,
                  1000000000, 1300000000, 1600000000, 1800000000, 2000000000, 800000000, 1100000000, 1400000000, 1600000000, 1800000000]
    }
    
    df = pd.DataFrame(sample_data)
    
    # Encode categorical variables
    df['brand_encoded'] = brand_encoder.fit_transform(df['brand'])
    df['condition_encoded'] = condition_encoder.fit_transform(df['condition'])
    df['fuelType_encoded'] = fuel_type_encoder.fit_transform(df['fuelType'])
    df['transmission_encoded'] = transmission_encoder.fit_transform(df['transmission'])
    
    # Prepare features
    features = ['brand_encoded', 'year', 'mileage', 'condition_encoded', 'fuelType_encoded', 'transmission_encoded']
    X = df[features]
    y = df['price']
    
    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save model and encoders
    os.makedirs('models', exist_ok=True)
    model_data = {
        'model': model,
        'brand_encoder': brand_encoder,
        'condition_encoder': condition_encoder,
        'fuel_type_encoder': fuel_type_encoder,
        'transmission_encoder': transmission_encoder
    }
    joblib.dump(model_data, 'models/price_prediction_model.pkl')
    print("Model trained and saved")

def predict_price(vehicle_data):
    """Predict price based on vehicle data using advanced AI model"""
    try:
        # Use advanced AI predictor if available
        if ai_predictor.model is not None:
            return ai_predictor.predict_price(vehicle_data)
        
        # Fallback to simple model
        # Prepare input data
        input_data = {
            'brand': vehicle_data.get('brand', 'VinFast'),
            'year': int(vehicle_data.get('year', 2023)),
            'mileage': int(vehicle_data.get('mileage', 0)),
            'condition': vehicle_data.get('condition', 'good'),
            'fuelType': vehicle_data.get('fuelType', 'electric'),
            'transmission': vehicle_data.get('transmission', 'automatic'),
            'location': vehicle_data.get('location', 'Hà Nội')
        }
        
        # Encode categorical variables
        try:
            brand_encoded = brand_encoder.transform([input_data['brand']])[0]
        except ValueError:
            # If brand not in training data, use most common
            brand_encoded = 0
            
        try:
            condition_encoded = condition_encoder.transform([input_data['condition']])[0]
        except ValueError:
            condition_encoded = 1
            
        try:
            fuel_type_encoded = fuel_type_encoder.transform([input_data['fuelType']])[0]
        except ValueError:
            fuel_type_encoded = 0
            
        try:
            transmission_encoded = transmission_encoder.transform([input_data['transmission']])[0]
        except ValueError:
            transmission_encoded = 0
        
        # Create feature array
        features = np.array([[brand_encoded, input_data['year'], input_data['mileage'], 
                            condition_encoded, fuel_type_encoded, transmission_encoded]])
        
        # Predict price
        predicted_price = model.predict(features)[0]
        
        # Apply some business logic adjustments
        current_year = datetime.now().year
        age_factor = max(0.5, 1 - (current_year - input_data['year']) * 0.1)
        mileage_factor = max(0.6, 1 - (input_data['mileage'] / 100000) * 0.3)
        
        adjusted_price = predicted_price * age_factor * mileage_factor
        
        return {
            'predicted_price': int(adjusted_price),
            'confidence': 0.85,  # Mock confidence score
            'factors': {
                'age_factor': age_factor,
                'mileage_factor': mileage_factor,
                'base_prediction': int(predicted_price)
            }
        }
        
    except Exception as e:
        print(f"Error in prediction: {e}")
        return {
            'predicted_price': 1000000000,  # Default fallback
            'confidence': 0.5,
            'error': str(e)
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'AI Price Prediction'})

@app.route('/predict-price', methods=['POST'])
def predict_vehicle_price():
    """Predict vehicle price based on input data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['brand', 'year']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Predict price
        result = predict_price(data)
        
        return jsonify({
            'success': True,
            'prediction': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model with new data"""
    try:
        data = request.get_json()
        
        if not data or 'training_data' not in data:
            return jsonify({'error': 'No training data provided'}), 400
        
        # This would implement retraining with new data
        # For now, just retrain with sample data
        train_sample_model()
        
        return jsonify({
            'success': True,
            'message': 'Model retrained successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    # Initialize model on startup
    load_or_train_model()
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
