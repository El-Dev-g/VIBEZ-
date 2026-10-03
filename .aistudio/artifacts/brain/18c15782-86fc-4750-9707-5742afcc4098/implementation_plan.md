# Fix Video Status Playback & Server Video Streaming

Resolve video status playback failures across both the pre-posting preview in camera capture and the full-screen status viewer after posting, implementing persistent local media caching, real-time video progress synchronization, and custom server video storage with HTTP range streaming.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following architectural and UX requirements:

- **Playback Scope**: Fix video playback in **both** the camera preview screen (`VideoPreviewScreen` before posting) and in the status viewer screen (`StatusViewerScreen` after posting).
- **Progress Behavior**: Synchronize the status progress bar directly with the actual video duration and playback position (`exoPlayer.currentPosition / exoPlayer.duration`), advancing automatically when the video finishes.
- **Server Media Handling**: Implement local server file storage in an `uploads/` directory with a dedicated HTTP video streaming endpoint supporting `Range` headers for ExoPlayer buffering and seeking.
- **Client-Server Parity**: Update both the Android client and the custom Node.js/Express server in tandem to ensure end-to-end media persistence.

---

## 1. Overview & Core Concept

- **What It Does**: Enables seamless, high-fidelity video status capture, preview, upload, and playback in Vibez. Users can record a video or pick one from the gallery, immediately watch the video looping with audio in the preview screen, post it to their status, and have viewers watch the video with an accurate progress bar that stays in sync with playback.
- **The Problem It Solves**:
  1. *Preview Screen Failure*: When recording or selecting a video in `FullCameraExperienceScreen`, the preview only displayed a static `PlayArrow` icon over a dark box without playing the video.
  2. *Viewer Screen Failure*: When viewing a video status in `StatusViewerScreen`, ExoPlayer instances were shared across pager items without active player-view attachment, temporary content URIs lost permissions after closing the camera, and playback errors caused an infinite frozen black screen while the timer desynchronized.
  3. *Storage & Streaming Failure*: Because Cloudflare R2 was unconfigured in local environments, video uploads failed silently, and the server lacked a dedicated file upload and static streaming route.
- **Target Persona**: Users sharing moments via short video clips who expect instant video preview, snappy playback, and reliable cross-device streaming.

---

## 2. User Experience & Visual Design

### 2.1 Video Preview Screen (Before Posting)
- **Interactive Player**: When recording completes or a video is picked, `VideoPreviewScreen` replaces the static placeholder icon with an active, auto-playing, looping `PlayerView`.
- **Playback Controls**:
  - Center tap toggles Play/Pause with an animated translucent play/pause icon badge.
  - Audio mute/unmute toggle in the top bar.
  - Bottom trimmer and caption input remain responsive and overlay smoothly on the video.
- **Reliable Storage**: Selected gallery videos and camera recordings are immediately copied into the app's persistent internal status directory (`context.filesDir/status_media/`), ensuring file URIs remain valid indefinitely.

### 2.2 Status Viewer Screen (After Posting)
- **Accurate Progress Synchronization**:
  - For `VIDEO` status items, the progress bar tracks `currentPosition / duration` updated at 50ms intervals while playing.
  - Pausing (holding finger down) pauses both ExoPlayer and the progress bar.
  - Releasing resumes video playback and progress.
  - Upon reaching video end (`Player.STATE_ENDED`), the progress bar completes and smoothly transitions to the next status or dismisses.
- **ExoPlayer Lifecycle & Pager Isolation**:
  - Each `StatusPageItem` properly attaches and detaches `PlayerView.player` when it becomes the active page in `HorizontalPager`, eliminating surface detachment conflicts.
  - Audio focus is managed cleanly; background music preview does not conflict with status video audio.
- **Error Recovery State**:
  - If a video fails to decode or load (e.g. network failure), a graceful fallback overlay appears with a retry action and an indicator rather than an indefinite black screen.

---

## 3. Key Product Decisions & Trade-Offs

