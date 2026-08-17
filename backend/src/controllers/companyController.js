import { answerWithRAG, searchInsights } from '../services/ragService.js';
import { generateChatResponse } from '../services/aiService.js';
import { get as getDb, query as queryDb } from '../config/db.js';
import {
  getCompaniesList,
  getCompanyByIdOrName,
  getAvailableRoles,
  calculateUserCompanyMatch,
  compareCompaniesForUser,
  getPlacementOpportunitiesMatrix,
  addCompanyAdmin,
  editCompanyAdmin,
  deleteCompanyAdmin
} from '../services/companyIntelligenceEngine.js';

// GET Target options for dropdowns (Dynamic from database)
export const getTargetOptions = async (req, res) => {
  try {
    const companies = getCompaniesList();
    const options = [];
    let idCounter = 1;

    companies.forEach(comp => {
      comp.roles.forEach(role => {
        options.push({
          id: idCounter++,
          companyId: comp.id,
          roleId: role.id,
          role: role.title,
          company: comp.name,
          category: comp.category,
          display: `${role.title} at ${comp.name}`
        });
      });
    });

    res.json(options);
  } catch (error) {
    console.error('Get target options error:', error);
    res.status(500).json({ error: 'Internal server error fetching target options.' });
  }
};

// GET Filtered company list
export const getCompanies = async (req, res) => {
  try {
    const { search, category, role, difficulty, skill } = req.query;
    const companies = getCompaniesList({ search, category, role, difficulty, skill });
    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error fetching companies.' });
  }
};

// GET Company by ID or Name
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = getCompanyByIdOrName(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    // Include match score if user is authenticated
    let userMatch = null;
    if (req.user && req.user.id) {
      userMatch = await calculateUserCompanyMatch(req.user.id, company.id);
    }

    res.json({ ...company, userMatch });
  } catch (error) {
    console.error('Get company details error:', error);
    res.status(500).json({ error: 'Internal server error fetching company details.' });
  }
};

// POST Evaluate company match score
export const evaluateMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, role } = req.body;
    const matchResult = await calculateUserCompanyMatch(userId, company || 'TCS', role);
    res.json(matchResult);
  } catch (error) {
    console.error('Evaluate match error:', error);
    res.status(500).json({ error: 'Internal server error evaluating company match.' });
  }
};

// POST Compare up to 4 companies
export const compareCompanies = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyIds } = req.body;

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of company IDs to compare.' });
    }

    const comparison = await compareCompaniesForUser(userId, companyIds);
    res.json(comparison);
  } catch (error) {
    console.error('Compare companies error:', error);
    res.status(500).json({ error: 'Internal server error comparing companies.' });
  }
};

// GET Placement Opportunities Matrix
export const getOpportunitiesMatrix = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sortBy } = req.query;
    const matrix = await getPlacementOpportunitiesMatrix(userId, sortBy || 'highest');
    res.json(matrix);
  } catch (error) {
    console.error('Get opportunities matrix error:', error);
    res.status(500).json({ error: 'Internal server error generating opportunities matrix.' });
  }
};

// ADMIN: Add company
export const createCompany = async (req, res) => {
  try {
    const company = addCompanyAdmin(req.body);
    res.status(201).json(company);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(400).json({ error: error.message || 'Failed to create company.' });
  }
};

// ADMIN: Update company
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = editCompanyAdmin(id, req.body);
    res.json(company);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(400).json({ error: error.message || 'Failed to update company.' });
  }
};

// ADMIN: Delete company
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const result = deleteCompanyAdmin(id);
    res.json(result);
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete company.' });
  }
};

// GET Insights list
export const getInsightsList = async (req, res) => {
  const { company } = req.query;
  try {
    let insights;
    if (company) {
      insights = await queryDb('SELECT * FROM company_insights WHERE LOWER(company) = LOWER(?)', [company]);
    } else {
      insights = await queryDb('SELECT * FROM company_insights');
    }
    res.json(insights);
  } catch (error) {
    console.error('Get insights list error:', error);
    res.status(500).json({ error: 'Internal server error fetching insights.' });
  }
};

// RAG Ask Question
export const askQuestion = async (req, res) => {
  const { question, company } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    const answer = await answerWithRAG(question, company);
    res.json({ answer });
  } catch (error) {
    console.error('RAG askQuestion error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during RAG retrieval.' });
  }
};

// Handle AI Chat
export const handleChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const userId = req.user.id;
    const profile = await getDb('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    const resume = await getDb('SELECT * FROM resumes WHERE user_id = ?', [userId]);
    const resumeData = resume ? { skills: JSON.parse(resume.skills || '[]') } : null;

    let roadmapWeeks = null;
    if (profile?.target_role && profile?.target_company) {
      const roadmap = await getDb(
        `SELECT weeks FROM roadmaps WHERE user_id = ? AND target_role = ? AND target_company = ? ORDER BY id DESC LIMIT 1`,
        [userId, profile.target_role, profile.target_company]
      );
      if (roadmap) {
        roadmapWeeks = JSON.parse(roadmap.weeks || '[]');
      }
    }

    const reply = await generateChatResponse(message, history || [], profile, resumeData, roadmapWeeks);
    res.json({ reply });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during chat.' });
  }
};
