import SwiftUI
import PhotosUI
import CoreImage.CIFilterBuiltins

// MARK: - User Profile View (Current User Editor & Read-Only Contact Profile)

struct UserProfileView: View {
    @EnvironmentObject var store: VibezStore
    @Environment(\.dismiss) private var dismiss

    let contactId: String
    let isCurrentUser: Bool

    @State private var resolvedContact: ContactItem? = nil
    @State private var editName: String = ""
    @State private var editAbout: String = ""
    @State private var selectedPhotoItem: PhotosPickerItem? = nil
    @State private var showEditSheet: Bool = false
    @State private var showQrSheet: Bool = false
    @State private var showBadgeCheckout: Bool = false

    private var chatFallback: ChatItem? {
        store.chats.first(where: { !$0.isGroup && ($0.contactId == contactId || $0.id == contactId) })
    }

    private var displayName: String {
        if isCurrentUser {
            return store.currentUserName.isEmpty ? "My Profile" : store.currentUserName
        }
        if let c = resolvedContact, !c.name.isEmpty, c.name != "Contact", c.name != "Unknown" {
            return c.name
        }
        if let ch = chatFallback, !ch.contactName.isEmpty, ch.contactName != "Contact" {
            return ch.contactName
        }
        return resolvedContact?.phoneNumber ?? "User"
    }

    private var displayPhone: String {
        if isCurrentUser { return store.currentUserPhone }
        return resolvedContact?.phoneNumber ?? ""
    }

    private var displayAvatar: String {
        if isCurrentUser { return store.currentUserAvatar }
        if let av = resolvedContact?.avatarUrl, !av.isEmpty { return av }
        return chatFallback?.contactAvatar ?? ""
    }

    private var displayAbout: String {
        if isCurrentUser { return store.currentUserStatus }
        return resolvedContact?.aboutStatus ?? "Hey there! I am using VIBEZ."
    }

    private var displayVerified: Bool {
        if isCurrentUser { return store.isVerified }
        return (resolvedContact?.isVerified ?? false) || (chatFallback?.isVerified ?? false)
    }

    var body: some View {
        List {
            // 1. Hero Avatar & Identity Header
            Section {
                VStack(spacing: 14) {
                    ZStack(alignment: .bottomTrailing) {
                        AvatarView(
                            name: displayName,
                            avatarUrl: displayAvatar,
                            isGroup: false,
                            isOfficial: false,
                            isVerified: displayVerified,
                            size: 136
                        )

                        if isCurrentUser {
                            PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                                Circle()
                                    .fill(VibezTheme.primary)
                                    .frame(width: 38, height: 38)
                                    .overlay {
                                        Image(systemName: "camera.fill")
                                            .foregroundStyle(.white)
                                            .font(.system(size: 16))
                                    }
                            }
                            .onChange(of: selectedPhotoItem) { newItem in
                                Task {
                                    if let data = try? await newItem?.loadTransferable(type: Data.self) {
                                        await store.updateProfile(
                                            name: store.currentUserName,
                                            about: store.currentUserStatus,
                                            newAvatarData: data
                                        )
                                    }
                                }
                            }
                        }
                    }

                    HStack(spacing: 6) {
                        Text(displayName)
                            .font(.system(size: 24, weight: .bold))
                        if displayVerified {
                            VerifiedBadgeView(size: 20)
                        }
                    }

                    if !displayPhone.isEmpty {
                        Text(displayPhone)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    // Quick Action Buttons for Contact Profile
                    if !isCurrentUser {
                        HStack(spacing: 28) {
                            ProfileActionButton(icon: "phone.fill", title: "Audio") {
                                store.startCall(
                                    contactId: contactId,
                                    contactName: displayName,
                                    contactAvatar: displayAvatar,
                                    isVideo: false
                                )
                                dismiss()
                            }
                            ProfileActionButton(icon: "video.fill", title: "Video") {
                                store.startCall(
                                    contactId: contactId,
                                    contactName: displayName,
                                    contactAvatar: displayAvatar,
                                    isVideo: true
                                )
                                dismiss()
                            }
                            ProfileActionButton(icon: "qrcode", title: "QR Code") {
                                showQrSheet = true
                            }
                        }
                        .padding(.top, 8)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }

            // 2. About Section
            Section("About") {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(displayAbout)
                            .font(.body)
                        Text("End-to-End Encrypted Identity")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if isCurrentUser {
                        Button("Edit") {
                            editName = store.currentUserName
                            editAbout = store.currentUserStatus
                            showEditSheet = true
                        }
                    }
                }
            }

            // 3. Verification Badge Section (Current User)
            if isCurrentUser {
                Section("Verification & Trust") {
                    Button {
                        showBadgeCheckout = true
                    } label: {
                        HStack(spacing: 12) {
                            VerifiedBadgeView(size: 24)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(store.isVerified ? "Verified Official Account" : "Get Green Verification Badge")
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.primary)
                                Text(store.isVerified ? "Your VIBEZ badge is active" : "Verify your identity on VIBEZ")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.secondary)
                        }
                    }

                    Button {
                        showQrSheet = true
                    } label: {
                        Label("My VIBEZ QR Code", systemImage: "qrcode")
                    }
                }
            }
        }
        .navigationTitle(isCurrentUser ? "My Profile" : displayName)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if !isCurrentUser {
                resolvedContact = await store.resolveContact(for: contactId)
            }
        }
        .sheet(isPresented: $showEditSheet) {
            NavigationStack {
                Form {
                    Section("Display Name") {
                        TextField("Your Name", text: $editName)
                    }
                    Section("About Status") {
                        TextField("About", text: $editAbout)
                    }
                }
                .navigationTitle("Edit Profile")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { showEditSheet = false }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            Task {
                                await store.updateProfile(name: editName, about: editAbout, newAvatarData: nil)
                                showEditSheet = false
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showQrSheet) {
            QrCodeModalView(title: displayName, payload: displayPhone.isEmpty ? contactId : displayPhone)
        }
        .sheet(isPresented: $showBadgeCheckout) {
            VerificationBadgeCheckoutView()
        }
    }
}

