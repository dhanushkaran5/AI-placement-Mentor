# Deployment Guide — Render & Single Repository Setup

This document provides step-by-step instructions for deploying **AI Placement Mentor Agent** to [Render](https://render.com) using a single GitHub repository.

---

## Architecture Overview

```
GitHub Repository (AI-placement-Mentor)
├── frontend/   --> Deploy as Render Static Site
└── backend/    --> Deploy as Render Web Service
```

---

## 1. Backend Deployment (Render Web Service)

1. Log in to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`AI-placement-Mentor`).
3. Configure the service:
   - **Name**: `ai-placement-mentor-backend`
   - **Region**: Select your preferred region
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables** under the *Environment* tab:
   - `PORT`: `5000` (or leave default, Render sets `PORT` automatically)
   - `JWT_SECRET`: `[Generate a secure random string]`
   - `FRONTEND_URL`: `https://[your-frontend-name].onrender.com`
   - `ANTHROPIC_API_KEY`: `[Optional: your_claude_api_key]`
5. Click **Create Web Service**.
6. Copy the assigned backend URL (e.g. `https://ai-placement-mentor-backend.onrender.com`).

---

## 2. Frontend Deployment (Render Static Site)

1. Click **New +** -> **Static Site** on Render.
2. Connect the same GitHub repository (`AI-placement-Mentor`).
3. Configure the service:
   - **Name**: `ai-placement-mentor-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add the following **Environment Variable**:
   - `VITE_API_URL`: `https://ai-placement-mentor-backend.onrender.com/api` (Use your actual backend Render URL from Step 1)
5. Click **Create Static Site**.

---

## 3. SPA Routing Note

The frontend includes `public/_redirects` with rule:
```
/*    /index.html   200
```
This ensures direct URL navigation (e.g., `/dashboard`, `/companies`, `/roadmap`) serves `index.html` on Render without 404 errors.

---

## 4. Verification Checklist

1. Access `https://your-backend.onrender.com/api/health` — should return `{"status": "healthy", ...}`.
2. Access `https://your-frontend.onrender.com` in browser.
3. Test login with demo credentials:
   - **Email**: `test@example.com`
   - **Password**: `password123`
4. Verify resume upload, roadmap generation, and mock interview modules.
