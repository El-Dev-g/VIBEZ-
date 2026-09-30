# VIBEZ Native iOS App (SwiftUI) & Cloud CI/CD Plan

## 1. Overview & Architecture
We will build a complete, native **SwiftUI iOS application** inside the `/ios` directory (`ios/VibezApp`), connected directly to your existing VIBEZ backend (`https://vibez-n5h1.onrender.com`) via REST and Socket.IO, along with automated **GitHub Actions** and **Codemagic** cloud build pipelines so you can compile, sign, and deploy `.ipa` builds to TestFlight/App Store Connect without needing a local Mac.

### Core Stack
- **UI Framework:** SwiftUI (iOS 16+ NavigationStack, TabView, PhotosPicker, Transferable)
- **State & Persistence:** `@MainActor ObservableObject` (`VibezStore`) with local JSON/SQLite offline cache + `UserDefaults` (`AuthManager`)
- **Networking & Real-Time:** `URLSession` (`async/await`) + Socket.IO real-time client (`SocketManagerService`) for instant messages, typing indicators, read receipts, and WebRTC signaling
- **Project Generation:** `project.yml` (XcodeGen specification) + Swift Package Manager (`Package.swift`) so Cloud CI runners generate a clean, reproducible `.xcodeproj` automatically on macOS runners.

---

## 2. Feature Modules in `/ios`

### A. Authentication & Identity Setup (`Views/Auth/`)
- **Phone & Google Sign-In (`AuthView.swift`):** Supports phone authentication (`/api/auth/phone`), Google authentication (`/api/auth/google`), and profile completion (`PhoneIdentitySetupView.swift`) with avatar selection and automatic JPEG Base64 / R2 presigned upload.

### B. Real-Time Chats, Media Sharing & Profiles (`Views/Chats/` & `Views/Profile/`)
- **Chats List (`ChatsListView.swift`):** Searchable list of 1-on-1 chats, groups, and official broadcast channels with unread badges, pinned/muted states, online indicators, and verified badges (`VerifiedBadgeView.swift`).
- **Chat Detail (`ChatDetailView.swift`):**
  - Real-time messaging over Socket.IO (`join_chat`, `send_message`, `receive_message`, `typing`).
  - Photo/Media sharing (`PhotosPicker`), voice notes recording (`AVAudioRecorder`), location sharing (`CoreLocation`), and fullscreen pinch-to-zoom media viewer (`MediaViewerView.swift`).
  - Custom chat wallpapers and swipe-to-reply message bubbles.
- **User & Group Profiles (`UserProfileView.swift` & `ContactInfoView.swift`):**
  - Dedicated read-only contact profile screen showing real user avatar, name, phone number, verified badge, and About status.
  - Current user profile editor with camera/photo library picker, name/about editing, QR code generator, and Verification Badge checkout.

### C. Status Updates & Stories Viewer (`Views/Status/`)
- **Updates Tab (`UpdatesView.swift`):** Displays "My Status" and recent contact status rings.
- **Status Creator & Fullscreen Story Viewer (`StatusViewerView.swift`):** Segmented progress bars, text statuses with custom background colors, photo stories, view count tracking, and direct status replies.

### D. Communities & Official Broadcast Channels (`Views/Communities/`)
- **Communities Tab (`CommunitiesView.swift` & `CommunityInfoView.swift`):** Browse, create, and join communities, view linked announcement/group channels, and post to official broadcast channels.

### E. WebRTC Voice & Video Calling (`Views/Calls/` & `Services/CallSignalingService.swift`)
- **Calls Tab (`CallsListView.swift`):** Call history log synced with `/api/calls` (incoming, outgoing, missed).
- **Active Call Screen (`ActiveCallView.swift`):** Full WebRTC signaling integration (`call_offer`, `call_answer`, `ice_candidate`, `end_call`) with local camera preview (`AVCaptureSession`), mute/speaker controls, and incoming call banner overlay.

---

## 3. Cloud CI/CD Workflows (Build Without a Mac)
- **XcodeGen Configuration (`ios/project.yml`):** Defines the `Vibez` iOS app target, bundle identifier (`com.aistudio.vibez.ios`), Info.plist permissions (`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSContactsUsageDescription`, `NSLocationWhenInUseUsageDescription`), and Swift Package dependencies (`SocketIO`, `WebRTC`).
- **GitHub Actions (`.github/workflows/ios-build.yml`):** Runs on `macos-14` with Xcode 15+, installs `xcodegen`, generates `Vibez.xcodeproj`, builds the unsigned simulator/device `.ipa` artifact on every push, and supports optional App Store Connect API Key signing for TestFlight upload.
- **Codemagic (`codemagic.yaml`):** Ready-to-use root configuration for one-click iOS code signing and TestFlight publishing in Codemagic.
