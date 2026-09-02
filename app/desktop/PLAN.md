# VIBEZ Web & Desktop Client — Technical Architecture & Planning Guide

## 1. Overview & Objectives

The **VIBEZ Web/Desktop Client** is a multi-platform companion application designed to deliver full feature parity with the VIBEZ Android application. It connects directly to the existing VIBEZ Node.js / Express / Socket.IO backend service (`/server`) and PostgreSQL / Prisma database schema.

---

## 2. Technical Stack Recommendation

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Framework** | **React 18 / Vite** (or Next.js App Router) | Fast HMR, lightweight bundle size, optimal performance for desktop/web views. |
| **Styling & UI** | **Tailwind CSS + Shadcn/UI** | Flexible, responsive design system matching the VIBEZ M3 Dark/Light aesthetics. |
| **Icons** | **Lucide React** | Modern, clean vector iconography matching Material Symbols. |
| **Real-time Engine**| **Socket.IO Client (`socket.io-client`)** | Reuses identical WebSocket protocol events present in the VIBEZ Android client. |
| **State Engine** | **Zustand + TanStack Query (React Query)** | Minimal overhead for chat state, optimistic message updates, and offline caching. |
| **Desktop Wrapper** | **Tauri 2.0 / Electron** | Cross-platform desktop executable support (macOS, Windows, Linux). |

---

## 3. Architecture & Data Flow

```
+-------------------------------------------------------------------+
|                     VIBEZ Web / Desktop Client                    |
|  +--------------------+  +------------------+  +---------------+  |
|  | Zustand Store      |  | React Query Cache|  | WebRTC Audio  |  |
|  +---------+----------+  +--------+---------+  +-------+-------+  |
+------------|----------------------|--------------------|----------+
             | REST Calls           | Socket Events      | P2P Signals
             v                      v                    v
+-------------------------------------------------------------------+
|                     VIBEZ Express Backend                         |
|  +--------------------+  +------------------+  +---------------+  |
|  | Auth & Controllers |  | Socket.IO Server |  | WebRTC Gateway|  |
|  +--------------------+  +------------------+  +---------------+  |
+-------------------------------------------------------------------+
                                    |
                                    v
                          +-------------------+
                          | PostgreSQL DB     |
                          +-------------------+
```

---

## 4. Feature Parity Roadmap & Modules

### Module A: Authentication & QR Linking
- **Phone / Username Login**: Mirroring `POST /api/auth/login` and `POST /api/auth/verify-otp`.
- **Linked Devices (QR Code Flow)**: Web socket pairing logic allowing users to scan a QR code from the VIBEZ Android app to authenticate web sessions safely.

### Module B: Real-Time Chat & Group Messaging
- **Dual Pane Layout**: Left sidebar for active conversations, search, communities, and status; right main pane for active chat thread.
- **Socket Events Integration**:
  - `join_chat`, `leave_chat`
  - `send_message`, `receive_message`
  - `typing_start`, `typing_stop`
  - `message_delivered`, `message_read`
- **Rich Media & Attachments**: File uploader with image, audio, document, and location previews.
- **E2E Encryption**: Client-side AES-GCM / Signal Protocol encryption layer.

### Module C: Communities & Official Badges
- **Community Feeds**: Tabular layout for community channels, announcements, and comments.
- **VIBEZ Pro Verified Badges**: Render green verified checkmark badges for Pro subscribers, official communities, and verified groups.
- **Admin Management**: Toggle community comments, reaction permissions, and assign community moderators.

### Module D: Status Stories & Audio/Video Calling
- **Status Viewer**: Fullscreen carousel viewer for text/image/video statuses with reply capabilities.
- **WebRTC Calls**: P2P voice and video calls powered by WebRTC signaling via Socket.IO.

---

## 5. Target Folder Structure (`/desktop`)

When implementation begins, the source code inside `/desktop` will follow this layout:

```
/desktop
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── api/             # Axios/Fetch client & REST handlers
│   ├── components/      # UI components (ChatList, ChatThread, StatusList, VerifiedBadge)
│   ├── hooks/           # Custom React hooks (useSocket, useAuth, useE2EE)
│   ├── layouts/         # Primary responsive desktop grid & sidebar layout
│   ├── services/        # Socket.IO client singleton & WebRTC peer service
│   ├── store/           # Zustand stores (useChatStore, useAuthStore, useUserStore)
│   ├── types/           # TypeScript interfaces matching Prisma & DTO schemas
│   ├── App.tsx          # Main entry route & view provider
│   └── main.tsx         # DOM root mounting
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 6. Integration API Endpoints Summary

| Feature | Endpoint | Method |
| :--- | :--- | :--- |
| **User Profile** | `/api/users/profile` | `GET` / `PUT` |
| **Fetch Chats** | `/api/chats` | `GET` |
| **Send Message** | `/api/messages` | `POST` |
| **Communities** | `/api/communities` | `GET` / `POST` |
| **Verify Group Perk**| `/api/chats/:id/verify-perk` | `POST` |
| **Verify Community Perk**| `/api/communities/:id/verify-perk` | `POST` |
| **Status Feed** | `/api/statuses` | `GET` / `POST` |

---

## 7. Execution Readiness

1. **Backend Alignment**: The existing VIBEZ backend requires zero architectural changes, as all API endpoints and Socket.IO handlers are fully decoupled and multi-client ready.
2. **Phase 1 Implementation**: Initialize Vite + React project inside `/desktop` and construct authentication & chat thread components.
