# Implementation Plan: Product Configuration, Features & Webhooks Architecture

Establish a Meta for Developers-grade Product Studio within the PRIGID Developer Console where every activated product features dedicated left-navigation routing, customizable configurations, modular feature and sub-feature switches, and product-scoped webhook subscriptions.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed via interactive user clarification:
> - **Product Navigation**: Each activated product receives a dedicated tab in the app's left sidebar for direct access.
> - **Feature Hierarchy**: Features and sub-features are structured as toggleable switches with expandable settings panels.
> - **Webhook Scope**: Each product contains its own dedicated webhook subscription and event delivery testing panel.

- **Confirmed Decision 1**: Dedicated left-navigation tab for each activated product under an "Active Products" sidebar group.
- **Confirmed Decision 2**: Toggleable feature switches with individual settings panels for fine-grained product configuration.
- **Confirmed Decision 3**: Dedicated webhook subscriptions panel inside each product with event filters and live testing.
- **Confirmed Decision 4**: Keep client and server in strict synchronization by extending both `PrigidAppConsole` and `DeveloperController.ts` with product configuration APIs.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the developer console from a static catalog into an interactive Product Studio. When a developer adds a product (e.g., Messaging API, Phone Auth, Commerce Catalog, WebRTC, Orders), that product appears in the application's left navigation. Inside, developers can adjust operational parameters, toggle specific sub-features on or off, and subscribe endpoints to product-specific webhooks.
- **Target Audience**: Mobile and web engineers integrating PRIGID platform APIs into Android, iOS, web, or backend services.
- **Key Value**: Provides granular control over platform capabilities, reduces payload clutter by allowing developers to enable only needed sub-features, and streamlines webhook setup per product domain.

---

## 2. Visual & Interaction Design

### Theme & Aesthetics
- **Dark Studio Aesthetic**: Deep navy/slate backdrop (`#050811`, `#090d18`) with emerald accents (`#10b981`), high-contrast typography, and subtle border hierarchy.
- **Product Branding**: Distinct colored icons and badges for each product domain (Blue for Messaging, Violet for Auth, Amber for Commerce, Emerald for WebRTC, Teal for Webhooks).

### Layout & Navigation Structure
- **Left Sidebar in App Management**:
  - **App Core**: Overview, Basic Settings, Platforms, Permissions, Tokens & Test Users, API Explorer.
  - **Add Products**: Catalog to browse and activate new APIs.
  - **Active Products (Dynamic)**: List of installed products with active status pills (e.g., `Messaging API`, `User Profile`, `Commerce`).
- **Product Studio Page Layout**:
  - **Header**: Product title, category, status pill (Development/Live), version badge, and "Remove Product" action.
  - **Sub-Tabs / Panes**:
    1. **Overview & Config**: Base URL, environment mode (Sandbox/Production), quota limits, API version selector.
    2. **Features & Sub-Features**: Card list of modular capabilities with instant switch toggles and expanding parameter drawers.
    3. **Webhooks**: Dedicated endpoint URL, verify token, event subscription checkboxes (e.g., `message.sent`, `message.delivered`), HMAC signature test tool, and delivery log history.
    4. **API Quick Reference**: Sample curl, Node.js, and Kotlin snippets tailored to the enabled sub-features.

---

## 3. Technical Architecture

