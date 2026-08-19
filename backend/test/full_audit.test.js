import http from 'http';
import express from 'express';
import cors from 'cors';
import { initDb, query, get, run } from '../src/config/db.js';
import { seedDatabase } from '../src/config/seed.js';
import authRoutes from '../src/routes/authRoutes.js';
import resumeRoutes from '../src/routes/resumeRoutes.js';
import roadmapRoutes from '../src/routes/roadmapRoutes.js';
import companyRoutes from '../src/routes/companyRoutes.js';
import mockRoutes from '../src/routes/mockRoutes.js';
import dashboardRoutes from '../src/routes/dashboardRoutes.js';
import readinessRoutes from '../src/routes/readinessRoutes.js';
import verificationRoutes from '../src/routes/verificationRoutes.js';
import simulationRoutes from '../src/routes/simulationRoutes.js';
import codingRoutes from '../src/routes/codingRoutes.js';
import missionRoutes from '../src/routes/missionRoutes.js';
import projectRoutes from '../src/routes/projectRoutes.js';
import errorMiddleware from '../src/middleware/errorMiddleware.js';
import { getCompaniesList } from '../src/services/companyIntelligenceEngine.js';

async function runComprehensiveAudit() {
  console.log('================================================================');
  console.log('🔬 EXECUTING COMPREHENSIVE FULL-STACK RELEASE AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(` ✅ PASS: ${name}`);
      passed++;
      testResults.push({ name, status: 'PASS' });
    } catch (err) {
      console.error(` ❌ FAIL: ${name} -> ${err.message}`);
      failed++;
      testResults.push({ name, status: 'FAIL', error: err.message });
    }
  };

  const assert = (cond, msg) => {
    if (!cond) throw new Error(msg || 'Assertion failed');
  };

  // 1. Initialize Database & Seed
  await test('Database initialization and seeding', async () => {
    await initDb();
    await seedDatabase();
    const users = await query('SELECT * FROM users');
    assert(users.length > 0, 'No users found after seed');
  });

  // 2. Setup Express Server with ALL Routes
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/roadmap', roadmapRoutes);
  app.use('/api/company', companyRoutes);
  app.use('/api/mock', mockRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/readiness', readinessRoutes);
  app.use('/api/verification', verificationRoutes);
  app.use('/api/simulation', simulationRoutes);
  app.use('/api/coding', codingRoutes);
  app.use('/api/mission', missionRoutes);
  app.use('/api/projects', projectRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'AI Placement Mentor API',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/health/diagnostics', async (req, res) => {
    const users = await query('SELECT * FROM users');
    const insights = await query('SELECT count(*) as count FROM company_insights');
    const companies = getCompaniesList();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        frontend: { status: 'healthy', ok: true },
        backend: { status: 'healthy', ok: true },
        database: { status: 'healthy', ok: true, usersCount: users.length, insightsCount: insights[0]?.count || 0 },
        authentication: { status: 'healthy', ok: users.some(u => u.email === 'test@example.com') },
        companyData: { status: 'healthy', count: companies.length, ok: companies.length >= 30 }
      }
    });
  });

  app.use(errorMiddleware);

  const AUDIT_PORT = 5088;
  const server = app.listen(AUDIT_PORT);

  const apiRequest = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const reqOpts = {
        hostname: 'localhost',
        port: AUDIT_PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      };

      const req = http.request(reqOpts, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  // 3. API Health & Diagnostics
  await test('GET /api/health returns 200 with healthy status', async () => {
    const res = await apiRequest('/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.status === 'healthy', 'Status is not healthy');
  });

  await test('GET /api/health/diagnostics returns complete service telemetry', async () => {
    const res = await apiRequest('/api/health/diagnostics');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.services.database.ok === true, 'Database service not ok');
    assert(res.data.services.authentication.ok === true, 'Authentication service not ok');
    assert(res.data.services.companyData.count >= 30, 'Company database not populated');
  });

  // 4. Authentication Tests
  let demoToken = null;
  await test('POST /api/auth/login with demo account (test@example.com / password123)', async () => {
    const res = await apiRequest('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(!!res.data.token, 'Token missing');
    demoToken = res.data.token;
  });

  let newUserToken = null;
  const newEmail = `candidate_${Date.now()}@test.com`;
  await test('POST /api/auth/register with new student account', async () => {
    const res = await apiRequest('/api/auth/register', 'POST', {
      name: 'Aditi Sharma',
      email: newEmail,
      password: 'password123'
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(!!res.data.token, 'Token missing in registration');
    newUserToken = res.data.token;
  });

  await test('GET /api/auth/profile returns user details for valid token', async () => {
    const res = await apiRequest('/api/auth/profile', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.email === 'test@example.com', 'Profile email mismatch');
    assert(res.data.target_company === 'TCS', 'Target company mismatch');
  });

  await test('PUT /api/auth/profile updates target role and company', async () => {
    const res = await apiRequest('/api/auth/profile', 'PUT', {
      target_role: 'Full Stack Engineer',
      target_company: 'Infosys'
    }, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const verify = await apiRequest('/api/auth/profile', 'GET', null, demoToken);
    assert(verify.data.target_role === 'Full Stack Engineer', 'Target role update not persisted');
    assert(verify.data.target_company === 'Infosys', 'Target company update not persisted');
  });

  await test('GET /api/auth/profile with invalid token returns HTTP 401 Unauthorized', async () => {
    const res = await apiRequest('/api/auth/profile', 'GET', null, 'invalid_token_123');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 5. Dashboard Data
  await test('GET /api/dashboard returns comprehensive command center payload', async () => {
    const res = await apiRequest('/api/dashboard', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.data.readiness?.overallReadiness === 'number', 'Readiness score missing');
    assert(Array.isArray(res.data.radar), 'Radar data missing');
    assert(Array.isArray(res.data.matchedCompanies), 'Matched companies missing');
  });

  // 6. Resume & Skills
  await test('GET /api/resume returns structured resume data', async () => {
    const res = await apiRequest('/api/resume', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.skills), 'Skills array missing in resume');
  });

  await test('GET /api/resume/gap-analysis returns skills gap comparison', async () => {
    const res = await apiRequest('/api/resume/gap-analysis', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.data.readinessScore === 'number', 'Gap readiness score missing');
  });

  // 7. Company Intelligence & Opportunities Matrix
  await test('GET /api/company/list returns 30+ enterprise company profiles', async () => {
    const res = await apiRequest('/api/company/list', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data) && res.data.length >= 30, `Expected >= 30 companies, got ${res.data?.length}`);
  });

  await test('GET /api/company/tcs returns company profile with match calculation', async () => {
    const res = await apiRequest('/api/company/tcs', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.id === 'tcs', 'Company id mismatch');
  });

  await test('GET /api/company/matrix returns placement opportunities matrix', async () => {
    const res = await apiRequest('/api/company/matrix', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Matrix is not an array');
  });

  await test('POST /api/company/compare compares multiple companies', async () => {
    const res = await apiRequest('/api/company/compare', 'POST', {
      companyIds: ['tcs', 'infosys', 'zoho']
    }, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data) && res.data.length === 3, 'Comparison results mismatch');
  });

  // 8. Coding Lab
  await test('GET /api/coding/problems returns DSA coding challenges', async () => {
    const res = await apiRequest('/api/coding/problems', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data) && res.data.length > 0, 'Problems array empty');
  });

  await test('POST /api/coding/submit evaluates DSA code and calculates score', async () => {
    const res = await apiRequest('/api/coding/submit', 'POST', {
      problemId: 1,
      problemTitle: 'Two Sum - Target Index Matching',
      code: 'class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0,1}; } }',
      language: 'java'
    }, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.evaluation && typeof res.data.evaluation.score === 'number', 'Evaluation score missing');
  });

  // 9. Mock Interview
  let mockSessionId = null;
  let mockQuestions = [];
  await test('POST /api/mock/start initializes interview session (HTTP 201)', async () => {
    const res = await apiRequest('/api/mock/start', 'POST', {
      targetRole: 'SDE',
      targetCompany: 'TCS'
    }, demoToken);
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(!!res.data.sessionId, 'SessionId missing');
    assert(Array.isArray(res.data.questions) && res.data.questions.length > 0, 'Questions missing');
    mockSessionId = res.data.sessionId;
    mockQuestions = res.data.questions;
  });

  await test('POST /api/mock/submit evaluates candidate response', async () => {
    const qId = mockQuestions[0]?.id || 1;
    const res = await apiRequest('/api/mock/submit', 'POST', {
      sessionId: mockSessionId,
      questionId: qId,
      answer: 'HashMap uses buckets and hashes the keys with hashCode() to find bucket indexes. Collisions are handled using linked nodes and trees.'
    }, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.data.evaluation?.score === 'number', 'Score missing in mock answer');
  });

  // 10. Roadmap & Daily Mission
  await test('GET /api/roadmap returns placement preparation roadmap', async () => {
    const res = await apiRequest('/api/roadmap', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('POST /api/roadmap/generate creates new personalized roadmap (HTTP 201)', async () => {
    const res = await apiRequest('/api/roadmap/generate', 'POST', {
      targetRole: 'SDE',
      targetCompany: 'TCS'
    }, demoToken);
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(Array.isArray(res.data.roadmap?.weeks), 'Generated roadmap weeks is not an array');
  });

  await test('GET /api/mission/today returns daily structured tasks', async () => {
    const res = await apiRequest('/api/mission/today', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.tasks), 'Mission tasks missing');
  });

  // 11. Readiness & Simulations
  await test('GET /api/readiness returns multi-pillar index calculation', async () => {
    const res = await apiRequest('/api/readiness', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.data.readiness?.overallReadiness === 'number', 'Overall readiness missing');
    assert(Array.isArray(res.data.radar), 'Radar data missing');
  });

  await test('POST /api/readiness/whatif calculates simulated readiness impact', async () => {
    const res = await apiRequest('/api/readiness/whatif', 'POST', {
      dsaDelta: 15,
      projectsDelta: 10,
      interviewDelta: 10
    }, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.data.projectedScore === 'number', 'Projected score missing');
  });

  // 12. Verification & Projects
  await test('GET /api/verification/skills/quiz generates skill assessment questions', async () => {
    const res = await apiRequest('/api/verification/skills/quiz?skill=Java', 'GET', null, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.questions), 'Quiz questions missing');
  });

  await test('POST /api/projects/analyze evaluates student project portfolio', async () => {
    const res = await apiRequest('/api/projects/analyze', 'POST', {
      projectName: 'AI Placement Mentor Agent',
      description: 'Career intelligence and coaching platform',
      techStack: 'React, Node.js, Express, JSON DB',
      githubUrl: 'https://github.com/dhanushkaran5/AI-placement-Mentor'
    }, demoToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.data.analysis?.projectScore === 'number', 'Project score missing');
  });

  server.close();

  console.log('\n================================================================');
  console.log(`📊 FINAL AUDIT SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runComprehensiveAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
