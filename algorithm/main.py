from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import numpy as np
from sklearn.neighbors import NearestNeighbors
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
import os
import math
import pickle

# ==========================================
# 1. Pydantic Models
# ==========================================

class TrainRequest(BaseModel):
    """Request model for training endpoint"""
    features: List[List[float]] = Field(..., description="Feature matrix (list of samples)")
    targets: List[float] = Field(..., description="Target values")
    method: Optional[str] = Field("gradient_descent", description="Training method: 'gradient_descent' or 'normal_equation'")
    learning_rate: Optional[float] = Field(0.01, description="Learning rate for gradient descent")
    n_iterations: Optional[int] = Field(1000, description="Number of iterations for gradient descent")
    
    class Config:
        json_schema_extra = {
            "example": {
                "features": [[1.0, 2.0], [2.0, 3.0], [3.0, 4.0]],
                "targets": [3.0, 5.0, 7.0],
                "method": "gradient_descent",
                "learning_rate": 0.01,
                "n_iterations": 1000
            }
        }

class PredictRequest(BaseModel):
    """Request model for prediction endpoint"""
    features: List[List[float]] = Field(..., description="Feature matrix for prediction")
    
    class Config:
        json_schema_extra = {
            "example": {
                "features": [[1.5, 2.5], [2.5, 3.5]]
            }
        }

class TrainResponse(BaseModel):
    """Response model for training endpoint"""
    status: str
    message: str
    metrics: Dict[str, Any]
    parameters: Dict[str, Any]
    timestamp: datetime

class PredictResponse(BaseModel):
    """Response model for prediction endpoint"""
    status: str
    predictions: List[float]
    timestamp: datetime

class ModelInfoResponse(BaseModel):
    """Response model for model info endpoint"""
    status: str
    model_info: Dict[str, Any]
    timestamp: datetime

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    message: str
    timestamp: datetime

class BikeInfo(BaseModel):
    bike_id: str
    lat: Optional[float]
    lon: Optional[float]
    price: Optional[float]
    rating: Optional[float]
    bookings_count: Optional[int]
    extra: Optional[Dict[str, Any]] = None

class RecommendRequest(BaseModel):
    """Request model for recommender endpoints"""
    user_id: Optional[str] = None
    user_location: Optional[Dict[str, float]] = None  # {"lat":.., "lon":..}
    bikes: List[Dict[str, Any]] = []
    top_n: Optional[int] = 5

class RecommendationItem(BaseModel):
    bike_id: str
    score: float
    metadata: Optional[Dict[str, Any]] = None

class RecommendResponse(BaseModel):
    status: str
    recommendations: List[RecommendationItem]
    timestamp: datetime

class BikeInput(BaseModel):
    cc: float
    horsePower: float
    pricePerHour: float


# ==========================================
# 2. Linear Regression Implementation
# ==========================================

