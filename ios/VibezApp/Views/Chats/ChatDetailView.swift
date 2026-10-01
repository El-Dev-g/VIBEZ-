import SwiftUI
import PhotosUI

struct ChatDetailView: View {
    @EnvironmentObject var store: VibezStore
    let chatId: String

    @State private var inputText: String = ""
    @State private var selectedPhotoItem: PhotosPickerItem? = nil
    @State private var replyingTo: MessageItem? = nil
    @State private var fullscreenMediaMessage: MessageItem? = nil
    @State private var showProfileSheet: Bool = false

    private var chat: ChatItem? {
        store.chats.first(where: { $0.id == chatId || $0.contactId == chatId })
    }

    private var contact: ContactItem? {
        guard let c = chat, !c.isGroup else { return nil }
        return store.contacts.first(where: { $0.id == c.contactId || $0.remoteId == c.contactId })
    }

    private var headerName: String {
        if let name = chat?.contactName, !name.isEmpty, name != "Contact", name != "Unknown" {
            return name
        }
        return contact?.name ?? contact?.phoneNumber ?? "Chat"
    }

    private var headerAvatar: String {
        if let avatar = chat?.contactAvatar, !avatar.isEmpty {
            return avatar
        }
        return contact?.avatarUrl ?? ""
    }

    private var messages: [MessageItem] {
        store.messagesByChat[chat?.id ?? chatId] ?? []
    }

