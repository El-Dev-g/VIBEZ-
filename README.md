# VIBEZ - Android

A high-fidelity communication application built with modern Android development practices, focusing on a polished user interface, real-time media experiences, and robust local persistence.

## 🚀 Features

### **Authentication & Identity**
- **Firebase Phone Number Auth**: Real-time SMS OTP verification with auto-retrieval and fallback simulation.
- **Google Sign-In**: Seamless authentication with Google Credential Manager.
- **Verified Badge System**: Verified profile status badges with server validation.
- **Secure Phone Migration**: Authenticated multi-step phone number change with code challenges.

### **Chat & Messaging**
- **Rich Conversations**: Support for text, voice notes, and media messages.
- **Starred Messages**: Save important messages for quick access.
- **Message Reactions**: Structural support for emoji reactions.
- **Reply System**: Contextual replies to specific messages.

### **Advanced Status Experience**
- **Full Camera Experience**: Custom camera implementation with photo capture and long-press video recording.
- **Music Integration**: Live search and integration of a music catalog into status updates, including album artwork and track previews.
- **Smart Expiry Timers**: Visual progress bars and countdowns showing exactly when a status will expire (24-hour window), with "Urgency" alerts when less than 1 hour remains.
- **Gallery Support**: Import existing photos and videos directly into your status.

### **Architecture & Data**
- **Local Persistence**: Powered by a local database with a formal migration path.
- **MVVM Pattern**: Clean separation of concerns using ViewModels and StateFlow.
- **Responsive UI**: Built entirely with Jetpack Compose and Material 3, following edge-to-edge design principles.

---

## ☁️ Server Environment Variables (Render / Cloud Deployment)

All backend variables are configured directly in your **Render Web Service Dashboard** (`Environment` tab):

### 1. Backend Core Variables (`/server`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/vibez_db?sslmode=require` |
| `JWT_SECRET` | Secret key for signing backend session JWTs | `your-strong-production-jwt-secret` |
| `PORT` | Server listening port | `10000` (or `3000`) |
| `GOOGLE_CLIENT_ID` | OAuth Web Client ID for validating Google tokens | `31813758410-qtfe29f8ufi980db5a8qpeehl5cvntls.apps.googleusercontent.com` |
| `ADMIN_FRONTEND_URL` | Explicit origin of the admin panel for CORS protection | `https://your-admin-service.onrender.com` |
| `FRONTEND_URL` | Explicit origin of the web client for CORS protection | `https://your-client-app.onrender.com` |
| `ADMIN_EMAIL` | Initial master administrator email used for seeding | `admin@vibez.com` |
| `ADMIN_PASSWORD` | Initial master administrator password used for seeding | `your-secure-admin-password` |

### 2. Next.js Admin Variables (`/admin`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Production URL pointing to your deployed backend API | `https://vibez-n5h1.onrender.com/api` |

### 3. Cloudflare R2 Media Storage *(Optional)*
| Variable | Description |
| :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account Identifier |
| `CLOUDFLARE_R2_BUCKET_NAME` | R2 Bucket Name for uploaded media & voice notes |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 Access Key ID |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 Secret Access Key |
| `CLOUDFLARE_R2_PUBLIC_DOMAIN` | Custom public CDN/domain URL (e.g. `https://media.yourdomain.com`) |

### 3. Firebase Admin SDK *(Optional for backend token verification)*
| Variable / Secret File | Description |
| :--- | :--- |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Secret File (e.g. `/etc/secrets/serviceAccountKey.json`) |

---

## 🛠️ Tech Stack

- **UI**: Jetpack Compose (Material 3)
- **Image Loading**: Modern image loading libraries
- **Navigation**: Type-safe navigation
- **Database**: Local SQLite-based storage + PostgreSQL Backend
- **Concurrency**: Kotlin Coroutines & Flow

## 🛠️ Getting Started

1. **Environment**: Ensure you are using the latest Android Studio.
2. **Build**: Run `./gradlew assembleDebug` to build the project.

## 📂 Project Structure

- `admin/`: Next.js Admin Portal. See the [Deployment Guide](DEPLOYMENT.md) for hosting instructions.
- `server/`: Node.js Backend API. See the [Deployment Guide](DEPLOYMENT.md) for hosting instructions.
- `app/src/main/java/com/example/ui`: UI layer containing Composables and ViewModels.
- `app/src/main/java/com/example/data`: Data layer containing local persistence and API Services.
- `app/src/main/java/com/example/ui/theme`: Centralized Material 3 theme configuration.