class LinearRegressionScratch:
    """
    Linear Regression implemented from scratch.
    Supports both Normal Equation and Gradient Descent methods.
    """
    
    def __init__(self, learning_rate: float = 0.01, n_iterations: int = 1000, method: str = 'gradient_descent'):
        self.learning_rate = learning_rate
        self.n_iterations = n_iterations
        self.method = method
        self.weights: Optional[np.ndarray] = None
        self.bias: Optional[float] = None
        self.loss_history: List[float] = []
        self.is_fitted: bool = False
        self.n_features: Optional[int] = None
        
    def _add_bias_term(self, X: np.ndarray) -> np.ndarray:
        return np.c_[np.ones(X.shape[0]), X]
    
    def fit_normal_equation(self, X: np.ndarray, y: np.ndarray) -> 'LinearRegressionScratch':
        X_b = self._add_bias_term(X)
        try:
            theta = np.linalg.inv(X_b.T.dot(X_b)).dot(X_b.T).dot(y)
            self.bias = float(theta[0])
            self.weights = theta[1:]
        except np.linalg.LinAlgError:
            theta = np.linalg.pinv(X_b.T.dot(X_b)).dot(X_b.T).dot(y)
            self.bias = float(theta[0])
            self.weights = theta[1:]
        
        self.is_fitted = True
        self.n_features = X.shape[1]
        return self
    
    def fit_gradient_descent(self, X: np.ndarray, y: np.ndarray) -> 'LinearRegressionScratch':
        n_samples, n_features = X.shape
        self.n_features = n_features
        
        self.weights = np.zeros(n_features)
        self.bias = 0.0
        self.loss_history = []
        
        for i in range(self.n_iterations):
            # Forward pass: predict directly to avoid checking self.is_fitted
            y_pred = X.dot(self.weights) + self.bias
            
            dw = (1/n_samples) * X.T.dot(y_pred - y)
            db = (1/n_samples) * np.sum(y_pred - y)
            
            self.weights -= self.learning_rate * dw
            self.bias -= self.learning_rate * db
            
            loss = self._mean_squared_error(y, y_pred)
            self.loss_history.append(float(loss))
        
        self.is_fitted = True
        return self
    
    def fit(self, X: np.ndarray, y: np.ndarray) -> 'LinearRegressionScratch':
        if not isinstance(X, np.ndarray):
            X = np.array(X)
        if not isinstance(y, np.ndarray):
            y = np.array(y)
            
        if self.method == 'normal_equation':
            return self.fit_normal_equation(X, y)
        elif self.method == 'gradient_descent':
            return self.fit_gradient_descent(X, y)
        else:
            raise ValueError("Method must be 'normal_equation' or 'gradient_descent'")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        if isinstance(X, list):
            X = np.array(X)
        return X.dot(self.weights) + self.bias
    
    def _mean_squared_error(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        return float(np.mean((y_true - y_pred) ** 2))
    
    def score(self, X: np.ndarray, y: np.ndarray) -> float:
        if not self.is_fitted:
            raise ValueError("Model must be fitted before scoring")
        y_pred = self.predict(X)
        return self._r2_score(y, y_pred)
    
    def _r2_score(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        return float(1 - (ss_res / ss_tot))
    
    def get_parameters(self) -> Dict:
        return {
            'weights': self.weights.tolist() if self.weights is not None else None,
            'bias': self.bias,
            'is_fitted': self.is_fitted,
            'n_features': self.n_features,
            'method': self.method
        }
    
    def get_loss_history(self) -> List[float]:
        return self.loss_history
    
    def save_model(self, filepath: str) -> None:
        with open(filepath, 'wb') as f:
            pickle.dump(self, f)
    
    @classmethod
    def load_model(cls, filepath: str) -> 'LinearRegressionScratch':
        with open(filepath, 'rb') as f:
            return pickle.load(f)


# ==========================================
# 3. Heuristic Recommendation
# ==========================================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def _safe_get(d: Dict[str, Any], key: str, default=0.0):
    v = d.get(key, default)
    try:
        return float(v)
    except Exception:
        return default

def rank_bikes(
    bikes: List[Dict[str, Any]],
    user_location: Optional[Tuple[float, float]] = None,
    top_n: int = 5
) -> List[Dict[str, Any]]:
    if not bikes:
        return []

    prices = [_safe_get(b, 'price', 1.0) for b in bikes]
    ratings = [_safe_get(b, 'rating', 0.0) for b in bikes]
    pops = [_safe_get(b, 'bookings_count', 0.0) for b in bikes]

    def normalize(arr):
        mi = min(arr) if arr else 0.0
        ma = max(arr) if arr else 1.0
        if ma - mi == 0:
            return [0.0 for _ in arr]
        return [(x - mi) / (ma - mi) for x in arr]

    norm_price = normalize(prices)
    norm_rating = normalize(ratings)
    norm_pop = normalize(pops)

    results = []
    for i, b in enumerate(bikes):
        score = 0.0
        w_pop = 0.4
        w_rating = 0.3
        w_proximity = 0.2
        w_price = 0.1

        score += w_pop * norm_pop[i]
        score += w_rating * norm_rating[i]

        if user_location and 'lat' in b and 'lon' in b:
            dist_km = haversine_distance(user_location[0], user_location[1], _safe_get(b, 'lat', 0.0), _safe_get(b, 'lon', 0.0))
            proximity_score = max(0.0, 1.0 - min(dist_km, 20.0) / 20.0)
            score += w_proximity * proximity_score
        else:
            score += w_proximity * 0.0

        score += w_price * (1.0 - norm_price[i])

        results.append({
            'bike_id': b.get('bike_id'),
            'score': float(round(score, 4)),
            'metadata': b
        })

    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:top_n]

def recommend_heuristic(request_json: Dict[str, Any]) -> List[Dict[str, Any]]:
    bikes = request_json.get('bikes', [])
    loc = request_json.get('user_location')
    top_n = int(request_json.get('top_n', 5))
    user_loc = None
    if loc and isinstance(loc, dict) and 'lat' in loc and 'lon' in loc:
        user_loc = (float(loc['lat']), float(loc['lon']))

    return rank_bikes(bikes=bikes, user_location=user_loc, top_n=top_n)


# ==========================================
# 4. KNN Recommendation Setup
# ==========================================

bike_names = [
    "Yamaha R15",
    "KTM RC 200",
    "Pulsar RS200",
    "Apache RTR 200",
    "Honda CBR"
]

bike_features = np.array([
    [155, 18, 120],
    [200, 25, 150],
    [220, 20, 130],
    [200, 21, 140],
    [150, 17, 110]
])

knn_model = NearestNeighbors(n_neighbors=3)
knn_model.fit(bike_features)

def recommend_bikes_knn(data: BikeInput) -> Dict[str, List[str]]:
    input_features = np.array([[
        data.cc,
        data.horsePower,
        data.pricePerHour
    ]])
    distances, indices = knn_model.kneighbors(input_features)
    recommendations = []
    for index in indices[0]:
        recommendations.append(bike_names[index])
    return {
        "recommended_bikes": recommendations
    }


# ==========================================
# 5. FastAPI App Initialization & Routes
# ==========================================

app = FastAPI(
    title="Linear Regression & Recommendation API",
    description="Linear Regression and KNN Recommender models inline with FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model: Optional[LinearRegressionScratch] = None
model_path = "saved_model.pkl"

def validate_data(features: List[List[float]], targets: Optional[List[float]] = None):
    if not features:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Features cannot be empty"
        )
    
    n_features = len(features[0])
    for i, sample in enumerate(features):
        if len(sample) != n_features:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inconsistent feature dimensions: sample {i} has {len(sample)} features, expected {n_features}"
            )
    
    if targets is not None:
        if len(features) != len(targets):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mismatch: {len(features)} samples but {len(targets)} targets"
            )
    
    return n_features

