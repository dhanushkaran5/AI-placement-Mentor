import express from 'express';
import { getSimulationConfig, startSimulation, submitRoundResult, getSimulationHistory } from '../controllers/simulationController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/config', authenticateToken, getSimulationConfig);
router.post('/start', authenticateToken, startSimulation);
router.post('/submit-round', authenticateToken, submitRoundResult);
router.get('/history', authenticateToken, getSimulationHistory);

export default router;
