import SwiftUI

struct CallsListView: View {
    @EnvironmentObject var store: VibezStore

    var body: some View {
        NavigationStack {
            Group {
                if store.callLogs.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "phone.Wave.2.fill")
                            .font(.system(size: 46))
                            .foregroundStyle(.secondary)
                        Text("No recent calls")
                            .font(.headline)
                        Text("Start an encrypted voice or video call from any chat or contact profile.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 36)
                    }
                } else {
                    List {
                        ForEach(store.callLogs) { log in
                            HStack(spacing: 14) {
                                AvatarView(
                                    name: log.contactName,
                                    avatarUrl: log.contactAvatar,
                                    size: 48
                                )

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(log.contactName)
                                        .font(.headline)
                                        .foregroundStyle(log.isMissed ? .red : .primary)

                                    HStack(spacing: 4) {
                                        Image(systemName: log.isIncoming ? "phone.arrow.down.left" : "phone.arrow.up.right")
                                            .font(.caption2)
                                            .foregroundStyle(log.isMissed ? .red : VibezTheme.emerald)
                                        Text(log.timestamp, style: .relative)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }

                                Spacer()

                                Button {
                                    store.startCall(
                                        contactId: log.contactId,
                                        contactName: log.contactName,
                                        contactAvatar: log.contactAvatar,
                                        isVideo: log.callType == "VIDEO"
                                    )
                                } label: {
                                    Image(systemName: log.callType == "VIDEO" ? "video.fill" : "phone.fill")
                                        .font(.system(size: 18))
                                        .foregroundStyle(VibezTheme.primary)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Calls")
            .refreshable {
                await store.syncCallLogs()
            }
        }
    }
}

// MARK: - Active WebRTC Voice & Video Call Screen

struct ActiveCallOverlayView: View {
    @EnvironmentObject var store: VibezStore
    let session: ActiveCallSession

    @State private var isMuted: Bool = false
    @State private var isSpeakerOn: Bool = true
    @State private var isCameraEnabled: Bool = true

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [VibezTheme.darkSurface, Color.black],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer(minLength: 40)

                HStack(spacing: 6) {
                    Image(systemName: "lock.fill")
                        .font(.caption2)
                    Text("End-to-End Encrypted WebRTC")
                        .font(.caption)
                }
                .foregroundStyle(.white.opacity(0.75))

                AvatarView(
                    name: session.contactName,
                    avatarUrl: session.contactAvatar,
                    size: 132
                )

                Text(session.contactName)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)

                Text(session.statusText)
                    .font(.subheadline)
                    .foregroundStyle(VibezTheme.emerald)

                Spacer()

                // Call Controls
                HStack(spacing: 32) {
                    CallControlCircle(
                        icon: isMuted ? "mic.slash.fill" : "mic.fill",
                        label: isMuted ? "Unmute" : "Mute",
                        background: isMuted ? .white : .white.opacity(0.18),
                        foreground: isMuted ? .black : .white
                    ) {
                        isMuted.toggle()
                    }

                    CallControlCircle(
                        icon: isSpeakerOn ? "speaker.wave.3.fill" : "speaker.fill",
                        label: "Speaker",
                        background: isSpeakerOn ? .white : .white.opacity(0.18),
                        foreground: isSpeakerOn ? .black : .white
                    ) {
                        isSpeakerOn.toggle()
                    }

                    if session.isVideo {
                        CallControlCircle(
                            icon: isCameraEnabled ? "video.fill" : "video.slash.fill",
                            label: "Camera",
                            background: .white.opacity(0.18),
                            foreground: .white
                        ) {
                            isCameraEnabled.toggle()
                        }
                    }

                    if session.isIncoming && session.statusText.contains("Incoming") {
                        CallControlCircle(
                            icon: "phone.fill",
                            label: "Accept",
                            background: VibezTheme.emerald,
                            foreground: .white
                        ) {
                            store.acceptIncomingCall()
                        }
                    }

                    CallControlCircle(
                        icon: "phone.down.fill",
                        label: "End",
                        background: .red,
                        foreground: .white
                    ) {
                        store.endActiveCall()
                    }
                }
                .padding(.bottom, 48)
            }
        }
    }
}

struct CallControlCircle: View {
    let icon: String
    let label: String
    let background: Color
    let foreground: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Circle()
                    .fill(background)
                    .frame(width: 60, height: 60)
                    .overlay {
                        Image(systemName: icon)
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundStyle(foreground)
                    }
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
    }
}
