import SwiftUI
import PhotosUI

struct AuthView: View {
    @EnvironmentObject var store: VibezStore

    @State private var authMode: Int = 0 // 0 = Phone, 1 = Google
    @State private var phoneNumber: String = "+"
    @State private var fullName: String = ""
    @State private var email: String = ""
    @State private var about: String = "⚡ Vibing in VIBEZ"
    @State private var selectedPhotoItem: PhotosPickerItem? = nil
    @State private var selectedAvatarData: Data? = nil
    @State private var isLoading: Bool = false
    @State private var errorMessage: String? = nil

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    Spacer(minLength: 20)

                    // Brand Logo & Header
                    VStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .fill(VibezTheme.primary.opacity(0.14))
                                .frame(width: 88, height: 88)
                            Image(systemName: "bolt.message.fill")
                                .font(.system(size: 42))
                                .foregroundStyle(VibezTheme.primary)
                        }

                        Text("Welcome to VIBEZ")
                            .font(.system(size: 28, weight: .bold))

                        Text("End-to-end encrypted messaging, stories, communities & HD calls")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }

                    // Profile Photo Picker
                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        ZStack(alignment: .bottomTrailing) {
                            if let data = selectedAvatarData, let uiImg = UIImage(data: data) {
                                Image(uiImage: uiImg)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 96, height: 96)
                                    .clipShape(Circle())
                            } else {
                                AvatarView(name: fullName.isEmpty ? "V" : fullName, size: 96)
                            }
                            Circle()
                                .fill(VibezTheme.primary)
                                .frame(width: 30, height: 30)
                                .overlay {
                                    Image(systemName: "camera.fill")
                                        .font(.system(size: 13))
                                        .foregroundStyle(.white)
                                }
                        }
                    }
                    .onChange(of: selectedPhotoItem) { newItem in
                        Task {
                            if let data = try? await newItem?.loadTransferable(type: Data.self) {
                                selectedAvatarData = data
                            }
                        }
                    }

                    Picker("Sign In Method", selection: $authMode) {
                        Text("Phone Number").tag(0)
                        Text("Google Account").tag(1)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 24)

                    VStack(spacing: 16) {
                        if authMode == 1 {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Google Email")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.secondary)
                                TextField("you@gmail.com", text: $email)
                                    .keyboardType(.emailAddress)
                                    .textInputAutocapitalization(.never)
                                    .padding(14)
                                    .background(Color(.secondarySystemBackground))
                                    .clipShape(RoundedCornerShape(12))
                            }
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Phone Number (with country code)")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundStyle(.secondary)
                            TextField("+1 555 0199", text: $phoneNumber)
                                .keyboardType(.phonePad)
                                .padding(14)
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedCornerShape(12))
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Display Name")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundStyle(.secondary)
                            TextField("Your Name", text: $fullName)
                                .padding(14)
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedCornerShape(12))
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("About Status")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundStyle(.secondary)
                            TextField("⚡ Vibing in VIBEZ", text: $about)
                                .padding(14)
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedCornerShape(12))
                        }
                    }
                    .padding(.horizontal, 24)

                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .padding(.horizontal, 24)
                    }

                    Button {
                        submitAuth()
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text(authMode == 0 ? "Continue with Phone" : "Continue with Google")
                                    .fontWeight(.bold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(VibezTheme.primary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedCornerShape(14))
                    }
                    .disabled(isLoading || phoneNumber.trimmingCharacters(in: .whitespaces).count < 5)
                    .padding(.horizontal, 24)

                    Spacer()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func submitAuth() {
        errorMessage = nil
        isLoading = true
        let cleanPhone = phoneNumber.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanName = fullName.trimmingCharacters(in: .whitespacesAndNewlines)

        Task {
            do {
                if authMode == 0 {
                    try await store.loginWithPhone(
                        phoneNumber: cleanPhone,
                        name: cleanName.isEmpty ? cleanPhone : cleanName,
                        about: about,
                        imageData: selectedAvatarData
                    )
                } else {
                    let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
                    try await store.loginWithGoogle(
                        email: cleanEmail.isEmpty ? "user@gmail.com" : cleanEmail,
                        name: cleanName.isEmpty ? "VIBEZ User" : cleanName,
                        phoneNumber: cleanPhone,
                        imageData: selectedAvatarData
                    )
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
