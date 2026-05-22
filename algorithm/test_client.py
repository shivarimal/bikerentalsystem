import requests
import json
import numpy as np

# Base URL
BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print("Health Check:", response.json())
    return response.status_code == 200

def test_train():
    """Test training endpoint"""
    # Generate sample data: y = 2x + 3 + noise
    np.random.seed(42)
    X = np.random.rand(100, 1) * 10
    y = 2 * X.squeeze() + 3 + np.random.randn(100) * 0.5
    
    train_data = {
        "features": X.tolist(),
        "targets": y.tolist(),
        "method": "gradient_descent",
        "learning_rate": 0.01,
        "n_iterations": 1000
    }
    
    response = requests.post(f"{BASE_URL}/train", json=train_data)
    print("\nTraining Response:")
    print(json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_predict():
    """Test prediction endpoint"""
    predict_data = {
        "features": [[1.5], [2.5], [5.0], [7.5]]
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=predict_data)
    print("\nPrediction Response:")
    print(json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_model_info():
    """Test model info endpoint"""
    response = requests.get(f"{BASE_URL}/model/info")
    print("\nModel Info:")
    print(json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_multi_feature():
    """Test with multiple features"""
    # Generate multi-feature data: y = 1*x1 + 2*x2 + 3
    np.random.seed(42)
    X = np.random.rand(100, 2) * 10
    y = 1*X[:, 0] + 2*X[:, 1] + 3 + np.random.randn(100) * 0.5
    
    train_data = {
        "features": X.tolist(),
        "targets": y.tolist(),
        "method": "normal_equation"
    }
    
    response = requests.post(f"{BASE_URL}/train", json=train_data)
    print("\nMulti-feature Training Response:")
    print(json.dumps(response.json(), indent=2))
    
    # Make predictions
    predict_data = {
        "features": [[2, 3], [4, 5], [6, 7]]
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=predict_data)
    print("\nMulti-feature Predictions:")
    print(json.dumps(response.json(), indent=2))
    
    return response.status_code == 200

def test_clear_model():
    """Test clear model endpoint"""
    response = requests.delete(f"{BASE_URL}/model/clear")
    print("\nClear Model Response:")
    print(json.dumps(response.json(), indent=2))
    return response.status_code == 200

if __name__ == "__main__":
    print("=" * 50)
    print("TESTING LINEAR REGRESSION API")
    print("=" * 50)
    
    # Run tests
    tests = [
        ("Health Check", test_health),
        ("Train Model", test_train),
        ("Predict", test_predict),
        ("Model Info", test_model_info),
        ("Multi-feature", test_multi_feature),
        ("Clear Model", test_clear_model)
    ]
    
    for test_name, test_func in tests:
        print(f"\n--- Running {test_name} ---")
        if test_func():
            print(f"✅ {test_name} passed")
        else:
            print(f"❌ {test_name} failed")