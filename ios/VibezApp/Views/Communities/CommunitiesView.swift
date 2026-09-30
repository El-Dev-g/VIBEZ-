import SwiftUI

struct CommunitiesView: View {
    @EnvironmentObject var store: VibezStore
    @State private var showCreateSheet: Bool = false
    @State private var newName: String = ""
    @State private var newDescription: String = ""

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button {
                        showCreateSheet = true
                    } label: {
                        HStack(spacing: 14) {
                            RoundedRectangle(cornerRadius: 14)
                                .fill(VibezTheme.primary.opacity(0.15))
                                .frame(width: 52, height: 52)
                                .overlay {
                                    Image(systemName: "person.3.sequence.fill")
                                        .foregroundStyle(VibezTheme.primary)
                                }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("New Community")
                                    .font(.headline)
                                    .foregroundStyle(.primary)
                                Text("Bring members together in topic-based channels")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                Section("Your Communities") {
                    if store.communities.isEmpty {
                        Text("No communities joined yet")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(store.communities) { community in
                            NavigationLink {
                                CommunityDetailView(community: community)
                            } label: {
                                HStack(spacing: 14) {
                                    AvatarView(
                                        name: community.name,
                                        avatarUrl: community.avatarUrl ?? "",
                                        isGroup: true,
                                        isOfficial: community.isOfficial ?? false,
                                        isVerified: community.isOfficial ?? false,
                                        size: 50
                                    )
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack(spacing: 4) {
                                            Text(community.name)
                                                .font(.headline)
                                            if community.isOfficial == true {
                                                VerifiedBadgeView(size: 15)
                                            }
                                        }
                                        Text(community.description ?? "VIBEZ Community")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                            .lineLimit(1)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Communities")
            .refreshable {
                await store.syncCommunities()
            }
            .sheet(isPresented: $showCreateSheet) {
                NavigationStack {
                    Form {
                        Section("Community Name") {
                            TextField("e.g. VIBEZ Builders", text: $newName)
                        }
                        Section("Description") {
                            TextField("What is this community about?", text: $newDescription, axis: .vertical)
                                .lineLimit(3...5)
                        }
                    }
                    .navigationTitle("Create Community")
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Cancel") { showCreateSheet = false }
                        }
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Create") {
                                let nameVal = newName.trimmingCharacters(in: .whitespacesAndNewlines)
                                guard !nameVal.isEmpty else { return }
                                Task {
                                    await store.createCommunity(name: nameVal, description: newDescription)
                                    newName = ""
                                    newDescription = ""
                                    showCreateSheet = false
                                }
                            }
                            .disabled(newName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        }
                    }
                }
            }
        }
    }
}

struct CommunityDetailView: View {
    @EnvironmentObject var store: VibezStore
    let community: CommunityDto
    @State private var channels: [ChatDto] = []

    var body: some View {
        List {
            Section {
                VStack(spacing: 10) {
                    AvatarView(
                        name: community.name,
                        avatarUrl: community.avatarUrl ?? "",
                        isGroup: true,
                        isOfficial: community.isOfficial ?? false,
                        isVerified: community.isOfficial ?? false,
                        size: 96
                    )
                    HStack(spacing: 6) {
                        Text(community.name)
                            .font(.title2)
                            .fontWeight(.bold)
                        if community.isOfficial == true {
                            VerifiedBadgeView(size: 18)
                        }
                    }
                    Text(community.description ?? "Official VIBEZ Community")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }

            Section("Community Channels") {
                if channels.isEmpty {
                    Text("Loading community channels...")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(channels) { ch in
                        NavigationLink {
                            ChatDetailView(chatId: ch.id)
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: (ch.isOfficial == true) ? "megaphone.fill" : "number")
                                    .foregroundStyle(VibezTheme.primary)
                                Text(ch.name ?? "Announcements")
                                    .fontWeight(.medium)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(community.name)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if let fetched = try? await ApiClient.shared.getCommunityChannels(token: store.authToken, communityId: community.id) {
                channels = fetched
            }
        }
    }
}
