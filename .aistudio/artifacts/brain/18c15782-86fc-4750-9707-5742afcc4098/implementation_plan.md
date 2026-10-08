# In-Chat Order Status Progression & Synchronization

A unified, real-time order status management system that empowers merchants to progress customer orders directly from action buttons on the in-chat order card, instantly synchronizing updates across VIBEZ Business, VIBEZ Consumer, and the backend server.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification and govern the execution of this feature:

- **Confirmed Decision 1 (Update Location)**: Order status updates occur directly via action buttons on the in-chat order card within the conversation, eliminating the need to leave the chat or open separate management views.
- **Confirmed Decision 2 (Lifecycle Progression)**: Orders follow a strict 6-stage lifecycle: `Pending` ➔ `Confirmed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Completed`, with `Cancelled` available prior to fulfillment.
- **Recommended Default (Real-Time Push)**: Status updates broadcast over Socket.IO and persist to the database so consumers see live badge and timeline updates immediately without pulling to refresh.

---

### 1. Overview & Core Concept

- **What It Does**: Enables merchants in VIBEZ Business to manage incoming customer orders directly within the chat view. When an order card is received, contextual action buttons (such as "Confirm Order", "Start Preparing", "Out for Delivery", "Mark Completed", and "Cancel") appear right on the card. Tapping an action triggers an immediate state transition, persists the change to the server, and broadcasts the new state via WebSockets so the customer in the VIBEZ Consumer app sees their in-chat tracker update in real time.
- **Target Audience / Persona**: Small business owners, vendors, and merchants managing live customer conversations in VIBEZ Business, and retail shoppers in the VIBEZ Consumer app awaiting order updates.
- **Key Value**: Eliminates broken state mismatches where consumer orders are permanently stuck on "Pending" and merchant orders show as static "Order Received" with no action controls.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Order Reception (Merchant)**: When a consumer sends an order inquiry, the merchant's chat bubble displays a rich "Customer Order" card featuring order ID, item breakdown, total cost, note, and an amber "Pending" status badge. Prominent action buttons ("Confirm Order" and "Cancel") are visible at the base of the card.
2. **Order Status Advancement (Merchant)**: 
   - Tapping **"Confirm Order"** turns the badge to cyan "Confirmed" and swaps the actions to **"Start Preparing"** and "Cancel".
   - Tapping **"Start Preparing"** turns the badge to indigo "Preparing" and advances the actions to **"Out for Delivery"** and "Cancel".
   - Tapping **"Out for Delivery"** switches the badge to blue "Out for Delivery" with a delivery vehicle icon and displays **"Mark as Completed"**.
   - Tapping **"Mark as Completed"** finishes the cycle, locking the card with a checkmark badge "Completed ✓".
   - Tapping **"Cancel"** at any step triggers a confirmation and transitions the card to a muted red "Cancelled ✕" badge.
3. **Live Consumer Tracking (Consumer)**: In the customer's chat, the order card dynamically displays the matching color badge and an interactive 5-point milestone progress bar (`Placed` ➔ `Confirmed` ➔ `Preparing` ➔ `On the Way` ➔ `Delivered`). The customer sees each step illuminate in real time as the merchant updates it.

#### Visual Identity & Theme
- **Aesthetic Direction**: Modern Material 3 messaging styling with high-contrast, recognizable status indicators and tactile rounded pill buttons.
- **Color Palette & Status Tokens**:
  - `PENDING`: Amber/Orange surface container (`#FEF3C7`), text/icon (`#D97706`).
  - `CONFIRMED`: Cyan/Teal surface container (`#E0F2FE`), text/icon (`#0284C7`).
  - `PREPARING`: Purple/Indigo surface container (`#EDE9FE`), text/icon (`#6D28D9`).
  - `OUT_FOR_DELIVERY`: Blue surface container (`#DBEAFE`), text/icon (`#2563EB`).
  - `COMPLETED`: Emerald Green surface container (`#DCFCE7`), text/icon (`#15803D`).
  - `CANCELLED`: Red/Rose surface container (`#FEE2E2`), text/icon (`#DC2626`).
- **Typography & Hierarchy**: 15sp Bold order title, 13sp body for item lines, 11sp ExtraBold uppercase status badges, and 14sp SemiBold action button labels.
- **Component Styling & Layout**: Elevate order cards with 12.dp rounded corners, subtle border strokes (`1.dp` outlineVariant), generous 12.dp internal padding, and 48.dp minimum touch targets for all action buttons.

#### Interactive Feedback & Motion
- Smooth button click state with Material ripples and subtle loading spinners during network transit.
- Animated badge transitions with Compose `Crossfade` or `AnimatedContent` when the status changes.
- In-chat snackbar / toast confirming the successful status transition.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct In-Chat Action Buttons vs. Modal Dialog or External Management Screen**
  - *Chosen Approach*: Embed the primary next-step progression button directly into the chat bubble itself, with a secondary overflow menu for non-linear updates.
  - *Why*: Reduces cognitive load and friction for merchants communicating live with customers. They can fulfill orders without losing conversational context.
  - *Alternatives Considered*: Requiring navigation to a separate "Orders Dashboard" tab was considered, but users specifically selected updating directly from action buttons in chat.
