import { run, query } from '../config/db.js';
import { calculateReadinessIndex } from '../services/readinessEngine.js';

export const getDailyMission = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  try {
    const missions = await query('SELECT * FROM daily_missions WHERE user_id = ?', [req.user.id]);
    let todayMission = missions.find(m => m.mission_date === today);

    if (!todayMission) {
      // Generate dynamic mission based on user readiness and target company
      const readiness = await calculateReadinessIndex(req.user.id);
      const weakest = readiness.weakestArea;

      const tasks = [
        { id: 1, text: `Solve 2 Array & HashMap problem challenges in Coding Lab`, category: 'DSA', completed: false },
        { id: 2, text: `Revise SQL Joins and Group By queries (Skill Verification)`, category: 'Technical', completed: false },
        { id: 3, text: `Complete 1 Technical Mock Interview question on ${weakest}`, category: 'Interview', completed: false },
        { id: 4, text: `Review 10 Quantitative Aptitude questions for TCS Ninja round`, category: 'Aptitude', completed: false },
        { id: 5, text: `Verify Project claims with Resume Claim Verification`, category: 'Resume', completed: false }
      ];

      const result = await run(
        `INSERT INTO daily_missions (user_id, mission_date, tasks, completion_percentage) 
         VALUES (?, ?, ?, ?)`,
        [req.user.id, today, JSON.stringify(tasks), 0]
      );

      todayMission = {
        id: result.id,
        user_id: req.user.id,
        mission_date: today,
        tasks: JSON.stringify(tasks),
        completion_percentage: 0
      };
    }

    res.json({
      id: todayMission.id,
      missionDate: todayMission.mission_date,
      completionPercentage: todayMission.completion_percentage,
      tasks: typeof todayMission.tasks === 'string' ? JSON.parse(todayMission.tasks) : todayMission.tasks
    });
  } catch (error) {
    console.error('Get daily mission error:', error);
    res.status(500).json({ error: error.message || 'Internal server error fetching daily mission.' });
  }
};

export const updateTaskCompletion = async (req, res) => {
  const { missionId, taskId, completed } = req.body;

  if (missionId === undefined || taskId === undefined) {
    return res.status(400).json({ error: 'missionId and taskId are required.' });
  }

  try {
    const missions = await query('SELECT * FROM daily_missions WHERE user_id = ?', [req.user.id]);
    const mission = missions.find(m => m.id === Number(missionId));

    if (!mission) {
      return res.status(404).json({ error: 'Daily mission record not found.' });
    }

    const tasks = typeof mission.tasks === 'string' ? JSON.parse(mission.tasks) : mission.tasks;
    const taskIndex = tasks.findIndex(t => t.id === Number(taskId));

    if (taskIndex !== -1) {
      tasks[taskIndex].completed = !!completed;
    }

    const completedCount = tasks.filter(t => t.completed).length;
    const completionPercentage = Math.round((completedCount / tasks.length) * 100);

    await run(
      'UPDATE daily_missions SET tasks = ?, completion_percentage = ? WHERE id = ?',
      [JSON.stringify(tasks), completionPercentage, mission.id]
    );

    // Closed loop readiness recalculation
    const updatedReadiness = await calculateReadinessIndex(req.user.id);

    await run(
      'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
      [req.user.id, 'daily_mission', `Completed daily mission task: ${tasks[taskIndex]?.text || ''}`, completionPercentage]
    );

    res.json({
      message: 'Daily mission updated successfully.',
      completionPercentage,
      tasks,
      updatedReadiness: updatedReadiness.overallReadiness
    });
  } catch (error) {
    console.error('Update task completion error:', error);
    res.status(500).json({ error: error.message || 'Internal server error updating task.' });
  }
};
