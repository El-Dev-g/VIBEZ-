package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Update
import androidx.compose.material.icons.outlined.Chat
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material.icons.outlined.Update
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.CallLogEntity
import com.example.data.ChatEntity
import com.example.data.ContactEntity
import com.example.data.StatusEntity
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import com.example.ui.theme.WhatsAppMinimalTextPrimary
import com.example.ui.theme.WhatsAppMinimalTextSecondary
import com.example.ui.theme.WhatsAppTealDark
import com.example.ui.theme.WhatsAppUnreadBadge

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainTabScreen(
    chats: List<ChatEntity>,
    contacts: List<ContactEntity> = emptyList(),
    typingChatId: String? = null,
    statuses: List<StatusEntity>,
    communities: List<com.example.data.CommunityEntity> = emptyList(),
    callLogs: List<CallLogEntity>,
    searchQuery: String,
    selectedTab: Int = 0,
    onTabSelected: (Int) -> Unit = {},
    onSearchQueryChange: (String) -> Unit,
    onChatClick: (String) -> Unit,
    onCommunityClick: (String) -> Unit = onChatClick,
    onCommunityChatClick: (String) -> Unit = {},
    onNewChatClick: () -> Unit,
    onStatusClick: (StatusEntity) -> Unit,
    onCreateTextStatusClick: () -> Unit = {},
    onCreatePhotoStatusClick: () -> Unit = {},
    onCreateStatusClick: () -> Unit = onCreateTextStatusClick,
    onViewersClick: (StatusEntity) -> Unit = {},
    onCreateCommunityClick: () -> Unit = {},
    onStartCallClick: (String, Boolean) -> Unit,
    onSettingsClick: () -> Unit,
    onStarredMessagesClick: () -> Unit,
    onNewGroupClick: () -> Unit,
    onAvatarClick: (String) -> Unit = {},
    onDeleteChat: (String) -> Unit = {},
    onDeleteChatsBulk: (List<String>) -> Unit = {},
    onMuteChatsBulk: (List<String>) -> Unit = {},
    onPinChatsBulk: (List<String>) -> Unit = {},
    onMarkReadChatsBulk: (List<String>) -> Unit = {},
    onBroadcastMessage: (List<String>, String) -> Unit = { _, _ -> },
    onStatusPrivacyClick: () -> Unit = {},
    onMyStatusListClick: () -> Unit = {},
    onClearCallLogs: () -> Unit = {},
    onIncomingCallSimulate: () -> Unit = {}
) {
    var isSearchActive by remember { mutableStateOf(false) }
    var isMenuExpanded by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            Column {
                if (isSearchActive) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surface)
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = onSearchQueryChange,
                            placeholder = { Text("Search chats & messages...") },
                            singleLine = true,
                            leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = "Search") },
                            trailingIcon = {
                                IconButton(onClick = {
                                    onSearchQueryChange("")
                                    isSearchActive = false
                                }) {
                                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close search")
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = WhatsAppEmerald,
                                unfocusedBorderColor = Color.Transparent
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                } else {
                    TopAppBar(
                        title = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(
                                    color = WhatsAppMinimalPrimary,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.padding(end = 10.dp)
                                ) {
                                    Text(
                                        text = "⚡",
                                        fontSize = 14.sp,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                                Text(
                                    text = "VIBEZ",
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        },
                        actions = {
                            IconButton(
                                onClick = { onCreateStatusClick() },
                                modifier = Modifier.testTag("camera_icon_in_nav")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CameraAlt,
                                    contentDescription = "Camera",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            if (selectedTab != 0) {
                                IconButton(
                                    onClick = { isSearchActive = true },
                                    modifier = Modifier.testTag("search_icon_in_nav")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Search,
                                        contentDescription = "Search",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            IconButton(
                                onClick = { onAvatarClick("ME") },
                                modifier = Modifier.testTag("profile_icon_in_nav")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AccountCircle,
                                    contentDescription = "Profile",
                                    tint = WhatsAppMinimalPrimary
                                )
                            }
                            Box {
                                IconButton(onClick = { isMenuExpanded = true }) {
                                    Icon(
                                        imageVector = Icons.Default.MoreVert,
                                        contentDescription = "More options",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                DropdownMenu(
                                    expanded = isMenuExpanded,
                                    onDismissRequest = { isMenuExpanded = false }
                                ) {
                                    when (selectedTab) {
                                        0 -> { // Chats
                                            DropdownMenuItem(
                                                text = { Text("New group") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onNewGroupClick()
                                                }
                                            )
                                            DropdownMenuItem(
                                                text = { Text("Starred messages") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onStarredMessagesClick()
                                                }
                                            )
                                            DropdownMenuItem(
                                                text = { Text("Settings") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onSettingsClick()
                                                }
                                            )
                                        }
                                        1 -> { // Status Updates
                                            DropdownMenuItem(
                                                text = { Text("Status privacy") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onStatusPrivacyClick()
                                                }
                                            )
                                            DropdownMenuItem(
                                                text = { Text("Settings") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onSettingsClick()
                                                }
                                            )
                                        }
                                        2 -> { // Communities
                                            DropdownMenuItem(
                                                text = { Text("New community") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onCreateCommunityClick()
                                                }
                                            )
                                            DropdownMenuItem(
                                                text = { Text("Settings") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onSettingsClick()
                                                }
                                            )
                                        }
                                        3 -> { // Calls
                                            DropdownMenuItem(
                                                text = { Text("Clear call log") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onClearCallLogs()
                                                }
                                            )
                                            DropdownMenuItem(
                                                text = { Text("Settings") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onSettingsClick()
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    )
                }
            }
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 1.dp
            ) {
                val totalUnread = chats.sumOf { it.unreadCount }

                // 0: Chats
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { onTabSelected(0) },
                    icon = {
                        Box {
                            Icon(
                                imageVector = if (selectedTab == 0) Icons.Filled.Chat else Icons.Outlined.Chat,
                                contentDescription = "Chats"
                            )
                            if (totalUnread > 0) {
                                Box(
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clip(CircleShape)
                                        .background(WhatsAppUnreadBadge)
                                        .align(Alignment.TopEnd),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = totalUnread.toString(),
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    },
                    label = { Text("Chats", fontWeight = if (selectedTab == 0) FontWeight.SemiBold else FontWeight.Normal) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = WhatsAppMinimalPrimary,
                        selectedTextColor = WhatsAppMinimalTextPrimary,
                        unselectedIconColor = WhatsAppMinimalTextSecondary,
                        unselectedTextColor = WhatsAppMinimalTextSecondary,
                        indicatorColor = WhatsAppMinimalNavPill
                    )
                )

                // 1: Status
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { onTabSelected(1) },
                    icon = {
                        Icon(
                            imageVector = if (selectedTab == 1) Icons.Filled.Update else Icons.Outlined.Update,
                            contentDescription = "Status"
                        )
                    },
                    label = { Text("Status", fontWeight = if (selectedTab == 1) FontWeight.SemiBold else FontWeight.Normal) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = WhatsAppMinimalPrimary,
                        selectedTextColor = WhatsAppMinimalTextPrimary,
                        unselectedIconColor = WhatsAppMinimalTextSecondary,
                        unselectedTextColor = WhatsAppMinimalTextSecondary,
                        indicatorColor = WhatsAppMinimalNavPill
                    )
                )

                // 2: Communities
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { onTabSelected(2) },
                    icon = {
                        Icon(
                            imageVector = if (selectedTab == 2) Icons.Filled.Groups else Icons.Outlined.Groups,
                            contentDescription = "Communities"
                        )
                    },
                    label = { Text("Communities", fontWeight = if (selectedTab == 2) FontWeight.Bold else FontWeight.Normal) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = WhatsAppMinimalPrimary,
                        selectedTextColor = WhatsAppMinimalTextPrimary,
                        unselectedIconColor = WhatsAppMinimalTextSecondary,
                        unselectedTextColor = WhatsAppMinimalTextSecondary,
                        indicatorColor = WhatsAppMinimalNavPill
                    )
                )

                // 3: Calls
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { onTabSelected(3) },
                    icon = {
                        Icon(
                            imageVector = if (selectedTab == 3) Icons.Filled.Phone else Icons.Outlined.Phone,
                            contentDescription = "Calls"
                        )
                    },
                    label = { Text("Calls", fontWeight = if (selectedTab == 3) FontWeight.Bold else FontWeight.Normal) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = WhatsAppMinimalPrimary,
                        selectedTextColor = WhatsAppMinimalTextPrimary,
                        unselectedIconColor = WhatsAppMinimalTextSecondary,
                        unselectedTextColor = WhatsAppMinimalTextSecondary,
                        indicatorColor = WhatsAppMinimalNavPill
                    )
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                0 -> ChatsListScreen(
                    chats = chats,
                    contacts = contacts,
                    typingChatId = typingChatId,
                    searchQuery = searchQuery,
                    onSearchQueryChange = onSearchQueryChange,
                    onChatClick = onChatClick,
                    onNewChatClick = onNewChatClick,
                    onAvatarClick = onAvatarClick,
                    onDeleteChat = onDeleteChat,
                    onDeleteChatsBulk = onDeleteChatsBulk,
                    onMuteChatsBulk = onMuteChatsBulk,
                    onPinChatsBulk = onPinChatsBulk,
                    onMarkReadChatsBulk = onMarkReadChatsBulk,
                    onBroadcastMessage = onBroadcastMessage
                )
                1 -> StatusListScreen(
                    statuses = statuses,
                    contacts = contacts,
                    chats = chats,
                    onStatusClick = onStatusClick,
                    onCreateTextStatusClick = onCreateTextStatusClick,
                    onCreatePhotoStatusClick = onCreatePhotoStatusClick,
                    onViewersClick = onViewersClick,
                    onStatusPrivacyClick = onStatusPrivacyClick,
                    onMyStatusListClick = onMyStatusListClick
                )
                2 -> CommunitiesScreen(
                    communities = communities,
                    onCreateCommunityClick = onCreateCommunityClick,
                    onCommunityClick = onCommunityClick,
                    onCommunityChatClick = onCommunityChatClick
                )
                3 -> CallsListScreen(
                    callLogs = callLogs,
                    onStartCallClick = onStartCallClick,
                    onNewCallFabClick = onNewChatClick,
                    onAvatarClick = onAvatarClick
                )
            }
        }
    }
}
