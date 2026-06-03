import express, { Request, Response } from 'express';
import { recommendBike } from '../controllers/recommendationController';

const router = express.Router();

router.post('/recommend', async (req: Request, res: Response) => {
  await recommendBike(req, res);
});

export default router;