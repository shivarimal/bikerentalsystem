import { Request, Response } from 'express';

const ALGORITHM_URL = 'http://localhost:8000';

export const recommendBike = async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${ALGORITHM_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Recommendation service error',
        details: errorText
      });
    }

    const data = await response.json();
    return res.json(data);

  } catch (error: any) {
    console.error('Recommendation Controller Error:', error);
    return res.status(500).json({
      error: 'Recommendation request failed',
      message: error.message
    });
  }
};