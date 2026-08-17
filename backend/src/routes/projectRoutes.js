import express from 'express';
import { analyzeProject, getProjectHistory, getDefenseQuestion, evaluateDefense } from '../controllers/projectController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/analyze', analyzeProject);
router.get('/history', getProjectHistory);
router.post('/defense-question', getDefenseQuestion);
router.post('/evaluate-defense', evaluateDefense);

export default router;
