# VIBEZ Deployment & Environment Variables Guide
**Powered by PRIGID GROUP**

This master guide provides complete deployment instructions for deploying the VIBEZ ecosystem manually or automatically.

---

## 🏗️ Architecture Overview

| Service Name | Directory | Type | Build Tool / Framework | Port | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`vibez-postgres`** | N/A | Database | PostgreSQL 16 | 5432 | Primary persistent database |
| **`vibez-server`** | `/server` | Web Service | Node.js (Express + Socket.IO + Prisma) | 10000 | Core backend, WebSockets & REST APIs |
| **`vibez-developer-hub`** | `/developer` | Static Site / Web | Vite + React Router | 3002 | Developer portal, API sandbox & SDK docs |
| **`vibez-landingpage`** | `/landingpage` | Static Site / Web | Vite + React Router | 3001 | Marketing landing page & app showcase |
| **`vibez-admin`** | `/admin` | Web Service | Next.js 14 | 3000 | Administrative moderation console |
| **`vibez-html-telemetry`** | `/vibez` | Static Site | HTML / Static | 80 | Public network telemetry & status |

---

## 🚀 How to Deploy Static Sites WITHOUT Render Blueprint

Since **`landingpage`** and **`developer`** have been migrated to **Vite + React Router**, they build into ultra-fast static HTML/JS bundles (`dist`). You can deploy them as **Static Sites** (free tier on Render, Vercel, Netlify, or Cloudflare Pages).

---

### Option 1: Render Manual Static Sites (No `render.yaml`)

#### A. Landing Page (`/landingpage`)
1. Log in to [Render Dashboard](https://dashboard.render.com) and click **New +** > **Static Site**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `vibez-landingpage`
   - **Root Directory**: `landingpage`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Configure SPA Client-Side Routing**:
   - Navigate to **Redirects / Rewrites** in the Render sidebar for this site.
   - Click **Add Rule**:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
5. Click **Create Static Site**.

---

#### B. Developer Hub (`/developer`)
1. In Render Dashboard, click **New +** > **Static Site**.
2. Connect your repository.
3. Configure settings:
   - **Name**: `vibez-developer-hub`
   - **Root Directory**: `developer`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Configure SPA Client-Side Routing**:
   - Navigate to **Redirects / Rewrites**.
   - Click **Add Rule**:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
5. Click **Create Static Site**.

---

### Option 2: Deploying on Vercel or Netlify

#### Vercel:
1. Go to [Vercel New Project](https://vercel.com/new).
2. Select your repository.
3. Select **Root Directory**: `landingpage` (or `developer`).
4. Framework Preset: **Vite**.
5. Click **Deploy**.

#### Netlify:
1. Go to [Netlify Dashboard](https://app.netlify.com) > **Add new site** > **Import an existing project**.
2. Select repository and set **Base directory**: `landingpage` (or `developer`).
3. Build command: `npm run build`.
4. Publish directory: `dist`.
5. Click **Deploy**.

---

### Option 3: Manual Backend Server & Database Setup (`vibez-server`)

#### 1. PostgreSQL Database
- Create a PostgreSQL database instance on Render, Railway, or Supabase.
- Copy the **Connection String** (`DATABASE_URL`).

#### 2. Express Backend Web Service (`/server`)
- **Service Type**: Web Service (Node)
- **Root Directory**: `server`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start` *(runs `npx prisma db push && node dist/index.js`)*

#### Required Environment Variables for Backend:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `DATABASE_URL`: `postgresql://user:pass@host:5432/vibez_db`
- `JWT_SECRET`: `your_random_secure_32_char_secret`
- `VIBEZ_WEBHOOK_SECRET`: `whsec_your_secure_signature`
- `ADMIN_EMAIL`: `admin@vibez.com`
- `ADMIN_PASSWORD`: `YourSecureAdminPassword123`
- `CORS_ORIGIN`: `*` *(or comma-separated URLs of your static sites)*

---

### Option 4: Option A 1-Click Blueprint (`render.yaml`)

If you ever decide to use Render's automatic multi-service deployment, the repository contains a pre-configured `render.yaml` at the root. Simply click **New +** > **Blueprint** on Render, connect your repository, and Render will automatically launch all database and web services in sync.

---
*Maintained by PRIGID GROUP Infrastructure Team*
