import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'database.json');

// Initialize database schema template
let dbData = {
  users: [],
  user_profiles: [],
  resumes: [],
  roadmaps: [],
  company_insights: [],
  mock_interviews: [],
  progress_logs: [],
  verified_skills: [],
  skill_assessments: [],
  coding_submissions: [],
  project_analyses: [],
  daily_missions: [],
  placement_simulations: [],
  readiness_history: [],
  placement_risks: []
};

// Load database from JSON file
export const loadDb = () => {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      const loaded = JSON.parse(content);
      dbData = {
        users: loaded.users || [],
        user_profiles: loaded.user_profiles || [],
        resumes: loaded.resumes || [],
        roadmaps: loaded.roadmaps || [],
        company_insights: loaded.company_insights || [],
        mock_interviews: loaded.mock_interviews || [],
        progress_logs: loaded.progress_logs || [],
        verified_skills: loaded.verified_skills || [],
        skill_assessments: loaded.skill_assessments || [],
        coding_submissions: loaded.coding_submissions || [],
        project_analyses: loaded.project_analyses || [],
        daily_missions: loaded.daily_missions || [],
        placement_simulations: loaded.placement_simulations || [],
        readiness_history: loaded.readiness_history || [],
        placement_risks: loaded.placement_risks || []
      };
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Error loading database.json:', err);
  }
};

// Save database to JSON file
export const saveDb = () => {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database.json:', err);
  }
};

// Initial load
loadDb();

export const initDb = async () => {
  loadDb();
  console.log('JSON Database loaded. All 15 placement tables active.');
  return Promise.resolve();
};

export const get = async (sql, params = []) => {
  loadDb();
  const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. SELECT * FROM users WHERE email = ?
  if (normalized.startsWith('select * from users where email =')) {
    const email = String(params[0]).toLowerCase();
    return dbData.users.find(u => u.email.toLowerCase() === email) || null;
  }

  // 1b. SELECT * FROM users WHERE id = ?
  if (normalized.startsWith('select * from users where id =')) {
    const userId = Number(params[0]);
    return dbData.users.find(u => u.id === userId) || null;
  }

  // 2. SELECT u.name, u.email, p.* FROM users u LEFT JOIN user_profiles p
  if (normalized.includes('select u.name') && normalized.includes('left join user_profiles')) {
    const userId = Number(params[0]);
    const user = dbData.users.find(u => u.id === userId);
    if (!user) return null;
    const profile = dbData.user_profiles.find(p => p.user_id === userId) || {};
    return {
      name: user.name,
      email: user.email,
      target_role: profile.target_role || 'SDE',
      target_company: profile.target_company || 'TCS',
      target_date: profile.target_date || null,
      daily_hours: profile.daily_hours || 4,
      readiness_score: profile.readiness_score || 0
    };
  }

  // 3. SELECT * FROM user_profiles WHERE user_id = ?
  if (normalized.startsWith('select * from user_profiles where user_id =')) {
    const userId = Number(params[0]);
    return dbData.user_profiles.find(p => p.user_id === userId) || null;
  }

  // 4. SELECT * FROM resumes WHERE user_id = ?
  if (normalized.startsWith('select * from resumes where user_id =')) {
    const userId = Number(params[0]);
    return dbData.resumes.find(r => r.user_id === userId) || null;
  }

  // 5. SELECT * FROM roadmaps WHERE user_id = ?
  if (normalized.startsWith('select * from roadmaps where user_id =')) {
    const userId = Number(params[0]);
    const userRoadmaps = dbData.roadmaps.filter(r => r.user_id === userId);
    if (userRoadmaps.length === 0) return null;
    return userRoadmaps[userRoadmaps.length - 1];
  }

  // 6. SELECT * FROM mock_interviews WHERE id = ? AND user_id = ?
  if (normalized.startsWith('select * from mock_interviews where id =') && normalized.includes('user_id =')) {
    const id = Number(params[0]);
    const userId = Number(params[1]);
    return dbData.mock_interviews.find(m => m.id === id && m.user_id === userId) || null;
  }

  // 7. SELECT overall_score FROM readiness_history WHERE user_id = ? ORDER BY id DESC LIMIT 1
  if (normalized.includes('readiness_history where user_id =') && normalized.includes('order by id desc limit 1')) {
    const userId = Number(params[0]);
    const userHistory = dbData.readiness_history.filter(h => h.user_id === userId);
    if (userHistory.length === 0) return null;
    return userHistory[userHistory.length - 1];
  }

  // 8. SELECT count(*) as count FROM company_insights
  if (normalized.startsWith('select count(*) as count from company_insights')) {
    return { count: dbData.company_insights.length };
  }

  // 9. Generic find by user_id and id
  const tableMatch = normalized.match(/from ([a-z0-9_]+)/);
  if (tableMatch && dbData[tableMatch[1]]) {
    const table = dbData[tableMatch[1]];
    if (normalized.includes('where id =')) {
      const id = Number(params[0]);
      return table.find(item => item.id === id) || null;
    }
    if (normalized.includes('where user_id =')) {
      const userId = Number(params[0]);
      return table.find(item => item.user_id === userId) || null;
    }
  }

  return null;
};

