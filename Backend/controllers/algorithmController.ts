import { Request, Response } from 'express';
import Bike from '../models/bike';

const ALGORITHM_URL = 'http://localhost:8000';

export const trainAlgorithm = async (req: Request, res: Response) => {
    try {
        const bikes = await Bike.find({}).exec();
        if (bikes.length < 2) {
            return res.status(400).json({ error: "Need at least 2 bikes in the database to train the model." });
        }

        const features: number[][] = [];
        const targets: number[] = [];

        bikes.forEach(bike => {
            features.push([bike.cc, bike.horsePower]);
            targets.push(bike.pricePerHour);
        });

        const response = await fetch(`${ALGORITHM_URL}/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                features,
                targets,
                method: "gradient_descent",
                learning_rate: 0.0001,
                n_iterations: 10000
            })
        });
        
        const data = await response.json();
        return res.json(data);
    } catch (error: any) {
        console.error('Error training algorithm:', error);
        return res.status(500).json({ error: error.message || 'Error communicating with algorithm' });
    }
};

export const predictPrice = async (req: Request, res: Response) => {
    const { cc, horsePower } = req.body;
    
    if (cc === undefined || horsePower === undefined) {
        return res.status(400).json({ error: "CC and Horse Power are required for prediction." });
    }

    try {
        const features = [[Number(cc), Number(horsePower)]];
        const response = await fetch(`${ALGORITHM_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ features })
        });

        const data = await response.json();

        if (data && data.predictions && data.predictions.length > 0) {
            let price = Math.round(data.predictions[0]);
            if (price <= 0) price = 10;
            return res.json({ predictedPrice: price });
        }
        return res.status(400).json({ error: "Invalid response from algorithm" });
    } catch (error: any) {
        console.error('Error predicting price:', error);
        return res.status(500).json({ error: error.message || 'Error communicating with algorithm' });
    }
};

export const getAlgorithmInfo = async (req: Request, res: Response) => {
    try {
        const response = await fetch(`${ALGORITHM_URL}/model/info`);
        const data = await response.json();
        return res.json(data);
    } catch (error: any) {
        console.error('Error getting algorithm info:', error);
        return res.status(500).json({ error: error.message || 'Error communicating with algorithm' });
    }
};