### Component & Data Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│             PRIGID Developer Console (React / Vite)         │
│  ┌───────────────────────┐  ┌────────────────────────────┐  │
│  │ App Navigation Sidebar│  │ Product Studio View        │  │
│  │  ├─ Core App Tabs     │  │  ├─ Config Tab             │  │
│  │  └─ Active Products   │  │  ├─ Features & Sub-features│  │
│  │      ├─ Messaging API ┼──┼──┤  ├─ Switch Toggles      │  │
│  │      ├─ Commerce Hub  │  │  │  └─ Settings Panel      │  │
│  │      └─ WebRTC Voice  │  │  └─ Product Webhooks       │  │
│  └───────────────────────┘  └─────────────┬──────────────┘  │
└───────────────────────────────────────────┼─────────────────┘
                                            │ REST / JSON
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│          Backend Server (Express / DeveloperController)     │
│  ├─ GET  /api/developer/apps/:id/products                   │
│  ├─ PUT  /api/developer/apps/:id/products/:productId/config │
│  ├─ POST /api/developer/apps/:id/products/:productId/toggle │
│  └─ POST /api/developer/apps/:id/products/:productId/webhooks│
└───────────────────────────────────────────┬─────────────────┘
                                            │ Prisma ORM
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│          PostgreSQL Database (Neon DB)                      │
│  ├─ ServerApplication                                       │
│  ├─ Product                                                 │
│  └─ AppProduct (with JSON config & feature toggles)         │
└─────────────────────────────────────────────────────────────┘
```

### Data Schema Enhancements
In `schema.prisma`:
- `AppProduct`:
  - `config`: JSON object storing:
    ```json
    {
      "environment": "DEVELOPMENT",
      "version": "v2.4",
      "features": {
        "direct_messages": { "enabled": true, "subFeatures": { "read_receipts": true, "typing_indicators": true } },
        "media_uploads": { "enabled": true, "maxFileMb": 25 },
        "group_chats": { "enabled": false }
      },
      "webhook": {
        "url": "https://api.example.com/webhooks/messaging",
        "secret": "whsec_...",
        "subscribedEvents": ["message.sent", "message.delivered"]
      }
    }
    ```

---

## 4. Implementation Steps (Phased Execution)

### Phase 1: Product Definition Registry Enhancement
- Expand `defaultProducts` in `DeveloperController.ts` and `PrigidAppConsole.tsx` with comprehensive feature trees, configurable parameters, and domain webhook events for:
  - **Messaging API**: Direct Messages (Read Receipts, Typing Indicators), Media Attachments (CDN Caching, Compression), Group Channels.
  - **Authentication API**: Phone OTP (SMS fallback, Rate limits), OAuth2 Authorization Code, Biometrics Challenge.
  - **Commerce & Catalog API**: Store Catalog (Inventory alerts), Orders & In-Chat Checkout, Stripe/Card Webhooks.
  - **WebRTC API**: Audio/Video Signaling, STUN/TURN Allocation, Call Recording Archive.
  - **AI & Gemini API**: Smart Replies, Sentiment Analysis, Context Summaries.

### Phase 2: Server Backend API Extensions
- In `server/src/controllers/DeveloperController.ts`:
  - Implement `updateAppProductConfig`: Persists product-specific settings, feature toggles, and webhook endpoints into the database.
  - Implement `getAppProducts`: Returns activated products alongside their customized feature configurations.
  - Implement `testProductWebhook`: Dispatches simulated events signed with the product's webhook secret.
- Register endpoints in `server/src/index.ts`:
  - `GET /api/developer/apps/:id/products`
  - `PUT /api/developer/apps/:id/products/:productId/config`
  - `POST /api/developer/apps/:id/products/:productId/webhooks/test`

### Phase 3: Client Product Studio UI (`PrigidAppConsole.tsx`)
- **Navigation Update**: Dynamically render activated products in the application's left sidebar beneath the core app navigation.
- **Product Detail View**:
  - **Config Panel**: Key configuration inputs (URLs, environment, quota limits).
  - **Feature Switchboard**: Interactive toggle switches for each feature and sub-feature with real-time state persistence.
  - **Product Webhooks Panel**: Callback URL input, verification token, secret generator, subscribed event checkboxes, and live payload tester.
- **Smooth Navigation**: Seamless back-and-forth between App Overview and individual Product Studios.

---

## 5. Verification & Testing Strategy

- **Build Verification**:
  - Run `npm run build` on `developer` frontend to guarantee TypeScript and Vite compilation.
  - Run `npm run build` on `server` backend to guarantee Express and Prisma compilation.
  - Run `compile_applet` to ensure full repository integrity.
- **Functional Validation**:
  - Verify activating a product adds it to the left sidebar immediately.
  - Verify toggling a feature or sub-feature persists across page reloads.
  - Verify configuring product webhooks validates URLs and computes valid HMAC signatures.
