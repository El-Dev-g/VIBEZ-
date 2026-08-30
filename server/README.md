# VIBEZ Backend Server
**Powered by PRIGID GROUP**

A production-ready real-time backend built with TypeScript, Express, Socket.IO, WebRTC signaling, and Prisma ORM.

---

## 🚀 Render Deployment & Environment Variables

This server is deployed directly to **Render** as a Node.js Web Service. Configure the following environment variables in your **Render Dashboard** (`vibez-server` -> `Settings` -> `Environment`):

### 📋 Environment Variables Table

| Variable Name | Required | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Enables production mode optimizations |
| `PORT` | Yes | `10000` | Port listened on Render |
| `DATABASE_URL` | Yes | `postgresql://user:pass@dpg-xxx:5432/vibez_db` | Render PostgreSQL database connection string |
| `JWT_SECRET` | Yes | `vibez_jwt_prod_secret_key_super_secure_2026` | 32+ character secret for JWT token issuance |
| `VIBEZ_WEBHOOK_SECRET` | Yes | `whsec_vibez_prod_signature_key_2026` | Secret for verifying HMAC-SHA256 webhooks |
| `ADMIN_EMAIL` | Yes | `admin@vibez.com` | Superadmin initial user email |
| `ADMIN_PASSWORD` | Yes | `SecureAdminPassword2026!` | Superadmin login password |
| `ADMIN_FRONTEND_URL` | Yes | `https://vibez-admin.onrender.com` | Whitelisted Admin frontend for CORS |
| `DEVELOPER_FRONTEND_URL` | Yes | `https://vibez-developer.onrender.com` | Whitelisted Developer Hub for CORS |
| `LANDING_PAGE_URL` | Yes | `https://vibez-landing.onrender.com` | Whitelisted Landing Page for CORS |
| `FRONTEND_URL` | Yes | `https://vibez-web.onrender.com` | Whitelisted Web/HTML client for CORS |
| `ALLOWED_ORIGINS` | Optional | `https://vibez-admin.onrender.com,https://vibez-developer.onrender.com` | Comma-separated CORS allowed origins |
| `BACKEND_URL` | Yes | `https://vibez-server.onrender.com` | Public base URL of this server |
| `GMAIL_USER` | Optional | `your_email@gmail.com` | Gmail address for system notifications |
| `GMAIL_APP_PASSWORD` | Optional | `xxxx xxxx xxxx xxxx` | Google 16-character App Password |

---

## 🛠️ Build & Start Configuration on Render

- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start` *(Runs `npx prisma db push && node dist/index.js`)*

---

## 💻 Local Development

```bash
cd server
npm install
npx prisma generate
npm run dev
```
