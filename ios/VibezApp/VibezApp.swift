import SwiftUI

@main
struct VibezApp: App {
    @StateObject private var store = VibezStore()

    var body: some Scene {
        WindowGroup {
            RootContainerView()
                .environmentObject(store)
                .preferredColorScheme(store.isDarkMode ? .dark : nil)
        }
    }
}

struct RootContainerView: View {
    @EnvironmentObject var store: VibezStore

    var body: some View {
        ZStack {
            if store.isMaintenanceMode {
                VStack(spacing: 16) {
                    Image(systemName: "wrench.and.screwdriver.fill")
                        .font(.system(size: 54))
                        .foregroundStyle(VibezTheme.primary)
                    Text("Scheduled Maintenance")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("VIBEZ is undergoing a brief upgrade. Please check back shortly.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
            } else if store.isLoggedIn {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .fullScreenCover(item: $store.activeCall) { callSession in
            ActiveCallOverlayView(session: callSession)
                .environmentObject(store)
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject var store: VibezStore
    @State private var selectedTab: Int = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            ChatsListView()
                .tabItem {
                    Label("Chats", systemImage: "message.fill")
                }
                .tag(0)

            UpdatesView()
                .tabItem {
                    Label("Updates", systemImage: "circle.dashed.inset.filled")
                }
                .tag(1)

            CommunitiesView()
                .tabItem {
                    Label("Communities", systemImage: "person.3.fill")
                }
                .tag(2)

            CallsListView()
                .tabItem {
                    Label("Calls", systemImage: "phone.fill")
                }
                .tag(3)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(4)
        }
        .tint(VibezTheme.primary)
    }
}