- **Decision 2: Dual Persistence (Prisma Order Record + In-Message Payload Sync)**
  - *Chosen Approach*: Update both the `Order` database record and the `Message` record's `mediaUrl` serialized payload on the backend, then broadcast an event payload containing both IDs.
  - *Why*: Ensures backward compatibility with existing Room chat caching on client devices while maintaining centralized order indexing for merchant analytics.
  - *Alternatives Considered*: Storing status only in the `Order` table would require rewriting the chat message rendering architecture to perform asynchronous relational joins inside Compose message lists.
- **Decision 3: Real-Time WebSockets with REST Fallback**
  - *Chosen Approach*: Support updating via Socket.IO event `update_order_status` as well as REST endpoint `PUT /api/business/orders/:id/status` (and `PATCH /api/chats/:chatId/messages/:messageId/order-status`).
  - *Why*: Guarantees instant sub-second delivery when both parties are connected while ensuring offline or reconnected clients synchronize accurately upon opening the app.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

#### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VIBEZ BUSINESS (Merchant)                       │
│                                                                        │
│   ChatDetailScreen ──► MessageBubble (Type: ORDER)                     │
│                             │                                          │
│                             ├─► Status Badge ("Pending", etc.)         │
│                             └─► Action Buttons ("Confirm Order", etc.) │
│                                           │                            │
│                                           ▼                            │
│                       WhatsAppViewModel.updateOrderStatus()            │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                        Socket emit 'update_order_status'
                               or REST PUT request
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             SERVER BACKEND                             │
│                                                                        │
│   BusinessController / Socket Gateway                                  │
│        │                                                               │
│        ├─► 1. Prisma: Update Order.status & Message.mediaUrl payload   │
│        ├─► 2. Socket.IO: Broadcast 'order_status_updated' to:          │
│        │        • chat_${chatId}                                       │
│        │        • user_${buyerId}                                      │
│        │        • user_${merchantId}                                   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        VIBEZ CONSUMER (Buyer)                          │
│                                                                        │
│   SocketManager.on('order_status_updated')                             │
│        │                                                               │
│        ▼                                                               │
│   WhatsAppRepository ──► WhatsAppDao (Room updateMessage)              │
│        │                                                               │
│        ▼                                                               │
│   ChatDetailScreen ──► MessageBubble (Type: ORDER)                     │
│                             │                                          │
│                             ├─► Dynamic Status Badge                   │
│                             └─► 5-Stage Live Progress Milestone Track  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & State
1. **`OrderMessagePayload` (Shared Schema)**:
   - `orderId`: String
   - `businessUserId`: String
   - `businessName`: String
   - `items`: List<`OrderItemPayload`>
   - `totalAmount`: Double
   - `currency`: String
   - `note`: String?
   - `status`: String (`PENDING`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `COMPLETED`, `CANCELLED`)
   - `updatedAt`: Long?
2. **Server `Order` & `Message`**:
   - `Order.status`: Updated to match the progression.
   - `Message.mediaUrl`: Contains the updated JSON payload with the current status so that any fresh fetch or local cache reflects the latest state.

#### Interactive Component & State Mapping

| Current Status | Primary Action (Merchant) | Secondary Action (Merchant) | Consumer Tracker State |
| :--- | :--- | :--- | :--- |
| `PENDING` | **Confirm Order** (Emerald) | Cancel (Outline Red) | Step 1/5 Active ("Order Placed") |
| `CONFIRMED` | **Start Preparing** (Teal) | Cancel (Outline Red) | Step 2/5 Active ("Confirmed") |
| `PREPARING` | **Out for Delivery** (Indigo) | Cancel (Outline Red) | Step 3/5 Active ("Preparing") |
| `OUT_FOR_DELIVERY` | **Mark Completed** (Emerald) | — | Step 4/5 Active ("Out for Delivery") |
| `COMPLETED` | *None (Locked)* | — | Step 5/5 Active ("Delivered ✓") |
| `CANCELLED` | *None (Locked)* | — | "Order Cancelled" Alert Banner |

#### Key Sequences & Integrations
1. **Trigger**: Merchant clicks an action button (e.g. "Confirm Order") on `MessageBubble`.
2. **Dispatch**: Bubble calls `onUpdateOrderStatus(message, orderId, "CONFIRMED")`.
3. **Network**: Dispatched through `WhatsAppViewModel` ➔ `WhatsAppRepository` via Socket event `update_order_status` and REST endpoint.
4. **Backend Processing**: Server updates database rows and emits `order_status_updated`.
5. **Client Reception**: Both apps receive the event via `SocketManager`, update the local Room database, and the Compose UI updates immediately.
