import express from 'express';
import { getReadiness, runWhatIfSimulation, getCompanyMatch, setCountdownTarget, getBlockers } from '../controllers/readinessController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getReadiness);
router.get('/blockers', getBlockers);
router.post('/whatif', runWhatIfSimulation);
router.get('/company-match', getCompanyMatch);
router.post('/target', setCountdownTarget);

export default router;
