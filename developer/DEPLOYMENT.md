# VIBEZ Developer Hub & OAuth2 Token Service — Deployment Guide
**Powered by PRIGID GROUP**

This guide describes how to deploy the VIBEZ Developer Hub and its OAuth2 Token & API Key Gateway onto **Render** (or any Node.js / Docker cloud container).

---

## 🌐 Render Web Service Configuration

- **Environment**: `Node`
- **Region**: `Oregon (US West)` or `Frankfurt (EU Central)`
- **Branch**: `main`
- **Root Directory**: `developer`
- **Build Command**: `npm install --include=dev && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/developer/server/health-check`

---

## 🔐 Environment Variables for Render Dashboard

All environment variables must be configured securely in the **Render Environment Variables** panel (Do NOT place `.env` files with secret values in repository code).

| Variable | Type | Required | Default / Example Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | Yes | `production` | Production runtime target |
| `PORT` | Number | Yes | `3000` | Port listened by the Next.js production server |
| `NEXT_PUBLIC_APP_URL` | URL | Yes | `https://vibez-developer.onrender.com` | Public URL of the Developer Hub |
| `NEXT_PUBLIC_API_URL` | URL | Yes | `https://vibez-2.onrender.com/api` | Backend API Gateway URL |
| `NEXT_PUBLIC_SERVER_URL` | URL | Yes | `https://vibez-2.onrender.com` | Primary VIBEZ backend server |
| `CUSTOM_SERVER_URL` | URL | Yes | `https://vibez-2.onrender.com` | Server bridge URL for server-side proxy operations |
| `JWT_SECRET` | Secret | Yes | `vibez_jwt_prod_secret_key_prigid_group_2026` | Secret key used for signing & verifying JWT tokens |

---

## 🔑 Scopes & Credential Architecture

The VIBEZ platform enforces OAuth2 & API Key authorization across the following permission scopes:

### 1. Identity & SSO Scopes
- `openid`: Standard OpenID Connect user subject claim
- `profile`: User display name, handle `@tag`, and avatar URL
- `email`: Verified developer & subscriber email address
- `phone`: E.164 phone number verification for 2FA
- `offline_access`: Issuance of long-lived Refresh Tokens

### 2. Messaging & Real-Time Communication
- `messages:write`: Dispatch 1-on-1 chats, group texts, and attachments
- `messages:read`: Fetch encrypted message histories and inbox logs
- `messages:delete`: Revoke delivered messages

### 3. Authentication & Phone OTP
- `auth:otp`: Generate and verify SMS/WhatsApp 6-digit OTP codes
- `auth:sessions`: Query and revoke active device sessions

### 4. Audio / Video WebRTC
- `calls:signaling`: Establish P2P and SFU video/voice calls
- `rtc:token`: Mint Agora/LiveKit channel authorization tokens
- `rtc:rooms`: Create and moderate multi-participant rooms

### 5. Telemetry, Webhooks & Logs
- `system:telemetry`: Node latency, metrics, and Spanner stats
- `logs:read`: HTTP audit trails and traffic logs
- `quotas:read`: Rate limit and request consumption metrics
- `webhooks:manage`: Register HMAC signed webhook subscriptions
- `events:replay`: Interactive event replay and debugging studio

---

## 📡 Token Issuance Endpoint

### OAuth2 Client Credentials
```bash
curl -X POST https://vibez-developer.onrender.com/api/developer/server/issue-oauth-token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "grant_type": "client_credentials",
    "scope": "openid profile email messages:write auth:otp calls:signaling"
  }'
```

### API Key Bearer Authentication
```bash
curl -X POST https://vibez-developer.onrender.com/api/developer/server/issue-oauth-token \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vbz_live_ko_your_key" \
  -d '{
    "grant_type": "api_key",
    "scope": "openid profile email messages:write"
  }'
```
