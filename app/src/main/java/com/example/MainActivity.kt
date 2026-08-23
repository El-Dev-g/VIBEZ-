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
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.CallScreen
import com.example.ui.screens.ChatDetailScreen
import com.example.ui.screens.ContactInfoScreen
import com.example.ui.screens.CreateStatusScreen
import com.example.ui.screens.FullCameraExperienceScreen
import com.example.ui.screens.MainTabScreen
import com.example.ui.screens.MediaViewerScreen
import com.example.ui.screens.MyStatusListScreen
import com.example.ui.screens.NewContactScreen
import com.example.ui.screens.NewGroupScreen
import com.example.ui.screens.SelectContactScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.screens.SplashScreen
import com.example.ui.screens.StarredMessagesScreen
import com.example.ui.screens.StatusPrivacyScreen
import com.example.ui.screens.StatusViewerScreen
import com.example.ui.screens.StatusViewersScreen
import com.example.ui.screens.UserProfileScreen
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
    internal fun showSystemNotification(context: Context, title: String, content: String, chatId: Long) {
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
            chatId.toInt(),
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

        notificationManager.notify(chatId.toInt(), notification)
    }
}

@Composable
fun WhatsAppApp(viewModel: WhatsAppViewModel) {
    val navController = rememberNavController()
    val context = LocalContext.current

    val chats by viewModel.filteredChats.collectAsState()
    val allChatsList by viewModel.chats.collectAsState()
    val contacts by viewModel.contacts.collectAsState()
    val statuses by viewModel.statuses.collectAsState()
    val callLogs by viewModel.callLogs.collectAsState()
    val starredMessages by viewModel.starredMessages.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val isDarkMode by viewModel.isDarkMode.collectAsState()

    val isLoggedIn by viewModel.isLoggedIn.collectAsState()
    val currentUserPhone by viewModel.currentUserPhone.collectAsState()
    val currentUserName by viewModel.currentUserName.collectAsState()
    val currentUserStatus by viewModel.currentUserStatus.collectAsState()
    val typingChatId by viewModel.typingChatId.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()

    var activeStatusForViewer by remember { mutableStateOf<StatusEntity?>(null) }
    var activeNotification by remember { mutableStateOf<IncomingNotification?>(null) }

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

        // 0. User Authentication Screen
        composable("auth") {
            AuthScreen(
                onAuthSuccess = { phone, name ->
                    viewModel.loginUser(phone, name)
                    navController.navigate("main") {
                        popUpTo("auth") { inclusive = true }
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
            arguments = listOf(navArgument("chatId") { type = NavType.LongType })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getLong("chatId") ?: 0L
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
                    if (targetStatus.contactId > 0) {
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
            arguments = listOf(navArgument("statusId") { type = NavType.LongType })
        ) { backStackEntry ->
            val statusId = backStackEntry.arguments?.getLong("statusId") ?: 0L
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
                navArgument("chatId") { type = NavType.LongType; defaultValue = -1L },
                navArgument("isStatus") { type = NavType.BoolType; defaultValue = true }
            )
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getLong("chatId") ?: -1L
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
                    } else if (chatId != -1L) {
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
                onBackClick = { navController.popBackStack() },
                onContactSelect = { contact ->
                    val existingChat = allChatsList.firstOrNull { it.contactId == contact.id }
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
                onNewContactClick = { navController.navigate("new_contact") }
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

        // 8. Contact Info Screen
        composable(
            route = "contact_info/{chatId}",
            arguments = listOf(navArgument("chatId") { type = NavType.LongType })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getLong("chatId") ?: 0L
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
                onMediaClick = { clickedMsg ->
                    navController.navigate("media_viewer/${clickedMsg.id}/${chat?.contactName ?: contact?.name ?: "Contact"}")
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

        // 8b. Media Viewer Overlay Modal
        dialog(
            route = "media_viewer/{messageId}/{contactName}",
            arguments = listOf(
                navArgument("messageId") { type = NavType.LongType },
                navArgument("contactName") { type = NavType.StringType }
            ),
            dialogProperties = androidx.compose.ui.window.DialogProperties(
                usePlatformDefaultWidth = false,
                decorFitsSystemWindows = false
            )
        ) { backStackEntry ->
            val messageId = backStackEntry.arguments?.getLong("messageId") ?: 0L
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
                navArgument("contactId") { type = NavType.LongType },
                navArgument("isVideo") { type = NavType.BoolType }
            )
        ) { backStackEntry ->
            val contactId = backStackEntry.arguments?.getLong("contactId") ?: 0L
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
                onBackClick = { navController.popBackStack() },
                onToggleDarkMode = { viewModel.toggleDarkMode() },
                onLogoutClick = {
                    viewModel.logoutUser()
                    navController.navigate("auth") {
                        popUpTo("main") { inclusive = true }
                    }
                },
                onProfileClick = {
                    navController.navigate("user_profile/0")
                },
                onWallpaperClick = {
                    navController.navigate("wallpaper_settings?chatId=0")
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
                type = NavType.LongType
                defaultValue = 0L 
            })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getLong("chatId") ?: 0L
            val chat = if (chatId != 0L) allChatsList.firstOrNull { it.id == chatId } else null
            
            val chatWallpapersMap by viewModel.chatWallpapers.collectAsState()
            val globalWall by viewModel.globalWallpaper.collectAsState()
            val initialDimming by viewModel.wallpaperDimming.collectAsState()
            
            val initialWallpaper = if (chatId != 0L) (chatWallpapersMap[chatId] ?: globalWall) else globalWall

            WallpaperSettingsScreen(
                chatId = if (chatId == 0L) null else chatId,
                contactName = chat?.contactName ?: "Global (All Chats)",
                initialWallpaper = initialWallpaper,
                initialDimming = initialDimming,
                isDarkMode = isDarkMode,
                onBackClick = { navController.popBackStack() },
                onSaveWallpaper = { targetId, wallpaperVal, dimVal ->
                    viewModel.setChatWallpaper(targetId, wallpaperVal, dimVal)
                }
            )
        }

        // 12. User Profile Screen (Read & Write)
        composable(
            route = "user_profile/{contactId}",
            arguments = listOf(navArgument("contactId") { type = NavType.LongType })
        ) { backStackEntry ->
            val contactId = backStackEntry.arguments?.getLong("contactId") ?: 0L
            val contact = contacts.firstOrNull { it.id == contactId }
            val isCurrentUser = (contactId == 0L || contact == null)
            val effectiveContactName = if (isCurrentUser) currentUserName else (contact?.name ?: "Contact")
            val effectivePhone = if (isCurrentUser) currentUserPhone else (contact?.phoneNumber ?: "+1 555-0100")
            val effectiveAvatar = if (isCurrentUser) "" else (contact?.avatarUrl ?: "")
            val effectiveStatus = if (isCurrentUser) currentUserStatus else (contact?.aboutStatus ?: "Hey there! I am using VIBEZ.")

            UserProfileScreen(
                contactId = contactId,
                contactName = effectiveContactName,
                contactPhone = effectivePhone,
                contactAvatar = effectiveAvatar,
                contactStatus = effectiveStatus,
                isCurrentUser = isCurrentUser,
                onBackClick = { navController.popBackStack() },
                onUpdateProfile = { newName, newPhone, newStatus ->
                    viewModel.updateCurrentUserProfile(newName, newPhone, newStatus)
                },
                onUpdateContact = { cId, newName, newPhone, newAbout ->
                    viewModel.updateContact(cId, newName, newPhone, newAbout)
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
}
}
