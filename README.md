# WhatsApp Clone - Android

A high-fidelity WhatsApp clone built with modern Android development practices, focusing on a polished user interface, real-time media experiences, and robust local persistence.

## 🚀 Features

### **Chat & Messaging**
- **Rich Conversations**: Support for text, voice notes, and media messages.
- **Starred Messages**: Save important messages for quick access.
- **Message Reactions**: Structural support for emoji reactions (Database v4).
- **Reply System**: Contextual replies to specific messages.

### **Advanced Status Experience**
- **Full Camera Experience**: Custom CameraX implementation with photo capture and long-press video recording.
- **Apple Music Integration**: Live search and integration of the Apple Music catalog into status updates, including album artwork and track previews.
- **Smart Expiry Timers**: Visual progress bars and countdowns showing exactly when a status will expire (24-hour window), with "Urgency" alerts when less than 1 hour remains.
- **Gallery Support**: Import existing photos and videos directly into your status.

### **Architecture & Data**
- **Local Persistence**: Powered by **Room Database** with a formal migration path (currently v4).
- **MVVM Pattern**: Clean separation of concerns using ViewModels and StateFlow.
- **Responsive UI**: Built entirely with **Jetpack Compose** and Material 3, following edge-to-edge design principles.

## 🛠️ Tech Stack

- **UI**: Jetpack Compose (Material 3)
- **Image Loading**: Coil
- **Navigation**: Compose Navigation (Type-safe)
- **Networking**: Retrofit & Moshi (Apple Music API)
- **Database**: Room
- **Camera**: CameraX
- **Media Playback**: Media3 ExoPlayer
- **Concurrency**: Kotlin Coroutines & Flow

## 🛠️ Getting Started

1. **Environment**: Ensure you are using the latest Android Studio.
2. **Secrets**: This app uses the Apple Music (iTunes Search) API which does not require a key for public searches, but other integrations may require configuration in the **Secrets** panel.
3. **Build**: Run `./gradlew assembleDebug` to build the project.

## 📂 Project Structure

- `app/src/main/java/com/example/ui`: UI layer containing Composables and ViewModels.
- `app/src/main/java/com/example/data`: Data layer containing Room Entities, DAOs, and API Services.
- `app/src/main/java/com/example/ui/theme`: Centralized Material 3 theme configuration.
