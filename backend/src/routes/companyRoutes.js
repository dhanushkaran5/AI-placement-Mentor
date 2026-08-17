import express from 'express';
import {
  getTargetOptions,
  getCompanies,
  getCompanyById,
  evaluateMatch,
  compareCompanies,
  getOpportunitiesMatrix,
  createCompany,
  updateCompany,
  deleteCompany,
  getInsightsList,
  askQuestion,
  handleChat
} from '../controllers/companyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public / Authenticated discovery routes
router.get('/options', authenticateToken, getTargetOptions);
router.get('/list', authenticateToken, getCompanies);
router.get('/matrix', authenticateToken, getOpportunitiesMatrix);
router.get('/:id', authenticateToken, getCompanyById);

// Dynamic match & comparison routes
router.post('/match', authenticateToken, evaluateMatch);
router.post('/compare', authenticateToken, compareCompanies);

// Insights & AI mentor chat routes
router.get('/insights', authenticateToken, getInsightsList);
router.post('/ask', authenticateToken, askQuestion);
router.post('/chat', authenticateToken, handleChat);

// Admin CRUD operations (no frontend code modifications needed to add/edit/delete companies)
router.post('/admin/add', authenticateToken, createCompany);
router.put('/admin/edit/:id', authenticateToken, updateCompany);
router.delete('/admin/delete/:id', authenticateToken, deleteCompany);

export default router;
