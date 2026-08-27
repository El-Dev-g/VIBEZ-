# VIBEZ Deployment Guide

This guide provides instructions for deploying the **VIBEZ** ecosystem, including the Node.js Backend Server on Render and the Next.js Admin Portal.

---

## 🛠️ General Prerequisites

- **Cloud Provider Account**: Render, Railway, Google Cloud, or similar.
- **PostgreSQL Database**: Required for production (e.g., Render Postgres, Supabase, Neon, or Railway).
- **Node.js 20+**: Required for both server and admin builds.

---

## 📡 1. Backend Server Deployment on Render (`/server`)

The VIBEZ backend is a Node.js/Express application using Prisma ORM with WebSockets and WebRTC signaling.

### **Step 1: Environment Variables on Render Dashboard**
Under your Web Service's **Environment** tab, configure the following variables:

```env
PORT=10000
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
JWT_SECRET="your-production-jwt-secret-key"
GOOGLE_CLIENT_ID="31813758410-qtfe29f8ufi980db5a8qpeehl5cvntls.apps.googleusercontent.com"
ADMIN_FRONTEND_URL="https://your-admin-service.onrender.com"
FRONTEND_URL="https://your-client-app.onrender.com"
ADMIN_EMAIL="admin@vibez.com"
ADMIN_PASSWORD="your-secure-admin-password"
```

#### Optional: Cloudflare R2 Media Storage
```env
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
CLOUDFLARE_R2_BUCKET_NAME="vibez-media"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
CLOUDFLARE_R2_PUBLIC_DOMAIN="https://media.yourdomain.com"
```

#### Optional: Firebase Admin Verification
- Create a **Secret File** on Render named `serviceAccountKey.json`.
- Add environment variable: `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/serviceAccountKey.json`.

---

### **Step 2: Render Web Service Configuration**

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the service settings:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
4. Deploy the service.

---

## 📊 2. Admin Portal Deployment (`/admin`)

The VIBEZ Admin Portal is a Next.js application.

### **Environment Variables**
```env
NEXT_PUBLIC_API_URL="https://vibez-n5h1.onrender.com/api"
```

### **Deploy on Render / Vercel**
1. Set **Root Directory** to `admin`.
2. Set **Build Command** to `npm install && npm run build`.
3. Set **Start Command** to `npm start`.
4. Add the `NEXT_PUBLIC_API_URL` variable.

---

## 📱 3. Android App Configuration

1. **Backend URL**: In `.env` / AI Studio Secrets panel, `BACKEND_URL` is set to `https://vibez-n5h1.onrender.com/`.
2. **Google Services**: Ensure `app/google-services.json` is present for Firebase and Google Auth.
3. **Web Client ID**: Set `GOOGLE_WEB_CLIENT_ID` in the Secrets panel.