@app.on_event("startup")
async def startup_event():
    global model
    if os.path.exists(model_path):
        try:
            model = LinearRegressionScratch.load_model(model_path)
            print(f"Model loaded from {model_path}")
        except Exception as e:
            print(f"Failed to load model: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    global model
    if model and model.is_fitted:
        try:
            model.save_model(model_path)
            print(f"Model saved to {model_path}")
        except Exception as e:
            print(f"Failed to save model: {e}")

@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(
        status="healthy",
        message="Linear Regression & Recommendation API is running",
        timestamp=datetime.now()
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        message="API is operational",
        timestamp=datetime.now()
    )

@app.post("/train", response_model=TrainResponse)
async def train_model(request: TrainRequest):
    global model
    try:
        X = np.array(request.features)
        y = np.array(request.targets)
        
        n_features = validate_data(request.features, request.targets)
        
        model = LinearRegressionScratch(
            learning_rate=request.learning_rate,
            n_iterations=request.n_iterations,
            method=request.method
        )
        
        model.fit(X, y)
        
        y_pred = model.predict(X)
        mse = model._mean_squared_error(y, y_pred)
        r2 = model.score(X, y)
        
        response = TrainResponse(
            status="success",
            message="Model trained successfully",
            metrics={
                "mse": mse,
                "r2_score": r2,
                "n_samples": len(X),
                "n_features": n_features
            },
            parameters=model.get_parameters(),
            timestamp=datetime.now()
        )
        
        model.save_model(model_path)
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training failed: {str(e)}"
        )

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    global model
    if model is None or not model.is_fitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model not trained yet. Please train the model first using /train endpoint"
        )
    
    try:
        n_features = validate_data(request.features)
        if n_features != model.n_features:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expected {model.n_features} features, but got {n_features}"
            )
        
        X = np.array(request.features)
        predictions = model.predict(X).tolist()
        
        return PredictResponse(
            status="success",
            predictions=predictions,
            timestamp=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@app.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info():
    global model
    if model is None:
        return ModelInfoResponse(
            status="info",
            model_info={"is_trained": False, "message": "No model has been trained yet"},
            timestamp=datetime.now()
        )
    
    model_info = model.get_parameters()
    if model.is_fitted and model.method == 'gradient_descent':
        model_info['loss_history'] = model.get_loss_history()[-10:]
    
    return ModelInfoResponse(
        status="success",
        model_info=model_info,
        timestamp=datetime.now()
    )

@app.delete("/model/clear")
async def clear_model():
    global model
    model = None
    if os.path.exists(model_path):
        os.remove(model_path)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "success",
            "message": "Model cleared successfully",
            "timestamp": str(datetime.now())
        }
    )

@app.post("/model/save")
async def save_model_to_file(filepath: str = "saved_model.pkl"):
    global model
    if model is None or not model.is_fitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No trained model to save"
        )
    
    try:
        model.save_model(filepath)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "success",
                "message": f"Model saved to {filepath}",
                "timestamp": str(datetime.now())
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save model: {str(e)}"
        )

@app.post("/model/load")
async def load_model_from_file(filepath: str = "saved_model.pkl"):
    global model
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model file {filepath} not found"
        )
    
    try:
        model = LinearRegressionScratch.load_model(filepath)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "success",
                "message": f"Model loaded from {filepath}",
                "model_info": model.get_parameters(),
                "timestamp": str(datetime.now())
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model: {str(e)}"
        )

@app.post("/recommend/heuristic", response_model=RecommendResponse)
async def recommend_heuristic_endpoint(request: RecommendRequest):
    """Return top-N bikes using a simple heuristic ranking.
    Request should include `bikes` (list of bike metadata). Optionally `user_location` and `top_n`.
    """
    try:
        req_json = request.dict()
        recs = recommend_heuristic(req_json)
        items = [RecommendationItem(bike_id=str(r['bike_id']), score=r['score'], metadata=r.get('metadata')) for r in recs]
        return RecommendResponse(status='success', recommendations=items, timestamp=datetime.now())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Recommendation failed: {e}")

@app.post("/recommend")
async def recommend(data: BikeInput):
    """KNN-based bike recommendation endpoint"""
    try:
        return recommend_bikes_knn(data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"KNN Recommendation failed: {str(e)}"
        )