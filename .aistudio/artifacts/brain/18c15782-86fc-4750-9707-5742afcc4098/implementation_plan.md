# VIBEZ Backend Security & Architecture Hardening Plan

This implementation plan addresses the critical (P0) security vulnerabilities, payment webhook verifications, order authorization checks, Firebase authentication hardening, and database financial data integrity issues outlined in the repository audit report.

## User Review & Critical Decisions

> [!IMPORTANT]
> All critical security fixes (Order Authorization, Payment Webhook Verification, Server-Side Order Pricing Validation, Firebase Auth Validation, and Prisma Decimal/Financial Types) will be implemented comprehensively across the backend server (`server/`).

- **Confirmed Decision**: Implement all critical backend security fixes simultaneously, ensuring server-side authority over orders, payments, and authentication.

---

## 1. Overview & Core Concept

- **What It Does**: Hardens the Node.js/Express/Prisma backend server and Socket.IO gateway against unauthorized order manipulation, forged payment webhooks, unverified Firebase tokens, and insecure client-supplied pricing/totals.
- **Target Audience / Persona**: Platform administrators, merchants, and secure messaging/commerce users.
- **Key Value**: Guarantees financial data integrity, strict merchant/buyer ownership verification for orders, cryptographic payment validation, and robust auth token verification.

---

## 2. User Experience & Visual Design

- **Admin / System Impact**: Backend server API & Socket.IO events security overhaul.
- **Client Impact**: Improved reliability, secure error responses (401/403/404), and exact server-calculated order totals in the Android business & consumer apps.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1**: Server-Side Authority for Orders & Pricing
  - *Chosen Approach*: Calculate order totals on the server from the merchant's actual catalog and reject client-supplied totals/items.
  - *Why*: Prevents tampering with prices, quantities, or business references by malicious clients.
- **Decision 2**: Strict Order Authorization & Exact IDs
  - *Chosen Approach*: Use exact order IDs only, remove chat membership as an authorization check for order status updates, and verify merchant/buyer roles explicitly.
  - *Why*: Ensures chat participants cannot modify order payment/delivery status unless they are the authorized merchant or buyer.
- **Decision 3**: Database Financial Types (Prisma Decimal)
  - *Chosen Approach*: Update Prisma schema to use PostgreSQL Decimal for monetary amounts and ensure precision.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Android Clients                      │
│        (Consumer & Business Compose Apps)              │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
        HTTP / REST API            Socket.IO Gateway
               │                          │
               ▼                          ▼
┌────────────────────────────────────────────────────────┐
│             Node.js / Express Backend Server           │
├─────────────────┬───────────────────┬──────────────────┤
│ Auth Controller │ Business Controller│ Payment Controller│
│ (Firebase Admin │ (Exact Order IDs, │ (Webhook Sig &   │
│  Token Verify)  │  Server Pricing)  │  Idempotency)    │
└──────────────┬──┴─────────┬─────────┴──────────┬───────┘
               │            │                    │
               └────────────┼────────────────────┘
                            ▼
               ┌─────────────────────────┐
               │  PostgreSQL / Prisma    │
               │  (Decimal Money Types)  │
               └─────────────────────────┘
```

### Key Technical Tasks

1. **Order Authorization & Exact IDs (`BusinessController.ts`, `index.ts`)**:
   - Enforce exact ID lookup for orders (no partial matches).
   - Return 404 if order not found.
   - Restrict updates: Merchants can only update orders belonging to their business; buyers can only cancel their own orders in cancellable states.
   - Remove chat-membership fallback for order updates.
   - Apply identical authorization rules across HTTP endpoints and Socket.IO events.

2. **Payment Webhook Verification (`PaymentController.ts`, `index.ts`)**:
   - Enforce strict webhook signature and secret validation in production (fail closed if `PAYMENT_WEBHOOK_SECRET` is missing).
   - Independent transaction status verification against provider API if applicable.
   - Make transaction completion and badge activation atomic and idempotent.

3. **Server-Side Order Pricing & Validation (`BusinessController.ts`)**:
   - In `createOrder`, validate each product against the merchant's actual catalog.
   - Calculate total amount on the server using trusted catalog prices.
   - Reject negative prices, invalid quantities, and unexpected fields.

4. **Firebase Phone & Google Auth Hardening (`AuthController.ts`)**:
   - Use Firebase Admin SDK `verifyIdToken()` exclusively.
   - Verify phone number and email claims rigorously against client requests.
   - Remove empty-certificate fallback.

5. **Prisma Schema & Financial Types (`schema.prisma`)**:
   - Update amount fields from float to `Decimal` where appropriate.
   - Ensure clean database schema state.
