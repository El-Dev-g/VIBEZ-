package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.zIndex
import androidx.compose.ui.Alignment
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.core.app.NotificationCompat
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.example.ui.components.AvatarView
import com.example.ui.components.IncomingCallOverlay
import com.example.ui.IncomingNotification
import com.example.ui.theme.WhatsAppTheme
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.dialog
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.data.MessageEntity
import com.example.data.StatusEntity
import com.example.ui.WhatsAppViewModel
import com.example.ui.viewmodels.VideoCallViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.BackendSyncScreen
import com.example.ui.screens.CallScreen
import com.example.ui.screens.ChatDetailScreen
import com.example.ui.screens.ContactInfoScreen
import com.example.ui.screens.CreateCommunityScreen
import com.example.ui.screens.CreateStatusScreen
import com.example.ui.screens.FullCameraExperienceScreen
import com.example.ui.screens.GoogleServiceAuthScreen
import com.example.ui.screens.MainTabScreen
import com.example.ui.screens.MediaViewerScreen
import com.example.ui.screens.MyStatusListScreen
import com.example.ui.screens.NewContactScreen
import com.example.ui.screens.NewGroupScreen
import com.example.ui.screens.PermissionsOnboardingScreen
import com.example.ui.screens.PhoneIdentitySetupScreen
import com.example.ui.screens.QrScannerScreen
import com.example.ui.screens.SelectContactScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.screens.SharedMediaScreen
import com.example.ui.screens.SplashScreen
import com.example.ui.screens.StarredMessagesScreen
import com.example.ui.screens.StatusPrivacyScreen
import com.example.ui.screens.StatusViewerScreen
import com.example.ui.screens.StatusViewersScreen
import com.example.ui.screens.UserProfileScreen
import com.example.ui.screens.VerificationCheckoutScreen
import com.example.ui.screens.BadgesReceiptScreen
import com.example.ui.screens.WallpaperSettingsScreen

class MainActivity : ComponentActivity() {

    private val viewModel: WhatsAppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val isDarkMode by viewModel.isDarkMode.collectAsState()

            WhatsAppTheme(darkTheme = isDarkMode) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    WhatsAppApp(viewModel = viewModel)
                }
            }
        }
    }

    @SuppressLint("MissingPermission")
    internal fun showSystemNotification(context: Context, title: String, content: String, chatId: String) {
        val channelId = "chat_messages_channel"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(
                channelId,
                "Chat Messages",
                android.app.NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for incoming chat messages"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = android.content.Intent(context, MainActivity::class.java).apply {
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("CHAT_ID", chatId)
        }
        val pendingIntent = android.app.PendingIntent.getActivity(
            context,
            chatId.hashCode(),
            intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )

        val notification = androidx.core.app.NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(title)
            .setContentText(content)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(chatId.hashCode(), notification)
    }
}

