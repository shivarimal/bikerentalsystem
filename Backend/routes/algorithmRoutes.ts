import { Router } from 'express';
import { trainAlgorithm, predictPrice, getAlgorithmInfo } from '../controllers/algorithmController';

const router = Router();

router.post('/train', async (req, res) => {
  await trainAlgorithm(req, res);
});

router.post('/predict', async (req, res) => {
  await predictPrice(req, res);
});

router.get('/info', async (req, res) => {
  await getAlgorithmInfo(req, res);
});
export default router;