    var body: some View {
        VStack(spacing: 0) {
            // Messages ScrollView
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(messages) { message in
                            MessageBubbleView(
                                message: message,
                                isMe: message.senderId == store.currentUserId || message.senderId == "ME",
                                onReply: { replyingTo = message },
                                onMediaTap: { fullscreenMediaMessage = message }
                            )
                            .id(message.id)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                }
                .onChange(of: messages.count) { _ in
                    if let lastId = messages.last?.id {
                        withAnimation {
                            proxy.scrollTo(lastId, anchor: .bottom)
                        }
                    }
                }
            }

            // Reply Banner
            if let reply = replyingTo {
                HStack {
                    Rectangle()
                        .fill(VibezTheme.primary)
                        .frame(width: 4, height: 34)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Replying to message")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundStyle(VibezTheme.primary)
                        Text(reply.messageType == "IMAGE" ? "📷 Photo" : reply.content)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer()
                    Button {
                        replyingTo = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(Color(.secondarySystemBackground))
            }

            // Quick AI, Sticker, and Poll Chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    Button {
                        inputText = "@AI "
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "sparkles")
                            Text("Ask @AI")
                        }
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color(0xFF6366F1).opacity(0.15))
                        .foregroundStyle(Color(0xFF6366F1))
                        .clipShape(Capsule())
                    }

                    Button {
                        Task {
                            await store.sendSticker(chatId: chat?.id ?? chatId, emoji: "🔥", label: "LIT VIBES")
                        }
                    } label: {
                        Text("🔥 Sticker")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(VibezTheme.primary.opacity(0.12))
                            .foregroundStyle(VibezTheme.primary)
                            .clipShape(Capsule())
                    }

                    Button {
                        Task {
                            await store.sendPoll(
                                chatId: chat?.id ?? chatId,
                                question: "What's the plan for tonight?",
                                options: ["Movie Night 🍿", "Gaming Session 🎮", "Dinner & Drinks 🍹"]
                            )
                        }
                    } label: {
                        Text("📊 Quick Poll")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(VibezTheme.primary.opacity(0.12))
                            .foregroundStyle(VibezTheme.primary)
                            .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
            }

            // Composer Bar
            if chat?.isChannel == true && chat?.allowComments == false {
                HStack(spacing: 8) {
                    Image(systemName: "megaphone.fill")
                        .foregroundStyle(VibezTheme.primary)
                    Text("Only channel admins can send messages")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(14)
                .background(Color(.secondarySystemBackground))
            } else {
                HStack(spacing: 10) {
                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        Image(systemName: "photo.on.rectangle.angled")
                            .font(.system(size: 20))
                            .foregroundStyle(VibezTheme.primary)
                            .frame(width: 38, height: 38)
                    }
                    .onChange(of: selectedPhotoItem) { newItem in
                        Task {
                            if let data = try? await newItem?.loadTransferable(type: Data.self) {
                                await store.sendMessage(
                                    chatId: chat?.id ?? chatId,
                                    content: "Photo",
                                    type: "IMAGE",
                                    imageData: data,
                                    replyToId: replyingTo?.id
                                )
                                replyingTo = nil
                            }
                        }
                    }

                    TextField("Message", text: $inputText)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(Capsule())

                    Button {
                        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !trimmed.isEmpty else { return }
                        inputText = ""
                        let replyId = replyingTo?.id
                        replyingTo = nil
                        Task {
                            await store.sendMessage(
                                chatId: chat?.id ?? chatId,
                                content: trimmed,
                                type: "TEXT",
                                replyToId: replyId
                            )
                        }
                    } label: {
                        Circle()
                            .fill(VibezTheme.primary)
                            .frame(width: 42, height: 42)
                            .overlay {
                                Image(systemName: "paperplane.fill")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Button {
                    showProfileSheet = true
                } label: {
                    HStack(spacing: 8) {
                        AvatarView(
                            name: headerName,
                            avatarUrl: headerAvatar,
                            isGroup: chat?.isGroup ?? false,
                            isOfficial: chat?.isChannel ?? false,
                            isVerified: (chat?.isVerified ?? false) || (contact?.isVerified ?? false),
                            size: 34
                        )
                        VStack(alignment: .leading, spacing: 1) {
                            HStack(spacing: 4) {
                                Text(headerName)
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundStyle(.primary)
                                    .lineLimit(1)
                                if (chat?.isVerified ?? false) || (contact?.isVerified ?? false) {
                                    VerifiedBadgeView(size: 13)
                                }
                            }
                            Text(chat?.isChannel == true ? "Official Channel" : (chat?.isGroup == true ? "Group Chat" : "Online"))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .buttonStyle(.plain)
            }

            if chat?.isGroup != true {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        let targetId = chat?.contactId.isEmpty == false ? chat!.contactId : chatId
                        store.startCall(contactId: targetId, contactName: headerName, contactAvatar: headerAvatar, isVideo: false)
                    } label: {
                        Image(systemName: "phone.fill")
                            .foregroundStyle(VibezTheme.primary)
                    }

                    Button {
                        let targetId = chat?.contactId.isEmpty == false ? chat!.contactId : chatId
                        store.startCall(contactId: targetId, contactName: headerName, contactAvatar: headerAvatar, isVideo: true)
                    } label: {
                        Image(systemName: "video.fill")
                            .foregroundStyle(VibezTheme.primary)
                    }
                }
            }
        }
        .task {
            await store.fetchMessages(for: chat?.id ?? chatId)
            if chat?.isGroup != true {
                let targetId = chat?.contactId.isEmpty == false ? chat!.contactId : chatId
                _ = await store.resolveContact(for: targetId)
            }
        }
        .sheet(isPresented: $showProfileSheet) {
            NavigationStack {
                if chat?.isGroup == true {
                    ContactInfoView(chatId: chat?.id ?? chatId)
                } else {
                    let targetId = chat?.contactId.isEmpty == false ? chat!.contactId : chatId
                    UserProfileView(contactId: targetId, isCurrentUser: false)
                }
            }
        }
        .fullScreenCover(item: $fullscreenMediaMessage) { msg in
            MediaViewerModal(message: msg)
        }
    }
}

struct MessageBubbleView: View {
    let message: MessageItem
    let isMe: Bool
    let onReply: () -> Void
    let onMediaTap: () -> Void

    var body: some View {
        HStack {
            if isMe { Spacer(minLength: 50) }

            VStack(alignment: .trailing, spacing: 4) {
                VStack(alignment: .leading, spacing: 6) {
                    if message.messageType == "IMAGE" && !message.mediaUrl.isEmpty {
                        Button(action: onMediaTap) {
                            SmartImageView(urlOrDataUri: message.mediaUrl, contentMode: .fill)
                                .frame(width: 230, height: 190)
                                .clipShape(RoundedCornerShape(10))
                        }
                        .buttonStyle(.plain)
                    }

                    if !message.content.isEmpty && !(message.messageType == "IMAGE" && message.content == "Photo") {
                        Text(message.content)
                            .font(.system(size: 15))
                            .foregroundStyle(.primary)
                    }
                }

                HStack(spacing: 4) {
                    Text(message.timestamp, style: .time)
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                    if isMe {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(VibezTheme.primary)
                    }
                }
            }
            .padding(.horizontal, 11)
            .padding(.vertical, 8)
            .background(isMe ? VibezTheme.sentBubble : Color(.secondarySystemBackground))
            .clipShape(RoundedCornerShape(14))
            .contextMenu {
                Button {
                    onReply()
                } label: {
                    Label("Reply", systemImage: "arrowshape.turn.up.left")
                }
            }

            if !isMe { Spacer(minLength: 50) }
        }
    }
}

struct MediaViewerModal: View {
    @Environment(\.dismiss) private var dismiss
    let message: MessageItem
    @State private var scale: CGFloat = 1.0

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                SmartImageView(urlOrDataUri: message.mediaUrl, contentMode: .fit)
                    .scaleEffect(scale)
                    .gesture(
                        MagnificationGesture()
                            .onChanged { val in
                                scale = max(1.0, min(val, 4.0))
                            }
                            .onEnded { _ in
                                withAnimation { scale = 1.0 }
                            }
                    )
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(.white)
                }
            }
        }
    }
}
