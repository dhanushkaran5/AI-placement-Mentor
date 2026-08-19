import http from 'http';
import { initDb, query, get } from '../src/config/db.js';
import { seedDatabase } from '../src/config/seed.js';
import express from 'express';
import cors from 'cors';
import authRoutes from '../src/routes/authRoutes.js';
import errorMiddleware from '../src/middleware/errorMiddleware.js';

async function runSmokeTest() {
  console.log('==================================================');
  console.log('🚀 Running AI Placement Mentor Backend Smoke Test');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(` ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // 1. Test Database Initialization & Seeding
    console.log('\n[1] Testing Database Initialization & Seeding...');
    await initDb();
    await seedDatabase();
    
    const users = await query('SELECT * FROM users');
    assert(users.length > 0, `Database contains ${users.length} user(s).`);

    const demoUser = await get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
    assert(!!demoUser, 'Demo user (test@example.com) exists in JSON database.');

    const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [demoUser?.id]);
    assert(!!profile, 'Demo user profile exists.');

    const insights = await query('SELECT * FROM company_insights');
    assert(insights.length > 0, `Company insights count: ${insights.length}`);

    // 2. Setup Temporary Test Server
    console.log('\n[2] Testing Express API Endpoints & Auth Flow...');
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.get('/api/health', (req, res) => res.json({ status: 'healthy', service: 'AI Placement Mentor API' }));
    app.use(errorMiddleware);

    const TEST_PORT = 5099;
    const server = app.listen(TEST_PORT);

    const request = (path, method = 'GET', body = null, token = null) => {
      return new Promise((resolve, reject) => {
        const reqOpts = {
          hostname: 'localhost',
          port: TEST_PORT,
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

    // 3. Test /api/health
    const healthRes = await request('/api/health');
    assert(healthRes.status === 200 && healthRes.data.status === 'healthy', 'GET /api/health returns 200 healthy status.');

    // 4. Test Login
    const loginRes = await request('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123'
    });
    assert(loginRes.status === 200 && !!loginRes.data.token, 'POST /api/auth/login returns token for demo account.');
    const token = loginRes.data.token;

    // 5. Test Auth Profile
    const profileRes = await request('/api/auth/profile', 'GET', null, token);
    assert(profileRes.status === 200 && profileRes.data.email === 'test@example.com', 'GET /api/auth/profile returns valid authenticated user details.');

    // 6. Test Invalid Token (Expect 401)
    const invalidTokenRes = await request('/api/auth/profile', 'GET', null, 'invalid-jwt-token');
    assert(invalidTokenRes.status === 401, 'GET /api/auth/profile with invalid token returns HTTP 401 Unauthorized.');

    // 7. Test Registration of New User
    const testEmail = `smoke_${Date.now()}@example.com`;
    const regRes = await request('/api/auth/register', 'POST', {
      name: 'Smoke Tester',
      email: testEmail,
      password: 'password123'
    });
    assert(regRes.status === 201 && !!regRes.data.token, 'POST /api/auth/register creates new account and returns token.');

    server.close();

    console.log('\n==================================================');
    console.log(`📊 Smoke Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('==================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Smoke test crashed with exception:', err);
    process.exit(1);
  }
}

runSmokeTest();
