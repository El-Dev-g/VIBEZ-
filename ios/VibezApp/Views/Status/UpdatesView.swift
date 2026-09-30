import SwiftUI
import PhotosUI

struct UpdatesView: View {
    @EnvironmentObject var store: VibezStore
    @State private var showComposer: Bool = false
    @State private var activeStory: StatusItem? = nil

    private var myStatuses: [StatusItem] {
        store.statuses.filter { $0.isMyStatus }
    }

    private var recentStatuses: [StatusItem] {
        store.statuses.filter { !$0.isMyStatus }
    }

    var body: some View {
        NavigationStack {
            List {
                // My Status Section
                Section("My Status") {
                    HStack(spacing: 14) {
                        Button {
                            if let first = myStatuses.first {
                                activeStory = first
                            } else {
                                showComposer = true
                            }
                        } label: {
                            AvatarView(
                                name: store.currentUserName.isEmpty ? "Me" : store.currentUserName,
                                avatarUrl: store.currentUserAvatar,
                                hasStatusRing: !myStatuses.isEmpty,
                                size: 54
                            )
                        }
                        .buttonStyle(.plain)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("My Status")
                                .font(.headline)
                            Text(myStatuses.isEmpty ? "Tap + to add status update" : "\(myStatuses.count) active update(s)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        Button {
                            showComposer = true
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 26))
                                .foregroundStyle(VibezTheme.primary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // Recent Updates Section
                Section("Recent Updates") {
                    if recentStatuses.isEmpty {
                        Text("No recent status updates from contacts")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(recentStatuses) { status in
                            Button {
                                activeStory = status
                            } label: {
                                HStack(spacing: 14) {
                                    AvatarView(
                                        name: status.contactName,
                                        avatarUrl: status.contactAvatar,
                                        hasStatusRing: true,
                                        size: 52
                                    )
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(status.contactName)
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text(status.timestamp, style: .relative)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Updates")
            .refreshable {
                await store.syncStatuses()
            }
            .sheet(isPresented: $showComposer) {
                StatusComposerView()
            }
            .fullScreenCover(item: $activeStory) { story in
                StatusStoryViewerModal(status: story)
            }
        }
    }
}

struct StatusComposerView: View {
    @EnvironmentObject var store: VibezStore
    @Environment(\.dismiss) private var dismiss

    @State private var caption: String = ""
    @State private var selectedPhotoItem: PhotosPickerItem? = nil
    @State private var selectedImageData: Data? = nil
    @State private var selectedBgHex: String = "#075E54"
    @State private var isPosting: Bool = false

    private let colorOptions = ["#075E54", "#1E3A8A", "#7C3AED", "#BE185D", "#D97706"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                if let data = selectedImageData, let uiImg = UIImage(data: data) {
                    Image(uiImage: uiImg)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 280)
                        .clipShape(RoundedCornerShape(16))
                        .padding(.horizontal)
                }

                TextField("Type a status update or caption...", text: $caption, axis: .vertical)
                    .lineLimit(3...6)
                    .padding(14)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedCornerShape(14))
                    .padding(.horizontal)

                HStack(spacing: 12) {
                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        Label("Add Photo", systemImage: "photo.fill")
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(VibezTheme.primary.opacity(0.14))
                            .foregroundStyle(VibezTheme.primary)
                            .clipShape(Capsule())
                    }
                    .onChange(of: selectedPhotoItem) { newItem in
                        Task {
                            if let data = try? await newItem?.loadTransferable(type: Data.self) {
                                selectedImageData = data
                            }
                        }
                    }

                    Spacer()

                    ForEach(colorOptions, id: \.self) { hex in
                        Circle()
                            .fill(VibezTheme.primary)
                            .frame(width: 28, height: 28)
                            .overlay {
                                if selectedBgHex == hex {
                                    Image(systemName: "checkmark")
                                        .font(.caption2)
                                        .foregroundStyle(.white)
                                }
                            }
                            .onTapGesture {
                                selectedBgHex = hex
                            }
                    }
                }
                .padding(.horizontal)

                Spacer()
            }
            .padding(.top)
            .navigationTitle("New Status")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Post") {
                        isPosting = true
                        Task {
                            let type = (selectedImageData != nil) ? "IMAGE" : "TEXT"
                            await store.postStatus(
                                caption: caption,
                                type: type,
                                colorHex: selectedBgHex,
                                imageData: selectedImageData
                            )
                            isPosting = false
                            dismiss()
                        }
                    }
                    .disabled(isPosting || (caption.isEmpty && selectedImageData == nil))
                }
            }
        }
    }
}

struct StatusStoryViewerModal: View {
    @EnvironmentObject var store: VibezStore
    @Environment(\.dismiss) private var dismiss
    let status: StatusItem

    var body: some View {
        ZStack(alignment: .top) {
            VibezTheme.darkSurface.ignoresSafeArea()

            if status.mediaType == "IMAGE" && !status.mediaUrl.isEmpty {
                SmartImageView(urlOrDataUri: status.mediaUrl, contentMode: .fit)
                    .ignoresSafeArea()
            } else {
                VStack {
                    Spacer()
                    Text(status.textCaption)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(32)
                    Spacer()
                }
            }

            HStack(spacing: 12) {
                AvatarView(name: status.contactName, avatarUrl: status.contactAvatar, size: 40)
                VStack(alignment: .leading) {
                    Text(status.contactName)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                    Text("\(status.viewCount) views")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.8))
                }
                Spacer()
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(.white)
                }
            }
            .padding()
        }
        .task {
            try? await ApiClient.shared.markStatusViewed(token: store.authToken, statusId: status.id)
        }
    }
}
