import express from 'express';
import { getDailyMission, updateTaskCompletion } from '../controllers/dailyMissionController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/today', authenticateToken, getDailyMission);
router.patch('/update-task', authenticateToken, updateTaskCompletion);

export default router;
