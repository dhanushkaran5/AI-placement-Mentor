import { generateSkillQuiz } from '../services/aiService.js';
import { run, query } from '../config/db.js';
import { calculateReadinessIndex } from '../services/readinessEngine.js';

export const getSkillAssessment = async (req, res) => {
  const { skill } = req.query;
  const targetSkill = skill || 'Java';

  try {
    const quiz = await generateSkillQuiz(targetSkill);
    res.json(quiz);
  } catch (error) {
    console.error('Get skill assessment error:', error);
    res.status(500).json({ error: error.message || 'Internal server error generating skill assessment.' });
  }
};

export const submitSkillAssessment = async (req, res) => {
  const { skill, answers } = req.body; // answers: { [questionId]: optionIndex }

  if (!skill || !answers) {
    return res.status(400).json({ error: 'Skill and answers are required.' });
  }

  try {
    const quiz = await generateSkillQuiz(skill);
    let correctCount = 0;
    const questions = quiz.questions;

    questions.forEach(q => {
      if (answers[q.id] !== undefined && Number(answers[q.id]) === q.correctIndex) {
        correctCount++;
      }
    });

    const verificationScore = Math.round((correctCount / questions.length) * 100);
    
    let level = 'Beginner';
    if (verificationScore >= 85) level = 'Expert';
    else if (verificationScore >= 70) level = 'Strong';
    else if (verificationScore >= 50) level = 'Intermediate';

    const conceptScore = verificationScore;
    const codingScore = Math.min(100, verificationScore + (verificationScore > 60 ? 5 : -5));
    const debuggingScore = Math.min(100, verificationScore + (verificationScore > 60 ? 2 : -2));

    // Save assessment result in DB
    await run(
      `INSERT INTO skill_assessments (user_id, skill, category, score, questions, user_answers, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, skill, 'Technical', verificationScore, JSON.stringify(questions), JSON.stringify(answers), 'Completed']
    );

    // Update verified_skills in DB
    await run(
      `INSERT INTO verified_skills (user_id, skill, level, concept_score, coding_score, debugging_score, verification_score, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, skill, level, conceptScore, codingScore, debuggingScore, verificationScore, 'Verified']
    );

    // Closed-loop: Recalculate Placement Readiness
    const updatedReadiness = await calculateReadinessIndex(req.user.id);

    // Log activity
    await run(
      'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
      [req.user.id, 'skill_verification', `Verified ${skill} skill: ${verificationScore}% (${level})`, verificationScore]
    );

    res.json({
      message: `Skill ${skill} verified successfully.`,
      skill,
      level,
      verificationScore,
      conceptScore,
      codingScore,
      debuggingScore,
      correctCount,
      totalQuestions: questions.length,
      updatedReadiness: updatedReadiness.overallReadiness
    });
  } catch (error) {
    console.error('Submit skill assessment error:', error);
    res.status(500).json({ error: error.message || 'Internal server error evaluating assessment.' });
  }
};

export const getVerifiedSkills = async (req, res) => {
  try {
    const verified = await query('SELECT * FROM verified_skills WHERE user_id = ?', [req.user.id]);
    res.json(verified);
  } catch (error) {
    console.error('Get verified skills error:', error);
    res.status(500).json({ error: 'Internal server error fetching verified skills.' });
  }
};
