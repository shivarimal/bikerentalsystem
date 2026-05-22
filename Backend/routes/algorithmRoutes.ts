import { Router } from 'express';
import { trainAlgorithm, predictPrice, getAlgorithmInfo } from '../controllers/algorithmController';

const router = Router();

router.post('/train', trainAlgorithm);
router.post('/predict', predictPrice);
router.get('/info', getAlgorithmInfo);

export default router;
