import React, { useEffect, useState } from 'react';
import { getAlgorithmInfo, trainAlgorithm } from '../../scripts/API Calls/algorithmApiCalls';

const Algorithm: React.FC = (): JSX.Element => {
    const [modelInfo, setModelInfo] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [training, setTraining] = useState<boolean>(false);
    const [trainResult, setTrainResult] = useState<any>(null);

    const fetchModelInfo = async () => {
        setLoading(true);
        try {
            const info = await getAlgorithmInfo();
            setModelInfo(info);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModelInfo();
    }, []);

    const handleTrainModel = async () => {
        if (!confirm('This will retrain the AI model using all bikes in the database. Are you sure you want to continue?')) return;
        
        setTraining(true);
        setTrainResult(null);
        try {
            const result = await trainAlgorithm();
            setTrainResult(result);
            fetchModelInfo(); // refresh stats
        } catch (error: any) {
            alert(error.message || "Failed to train algorithm.");
        } finally {
            setTraining(false);
        }
    };

    return (
        <div className="container-fluid">
            <h2 className="mb-4">AI Pricing Algorithm Settings</h2>
            
            <div className="row">
                <div className="col-12 col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-dark text-white">
                            <h5 className="mb-0">Algorithm Status</h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <p>Loading model information...</p>
                            ) : modelInfo && modelInfo.model_info ? (
                                <>
                                    <div className="mb-3">
                                        <strong>Status: </strong>
                                        <span className={`badge ${modelInfo.model_info.is_fitted ? 'bg-success' : 'bg-warning'}`}>
                                            {modelInfo.model_info.is_fitted ? 'Trained' : 'Untrained'}
                                        </span>
                                    </div>
                                    <div className="mb-3">
                                        <strong>Method: </strong>
                                        <span>{modelInfo.model_info.method || 'N/A'}</span>
                                    </div>
                                    <div className="mb-3">
                                        <strong>Features Count: </strong>
                                        <span>{modelInfo.model_info.n_features || '0'}</span>
                                    </div>
                                    {modelInfo.model_info.weights && (
                                        <div className="mb-3">
                                            <strong>Weights (CC, HP): </strong>
                                            <span>
                                                [{modelInfo.model_info.weights.map((w: number | null) => w !== null ? w.toFixed(4) : 'N/A').join(', ')}]
                                            </span>
                                        </div>
                                    )}
                                    {modelInfo.model_info.bias !== undefined && (
                                        <div className="mb-3">
                                            <strong>Bias: </strong>
                                            <span>{modelInfo.model_info.bias?.toFixed(4)}</span>
                                        </div>
                                    )}
                                    
                                    {!modelInfo.model_info.is_fitted && (
                                        <div className="alert alert-warning mt-3">
                                            Model is currently untrained. You must train the model for AI price predictions to work.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="alert alert-danger">
                                    Could not connect to the Algorithm API. Ensure the Python server is running on port 8000.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-dark text-white">
                            <h5 className="mb-0">Training Control</h5>
                        </div>
                        <div className="card-body d-flex flex-column">
                            <p>
                                The algorithm uses <strong>Linear Regression ({modelInfo?.model_info?.method || 'gradient_descent'})</strong> to learn 
                                the relationship between bike specifications (CC & Horse Power) and their hourly rental price.
                            </p>
                            
                            <p>
                                Click the button below to train the model using current active bikes in the database.
                            </p>

                            <button 
                                className="btn btn-primary mt-auto py-2" 
                                onClick={handleTrainModel}
                                disabled={training}
                            >
                                {training ? (
                                    <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Training in progress...</span>
                                ) : (
                                    'Train AI Model'
                                )}
                            </button>

                            {trainResult && trainResult.status === 'success' && (
                                <div className="alert alert-success mt-3 mb-0">
                                    <strong>Success!</strong> Model trained on {trainResult.metrics?.n_samples} bikes.
                                    <br />
                                    <small>R² Score: {trainResult.metrics?.r2_score?.toFixed(4)}</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {modelInfo && modelInfo.model_info && modelInfo.model_info.loss_history && (
                <div className="card shadow-sm mt-2">
                    <div className="card-header bg-secondary text-white">
                        <h5 className="mb-0">Recent Loss History</h5>
                    </div>
                    <div className="card-body">
                        <p className="small text-muted">Showing Mean Squared Error for the last 10 iterations.</p>
                        <ul className="list-group list-group-flush">
                            {modelInfo.model_info.loss_history.map((loss: number, index: number) => (
                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                    Iteration n-{modelInfo.model_info.loss_history.length - index}
                                    <span className="badge bg-primary rounded-pill">{loss !== null ? loss.toFixed(6) : 'N/A'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Algorithm;
