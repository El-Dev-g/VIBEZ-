import Foundation
import SwiftUI

@MainActor
final class VibezStore: ObservableObject {
    // MARK: - Auth & User State
    @Published var isLoggedIn: Bool = false
    @Published var requiresProfileSetup: Bool = false
    @Published var authToken: String = ""
    @Published var currentUserId: String = ""
    @Published var currentUserName: String = ""
    @Published var currentUserPhone: String = ""
    @Published var currentUserStatus: String = "⚡ Vibing in VIBEZ"
    @Published var currentUserAvatar: String = ""
    @Published var currentGoogleEmail: String? = nil
    @Published var isVerified: Bool = false
    @Published var isDarkMode: Bool = false
    @Published var isMaintenanceMode: Bool = false

    // MARK: - Data Collections
    @Published var chats: [ChatItem] = []
    @Published var messagesByChat: [String: [MessageItem]] = [:]
    @Published var contacts: [ContactItem] = []
    @Published var statuses: [StatusItem] = []
    @Published var communities: [CommunityDto] = []
    @Published var callLogs: [CallLogItem] = []
    @Published var typingByChat: [String: Bool] = [:]
    @Published var badgeStatus: BadgeStatusResponse? = nil
    @Published var paymentProviders: [PaymentProviderDto] = []
    @Published var activeCall: ActiveCallSession? = nil
    @Published var activeGroupCall: GroupCallState? = nil
    @Published var isBiometricLockEnabled: Bool = false
    @Published var isAppLocked: Bool = false
    @Published var transcriptionsMap: [String: String] = [:]

    private let api = ApiClient.shared
    private let socket = SocketService()
    private let defaults = UserDefaults.standard

    init() {
        loadSavedSession()
        loadCachedData()
        setupSocketHandlers()

        if isLoggedIn && !authToken.isEmpty {
            socket.connect(userId: currentUserId, token: authToken)
            Task {
                await syncAll()
            }
        }
    }

    // MARK: - Session Persistence

    private func loadSavedSession() {
        authToken = defaults.string(forKey: "vibez_token") ?? ""
        currentUserId = defaults.string(forKey: "vibez_user_id") ?? ""
        currentUserName = defaults.string(forKey: "vibez_user_name") ?? ""
        currentUserPhone = defaults.string(forKey: "vibez_user_phone") ?? ""
        currentUserStatus = defaults.string(forKey: "vibez_user_about") ?? "⚡ Vibing in VIBEZ"
        currentUserAvatar = defaults.string(forKey: "vibez_user_avatar") ?? ""
        currentGoogleEmail = defaults.string(forKey: "vibez_google_email")
        isVerified = defaults.bool(forKey: "vibez_is_verified")
        isDarkMode = defaults.bool(forKey: "vibez_dark_mode")
        isLoggedIn = !authToken.isEmpty && !currentUserId.isEmpty
    }

    private func saveSession() {
        defaults.set(authToken, forKey: "vibez_token")
        defaults.set(currentUserId, forKey: "vibez_user_id")
        defaults.set(currentUserName, forKey: "vibez_user_name")
        defaults.set(currentUserPhone, forKey: "vibez_user_phone")
        defaults.set(currentUserStatus, forKey: "vibez_user_about")
        defaults.set(currentUserAvatar, forKey: "vibez_user_avatar")
        defaults.set(currentGoogleEmail, forKey: "vibez_google_email")
        defaults.set(isVerified, forKey: "vibez_is_verified")
        defaults.set(isDarkMode, forKey: "vibez_dark_mode")
    }

    // MARK: - Local Cache Persistence

