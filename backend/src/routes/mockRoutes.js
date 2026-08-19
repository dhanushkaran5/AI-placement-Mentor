import express from 'express';
import { startSession, submitAnswer, getHistory, getSessionDetails, getWeaknessMemory } from '../controllers/mockController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/start', startSession);
router.post('/answer', submitAnswer);
router.post('/submit', submitAnswer); // Alias for frontend compatibility
router.post('/submit-answer', submitAnswer); // Alias for test/API compatibility
router.get('/history', getHistory);
router.get('/history/:id', getSessionDetails);
router.get('/weakness-memory', getWeaknessMemory);

export default router;
