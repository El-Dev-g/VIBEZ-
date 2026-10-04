# Business-to-Consumer Chat Migration & Cloud Data Archiving

Enable seamless, automatic chat history synchronization for users logging into the **Vibez Consumer App (`/app`)** using a phone number previously attached to a **Vibez Business** account. All personal and customer chat messages, media, and contacts are synced into the consumer app, while business profiles, catalogs, and merchant tools are safely archived in the cloud without exposing business features inside the consumer app.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been confirmed based on user responses:

- **Confirmed Decision 1 (Automatic Sync on Login)**: Chat history and messages automatically synchronize when a user authenticates in the Consumer app with the same phone number used in Vibez Business.
- **Confirmed Decision 2 (Clean Separation of Features)**: Merchant tools (Product Catalog, Quick Replies, Automated Messages, Chat Labels, Cover Banner) are excluded from the Consumer app UI to maintain a clean consumer experience.
- **Confirmed Decision 3 (Cloud Data Archiving)**: The business profile, catalog items, and quick replies are safely archived in the backend database (`accountType = "CONSUMER"`) so business configuration remains preserved if the merchant re-upgrades to Vibez Business in the future.

---

### 1. Overview & Core Concept

- **What It Does**: When a merchant switches back to the Consumer app or logs into Vibez Consumer with their phone number, the app detects their account, converts or syncs their message history into local Room storage (`chats`, `messages`, `contacts`), and suppresses all business navigation panels.
- **Target Audience**: Business owners, merchants, or former business account holders returning to regular consumer messaging.
- **Key Value**: Guarantees zero loss of conversation history or contacts while enforcing strict account boundaries between consumer messaging and merchant commerce tools.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Phone Authentication & Automatic Detection**:
   - User logs in via Phone Auth (`/api/auth/phone`) or Google Sign-In (`/api/auth/google`) in the Consumer app.
   - The backend checks if the account holds `accountType = "BUSINESS"` or holds archived business data.
2. **Seamless Downgrade & Data Sync**:
   - The server updates `accountType` to `"CONSUMER"` while retaining the `BusinessProfile` record in an `archived` state.
   - The response returns all private and group chat threads and messages to the Consumer app.
3. **Consumer UI Posture**:
   - The Consumer app populates the chat list with all historical conversations and media.
   - Business tools screens (Catalog Manager, Quick Replies, Labels) are not rendered in the Consumer UI.

#### Visual Identity & Theme
- **Theme Alignment**: Clean Vibez Emerald design system (`#00A884` primary) with standard M3 bottom navigation (Chats, Status, Communities, Calls).
- **Migration Indicator**: Brief non-intrusive toast notification on first launch: *"Chats restored successfully."*

---

### 3. Key Product Decisions & Trade-Offs

- **Server-Side Account Downgrade & Profile Archiving**:
  - *Chosen Approach*: `POST /api/business/migrate-account` sets `accountType = "CONSUMER"` on the user model without deleting `BusinessProfile` or `CatalogItem` records.
  - *Why*: Allows instant restoration if the user re-downloads Vibez Business later while keeping the consumer API response lightweight.
- **Unified Message Schema**:
  - *Chosen Approach*: `MessageEntity` in Room stores all imported messages regardless of whether they originated in the Business app or Consumer app.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    VIBEZ CONSUMER APP                       │
│  ┌──────────────────────┐        ┌───────────────────────┐  │
│  │ AuthScreen (Login)   │───────▶│ Automatic Chat Sync   │  │
│  └──────────────────────┘        └──────────┬────────────┘  │
│                                             │               │
│                                             ▼               │
│                                  ┌───────────────────────┐  │
│                                  │ Local Room DB         │  │
│                                  │ (Chats, Messages)     │  │
│                                  └───────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP Auth Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       VIBEZ SERVER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ /api/auth/phone & /api/business/migrate-account       │  │
│  │ 1. Set accountType = "CONSUMER"                       │  │
│  │ 2. Archive BusinessProfile & Catalog in Cloud DB      │  │
│  │ 3. Fetch & return all User Chat & Message DTOs        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Code Modifications Required
1. **Server (`server/src/controllers/BusinessController.ts`)**:
   - Update `migrateAccount` to handle `targetType = "CONSUMER"`, maintaining the `BusinessProfile` in an archived status without deleting catalog items.
2. **Consumer Repository (`app/src/main/java/com/example/data/WhatsAppRepository.kt`)**:
   - Add `syncConsumerAccountFromBusiness(token)` to trigger account conversion and fetch full chat history during authentication.
3. **Consumer ViewModel (`app/src/main/java/com/example/ui/WhatsAppViewModel.kt`)**:
   - Automatically invoke `syncConsumerAccountFromBusiness` after successful login or profile setup.