- **Local Server Streaming vs. Third-Party Cloud**:
  - *Chosen Approach*: Implement a direct server-side storage system saving uploaded media to `server/uploads/`, exposed through an Express static route with `acceptRanges: true` and an explicit `/api/media/stream/:filename` streaming route.
  - *Why*: Guarantees instant functionality without requiring external AWS/Cloudflare cloud credentials, while fully supporting ExoPlayer's standard byte-range requests for seeking and fast buffering.
- **Persistent Local Copying on Selection**:
  - *Chosen Approach*: When a video is selected via Android's photo/video picker or recorded via CameraX, the app immediately writes the input stream to internal persistent storage (`filesDir/status_media/`) before posting.
  - *Why*: Android `content://` URIs granted by pickers expire when activities stop. Persisting the file locally guarantees zero permission loss and enables instant offline playback for the author.
- **Real-Time Position Tracking vs. Tween Animation**:
  - *Chosen Approach*: Run a dedicated coroutine checking `exoPlayer.currentPosition` while the video is playing, instead of a blind Compose `tween()` animation.
  - *Why*: Video decoding, buffering delays, and variable frame rates cause blind timers to desynchronize; tracking the player's actual clock provides WhatsApp-grade synchronization.

---

## 4. Technical Architecture & Data Strategy

### Video Processing & Playback Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Camera Capture & Preview                        │
│                                                                        │
│  [CameraX VideoCapture] ──┐                                            │
│                           ├──> Copy to internal filesDir/status_media/ │
│  [Gallery Video Picker] ──┘         │                                  │
│                                     ▼                                  │
│                 [VideoPreviewScreen: ExoPlayer Looping]                │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │ User clicks "Send"
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Upload & Server Persistence                      │
│                                                                        │
│  [WhatsAppRepository.uploadFile]                                       │
│    │                                                                   │
│    ├─► If R2 configured: Presigned R2 PUT                              │
│    └─► Fallback: Direct POST /api/media/upload-direct                  │
│                    │                                                   │
│                    ▼                                                   │
│           [Custom Node.js Server]                                      │
│           - Saves to server/uploads/<uuid>.mp4                         │
│           - Streams via /uploads/<uuid>.mp4 or /api/media/stream/:file │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │ Synchronize Status DTO
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Status Viewer Playback                          │
│                                                                        │
│  [StatusViewerScreen: HorizontalPager]                                 │
│    │                                                                   │
│    ├─► Active Page: Attach PlayerView.player = exoPlayer               │
│    ├─► ExoPlayer streams from remote URL or local filesDir             │
│    ├─► Polls player.currentPosition / player.duration every 50ms       │
│    └─► On Player.STATE_ENDED ──► onTimerFinished() ──► Next Status     │
└────────────────────────────────────────────────────────────────────────┘
```

### Planned File Modifications

#### Server Project
1. **`server/src/index.ts` & `server/src/controllers/StorageController.ts`**:
   - Create and ensure `uploads/` directory on startup.
   - Serve `uploads/` via `express.static` with byte-range support.
   - Implement `POST /api/media/upload-direct` (raw binary or multipart/octet-stream) to store video/audio files directly and return public URLs.
   - Add `GET /api/media/stream/:filename` route supporting `Range` headers (HTTP 206 Partial Content) for ExoPlayer streaming.

#### Android Client Project
2. **`FullCameraExperienceScreen.kt`**:
   - Persist recorded or gallery-picked video into `context.filesDir/status_media/`.
   - Upgrade `VideoPreviewScreen` to use an active `ExoPlayer` inside `AndroidView(PlayerView)` with loop mode and tap-to-pause.
3. **`WhatsAppRepository.kt`**:
   - Update `uploadFile` to send video bytes to `/api/media/upload-direct` when R2 is unavailable.
   - Store local fallback paths so the author can view the video immediately without waiting for server sync.
4. **`StatusViewerScreen.kt`**:
   - Update `StatusPageItem` to properly manage `PlayerView` attachment and detachment.
   - Re-engineer progress bar logic to track `exoPlayer.currentPosition` and advance on `STATE_ENDED`.
   - Add robust error handling with `Player.Listener.onPlayerError`.
5. **Verification**:
   - Compile both server (`npx tsc --noEmit`) and Android client (`compile_applet`).