    private var cacheDirectory: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
    }

    private func saveCachedData() {
        try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
        if let chatsData = try? JSONEncoder().encode(chats) {
            try? chatsData.write(to: cacheDirectory.appendingPathComponent("chats.json"))
        }
        if let contactsData = try? JSONEncoder().encode(contacts) {
            try? contactsData.write(to: cacheDirectory.appendingPathComponent("contacts.json"))
        }
        if let messagesData = try? JSONEncoder().encode(messagesByChat) {
            try? messagesData.write(to: cacheDirectory.appendingPathComponent("messages.json"))
        }
    }

    private func loadCachedData() {
        if let data = try? Data(contentsOf: cacheDirectory.appendingPathComponent("chats.json")),
           let decoded = try? JSONDecoder().decode([ChatItem].self, from: data) {
            self.chats = decoded
        }
        if let data = try? Data(contentsOf: cacheDirectory.appendingPathComponent("contacts.json")),
           let decoded = try? JSONDecoder().decode([ContactItem].self, from: data) {
            self.contacts = decoded
        }
        if let data = try? Data(contentsOf: cacheDirectory.appendingPathComponent("messages.json")),
           let decoded = try? JSONDecoder().decode([String: [MessageItem]].self, from: data) {
            self.messagesByChat = decoded
        }
    }

    // MARK: - Socket Setup

    private func setupSocketHandlers() {
        socket.onMessageReceived = { [weak self] dto in
            guard let self = self else { return }
            self.handleIncomingMessage(dto)
        }
        socket.onTypingReceived = { [weak self] chatId, isTyping in
            self?.typingByChat[chatId] = isTyping
        }
        socket.onIncomingCall = { [weak self] callerId, callerName, sdp, isVideo in
            guard let self = self else { return }
            let avatar = self.contacts.first(where: { $0.id == callerId || $0.remoteId == callerId })?.avatarUrl ?? ""
            self.activeCall = ActiveCallSession(
                contactId: callerId,
                contactName: callerName,
                contactAvatar: avatar,
                isVideo: isVideo,
                isIncoming: true,
                statusText: "Incoming \(isVideo ? "Video" : "Voice") Call...",
                remoteSdp: sdp
            )
        }
        socket.onCallEnded = { [weak self] in
            self?.activeCall = nil
        }
    }

    // MARK: - Auth Actions

    func loginWithPhone(
        phoneNumber: String,
        name: String,
        about: String,
        imageData: Data? = nil
    ) async throws {
        var uploadedAvatar: String? = nil
        if let data = imageData {
            uploadedAvatar = await api.uploadImageData(token: "", imageData: data, purpose: "AVATAR")
        }
        let response = try await api.phoneLogin(
            phoneNumber: phoneNumber,
            name: name.isEmpty ? nil : name,
            about: about.isEmpty ? nil : about,
            avatarUrl: uploadedAvatar
        )
        applyAuthResponse(response, fallbackPhone: phoneNumber, fallbackName: name, fallbackAvatar: uploadedAvatar)
        await syncAll()
    }

    func loginWithGoogle(
        email: String,
        name: String,
        phoneNumber: String,
        imageData: Data? = nil
    ) async throws {
        var uploadedAvatar: String? = nil
        if let data = imageData {
            uploadedAvatar = await api.uploadImageData(token: "", imageData: data, purpose: "AVATAR")
        }
        let response = try await api.googleLogin(
            email: email,
            name: name,
            avatarUrl: uploadedAvatar,
            phoneNumber: phoneNumber.isEmpty ? nil : phoneNumber
        )
        currentGoogleEmail = email
        applyAuthResponse(response, fallbackPhone: phoneNumber, fallbackName: name, fallbackAvatar: uploadedAvatar)
        await syncAll()
    }

    private func applyAuthResponse(
        _ response: AuthResponse,
        fallbackPhone: String,
        fallbackName: String,
        fallbackAvatar: String?
    ) {
        authToken = response.token
        currentUserId = response.user.id
        currentUserPhone = response.user.phoneNumber.isEmpty ? fallbackPhone : response.user.phoneNumber
        currentUserName = (response.user.name?.isEmpty == false ? response.user.name! : fallbackName)
        currentUserStatus = response.user.about ?? "⚡ Vibing in VIBEZ"
        currentUserAvatar = (response.user.avatarUrl?.isEmpty == false ? response.user.avatarUrl! : (fallbackAvatar ?? ""))
        isVerified = response.user.isVerified ?? false
        requiresProfileSetup = response.requiresProfileSetup ?? false
        isLoggedIn = true
        saveSession()
        socket.connect(userId: currentUserId, token: authToken)
    }

    func updateProfile(name: String, about: String, newAvatarData: Data?) async {
        if !name.isEmpty { currentUserName = name }
        currentUserStatus = about

        var finalAvatar = currentUserAvatar
        if let data = newAvatarData,
           let uploaded = await api.uploadImageData(token: authToken, imageData: data, purpose: "AVATAR") {
            finalAvatar = uploaded
            currentUserAvatar = uploaded
        }
        saveSession()

        guard !authToken.isEmpty else { return }
        if let updated = try? await api.updateProfile(
            token: authToken,
            name: currentUserName,
            about: currentUserStatus,
            avatarUrl: finalAvatar.isEmpty ? nil : finalAvatar
        ) {
            if let remoteAvatar = updated.avatarUrl, !remoteAvatar.isEmpty {
                currentUserAvatar = remoteAvatar
            }
            saveSession()
        }
    }

    func logout() {
        socket.disconnect()
        authToken = ""
        currentUserId = ""
        currentUserName = ""
        currentUserPhone = ""
        currentUserAvatar = ""
        isLoggedIn = false
        chats = []
        messagesByChat = [:]
        saveSession()
    }

    // MARK: - Sync All Data

    func syncAll() async {
        guard !authToken.isEmpty else { return }
        async let systemTask: () = checkSystemStatus()
        async let chatsTask: () = syncChats()
        async let statusesTask: () = syncStatuses()
        async let communitiesTask: () = syncCommunities()
        async let callsTask: () = syncCallLogs()
        async let badgeTask: () = refreshBadgeStatus()
        _ = await (systemTask, chatsTask, statusesTask, communitiesTask, callsTask, badgeTask)
    }

    func checkSystemStatus() async {
        if let status = try? await api.getSystemStatus() {
            isMaintenanceMode = status.maintenanceMode
        }
    }

    func syncChats() async {
        guard !authToken.isEmpty else { return }
        do {
            let dtos = try await api.getChats(token: authToken)
            var updatedChats: [ChatItem] = []
            var updatedContacts = contacts

            for dto in dtos {
                let otherMember = dto.members?.first(where: {
                    $0.userId != currentUserId && $0.user.id != currentUserId
                }) ?? dto.members?.first

                if !dto.isGroup, let otherUser = otherMember?.user {
                    let cName = (otherUser.name?.isEmpty == false) ? otherUser.name! : otherUser.phoneNumber
                    let contact = ContactItem(
                        id: otherUser.id,
                        remoteId: otherUser.id,
                        name: cName.isEmpty ? "User" : cName,
                        phoneNumber: otherUser.phoneNumber,
                        avatarUrl: otherUser.avatarUrl ?? "",
                        aboutStatus: otherUser.about ?? "Hey there! I am using VIBEZ.",
                        isOnline: true,
                        lastSeen: otherUser.lastSeen ?? "Recently",
                        isVerified: otherUser.isVerified ?? false
                    )
                    if let idx = updatedContacts.firstIndex(where: { $0.id == contact.id }) {
                        updatedContacts[idx] = contact
                    } else {
                        updatedContacts.append(contact)
                    }
                }

                let resolvedName: String
                let resolvedAvatar: String
                if dto.isGroup {
                    resolvedName = dto.name ?? "Group Chat"
                    resolvedAvatar = ""
                } else {
                    let u = otherMember?.user
                    resolvedName = (u?.name?.isEmpty == false ? u?.name : nil)
                        ?? (dto.name?.isEmpty == false ? dto.name : nil)
                        ?? u?.phoneNumber
                        ?? "User"
                    resolvedAvatar = u?.avatarUrl ?? ""
                }

                let lastMsg = dto.messages?.first
                let isOff = dto.isGroup && (dto.isOfficial ?? false)
                let isVer = isOff || (dto.isVerified ?? false) || (!dto.isGroup && (otherMember?.user.isVerified ?? false))

                let item = ChatItem(
                    id: dto.id,
                    remoteId: dto.id,
                    contactId: dto.isGroup ? "" : (otherMember?.user.id ?? ""),
                    contactName: resolvedName,
                    contactAvatar: resolvedAvatar,
                    lastMessage: lastMsg?.content ?? "",
                    lastMessageTime: parseIsoDate(lastMsg?.createdAt),
                    unreadCount: 0,
                    isGroup: dto.isGroup,
                    isMuted: dto.isMuted ?? false,
                    isPinned: false,
                    customWallpaper: dto.wallpaper,
                    isOfficial: isOff,
                    isVerified: isVer,
                    allowComments: dto.allowComments ?? true
                )
                updatedChats.append(item)
                socket.joinChat(chatId: dto.id)

                if let msgs = dto.messages, !msgs.isEmpty {
                    let mapped = msgs.map { mapMessageDto($0) }.sorted(by: { $0.timestamp < $1.timestamp })
                    messagesByChat[dto.id] = mapped
                }
            }

            self.contacts = updatedContacts
            self.chats = updatedChats.sorted(by: { $0.lastMessageTime > $1.lastMessageTime })
            saveCachedData()
        } catch {
            // Retain cached chats on offline
        }
    }

    func fetchMessages(for chatId: String) async {
        guard !authToken.isEmpty else { return }
        socket.joinChat(chatId: chatId)
        if let dtos = try? await api.getMessages(token: authToken, chatId: chatId) {
            messagesByChat[chatId] = dtos.map { mapMessageDto($0) }.sorted(by: { $0.timestamp < $1.timestamp })
            saveCachedData()
        }
    }

    func sendMessage(
        chatId: String,
        content: String,
        type: String = "TEXT",
        imageData: Data? = nil,
        mediaUrl: String = "",
        duration: Int = 0,
        replyToId: String? = nil
    ) async {
        let tempId = UUID().uuidString
        var finalMediaUrl = mediaUrl

        if let data = imageData,
           let uploaded = await api.uploadImageData(token: authToken, imageData: data, purpose: "IMAGE") {
            finalMediaUrl = uploaded
        }

        let optimistic = MessageItem(
            id: tempId,
            chatId: chatId,
            senderId: currentUserId.isEmpty ? "ME" : currentUserId,
            content: content,
            timestamp: Date(),
            status: "SENT",
            isStarred: false,
            messageType: type,
            mediaUrl: finalMediaUrl,
            voiceDurationSeconds: duration,
            replyToMessageId: replyToId
        )

        var list = messagesByChat[chatId] ?? []
        list.append(optimistic)
        messagesByChat[chatId] = list

        if let idx = chats.firstIndex(where: { $0.id == chatId }) {
            chats[idx].lastMessage = content
            chats[idx].lastMessageTime = Date()
        }

        socket.sendMessage(
            id: tempId,
            chatId: chatId,
            senderId: currentUserId,
            receiverId: nil,
            content: content,
            type: type,
            mediaUrl: finalMediaUrl.isEmpty ? nil : finalMediaUrl,
            duration: duration > 0 ? duration : nil
        )
        saveCachedData()

        if content.trimmingCharacters(in: .whitespacesAndNewlines).lowercased().hasPrefix("@ai") || chatId == "vibez_ai_chat" {
            let prompt = content.replacingOccurrences(of: "@AI", with: "", options: .caseInsensitive).trimmingCharacters(in: .whitespacesAndNewlines)
            Task {
                await askAiAssistant(chatId: chatId, prompt: prompt.isEmpty ? content : prompt)
            }
        }
    }

    func sendPoll(chatId: String, question: String, options: [String], allowMultiple: Bool = false) async {
        let pollOptions = options.enumerated().map { index, text in
            PollOption(index: index, text: text, voterIds: [])
        }
        let poll = PollData(
            id: UUID().uuidString,
            question: question,
            options: pollOptions,
            allowMultiple: allowMultiple,
            creatorId: currentUserId
        )
        if let data = try? JSONEncoder().encode(poll), let jsonStr = String(data: data, encoding: .utf8) {
            await sendMessage(chatId: chatId, content: jsonStr, type: "POLL")
        }
    }

    func voteOnPoll(chatId: String, messageId: String, optionIndex: Int) {
        var list = messagesByChat[chatId] ?? []
        guard let idx = list.firstIndex(where: { $0.id == messageId }) else { return }
        var msg = list[idx]
        guard let data = msg.content.data(using: .utf8),
              var poll = try? JSONDecoder().decode(PollData.self, from: data) else { return }

        var updatedOptions = poll.options
        if let optIdx = updatedOptions.firstIndex(where: { $0.index == optionIndex }) {
            var voters = updatedOptions[optIdx].voterIds
            if voters.contains(currentUserId) {
                voters.removeAll { $0 == currentUserId }
            } else {
                voters.append(currentUserId)
            }
            updatedOptions[optIdx].voterIds = voters
        }

        if !poll.allowMultiple {
            for i in 0..<updatedOptions.count {
                if updatedOptions[i].index != optionIndex {
                    updatedOptions[i].voterIds.removeAll { $0 == currentUserId }
                }
            }
        }
        poll.options = updatedOptions

        if let enc = try? JSONEncoder().encode(poll), let str = String(data: enc, encoding: .utf8) {
            msg.content = str
            list[idx] = msg
            messagesByChat[chatId] = list
            saveCachedData()
        }
    }

    func sendSticker(chatId: String, emoji: String, label: String) async {
        await sendMessage(chatId: chatId, content: "\(emoji) \(label)", type: "STICKER")
    }

    func askAiAssistant(chatId: String, prompt: String) async {
        try? await Task.sleep(nanoseconds: 600_000_000)
        let responseText = await api.askGeminiAi(prompt: prompt)
        let aiMsg = MessageItem(
            id: UUID().uuidString,
            chatId: chatId,
            senderId: "VIBEZ_AI",
            content: responseText,
            timestamp: Date(),
            status: "READ",
            isStarred: false,
            messageType: "AI",
            mediaUrl: "",
            voiceDurationSeconds: 0,
            replyToMessageId: nil
        )
        var list = messagesByChat[chatId] ?? []
        list.append(aiMsg)
        messagesByChat[chatId] = list
        saveCachedData()
    }

    func transcribeVoiceNote(messageId: String, audioUrl: String) async {
        let transcript = await api.transcribeVoiceAudio(audioData: Data())
        transcriptionsMap[messageId] = transcript
    }

    func startGroupCall(chatId: String, title: String, isVideo: Bool) {
        let selfParticipant = GroupCallParticipant(
            id: currentUserId,
            name: currentUserName.isEmpty ? "You" : currentUserName,
            avatarUrl: currentUserAvatar,
            isSpeaking: true
        )
        activeGroupCall = GroupCallState(
            chatId: chatId,
            callTitle: title,
            isVideo: isVideo,
            participants: [selfParticipant]
        )
    }

    func leaveGroupCall() {
        activeGroupCall = nil
    }

    func sendGroupCallReaction(_ emoji: String) {
        activeGroupCall?.floatingReactions.append(emoji)
    }

    private func handleIncomingMessage(_ dto: MessageDto) {
        let item = mapMessageDto(dto)
        var list = messagesByChat[item.chatId] ?? []
        if let existingIdx = list.firstIndex(where: { $0.id == item.id }) {
            list[existingIdx] = item
        } else {
            list.append(item)
        }
        messagesByChat[item.chatId] = list.sorted(by: { $0.timestamp < $1.timestamp })

        if let idx = chats.firstIndex(where: { $0.id == item.chatId }) {
            chats[idx].lastMessage = item.content
            chats[idx].lastMessageTime = item.timestamp
            if item.senderId != currentUserId {
                chats[idx].unreadCount += 1
            }
        } else {
            Task { await syncChats() }
        }
        saveCachedData()
    }

    // MARK: - Profile & Contact Resolution

    func resolveContact(for idOrChatId: String) async -> ContactItem {
        if let existing = contacts.first(where: { $0.id == idOrChatId || $0.remoteId == idOrChatId }) {
            if !existing.name.isEmpty && existing.name != "Contact" && !existing.avatarUrl.isEmpty {
                return existing
            }
        }
        let chat = chats.first(where: { $0.id == idOrChatId || $0.contactId == idOrChatId })
        let targetId = (chat?.contactId.isEmpty == false ? chat!.contactId : idOrChatId)

        if !authToken.isEmpty,
           let results = try? await api.searchUsers(token: authToken, query: targetId),
           let match = results.first(where: { $0.id == targetId || $0.phoneNumber == targetId }) ?? results.first {
            let resolved = ContactItem(
                id: match.id,
                remoteId: match.id,
                name: (match.name?.isEmpty == false ? match.name! : match.phoneNumber),
                phoneNumber: match.phoneNumber,
                avatarUrl: match.avatarUrl ?? chat?.contactAvatar ?? "",
                aboutStatus: match.about ?? "Hey there! I am using VIBEZ.",
                isOnline: true,
                lastSeen: match.lastSeen ?? "Recently",
                isVerified: match.isVerified ?? false
            )
            if let idx = contacts.firstIndex(where: { $0.id == resolved.id }) {
                contacts[idx] = resolved
            } else {
                contacts.append(resolved)
            }
            if let cIdx = chats.firstIndex(where: { $0.id == chat?.id || $0.contactId == resolved.id }), !chats[cIdx].isGroup {
                chats[cIdx].contactName = resolved.name
                chats[cIdx].contactAvatar = resolved.avatarUrl
                chats[cIdx].isVerified = resolved.isVerified
            }
            saveCachedData()
            return resolved
        }

        return contacts.first(where: { $0.id == targetId }) ?? ContactItem(
            id: targetId,
            remoteId: targetId,
            name: chat?.contactName ?? "User",
            phoneNumber: "",
            avatarUrl: chat?.contactAvatar ?? "",
            aboutStatus: "Hey there! I am using VIBEZ.",
            isOnline: true,
            lastSeen: "Recently",
            isVerified: chat?.isVerified ?? false
        )
    }

    func startChatWithUser(queryOrPhone: String, name: String) async -> ChatItem? {
        guard !authToken.isEmpty else { return nil }
        do {
            let users = try await api.searchUsers(token: authToken, query: queryOrPhone)
            if let target = users.first {
                let dto = try await api.createOrGetPrivateChat(token: authToken, targetUserId: target.id)
                await syncChats()
                return chats.first(where: { $0.id == dto.id })
            }
        } catch {}
        return nil
    }

    // MARK: - Statuses, Communities & Calls

    func syncStatuses() async {
        guard !authToken.isEmpty else { return }
        if let dtos = try? await api.getStatuses(token: authToken) {
            self.statuses = dtos.map { dto in
                let isMine = dto.userId == currentUserId || dto.userId == "ME"
                let name = dto.user?.name?.isEmpty == false ? dto.user!.name! : (isMine ? (currentUserName.isEmpty ? "My Status" : currentUserName) : "User")
                let avatar = dto.user?.avatarUrl?.isEmpty == false ? dto.user!.avatarUrl! : (isMine ? currentUserAvatar : "")
                return StatusItem(
                    id: dto.id,
                    contactId: dto.userId,
                    contactName: name,
                    contactAvatar: avatar,
                    mediaType: dto.type,
                    mediaUrl: dto.mediaUrl ?? "",
                    textCaption: dto.content ?? "",
                    backgroundColorHex: dto.backgroundColor ?? "#075E54",
                    timestamp: parseIsoDate(dto.createdAt),
                    isViewed: dto.viewers?.contains(where: { $0.userId == currentUserId }) ?? false,
                    isMyStatus: isMine,
                    viewCount: dto.viewers?.count ?? 0
                )
            }
        }
    }

    func postStatus(caption: String, type: String, colorHex: String, imageData: Data?) async {
        guard !authToken.isEmpty else { return }
        var mediaUrl = ""
        if let data = imageData,
           let uploaded = await api.uploadImageData(token: authToken, imageData: data, purpose: "IMAGE") {
            mediaUrl = uploaded
        }
        _ = try? await api.createStatus(
            token: authToken,
            content: caption,
            type: type,
            mediaUrl: mediaUrl,
            backgroundColor: colorHex
        )
        await syncStatuses()
    }

    func syncCommunities() async {
        guard !authToken.isEmpty else { return }
        if let dtos = try? await api.getCommunities(token: authToken) {
            self.communities = dtos
        }
    }

    func createCommunity(name: String, description: String) async {
        guard !authToken.isEmpty else { return }
        _ = try? await api.createCommunity(token: authToken, name: name, description: description, avatarUrl: nil)
        await syncCommunities()
    }

    func syncCallLogs() async {
        guard !authToken.isEmpty else { return }
        if let dtos = try? await api.getCallLogs(token: authToken) {
            self.callLogs = dtos.map { dto in
                let isIncoming = dto.receiverId == currentUserId
                let other = isIncoming ? dto.caller : dto.receiver
                return CallLogItem(
                    id: dto.id,
                    contactId: isIncoming ? dto.callerId : dto.receiverId,
                    contactName: other?.name ?? other?.phoneNumber ?? "User",
                    contactAvatar: other?.avatarUrl ?? "",
                    timestamp: parseIsoDate(dto.createdAt),
                    callType: dto.type,
                    isIncoming: isIncoming,
                    isMissed: dto.status == "MISSED"
                )
            }
        }
    }

    func startCall(contactId: String, contactName: String, contactAvatar: String, isVideo: Bool) {
        activeCall = ActiveCallSession(
            contactId: contactId,
            contactName: contactName,
            contactAvatar: contactAvatar,
            isVideo: isVideo,
            isIncoming: false,
            statusText: "Calling...",
            remoteSdp: nil
        )
        socket.emitCallOffer(targetUserId: contactId, isVideo: isVideo)
        Task {
            try? await api.createCallLog(
                token: authToken,
                receiverId: contactId,
                type: isVideo ? "VIDEO" : "VOICE",
                status: "COMPLETED",
                duration: 0
            )
            await syncCallLogs()
        }
    }

    func acceptIncomingCall() {
        guard var call = activeCall else { return }
        call.statusText = "Connected • HD Encrypted"
        activeCall = call
        socket.emitCallAnswer(targetUserId: call.contactId)
    }

    func endActiveCall() {
        if let call = activeCall {
            socket.emitEndCall(targetUserId: call.contactId)
        }
        activeCall = nil
    }

    // MARK: - Verification Badge

    func refreshBadgeStatus() async {
        guard !authToken.isEmpty else { return }
        if let status = try? await api.getBadgeStatus(token: authToken) {
            self.badgeStatus = status
            self.isVerified = status.isVerified
            saveSession()
        }
        if let providers = try? await api.getPaymentProviders(token: authToken) {
            self.paymentProviders = providers
        }
    }

    func purchaseVerificationBadge(provider: String, amount: Double) async -> (Bool, String) {
        guard !authToken.isEmpty else { return (false, "Not authenticated") }
        do {
            let resp = try await api.processBadgePayment(token: authToken, provider: provider, amount: amount)
            if resp.success {
                isVerified = true
                saveSession()
                await refreshBadgeStatus()
                return (true, resp.message ?? "Verified Badge activated!")
            }
            return (false, resp.message ?? "Payment failed")
        } catch {
            return (false, error.localizedDescription)
        }
    }

    // MARK: - Helpers

    private func mapMessageDto(_ dto: MessageDto) -> MessageItem {
        MessageItem(
            id: dto.id,
            chatId: dto.chatId,
            senderId: dto.senderId,
            content: dto.content,
            timestamp: parseIsoDate(dto.createdAt),
            status: dto.status,
            isStarred: dto.isStarred ?? false,
            messageType: dto.type,
            mediaUrl: dto.mediaUrl ?? "",
            voiceDurationSeconds: dto.duration ?? 0,
            replyToMessageId: nil
        )
    }

    private func parseIsoDate(_ str: String?) -> Date {
        guard let str = str, !str.isEmpty else { return Date() }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: str) { return d }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: str) ?? Date()
    }
}
