# Vibez Monetization Strategy & Architecture Guide

A complete blueprint for monetizing the Vibez communication platform across consumer (B2C), creator (B2B2C), and developer infrastructure (B2B) verticals.

---

## 1. Executive Summary

Vibez is architected with modern communication primitives (chat, voice/video WebRTC calls, status stories, communities, channels, and developer APIs). Monetization is structured across three core pillars:
1. **User Subscriptions & In-App Purchases (B2C):** Profile verification badges, Vibez Premium tier, and digital customization.
2. **Creator & Community Economy (B2B2C):** Paid subscriber channels, tips, and broadcast tools.
3. **B2B Infrastructure & Developer APIs:** API key billing for messaging dispatch, RTC token generation, and webhooks.

---

## 2. Monetization Models & Pricing Tiers

### 2.1 Profile Verification Badges (Implemented in Backend)
- **Model:** One-time purchase or recurring monthly charge.
- **Price Point:** Default `$3.00 USD` (dynamically configurable via Admin Dashboard).
- **Perks:**
  - Official green verified badge on profile, chat headers, and status cards.
  - Priority message delivery and higher trust factor.
  - Anti-impersonation badge protection.
- **Backend Endpoints:**
  - `GET /api/payments/badge-price`: Retrieve current verification fee.
  - `POST /api/payments/verification/process`: Process and record badge transaction.
  - `GET /api/payments/verification/status`: Check current user badge status.

### 2.2 Vibez Premium Tier (B2C Subscription)
- **Pricing:** `$2.99 / month` or `$24.99 / year` (with a 7-day free trial).
- **Core Value Proposition:**

| Feature | Standard Free Tier | Vibez Premium |
|---|---|---|
| **Video Status Length** | 30 seconds | Up to 3 minutes (HD quality) |
| **Status Expiration** | Fixed 24 hours | Configurable (24h, 48h, 7 days) |
| **Max File Upload Size** | 25 MB | Up to 2 GB (cloud streaming) |
| **Cloud Storage** | 100 MB per user | 50 GB encrypted media storage |
| **App Customization** | Standard theme | Premium app icons, animated wallpapers |
| **Voice Notes** | Standard playback | 1.5x / 2.0x playback & AI voice-to-text |
| **Groups & Communities** | Up to 256 members | Up to 2,048 members with admin tools |

### 2.3 Paid Channels & Communities (Creator Economy)
- **Model:** Monthly subscription set by channel creator (e.g., $1.99 - $49.99/mo).
- **Platform Fee:** Vibez retains **15%** platform commission; creator receives **85%**.
- **Use Cases:**
  - Stock/crypto trading signals.
  - Fitness coaching & daily routines.
  - Exclusive creator content & podcast drops.
  - Educational courses and community Q&A.

### 2.4 Developer Bridge & API Subscriptions (B2B)
- **Infrastructure Already Built:** `/api/developer/keys`, `/api/developer/rtc/token`, `/api/developer/messages/send`.
- **Tiers:**
  - **Starter (Free):** Up to 1,000 messages/mo, 100 WebRTC call minutes.
  - **Pro ($29/mo):** 50,000 messages/mo, 5,000 WebRTC minutes, priority socket nodes.
  - **Enterprise ($199/mo+):** Custom volumes, dedicated TURN/STUN servers, SLA guarantees.

---

## 3. Technical Integration Roadmap

### 3.1 Google Play Billing (Android Client)
Google Play requires digital goods sold on Android to route through Google Play In-App Billing:

1. **Dependency Setup:**
   ```kotlin
   // In app/build.gradle.kts
   implementation("com.android.billingclient:billing-ktx:7.0.0")
   ```

2. **Billing Lifecycle Flow:**
   ```
   [User taps "Get Verified" / "Upgrade"]
                  │
                  ▼
   [BillingClient.launchBillingFlow()]
                  │
                  ▼
   [Google Play Native Payment Sheet]
                  │
                  ▼
   [PurchasesUpdatedListener receives Purchase]
                  │
                  ▼
   [Client sends PurchaseToken to POST /api/payments/verification/process]
                  │
                  ▼
   [Server validates token with Google Play Developer API]
                  │
                  ▼
   [Prisma updates User.isVerified = true & BadgePayment recorded]
   ```

3. **Backend Validation Setup:**
   - Link Google Play Console to Google Cloud Service Account.
   - Use Google APIs Client Library (`googleapis`) in Node.js to verify purchase receipts:
     ```typescript
     import { google } from 'googleapis';
     const androidpublisher = google.androidpublisher('v3');
     // Validate subscription or one-time token
     ```

### 3.2 Stripe / Card Gateway (Web Portal & Developer Platform)
For web portal payments and B2B Developer API subscriptions:

1. **Configure Environment Variables (`server/.env`):**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PUBLIC_KEY=pk_live_...
   ```

2. **Webhook Endpoint (`POST /api/payments/webhook`):**
   - Automatically handles `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
   - Maintains real-time subscription lifecycle in Prisma database.

---

## 4. Database Schema Alignment

The PostgreSQL database (`prisma/schema.prisma`) already supports:
- `BadgePayment`: Transaction tracking, payment provider, price, and status.
- `SystemSetting`: Dynamic verification badge price configuration (`verificationBadgePrice`).
- `ApiKey`: Developer API access tokens, rate limits, and request logging.
- `Subscription`: Email newsletter and notification records.

---

## 5. Launch Checklist & Revenue Optimization

- [ ] **Merchant Account:** Complete merchant banking setup in Google Play Console.
- [ ] **Admin Dashboard Pricing Controls:** Verify that the admin panel can update verification price (`/api/admin/settings`).
- [ ] **Receipt Verification:** Enable server-side cryptographic signature checks on all purchase tokens.
- [ ] **Freemium Upsell Triggers:** Add contextual upgrade prompts when users attempt to upload files > 25MB or videos > 30s.
- [ ] **Analytics Tracking:** Track conversion rates from status viewers and profile verification views to optimize pricing elasticity.
