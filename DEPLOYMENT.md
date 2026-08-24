# VIBEZ Deployment Guide

This guide provides instructions for deploying the **VIBEZ** ecosystem, including the Node.js Backend Server and the Next.js Admin Portal.

---

## 🛠️ General Prerequisites

-   **Google Cloud Project**: Required for hosting on Cloud Run and using Firebase/Google Cloud services.
-   **PostgreSQL Database**: Recommended for production (e.g., Google Cloud SQL).
-   **Node.js 20+**: Required for both server and admin builds.
-   **Docker**: Required for containerized deployments.

---

## 📡 1. Backend Server Deployment (`/server`)

The VIBEZ backend is a Node.js/Express application using Prisma ORM.

### **Step 1: Environment Variables**
Create a `.env` file in the `/server` directory:
```env
PORT=3000
DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"
JWT_SECRET="your-super-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
```

### **Step 2: Database Setup**
Run Prisma migrations to set up your production database schema:
```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
```

### **Step 3: Deploy to Google Cloud Run**
Build and push the Docker image:
```bash
gcloud builds submit --tag gcr.io/[PROJECT_ID]/vibez-server .
gcloud run deploy vibez-server --image gcr.io/[PROJECT_ID]/vibez-server --platform managed
```

---

## 📊 2. Admin Portal Deployment (`/admin`)

The VIBEZ Admin Portal is a Next.js application.

### **Step 1: Environment Variables**
Create a `.env.production` file in the `/admin` directory:
```env
NEXT_PUBLIC_API_URL="https://your-server-url.a.run.app/api"
```

### **Step 2: Build & Deploy**
You can deploy the admin portal to Vercel or Google Cloud Run.

#### **Option A: Vercel (Recommended)**
1.  Connect your repository to Vercel.
2.  Set the Root Directory to `admin`.
3.  Add the `NEXT_PUBLIC_API_URL` environment variable.
4.  Deploy.

#### **Option B: Google Cloud Run**
Build and push the Docker image:
```bash
cd admin
gcloud builds submit --tag gcr.io/[PROJECT_ID]/vibez-admin .
gcloud run deploy vibez-admin --image gcr.io/[PROJECT_ID]/vibez-admin --platform managed
```

---

## 📱 3. Android App Configuration

Before distributing the Android app, ensure it is configured to point to your live backend:

1.  Update `BuildConfig.BACKEND_URL` (or your API service configuration) to point to your deployed server URL.
2.  Ensure `google-services.json` is correctly placed in `app/` for Firebase/Google Auth.
3.  Add your production SHA-1 fingerprint to the Firebase Console.

---

## 🛡️ Security Checklist

-   [ ] **JWT Secret**: Use a long, random string for `JWT_SECRET`.
-   [ ] **CORS**: Update the CORS configuration in `server/src/index.ts` to only allow your admin portal domain.
-   [ ] **SSL**: Ensure all traffic is served over HTTPS.
-   [ ] **Admin Credentials**: Change the default admin credentials after the first login.
