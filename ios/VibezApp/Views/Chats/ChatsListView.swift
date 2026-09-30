import SwiftUI

struct ChatsListView: View {
    @EnvironmentObject var store: VibezStore

    @State private var searchText: String = ""
    @State private var selectedFilter: String = "All"
    @State private var selectedProfileTarget: ProfileNavigationTarget? = nil
    @State private var showNewChatSheet: Bool = false

    private let filters = ["All", "Unread", "Groups", "Channels"]

    private var filteredChats: [ChatItem] {
        store.chats.filter { chat in
            let matchesSearch = searchText.isEmpty ||
                chat.contactName.localizedCaseInsensitiveContains(searchText) ||
                chat.lastMessage.localizedCaseInsensitiveContains(searchText)
            if !matchesSearch { return false }

            switch selectedFilter {
            case "Unread": return chat.unreadCount > 0
            case "Groups": return chat.isGroup && !chat.isOfficial
            case "Channels": return chat.isChannel
            default: return true
            }
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filter Pills
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(filters, id: \.self) { filter in
                            let isSelected = (selectedFilter == filter)
                            Button {
                                selectedFilter = filter
                            } label: {
                                Text(filter)
                                    .font(.subheadline)
                                    .fontWeight(isSelected ? .bold : .medium)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 7)
                                    .background(isSelected ? VibezTheme.primary : Color(.secondarySystemBackground))
                                    .foregroundStyle(isSelected ? .white : .primary)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                }

                if filteredChats.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "bubble.left.and.bubble.right")
                            .font(.system(size: 48))
                            .foregroundStyle(.secondary)
                        Text("No conversations yet")
                            .font(.headline)
                        Text("Tap the compose button to start chatting on VIBEZ.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                    Spacer()
                } else {
                    List {
                        ForEach(filteredChats) { chat in
                            NavigationLink {
                                ChatDetailView(chatId: chat.id)
                            } label: {
                                ChatRowView(
                                    chat: chat,
                                    isTyping: store.typingByChat[chat.id] == true,
                                    onAvatarTap: {
                                        if chat.isGroup {
                                            selectedProfileTarget = .groupInfo(chat.id)
                                        } else {
                                            let targetId = chat.contactId.isEmpty ? chat.id : chat.contactId
                                            selectedProfileTarget = .userProfile(targetId)
                                        }
                                    }
                                )
                            }
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    Task {
                                        try? await ApiClient.shared.deleteChat(token: store.authToken, chatId: chat.id)
                                        store.chats.removeAll { $0.id == chat.id }
                                    }
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await store.syncChats()
                    }
                }
            }
            .navigationTitle("VIBEZ")
            .searchable(text: $searchText, prompt: "Search chats or contacts")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showNewChatSheet = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(VibezTheme.primary)
                    }
                }
            }
            .sheet(isPresented: $showNewChatSheet) {
                NewChatSheetView()
            }
            .sheet(item: $selectedProfileTarget) { target in
                NavigationStack {
                    switch target {
                    case .userProfile(let contactId):
                        UserProfileView(contactId: contactId, isCurrentUser: false)
                    case .groupInfo(let chatId):
                        ContactInfoView(chatId: chatId)
                    }
                }
            }
        }
    }
}

enum ProfileNavigationTarget: Identifiable {
    case userProfile(String)
    case groupInfo(String)

    var id: String {
        switch self {
        case .userProfile(let id): return "user_\(id)"
        case .groupInfo(let id): return "group_\(id)"
        }
    }
}

struct ChatRowView: View {
    @EnvironmentObject var store: VibezStore
    let chat: ChatItem
    let isTyping: Bool
    let onAvatarTap: () -> Void

    private var resolvedContact: ContactItem? {
        guard !chat.isGroup else { return nil }
        return store.contacts.first(where: { $0.id == chat.contactId || $0.remoteId == chat.contactId })
    }

    private var displayName: String {
        if !chat.contactName.isEmpty && chat.contactName != "Contact" && chat.contactName != "Unknown" {
            return chat.contactName
        }
        return resolvedContact?.name ?? resolvedContact?.phoneNumber ?? "User"
    }

