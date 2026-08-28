# VIBEZ Deployment Guide

This guide provides step-by-step instructions for deploying the **VIBEZ** ecosystem on [Render](https://render.com), including the PostgreSQL database, the Node.js/Express Custom Server with WebSockets, the Developer Hub, and the Admin Portal.

---

## ⚡ Option A: Automated 1-Click Blueprint Deployment (`render.yaml`)

The repository includes a ready-to-use `render.yaml` Blueprint file that automatically spins up the database and all web services in one click.

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top navigation and select **Blueprint**.
4. Connect your repository.
5. Render will automatically detect `render.yaml` and provision:
   - **`vibez-postgres`**: Managed PostgreSQL database.
   - **`vibez-server`**: Custom Node.js Express backend with Prisma ORM and Socket.IO.
   - **`vibez-developer-hub`**: Developer Portal and Server Codes sandbox.
   - **`vibez-admin`**: Administrative control center.
6. Click **Apply** and wait for the builds to complete!

---

## 🛠️ Option B: Manual Step-by-Step Deployment

### 1. Create a Managed PostgreSQL Database on Render
1. Go to **Render Dashboard** > **New +** > **PostgreSQL**.
2. Name: `vibez-postgres`
3. Database: `vibez_db`
4. User: `vibez_user`
5. Select the **Free** instance type (or Starter/Standard).
6. Click **Create Database**.
7. Once created, copy the **Internal Database URL** (for services running on Render) or **External Database URL**.

---

### 2. Deploy the Custom Backend Server (`/server`)
The VIBEZ backend is a Node.js/Express service utilizing Prisma ORM with WebSocket and WebRTC signaling.

1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `vibez-server`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start` *(This runs `npx prisma db push && node dist/index.js`)*
4. Under the **Environment Variables** tab, add:
   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<Paste your Render PostgreSQL Database URL>
   JWT_SECRET=your-secure-jwt-secret-key-32-chars-minimum
   VIBEZ_WEBHOOK_SECRET=whsec_your_custom_webhook_secret_key
   ADMIN_EMAIL=admin@vibez.com
   ADMIN_PASSWORD=your-secure-admin-password
   CORS_ORIGIN=*
   ```
5. Click **Create Web Service**.
6. Once deployed, note your server URL (e.g. `https://vibez-server.onrender.com`).

---

### 3. Deploy Developer Hub & Server Codes Console (`/developer`)
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect the same repository.
3. Configure:
   - **Name**: `vibez-developer-hub`
   - **Root Directory**: `developer`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://vibez-server.onrender.com/api
   CUSTOM_SERVER_URL=https://vibez-server.onrender.com
   ```
5. Click **Create Web Service**.

---

### 4. Deploy Admin Portal (`/admin`)
1. In Render Dashboard, click **New +** > **Web Service**.
2. Configure:
   - **Name**: `vibez-admin`
   - **Root Directory**: `admin`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
3. Add Environment Variable:
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://vibez-server.onrender.com/api
   ```
4. Click **Create Web Service**.

---

## 📱 5. Android Client Integration

To connect the Android app to your live Render server:
1. In AI Studio Secrets / `.env`:
   - Set `BACKEND_URL=https://vibez-server.onrender.com/`
2. Ensure your Firebase `google-services.json` is placed in `app/google-services.json`.
3. Set `GOOGLE_WEB_CLIENT_ID` with your Google OAuth 2.0 Web Client ID.

---
*Powered by PRIGID GROUP*