export const query = async (sql, params = []) => {
  loadDb();
  const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // SELECT count(*) as count FROM company_insights
  if (normalized.startsWith('select count(*) as count from company_insights')) {
    return [{ count: dbData.company_insights.length }];
  }

  // SELECT * FROM users WHERE email = ?
  if (normalized.startsWith('select * from users where email =')) {
    const email = String(params[0]).toLowerCase();
    return dbData.users.filter(u => u.email.toLowerCase() === email);
  }

  // SELECT * FROM users WHERE id = ?
  if (normalized.startsWith('select * from users where id =')) {
    const id = Number(params[0]);
    return dbData.users.filter(u => u.id === id);
  }

  // 1. SELECT * FROM company_insights
  if (normalized.startsWith('select * from company_insights')) {
    if (normalized.includes('where lower(company) = lower(?)')) {
      const comp = String(params[0]).toLowerCase();
      return dbData.company_insights.filter(c => c.company.toLowerCase() === comp);
    }
    return dbData.company_insights;
  }

  // 2. SELECT * FROM verified_skills WHERE user_id = ?
  if (normalized.startsWith('select * from verified_skills where user_id =')) {
    const userId = Number(params[0]);
    return dbData.verified_skills.filter(v => v.user_id === userId);
  }

  // 3. SELECT * FROM mock_interviews WHERE user_id = ?
  if (normalized.startsWith('select * from mock_interviews where user_id =') || normalized.includes('mock_interviews where user_id =')) {
    const userId = Number(params[0]);
    return dbData.mock_interviews
      .filter(m => m.user_id === userId)
      .sort((a, b) => b.id - a.id);
  }

  // 4. SELECT * FROM coding_submissions WHERE user_id = ?
  if (normalized.startsWith('select * from coding_submissions where user_id =')) {
    const userId = Number(params[0]);
    return dbData.coding_submissions.filter(c => c.user_id === userId).sort((a, b) => b.id - a.id);
  }

  // 5. SELECT * FROM project_analyses WHERE user_id = ?
  if (normalized.startsWith('select * from project_analyses where user_id =')) {
    const userId = Number(params[0]);
    return dbData.project_analyses.filter(p => p.user_id === userId).sort((a, b) => b.id - a.id);
  }

  // 6. SELECT * FROM placement_risks WHERE user_id = ?
  if (normalized.startsWith('select * from placement_risks where user_id =')) {
    const userId = Number(params[0]);
    return dbData.placement_risks.filter(r => r.user_id === userId);
  }

  // 7. SELECT * FROM daily_missions WHERE user_id = ?
  if (normalized.startsWith('select * from daily_missions where user_id =')) {
    const userId = Number(params[0]);
    return dbData.daily_missions.filter(d => d.user_id === userId).sort((a, b) => b.id - a.id);
  }

  // 8. SELECT * FROM placement_simulations WHERE user_id = ?
  if (normalized.startsWith('select * from placement_simulations where user_id =')) {
    const userId = Number(params[0]);
    return dbData.placement_simulations.filter(p => p.user_id === userId).sort((a, b) => b.id - a.id);
  }

  // 9. SELECT * FROM readiness_history WHERE user_id = ?
  if (normalized.startsWith('select * from readiness_history where user_id =')) {
    const userId = Number(params[0]);
    return dbData.readiness_history.filter(h => h.user_id === userId).sort((a, b) => a.id - b.id);
  }

  // 10. SELECT * FROM progress_logs WHERE user_id = ?
  if (normalized.startsWith('select * from progress_logs where user_id =') || normalized.includes('progress_logs where user_id =')) {
    const userId = Number(params[0]);
    return dbData.progress_logs.filter(p => p.user_id === userId).sort((a, b) => b.id - a.id).slice(0, 25);
  }

  // 11. SELECT * FROM skill_assessments WHERE user_id = ?
  if (normalized.startsWith('select * from skill_assessments where user_id =')) {
    const userId = Number(params[0]);
    return dbData.skill_assessments.filter(s => s.user_id === userId).sort((a, b) => b.id - a.id);
  }

  // 12. Generic table fallback
  const tableMatch = normalized.match(/from ([a-z0-9_]+)/);
  if (tableMatch && dbData[tableMatch[1]]) {
    const table = dbData[tableMatch[1]];
    if (normalized.includes('where user_id =') && params.length > 0) {
      const userId = Number(params[0]);
      return table.filter(item => item.user_id === userId);
    }
    return table;
  }

  return [];
};

