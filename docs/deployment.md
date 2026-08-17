# Deployment Guide — AI Placement Mentor Agent

This guide outlines production deployment for both the React/Vite Frontend and the Node/Express Backend.

---

## 1. Frontend Deployment (Vercel / Netlify / Render)

### Environment Configuration
Before deploying the frontend, configure the environment variable pointing to your deployed backend API:

```env
VITE_API_URL=https://your-backend-api.onrender.com/api
```

### Vercel
1. Connect your GitHub repository to Vercel.
2. Select **Root Directory**: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-domain.com/api`

### Netlify
1. New Site from Git -> Select Repository.
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Add build environment variable `VITE_API_URL`.

---

## 2. Backend Deployment (Render / Railway / Fly.io)

### Environment Configuration
Configure environment variables on your backend hosting platform:

```env
PORT=5000
JWT_SECRET=your_super_secret_production_key_here
ANTHROPIC_API_KEY=your_live_claude_api_key_optional
```

### Render Web Service
1. Create new **Web Service** on Render.
2. Root Directory: `backend`
3. Runtime: `Node`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables (`PORT`, `JWT_SECRET`, `ANTHROPIC_API_KEY`).

---

## 3. Post-Deployment Verification

1. Access your deployed frontend URL in browser.
2. Open Network tab / System Health Modal (`Shift + H` or click status indicator in sidebar).
3. Confirm API Health endpoint returns `{"status": "healthy", "service": "AI Placement Mentor API"}`.
4. Perform login test using demo credentials (`test@example.com` / `password123`) or create a new user.
