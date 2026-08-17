# 🚀 AI Placement Mentor Agent

An end-to-end AI-powered placement preparation & adaptive career mentor platform designed to continuously assess, verify, analyze, predict, plan, evaluate, adapt, and reassess engineering student placement readiness.

```text
ASSESS → VERIFY → ANALYZE → PREDICT → PLAN → PRACTICE → EVALUATE → ADAPT → REASSESS
```

---

## 🌟 Key Features

1. **AI Placement Readiness Index**: Multi-factorial 0–100 weighted index calculated dynamically across Technical Skills, DSA/Coding, Mock Interviews, Resume Quality, Aptitude, Projects, and Communication.
2. **Skill Verification Engine**: Quizzes (MCQs, conceptual, debugging, code output) to verify claimed skills on resumes.
3. **Resume Claim Verification**: Generates deep technical/project verification questions to evaluate resume authenticity.
4. **Adaptive AI Roadmap**: Dynamic study roadmap that auto-adjusts when skill performance updates.
5. **Company-Specific Placement Simulator**: Multi-round recruitment drive simulation (Aptitude $\rightarrow$ Coding $\rightarrow$ Technical $\rightarrow$ HR) tailored to company assessment patterns (TCS, Infosys, Amazon, Wipro, Google, etc.).
6. **AI Interview Memory**: Tracks interview performance trends and weakness memory.
7. **Placement Risk Analyzer**: Diagnostic engine highlighting evidence-based skill vulnerabilities and action remedies.
8. **What-If Career Simulator**: Interactive target score sliders showing hypothetical readiness index impact.
9. **AI Project Portfolio & Defense**: Evaluates project technical depth, architecture, and generates project defense questions.
10. **AI Coding Lab**: Coding environment with problem sets, test case runner, runtime complexity analysis, and submission history.
11. **Multi-Company Intelligence Engine**: Tiering, interview patterns, salary benchmarks, and profile matcher across 30+ tech companies.
12. **System Health & Diagnostics**: Live health checking for database, authentication, company engine, AI service, and frontend client.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend**: Express.js (Node.js REST API), JWT Authentication, Multer, PDF-Parse
- **Database**: Zero-dependency JSON Database Engine (`backend/data/database.json`)
- **AI Intelligence**: Anthropic Claude 3.5 Sonnet API with robust local fallback heuristics
- **Deployment**: Vercel/Netlify (Frontend) + Render/Railway (Backend)

---

## 📂 Project Structure

```text
AI-placement-Mentor/
├── README.md
├── .gitignore
├── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/         # Reusable UI (Sidebar, ChatPanel, ErrorBoundary, etc.)
│   │   ├── pages/              # Screen views (Dashboard, Resume, Coding, Interview, etc.)
│   │   ├── layouts/            # DashboardLayout wrapper
│   │   ├── context/            # Global AuthContext
│   │   ├── hooks/              # Custom React hooks (useAuth, useApi)
│   │   ├── services/           # Central API client & auth services
│   │   ├── utils/              # Helper utilities
│   │   ├── data/               # Static datasets
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
│
├── backend/
│   ├── data/                   # Database store (database.json)
│   ├── src/
│   │   ├── config/             # Database & seed configuration
│   │   ├── controllers/        # Route logic controllers
│   │   ├── middleware/         # Auth & error handling middleware
│   │   ├── routes/             # Express API endpoints
│   │   ├── services/           # AI, Company Engine, & Readiness services
│   │   ├── utils/              # Logger & backend helpers
│   │   └── validators/         # Input request validators
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── docs/
    ├── architecture.md          # Architectural blueprints & diagrams
    ├── api.md                   # API specification & endpoints
    └── deployment.md            # Production deployment guide
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/AI-placement-Mentor.git
cd AI-placement-Mentor

# Install root, backend, and frontend dependencies
npm run install:all
```

### 2. Environment Setup

Create `.env` in `backend/`:
```env
PORT=5000
JWT_SECRET=super_secret_key_123
DB_PATH=data/database.json
ANTHROPIC_API_KEY=your_claude_api_key_optional
```

Create `.env` in `frontend/`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Running Locally

```bash
# Run both backend and frontend concurrently
npm run dev
```

Or run separately:

**Backend Server**:
```bash
cd backend
npm run dev
```

**Frontend React App**:
```bash
cd frontend
npm run dev
```

- **Frontend**: `http://localhost:3000` (or Vite port)
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

### 🔑 Demo Credentials
- **Email**: `test@example.com`
- **Password**: `password123`

---

## 📖 Documentation

For detailed guides, explore the `docs/` folder:
- [Architecture Blueprint](docs/architecture.md)
- [API Reference](docs/api.md)
- [Deployment Instructions](docs/deployment.md)

---

## 🔒 License & Author

Developed for Engineering Placement Excellence.
Licensed under MIT.
