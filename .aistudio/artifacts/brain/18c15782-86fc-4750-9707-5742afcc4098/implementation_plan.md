# Implementation Plan: PRIGID DEVELOPER CONSOLE

## Overview & Objective
Build a Meta for Developers-style platform within the existing Vibez repository. This console enables developers to manage applications, products, permissions, tokens, webhooks, and API testing using the current React, Express, Prisma, and PostgreSQL stack.

## User Review & Critical Decisions

> [!IMPORTANT]
> 1. **Reuse**: We will fully leverage existing authentication, Prisma DB, and UI components.
> 2. **Phase-Based**: Execution follows the requested 8 phases to ensure regression testing.
> 3. **Data Model**: Several new Prisma models (AppProduct, Permission, etc.) are needed; migrations will be used.

- **Confirmed Decision 1**: Implement functionality as phases to keep integration stable.
- **Confirmed Decision 2**: Strict adherence to security (HTTPS, HMAC for webhooks, no secret exposure).

---

## 1. User Experience & Visual Design
- **Key Flow**: Login -> Dashboard (My Apps / Create App) -> App Management Console.
- **Visual**: Dark/light theme matching existing Vibez console aesthetic.
- **Components**: Reusable sidebar, app/product cards, permission matrix, webhook table.

---

## 2. Technical Architecture
```
┌──────────────────────────────────────┐
│  Developer Console (React / Vite)    │
└──────────────────┬───────────────────┘
                   │ REST API (/api/developer/v1)
                   ▼
┌──────────────────────────────────────┐
│  Backend Server (Express / Prisma)   │
└──────────────────┬───────────────────┘
                   │ Prisma DB
                   ▼
┌──────────────────────────────────────┐
│  PostgreSQL (Developer Tables)       │
└──────────────────────────────────────┘
```

---

## 3. Implementation Plan (Phased)

### Phase 1: Inspection & Setup
- Inspect frontend/backend structure to map existing components.
- Prepare Prisma migrations for new models.

### Phase 2: Application Management
- Prisma models: `DeveloperApp`, `AppPlatform`.
- API: App CRUD routes.
- Frontend: Dashboard and Create App wizard.

### Phase 3: Products
- Prisma: `Product`, `AppProduct`.
- Global catalogue seeding.
- Add/Configure Product flow.

### Phase 4: Permissions
- Prisma: `Permission`, `AppPermission`.
- Permission matrix UI and enforcement middleware.

### Phase 5: Tokens
- Prisma: `AccessToken`.
- Secure test-token generation & validation middleware.

### Phase 6: Webhooks
- Prisma: `Webhook`, `WebhookSubscription`, `WebhookDelivery`.
- Delivery worker, signing secret management, endpoint verification.

### Phase 7: API Explorer & Monitoring
- API testing UI.
- Log view and statistics dashboard.

### Phase 8: Production Readiness
- App review flow, live access controls, integration tests.

---

## 4. Testing Strategy
- Secure ownership enforcement (cannot access others' apps).
- Token validation (expiration/revocation checks).
- Webhook delivery/retries/signing validation.
- Migration safety.
