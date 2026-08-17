import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { initDb, run, query, get, saveDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedPath = path.join(__dirname, 'seedData.json');

export const seedDatabase = async () => {
  try {
    console.log('Starting comprehensive database seeding...');
    await initDb();

    // 1. Seed Company Insights
    const existingInsights = await query('SELECT count(*) as count FROM company_insights');
    if (existingInsights[0]?.count === 0 && fs.existsSync(seedPath)) {
      const rawData = fs.readFileSync(seedPath, 'utf8');
      const seedData = JSON.parse(rawData);

      for (const item of (seedData.insights || [])) {
        await run(
          `INSERT INTO company_insights (company, role, type, title, content, source) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [item.company, item.role, item.type, item.title, item.content, item.source]
        );
      }
      console.log(`✓ Seeded ${seedData.insights?.length || 0} company insights.`);
    }

    // 2. Seed Test Student Account
    const hashedPassword = await bcrypt.hash('password123', 10);
    const existingUser = await get('SELECT * FROM users WHERE email = ?', ['test@example.com']);

    let userId = existingUser?.id;

    if (!existingUser) {
      const userRes = await run(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Test Student', 'test@example.com', hashedPassword]
      );
      userId = userRes.id;
      console.log('✓ Created fresh demo user: test@example.com / password123');
    } else {
      // Ensure password is password123
      const userList = await query('SELECT * FROM users WHERE email = ?', ['test@example.com']);
      if (userList.length > 0) {
        userList[0].password = hashedPassword;
        saveDb();
      }
      console.log('✓ Updated existing demo user password to: password123');
    }

    // 3. User Profile
    await run(
      'INSERT INTO user_profiles (user_id, target_role, target_company, readiness_score) VALUES (?, ?, ?, ?)',
      [userId, 'SDE', 'TCS', 72]
    );

    // 4. Seed Verified Skills
    const skillsToSeed = [
      { skill: 'Java', level: 'Strong', concept: 85, coding: 80, debug: 82, ver: 82 },
      { skill: 'Data Structures & Algorithms', level: 'Moderate', concept: 68, coding: 60, debug: 64, ver: 64 },
      { skill: 'SQL & Database Design', level: 'Strong', concept: 88, coding: 82, debug: 85, ver: 85 },
      { skill: 'JavaScript / React', level: 'Strong', concept: 78, coding: 75, debug: 74, ver: 76 },
      { skill: 'System Design & Architecture', level: 'Moderate', concept: 62, coding: 55, debug: 60, ver: 59 }
    ];

    for (const s of skillsToSeed) {
      await run(
        `INSERT INTO verified_skills (user_id, skill, level, concept_score, coding_score, debugging_score, verification_score, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, s.skill, s.level, s.concept, s.coding, s.debug, s.ver, 'Verified']
      );
    }

    // 5. Seed Coding Submissions
    const codingToSeed = [
      { id: 'p1', title: 'Two Sum Problem', lang: 'java', status: 'Accepted', passed: 10, total: 10, score: 100, runtime: 38, comp: 'O(N)' },
      { id: 'p2', title: 'Valid Anagram & Frequency Map', lang: 'java', status: 'Accepted', passed: 8, total: 8, score: 95, runtime: 42, comp: 'O(N)' },
      { id: 'p3', title: 'Reverse Linked List', lang: 'java', status: 'Accepted', passed: 12, total: 12, score: 90, runtime: 55, comp: 'O(N)' },
      { id: 'p4', title: 'Binary Tree Level Order Traversal', lang: 'java', status: 'Wrong Answer', passed: 4, total: 10, score: 40, runtime: 90, comp: 'O(N)' }
    ];

    for (const c of codingToSeed) {
      await run(
        `INSERT INTO coding_submissions (user_id, problem_id, problem_title, code, language, status, test_cases_passed, total_test_cases, score, runtime_ms, complexity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, c.id, c.title, '// Solution code', c.lang, c.status, c.passed, c.total, c.score, c.runtime, c.comp]
      );
    }

    // 6. Seed Mock Interview
    await run(
      `INSERT INTO mock_interviews (user_id, target_role, target_company, questions, overall_score)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        'SDE',
        'TCS',
        JSON.stringify([
          {
            question: 'Explain how HashMap works internally in Java and how collisions are resolved.',
            user_answer: 'HashMap uses an array of Node buckets. Keys are hashed with hashCode() and mapped to index. In Java 8, bucket converts from LinkedList to Red-Black Tree if bucket size exceeds 8.',
            score: 8.5,
            feedback: 'Strong technical explanation with accurate reference to Java 8 treeification threshold.'
          },
          {
            question: 'What is the difference between Synchronous and Asynchronous execution?',
            user_answer: 'Synchronous blocks execution until task finishes, while Asynchronous executes without blocking and notifies through callbacks or promises.',
            score: 8.0,
            feedback: 'Clear and concise answer.'
          }
        ]),
        8.2
      ]
    );

    // 7. Seed Resume
    await run(
      `INSERT INTO resumes (user_id, raw_text, skills, education, experience, cgpa)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Test Student Resume - B.Tech CS, 8.4 CGPA, Java, SQL, React, Node.js, AWS. Projects in AI and Full-stack.',
        JSON.stringify(['Java', 'SQL', 'React', 'Node.js', 'Python', 'Git', 'AWS', 'DSA', 'Spring Boot']),
        JSON.stringify([{ degree: 'B.Tech in Computer Science', institution: 'State Engineering College', year: '2022-2026', cgpa: '8.4' }]),
        JSON.stringify([{ role: 'Software Engineering Intern', company: 'TechSolutions Inc', duration: '3 Months', description: 'Built REST APIs and UI widgets.' }]),
        8.4
      ]
    );

    // 8. Seed Readiness History (for charts)
    const historyPoints = [
      { score: 55, cats: { technical: 52, dsa: 40, mockInterview: 50, resume: 65, aptitude: 60, projects: 55, communication: 58 }, risk: 'High Risk' },
      { score: 62, cats: { technical: 65, dsa: 48, mockInterview: 60, resume: 75, aptitude: 65, projects: 65, communication: 65 }, risk: 'Moderate' },
      { score: 68, cats: { technical: 75, dsa: 56, mockInterview: 70, resume: 80, aptitude: 70, projects: 70, communication: 72 }, risk: 'Moderate' },
      { score: 72, cats: { technical: 80, dsa: 64, mockInterview: 82, resume: 85, aptitude: 75, projects: 75, communication: 78 }, risk: 'Good' }
    ];

    for (const h of historyPoints) {
      await run(
        `INSERT INTO readiness_history (user_id, overall_score, category_breakdown, risk_level)
         VALUES (?, ?, ?, ?)`,
        [userId, h.score, JSON.stringify(h.cats), h.risk]
      );
    }

    // 9. Seed Daily Mission
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyTasks = [
      { id: 1, title: 'Solve 2 Binary Tree & Queue Coding Problems', category: 'DSA', durationMin: 35, completed: true },
      { id: 2, title: 'Review Java Memory Management & Garbage Collection', category: 'Technical', durationMin: 20, completed: false },
      { id: 3, title: 'Take 10-Minute Quantitative Aptitude Drill', category: 'Aptitude', durationMin: 15, completed: false },
      { id: 4, title: 'Simulate Project Architecture Defense for SDE', category: 'Interview', durationMin: 20, completed: false }
    ];

    await run(
      `INSERT INTO daily_missions (user_id, mission_date, tasks, completion_percentage)
       VALUES (?, ?, ?, ?)`,
      [userId, todayStr, JSON.stringify(dailyTasks), 25]
    );

    console.log('✓ Database seeding and demo verification successfully completed!');
    return true;
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
};

// If run directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDatabase;
