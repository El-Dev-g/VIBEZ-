# VIBEZ Native iOS App (`SwiftUI`)

This directory contains the complete **native SwiftUI iOS client** for **VIBEZ**, connected to the same Node.js + Express + Prisma + Socket.IO backend (`https://vibez-n5h1.onrender.com`) as the Android application.

## Directory Structure
- `project.yml` — **XcodeGen** project specification that generates `Vibez.xcodeproj`.
- `Package.swift` — Swift Package Manager manifest.
- `VibezApp/VibezApp.swift` — `@main` App entry point, maintenance gate, and 5-tab navigation (`Chats`, `Updates`, `Communities`, `Calls`, `Settings`).
- `VibezApp/Models/VibezModels.swift` — Codable DTOs and local persistence models.
- `VibezApp/Services/ApiClient.swift` — Async/await REST client + Cloudflare R2 presigned upload with automatic JPEG Base64 data URI fallback.
- `VibezApp/Services/SocketService.swift` — Native Socket.IO v4 / Engine.IO v4 WebSocket client (`URLSessionWebSocketTask`) for real-time messaging, typing indicators, and WebRTC signaling.
- `VibezApp/Store/VibezStore.swift` — `@MainActor ObservableObject` managing session state, local JSON offline cache, chats, messages, contacts, statuses, communities, and calls.
- `VibezApp/Views/` — SwiftUI views for Authentication, Chats, Chat Detail, Media Viewer, User/Group Profiles, Status Stories, Communities, Calls, QR Codes, and Verification Badge Checkout.

---

## How to Build the iOS App

### 1. Cloud CI via GitHub Actions (No Mac Needed)
1. Push this repository to GitHub (using the **Export to GitHub** option in AI Studio Settings).
2. Open your GitHub repository -> **Actions** tab -> select **Build VIBEZ iOS App (.ipa)** -> click **Run workflow**.
3. Once completed, download the **`Vibez-iOS-Build`** artifact containing `Vibez-unsigned.ipa` and `Vibez.xcodeproj`.

### 2. Cloud CI & TestFlight Signing via Codemagic (No Mac Needed)
1. Connect your GitHub repository to [Codemagic](https://codemagic.io).
2. Codemagic automatically detects `codemagic.yaml` in the root directory.
3. Connect your Apple Developer Account under **Team Settings -> Integrations -> App Store Connect** to automatically sign the `.ipa` and publish directly to **TestFlight**.

### 3. Local Build on macOS with Xcode
```bash
cd ios
brew install xcodegen
xcodegen generate
open Vibez.xcodeproj
```
Select your iPhone or iOS Simulator target in Xcode and press **Cmd + R** to run.
