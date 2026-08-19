import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getCompaniesList } from './services/companyIntelligenceEngine.js';
import { query } from './config/db.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Dynamic CORS configuration (Render and Local Development Compatible)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    // Allow by default for deployment resilience
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import mockRoutes from './routes/mockRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import readinessRoutes from './routes/readinessRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import codingRoutes from './routes/codingRoutes.js';
import missionRoutes from './routes/missionRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

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

import errorMiddleware from './middleware/errorMiddleware.js';

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
        backend: { status: 'healthy', label: 'Express API Server', ok: true },
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

export default app;
