# Thanal Deployment Guide

This guide outlines how to host both the **Thanal Web Frontend** and **Backend Express API** for **100% free**, with options for different hosting models depending on whether you want persistence for community washroom reviews.

---

## Architecture Context

Thanal consists of:
1. **Web Frontend (`packages/web`)**: A static React client built with Vite.
2. **Backend API (`backend`)**: An Express.js Node API that writes to a local SQLite database (`thanal.db`) for washroom reviews and feedback.

Because the SQLite database is stateful, hosting options behave differently:
- **Stateless/Ephemeral Hosts (Vercel, Render Free Tier)**: The database is reset back to empty whenever the server restarts (daily or on redeployments). This is perfect for quick demos.
- **Persistent Hosts (Fly.io Free Tier)**: Allows mounting a persistent disk volume, meaning reviews and community contributions are saved permanently.

---

## Option 1: Easiest Unified Deployment on Render (Free Web Service)

Render allows you to host one Node.js Web Service for free. Because the backend has been configured to serve the React static assets, **you can deploy the entire app (API + Web Client) as a single service**.

### Steps to Deploy:
1. Sign up for a free account at [Render](https://render.com/).
2. Create a new **Web Service** and connect your Thanal GitHub repository.
3. Configure the following settings:
   - **Root Directory**: Leave blank (monorepo root).
   - **Runtime**: `Node`
   - **Build Command**: `npm run build` *(This automatically builds `@thanal/shared`, `@thanal/web` assets, and `@thanal/backend` TypeScript modules)*.
   - **Start Command**: `npm run start -w @thanal/backend`
   - **Instance Type**: `Free`
4. Add the following **Environment Variables** in the Render settings:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(Optional: Your Google Gemini API Key)*
   - `PORT`: `10000` *(Or leave empty, Render assigns this automatically)*
5. Click **Deploy Web Service**.

Your website will be live at `https://your-app-name.onrender.com`. The frontend will automatically route API requests to the same domain.
> ⚠️ **Note**: Render's free tier instances sleep after 15 minutes of inactivity (taking ~45-50s to wake up upon the next request) and reset the SQLite database on restarts.

---

## Option 2: Persistent SQLite Hosting on Fly.io (Free Tier)

Fly.io offers a generous free tier that includes up to **3 shared-cpu-1x VMs, 256MB RAM, and 3GB of persistent disk storage**. This is the recommended way to keep your washroom reviews saved permanently without losing data.

### Steps to Deploy:
1. Install the flyctl CLI tool:
   - On Windows (PowerShell): `iwr https://fly.io/install.ps1 -useb | iex`
   - On macOS/Linux: `curl -L https://fly.io/install.sh | sh`
2. Run `fly auth signup` (or `fly auth login` if you already have an account).
3. At the root of your Thanal repository, run `fly launch`. Follow the prompts to name your app and select a region close to Kerala (e.g., `bom` Mumbai or `sin` Singapore).
4. Do **not** set up a Postgres database when prompted (we will use SQLite).
5. Create a `fly.toml` configuration in the root directory:
   ```toml
   app = "your-thanal-app-name"
   primary_region = "bom"

   [build]
     builder = "heroku/buildpacks:20"

   [env]
     NODE_ENV = "production"
     DATABASE_URL = "/data/thanal.db" # Database placed on the persistent volume

   [mounts]
     source = "thanal_data"
     destination = "/data"

   [[services]]
     http_checks = []
     internal_port = 4010
     processes = ["app"]
     protocol = "tcp"
     script_checks = []

     [services.concurrency]
       hard_limit = 25
       soft_limit = 20
       type = "connections"

     [[services.ports]]
       force_https = true
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```
6. Create the persistent volume:
   ```bash
   fly volumes create thanal_data --size 1 --region bom
   ```
7. Deploy the app:
   ```bash
   fly deploy
   ```

Your app will be live at `https://your-thanal-app-name.fly.dev` with full SQLite database persistence!

---

## Option 3: Split Deployment (Web on Vercel + Backend on Render/Railway)

Vercel is the gold standard for hosting Vite React websites. It is **free forever**, does not sleep, and uses global CDNs for blazing-fast page loads. You can split the frontend and backend to get the best performance.

### Step 1: Deploy Backend on Render / Railway
1. Set up your backend on Render (see Option 1) or Railway.
2. Note your deployed API URL (e.g., `https://thanal-api.onrender.com`).

### Step 2: Deploy Web Client on Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Connect your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `packages/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_BACKEND_URL`: `https://thanal-api.onrender.com` *(Point this to your deployed backend)*
5. Click **Deploy**.

Vercel will build and serve your web client. Since the client is deployed separately, it will make cross-origin requests to your Render API. The CORS configuration on the backend is already set up to support this!

---

## Summary of Hosting Options

| Provider | Sleep Mode? | SQLite Persistence? | Best For | Cost |
|---|---|---|---|---|
| **Render (Unified)** | Yes (15 mins) | No (Ephemeral) | Fast, single-click demos | **Free** |
| **Fly.io** | No | **Yes (via Volumes)** | Production-grade SQLite deployment | **Free** (within limits) |
| **Vercel + Render** | Yes (API only) | No (Ephemeral) | High-performance client, slow API wakeup | **Free** |
