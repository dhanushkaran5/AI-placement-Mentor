import express from 'express';
import { getRoadmap, createRoadmap, updateTask } from '../controllers/roadmapController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getRoadmap);
router.post('/generate', authenticateToken, createRoadmap);
router.post('/task/status', authenticateToken, updateTask);

export default router;
