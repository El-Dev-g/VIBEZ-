# VIBEZ Landing Page
**Powered by PRIGID GROUP**

Official product showcase, feature presentation, and web introduction for the VIBEZ application suite.

---

## 🚀 Render Deployment & Environment Variables

This application is deployed directly to **Render** as a Web Service. Configure all environment variables in your **Render Dashboard** (`vibez-landingpage` -> `Settings` -> `Environment`):

### 📋 Environment Variables Table

| Variable Name | Required | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Production environment flag |
| `PORT` | Yes | `3000` | Port listened on Render |
| `NEXT_PUBLIC_API_URL` | Yes | `https://vibez-server.onrender.com/api` | Backend REST API endpoint base URL |
| `NEXT_PUBLIC_DEV_URL` | Optional | `https://vibez-developer.onrender.com` | Link to Developer Hub |
| `NEXT_PUBLIC_ADMIN_URL`| Optional | `https://vibez-admin.onrender.com` | Link to Admin Portal |

---

## 🛠️ Build & Start Configuration on Render

- **Root Directory**: `landingpage`
- **Runtime**: `Node`
- **Build Command**: `npm install --include=dev && npm run build`
- **Start Command**: `npm start`

---

## 💻 Local Development

```bash
cd landingpage
npm install
npm run dev
```
