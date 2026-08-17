import { run, get, query } from '../config/db.js';
import { generateMockQuestions, evaluateMockAnswer, getInterviewWeaknessMemory } from '../services/aiService.js';
import { calculateReadinessIndex } from '../services/readinessEngine.js';

export const startSession = async (req, res) => {
  try {
    const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
    if (!profile || !profile.target_role || !profile.target_company) {
      return res.status(400).json({ error: 'Please set your target role and company first.' });
    }

    const { target_role, target_company } = profile;

    // Fetch user resume if exists
    const resume = await get('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
    const resumeSkills = resume ? JSON.parse(resume.skills || '[]') : [];

    console.log(`Generating mock interview questions for ${target_role} at ${target_company}...`);
    const questionList = await generateMockQuestions(resumeSkills, target_role, target_company);

    // Prepare questions schema (with placeholder for answers/feedback)
    const questions = questionList.map(q => ({
      id: q.id,
      text: q.text,
      category: q.category,
      userAnswer: '',
      score: 0,
      feedback: null
    }));

    // Create session in database
    const result = await run(
      `INSERT INTO mock_interviews (user_id, target_role, target_company, questions, overall_score) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, target_role, target_company, JSON.stringify(questions), 0]
    );

    res.status(201).json({
      sessionId: result.id,
      target_role,
      target_company,
      questions
    });
  } catch (error) {
    console.error('Start mock session error:', error);
    res.status(500).json({ error: error.message || 'Internal server error starting mock interview.' });
  }
};

export const submitAnswer = async (req, res) => {
  const { sessionId, questionId, answer } = req.body;

  if (sessionId === undefined || questionId === undefined || !answer) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const session = await get('SELECT * FROM mock_interviews WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
    if (!session) {
      return res.status(404).json({ error: 'Mock interview session not found.' });
    }

    const questions = JSON.parse(session.questions);
    const qIndex = questions.findIndex(q => q.id === questionId);

    if (qIndex === -1) {
      return res.status(404).json({ error: 'Question not found in session.' });
    }

    console.log(`Evaluating answer to question: "${questions[qIndex].text}"...`);
    const evaluation = await evaluateMockAnswer(questions[qIndex].text, answer);

    // Update questions array with answer and feedback
    questions[qIndex].userAnswer = answer;
    questions[qIndex].score = evaluation.score;
    questions[qIndex].feedback = evaluation.feedback;
    questions[qIndex].rating = evaluation.rating;

    // Check if session is completed (all questions answered)
    const answeredCount = questions.filter(q => q.userAnswer && q.userAnswer.trim().length > 0).length;
    const isCompleted = answeredCount === questions.length;

    let overallScore = 0;
    if (isCompleted) {
      const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
      overallScore = Math.round((totalScore / questions.length) * 10) / 10;
      
      // Update overall score in session
      await run(
        'UPDATE mock_interviews SET questions = ?, overall_score = ? WHERE id = ?',
        [JSON.stringify(questions), overallScore, sessionId]
      );

      // Closed loop update: Recalculate readiness
      await calculateReadinessIndex(req.user.id);

      // Log progress activity
      await run(
        'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
        [req.user.id, 'mock_interview', `Completed mock interview for ${session.target_role} at ${session.target_company} (Score: ${overallScore}/10)`, overallScore * 10]
      );
    } else {
      await run('UPDATE mock_interviews SET questions = ? WHERE id = ?', [JSON.stringify(questions), sessionId]);
    }

    res.json({
      evaluation,
      isCompleted,
      overallScore
    });
  } catch (error) {
    console.error('Submit mock answer error:', error);
    res.status(500).json({ error: error.message || 'Internal server error evaluating answer.' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await query(
      `SELECT id, target_role, target_company, overall_score, created_at 
       FROM mock_interviews 
       WHERE user_id = ? 
       ORDER BY id DESC`,
      [req.user.id]
    );

    res.json(history);
  } catch (error) {
    console.error('Get mock history error:', error);
    res.status(500).json({ error: 'Internal server error fetching history.' });
  }
};

export const getSessionDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await get('SELECT * FROM mock_interviews WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!session) {
      return res.status(404).json({ error: 'Mock interview session not found.' });
    }

    res.json({
      id: session.id,
      target_role: session.target_role,
      target_company: session.target_company,
      overall_score: session.overall_score,
      questions: JSON.parse(session.questions),
      created_at: session.created_at
    });
  } catch (error) {
    console.error('Get mock session details error:', error);
    res.status(500).json({ error: 'Internal server error fetching session details.' });
  }
};

/**
 * Get Interview Weakness Memory (Feature 15)
 */
export const getWeaknessMemory = async (req, res) => {
  try {
    const history = await query('SELECT * FROM mock_interviews WHERE user_id = ?', [req.user.id]);
    const memory = await getInterviewWeaknessMemory(req.user.id, history);
    res.json(memory);
  } catch (error) {
    console.error('Get interview weakness memory error:', error);
    res.status(500).json({ error: 'Internal server error fetching weakness memory.' });
  }
};
