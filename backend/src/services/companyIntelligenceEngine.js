import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { get, query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const companiesFilePath = path.join(__dirname, '../config/companies.json');

let companiesData = [];

// Load companies from file
export const loadCompanies = () => {
  try {
    if (fs.existsSync(companiesFilePath)) {
      const raw = fs.readFileSync(companiesFilePath, 'utf8');
      companiesData = JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error loading companies.json:', error);
  }
};

// Save companies to file
export const saveCompanies = () => {
  try {
    fs.writeFileSync(companiesFilePath, JSON.stringify(companiesData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving companies.json:', error);
  }
};

// Initial load
loadCompanies();

/**
 * GET ALL COMPANIES WITH OPTIONAL FILTERS
 */
export const getCompaniesList = (filters = {}) => {
  loadCompanies();
  let result = [...companiesData];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.roles.some(r => r.title.toLowerCase().includes(q) || r.requirements.programmingLanguages.some(p => p.toLowerCase().includes(q)) || r.requirements.technicalSkills.some(s => s.toLowerCase().includes(q)))
    );
  }

  if (filters.category && filters.category !== 'ALL') {
    result = result.filter(c => c.category.toUpperCase() === filters.category.toUpperCase());
  }

  if (filters.difficulty && filters.difficulty !== 'ALL') {
    result = result.filter(c => c.difficulty.toLowerCase() === filters.difficulty.toLowerCase());
  }

  if (filters.role && filters.role !== 'ALL') {
    const roleQ = filters.role.toLowerCase();
    result = result.filter(c => c.roles.some(r => r.title.toLowerCase().includes(roleQ)));
  }

  if (filters.skill) {
    const skillQ = filters.skill.toLowerCase();
    result = result.filter(c =>
      c.roles.some(r =>
        r.requirements.technicalSkills.some(s => s.toLowerCase().includes(skillQ)) ||
        r.requirements.programmingLanguages.some(p => p.toLowerCase().includes(skillQ)) ||
        r.requirements.databaseSkills.some(d => d.toLowerCase().includes(skillQ)) ||
        r.requirements.frameworks.some(f => f.toLowerCase().includes(skillQ))
      )
    );
  }

  return result;
};

/**
 * GET SINGLE COMPANY BY ID OR NAME
 */
export const getCompanyByIdOrName = (idOrName) => {
  loadCompanies();
  if (!idOrName) return null;
  const target = String(idOrName).toLowerCase();
  return companiesData.find(c => c.id.toLowerCase() === target || c.name.toLowerCase() === target) || null;
};

/**
 * GET ALL UNIQUE ROLES ACROSS COMPANIES
 */
export const getAvailableRoles = () => {
  loadCompanies();
  const rolesSet = new Set();
  companiesData.forEach(c => {
    c.roles.forEach(r => rolesSet.add(r.title));
  });
  return Array.from(rolesSet).sort();
};

/**
 * CALCULATE INDIVIDUAL COMPANY-ROLE MATCH & SKILL GAPS FOR A USER
 */
export const calculateUserCompanyMatch = async (userId, companyIdOrName, roleIdOrTitle = null) => {
  loadCompanies();
  const company = getCompanyByIdOrName(companyIdOrName) || companiesData[0];
  let selectedRole = company.roles[0];

  if (roleIdOrTitle) {
    const foundRole = company.roles.find(r => r.id.toLowerCase() === String(roleIdOrTitle).toLowerCase() || r.title.toLowerCase() === String(roleIdOrTitle).toLowerCase());
    if (foundRole) selectedRole = foundRole;
  }

  // Fetch candidate profile info from DB
  const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
  const resume = await get('SELECT * FROM resumes WHERE user_id = ?', [userId]);
  const verifiedSkills = await query('SELECT * FROM verified_skills WHERE user_id = ?', [userId]);
  const mockInterviews = await query('SELECT * FROM mock_interviews WHERE user_id = ?', [userId]);
  const codingSubmissions = await query('SELECT * FROM coding_submissions WHERE user_id = ?', [userId]);
  const projectAnalyses = await query('SELECT * FROM project_analyses WHERE user_id = ?', [userId]);

  // Extract skill scores map
  const skillScoreMap = {};
  verifiedSkills.forEach(vs => {
    skillScoreMap[vs.skill.toLowerCase()] = vs.verification_score || 70;
  });

  const resumeSkills = resume ? JSON.parse(resume.skills || '[]').map(s => s.toLowerCase()) : [];

  // Match evaluation
  const reqs = selectedRole.requirements;
  const allReqSkills = [
    ...reqs.technicalSkills,
    ...reqs.programmingLanguages,
    ...reqs.frameworks,
    ...reqs.databaseSkills
  ];

  let skillsMatchedCount = 0;
  const skillBreakdown = [];
  const skillGaps = { high: [], medium: [], low: [] };

  allReqSkills.forEach(reqSkill => {
    const sLower = reqSkill.toLowerCase();
    const isPresentInResume = resumeSkills.some(rs => rs.includes(sLower) || sLower.includes(rs));
    const verifiedVal = skillScoreMap[sLower];

    let status = 'Missing';
    let matched = false;
    let score = 30;

    if (verifiedVal) {
      score = verifiedVal;
      if (verifiedVal >= 75) status = 'Strong Match';
      else if (verifiedVal >= 50) status = 'Partial Match';
      matched = verifiedVal >= 50;
    } else if (isPresentInResume) {
      score = 65;
      status = 'Partial Match';
      matched = true;
    }

    if (matched) skillsMatchedCount++;

    skillBreakdown.push({
      skill: reqSkill,
      matched,
      score,
      status
    });

    // Classify Priority Gaps
    if (score < 50) {
      if (reqs.dsaImportance === 'VERY HIGH' && (sLower.includes('dsa') || sLower.includes('algorithm') || sLower.includes('structure') || sLower.includes('graph') || sLower.includes('tree') || sLower.includes('dynamic'))) {
        skillGaps.high.push(reqSkill);
      } else if (reqs.programmingLanguages.map(p => p.toLowerCase()).includes(sLower)) {
        skillGaps.high.push(reqSkill);
      } else if (reqs.technicalSkills.map(t => t.toLowerCase()).includes(sLower)) {
        skillGaps.medium.push(reqSkill);
      } else {
        skillGaps.low.push(reqSkill);
      }
    }
  });

  // Calculate Sub-Scores (0-100)
  const skillsMatchScore = Math.round((skillsMatchedCount / Math.max(1, allReqSkills.length)) * 100);

  // Coding/DSA score based on user submissions and DSA importance
  let userAvgCodingScore = 50;
  if (codingSubmissions.length > 0) {
    const sum = codingSubmissions.reduce((acc, c) => acc + (c.score || 0), 0);
    userAvgCodingScore = Math.round(sum / codingSubmissions.length);
  }
  const codingMatchScore = Math.min(100, Math.round(userAvgCodingScore * (reqs.dsaImportance === 'VERY HIGH' ? 0.9 : 1.1)));

  // Project match score
  let userAvgProjectScore = 60;
  if (projectAnalyses.length > 0) {
    const sum = projectAnalyses.reduce((acc, p) => acc + (p.project_score || 0), 0);
    userAvgProjectScore = Math.round(sum / projectAnalyses.length);
  }
  const projectMatchScore = Math.min(100, userAvgProjectScore);

  // Interview match score
  let userAvgInterviewScore = 60;
  if (mockInterviews.length > 0) {
    const sum = mockInterviews.reduce((acc, m) => acc + (m.overall_score || 0), 0);
    userAvgInterviewScore = Math.round(sum / mockInterviews.length);
    if (userAvgInterviewScore <= 10) userAvgInterviewScore *= 10;
  }
  const interviewMatchScore = Math.min(100, userAvgInterviewScore);

  // Resume Match Score
  const resumeMatchScore = Math.min(100, Math.round((resumeSkills.length / 10) * 40 + (profile?.readiness_score || 50) * 0.6));

  // Overall Preparation Alignment Score (0-100)
  const overallMatchScore = Math.round(
    skillsMatchScore * 0.30 +
    codingMatchScore * 0.25 +
    projectMatchScore * 0.20 +
    interviewMatchScore * 0.15 +
    resumeMatchScore * 0.10
  );

  let readinessLabel = 'Moderate Alignment';
  if (overallMatchScore >= 80) readinessLabel = 'High Alignment';
  else if (overallMatchScore >= 65) readinessLabel = 'Good Alignment';
  else if (overallMatchScore < 50) readinessLabel = 'Requires Preparation';

  return {
    companyId: company.id,
    companyName: company.name,
    category: company.category,
    description: company.description,
    logo: company.logo,
    website: company.website,
    industry: company.industry,
    headquarters: company.headquarters,
    difficulty: company.difficulty,
    role: selectedRole,
    matchScore: overallMatchScore,
    readinessLabel,
    subScores: {
      skillsMatch: skillsMatchScore,
      codingMatch: codingMatchScore,
      projectMatch: projectMatchScore,
      interviewMatch: interviewMatchScore,
      resumeMatch: resumeMatchScore
    },
    skillBreakdown,
    skillGaps,
    assessmentPattern: company.assessmentPattern,
    interviewPattern: company.interviewPattern,
    preparationTopics: company.preparationTopics
  };
};

/**
 * CALCULATE COMPARISON METRICS FOR UP TO 4 COMPANIES
 */
export const compareCompaniesForUser = async (userId, companyIds = []) => {
  loadCompanies();
  const validIds = companyIds.slice(0, 4);
  const comparisonResults = [];

  for (const compId of validIds) {
    const matchRes = await calculateUserCompanyMatch(userId, compId);
    comparisonResults.push(matchRes);
  }

  return comparisonResults;
};

/**
 * CALCULATE PLACEMENT OPPORTUNITIES MATRIX ACROSS ALL 50 COMPANIES
 */
export const getPlacementOpportunitiesMatrix = async (userId, sortBy = 'highest') => {
  loadCompanies();
  const matrix = [];

  for (const company of companiesData) {
    const defaultRole = company.roles[0];
    const matchRes = await calculateUserCompanyMatch(userId, company.id, defaultRole.id);
    matrix.push({
      companyId: company.id,
      companyName: company.name,
      category: company.category,
      logo: company.logo,
      difficulty: company.difficulty,
      targetRole: defaultRole.title,
      readinessScore: matchRes.matchScore,
      skillsMatch: matchRes.subScores.skillsMatch,
      codingMatch: matchRes.subScores.codingMatch,
      projectMatch: matchRes.subScores.projectMatch,
      readinessLabel: matchRes.readinessLabel,
      highPriorityGapCount: matchRes.skillGaps.high.length
    });
  }

  if (sortBy === 'highest') {
    matrix.sort((a, b) => b.readinessScore - a.readinessScore);
  } else if (sortBy === 'lowest') {
    matrix.sort((a, b) => a.readinessScore - b.readinessScore);
  } else if (sortBy === 'prepNeeded') {
    matrix.sort((a, b) => b.highPriorityGapCount - a.highPriorityGapCount);
  } else if (sortBy === 'bestOpportunity') {
    matrix.sort((a, b) => (b.readinessScore * 0.7 - b.highPriorityGapCount * 5) - (a.readinessScore * 0.7 - a.highPriorityGapCount * 5));
  }

  return matrix;
};

/**
 * ADMIN: ADD A NEW COMPANY
 */
export const addCompanyAdmin = (companyPayload) => {
  loadCompanies();
  const newId = companyPayload.id || companyPayload.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const existing = companiesData.find(c => c.id === newId);
  if (existing) {
    throw new Error(`Company with ID "${newId}" already exists.`);
  }

  const newCompany = {
    id: newId,
    name: companyPayload.name,
    category: companyPayload.category || 'IT / SERVICE',
    description: companyPayload.description || '',
    website: companyPayload.website || '',
    logo: companyPayload.logo || companyPayload.name.substring(0, 4).toUpperCase(),
    industry: companyPayload.industry || 'Technology',
    headquarters: companyPayload.headquarters || 'India',
    difficulty: companyPayload.difficulty || 'Medium',
    roles: companyPayload.roles || [],
    assessmentPattern: companyPayload.assessmentPattern || { name: 'Standard Drive', stages: [], timings: '', focusAreas: [] },
    interviewPattern: companyPayload.interviewPattern || { rounds: [], format: '', focusAreas: [] },
    preparationTopics: companyPayload.preparationTopics || []
  };

  companiesData.push(newCompany);
  saveCompanies();
  return newCompany;
};

/**
 * ADMIN: EDIT AN EXISTING COMPANY
 */
export const editCompanyAdmin = (companyId, updatePayload) => {
  loadCompanies();
  const idx = companiesData.findIndex(c => c.id.toLowerCase() === String(companyId).toLowerCase());
  if (idx === -1) {
    throw new Error(`Company with ID "${companyId}" not found.`);
  }

  companiesData[idx] = {
    ...companiesData[idx],
    ...updatePayload
  };

  saveCompanies();
  return companiesData[idx];
};

/**
 * ADMIN: DELETE A COMPANY
 */
export const deleteCompanyAdmin = (companyId) => {
  loadCompanies();
  const initialLength = companiesData.length;
  companiesData = companiesData.filter(c => c.id.toLowerCase() !== String(companyId).toLowerCase());
  if (companiesData.length === initialLength) {
    throw new Error(`Company with ID "${companyId}" not found.`);
  }
  saveCompanies();
  return { success: true, count: companiesData.length };
};

export default {
  getCompaniesList,
  getCompanyByIdOrName,
  getAvailableRoles,
  calculateUserCompanyMatch,
  compareCompaniesForUser,
  getPlacementOpportunitiesMatrix,
  addCompanyAdmin,
  editCompanyAdmin,
  deleteCompanyAdmin
};