struct ProfileActionButton: View {
    let icon: String
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Circle()
                    .fill(VibezTheme.primary.opacity(0.12))
                    .frame(width: 46, height: 46)
                    .overlay {
                        Image(systemName: icon)
                            .foregroundStyle(VibezTheme.primary)
                    }
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(VibezTheme.primary)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Group / Channel Info Screen

struct ContactInfoView: View {
    @EnvironmentObject var store: VibezStore
    let chatId: String

    private var chat: ChatItem? {
        store.chats.first(where: { $0.id == chatId })
    }

    var body: some View {
        List {
            Section {
                VStack(spacing: 12) {
                    AvatarView(
                        name: chat?.contactName ?? "Group",
                        avatarUrl: chat?.contactAvatar ?? "",
                        isGroup: true,
                        isOfficial: chat?.isChannel ?? false,
                        isVerified: chat?.isVerified ?? false,
                        size: 120
                    )
                    HStack(spacing: 6) {
                        Text(chat?.contactName ?? "Group")
                            .font(.title2)
                            .fontWeight(.bold)
                        if chat?.isVerified == true {
                            VerifiedBadgeView(size: 18)
                        }
                    }
                    Text(chat?.isChannel == true ? "Official Broadcast Channel" : "Group Conversation")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }

            Section("Encryption & Security") {
                Label("Messages are end-to-end encrypted", systemImage: "lock.shield.fill")
                    .foregroundStyle(VibezTheme.primary)
            }
        }
        .navigationTitle(chat?.isChannel == true ? "Channel Info" : "Group Info")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Settings Screen

struct SettingsView: View {
    @EnvironmentObject var store: VibezStore
    @State private var showBadgeSheet = false
    @State private var showQrSheet = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink {
                        UserProfileView(contactId: "ME", isCurrentUser: true)
                    } label: {
                        HStack(spacing: 14) {
                            AvatarView(
                                name: store.currentUserName.isEmpty ? "User" : store.currentUserName,
                                avatarUrl: store.currentUserAvatar,
                                isVerified: store.isVerified,
                                size: 68
                            )
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 6) {
                                    Text(store.currentUserName.isEmpty ? "VIBEZ User" : store.currentUserName)
                                        .font(.title3)
                                        .fontWeight(.bold)
                                    if store.isVerified {
                                        VerifiedBadgeView(size: 18)
                                    }
                                }
                                Text(store.currentUserStatus)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                                Text(store.currentUserPhone)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }

                Section("Account & Verification") {
                    Button {
                        showBadgeSheet = true
                    } label: {
                        Label(
                            store.isVerified ? "Verified Badge Active" : "Get Green Verification Badge",
                            systemImage: "checkmark.seal.fill"
                        )
                        .foregroundStyle(VibezTheme.primary)
                    }

                    Button {
                        showQrSheet = true
                    } label: {
                        Label("My QR Code", systemImage: "qrcode")
                    }

                    Toggle(isOn: $store.isDarkMode) {
                        Label("Dark Appearance", systemImage: "moon.fill")
                    }
                }

                Section("Cloud Synchronization") {
                    Button {
                        Task { await store.syncAll() }
                    } label: {
                        Label("Sync Chats, Contacts & Media Now", systemImage: "arrow.triangle.2.circlepath.icloud.fill")
                    }
                }

                Section {
                    Button(role: .destructive) {
                        store.logout()
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showBadgeSheet) {
                VerificationBadgeCheckoutView()
            }
            .sheet(isPresented: $showQrSheet) {
                QrCodeModalView(title: store.currentUserName, payload: store.currentUserPhone)
            }
        }
    }
}

// MARK: - QR Code Modal & Badge Checkout

struct QrCodeModalView: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let payload: String

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text(title)
                    .font(.title2)
                    .fontWeight(.bold)

                if let qrImage = generateQrCode(from: payload.isEmpty ? "vibez_user" : payload) {
                    Image(uiImage: qrImage)
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 220, height: 220)
                        .padding(16)
                        .background(Color.white)
                        .clipShape(RoundedCornerShape(20))
                        .shadow(radius: 6)
                }

