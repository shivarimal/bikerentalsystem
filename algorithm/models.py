from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

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