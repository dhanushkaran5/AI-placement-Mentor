import { run, get } from '../config/db.js';
import { generateRoadmap, compareSkillsAndScore } from '../services/aiService.js';

export const getRoadmap = async (req, res) => {
  try {
    // Get user's current target profile
    const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
    if (!profile || !profile.target_role || !profile.target_company) {
      return res.status(400).json({ error: 'Please set your target role and company first.' });
    }

    // Get existing roadmap matching user's current target role & company
    const roadmap = await get(
      `SELECT * FROM roadmaps 
       WHERE user_id = ? AND target_role = ? AND target_company = ? 
       ORDER BY id DESC LIMIT 1`,
      [req.user.id, profile.target_role, profile.target_company]
    );

    if (!roadmap) {
      return res.json({ roadmap: null, needsGeneration: true });
    }

    res.json({
      roadmap: {
        id: roadmap.id,
        target_role: roadmap.target_role,
        target_company: roadmap.target_company,
        weeks: JSON.parse(roadmap.weeks),
        created_at: roadmap.created_at
      },
      needsGeneration: false
    });
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({ error: 'Internal server error fetching roadmap.' });
  }
};

export const createRoadmap = async (req, res) => {
  try {
    const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
    if (!profile || !profile.target_role || !profile.target_company) {
      return res.status(400).json({ error: 'Please set your target role and company first.' });
    }

    const { target_role, target_company } = profile;

    // Fetch user resume if exists
    const resume = await get('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
    const resumeSkills = resume ? JSON.parse(resume.skills || '[]') : [];

    // Identify gaps
    const gapAnalysis = await compareSkillsAndScore(resumeSkills, target_role, target_company);
    const missingSkills = gapAnalysis.missingSkills || [];

    console.log(`Generating study roadmap for ${target_role} at ${target_company}...`);
    const generated = await generateRoadmap(resumeSkills, target_role, target_company, missingSkills);

    // Save or replace roadmap
    const result = await run(
      `INSERT INTO roadmaps (user_id, target_role, target_company, weeks) 
       VALUES (?, ?, ?, ?)`,
      [req.user.id, target_role, target_company, JSON.stringify(generated.weeks)]
    );

    // Update profile readiness score
    await run(
      'UPDATE user_profiles SET readiness_score = ? WHERE user_id = ?',
      [gapAnalysis.readinessScore, req.user.id]
    );

    res.status(201).json({
      message: 'Roadmap generated successfully.',
      roadmap: {
        id: result.id,
        target_role,
        target_company,
        weeks: generated.weeks
      }
    });
  } catch (error) {
    console.error('Create roadmap error:', error);
    res.status(500).json({ error: error.message || 'Internal server error generating roadmap.' });
  }
};

export const updateTask = async (req, res) => {
  const { roadmapId, weekIndex, taskIndex, completed } = req.body;

  if (roadmapId === undefined || weekIndex === undefined || taskIndex === undefined || completed === undefined) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const roadmap = await get('SELECT * FROM roadmaps WHERE id = ? AND user_id = ?', [roadmapId, req.user.id]);
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    const weeks = JSON.parse(roadmap.weeks);
    if (!weeks[weekIndex] || !weeks[weekIndex].tasks[taskIndex]) {
      return res.status(400).json({ error: 'Invalid week or task index.' });
    }

    // Update status
    weeks[weekIndex].tasks[taskIndex].completed = completed;
    const taskName = weeks[weekIndex].tasks[taskIndex].text;

    await run('UPDATE roadmaps SET weeks = ? WHERE id = ?', [JSON.stringify(weeks), roadmapId]);

    // Log progress activity if completed
    if (completed) {
      await run(
        'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
        [req.user.id, 'roadmap_task', `Completed task: ${taskName}`, 1]
      );
    }

    res.json({ message: 'Task status updated.', weeks });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error updating task status.' });
  }
};
