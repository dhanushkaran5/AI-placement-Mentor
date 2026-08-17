import { get, run } from '../config/db.js';
import { generateResumeClaimQuestions, evaluateResumeClaims } from '../services/aiService.js';
import { calculateReadinessIndex } from '../services/readinessEngine.js';

export const getClaimQuestions = async (req, res) => {
  try {
    const resume = await get('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
    const skills = resume ? JSON.parse(resume.skills || '[]') : ['Java', 'SQL', 'React'];
    const experience = resume ? JSON.parse(resume.experience || '[]') : [];

    const questions = await generateResumeClaimQuestions(skills, experience);
    res.json(questions);
  } catch (error) {
    console.error('Get resume claim questions error:', error);
    res.status(500).json({ error: error.message || 'Internal server error generating claim verification questions.' });
  }
};

export const verifyClaims = async (req, res) => {
  const { answers } = req.body; // array of { questionId, answer }

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers array is required.' });
  }

  try {
    const result = await evaluateResumeClaims(answers);

    // Save claim verifications into resume record
    const resume = await get('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
    if (resume) {
      resume.claim_verifications = JSON.stringify(result);
      await run(
        'UPDATE resumes SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [req.user.id]
      );
    }

    // Closed loop readiness update
    const updatedReadiness = await calculateReadinessIndex(req.user.id);

    // Log progress
    await run(
      'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
      [req.user.id, 'resume_claim_verification', `Verified resume project claims (Credibility: ${result.credibilityScore}%)`, result.credibilityScore]
    );

    res.json({
      verification: result,
      updatedReadiness: updatedReadiness.overallReadiness
    });
  } catch (error) {
    console.error('Verify resume claims error:', error);
    res.status(500).json({ error: error.message || 'Internal server error evaluating resume claims.' });
  }
};