@Composable
fun WhatsAppApp(viewModel: WhatsAppViewModel) {
    val navController = rememberNavController()
    val context = LocalContext.current
    val videoCallViewModel: VideoCallViewModel = viewModel()

    val chats by viewModel.filteredChats.collectAsState()
    val allChatsList by viewModel.chats.collectAsState()
    val contacts by viewModel.contacts.collectAsState()
    val statuses by viewModel.statuses.collectAsState()
    val communities by viewModel.communities.collectAsState()
    val callLogs by viewModel.callLogs.collectAsState()
    val starredMessages by viewModel.starredMessages.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val isDarkMode by viewModel.isDarkMode.collectAsState()

    val isLoggedIn by viewModel.isLoggedIn.collectAsState()
    val currentUserPhone by viewModel.currentUserPhone.collectAsState()
    val currentUserName by viewModel.currentUserName.collectAsState()
    val currentUserStatus by viewModel.currentUserStatus.collectAsState()
    val currentGoogleEmail by viewModel.currentGoogleEmail.collectAsState()
    val currentAuthProvider by viewModel.currentAuthProvider.collectAsState()
    val typingChatId by viewModel.typingChatId.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()
    val isSyncingContacts by viewModel.isSyncingContacts.collectAsState()
    val syncStatusMessage by viewModel.syncStatusMessage.collectAsState()

    val isVerified by viewModel.isVerified.collectAsState()
    val badgeStatus by viewModel.badgeStatus.collectAsState()

    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn) {
            viewModel.refreshBadgeStatus()
        }
    }

    var activeStatusForViewer by remember { mutableStateOf<StatusEntity?>(null) }
    var activeNotification by remember { mutableStateOf<IncomingNotification?>(null) }

    val incomingCallOffer by videoCallViewModel.incomingCallOffer.collectAsState()

    // Request notification permissions automatically on start
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
        val permissionLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.RequestPermission(),
            onResult = {}
        )
        LaunchedEffect(Unit) {
            permissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    // Collect and handle incoming notifications
    val incomingNotification by viewModel.incomingNotification.collectAsState()
    LaunchedEffect(incomingNotification) {
        incomingNotification?.let { notif ->
            val mainActivity = context as? MainActivity
            mainActivity?.let { activity ->
                activity.showSystemNotification(context, notif.contactName, notif.content, notif.chatId)
            }
            
            // Check if we are already inside the ChatDetailScreen for this chat
            val currentBackStackEntry = navController.currentBackStackEntry
            val currentRoute = currentBackStackEntry?.destination?.route
            val isViewingThisChat = currentRoute != null && currentRoute.contains("chat/${notif.chatId}")
            if (!isViewingThisChat) {
                activeNotification = notif
            }
            
            viewModel.incomingNotification.value = null
        }
    }

    val startDestination = "splash"

    Box(modifier = Modifier.fillMaxSize()) {
        NavHost(
            navController = navController,
            startDestination = startDestination
        ) {
        // -1. Brand Splash Screen
        composable("splash") {
            SplashScreen(
                onSplashComplete = {
                    val nextDestination = if (isLoggedIn) "main" else "auth"
                    navController.navigate(nextDestination) {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            )
        }

        // 0. User Authentication Screen (Google Sign-In Primary)
        composable("auth") {
            AuthScreen(
                onAuthSuccess = { phone, name, about ->
                    viewModel.loginWithGoogle("user@vibez.app", name, null, phone) { success, _ ->
                        navController.navigate("permissions_onboarding") {
                            popUpTo("auth") { inclusive = true }
                        }
                    }
                },
                onGoogleAuthSuccess = { email, name, avatarUrl, phone, idToken ->
                    viewModel.loginWithGoogle(email, name, avatarUrl, phone, idToken) { success, _ ->
                        navController.navigate("permissions_onboarding") {
                            popUpTo("auth") { inclusive = true }
                        }
                    }
                },
                onNavigateToPhoneIdentity = { email, name, avatarUrl, idToken ->
                    val encodedEmail = java.net.URLEncoder.encode(email, "UTF-8")
                    val encodedName = java.net.URLEncoder.encode(name, "UTF-8")
                    val encodedAvatar = if (avatarUrl != null) java.net.URLEncoder.encode(avatarUrl, "UTF-8") else ""
                    val encodedToken = if (idToken != null) java.net.URLEncoder.encode(idToken, "UTF-8") else ""
                    navController.navigate("phone_identity_setup?email=$encodedEmail&name=$encodedName&avatar=$encodedAvatar&idToken=$encodedToken")
                }
            )
        }

        // 0b. Phone Number Identity Setup for Google-Authenticated Users (No SMS OTP Required)
        composable(
            route = "phone_identity_setup?email={email}&name={name}&avatar={avatar}&idToken={idToken}",
            arguments = listOf(
                navArgument("email") { defaultValue = "user@gmail.com" },
                navArgument("name") { defaultValue = "VIBEZ User" },
                navArgument("avatar") { defaultValue = "" },
                navArgument("idToken") { defaultValue = "" }
            )
        ) { backStackEntry ->
            val rawEmail = backStackEntry.arguments?.getString("email") ?: "user@gmail.com"
            val rawName = backStackEntry.arguments?.getString("name") ?: "VIBEZ User"
            val rawAvatar = backStackEntry.arguments?.getString("avatar") ?: ""
            val rawToken = backStackEntry.arguments?.getString("idToken") ?: ""

            val email = java.net.URLDecoder.decode(rawEmail, "UTF-8")
            val name = java.net.URLDecoder.decode(rawName, "UTF-8")
            val avatar = if (rawAvatar.isNotEmpty()) java.net.URLDecoder.decode(rawAvatar, "UTF-8") else null
            val idToken = if (rawToken.isNotEmpty()) java.net.URLDecoder.decode(rawToken, "UTF-8") else null

            PhoneIdentitySetupScreen(
                googleEmail = email,
                initialName = name,
                initialAvatarUrl = avatar,
                idToken = idToken,
                onBackClick = {
                    navController.popBackStack()
                },
                onCompleteSetup = { phone, updatedName, about, chosenAvatar, token ->
                    viewModel.loginWithGoogle(email, updatedName, chosenAvatar, phone, token) { success, _ ->
                        navController.navigate("permissions_onboarding") {
                            popUpTo("auth") { inclusive = true }
                        }
                    }
                }
            )
        }

        // 0c. Permissions Onboarding Step
        composable("permissions_onboarding") {
            PermissionsOnboardingScreen(
                onAllPermissionsProcessed = {
                    navController.navigate("main") {
                        popUpTo("permissions_onboarding") { inclusive = true }
                    }
                }
            )
        }

        // 1. Main Tab Screen (Chats, Status, Communities, Calls)
        composable("main") {
            MainTabScreen(
                chats = chats,
                contacts = contacts,
                typingChatId = typingChatId,
                statuses = statuses,
                communities = communities,
                callLogs = callLogs,
                searchQuery = searchQuery,
                selectedTab = selectedTab,
                onTabSelected = { viewModel.setSelectedTab(it) },
                onSearchQueryChange = { viewModel.searchQuery.value = it },
                onChatClick = { chatId ->
                    navController.navigate("chat/$chatId")
                },
                onNewChatClick = {
                    navController.navigate("select_contact")
                },
                onCreateCommunityClick = {
                    navController.navigate("create_community")
                },
                onStatusClick = { status ->
                    viewModel.markStatusViewed(status.id)
                    activeStatusForViewer = status
                    navController.navigate("status_viewer")
                },
                onCreateTextStatusClick = {
                    navController.navigate("create_text_status")
                },
                onCreatePhotoStatusClick = {
                    navController.navigate("create_photo_status")
                },
                onCreateStatusClick = {
                    navController.navigate("full_camera?isStatus=true")
                },
                onViewersClick = { status ->
                    navController.navigate("status_viewers/${status.id}")
                },
                onStartCallClick = { contactId, isVideo ->
                    viewModel.logCall(contactId, "Contact", if (isVideo) "VIDEO" else "VOICE", false, false)
                    navController.navigate("call/$contactId/$isVideo")
                },
                onSettingsClick = {
                    navController.navigate("settings")
                },
                onStarredMessagesClick = {
                    navController.navigate("starred_messages")
                },
                onNewGroupClick = {
                    navController.navigate("new_group")
                },
                onAvatarClick = { contactId ->
                    navController.navigate("user_profile/$contactId")
                },
                onStatusPrivacyClick = {
                    navController.navigate("status_privacy")
                },
                onMyStatusListClick = {
                    navController.navigate("my_status_list")
                },
                onClearCallLogs = {
                    viewModel.clearCallLogs()
                }
            )
        }

        // 1.1 My Statuses List Screen
        composable("my_status_list") {
            MyStatusListScreen(
                statuses = statuses,
                onBackClick = { navController.popBackStack() },
                onStatusClick = { status ->
                    viewModel.markStatusViewed(status.id)
                    activeStatusForViewer = status
                    navController.navigate("status_viewer")
                },
                onViewersClick = { status ->
                    navController.navigate("status_viewers/${status.id}")
                },
                onDeleteStatus = { statusId ->
                    viewModel.deleteStatus(statusId)
                },
                onCreateStatusClick = {
                    navController.navigate("create_text_status")
                }
            )
        }

        // 2. Chat Detail Screen
        composable(
            route = "chat/{chatId}",
            arguments = listOf(navArgument("chatId") { type = NavType.StringType })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId") ?: ""
            val chat = allChatsList.firstOrNull { it.id == chatId }
            val messagesFlow = remember(chatId) { viewModel.getMessagesForChat(chatId) }
            val messages by messagesFlow.collectAsState()

            val chatWallpapersMap by viewModel.chatWallpapers.collectAsState()
            val globalWall by viewModel.globalWallpaper.collectAsState()
            val initialDimming by viewModel.wallpaperDimming.collectAsState()
            val customWallpaper = chat?.let { chatWallpapersMap[it.id] } ?: globalWall

            val contact = chat?.let { c -> contacts.firstOrNull { it.id == c.contactId } }

            ChatDetailScreen(
                chat = chat,
                contact = contact,
                messages = messages,
                isDarkMode = isDarkMode,
                isTyping = (typingChatId == chatId),
                customWallpaper = customWallpaper,
                wallpaperDimming = initialDimming,
                onBackClick = { navController.popBackStack() },
                onContactInfoClick = {
                    if (chat != null) {
                        navController.navigate("user_profile/${chat.contactId}")
                    } else {
                        navController.navigate("contact_info/$chatId")
                    }
                },
                onWallpaperClick = {
                    navController.navigate("wallpaper_settings?chatId=$chatId")
                },
                onVoiceCallClick = {
                    if (chat != null) {
                        viewModel.logCall(chat.contactId, chat.contactName, "VOICE", false, false)
                        navController.navigate("call/${chat.contactId}/false")
                    }
                },
                onVideoCallClick = {
                    if (chat != null) {
                        viewModel.logCall(chat.contactId, chat.contactName, "VIDEO", false, false)
                        navController.navigate("call/${chat.contactId}/true")
                    }
                },
                onSendMessage = { text, type, mediaUrl, duration, replyToMessageId ->
                    viewModel.sendMessage(chatId, text, type, mediaUrl, duration, replyToMessageId)
                },
                onToggleStarMessage = { msg ->
                    viewModel.toggleStarMessage(msg)
                },
                onDeleteMessage = { msgId ->
                    viewModel.deleteMessage(msgId)
                },
                onMediaClick = { clickedMsg ->
                    navController.navigate("media_viewer/${clickedMsg.id}/${chat?.contactName ?: "Contact"}")
                },
                onCameraClick = {
                    navController.navigate("full_camera?chatId=$chatId&isStatus=false")
                },
                onToggleMuteChat = { cId ->
                    viewModel.toggleMuteChat(cId)
                },
                onClearChat = {
                    viewModel.clearChat(chatId)
                },
                onChatRead = {
                    viewModel.resetChatUnreadCount(chatId)
                }
            )
        }

        // 3. Status Viewer Screen
        composable("status_viewer") {
            StatusViewerScreen(
                statuses = statuses,
                initialStatus = activeStatusForViewer,
                onCloseClick = { navController.popBackStack() },
                onReplyToStatus = { targetStatus, replyText ->
                    if (targetStatus.contactId.isNotEmpty()) {
                        val targetChat = allChatsList.firstOrNull { it.contactId == targetStatus.contactId }
                        if (targetChat != null) {
                            viewModel.sendMessage(targetChat.id, "Replied to status: \"$replyText\"", "TEXT", "", 0)
                        }
                    }
                },
                onStatusViewed = { statusId ->
                    viewModel.markStatusViewed(statusId)
                },
                onViewersClick = { statusId ->
                    navController.navigate("status_viewers/$statusId")
                }
            )
        }

        // 3.1 Status Viewers List Screen
        composable(
            route = "status_viewers/{statusId}",
            arguments = listOf(navArgument("statusId") { type = NavType.StringType })
        ) { backStackEntry ->
            val statusId = backStackEntry.arguments?.getString("statusId") ?: ""
            val targetStatus = statuses.firstOrNull { it.id == statusId } ?: statuses.firstOrNull { it.isMyStatus }
            val viewers = viewModel.getStatusViewers(statusId)

            StatusViewersScreen(
                status = targetStatus,
                viewers = viewers,
                onBackClick = { navController.popBackStack() },
                onViewerClick = { contactId ->
                    val matchingChat = allChatsList.firstOrNull { it.contactId == contactId }
                    if (matchingChat != null) {
                        navController.navigate("chat/${matchingChat.id}")
                    } else {
                        val contact = contacts.firstOrNull { it.id == contactId }
                        if (contact != null) {
                            viewModel.createNewContact(contact.name, contact.phoneNumber, contact.aboutStatus) { newContactId ->
                                val newChat = allChatsList.firstOrNull { it.contactId == newContactId }
                                if (newChat != null) {
                                    navController.navigate("chat/${newChat.id}")
                                }
                            }
                        }
                    }
                },
                onDeleteStatus = { sId ->
                    viewModel.deleteStatus(sId)
                }
            )
        }

        // 4. Create Text Status Screen (Pencil Button)
        composable("create_text_status") {
            CreateStatusScreen(
                onBackClick = { navController.popBackStack() },
                onPostStatus = { caption, colorHex, songTitle, songArtist, songPreviewUrl, offsetX, offsetY ->
                    viewModel.postStatus(caption, "TEXT", colorHex, "", songTitle, songArtist, songPreviewUrl, offsetX, offsetY)
                }
            )
        }

        composable("create_status") {
            CreateStatusScreen(
                onBackClick = { navController.popBackStack() },
                onPostStatus = { caption, colorHex, songTitle, songArtist, songPreviewUrl, offsetX, offsetY ->
                    viewModel.postStatus(caption, "TEXT", colorHex, "", songTitle, songArtist, songPreviewUrl, offsetX, offsetY)
                }
            )
        }

        // 4.1 Create Photo Status Screen (Camera Button)
        composable("create_photo_status") {
            FullCameraExperienceScreen(
                onBackClick = { navController.popBackStack() },
                onMediaCaptured = { uri, caption, track, offsetX, offsetY, type ->
                    viewModel.postStatus(
                        caption ?: "",
                        type,
                        "#000000",
                        uri.toString(),
                        track?.title,
                        track?.artist,
                        track?.previewUrl,
                        offsetX,
                        offsetY
                    )
                    navController.popBackStack()
                }
            )
        }

        // 4.2 Full Camera Experience (Video + Music + Chat/Status)
        composable(
            route = "full_camera?chatId={chatId}&isStatus={isStatus}",
            arguments = listOf(
                navArgument("chatId") { type = NavType.StringType; defaultValue = "" },
                navArgument("isStatus") { type = NavType.BoolType; defaultValue = true }
            )
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId") ?: ""
            val isStatus = backStackEntry.arguments?.getBoolean("isStatus") ?: true

            FullCameraExperienceScreen(
                onBackClick = { navController.popBackStack() },
                onMediaCaptured = { uri, caption, track, offsetX, offsetY, type ->
                    if (isStatus) {
                        viewModel.postStatus(
                            caption ?: "",
                            type,
                            "#000000",
                            uri.toString(),
                            track?.title,
                            track?.artist,
                            track?.previewUrl,
                            offsetX,
                            offsetY
                        )
                    } else if (chatId != "") {
                        viewModel.sendMessage(
                            chatId,
                            caption ?: "",
                            type,
                            uri.toString(),
                            0, // Duration
                            null // ReplyTo
                        )
                    }
                    navController.popBackStack()
                }
            )
        }

        // 5. Select Contact Screen
        composable("select_contact") {
            SelectContactScreen(
                contacts = contacts,
                isSyncing = isSyncingContacts,
                syncStatusMessage = syncStatusMessage,
                onBackClick = { navController.popBackStack() },
                onContactSelect = { contact ->
                    val existingChat = allChatsList.firstOrNull { it.contactId == contact.id || it.contactName == contact.name }
                    if (existingChat != null) {
                        navController.navigate("chat/${existingChat.id}") {
                            popUpTo("main")
                        }
                    } else {
                        viewModel.createNewContact(contact.name, contact.phoneNumber, contact.aboutStatus) { newContactId ->
                            val newChat = allChatsList.firstOrNull { it.contactId == newContactId }
                            if (newChat != null) {
                                navController.navigate("chat/${newChat.id}") {
                                    popUpTo("main")
                                }
                            } else {
                                navController.popBackStack()
                            }
                        }
                    }
                },
                onNewGroupClick = { navController.navigate("new_group") },
                onNewContactClick = { navController.navigate("new_contact") },
                onQrScanClick = { navController.navigate("qr_scanner") },
                onSyncPhoneNumbers = { numbers ->
                    viewModel.syncContacts(numbers)
                }
            )
        }

        // 6. New Contact Screen
        composable("new_contact") {
            NewContactScreen(
                onBackClick = { navController.popBackStack() },
                onSaveContact = { name, phone, about ->
                    viewModel.createNewContact(name, phone, about) {
                        navController.popBackStack()
                    }
                }
            )
        }

        // 7. New Group Screen
        composable("new_group") {
            NewGroupScreen(
                contacts = contacts,
                onBackClick = { navController.popBackStack() },
                onCreateGroup = { groupName, selectedIds ->
                    viewModel.createGroupChat(groupName, selectedIds) { newChatId ->
                        navController.navigate("chat/$newChatId") {
                            popUpTo("main")
                        }
                    }
                }
            )
        }

        // 7.1 Create Community Screen
        composable("create_community") {
            CreateCommunityScreen(
                onBackClick = { navController.popBackStack() },
                onCreateCommunity = { name, description, avatarUrl ->
                    viewModel.createCommunity(name, description, avatarUrl) { _ ->
                        navController.popBackStack()
                    }
                }
            )
        }

        // 8. Contact Info Screen
        composable(
            route = "contact_info/{chatId}",
            arguments = listOf(navArgument("chatId") { type = NavType.StringType })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId") ?: ""
            val chat = allChatsList.firstOrNull { it.id == chatId }
            val contact = contacts.firstOrNull { it.id == chat?.contactId }
            val chatMessagesFlow = remember(chatId) { viewModel.getMessagesForChat(chatId) }
            val chatMessages by chatMessagesFlow.collectAsState(initial = emptyList())

            ContactInfoScreen(
                chat = chat,
                contact = contact,
                messages = chatMessages,
                onBackClick = { navController.popBackStack() },
                onVoiceCallClick = {
                    if (chat != null) {
                        viewModel.logCall(chat.contactId, chat.contactName, "VOICE", false, false)
                        navController.navigate("call/${chat.contactId}/false")
                    }
                },
                onVideoCallClick = {
                    if (chat != null) {
                        viewModel.logCall(chat.contactId, chat.contactName, "VIDEO", false, false)
                        navController.navigate("call/${chat.contactId}/true")
                    }
                },
                onStarredMessagesClick = { navController.navigate("starred_messages") },
                onMediaItemClick = { clickedMsg ->
                    navController.navigate("media_viewer/${clickedMsg.id}/${chat?.contactName ?: contact?.name ?: "Contact"}")
                },
                onAllMediaClick = {
                    navController.navigate("shared_media/$chatId")
                },
                onToggleMuteChat = { cId ->
                    viewModel.toggleMuteChat(cId)
                },
                onClearChatClick = { viewModel.clearChat(chatId) },
                onDeleteChatClick = {
                    viewModel.deleteChat(chatId)
                    navController.popBackStack("main", false)
                }
            )
        }
        
        // 8c. Shared Media, Links & Docs Screen
        composable(
            route = "shared_media/{chatId}",
            arguments = listOf(navArgument("chatId") { type = NavType.StringType })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId") ?: ""
            val chat = allChatsList.firstOrNull { it.id == chatId }
            val messagesFlow = remember(chatId) { viewModel.getMessagesForChat(chatId) }
            val messages by messagesFlow.collectAsState(initial = emptyList())
            
            SharedMediaScreen(
                contactName = chat?.contactName ?: "Shared Media",
                messages = messages,
                onBackClick = { navController.popBackStack() },
                onMediaItemClick = { message ->
                    navController.navigate("media_viewer/${message.id}/${chat?.contactName ?: "Contact"}")
                }
            )
        }

        // 8b. Media Viewer Overlay Modal
        dialog(
            route = "media_viewer/{messageId}/{contactName}",
            arguments = listOf(
                navArgument("messageId") { type = NavType.StringType },
                navArgument("contactName") { type = NavType.StringType }
            ),
            dialogProperties = androidx.compose.ui.window.DialogProperties(
                usePlatformDefaultWidth = false,
                decorFitsSystemWindows = false
            )
        ) { backStackEntry ->
            val messageId = backStackEntry.arguments?.getString("messageId") ?: ""
            val contactName = backStackEntry.arguments?.getString("contactName") ?: "Contact"
            var message by remember { mutableStateOf<MessageEntity?>(null) }
            LaunchedEffect(messageId) {
                message = viewModel.getMessageById(messageId)
            }
            if (message != null) {
                MediaViewerScreen(
                    message = message,
                    contactName = contactName,
                    onBackClick = { navController.popBackStack() },
                    onForwardClick = { msg ->
                        navController.navigate("forward_message/${msg.id}")
                    },
                    onToggleStar = { msg ->
                        viewModel.toggleStarMessage(msg)
                    }
                )
            }
        }

        // 9. Starred Messages Screen
        composable("starred_messages") {
            StarredMessagesScreen(
                messages = starredMessages,
                isDarkMode = isDarkMode,
                onBackClick = { navController.popBackStack() },
                onToggleStarMessage = { msg -> viewModel.toggleStarMessage(msg) }
            )
        }

        // 10. Call Screen
        composable(
            route = "call/{contactId}/{isVideo}",
            arguments = listOf(
                navArgument("contactId") { type = NavType.StringType },
                navArgument("isVideo") { type = NavType.BoolType }
            )
        ) { backStackEntry ->
            val contactId = backStackEntry.arguments?.getString("contactId") ?: ""
            val isVideo = backStackEntry.arguments?.getBoolean("isVideo") ?: false
            val contact = contacts.firstOrNull { it.id == contactId }

            CallScreen(
                contact = contact,
                isVideoCall = isVideo,
                onEndCallClick = { navController.popBackStack() }
            )
        }

        // 11. Settings Screen
        composable("settings") {
            SettingsScreen(
                isDarkMode = isDarkMode,
                userName = currentUserName,
                userPhone = currentUserPhone,
                googleEmail = currentGoogleEmail,
                isVerified = isVerified,
                onBackClick = { navController.popBackStack() },
                onToggleDarkMode = { viewModel.toggleDarkMode() },
                onLogoutClick = {
                    viewModel.logoutUser()
                    navController.navigate("auth") {
                        popUpTo("main") { inclusive = true }
                    }
                },
                onProfileClick = {
                    navController.navigate("user_profile/ME")
                },
                onWallpaperClick = {
                    navController.navigate("wallpaper_settings?chatId=GLOBAL")
                },
                onGoogleAuthClick = {
                    navController.navigate("google_auth")
                },
                onBackendSyncClick = {
                    navController.navigate("backend_sync")
                },
                onQrScanClick = {
                    navController.navigate("qr_scanner")
                },
                onGetBadgeClick = {
                    navController.navigate("verification_checkout")
                },
                onViewBadgeReceiptClick = {
                    navController.navigate("badges_receipt")
                }
            )
        }

        // Green Verification Badge Checkout ($3.00)
        composable("verification_checkout") {
            VerificationCheckoutScreen(
                onBack = { navController.popBackStack() },
                onPaymentSuccess = {
                    navController.navigate("badges_receipt") {
                        popUpTo("verification_checkout") { inclusive = true }
                    }
                },
                onProcessPayment = { provider, onComplete ->
                    viewModel.processVerificationPayment(provider, onComplete)
                }
            )
        }

        // Green Verification Badge Status & Receipts
        composable("badges_receipt") {
            BadgesReceiptScreen(
                badgeStatus = badgeStatus,
                userName = currentUserName,
                onBack = { navController.popBackStack() },
                onGetBadgeClick = {
                    navController.navigate("verification_checkout")
                }
            )
        }

        // 11c. Backend & Cloud Synchronization Screen
        composable("backend_sync") {
            BackendSyncScreen(
                currentPhone = currentUserPhone,
                currentName = currentUserName,
                currentEmail = currentGoogleEmail,
                authProvider = currentAuthProvider,
                authToken = viewModel.getAuthToken(),
                isDarkMode = isDarkMode,
                onBackClick = { navController.popBackStack() },
                onManualSyncAll = {
                    viewModel.syncEverythingWithBackend()
                }
            )
        }

        // 11b. Google Authentication & Cloud Services Screen
        composable("google_auth") {
            GoogleServiceAuthScreen(
                currentGoogleEmail = currentGoogleEmail,
                currentUserPhone = currentUserPhone,
                currentUserName = currentUserName,
                authProvider = currentAuthProvider,
                onBackClick = { navController.popBackStack() },
                onLinkGoogleAccount = { email, name ->
                    viewModel.loginWithGoogle(email, name, null, currentUserPhone)
                },
                onUnlinkGoogleAccount = {
                    viewModel.updateUserProfile(
                        name = currentUserName,
                        about = currentUserStatus,
                        phoneNumber = currentUserPhone
                    )
                }
            )
        }
        
        // Status Privacy Screen
        composable("status_privacy") {
            val currentMode by viewModel.statusPrivacyMode.collectAsState()
            val excludedIds by viewModel.statusPrivacyExcludedIds.collectAsState()
            val includedIds by viewModel.statusPrivacyIncludedIds.collectAsState()

            StatusPrivacyScreen(
                contacts = contacts,
                currentMode = currentMode,
                initialExcludedIds = excludedIds,
                initialIncludedIds = includedIds,
                onBackClick = { navController.popBackStack() },
                onSavePrivacy = { mode, excluded, included ->
                    viewModel.updateStatusPrivacy(mode, excluded, included)
                }
            )
        }

        // Wallpaper Settings Screen
        composable(
            route = "wallpaper_settings?chatId={chatId}",
            arguments = listOf(navArgument("chatId") { 
                type = NavType.StringType
                defaultValue = "GLOBAL" 
            })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId") ?: "GLOBAL"
            val chat = if (chatId != "GLOBAL") allChatsList.firstOrNull { it.id == chatId } else null
            
            val chatWallpapersMap by viewModel.chatWallpapers.collectAsState()
            val globalWall by viewModel.globalWallpaper.collectAsState()
            val initialDimming by viewModel.wallpaperDimming.collectAsState()
            
            val initialWallpaper = if (chatId != "GLOBAL") (chatWallpapersMap[chatId] ?: globalWall) else globalWall

            WallpaperSettingsScreen(
                chatId = if (chatId == "GLOBAL") null else chatId,
                contactName = chat?.contactName ?: "Global (All Chats)",
                initialWallpaper = initialWallpaper,
                initialDimming = initialDimming,
                isDarkMode = isDarkMode,
                onBackClick = { navController.popBackStack() },
                onSaveWallpaper = { chatIdVal, wallpaperVal, dimVal ->
                    viewModel.setChatWallpaper(chatIdVal, wallpaperVal, dimVal)
                }
            )
        }

        // 12. QR Code Scanner Screen
        composable("qr_scanner") {
            QrScannerScreen(
                onQrScanned = { result ->
                    viewModel.handleScannedQr(result) { chatId ->
                        if (chatId != null) {
                            navController.navigate("chat/$chatId") {
                                popUpTo("main")
                            }
                        } else {
                            navController.popBackStack()
                        }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        // 12. User Profile Screen (Read & Write)
        composable(
            route = "user_profile/{contactId}",
            arguments = listOf(navArgument("contactId") { type = NavType.StringType })
        ) { backStackEntry ->
            val contactId = backStackEntry.arguments?.getString("contactId") ?: "ME"
            val contact = contacts.firstOrNull { it.id == contactId }
            val isCurrentUser = (contactId == "ME" || contact == null)
            val effectiveContactName = if (isCurrentUser) currentUserName else (contact?.name ?: "Contact")
            val effectivePhone = if (isCurrentUser) currentUserPhone else (contact?.phoneNumber ?: "+1 555-0100")
            val effectiveAvatar = if (isCurrentUser) "" else (contact?.avatarUrl ?: "")
            val effectiveStatus = if (isCurrentUser) currentUserStatus else (contact?.aboutStatus ?: "Hey there! I am using VIBEZ.")

            val effectiveVerified = if (isCurrentUser) isVerified else (contact?.isVerified == true)

            UserProfileScreen(
                contactId = contactId,
                contactName = effectiveContactName,
                contactPhone = effectivePhone,
                contactAvatar = effectiveAvatar,
                contactStatus = effectiveStatus,
                isCurrentUser = isCurrentUser,
                isVerified = effectiveVerified,
                onBackClick = { navController.popBackStack() },
                onUpdateProfile = { newName, newPhone, newStatus, newAvatar ->
                    viewModel.updateCurrentUserProfile(newName, newPhone, newStatus, newAvatar)
                },
                onUpdateContact = { cId, newName, newPhone, newAbout ->
                    viewModel.updateContact(cId, newName, newPhone, newAbout)
                },
                onGetBadgeClick = {
                    navController.navigate("verification_checkout")
                },
                onViewBadgeReceiptClick = {
                    navController.navigate("badges_receipt")
                },
                onMessageClick = {
                    val matchingChat = allChatsList.firstOrNull { it.contactId == contactId }
                    if (matchingChat != null) {
                        navController.navigate("chat/${matchingChat.id}")
                    } else if (contact != null) {
                        viewModel.createNewContact(contact.name, contact.phoneNumber, contact.aboutStatus) { newContactId ->
                            val newChat = allChatsList.firstOrNull { it.contactId == newContactId }
                            if (newChat != null) {
                                navController.navigate("chat/${newChat.id}")
                            } else {
                                navController.popBackStack()
                            }
                        }
                    }
                },
                onVoiceCallClick = {
                    viewModel.logCall(contactId, effectiveContactName, "VOICE", false, false)
                    navController.navigate("call/$contactId/false")
                },
                onVideoCallClick = {
                    viewModel.logCall(contactId, effectiveContactName, "VIDEO", false, false)
                    navController.navigate("call/$contactId/true")
                },
                onQrScanClick = {
                    navController.navigate("qr_scanner")
                },
                onMediaClick = {
                    val chatId = allChatsList.firstOrNull { it.contactId == contactId }?.id
                    if (chatId != null) {
                        navController.navigate("shared_media/$chatId")
                    } else {
                        // If no chat exists yet, maybe just show empty media or do nothing
                        // For simplicity, navigate with a special ID or handle in screen
                        navController.navigate("shared_media/NONE")
                    }
                }
            )
        }
    }

    // Active In-App Notification Card Overlay (Heads-Up Banner)
    activeNotification?.let { notif ->
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 48.dp)
                .zIndex(99f)
                .align(Alignment.TopCenter)
        ) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        navController.navigate("chat/${notif.chatId}")
                        activeNotification = null
                    }
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AvatarView(
                        name = notif.contactName,
                        avatarUrl = notif.contactAvatar,
                        size = 40.dp
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = notif.contactName,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = notif.content,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    IconButton(onClick = { activeNotification = null }) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Dismiss",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    // Incoming Call Overlay
    incomingCallOffer?.let { offerPair ->
        IncomingCallOverlay(
            callerName = offerPair.first,
            isVideo = true, // Default to video for now or parse from offer
            onAccept = {
                // Navigate to Call Screen with the offer
                val contact = contacts.firstOrNull { it.name == offerPair.first }
                val contactId = contact?.id ?: ""
                videoCallViewModel.clearIncomingCall()
                navController.navigate("call/$contactId/true")
            },
            onReject = {
                videoCallViewModel.clearIncomingCall()
            }
        )
    }
}
}
