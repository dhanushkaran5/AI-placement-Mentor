import { analyzeProjectPortfolio, generateProjectDefenseQuestion, evaluateProjectDefenseAnswer } from '../services/aiService.js';
import { run, query } from '../config/db.js';
import { calculateReadinessIndex } from '../services/readinessEngine.js';

export const analyzeProject = async (req, res) => {
  const { projectName, description, techStack, githubUrl, liveUrl } = req.body;

  if (!projectName || !description || !techStack) {
    return res.status(400).json({ error: 'Project name, description, and tech stack are required.' });
  }

  try {
    const analysis = await analyzeProjectPortfolio(projectName, description, techStack, githubUrl || '', liveUrl || '');

    // Save project analysis
    await run(
      `INSERT INTO project_analyses (user_id, project_name, description, tech_stack, github_url, live_url, project_score, metrics, strengths, weaknesses, interview_questions) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        projectName,
        description,
        techStack,
        githubUrl || '',
        liveUrl || '',
        analysis.projectScore,
        JSON.stringify(analysis),
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.weaknesses),
        JSON.stringify(analysis.potentialInterviewQuestions)
      ]
    );

    // Closed loop readiness update
    const updatedReadiness = await calculateReadinessIndex(req.user.id);

    // Log progress
    await run(
      'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
      [req.user.id, 'project_analysis', `Analyzed project portfolio: ${projectName} (${analysis.projectScore}%)`, analysis.projectScore]
    );

    res.json({
      analysis,
      updatedReadiness: updatedReadiness.overallReadiness
    });
  } catch (error) {
    console.error('Analyze project error:', error);
    res.status(500).json({ error: error.message || 'Internal server error analyzing project portfolio.' });
  }
};

export const getProjectHistory = async (req, res) => {
  try {
    const history = await query('SELECT * FROM project_analyses WHERE user_id = ?', [req.user.id]);
    res.json(history);
  } catch (error) {
    console.error('Get project history error:', error);
    res.status(500).json({ error: 'Internal server error fetching project history.' });
  }
};

/**
 * Generate Next Project Defense Question (Feature 17)
 */
export const getDefenseQuestion = async (req, res) => {
  const { project, previousRounds } = req.body;

  if (!project) {
    return res.status(400).json({ error: 'Project details are required for defense questions.' });
  }

  try {
    const defenseQuestion = await generateProjectDefenseQuestion(project, previousRounds || []);
    res.json(defenseQuestion);
  } catch (error) {
    console.error('Generate defense question error:', error);
    res.status(500).json({ error: error.message || 'Internal server error generating defense question.' });
  }
};

/**
 * Evaluate Candidate Answer to Project Defense Question (Feature 17)
 */
export const evaluateDefense = async (req, res) => {
  const { project, question, answer } = req.body;

  if (!project || !question || !answer) {
    return res.status(400).json({ error: 'Project, question, and answer are all required for evaluation.' });
  }

  try {
    const evaluation = await evaluateProjectDefenseAnswer(project, question, answer);

    // Closed-loop update to readiness score if score is high
    if (evaluation.scores?.overallScore) {
      await calculateReadinessIndex(req.user.id);
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Evaluate defense error:', error);
    res.status(500).json({ error: error.message || 'Internal server error evaluating defense response.' });
  }
};
