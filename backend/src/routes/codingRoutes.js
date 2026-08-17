import express from 'express';
import { getCodingProblems, submitCodeSolution, getSubmissionsHistory, getWeaknessProfile } from '../controllers/codingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/problems', getCodingProblems);
router.post('/submit', submitCodeSolution);
router.get('/history', getSubmissionsHistory);
router.get('/weakness-profile', getWeaknessProfile);

export default router;
