# 🎓 AI Placement Mentor — Autonomous Placement Intelligence Operating System

An enterprise-grade, full-stack AI career preparation platform engineered to continuously assess, verify, predict, plan, evaluate, adapt, and mentor engineering students for campus recruitment and industry placements.

```text
ASSESS ➔ VERIFY ➔ ANALYZE ➔ PREDICT ➔ PLAN ➔ PRACTICE ➔ EVALUATE ➔ ADAPT ➔ REASSESS
```

---

## 🌟 Executive Summary & Problem Statement

College placement preparation is frequently fragmented: students practice coding problems without knowing company-specific patterns, create unverified resumes, face surprise interview questions, and lack visibility into their true readiness for specific target companies (e.g. TCS vs Amazon vs Zoho).

**AI Placement Mentor** solves this by providing a unified **Placement Operating System (OS)** featuring:
1. **Dynamic Readiness Index (0–100)**: Multi-factorial weighted readiness calculated across 7 core competencies (Technical, DSA, Mock Interviews, Resume, Aptitude, Projects, Communication).
2. **Multi-Company Intelligence Engine**: Deep profiles, assessment patterns, hiring rounds, and match algorithms for **50+ Tech Companies** (IT Services, Global Product Leaders, and Indian Unicorns).
3. **Resume Claim & Skill Verification**: Rigorous interactive skill quizzes (MCQs, conceptual, debugging, code output) and architectural claim defenses that validate genuine ability.
4. **Resume ↔ Job Description (JD) Matcher**: Instant ATS compatibility scoring, keyword gap breakdown, and targeted resume optimization suggestions.
5. **AI Placement Drive Simulator**: Full company-tailored recruitment drive simulations replicating exact round flows (Aptitude $\rightarrow$ Coding $\rightarrow$ Technical Interview $\rightarrow$ HR Defense).
6. **Interview & Coding Weakness Profiler**: Memory system that tracks recurring conceptual mistakes across mock interviews and coding attempts.
7. **24/7 Context-Aware AI Mentor**: Streaming chat coach aware of the student's active resume, target company, weak areas, and daily milestones.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, Recharts (Radar, Line, Bar charts), Lucide Icons |
| **Backend** | Node.js, Express.js REST API, JSON Web Tokens (JWT), Bcrypt.js, Multer, PDF-Parse |
| **Database** | Persistent Structured Database Engine (`backend/data/database.json`) with 15 normalized placement tables |
| **AI Integration** | Anthropic Claude 3.5 Sonnet SDK (`@anthropic-ai/sdk`) + High-Performance Local Heuristics Fallback Engine |
| **Code Splitting & SPA** | `React.lazy`, `Suspense`, manual vendor chunking, Render SPA rewrite routing (`_redirects`) |
| **Deployment Target** | Render (Static Site for Frontend + Web Service for Backend) |

---

## 📂 Project Architecture & Directory Structure

```text
AI-Placement-Mentor/
├── package.json                    # Root workspace package & concurrent dev scripts
├── .gitignore                      # Git ignore protecting .env and build output
├── .env.example                    # Root environment configuration template
├── README.md                       # Master documentation
│
├── frontend/                       # Vite + React Client
│   ├── public/
│   │   ├── _redirects              # Render SPA routing rewrite (/* /index.html 200)
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── components/             # Sidebar, ChatPanel, CompanyLogo, SystemHealthModal, ErrorBoundary
│   │   ├── context/                # AuthContext (JWT session persistence, registration, profile sync)
│   │   ├── layouts/                # DashboardLayout (Responsive desktop + mobile drawer)
│   │   ├── pages/                  # 25 Lazy-loaded route views
│   │   ├── services/               # Centralized api.js client (VITE_API_URL, timeouts, error parsing)
│   │   ├── App.jsx                 # Lazy-route splitting + URL hash synchronization
│   │   ├── index.css               # Modern design tokens, custom scrollbars, typography
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js              # Rollup manualChunks optimization for vendor splitting
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/                        # Express.js API Server
│   ├── data/
│   │   └── database.json           # Persistent JSON storage (15 placement tables)
│   ├── src/
│   │   ├── config/                 # Database abstraction (db.js), seed script (seed.js), companies (companies.json)
│   │   ├── controllers/            # Auth, Company, Readiness, Coding, Mock, Resume, Project controllers
│   │   ├── middleware/             # authenticateToken (JWT), errorMiddleware (Centralized logger)
│   │   ├── routes/                 # Express API routes
│   │   └── services/               # aiService.js (Claude + Local fallback), companyIntelligenceEngine.js, readinessEngine.js
│   ├── server.js                   # Main entry point with dynamic CORS & startup auto-seeding
│   ├── package.json
│   └── .env.example
│
└── docs/                           # Technical Specifications & Architecture guides
    ├── architecture.md
    ├── api.md
    └── deployment.md
```