export const run = async (sql, params = []) => {
  loadDb();
  const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // DELETE FROM placement_risks WHERE user_id = ?
  if (normalized.startsWith('delete from placement_risks where user_id =')) {
    const userId = Number(params[0]);
    dbData.placement_risks = dbData.placement_risks.filter(r => r.user_id !== userId);
    saveDb();
    return { changes: 1 };
  }

  // DELETE FROM users WHERE id = ?
  if (normalized.startsWith('delete from users where id =')) {
    const userId = Number(params[0]);
    dbData.users = dbData.users.filter(u => u.id !== userId);
    saveDb();
    return { changes: 1 };
  }

  // INSERT INTO users
  if (normalized.startsWith('insert into users')) {
    const newId = dbData.users.length > 0 ? Math.max(...dbData.users.map(r => r.id)) + 1 : 1;
    const [name, email, password] = params;
    // Check if user already exists
    const existing = dbData.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (existing) {
      existing.name = name;
      existing.password = password;
      saveDb();
      return { id: existing.id, changes: 1 };
    }
    dbData.users.push({ id: newId, name, email, password, created_at: new Date().toISOString() });
    saveDb();
    return { id: newId, changes: 1 };
  }

  // INSERT INTO user_profiles
  if (normalized.startsWith('insert into user_profiles')) {
    const newId = dbData.user_profiles.length > 0 ? Math.max(...dbData.user_profiles.map(r => r.id)) + 1 : 1;
    const [user_id, target_role, target_company, readiness_score] = params;
    const existing = dbData.user_profiles.find(p => p.user_id === Number(user_id));
    if (existing) {
      existing.target_role = target_role || existing.target_role || 'SDE';
      existing.target_company = target_company || existing.target_company || 'TCS';
      existing.readiness_score = Number(readiness_score !== undefined ? readiness_score : existing.readiness_score);
      existing.updated_at = new Date().toISOString();
      saveDb();
      return { id: existing.id, changes: 1 };
    }
    dbData.user_profiles.push({
      id: newId,
      user_id: Number(user_id),
      target_role: target_role || 'SDE',
      target_company: target_company || 'TCS',
      target_date: null,
      daily_hours: 4,
      readiness_score: Number(readiness_score || 0),
      updated_at: new Date().toISOString()
    });
    saveDb();
    return { id: newId, changes: 1 };
  }

  // UPDATE user_profiles
  if (normalized.startsWith('update user_profiles set')) {
    const userId = Number(params[params.length - 1]);
    let profile = dbData.user_profiles.find(p => p.user_id === userId);
    if (!profile) {
      profile = {
        id: dbData.user_profiles.length > 0 ? Math.max(...dbData.user_profiles.map(r => r.id)) + 1 : 1,
        user_id: userId,
        target_role: 'SDE',
        target_company: 'TCS',
        target_date: null,
        daily_hours: 4,
        readiness_score: 0,
        updated_at: new Date().toISOString()
      };
      dbData.user_profiles.push(profile);
    }
    if (normalized.includes('target_role =')) profile.target_role = params[0];
    if (normalized.includes('target_company =')) profile.target_company = params[1];
    if (normalized.includes('readiness_score =')) {
      profile.readiness_score = Number(params[0] || 0);
    }
    profile.updated_at = new Date().toISOString();
    saveDb();
    return { changes: 1 };
  }

  // Generic Table Insert for all tables
  const insertMatch = normalized.match(/insert into ([a-z0-9_]+)/);
  if (insertMatch && dbData[insertMatch[1]]) {
    const tableName = insertMatch[1];
    const newId = dbData[tableName].length > 0 ? Math.max(...dbData[tableName].map(r => r.id)) + 1 : 1;
    let newItem = { id: newId, created_at: new Date().toISOString() };

    if (tableName === 'verified_skills') {
      const [user_id, skill, level, concept_score, coding_score, debugging_score, verification_score, status] = params;
      dbData.verified_skills = dbData.verified_skills.filter(s => !(s.user_id === Number(user_id) && s.skill.toLowerCase() === skill.toLowerCase()));
      newItem = {
        id: newId,
        user_id: Number(user_id),
        skill,
        level: level || 'Strong',
        concept_score: Number(concept_score || 75),
        coding_score: Number(coding_score || 70),
        debugging_score: Number(debugging_score || 70),
        verification_score: Number(verification_score || 72),
        status: status || 'Verified',
        updated_at: new Date().toISOString()
      };
    } else if (tableName === 'skill_assessments') {
      const [user_id, skill, category, score, questions, user_answers, status] = params;
      newItem = {
        id: newId,
        user_id: Number(user_id),
        skill,
        category: category || 'Technical',
        score: Number(score || 0),
        questions,
        user_answers,
        status: status || 'Completed',
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'coding_submissions') {
      const [user_id, problem_id, problem_title, code, language, status, test_cases_passed, total_test_cases, score, runtime_ms, complexity] = params;
      newItem = {
        id: newId,
        user_id: Number(user_id),
        problem_id,
        problem_title,
        code,
        language: language || 'java',
        status: status || 'Accepted',
        test_cases_passed: Number(test_cases_passed || 0),
        total_test_cases: Number(total_test_cases || 0),
        score: Number(score || 0),
        runtime_ms: Number(runtime_ms || 45),
        complexity: complexity || 'O(N)',
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'project_analyses') {
      const [user_id, project_name, description, tech_stack, github_url, live_url, project_score, metrics, strengths, weaknesses, interview_questions] = params;
      newItem = {
        id: newId,
        user_id: Number(user_id),
        project_name,
        description,
        tech_stack,
        github_url,
        live_url,
        project_score: Number(project_score || 75),
        metrics,
        strengths,
        weaknesses,
        interview_questions,
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'daily_missions') {
      const [user_id, mission_date, tasks, completion_percentage] = params;
      dbData.daily_missions = dbData.daily_missions.filter(m => !(m.user_id === Number(user_id) && m.mission_date === mission_date));
      newItem = {
        id: newId,
        user_id: Number(user_id),
        mission_date,
        tasks,
        completion_percentage: Number(completion_percentage || 0),
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'placement_simulations') {
      const [user_id, company, role, difficulty, rounds, overall_score, verdict] = params;
      newItem = {
        id: newId,
        user_id: Number(user_id),
        company,
        role,
        difficulty: difficulty || 'Medium',
        rounds,
        overall_score: Number(overall_score || 0),
        verdict: verdict || 'Simulation Result',
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'readiness_history') {
      const [user_id, overall_score, category_breakdown, risk_level] = params;
      newItem = {
        id: newId,
        user_id: Number(user_id),
        overall_score: Number(overall_score || 0),
        category_breakdown,
        risk_level: risk_level || 'Moderate',
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'placement_risks') {
      const [user_id, category, risk_level, reason, evidence, recommended_action] = params;
      newItem = {
        id: newId,
        user_id: Number(user_id),
        category,
        risk_level,
        reason,
        evidence,
        recommended_action
      };
    } else if (tableName === 'resumes') {
      const [user_id, raw_text, skills, education, experience, cgpa] = params;
      dbData.resumes = dbData.resumes.filter(r => r.user_id !== Number(user_id));
      newItem = {
        id: newId,
        user_id: Number(user_id),
        raw_text,
        skills,
        education,
        experience,
        cgpa: cgpa ? Number(cgpa) : null,
        claim_verifications: '[]',
        updated_at: new Date().toISOString()
      };
    } else if (tableName === 'roadmaps') {
      const [user_id, target_role, target_company, weeks] = params;
      dbData.roadmaps = dbData.roadmaps.filter(r => r.user_id !== Number(user_id));
      newItem = {
        id: newId,
        user_id: Number(user_id),
        target_role,
        target_company,
        weeks,
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'mock_interviews') {
      const [user_id, target_role, target_company, questions, overall_score] = params;
      newItem = {
        id: newId,
        user_id: Number(user_id),
        target_role,
        target_company,
        questions,
        overall_score: Number(overall_score || 0),
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'progress_logs') {
      const [user_id, activity_type, description, metric_value] = params;
      newItem = {
        id: newId,
        user_id: Number(user_id),
        activity_type,
        description,
        metric_value: Number(metric_value || 0),
        created_at: new Date().toISOString()
      };
    } else if (tableName === 'company_insights') {
      const [company, role, type, title, content, source] = params;
      newItem = { id: newId, company, role, type, title, content, source };
    }

    dbData[tableName].push(newItem);
    saveDb();
    return { id: newId, changes: 1 };
  }

  // Handle Updates
  if (normalized.startsWith('update resumes set')) {
    const userId = Number(params[params.length - 1]);
    const resume = dbData.resumes.find(r => r.user_id === userId);
    if (resume) {
      if (normalized.includes('raw_text =')) {
        resume.raw_text = params[0];
        resume.skills = params[1];
        resume.education = params[2];
        resume.experience = params[3];
        resume.cgpa = params[4] ? Number(params[4]) : null;
      }
      resume.updated_at = new Date().toISOString();
      saveDb();
      return { changes: 1 };
    }
  }

  if (normalized.startsWith('update mock_interviews set')) {
    const id = Number(params[params.length - 1]);
    const mock = dbData.mock_interviews.find(m => m.id === id);
    if (mock) {
      mock.questions = params[0];
      if (normalized.includes('overall_score =')) {
        mock.overall_score = Number(params[1] || 0);
      }
      saveDb();
      return { changes: 1 };
    }
  }

  if (normalized.startsWith('update roadmaps set')) {
    const id = Number(params[params.length - 1]);
    const roadmap = dbData.roadmaps.find(r => r.id === id || r.user_id === id);
    if (roadmap) {
      roadmap.weeks = params[0];
      saveDb();
      return { changes: 1 };
    }
  }

  if (normalized.startsWith('update daily_missions set')) {
    const id = Number(params[params.length - 1]);
    const mission = dbData.daily_missions.find(m => m.id === id);
    if (mission) {
      mission.tasks = params[0];
      mission.completion_percentage = Number(params[1] || 0);
      saveDb();
      return { changes: 1 };
    }
  }

  saveDb();
  return { id: null, changes: 1 };
};

export default {
  query,
  run,
  get,
  initDb,
  loadDb,
  saveDb
};
