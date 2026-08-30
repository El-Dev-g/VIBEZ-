# VIBEZ Developer Hub & API Platform
**Powered by PRIGID GROUP**

Official developer platform, interactive REST API reference, WebRTC token issuer, Webhook studio, and multi-language SDK documentation for the VIBEZ ecosystem.

---

## 🚀 Render Deployment & Environment Variables

This Next.js 14 application is deployed directly to **Render** as a Web Service. Configure all environment variables in your **Render Dashboard** (`vibez-developer-hub` -> `Settings` -> `Environment`):

### 📋 Environment Variables Table

| Variable Name | Required | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Production environment flag |
| `PORT` | Yes | `3000` | Port listened on Render |
| `NEXT_PUBLIC_API_URL` | Yes | `https://vibez-server.onrender.com/api` | Backend REST API endpoint base URL |
| `NEXT_PUBLIC_SERVER_URL`| Yes | `https://vibez-server.onrender.com` | Backend server base URL |
| `CUSTOM_SERVER_URL` | Yes | `https://vibez-server.onrender.com` | Internal server bridge URL for direct API proxy |
| `JWT_SECRET` | Yes | `vibez_jwt_prod_secret_key_super_secure_2026` | Token signing secret (must match backend) |

---

## 🛠️ Build & Start Configuration on Render

- **Root Directory**: `developer`
- **Runtime**: `Node`
- **Build Command**: `npm install --include=dev && npm run build`
- **Start Command**: `npm start`

---

## 💻 Local Development

```bash
cd developer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or port configured in package.json) in your browser.
