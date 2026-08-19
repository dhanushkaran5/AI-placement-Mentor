# Troubleshooting Guide — AI Placement Mentor Agent

This document lists common troubleshooting steps for local development and Render production environments.

---

## 1. Frontend: "Failed to Fetch Dynamically Imported Module"

### Root Cause
This happens when you redeploy a Vite application and the browser is still loading an old cache version of `index.html`. The old index file tries to load stale hash-named chunks (e.g. `AuthScreen-*.js`) that no longer exist on the server.

### Solutions Applied
- **AuthScreen Eager Loading**: The critical authentication login screen is eagerly imported in `App.jsx`, preventing dynamic chunk failures on initial app start.
- **Dynamic Chunk Retry**: The helper function `lazyWithRetry` wraps all other subpages to intercept module import failures and trigger a single session-guarded reload automatically to pull fresh assets.
- **Client Cache Clear**: If the problem persists, do a hard refresh (Ctrl + F5 or Cmd + Shift + R) to clear the browser cache.

---

## 2. Frontend: Direct Page Reloads Return 404 (Render Static Site)

### Root Cause
Render attempts to look for physical files corresponding to the path (e.g., serving `/dashboard` as a folder). Since React is a Single Page Application (SPA), all routing is handled client-side.

### Solution Applied
- The `public/_redirects` file is included with `/*  /index.html  200` to rewrite all requests to `index.html`.
- Confirm that the **Publish Directory** in your Render Static Site configuration is set to `dist` (not `dist/assets` or `public`).

---

## 3. Backend: "Claude API is not configured" or AI Features return mock data

### Root Cause
The backend runs in **Intelligent Local Fallback Heuristics Mode** when the `ANTHROPIC_API_KEY` is not set or begins with `your_`.

### Solution
- If you want live AI analysis: Set `ANTHROPIC_API_KEY` in your environment variables.
- Check the Diagnostics panel in the frontend or hit `/api/health/diagnostics` to verify if the AI service status is `live` or `fallback`.

---

## 4. Backend: CORS Problems

### Root Cause
The frontend origin is not allowed by the backend CORS middleware configuration.

### Solution
- In Render Web Service, verify that `FRONTEND_URL` environment variable matches your frontend URL exactly (without trailing slashes), e.g., `https://ai-placement-mentor.onrender.com`.
- The backend CORS settings automatically allow local development hosts (`localhost:5173`, `localhost:3000`) and any `*.onrender.com` subdomain by default.

---

## 5. Backend: Data Resetting or Resetting After Restart

### Root Cause
Render web services have ephemeral filesystems. Every time the instance sleeps or redeploys, the local JSON database `database.json` is re-initialized with standard seed data.

### Solution
- For true database persistence, attach a **Persistent Disk** on Render (e.g., mount a disk at `/data` and set `DB_PATH=/data/database.json`), or update the configuration to connect to a permanent cloud database.
