import express from 'express';
import { getSkillAssessment, submitSkillAssessment, getVerifiedSkills } from '../controllers/skillVerificationController.js';
import { getClaimQuestions, verifyClaims } from '../controllers/resumeVerificationController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/skills/quiz', authenticateToken, getSkillAssessment);
router.post('/skills/submit', authenticateToken, submitSkillAssessment);
router.get('/skills/verified', authenticateToken, getVerifiedSkills);

router.get('/claims/questions', authenticateToken, getClaimQuestions);
router.post('/claims/verify', authenticateToken, verifyClaims);

export default router;