---

## ⚡ Quickstart & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/dhanushkaran5/AI-placement-Mentor.git
cd AI-placement-Mentor

# Install root, backend, and frontend dependencies in one command
npm run install:all
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
JWT_SECRET=super_secret_placement_mentor_token_123!
FRONTEND_URL=http://localhost:5173

# Optional: Set your Claude API Key for live LLM mode.
# If omitted or empty, the built-in intelligent local fallback heuristics run automatically.
ANTHROPIC_API_KEY=
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Servers
```bash
# Run backend (Port 5000) and frontend (Port 5173) concurrently:
npm run dev
```

- **Frontend URL**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **API Health Check**: `http://localhost:5000/api/health`
- **System Diagnostics**: `http://localhost:5000/api/health/diagnostics`

---

## 🔑 Pre-Seeded College Demo Credentials

The database automatically seeds an active student account on initial launch:

| Field | Value |
|---|---|
| **Email** | `test@example.com` |
| **Password** | `password123` |
| **Target Role** | Software Development Engineer (SDE) |
| **Target Company** | TCS / Infosys / Amazon |
| **Quick Action** | Click **"One-Click Demo Login"** on the login screen for instant access! |

---

## 🚀 Step-by-Step Render Deployment Guide

Follow these exact steps to deploy both services on **Render**:

### Step 1: Deploy Backend (Web Service)
1. In Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository: `dhanushkaran5/AI-placement-Mentor`.
3. Configure the following fields:
   - **Name**: `ai-placement-mentor-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. In **Environment Variables**, add:
   - `PORT` = `5000` (or leave default for Render dynamic assignment)
   - `JWT_SECRET` = `your_secure_random_jwt_secret_key_here`
   - `FRONTEND_URL` = `https://ai-placement-mentor-frontend.onrender.com` (your frontend URL once created)
   - `ANTHROPIC_API_KEY` = (optional for live Claude integration)
5. Click **Create Web Service**. Note your backend URL (e.g. `https://ai-placement-mentor-backend.onrender.com`).

### Step 2: Deploy Frontend (Static Site)
1. In Render Dashboard, click **New +** $\rightarrow$ **Static Site**.
2. Connect the same GitHub repository.
3. Configure the following fields:
   - **Name**: `ai-placement-mentor-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://ai-placement-mentor-backend.onrender.com/api` (use your actual backend URL from Step 1)
5. Click **Create Static Site**.
6. The `public/_redirects` file automatically handles SPA rewrites (`/* /index.html 200`) so direct links and page refreshes work seamlessly!

---

## 🛡️ Security & Reliability Architecture

- **Zero Client-Side API Keys**: AI API keys are never bundled, transmitted, or accessible to client code.
- **Dynamic CORS Isolation**: Backend explicitly verifies origin headers against `FRONTEND_URL` and Render domains.
- **Fail-Safe Offline Mode**: If Claude API is unavailable or unconfigured, the application runs on intelligent local fallback heuristics without crashing.
- **Graceful Error Recovery**: Centralized `ErrorBoundary` on the frontend and `errorMiddleware` on the backend catch exceptions cleanly with zero sensitive stack trace leakage.

---

## 📝 Verification & Testing Commands

To run the automated acceptance test suite locally:

```bash
# Run backend endpoint full suite verification:
node "backend/src/testScenarios.js"

# Verify production frontend build:
npm run build --prefix frontend
```

---

## 📄 License & Author

- **Author**: Dhanushkaran M (dhanushkaran5)
- **Project**: AI Placement Mentor Agent
- **License**: MIT
