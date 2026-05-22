import numpy as np
import pickle
import os
from typing import Optional, Dict, List, Tuple

class LinearRegressionScratch:
    """
    Linear Regression implemented from scratch.
    Supports both Normal Equation and Gradient Descent methods.
    """
    
    def __init__(self, learning_rate: float = 0.01, n_iterations: int = 1000, method: str = 'gradient_descent'):
        """
        Parameters:
        -----------
        learning_rate : float
            Step size for gradient descent
        n_iterations : int
            Number of training iterations
        method : str
            'normal_equation' or 'gradient_descent'
        """
        self.learning_rate = learning_rate
        self.n_iterations = n_iterations
        self.method = method
        self.weights: Optional[np.ndarray] = None
        self.bias: Optional[float] = None
        self.loss_history: List[float] = []
        self.is_fitted: bool = False
        self.n_features: Optional[int] = None
        
    def _add_bias_term(self, X: np.ndarray) -> np.ndarray:
        """Add bias term (column of ones) to feature matrix"""
        return np.c_[np.ones(X.shape[0]), X]
    
    def fit_normal_equation(self, X: np.ndarray, y: np.ndarray) -> 'LinearRegressionScratch':
        """
        Fit linear model using Normal Equation:
        θ = (X^T X)^(-1) X^T y
        """
        # Add bias term
        X_b = self._add_bias_term(X)
        
        # Normal equation: (X^T X)^(-1) X^T y
        try:
            theta = np.linalg.inv(X_b.T.dot(X_b)).dot(X_b.T).dot(y)
            self.bias = float(theta[0])
            self.weights = theta[1:]
        except np.linalg.LinAlgError:
            # If matrix is singular, use pseudo-inverse
            theta = np.linalg.pinv(X_b.T.dot(X_b)).dot(X_b.T).dot(y)
            self.bias = float(theta[0])
            self.weights = theta[1:]
        
        self.is_fitted = True
        self.n_features = X.shape[1]
        return self
    
    def fit_gradient_descent(self, X: np.ndarray, y: np.ndarray) -> 'LinearRegressionScratch':
        """
        Fit linear model using Gradient Descent
        """
        n_samples, n_features = X.shape
        self.n_features = n_features
        
        # Initialize parameters
        self.weights = np.zeros(n_features)
        self.bias = 0.0
        self.loss_history = []
        
        for i in range(self.n_iterations):
            # Forward pass: predict
            y_pred = self.predict(X)
            
            # Calculate gradients
            dw = (1/n_samples) * X.T.dot(y_pred - y)
            db = (1/n_samples) * np.sum(y_pred - y)
            
            # Update parameters
            self.weights -= self.learning_rate * dw
            self.bias -= self.learning_rate * db
            
            # Calculate and store loss (MSE)
            loss = self._mean_squared_error(y, y_pred)
            self.loss_history.append(float(loss))
        
        self.is_fitted = True
        return self
    
    def fit(self, X: np.ndarray, y: np.ndarray) -> 'LinearRegressionScratch':
        """Main fit method that uses specified method"""
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
        """Make predictions"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        if isinstance(X, list):
            X = np.array(X)
            
        return X.dot(self.weights) + self.bias
    
    def _mean_squared_error(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculate Mean Squared Error"""
        return float(np.mean((y_true - y_pred) ** 2))
    
    def score(self, X: np.ndarray, y: np.ndarray) -> float:
        """Calculate R² score"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before scoring")
        
        y_pred = self.predict(X)
        return self._r2_score(y, y_pred)
    
    def _r2_score(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculate R² score"""
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        return float(1 - (ss_res / ss_tot))
    
    def get_parameters(self) -> Dict:
        """Return model parameters"""
        return {
            'weights': self.weights.tolist() if self.weights is not None else None,
            'bias': self.bias,
            'is_fitted': self.is_fitted,
            'n_features': self.n_features,
            'method': self.method
        }
    
    def get_loss_history(self) -> List[float]:
        """Return loss history for gradient descent"""
        return self.loss_history
    
    def save_model(self, filepath: str) -> None:
        """Save model to file"""
        with open(filepath, 'wb') as f:
            pickle.dump(self, f)
    
    @classmethod
    def load_model(cls, filepath: str) -> 'LinearRegressionScratch':
        """Load model from file"""
        with open(filepath, 'rb') as f:
            return pickle.load(f)