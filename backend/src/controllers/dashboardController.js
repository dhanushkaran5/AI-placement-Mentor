import { get, query } from '../config/db.js';
import { calculateReadinessIndex, getPlacementBlockers, calculateCompanyMatch } from '../services/readinessEngine.js';
import { getCompaniesList } from '../services/companyIntelligenceEngine.js';

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Compute dynamic readiness index
    const readinessData = await calculateReadinessIndex(userId);

    // 2. Fetch user profile
    const profile = await get(
      'SELECT target_role, target_company, target_date, daily_hours, readiness_score FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    const targetRole = profile?.target_role || 'SDE';
    const targetCompany = profile?.target_company || 'TCS';
    const dailyHours = profile?.daily_hours || 4;

    // 3. Fetch top placement blockers
    const blockers = await getPlacementBlockers(userId);

    // 4. Fetch resume status
    const resume = await get(
      'SELECT skills, updated_at FROM resumes WHERE user_id = ?',
      [userId]
    );

    const hasResume = !!resume;
    const resumeSkills = resume ? JSON.parse(resume.skills || '[]') : [];

    // 5. Fetch roadmap progress
    let tasksCompleted = 0;
    let totalTasks = 0;
    const roadmap = await get('SELECT id, weeks FROM roadmaps WHERE user_id = ?', [userId]);

    if (roadmap) {
      const weeks = JSON.parse(roadmap.weeks || '[]');
      weeks.forEach(week => {
        (week.tasks || []).forEach(task => {
          totalTasks++;
          if (task.completed) tasksCompleted++;
        });
      });
    }

    // 6. Fetch mock interview history
    const mockHistory = await query(
      `SELECT id, target_company, target_role, overall_score, created_at 
       FROM mock_interviews 
       WHERE user_id = ? AND overall_score > 0
       ORDER BY id ASC LIMIT 5`,
      [userId]
    );

    // 7. Fetch risks & radar
    const risks = await query('SELECT * FROM placement_risks WHERE user_id = ?', [userId]);
    const verifiedSkills = await query('SELECT * FROM verified_skills WHERE user_id = ?', [userId]);

    // Radar Matrix
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

    // 8. Today's Mission Status
    const today = new Date().toISOString().split('T')[0];
    const missions = await query('SELECT * FROM daily_missions WHERE user_id = ?', [userId]);
    const todayMission = missions.find(m => m.mission_date === today);

    // 9. Quick Company Match for Target + Top 3 Recommendations
    const primaryCompanyMatch = await calculateCompanyMatch(userId, targetCompany);

    const topCompaniesList = ['TCS', 'Infosys', 'Accenture', 'Zoho', 'Amazon', 'Cognizant'];
    const matchedCompanies = [];
    for (const compName of topCompaniesList) {
      if (compName !== targetCompany) {
        const match = await calculateCompanyMatch(userId, compName);
        matchedCompanies.push({
          name: compName,
          matchPercentage: match.matchPercentage,
          status: match.status,
          difficulty: match.minReadiness >= 75 ? 'Hard' : (match.minReadiness >= 65 ? 'Medium' : 'Standard')
        });
      }
    }

    // 10. Estimated Time to Full Placement Readiness (Score >= 85)
    const gapTo85 = Math.max(0, 85 - readinessData.overallReadiness);
    const estimatedWeeks = Math.ceil(gapTo85 / (dailyHours >= 4 ? 4 : 2.5));

    // Recent progress logs
    const recentLogs = await query(
      `SELECT id, activity_type, description, metric_value, created_at 
       FROM progress_logs 
       WHERE user_id = ? 
       ORDER BY id DESC LIMIT 10`,
      [userId]
    );

    res.json({
      profile: {
        name: req.user.name,
        email: req.user.email,
        target_role: targetRole,
        target_company: targetCompany,
        target_date: profile?.target_date || null,
        daily_hours: dailyHours,
        readiness_score: readinessData.overallReadiness
      },
      readiness: readinessData,
      blockers,
      fastestLevers: readinessData.fastestLevers || [],
      commandCenterSummary: {
        whereAmINow: `${readinessData.overallReadiness}/100 (${readinessData.riskLevel})`,
        whatShouldILearn: readinessData.weakestArea,
        whatShouldIPracticeToday: todayMission ? 'Complete active daily mission tasks' : 'Solve 2 DSA tree problems',
        whichCompaniesToTarget: matchedCompanies.slice(0, 3).map(c => `${c.name} (${c.matchPercentage}%)`),
        timelineEstimate: gapTo85 === 0 ? 'Placement Ready Now' : `~${estimatedWeeks} weeks (${gapTo85} pts to reach 85% readiness)`
      },
      risks,
      radar,
      primaryCompanyMatch,
      matchedCompanies: matchedCompanies.slice(0, 4),
      resume: {
        uploaded: hasResume,
        skillsCount: resumeSkills.length,
        skills: resumeSkills,
        updated_at: resume?.updated_at || null
      },
      roadmapProgress: {
        hasRoadmap: !!roadmap,
        totalTasks,
        tasksCompleted,
        completionPercentage: totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0
      },
      dailyMission: {
        completedPercentage: todayMission ? todayMission.completion_percentage : 25,
        tasks: todayMission ? (typeof todayMission.tasks === 'string' ? JSON.parse(todayMission.tasks) : todayMission.tasks) : []
      },
      mockHistory,
      recentLogs
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Internal server error aggregating dashboard data.' });
  }
};

function getSkillScore(verifiedSkills, name, defaultVal) {
  const found = verifiedSkills.find(s => s.skill.toLowerCase().includes(name));
  return found ? (found.verification_score || defaultVal) : defaultVal;
}
