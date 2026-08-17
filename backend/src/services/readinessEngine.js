import { get, query, run } from '../config/db.js';
import { calculateUserCompanyMatch } from './companyIntelligenceEngine.js';

/**
 * CATEGORY WEIGHTS FOR PLACEMENT READINESS
 */
export const DEFAULT_WEIGHTS = {
  technical: 0.25,
  dsa: 0.20,
  mockInterview: 0.15,
  resume: 0.15,
  aptitude: 0.10,
  projects: 0.10,
  communication: 0.05
};

/**
 * Recalculate Placement Readiness Index and refresh all dependent entities
 */
export async function calculateReadinessIndex(userId, customWeights = null) {
  const weights = { ...DEFAULT_WEIGHTS, ...(customWeights || {}) };

  // 1. Fetch user data from DB
  const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
  const resume = await get('SELECT * FROM resumes WHERE user_id = ?', [userId]);
  const verifiedSkills = await query('SELECT * FROM verified_skills WHERE user_id = ?', [userId]);
  const mockHistory = await query('SELECT * FROM mock_interviews WHERE user_id = ? AND overall_score > 0', [userId]);
  const codingSubmissions = await query('SELECT * FROM coding_submissions WHERE user_id = ?', [userId]);
  const projectAnalyses = await query('SELECT * FROM project_analyses WHERE user_id = ?', [userId]);
  const skillAssessments = await query('SELECT * FROM skill_assessments WHERE user_id = ?', [userId]);

  // --- Category 1: Technical Skills (25%) ---
  let technicalScore = 50;
  if (verifiedSkills.length > 0) {
    const sum = verifiedSkills.reduce((acc, s) => acc + (s.verification_score || 50), 0);
    technicalScore = Math.round(sum / verifiedSkills.length);
  } else if (resume) {
    const skills = JSON.parse(resume.skills || '[]');
    technicalScore = Math.min(90, Math.max(40, skills.length * 10));
  }

  // --- Category 2: DSA / Coding (20%) ---
  let dsaScore = 45;
  if (codingSubmissions.length > 0) {
    const sum = codingSubmissions.reduce((acc, c) => acc + (c.score || 0), 0);
    dsaScore = Math.round(sum / codingSubmissions.length);
  } else if (verifiedSkills.some(s => s.skill.toLowerCase().includes('dsa') || s.skill.toLowerCase().includes('data structure'))) {
    const dsaSkill = verifiedSkills.find(s => s.skill.toLowerCase().includes('dsa') || s.skill.toLowerCase().includes('data structure'));
    dsaScore = dsaSkill.verification_score || 50;
  }

  // --- Category 3: Mock Interview (15%) ---
  let mockInterviewScore = 50;
  let communicationScore = 60;
  if (mockHistory.length > 0) {
    const recentScores = mockHistory.slice(-5);
    const sum = recentScores.reduce((acc, m) => acc + (m.overall_score || 0), 0);
    const avgRaw = sum / recentScores.length;
    mockInterviewScore = avgRaw <= 10 ? Math.round(avgRaw * 10) : Math.round(avgRaw);
    communicationScore = Math.min(95, mockInterviewScore + 5);
  }

  // --- Category 4: Resume Quality (15%) ---
  let resumeScore = 55;
  if (resume) {
    let base = 60;
    const skills = JSON.parse(resume.skills || '[]');
    const education = JSON.parse(resume.education || '[]');
    const experience = JSON.parse(resume.experience || '[]');
    if (skills.length >= 5) base += 10;
    if (education.length > 0) base += 10;
    if (experience.length > 0) base += 10;
    if (resume.cgpa && resume.cgpa >= 8.0) base += 10;
    resumeScore = Math.min(98, base);
  }

  // --- Category 5: Aptitude (10%) ---
  let aptitudeScore = 60;
  const aptAssessment = skillAssessments.filter(a => a.category === 'Aptitude');
  if (aptAssessment.length > 0) {
    const sum = aptAssessment.reduce((acc, a) => acc + (a.score || 60), 0);
    aptitudeScore = Math.round(sum / aptAssessment.length);
  }

  // --- Category 6: Projects (10%) ---
  let projectsScore = 50;
  if (projectAnalyses.length > 0) {
    const sum = projectAnalyses.reduce((acc, p) => acc + (p.project_score || 50), 0);
    projectsScore = Math.round(sum / projectAnalyses.length);
  } else if (resume) {
    const exp = JSON.parse(resume.experience || '[]');
    if (exp.length > 0) projectsScore = 75;
  }

  // --- Point Contributions ---
  const technicalPts = Math.round(technicalScore * weights.technical);
  const dsaPts = Math.round(dsaScore * weights.dsa);
  const mockInterviewPts = Math.round(mockInterviewScore * weights.mockInterview);
  const resumePts = Math.round(resumeScore * weights.resume);
  const aptitudePts = Math.round(aptitudeScore * weights.aptitude);
  const projectsPts = Math.round(projectsScore * weights.projects);
  const communicationPts = Math.round(communicationScore * weights.communication);

  const overallReadiness = Math.min(100, Math.max(0,
    technicalPts + dsaPts + mockInterviewPts + resumePts + aptitudePts + projectsPts + communicationPts
  ));

  // Determine Risk Level
  let riskLevel = 'Moderate';
  if (overallReadiness < 40) riskLevel = 'Critical';
  else if (overallReadiness < 60) riskLevel = 'High Risk';
  else if (overallReadiness < 75) riskLevel = 'Moderate';
  else if (overallReadiness < 90) riskLevel = 'Good';
  else riskLevel = 'Excellent';

  // Identify Strongest & Weakest Area
  const categoryScores = [
    { name: 'Technical Skills', key: 'technical', score: technicalScore, weight: weights.technical, points: technicalPts },
    { name: 'DSA & Coding', key: 'dsa', score: dsaScore, weight: weights.dsa, points: dsaPts },
    { name: 'Mock Interview', key: 'mockInterview', score: mockInterviewScore, weight: weights.mockInterview, points: mockInterviewPts },
    { name: 'Resume Quality', key: 'resume', score: resumeScore, weight: weights.resume, points: resumePts },
    { name: 'Aptitude & Logic', key: 'aptitude', score: aptitudeScore, weight: weights.aptitude, points: aptitudePts },
    { name: 'Project Depth', key: 'projects', score: projectsScore, weight: weights.projects, points: projectsPts },
    { name: 'Communication', key: 'communication', score: communicationScore, weight: weights.communication, points: communicationPts }
  ];

  categoryScores.sort((a, b) => b.score - a.score);
  const strongestArea = categoryScores[0];
  const weakestArea = categoryScores[categoryScores.length - 1];

  // Fastest Improvement Levers
  const fastestLevers = categoryScores
    .map(c => {
      const roomToGrow = Math.max(0, 95 - c.score);
      const potentialGain = Math.round(roomToGrow * c.weight);
      return {
        category: c.name,
        key: c.key,
        currentScore: c.score,
        potentialGain: Math.max(2, potentialGain),
        suggestion: getLeverSuggestion(c.key)
      };
    })
    .sort((a, b) => b.potentialGain - a.potentialGain)
    .slice(0, 4);

  // Fetch previous score for trend
  const lastHistory = await get('SELECT overall_score FROM readiness_history WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  const previousScore = lastHistory ? lastHistory.overall_score : overallReadiness;
  const scoreChange = overallReadiness - previousScore;

  // Recommended Next Best Action
  let recommendedAction = `Focus on improving ${weakestArea.name} by attempting dedicated practice exercises.`;
  if (weakestArea.key === 'dsa') {
    recommendedAction = 'Solve 3 Array & HashMap coding problems in the Coding Lab to boost your DSA score.';
  } else if (weakestArea.key === 'technical') {
    recommendedAction = 'Take a Skill Verification assessment for Java & SQL to verify your technical foundation.';
  } else if (weakestArea.key === 'mockInterview') {
    recommendedAction = 'Complete 1 Technical Mock Interview session to practice answer articulation.';
  } else if (weakestArea.key === 'projects') {
    recommendedAction = 'Analyze a project using the Project Portfolio Analyzer to prepare for architecture questions.';
  } else if (weakestArea.key === 'resume') {
    recommendedAction = 'Run Resume Claim Verification to validate project claims and improve resume credibility.';
  }

  const resultData = {
    overallReadiness,
    previousScore,
    scoreChange,
    riskLevel,
    strongestArea: strongestArea.name,
    weakestArea: weakestArea.name,
    recommendedAction,
    categories: {
      technical: technicalScore,
      dsa: dsaScore,
      mockInterview: mockInterviewScore,
      resume: resumeScore,
      aptitude: aptitudeScore,
      projects: projectsScore,
      communication: communicationScore
    },
    contributions: {
      technical: technicalPts,
      dsa: dsaPts,
      mockInterview: mockInterviewPts,
      resume: resumePts,
      aptitude: aptitudePts,
      projects: projectsPts,
      communication: communicationPts
    },
    fastestLevers,
    updatedAt: new Date().toISOString()
  };

  // Save to user_profiles
  await run(
    'UPDATE user_profiles SET readiness_score = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [overallReadiness, userId]
  );

  // Log in readiness_history
  await run(
    `INSERT INTO readiness_history (user_id, overall_score, category_breakdown, risk_level, created_at) 
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [userId, overallReadiness, JSON.stringify(resultData.categories), riskLevel]
  );

  // Generate / Update Placement Risks & Blockers
  await updatePlacementRisks(userId, categoryScores);

  return resultData;
}

function getLeverSuggestion(key) {
  switch (key) {
    case 'dsa': return 'Solve 3 medium Tree / Graph coding problems (+7)';
    case 'technical': return 'Complete Skill Verification on Core Java & SQL (+5)';
    case 'mockInterview': return 'Conduct a 20-min AI Technical Mock Interview (+4)';
    case 'projects': return 'Simulate Project Architecture Defense (+3)';
    case 'resume': return 'Match resume with target Job Description (+3)';
    case 'aptitude': return 'Attempt 15-min Quantitative Aptitude drill (+2)';
    case 'communication': return 'Practice articulating project trade-offs (+2)';
    default: return 'Practice targeted skills';
  }
}

/**
 * Identify top 3-5 placement blockers
 */
export async function getPlacementBlockers(userId) {
  const readiness = await calculateReadinessIndex(userId);
  const categories = readiness.categories;

  const blockers = [];

  // Check DSA
  if (categories.dsa < 70) {
    blockers.push({
      id: 'blocker-dsa',
      title: 'DSA & Algorithmic Problem Solving',
      current: categories.dsa,
      required: 75,
      impact: categories.dsa < 50 ? 'CRITICAL' : 'HIGH',
      priority: 1,
      reason: 'Top tech and product companies require at least 70-75% proficiency in Arrays, HashMaps, Trees, and Dynamic Programming.',
      action: 'Solve 2 Array/HashMap coding problems daily in the Coding Lab.',
      category: 'Coding & DSA',
      estimatedDaysToClear: Math.max(7, Math.round((75 - categories.dsa) * 0.8))
    });
  }

  // Check Technical Skills
  if (categories.technical < 75) {
    blockers.push({
      id: 'blocker-tech',
      title: 'Technical Core Knowledge & Verification',
      current: categories.technical,
      required: 80,
      impact: categories.technical < 55 ? 'HIGH' : 'MEDIUM',
      priority: 2,
      reason: 'Key foundational concepts (OOP, SQL indexes, Multithreading) have unverified gaps.',
      action: 'Complete Skill Verification assessments for Java and Database Systems.',
      category: 'Core Engineering',
      estimatedDaysToClear: Math.max(5, Math.round((80 - categories.technical) * 0.6))
    });
  }

  // Check Mock Interview
  if (categories.mockInterview < 70) {
    blockers.push({
      id: 'blocker-interview',
      title: 'Technical Interview Articulation & Depth',
      current: categories.mockInterview,
      required: 75,
      impact: 'HIGH',
      priority: 3,
      reason: 'Interview responses need more technical depth, structured STAR formatting, and edge case handling.',
      action: 'Simulate 2 mock interviews focusing on architectural trade-offs.',
      category: 'Interview Prep',
      estimatedDaysToClear: 6
    });
  }

  // Check Project Defense
  if (categories.projects < 70) {
    blockers.push({
      id: 'blocker-project',
      title: 'Project Architecture & Defense Preparedness',
      current: categories.projects,
      required: 75,
      impact: 'MEDIUM',
      priority: 4,
      reason: 'Candidates are frequently eliminated in Round 2 when unable to defend design decisions or tech stack choices.',
      action: 'Run Project Defense Simulation for your primary web/AI project.',
      category: 'Project Defense',
      estimatedDaysToClear: 4
    });
  }

  // Check Resume Quality
  if (categories.resume < 75) {
    blockers.push({
      id: 'blocker-resume',
      title: 'Resume ATS Match & Impact Metrics',
      current: categories.resume,
      required: 85,
      impact: 'MEDIUM',
      priority: 5,
      reason: 'Resume lacks quantified impact metrics and specific job description keywords.',
      action: 'Run Resume ↔ JD Matching and add measurable project metrics.',
      category: 'Resume Quality',
      estimatedDaysToClear: 2
    });
  }

  return blockers.slice(0, 4);
}

/**
 * WHAT-IF SIMULATOR ENGINE (Dynamic recalculation & strategy ranking)
 */
export async function simulateWhatIfScenario(userId, hypotheticalScores) {
  const currentReadiness = await calculateReadinessIndex(userId);
  const currentCats = currentReadiness.categories;
  const weights = DEFAULT_WEIGHTS;

  const simulatedCats = {
    technical: hypotheticalScores.technical !== undefined ? Number(hypotheticalScores.technical) : currentCats.technical,
    dsa: hypotheticalScores.dsa !== undefined ? Number(hypotheticalScores.dsa) : currentCats.dsa,
    mockInterview: hypotheticalScores.mockInterview !== undefined ? Number(hypotheticalScores.mockInterview) : currentCats.mockInterview,
    resume: hypotheticalScores.resume !== undefined ? Number(hypotheticalScores.resume) : currentCats.resume,
    aptitude: hypotheticalScores.aptitude !== undefined ? Number(hypotheticalScores.aptitude) : currentCats.aptitude,
    projects: hypotheticalScores.projects !== undefined ? Number(hypotheticalScores.projects) : currentCats.projects,
    communication: hypotheticalScores.communication !== undefined ? Number(hypotheticalScores.communication) : currentCats.communication
  };

  const projectedScore = Math.min(100, Math.max(0, Math.round(
    simulatedCats.technical * weights.technical +
    simulatedCats.dsa * weights.dsa +
    simulatedCats.mockInterview * weights.mockInterview +
    simulatedCats.resume * weights.resume +
    simulatedCats.aptitude * weights.aptitude +
    simulatedCats.projects * weights.projects +
    simulatedCats.communication * weights.communication
  )));

  const projectedGain = projectedScore - currentReadiness.overallReadiness;

  // Calculate individual strategies ranked by impact
  const strategies = [
    {
      area: 'DSA & Problem Solving',
      current: currentCats.dsa,
      target: 85,
      gain: Math.round((85 - currentCats.dsa) * weights.dsa),
      effort: 'Moderate (2-3 weeks)',
      action: 'Master Arrays, Two Pointers, HashMaps, and Binary Search'
    },
    {
      area: 'Core Technical Verification',
      current: currentCats.technical,
      target: 90,
      gain: Math.round((90 - currentCats.technical) * weights.technical),
      effort: 'Low (1 week)',
      action: 'Verify Java, DBMS, and REST API design concepts'
    },
    {
      area: 'Mock Interview Performance',
      current: currentCats.mockInterview,
      target: 85,
      gain: Math.round((85 - currentCats.mockInterview) * weights.mockInterview),
      effort: 'Moderate (1-2 weeks)',
      action: 'Practice concise verbal communication of algorithms and architecture'
    },
    {
      area: 'Resume & ATS Optimization',
      current: currentCats.resume,
      target: 90,
      gain: Math.round((90 - currentCats.resume) * weights.resume),
      effort: 'Very Low (2 days)',
      action: 'Tailor resume keywords to target role and add quantifiable achievements'
    }
  ].filter(s => s.gain > 0).sort((a, b) => b.gain - a.gain);

  return {
    currentReadiness: currentReadiness.overallReadiness,
    projectedScore,
    projectedGain,
    simulatedCategories: simulatedCats,
    bestImprovementStrategies: strategies
  };
}

/**
 * Identify placement risks derived from category scores
 */
async function updatePlacementRisks(userId, categoryScores) {
  const risks = [];

  categoryScores.forEach(c => {
    if (c.score < 50) {
      risks.push({
        category: c.name,
        riskLevel: 'HIGH',
        reason: `Recent performance in ${c.name} is currently ${c.score}%, which is below target placement standards.`,
        evidence: `Assessment/Session average score: ${c.score}%`,
        recommendedAction: `Complete targeted exercises for ${c.name} in your adaptive roadmap.`
      });
    } else if (c.score < 65) {
      risks.push({
        category: c.name,
        riskLevel: 'MEDIUM',
        reason: `Moderate proficiency in ${c.name} (${c.score}%). Further practice required for top companies.`,
        evidence: `Category score: ${c.score}%`,
        recommendedAction: `Schedule 2 extra practice sessions for ${c.name} this week.`
      });
    }
  });

  if (risks.length === 0) {
    risks.push({
      category: 'Overall Readiness',
      riskLevel: 'LOW',
      reason: 'All evaluation categories are performing well above basic readiness thresholds.',
      evidence: 'No critical skill gaps detected.',
      recommendedAction: 'Maintain practice momentum and run full placement simulations.'
    });
  }

  // Clear existing risks & store fresh
  await run('DELETE FROM placement_risks WHERE user_id = ?', [userId]);
  for (const r of risks) {
    await run(
      `INSERT INTO placement_risks (user_id, category, risk_level, reason, evidence, recommended_action) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, r.category, r.riskLevel, r.reason, r.evidence, r.recommendedAction]
    );
  }
}

/**
 * Calculate Company Match Score for candidate profile
 */
export async function calculateCompanyMatch(userId, companyName = 'TCS') {
  const matchRes = await calculateUserCompanyMatch(userId, companyName);

  return {
    company: matchRes.companyName,
    matchPercentage: matchRes.matchScore,
    minReadiness: matchRes.difficulty === 'Very Hard' ? 80 : (matchRes.difficulty === 'Hard' ? 70 : 60),
    description: matchRes.description,
    status: matchRes.readinessLabel,
    strongSkills: matchRes.strongSkills || [],
    weakSkills: matchRes.weakSkills || [],
    whyMatch: matchRes.whyMatch || [],
    whyNotMatch: matchRes.whyNotMatch || [],
    prepPriority: matchRes.prepPriority || 'HIGH',
    breakdown: matchRes.skillBreakdown.map(b => ({
      skill: b.skill,
      matched: b.matched,
      verifiedScore: b.score,
      status: b.status
    }))
  };
}

export default {
  calculateReadinessIndex,
  getPlacementBlockers,
  simulateWhatIfScenario,
  calculateCompanyMatch
};
