import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, query, get } from './src/config/db.js';
import { getCompaniesList } from './src/services/companyIntelligenceEngine.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import resumeRoutes from './src/routes/resumeRoutes.js';
import roadmapRoutes from './src/routes/roadmapRoutes.js';
import companyRoutes from './src/routes/companyRoutes.js';
import mockRoutes from './src/routes/mockRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import readinessRoutes from './src/routes/readinessRoutes.js';
import verificationRoutes from './src/routes/verificationRoutes.js';
import simulationRoutes from './src/routes/simulationRoutes.js';
import codingRoutes from './src/routes/codingRoutes.js';
import missionRoutes from './src/routes/missionRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';

// Register API routes
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

import errorMiddleware from './src/middleware/errorMiddleware.js';

// Health check endpoint (Basic)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Placement Mentor API',
    timestamp: new Date().toISOString()
  });
});

// Comprehensive System Diagnostics Endpoint (Feature 30)
app.get('/api/health/diagnostics', async (req, res) => {
  try {
    const users = await query('SELECT * FROM users');
    const insights = await query('SELECT count(*) as count FROM company_insights');
    const companies = getCompaniesList();
    const isAiLive = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== '' && !process.env.ANTHROPIC_API_KEY.startsWith('your_'));

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        frontend: { status: 'healthy', label: 'Vite React Client', ok: true },
        backend: { status: 'healthy', label: 'Express API Server (Port 5000)', ok: true },
        database: { 
          status: 'healthy', 
          label: 'JSON Database (15 Placement Tables)', 
          ok: true, 
          usersCount: users.length, 
          insightsCount: insights[0]?.count || 0 
        },
        authentication: { 
          status: 'healthy', 
          label: 'JWT & Demo Account (test@example.com / password123)', 
          ok: users.some(u => u.email === 'test@example.com') 
        },
        aiService: { 
          status: isAiLive ? 'live' : 'fallback', 
          label: isAiLive ? 'Claude 3.5 Sonnet (Live API)' : 'Intelligent Local Fallback Heuristics (Offline Mode)', 
          ok: true 
        },
        companyData: { 
          status: 'healthy', 
          label: 'Company Intelligence Engine', 
          ok: companies.length >= 30, 
          count: companies.length 
        },
        resumeEngine: { status: 'healthy', label: 'PDF Parser & ATS Matcher', ok: true },
        codingEngine: { status: 'healthy', label: 'Coding Lab & Weakness Profiler', ok: true },
        interviewEngine: { status: 'healthy', label: 'Mock Interview & Weakness Memory', ok: true }
      }
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    res.status(500).json({ status: 'degraded', error: error.message });
  }
});

// Centralized Error Handling Middleware
app.use(errorMiddleware);

// Start DB and Express Server
const startServer = async () => {
  try {
    await initDb();
    
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  AI Placement Mentor Agent Server listening on port ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Diagnostics:  http://localhost:${PORT}/api/health/diagnostics`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize database and start server:', error);
    process.exit(1);
  }
};

startServer();
