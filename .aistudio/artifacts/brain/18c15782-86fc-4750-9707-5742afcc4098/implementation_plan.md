# Fix Status Posting Duplication & "Unknown" Poster Name Bug

Plan to fix status posting issues where newly posted status updates appear as duplicate entries and display "Unknown" as the status poster name.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The root cause was identified across both backend server response formatting and client-side status mapping:
> 1. **Missing User Data in Server Response**: `prisma.status.create` in `StatusController.ts` returned status objects without including the `user` relation (`dto.user` was `null`), causing clients to default the poster name to `"Unknown"`.
> 2. **Unauthenticated ID Check on Client Insert**: `WhatsAppRepository.postStatus` passed `null` as `currentUserId` when mapping the API response DTO into `StatusEntity`. This evaluated `isMyStatus` to `false`, causing local Room DB to render the user's own status under contact updates as "Unknown" before later syncing into "My Status" (producing a duplicate item).

- **Confirmed Fix Strategy 1 (Server Side)**: Update `StatusController.ts` in `server/src/controllers/StatusController.ts` so `prisma.status.create` includes `{ user: true, views: { include: { user: true } } }`.
- **Confirmed Fix Strategy 2 (Android Client)**: Pass the active `currentUserId` in `postStatus` and `mapStatusDtoToEntity`, falling back to `AuthManager` user name and avatar whenever `isMyStatus` is `true`.
- **Confirmed Fix Strategy 3 (iOS Client)**: Update `VibezStore.swift` status mapping to fallback to `currentUserName` whenever `isMyStatus` is `true`.

---

## 1. Overview & Core Concept

- **What It Fixes**:
  - Eliminates status duplication in the Updates/Status tab immediately upon posting.
  - Ensures newly posted status updates display the user's actual display name and avatar instead of "Unknown".

---

## 2. User Experience & Visual Design

### Key User Flow

```
  ┌───────────────────────────┐
  │ CreateStatusScreen        │
  │ (User posts text/photo)   │
  └─────────────┬─────────────┘
                │
                ▼
  ┌───────────────────────────┐
  │ Server: createStatus      │
  │ (Includes user relation)  │
  └─────────────┬─────────────┘
                │
                ▼
  ┌───────────────────────────┐
  │ Repository: postStatus    │
  │ (isMyStatus = true, name) │
  └─────────────┬─────────────┘
                │
                ▼
  ┌───────────────────────────┐
  │ StatusListScreen          │
  │ (Single entry in "My      │
  │  Status" with real name)  │
  └───────────────────────────┘
```

---

## 3. Technical Architecture & Component Changes

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Server: StatusController.ts                                               │
│ • prisma.status.create({ include: { user: true, views: ... } })           │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Android Repository: WhatsAppRepository.kt                                 │
│ • postStatus: pass currentUserId                                          │
│ • mapStatusDtoToEntity: fallback contactName to AuthManager.getUserName() │
│   when isMyStatus == true                                                 │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ iOS Store: VibezStore.swift                                               │
│ • syncStatuses: fallback contactName to currentUserName when isMyStatus   │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation Sequence

1. **Server (`server/src/controllers/StatusController.ts`)**:
   - Update `createStatus` to include `user: true` and `views: { include: { user: true } }` in the Prisma query response.
2. **Android (`app/src/main/java/com/example/data/WhatsAppRepository.kt`)**:
   - Update `postStatus` to fetch `currentUserId` from `AuthManager` and pass it to `mapStatusDtoToEntity`.
   - Update `mapStatusDtoToEntity` so `contactName` falls back to `AuthManager` user name if `dto.user?.name` is missing and `isMyStatus` is `true`.
3. **iOS (`ios/VibezApp/Store/VibezStore.swift`)**:
   - Fall back `contactName` to `currentUserName` when `isMyStatus` is true.
4. **Verification**:
   - Compile Android app via `compile_applet` and verify clean build.

