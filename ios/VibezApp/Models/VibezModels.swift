import Foundation

// MARK: - User & Auth Models

struct UserDto: Codable, Identifiable, Equatable {
    let id: String
    var phoneNumber: String
    var name: String?
    var avatarUrl: String?
    var about: String?
    var lastSeen: String?
    var isVerified: Bool?
    var verifiedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, phoneNumber, name, avatarUrl, about, lastSeen, isVerified, verifiedAt
    }

    init(
        id: String,
        phoneNumber: String,
        name: String? = nil,
        avatarUrl: String? = nil,
        about: String? = nil,
        lastSeen: String? = "Recently",
        isVerified: Bool? = false,
        verifiedAt: String? = nil
    ) {
        self.id = id
        self.phoneNumber = phoneNumber
        self.name = name
        self.avatarUrl = avatarUrl
        self.about = about
        self.lastSeen = lastSeen
        self.isVerified = isVerified
        self.verifiedAt = verifiedAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = (try? container.decode(String.self, forKey: .id)) ?? UUID().uuidString
        phoneNumber = (try? container.decode(String.self, forKey: .phoneNumber)) ?? ""
        name = try? container.decodeIfPresent(String.self, forKey: .name)
        avatarUrl = try? container.decodeIfPresent(String.self, forKey: .avatarUrl)
        about = try? container.decodeIfPresent(String.self, forKey: .about)
        lastSeen = (try? container.decodeIfPresent(String.self, forKey: .lastSeen)) ?? "Recently"
        isVerified = (try? container.decodeIfPresent(Bool.self, forKey: .isVerified)) ?? false
        verifiedAt = try? container.decodeIfPresent(String.self, forKey: .verifiedAt)
    }
}

struct AuthResponse: Codable {
    let token: String
    let user: UserDto
    let isNewUser: Bool?
    let requiresProfileSetup: Bool?
}

// MARK: - Chat & Message Models

struct ChatMemberDto: Codable, Equatable {
    let id: String?
    let userId: String
    let chatId: String?
    let role: String?
    let user: UserDto
}

struct MessageDto: Codable, Identifiable, Equatable {
    let id: String
    var content: String
    var type: String
    var status: String
    var mediaUrl: String?
    var duration: Int?
    var isStarred: Bool?
    var senderId: String
    var receiverId: String?
    var chatId: String
    var createdAt: String?
    var sender: UserDto?
}

struct ChatDto: Codable, Identifiable, Equatable {
    let id: String
    var name: String?
    var isGroup: Bool
    var isMuted: Bool?
    var wallpaper: String?
    var isOfficial: Bool?
    var isVerified: Bool?
    var allowComments: Bool?
    var members: [ChatMemberDto]?
    var messages: [MessageDto]?
}

struct ChatItem: Codable, Identifiable, Equatable {
    let id: String
    var remoteId: String
    var contactId: String
    var contactName: String
    var contactAvatar: String
    var lastMessage: String
    var lastMessageTime: Date
    var unreadCount: Int
    var isGroup: Bool
    var isMuted: Bool
    var isPinned: Bool
    var customWallpaper: String?
    var isOfficial: Bool
    var isVerified: Bool
    var allowComments: Bool

    var isChannel: Bool {
        isGroup && isOfficial
    }
}

struct MessageItem: Codable, Identifiable, Equatable {
    let id: String
    var chatId: String
    var senderId: String
    var content: String
    var timestamp: Date
    var status: String
    var isStarred: Bool
    var messageType: String
    var mediaUrl: String
    var voiceDurationSeconds: Int
    var replyToMessageId: String?
}

struct ContactItem: Codable, Identifiable, Equatable {
    let id: String
    var remoteId: String
    var name: String
    var phoneNumber: String
    var avatarUrl: String
    var aboutStatus: String
    var isOnline: Bool
    var lastSeen: String
    var isVerified: Bool
}

// MARK: - Status & Story Models

struct StatusViewerDto: Codable, Equatable {
    let id: String?
    let statusId: String?
    let userId: String
    let viewedAt: String?
    let user: UserDto?
}

struct StatusDto: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    var content: String?
    var mediaUrl: String?
    var type: String
    var backgroundColor: String?
    var textStyle: String?
    var createdAt: String?
    var expiresAt: String?
    var user: UserDto?
    var viewers: [StatusViewerDto]?
}

