# VIBEZ Render Deployment & Environment Variables Guide
**Powered by PRIGID GROUP**

This master guide provides complete deployment instructions and **all environment variable specifications** for deploying the VIBEZ web ecosystem on [Render](https://render.com).

> **Note on Environment Variables:** All environment variables for web projects must be configured directly within the **Render Dashboard (`Settings -> Environment`)** or defined in `render.yaml`. No `.env` files are checked into the repository for web services.

---

## 🏗️ Architecture Overview

The VIBEZ ecosystem deployed on Render consists of:

| Service Name | Directory | Type | Runtime | Port | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`vibez-postgres`** | N/A | Database | PostgreSQL 16 | 5432 | Primary persistent database |
| **`vibez-server`** | `/server` | Web Service | Node.js (Express + Socket.IO + Prisma) | 10000 | Core backend, WebSockets & REST APIs |
| **`vibez-developer-hub`** | `/developer` | Web Service | Next.js 14 | 3000 | Developer portal, API explorer & SDK docs |
| **`vibez-admin`** | `/admin` | Web Service | Next.js 14 | 3000 | Administrative moderation & control center |
| **`vibez-landingpage`** | `/landingpage` | Web Service | Next.js / Static | 3000 | Marketing landing page & app showcase |
| **`vibez-html-telemetry`** | `/vibez` | Static Site | HTML / Static | 80 | Public network telemetry & live status |

---

## ⚡ Option A: 1-Click Blueprint Deployment (`render.yaml`)

The root `render.yaml` file automatically provisions all database instances and web services:

1. Push your repository to **GitHub** or **GitLab**.
2. Navigate to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your repository. Render reads `render.yaml` and deploys all services with linked environment variables.
5. Click **Apply**.

---

## 🛠️ Option B: Manual Service Configuration & Environment Variables

### 1. PostgreSQL Database (`vibez-postgres`)
- **Type**: PostgreSQL
- **Name**: `vibez-postgres`
- **Database**: `vibez_db`
- **User**: `vibez_user`
- **Plan**: Free or Starter
- Copy the **Internal Database URL** once created (e.g. `postgresql://vibez_user:password@dpg-xxxx-a:5432/vibez_db`).

---

### 2. Backend Server (`/server`)

#### Render Configuration:
- **Service Type**: Web Service
- **Name**: `vibez-server`
- **Root Directory**: `server`
- **Environment**: `Node`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start` *(Executes `npx prisma db push && node dist/index.js`)*

#### Environment Variables (Render Dashboard -> `vibez-server` -> `Environment`):

| Variable Name | Required | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Node production mode |
| `PORT` | Yes | `10000` | Port listened on Render |
| `DATABASE_URL` | Yes | `postgresql://vibez_user:pass@dpg-xxx:5432/vibez_db` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `vibez_jwt_prod_secret_key_super_secure_2026` | 32+ character key for JWT token signing |
| `VIBEZ_WEBHOOK_SECRET` | Yes | `whsec_vibez_prod_signature_key_2026` | Secret used for HMAC webhook verification |
| `ADMIN_EMAIL` | Yes | `admin@vibez.com` | Primary superadmin email address |
| `ADMIN_PASSWORD` | Yes | `SecureAdminPassword2026!` | Superadmin initial password |
| `ADMIN_FRONTEND_URL` | Yes | `https://vibez-admin.onrender.com` | URL of the Admin dashboard for CORS whitelist |
| `DEVELOPER_FRONTEND_URL` | Yes | `https://vibez-developer.onrender.com` | URL of Developer Hub for CORS whitelist |
| `LANDING_PAGE_URL` | Yes | `https://vibez-landing.onrender.com` | URL of Landing Page for CORS whitelist |
| `FRONTEND_URL` | Yes | `https://vibez-web.onrender.com` | URL of Web/HTML Client for CORS whitelist |
| `ALLOWED_ORIGINS` | Optional | `https://vibez-admin.onrender.com,https://vibez-developer.onrender.com,https://vibez-landing.onrender.com` | Comma-separated CORS allowed origins |
| `BACKEND_URL` | Yes | `https://vibez-server.onrender.com` | Public base URL of this backend service |
| `GMAIL_USER` | Optional | `contact@prigid.com` | Gmail account for notifications/support |
| `GMAIL_APP_PASSWORD` | Optional | `xxxx xxxx xxxx xxxx` | Google 16-character App Password |

---

### 3. Developer Hub & API Platform (`/developer`)

#### Render Configuration:
- **Service Type**: Web Service
- **Name**: `vibez-developer-hub`
- **Root Directory**: `developer`
- **Environment**: `Node`
- **Build Command**: `npm install --include=dev && npm run build`
- **Start Command**: `npm start`

#### Environment Variables (Render Dashboard -> `vibez-developer-hub` -> `Environment`):

| Variable Name | Required | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Node production mode |
| `PORT` | Yes | `3000` | Port listened on Render |
| `NEXT_PUBLIC_API_URL` | Yes | `https://vibez-server.onrender.com/api` | Backend REST API endpoint base URL |
| `NEXT_PUBLIC_SERVER_URL`| Yes | `https://vibez-server.onrender.com` | Backend server base URL |
| `CUSTOM_SERVER_URL` | Yes | `https://vibez-server.onrender.com` | Server bridge URL for direct API proxy |
| `JWT_SECRET` | Yes | `vibez_jwt_prod_secret_key_super_secure_2026` | Token signing secret (must match backend) |

---

### 4. Admin Portal (`/admin`)

#### Render Configuration:
- **Service Type**: Web Service
- **Name**: `vibez-admin`
- **Root Directory**: `admin`
- **Environment**: `Node`
- **Build Command**: `npm install --include=dev && npm run build`
- **Start Command**: `npm start`

#### Environment Variables (Render Dashboard -> `vibez-admin` -> `Environment`):

| Variable Name | Required | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Node production mode |
| `PORT` | Yes | `3000` | Port listened on Render |
| `NEXT_PUBLIC_API_URL` | Yes | `https://vibez-server.onrender.com/api` | Backend REST API endpoint base URL |
| `NEXT_PUBLIC_SERVER_URL`| Yes | `https://vibez-server.onrender.com` | Backend server base URL for WebSockets |

---

### 5. Landing Page (`/landingpage`)

#### Render Configuration:
- **Service Type**: Web Service
- **Name**: `vibez-landingpage`
- **Root Directory**: `landingpage`
- **Environment**: `Node`
- **Build Command**: `npm install --include=dev && npm run build`
- **Start Command**: `npm start`

#### Environment Variables (Render Dashboard -> `vibez-landingpage` -> `Environment`):

| Variable Name | Required | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Node production mode |
| `PORT` | Yes | `3000` | Port listened on Render |
| `NEXT_PUBLIC_API_URL` | Yes | `https://vibez-server.onrender.com/api` | Backend API URL for waitlist & inquiries |
| `NEXT_PUBLIC_DEV_URL` | Optional | `https://vibez-developer.onrender.com` | Link to developer portal |
| `NEXT_PUBLIC_ADMIN_URL`| Optional | `https://vibez-admin.onrender.com` | Link to admin console |

---

### 6. HTML Telemetry & Web Platform (`/vibez`)

#### Render Configuration:
- **Service Type**: Static Site
- **Name**: `vibez-html-telemetry`
- **Root Directory**: `vibez`
- **Publish Directory**: `.` *(or empty)*

---

## 📱 Android App Integration (AI Studio / Local Builds)

For mobile clients connecting to the live Render backend, configure in AI Studio Secrets:

| Secret Name | Value | Purpose |
| :--- | :--- | :--- |
| `BACKEND_URL` | `https://vibez-server.onrender.com/` | Real-time REST & WebSocket gateway |
| `GOOGLE_WEB_CLIENT_ID` | `your_google_web_client_id.apps.googleusercontent.com` | Google Sign-In & OAuth credential |

---
*Maintained by PRIGID GROUP*
