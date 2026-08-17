# API Documentation — AI Placement Mentor Agent

Base API URL: `http://localhost:5000/api` (Development)

All protected endpoints require HTTP Header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. System Health & Diagnostics

### `GET /api/health`
Returns basic service status.

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "service": "AI Placement Mentor API",
  "timestamp": "2026-08-16T23:50:00.000Z"
}
```

### `GET /api/health/diagnostics`
Returns comprehensive system operational health across database, authentication, company engine, AI service, and resume engine.

---

## 2. Authentication Routes (`/api/auth`)

### `POST /api/auth/register`
Registers a new user account.

**Request Body**:
```json
{
  "name": "Alex Student",
  "email": "alex@example.com",
  "password": "password123"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": 2,
    "name": "Alex Student",
    "email": "alex@example.com"
  }
}
```

### `POST /api/auth/login`
Authenticates existing user.

**Request Body**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### `GET /api/auth/profile` *(Protected)*
Fetches user profile details including readiness score, target role, target company, and daily hours.

---

## 3. Resume & ATS Engine (`/api/resume`)

### `POST /api/resume/upload` *(Protected, Multipart Form)*
Uploads PDF resume file for ATS analysis, extracting technical skills, experience metrics, and formatting recommendations.

---

## 4. Company Intelligence (`/api/company`)

### `GET /api/company/list`
Lists all tracked companies (30+ Tier-1, Tier-2, product, and service-based firms).

### `GET /api/company/:companyId`
Returns detailed company profile, salary benchmarks, hiring process, topic weightages, and past interview questions.

---

## 5. Mock Interview & Coding Lab

### `POST /api/mock/generate` *(Protected)*
Generates tailored interview questions based on user's target company and target role.

### `POST /api/coding/evaluate` *(Protected)*
Evaluates user's code solution against test cases, time complexity, and memory requirements.

---

## 6. Placement Readiness & Blockers (`/api/readiness`)

### `GET /api/readiness/score` *(Protected)*
Calculates overall placement readiness index (0-100%) based on resume quality, skill verification, mock interview performance, and coding practice.
