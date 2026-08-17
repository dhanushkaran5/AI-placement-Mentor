import { calculateReadinessIndex, calculateCompanyMatch, getPlacementBlockers, simulateWhatIfScenario } from '../services/readinessEngine.js';
import { get, query, run } from '../config/db.js';

export const getReadiness = async (req, res) => {
  try {
    const readinessData = await calculateReadinessIndex(req.user.id);
    const history = await query('SELECT id, overall_score, category_breakdown, risk_level, created_at FROM readiness_history WHERE user_id = ? ORDER BY id ASC', [req.user.id]);
    const risks = await query('SELECT * FROM placement_risks WHERE user_id = ?', [req.user.id]);
    const blockers = await getPlacementBlockers(req.user.id);

    // Skill Radar Data
    const verifiedSkills = await query('SELECT * FROM verified_skills WHERE user_id = ?', [req.user.id]);

    const radar = [
      { subject: 'Java / Backend', score: getSkillScore(verifiedSkills, 'java', 75) },
      { subject: 'Python / Data', score: getSkillScore(verifiedSkills, 'python', 65) },
      { subject: 'SQL / DBMS', score: getSkillScore(verifiedSkills, 'sql', 70) },
      { subject: 'DSA & Logic', score: readinessData.categories.dsa },
      { subject: 'Aptitude', score: readinessData.categories.aptitude },
      { subject: 'Communication', score: readinessData.categories.communication },
      { subject: 'Projects', score: readinessData.categories.projects },
      { subject: 'Tech Interview', score: readinessData.categories.mockInterview },
      { subject: 'HR Interview', score: Math.min(95, readinessData.categories.mockInterview + 5) }
    ];

    res.json({
      readiness: readinessData,
      history,
      risks,
      blockers,
      radar
    });
  } catch (error) {
    console.error('Get readiness index error:', error);
    res.status(500).json({ error: error.message || 'Internal server error calculating readiness.' });
  }
};

function getSkillScore(verifiedSkills, name, defaultVal) {
  const found = verifiedSkills.find(s => s.skill.toLowerCase().includes(name));
  return found ? (found.verification_score || defaultVal) : defaultVal;
}

export const getBlockers = async (req, res) => {
  try {
    const blockers = await getPlacementBlockers(req.user.id);
    res.json({ blockers });
  } catch (error) {
    console.error('Get blockers error:', error);
    res.status(500).json({ error: 'Internal server error fetching placement blockers.' });
  }
};

export const runWhatIfSimulation = async (req, res) => {
  try {
    const result = await simulateWhatIfScenario(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('What-if error:', error);
    res.status(500).json({ error: 'Internal server error running What-If simulation.' });
  }
};

export const getCompanyMatch = async (req, res) => {
  const { company } = req.query;
  const targetComp = company || 'TCS';

  try {
    const match = await calculateCompanyMatch(req.user.id, targetComp);
    res.json(match);
  } catch (error) {
    console.error('Get company match error:', error);
    res.status(500).json({ error: 'Internal server error calculating company match score.' });
  }
};

export const setCountdownTarget = async (req, res) => {
  const { target_company, target_role, target_date, daily_hours } = req.body;

  try {
    await run(
      `UPDATE user_profiles 
       SET target_company = ?, target_role = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [target_company, target_role, req.user.id]
    );

    const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
    if (profile) {
      profile.target_date = target_date;
      profile.daily_hours = Number(daily_hours || 4);
    }

    res.json({ message: 'Placement target and countdown updated successfully.', profile });
  } catch (error) {
    console.error('Set countdown target error:', error);
    res.status(500).json({ error: 'Internal server error updating countdown target.' });
  }
};
