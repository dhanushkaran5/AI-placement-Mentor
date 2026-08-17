import express from 'express';
import { upload, uploadAndParse, getResume, getGapAnalysis, matchWithJobDescription } from '../controllers/resumeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/upload', upload, uploadAndParse);
router.get('/', getResume);
router.get('/gap-analysis', getGapAnalysis);
router.post('/match-jd', matchWithJobDescription);

export default router;
