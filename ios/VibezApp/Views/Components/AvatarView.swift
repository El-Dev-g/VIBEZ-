import SwiftUI
import UIKit

// MARK: - Theme Colors

enum VibezTheme {
    static let primary = Color(red: 0.047, green: 0.549, blue: 0.494)   // #0C8C7E
    static let emerald = Color(red: 0.145, green: 0.827, blue: 0.400)   // #25D366
    static let darkSurface = Color(red: 0.067, green: 0.106, blue: 0.129)
    static let sentBubble = Color(red: 0.851, green: 0.992, blue: 0.827)
    static let sentBubbleDark = Color(red: 0.0, green: 0.361, blue: 0.294)
}

// MARK: - Universal Smart Image View (Supports HTTP/HTTPS, Base64 Data URIs, and Local Files)

struct SmartImageView: View {
    let urlOrDataUri: String
    var contentMode: ContentMode = .fill

    var body: some View {
        let trimmed = urlOrDataUri.trimmingCharacters(in: .whitespacesAndNewlines)
        if let uiImage = decodeDataUriOrLocalFile(trimmed) {
            Image(uiImage: uiImage)
                .resizable()
                .aspectRatio(contentMode: contentMode)
        } else if let url = URL(string: trimmed),
                  (trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://")),
                  !trimmed.contains("undefined") {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: contentMode)
                case .failure, .empty:
                    Color.gray.opacity(0.18)
                @unknown default:
                    Color.gray.opacity(0.18)
                }
            }
        } else {
            Color.gray.opacity(0.18)
        }
    }

    private func decodeDataUriOrLocalFile(_ raw: String) -> UIImage? {
        guard !raw.isEmpty else { return nil }
        if raw.lowercased().hasPrefix("data:image"),
           let commaIdx = raw.firstIndex(of: ",") {
            let base64Part = String(raw[raw.index(after: commaIdx)...])
            if let data = Data(base64Encoded: base64Part, options: .ignoreUnknownCharacters) {
                return UIImage(data: data)
            }
        }
        if raw.hasPrefix("/"), FileManager.default.fileExists(atPath: raw) {
            return UIImage(contentsOfFile: raw)
        }
        return nil
    }
}

// MARK: - Green Verification Checkmark Badge

struct VerifiedBadgeView: View {
    var size: CGFloat = 18

    var body: some View {
        Image(systemName: "checkmark.seal.fill")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .foregroundStyle(VibezTheme.emerald)
            .accessibilityLabel("Verified Official Account")
    }
}

// MARK: - Universal Avatar View

struct AvatarView: View {
    let name: String
    var avatarUrl: String = ""
    var isOnline: Bool = false
    var isGroup: Bool = false
    var isOfficial: Bool = false
    var isVerified: Bool = false
    var hasStatusRing: Bool = false
    var size: CGFloat = 50

    private var hasValidImage: Bool {
        let trimmed = avatarUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        return !trimmed.isEmpty && !trimmed.hasPrefix("undefined") && !trimmed.hasPrefix("null")
    }

    private var initials: String {
        let cleaned = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty,
              cleaned.lowercased() != "contact",
              cleaned.lowercased() != "unknown" else {
            return ""
        }
        let parts = cleaned.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return String(cleaned.prefix(1)).uppercased()
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ZStack {
                if hasStatusRing {
                    Circle()
                        .stroke(VibezTheme.emerald, lineWidth: 2.5)
                        .frame(width: size, height: size)
                }

                let innerSize = hasStatusRing ? size - 7 : size

                if hasValidImage {
                    SmartImageView(urlOrDataUri: avatarUrl, contentMode: .fill)
                        .frame(width: innerSize, height: innerSize)
                        .clipShape(Circle())
                } else {
                    Circle()
                        .fill(VibezTheme.primary.opacity(0.16))
                        .frame(width: innerSize, height: innerSize)
                        .overlay {
                            if isGroup && isOfficial {
                                Image(systemName: "megaphone.fill")
                                    .font(.system(size: innerSize * 0.44, weight: .semibold))
                                    .foregroundStyle(VibezTheme.primary)
                            } else if isGroup {
                                Image(systemName: "person.3.fill")
                                    .font(.system(size: innerSize * 0.40, weight: .semibold))
                                    .foregroundStyle(VibezTheme.primary)
                            } else if !initials.isEmpty {
                                Text(initials)
                                    .font(.system(size: innerSize * 0.38, weight: .bold))
                                    .foregroundStyle(VibezTheme.primary)
                            } else {
                                Image(systemName: "person.fill")
                                    .font(.system(size: innerSize * 0.45, weight: .semibold))
                                    .foregroundStyle(VibezTheme.primary)
                            }
                        }
                }
            }

            if isOnline && !isGroup {
                Circle()
                    .fill(VibezTheme.emerald)
                    .frame(width: size * 0.26, height: size * 0.26)
                    .overlay(Circle().stroke(Color(.systemBackground), lineWidth: 1.5))
            } else if isVerified && !isGroup {
                VerifiedBadgeView(size: size * 0.32)
                    .background(Circle().fill(Color(.systemBackground)))
            }
        }
        .frame(width: size, height: size)
    }
}