                Text("Scan this code in VIBEZ to connect immediately")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .navigationTitle("VIBEZ QR Code")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func generateQrCode(from string: String) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        if let outputImage = filter.outputImage {
            let transformed = outputImage.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
            if let cgimg = context.createCGImage(transformed, from: transformed.extent) {
                return UIImage(cgImage: cgimg)
            }
        }
        return nil
    }
}

struct VerificationBadgeCheckoutView: View {
    @EnvironmentObject var store: VibezStore
    @Environment(\.dismiss) private var dismiss
    @State private var statusMessage: String? = nil
    @State private var isProcessing: Bool = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                VerifiedBadgeView(size: 64)
                    .padding(.top, 24)

                Text("VIBEZ Official Verification")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Display the official green checkmark next to your profile name, chats, and community channels.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                let price = store.badgeStatus?.badgePrice ?? 3.00
                Text(String(format: "$%.2f USD", price))
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(VibezTheme.primary)

                if let statusMessage = statusMessage {
                    Text(statusMessage)
                        .font(.footnote)
                        .foregroundStyle(store.isVerified ? VibezTheme.emerald : .red)
                }

                Button {
                    isProcessing = true
                    Task {
                        let provider = store.paymentProviders.first?.provider ?? "STRIPE"
                        let (ok, msg) = await store.purchaseVerificationBadge(provider: provider, amount: price)
                        statusMessage = msg
                        isProcessing = false
                        if ok {
                            try? await Task.sleep(nanoseconds: 1_000_000_000)
                            dismiss()
                        }
                    }
                } label: {
                    HStack {
                        if isProcessing {
                            ProgressView().tint(.white)
                        } else {
                            Text(store.isVerified ? "Verified Badge Active" : "Activate Verified Badge")
                                .fontWeight(.bold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(VibezTheme.primary)
                    .foregroundStyle(.white)
                    .clipShape(RoundedCornerShape(14))
                }
                .disabled(isProcessing || store.isVerified)
                .padding(.horizontal, 24)

                Spacer()
            }
            .navigationTitle("Verification")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .task {
                await store.refreshBadgeStatus()
            }
        }
    }
}
