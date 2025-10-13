#!/usr/bin/env python3
"""
Startup script for AI Price Prediction Service
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    print(f" Python {sys.version.split()[0]} detected")

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print(" Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f" Failed to install dependencies: {e}")
        sys.exit(1)

def create_directories():
    """Create necessary directories"""
    directories = ["models", "logs"]
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
    print(" Directories created")

def test_ai_service():
    """Test if AI service is working"""
    print(" Testing AI service...")
    
    # Start the service in background
    process = subprocess.Popen([sys.executable, "app.py"], 
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE)
    
    # Wait for service to start
    time.sleep(5)
    
    try:
        # Test health endpoint
        response = requests.get("http://localhost:5000/health", timeout=10)
        if response.status_code == 200:
            print("✅ AI service is healthy")
            
            # Test prediction endpoint
            test_data = {
                "brand": "VinFast",
                "model": "VF8",
                "year": 2023,
                "mileage": 5000,
                "condition": "excellent",
                "fuelType": "electric",
                "transmission": "automatic",
                "location": "Hà Nội"
            }
            
            response = requests.post("http://localhost:5000/predict-price", 
                                   json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    price = result["prediction"]["predicted_price"]
                    print(f"✅ AI prediction test successful: {price:,} VND")
                else:
                    print("❌ AI prediction test failed")
            else:
                print("❌ AI prediction endpoint test failed")
        else:
            print("❌ AI service health check failed")
    except requests.RequestException as e:
        print(f"❌ Failed to test AI service: {e}")
    finally:
        # Stop the service
        process.terminate()
        process.wait()

def main():
    """Main startup function"""
    print("🚀 Starting AI Price Prediction Service...")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Install dependencies
    install_dependencies()
    
    # Create directories
    create_directories()
    
    # Test service
    test_ai_service()
    
    print("=" * 50)
    print("🎉 Setup completed!")
    print("\nTo start the service:")
    print("  python app.py")
    print("\nTo start with Docker:")
    print("  docker-compose up -d")
    print("\nTo test the API:")
    print("  curl http://localhost:5000/health")

if __name__ == "__main__":
    main()