    private var displayAvatar: String {
        if !chat.contactAvatar.isEmpty {
            return chat.contactAvatar
        }
        return resolvedContact?.avatarUrl ?? ""
    }

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onAvatarTap) {
                AvatarView(
                    name: displayName,
                    avatarUrl: displayAvatar,
                    isOnline: !chat.isGroup,
                    isGroup: chat.isGroup,
                    isOfficial: chat.isChannel,
                    isVerified: chat.isVerified || (resolvedContact?.isVerified ?? false),
                    size: 52
                )
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Text(displayName)
                        .font(.system(size: 16, weight: .semibold))
                        .lineLimit(1)

                    if chat.isVerified || (resolvedContact?.isVerified ?? false) {
                        VerifiedBadgeView(size: 15)
                    }

                    Spacer()

                    Text(chat.lastMessageTime, style: .time)
                        .font(.caption)
                        .foregroundStyle(chat.unreadCount > 0 ? VibezTheme.emerald : .secondary)
                }

                HStack {
                    if isTyping {
                        Text("typing...")
                            .font(.subheadline)
                            .foregroundStyle(VibezTheme.emerald)
                    } else {
                        Text(chat.lastMessage.isEmpty ? "Tap to start chatting" : chat.lastMessage)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }

                    Spacer()

                    if chat.unreadCount > 0 {
                        Text("\(chat.unreadCount)")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(VibezTheme.emerald)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct NewChatSheetView: View {
    @EnvironmentObject var store: VibezStore
    @Environment(\.dismiss) private var dismiss

    @State private var queryPhoneOrName: String = ""
    @State private var searchResults: [UserDto] = []
    @State private var isSearching: Bool = false
    @State private var groupName: String = ""
    @State private var showCreateGroup: Bool = false

    var body: some View {
        NavigationStack {
            List {
                Section("Find VIBEZ User by Phone or Name") {
                    HStack {
                        TextField("Enter phone number or name...", text: $queryPhoneOrName)
                            .textInputAutocapitalization(.never)
                        Button("Search") {
                            performSearch()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(VibezTheme.primary)
                    }
                }

                if !searchResults.isEmpty {
                    Section("Directory Results") {
                        ForEach(searchResults) { user in
                            Button {
                                Task {
                                    _ = await store.startChatWithUser(
                                        queryOrPhone: user.id,
                                        name: user.name ?? user.phoneNumber
                                    )
                                    dismiss()
                                }
                            } label: {
                                HStack(spacing: 12) {
                                    AvatarView(
                                        name: user.name ?? user.phoneNumber,
                                        avatarUrl: user.avatarUrl ?? "",
                                        isVerified: user.isVerified ?? false,
                                        size: 44
                                    )
                                    VStack(alignment: .leading) {
                                        HStack(spacing: 4) {
                                            Text(user.name ?? user.phoneNumber)
                                                .fontWeight(.semibold)
                                            if user.isVerified == true {
                                                VerifiedBadgeView(size: 14)
                                            }
                                        }
                                        Text(user.phoneNumber)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                }

                Section("Saved Contacts") {
                    ForEach(store.contacts) { contact in
                        Button {
                            Task {
                                _ = await store.startChatWithUser(queryOrPhone: contact.id, name: contact.name)
                                dismiss()
                            }
                        } label: {
                            HStack(spacing: 12) {
                                AvatarView(
                                    name: contact.name,
                                    avatarUrl: contact.avatarUrl,
                                    isVerified: contact.isVerified,
                                    size: 44
                                )
                                VStack(alignment: .leading) {
                                    Text(contact.name)
                                        .fontWeight(.medium)
                                    Text(contact.aboutStatus)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(1)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("New Chat")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private func performSearch() {
        let q = queryPhoneOrName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }
        isSearching = true
        Task {
            if let results = try? await ApiClient.shared.searchUsers(token: store.authToken, query: q) {
                searchResults = results
            }
            isSearching = false
        }
    }
}
