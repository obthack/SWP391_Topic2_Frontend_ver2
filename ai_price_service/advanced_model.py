import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os
from datetime import datetime, timedelta
import json

class EVPricePredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.encoders = {}
        self.feature_importance = None
        self.model_performance = {}
        
    def create_sample_dataset(self):
        """Tạo dataset mẫu cho thị trường xe điện Việt Nam"""
        brands = ['VinFast', 'Tesla', 'BMW', 'Mercedes', 'Audi', 'Porsche', 'Hyundai', 'Kia']
        models = {
            'VinFast': ['VF8', 'VF9', 'VF5', 'VF6', 'VF7'],
            'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X'],
            'BMW': ['iX3', 'iX', 'i3', 'i4'],
            'Mercedes': ['EQC', 'EQS', 'EQA', 'EQB'],
            'Audi': ['e-tron', 'Q4 e-tron', 'e-tron GT', 'e-tron Sportback'],
            'Porsche': ['Taycan', 'Taycan Cross Turismo'],
            'Hyundai': ['IONIQ 5', 'IONIQ 6'],
            'Kia': ['EV6', 'EV9']
        }
        
        conditions = ['excellent', 'good', 'fair', 'poor']
        fuel_types = ['electric', 'hybrid']
        transmissions = ['automatic', 'manual']
        locations = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng']
        
        data = []
        current_year = datetime.now().year
        
        # Tạo dữ liệu mẫu
        for brand in brands:
            for model_name in models.get(brand, [f'{brand} Model']):
                for year in range(2020, current_year + 1):
                    for condition in conditions:
                        for fuel_type in fuel_types:
                            for transmission in transmissions:
                                for location in locations:
                                    # Tạo mileage dựa trên năm
                                    base_mileage = (current_year - year) * 15000
                                    mileage = max(0, base_mileage + np.random.randint(-5000, 5000))
                                    
                                    # Tính giá cơ bản dựa trên brand và model
                                    base_price = self._get_base_price(brand, model_name, year)
                                    
                                    # Điều chỉnh giá theo các yếu tố
                                    price = self._adjust_price(base_price, {
                                        'year': year,
                                        'mileage': mileage,
                                        'condition': condition,
                                        'location': location,
                                        'fuel_type': fuel_type
                                    })
                                    
                                    data.append({
                                        'brand': brand,
                                        'model': model_name,
                                        'year': year,
                                        'mileage': mileage,
                                        'condition': condition,
                                        'fuelType': fuel_type,
                                        'transmission': transmission,
                                        'location': location,
                                        'price': price
                                    })
        
        return pd.DataFrame(data)
    
    def _get_base_price(self, brand, model, year):
        """Lấy giá cơ bản dựa trên brand và model"""
        brand_prices = {
            'VinFast': {'VF8': 1200000000, 'VF9': 1500000000, 'VF5': 800000000, 'VF6': 900000000, 'VF7': 1000000000},
            'Tesla': {'Model 3': 1500000000, 'Model Y': 1700000000, 'Model S': 2500000000, 'Model X': 2800000000},
            'BMW': {'iX3': 1800000000, 'iX': 2200000000, 'i3': 1200000000, 'i4': 2000000000},
            'Mercedes': {'EQC': 2000000000, 'EQS': 2500000000, 'EQA': 1500000000, 'EQB': 1600000000},
            'Audi': {'e-tron': 2200000000, 'Q4 e-tron': 1800000000, 'e-tron GT': 3000000000, 'e-tron Sportback': 2400000000},
            'Porsche': {'Taycan': 3500000000, 'Taycan Cross Turismo': 3800000000},
            'Hyundai': {'IONIQ 5': 1400000000, 'IONIQ 6': 1600000000},
            'Kia': {'EV6': 1300000000, 'EV9': 1800000000}
        }
        
        base_price = brand_prices.get(brand, {}).get(model, 1000000000)
        
        # Điều chỉnh theo năm
        current_year = datetime.now().year
        age_factor = max(0.3, 1 - (current_year - year) * 0.08)
        
        return int(base_price * age_factor)
    
    def _adjust_price(self, base_price, factors):
        """Điều chỉnh giá dựa trên các yếu tố"""
        price = base_price
        
        # Điều chỉnh theo mileage
        mileage = factors['mileage']
        if mileage > 100000:
            mileage_factor = 0.7
        elif mileage > 50000:
            mileage_factor = 0.8
        elif mileage > 20000:
            mileage_factor = 0.9
        else:
            mileage_factor = 1.0
        
        # Điều chỉnh theo tình trạng
        condition_factors = {
            'excellent': 1.0,
            'good': 0.85,
            'fair': 0.7,
            'poor': 0.5
        }
        condition_factor = condition_factors.get(factors['condition'], 0.8)
        
        # Điều chỉnh theo vị trí
        location_factors = {
            'Hà Nội': 1.1,
            'TP.HCM': 1.15,
            'Đà Nẵng': 1.0,
            'Cần Thơ': 0.95,
            'Hải Phòng': 0.9
        }
        location_factor = location_factors.get(factors['location'], 1.0)
        
        # Điều chỉnh theo loại nhiên liệu
        fuel_factor = 1.0 if factors['fuel_type'] == 'electric' else 0.9
        
        # Áp dụng tất cả các hệ số
        price = price * mileage_factor * condition_factor * location_factor * fuel_factor
        
        # Thêm noise để mô phỏng thực tế
        noise = np.random.normal(0, 0.05)  # 5% noise
        price = price * (1 + noise)
        
        return max(100000000, int(price))  # Giá tối thiểu 100 triệu
    
    def prepare_features(self, df):
        """Chuẩn bị features cho model"""
        # Encode categorical variables
        categorical_columns = ['brand', 'model', 'condition', 'fuelType', 'transmission', 'location']
        
        for col in categorical_columns:
            if col in df.columns:
                if col not in self.encoders:
                    self.encoders[col] = LabelEncoder()
                    df[f'{col}_encoded'] = self.encoders[col].fit_transform(df[col])
                else:
                    # Handle unseen categories
                    try:
                        df[f'{col}_encoded'] = self.encoders[col].transform(df[col])
                    except ValueError:
                        # Add unseen categories to encoder
                        unique_values = df[col].unique()
                        all_values = np.concatenate([self.encoders[col].classes_, unique_values])
                        self.encoders[col] = LabelEncoder()
                        self.encoders[col].fit(all_values)
                        df[f'{col}_encoded'] = self.encoders[col].transform(df[col])
        
        # Create additional features
        df['age'] = datetime.now().year - df['year']
        df['mileage_per_year'] = df['mileage'] / (df['age'] + 1)
        df['is_luxury'] = df['brand'].isin(['Tesla', 'BMW', 'Mercedes', 'Audi', 'Porsche']).astype(int)
        df['is_vietnamese'] = (df['brand'] == 'VinFast').astype(int)
        
        # Select features for training
        feature_columns = [
            'brand_encoded', 'model_encoded', 'year', 'mileage', 'condition_encoded',
            'fuelType_encoded', 'transmission_encoded', 'location_encoded',
            'age', 'mileage_per_year', 'is_luxury', 'is_vietnamese'
        ]
        
        return df[feature_columns]
    
    def train_model(self, df=None):
        """Train the price prediction model"""
        if df is None:
            df = self.create_sample_dataset()
        
        print(f"Training with {len(df)} samples")
        
        # Prepare features
        X = self.prepare_features(df.copy())
        y = df['price']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train ensemble model
        rf_model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        gb_model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            random_state=42
        )
        
        # Train models
        rf_model.fit(X_train_scaled, y_train)
        gb_model.fit(X_train_scaled, y_train)
        
        # Evaluate models
        rf_pred = rf_model.predict(X_test_scaled)
        gb_pred = gb_model.predict(X_test_scaled)
        
        # Ensemble prediction (weighted average)
        ensemble_pred = 0.6 * rf_pred + 0.4 * gb_pred
        
        # Calculate performance metrics
        self.model_performance = {
            'rf_mae': mean_absolute_error(y_test, rf_pred),
            'rf_r2': r2_score(y_test, rf_pred),
            'gb_mae': mean_absolute_error(y_test, gb_pred),
            'gb_r2': r2_score(y_test, gb_pred),
            'ensemble_mae': mean_absolute_error(y_test, ensemble_pred),
            'ensemble_r2': r2_score(y_test, ensemble_pred)
        }
        
        print("Model Performance:")
        for metric, value in self.model_performance.items():
            print(f"  {metric}: {value:.4f}")
        
        # Store models and scaler
        self.model = {
            'rf': rf_model,
            'gb': gb_model,
            'scaler': self.scaler,
            'encoders': self.encoders,
            'feature_columns': X.columns.tolist(),
            'performance': self.model_performance
        }
        
        # Feature importance
        self.feature_importance = dict(zip(X.columns, rf_model.feature_importances_))
        
        return self.model_performance
    
    def predict_price(self, vehicle_data):
        """Predict price for a single vehicle"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame([vehicle_data])
            
            # Prepare features
            X = self.prepare_features(df)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Predict with ensemble
            rf_pred = self.model['rf'].predict(X_scaled)[0]
            gb_pred = self.model['gb'].predict(X_scaled)[0]
            ensemble_pred = 0.6 * rf_pred + 0.4 * gb_pred
            
            # Calculate confidence based on feature similarity to training data
            confidence = self._calculate_confidence(vehicle_data)
            
            # Apply business rules
            adjusted_price = self._apply_business_rules(ensemble_pred, vehicle_data)
            
            return {
                'predicted_price': int(adjusted_price),
                'confidence': confidence,
                'rf_prediction': int(rf_pred),
                'gb_prediction': int(gb_pred),
                'ensemble_prediction': int(ensemble_pred),
                'factors': self._get_price_factors(vehicle_data, adjusted_price)
            }
            
        except Exception as e:
            print(f"Error in prediction: {e}")
            return {
                'predicted_price': 1000000000,
                'confidence': 0.3,
                'error': str(e)
            }
    
    def _calculate_confidence(self, vehicle_data):
        """Calculate prediction confidence"""
        confidence = 0.8  # Base confidence
        
        # Reduce confidence for very old vehicles
        current_year = datetime.now().year
        age = current_year - vehicle_data.get('year', current_year)
        if age > 10:
            confidence -= 0.2
        elif age > 5:
            confidence -= 0.1
        
        # Reduce confidence for very high mileage
        mileage = vehicle_data.get('mileage', 0)
        if mileage > 200000:
            confidence -= 0.2
        elif mileage > 100000:
            confidence -= 0.1
        
        # Reduce confidence for unknown brands/models
        brand = vehicle_data.get('brand', '')
        if brand not in ['VinFast', 'Tesla', 'BMW', 'Mercedes', 'Audi']:
            confidence -= 0.1
        
        return max(0.3, min(0.95, confidence))
    
    def _apply_business_rules(self, base_price, vehicle_data):
        """Apply business rules to adjust price"""
        price = base_price
        
        # Market volatility adjustment
        market_factor = 1.0  # Could be updated based on market conditions
        
        # Seasonal adjustment
        current_month = datetime.now().month
        if current_month in [11, 12, 1]:  # Holiday season
            market_factor *= 1.05
        elif current_month in [6, 7, 8]:  # Summer
            market_factor *= 0.98
        
        # Location-based adjustment
        location = vehicle_data.get('location', '')
        location_factors = {
            'Hà Nội': 1.05,
            'TP.HCM': 1.08,
            'Đà Nẵng': 1.0,
            'Cần Thơ': 0.95,
            'Hải Phòng': 0.92
        }
        location_factor = location_factors.get(location, 1.0)
        
        return int(price * market_factor * location_factor)
    
    def _get_price_factors(self, vehicle_data, final_price):
        """Get detailed price factors"""
        return {
            'age': datetime.now().year - vehicle_data.get('year', datetime.now().year),
            'mileage': vehicle_data.get('mileage', 0),
            'condition': vehicle_data.get('condition', 'good'),
            'brand': vehicle_data.get('brand', 'Unknown'),
            'location': vehicle_data.get('location', 'Unknown'),
            'market_trend': 'stable',  # Could be updated from external data
            'confidence_level': 'high' if self._calculate_confidence(vehicle_data) > 0.8 else 'medium'
        }
    
    def save_model(self, filepath='models/ev_price_model.pkl'):
        """Save trained model"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.model, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='models/ev_price_model.pkl'):
        """Load trained model"""
        if os.path.exists(filepath):
            self.model = joblib.load(filepath)
            self.scaler = self.model['scaler']
            self.encoders = self.model['encoders']
            self.model_performance = self.model['performance']
            print(f"Model loaded from {filepath}")
            return True
        return False

# Example usage
if __name__ == "__main__":
    predictor = EVPricePredictor()
    
    # Train model
    performance = predictor.train_model()
    
    # Save model
    predictor.save_model()
    
    # Test prediction
    test_data = {
        'brand': 'VinFast',
        'model': 'VF8',
        'year': 2023,
        'mileage': 5000,
        'condition': 'excellent',
        'fuelType': 'electric',
        'transmission': 'automatic',
        'location': 'Hà Nội'
    }
    
    prediction = predictor.predict_price(test_data)
    print("\nTest Prediction:")
    print(json.dumps(prediction, indent=2, ensure_ascii=False))
