import { evaluateSimulationRound } from '../services/aiService.js';
import { run, query } from '../config/db.js';
import { calculateReadinessIndex } from '../services/readinessEngine.js';
import { getCompanyByIdOrName } from '../services/companyIntelligenceEngine.js';

/**
 * DYNAMICALLY GENERATE SIMULATION CONFIG FROM COMPANY DATABASE
 */
const buildDynamicSimulationConfig = (companyNameOrId) => {
  const company = getCompanyByIdOrName(companyNameOrId) || getCompanyByIdOrName('tcs');

  const roleTitle = company.roles && company.roles.length > 0 ? company.roles[0].title : 'Software Engineer';
  const rounds = [];
  let roundId = 1;

  // Build rounds from assessmentPattern
  if (company.assessmentPattern && company.assessmentPattern.stages) {
    company.assessmentPattern.stages.forEach((stage, idx) => {
      const isCoding = stage.toLowerCase().includes('coding') || stage.toLowerCase().includes('hack') || stage.toLowerCase().includes('programming');
      const isAptitude = stage.toLowerCase().includes('aptitude') || stage.toLowerCase().includes('cognitive') || stage.toLowerCase().includes('mcq') || stage.toLowerCase().includes('verbal');

      rounds.push({
        id: roundId++,
        name: `Round ${roundId - 1}: ${stage}`,
        duration: isCoding ? '60 mins' : '40 mins',
        questionCount: isCoding ? 2 : (isAptitude ? 12 : 5),
        type: isCoding ? 'coding' : (isAptitude ? 'aptitude' : 'technical')
      });
    });
  }

  // Build rounds from interviewPattern
  if (company.interviewPattern && company.interviewPattern.rounds) {
    company.interviewPattern.rounds.forEach((roundName) => {
      const isHr = roundName.toLowerCase().includes('hr') || roundName.toLowerCase().includes('behavioral') || roundName.toLowerCase().includes('managerial');

      rounds.push({
        id: roundId++,
        name: `Interview: ${roundName}`,
        duration: isHr ? '20 mins' : '45 mins',
        questionCount: isHr ? 3 : 4,
        type: isHr ? 'hr' : 'technical'
      });
    });
  }

  // Fallback if empty rounds
  if (rounds.length === 0) {
    rounds.push(
      { id: 1, name: 'Round 1: Cognitive Aptitude & Logic', duration: '30 mins', questionCount: 10, type: 'aptitude' },
      { id: 2, name: 'Round 2: Technical Coding Assessment', duration: '45 mins', questionCount: 2, type: 'coding' },
      { id: 3, name: 'Round 3: Core Technical & HR Interview', duration: '30 mins', questionCount: 3, type: 'technical' }
    );
  }

  return {
    companyId: company.id,
    name: `${company.name} Placement Simulation Drive`,
    role: roleTitle,
    difficulty: company.difficulty,
    rounds
  };
};

export const getSimulationConfig = async (req, res) => {
  try {
    const { company } = req.query;
    const config = buildDynamicSimulationConfig(company || 'tcs');
    res.json(config);
  } catch (error) {
    console.error('Get simulation config error:', error);
    res.status(500).json({ error: 'Internal server error fetching simulation config.' });
  }
};

export const startSimulation = async (req, res) => {
  const { company, role, difficulty } = req.body;
  const targetComp = company || 'tcs';
  const config = buildDynamicSimulationConfig(targetComp);

  try {
    const result = await run(
      `INSERT INTO placement_simulations (user_id, company, role, difficulty, rounds, overall_score, verdict) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, config.name, role || config.role, difficulty || config.difficulty, JSON.stringify([]), 0, 'In Progress']
    );

    res.status(201).json({
      simulationId: result.id,
      company: config.name,
      role: role || config.role,
      config
    });
  } catch (error) {
    console.error('Start simulation error:', error);
    res.status(500).json({ error: error.message || 'Internal server error starting placement simulation.' });
  }
};

export const submitRoundResult = async (req, res) => {
  const { simulationId, roundName, score, submissionDetails } = req.body;

  if (!simulationId || !roundName || score === undefined) {
    return res.status(400).json({ error: 'simulationId, roundName, and score are required.' });
  }

  try {
    // Fetch existing simulation
    const simList = await query('SELECT * FROM placement_simulations WHERE user_id = ?', [req.user.id]);
    const sim = simList.find(s => s.id === Number(simulationId));

    if (!sim) {
      return res.status(404).json({ error: 'Simulation session not found.' });
    }

    const evalResult = await evaluateSimulationRound(sim.company || 'TCS', roundName, submissionDetails || {});

    const rounds = JSON.parse(sim.rounds || '[]');
    rounds.push({
      roundName,
      score: Number(score),
      evalResult,
      timestamp: new Date().toISOString()
    });

    const avgScore = Math.round(rounds.reduce((sum, r) => sum + r.score, 0) / rounds.length);
    const verdict = avgScore >= 70 ? 'Simulation Result: Recommended for Hiring' : 'Simulation Result: Needs Preparation';

    sim.rounds = JSON.stringify(rounds);
    sim.overall_score = avgScore;
    sim.verdict = verdict;

    await run(
      `INSERT INTO placement_simulations (user_id, company, role, difficulty, rounds, overall_score, verdict) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, sim.company, sim.role, sim.difficulty, sim.rounds, sim.overall_score, sim.verdict]
    );

    // Closed loop update
    const updatedReadiness = await calculateReadinessIndex(req.user.id);

    await run(
      'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
      [req.user.id, 'placement_simulation', `Completed ${roundName} for ${sim.company} simulation`, score]
    );

    res.json({
      roundName,
      score,
      overallScore: avgScore,
      verdict,
      evalResult,
      roundsCompleted: rounds.length,
      updatedReadiness: updatedReadiness.overallReadiness
    });
  } catch (error) {
    console.error('Submit simulation round error:', error);
    res.status(500).json({ error: error.message || 'Internal server error processing round submission.' });
  }
};

export const getSimulationHistory = async (req, res) => {
  try {
    const history = await query('SELECT * FROM placement_simulations WHERE user_id = ?', [req.user.id]);
    res.json(history);
  } catch (error) {
    console.error('Get simulation history error:', error);
    res.status(500).json({ error: 'Internal server error fetching simulation history.' });
  }
};
