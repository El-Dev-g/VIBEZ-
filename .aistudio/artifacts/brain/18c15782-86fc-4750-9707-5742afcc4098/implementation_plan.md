# Implementation Plan - Decoupling Groups, Channels, and One-on-One Chats

Decoupling the monolithic Chat system into three separate, dedicated database entities and visual streams: **One-on-One Chats**, **Groups**, and **Channels**.

> [!NOTE]
> Following your decision to represent these features as **separate database tables**, this plan details the schema redesign, repository refactoring, and UI isolation to cleanly segregate these scopes.

---

## 1. Overview & Core Concept

Currently, Groups and Channels are overloaded inside the monolithic `ChatEntity` table using a series of boolean flags (`isGroup` and `isOfficial`). This plan establishes full database-level and UI-level isolation:

- **One-on-One Chats**: Strictly private conversations between two users (`chats` table / `ChatEntity`).
- **Groups**: Collaborative multi-way group chats (`groups` table / `GroupEntity`).
- **Channels**: Broadcast-only announcement feeds (`channels` table / `ChannelEntity`).

---

## 2. User Experience & Visual Design

### Key User Flows

- **Main Navigation & Tabs**: The main screen will display segregated sections or tabs for **Chats**, **Groups**, and **Channels** so that group creations or channel broadcasts never clutter 1-on-1 private conversations.
- **Dedicated List Views**:
  - **Chats Feed**: Lists only private, individual contacts.
  - **Groups Feed**: Lists only group discussions with quick actions to create a new group.
  - **Channels Feed**: Lists only verified broadcast/official campaign feeds with options to discover channels.

---

## 3. Database Schema Redesign (Room Integration)

We will introduce three separate tables in `WhatsAppDatabase.kt` to split data concerns cleanly.

### Fenced Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       WhatsAppDatabase                      │
│                                                             │
│   ┌──────────────────┐ ┌──────────────────┐ ┌───────────┐   │
│   │    ChatEntity    │ │   GroupEntity    │ │ChannelEnt │   │
│   │  (1-on-1 Chats)  │ │  (Group Chats)   │ │(Channels) │   │
│   └────────┬─────────┘ └────────┬─────────┘ └─────┬─────┘   │
└────────────┼────────────────────┼─────────────────┼─────────┘
             ▼                    ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                         WhatsAppDao                         │
│   - getDirectChats()   - getGroupChats()  - getChannels()   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      WhatsAppRepository                     │
│   Combines, saves, and exposes individual domain streams    │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      WhatsAppViewModel                      │
│ - directChats: Flow  - groupChats: Flow  - channels: Flow    │
└─────────────────────────────────────────────────────────────┘
```

### Table Definitions

1. **`chats` Table (`ChatEntity`)**:
   - Removes `isGroup` and `isOfficial`.
   - Represents only direct 1-on-1 conversations with individual contacts.
2. **`groups` Table (`GroupEntity` - NEW)**:
   - `@Entity(tableName = "groups")`
   - Fields: `id` (PrimaryKey), `name`, `avatarUrl`, `memberIds`, `lastMessage`, `lastMessageTime`, `createdBy`.
3. **`channels` Table (`ChannelEntity` - NEW)**:
   - `@Entity(tableName = "channels")`
   - Fields: `id` (PrimaryKey), `name`, `avatarUrl`, `lastMessage`, `lastMessageTime`, `subscriberCount`, `isVerified`, `isOfficial`.

---

## 4. Repository & ViewModel Strategy

- **DAO Queries**:
  - `fun getDirectChats(): Flow<List<ChatEntity>>`
  - `fun getGroupChats(): Flow<List<GroupEntity>>`
  - `fun getChannels(): Flow<List<ChannelEntity>>`
- **Exposing Reactive Streams**:
  - The `WhatsAppViewModel` will collect these flows separately and expose them as isolated states (`directChats`, `groupChats`, `channels`) for highly responsive, lag-free UI updates.
- **Decoupled APIs**:
  - `createGroupChat` will explicitly insert into the `GroupEntity` / `groups` table.
  - Channels discovery and subscriptions will operate strictly on the `ChannelEntity` / `channels` table.