struct StatusItem: Codable, Identifiable, Equatable {
    let id: String
    var contactId: String
    var contactName: String
    var contactAvatar: String
    var mediaType: String // "TEXT" or "IMAGE"
    var mediaUrl: String
    var textCaption: String
    var backgroundColorHex: String
    var timestamp: Date
    var isViewed: Bool
    var isMyStatus: Bool
    var viewCount: Int
}

// MARK: - Community Models

struct CommunityDto: Codable, Identifiable, Equatable {
    let id: String
    var name: String
    var description: String?
    var avatarUrl: String?
    var ownerId: String?
    var isOfficial: Bool?
    var allowComments: Bool?
    var allowReactions: Bool?
    var createdAt: String?
    var membersCount: Int?
}

// MARK: - Call Models

struct CallLogDto: Codable, Identifiable, Equatable {
    let id: String
    let callerId: String
    let receiverId: String
    let type: String // "VOICE" or "VIDEO"
    let status: String // "MISSED", "COMPLETED", "REJECTED"
    let duration: Int?
    let createdAt: String?
    let caller: UserDto?
    let receiver: UserDto?
}

struct CallLogItem: Codable, Identifiable, Equatable {
    let id: String
    var contactId: String
    var contactName: String
    var contactAvatar: String
    var timestamp: Date
    var callType: String
    var isIncoming: Bool
    var isMissed: Bool
}

struct ActiveCallSession: Identifiable, Equatable {
    let id: String = UUID().uuidString
    let contactId: String
    let contactName: String
    let contactAvatar: String
    let isVideo: Bool
    let isIncoming: Bool
    var statusText: String
    var remoteSdp: String?
}

// MARK: - Upload, Badge & System Models

struct PresignedUploadResponse: Codable {
    let uploadUrl: String
    let fileKey: String
    let publicUrl: String
}

struct BadgeStatusResponse: Codable, Equatable {
    var isVerified: Bool
    var verifiedAt: String?
    var badgePrice: Double?
    var price: String?
}

struct PaymentProviderDto: Codable, Identifiable, Equatable {
    var id: String { provider }
    let provider: String
    let displayName: String
    let isEnabled: Bool
    let publicKey: String?
    let supportedCurrencies: String?
}

struct CreatePaymentResponse: Codable {
    let success: Bool
    let transactionId: String?
    let status: String?
    let message: String?
}

struct SystemStatusResponse: Codable {
    let status: String
    let maintenanceMode: Bool
    let badgePrice: Double?
    let appVersion: String?
    let appName: String?
}

// MARK: - Poll & Sticker Models

struct PollOption: Codable, Identifiable, Equatable {
    var id: Int { index }
    let index: Int
    let text: String
    var voterIds: [String]
}

struct PollData: Codable, Identifiable, Equatable {
    let id: String
    let question: String
    var options: [PollOption]
    let allowMultiple: Bool
    let creatorId: String

    var totalVotes: Int {
        options.reduce(0) { $0 + $1.voterIds.count }
    }

    func percentageFor(optionIndex: Int) -> Double {
        let total = totalVotes
        guard total > 0, let opt = options.first(where: { $0.index == optionIndex }) else { return 0.0 }
        return Double(opt.voterIds.count) / Double(total)
    }

    func isOptionSelectedBy(optionIndex: Int, userId: String) -> Bool {
        options.first(where: { $0.index == optionIndex })?.voterIds.contains(userId) == true
    }
}

struct StickerItem: Identifiable, Equatable {
    let id: String
    let emoji: String
    let label: String
    let category: String
}

// MARK: - Group Call Models

struct GroupCallParticipant: Identifiable, Equatable {
    let id: String
    let name: String
    var avatarUrl: String = ""
    var isMuted: Bool = false
    var isVideoOn: Bool = true
    var isSpeaking: Bool = false
}

struct GroupCallState: Identifiable, Equatable {
    let id: String = UUID().uuidString
    let chatId: String
    let callTitle: String
    let isVideo: Bool
    var isMuted: Bool = false
    var isCameraOn: Bool = true
    var isScreenSharing: Bool = false
    var participants: [GroupCallParticipant] = []
    var floatingReactions: [String] = []
}
