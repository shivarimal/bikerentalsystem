from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
from typing import Optional, List, Dict, Any
from datetime import datetime
import os

from linear_regression import LinearRegressionScratch
from models import (
    TrainRequest, PredictRequest, TrainResponse,
    PredictResponse, ModelInfoResponse, HealthResponse
)

# Initialize FastAPI app
app = FastAPI(
    title="Linear Regression API",
    description="Linear Regression model implemented from scratch with FastAPI",
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

# Helper functions
def validate_data(features: List[List[float]], targets: Optional[List[float]] = None):
    """Validate input data"""
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
    """Load model on startup if exists"""
    global model
    if os.path.exists(model_path):
        try:
            model = LinearRegressionScratch.load_model(model_path)
            print(f"Model loaded from {model_path}")
        except Exception as e:
            print(f"Failed to load model: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Save model on shutdown if exists"""
    global model
    if model and model.is_fitted:
        try:
            model.save_model(model_path)
            print(f"Model saved to {model_path}")
        except Exception as e:
            print(f"Failed to save model: {e}")

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint"""
    return HealthResponse(
        status="healthy",
        message="Linear Regression API is running",
        timestamp=datetime.now()
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="API is operational",
        timestamp=datetime.now()
    )

@app.post("/train", response_model=TrainResponse)
async def train_model(request: TrainRequest):
    """
    Train the linear regression model
    """
    global model
    
    try:
        # Convert to numpy arrays
        X = np.array(request.features)
        y = np.array(request.targets)
        
        # Validate data
        n_features = validate_data(request.features, request.targets)
        
        # Create new model
        model = LinearRegressionScratch(
            learning_rate=request.learning_rate,
            n_iterations=request.n_iterations,
            method=request.method
        )
        
        # Train model
        model.fit(X, y)
        
        # Calculate metrics
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
        
        # Save model automatically
        model.save_model(model_path)
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training failed: {str(e)}"
        )

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Make predictions using the trained model
    """
    global model
    
    if model is None or not model.is_fitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model not trained yet. Please train the model first using /train endpoint"
        )
    
    try:
        # Validate features
        n_features = validate_data(request.features)
        
        # Check feature dimension
        if n_features != model.n_features:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expected {model.n_features} features, but got {n_features}"
            )
        
        # Make predictions
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
    """
    Get information about the current model
    """
    global model
    
    if model is None:
        return ModelInfoResponse(
            status="info",
            model_info={"is_trained": False, "message": "No model has been trained yet"},
            timestamp=datetime.now()
        )
    
    model_info = model.get_parameters()
    if model.is_fitted and model.method == 'gradient_descent':
        model_info['loss_history'] = model.get_loss_history()[-10:]  # Last 10 loss values
    
    return ModelInfoResponse(
        status="success",
        model_info=model_info,
        timestamp=datetime.now()
    )

@app.delete("/model/clear")
async def clear_model():
    """
    Clear the current model
    """
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
    """
    Save model to specified file
    """
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
    """
    Load model from file
    """
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