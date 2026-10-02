package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.border
import androidx.compose.ui.platform.LocalContext
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.data.ChatEntity
import com.example.data.ContactEntity
import com.example.data.MessageEntity
import com.example.ui.components.AvatarView
import com.example.ui.components.VerifiedBadge
import com.example.ui.components.VerifiedBadgePill
import com.example.ui.theme.WhatsAppEmerald

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactInfoScreen(
    chat: ChatEntity?,
    contact: ContactEntity?,
    messages: List<MessageEntity> = emptyList(),
    onBackClick: () -> Unit,
    onVoiceCallClick: () -> Unit,
    onVideoCallClick: () -> Unit,
    onStarredMessagesClick: () -> Unit,
    onMediaItemClick: (MessageEntity) -> Unit = {},
    onAllMediaClick: () -> Unit = {},
    onToggleMuteChat: (String) -> Unit = {},
    onClearChatClick: () -> Unit,
    onDeleteChatClick: () -> Unit,
    onReportClick: (String, String) -> Unit = { _, _ -> },
    onToggleGroupVerifyPerk: () -> Unit = {},
    groupMembers: List<ContactEntity> = emptyList(),
    currentUserId: String = "",
    onUpdateGroup: (String?, String?) -> Unit = { _, _ -> },
    onMemberClick: (String) -> Unit = {},
    onAddMember: () -> Unit = {}
) {
    val isGroupChat = chat?.isGroup == true
    val isChannel = isGroupChat && chat?.isOfficial == true

    var isMuted by remember { mutableStateOf(chat?.isMuted == true) }
    var showEditNameDialog by remember { mutableStateOf(false) }
    var newGroupName by remember { mutableStateOf(chat?.contactName ?: "") }

    val context = LocalContext.current
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri ->
            uri?.let {
                onUpdateGroup(null, it.toString())
            }
        }
    )

    LaunchedEffect(chat?.isMuted) {
        isMuted = chat?.isMuted == true
    }

    if (showEditNameDialog) {
        AlertDialog(
            onDismissRequest = { showEditNameDialog = false },
            title = { Text(if (isChannel) "Edit Channel Name" else "Edit Group Name") },
            text = {
                TextField(
                    value = newGroupName,
                    onValueChange = { newGroupName = it },
                    placeholder = { Text("Enter group name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    onUpdateGroup(newGroupName, null)
                    showEditNameDialog = false
                }) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditNameDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    val displayName = chat?.contactName?.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
        ?: contact?.name?.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
        ?: contact?.phoneNumber?.takeIf { it.isNotBlank() }
        ?: chat?.contactName?.takeIf { it.isNotBlank() }
        ?: contact?.name?.takeIf { it.isNotBlank() }
        ?: "User"

    val displayAvatar = contact?.avatarUrl?.takeIf { it.isNotBlank() }
        ?: chat?.contactAvatar?.takeIf { it.isNotBlank() }
        ?: ""

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = if (isChannel) "Channel info" else if (isGroupChat) "Group info" else "Contact info", fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Header Profile Info
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(contentAlignment = Alignment.BottomEnd) {
                        AvatarView(
                            name = displayName,
                            avatarUrl = displayAvatar,
                            isGroup = isGroupChat,
                            isOfficial = isChannel,
                            isVerified = isChannel || chat?.isVerified == true || contact?.isVerified == true,
                            size = 110.dp
                        )
                        if (isGroupChat || isChannel) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(WhatsAppEmerald)
                                    .clickable {
                                        photoPickerLauncher.launch(
                                            androidx.activity.result.PickVisualMediaRequest(
                                                ActivityResultContracts.PickVisualMedia.ImageOnly
                                            )
                                        )
                                    }
                                    .border(2.dp, MaterialTheme.colorScheme.surface, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CameraAlt,
                                    contentDescription = "Change photo",
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable(enabled = isGroupChat || isChannel) { showEditNameDialog = true }
                    ) {
                        Text(
                            text = displayName,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        if (isGroupChat || isChannel) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Edit name",
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        if (isChannel || chat?.isVerified == true || contact?.isVerified == true) {
                            Spacer(modifier = Modifier.width(6.dp))
                            VerifiedBadge(size = 22.dp)
                        }
                    }
                    if (isChannel) {
                        Spacer(modifier = Modifier.height(6.dp))
                        VerifiedBadgePill(label = "Official Verified Broadcast Channel")
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (isChannel) {
                            "Public Broadcast Channel"
                        } else if (isGroupChat) {
                            "Group Chat"
                        } else {
                            contact?.phoneNumber?.takeIf { it.isNotBlank() } ?: ""
                        },
                        fontSize = 15.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Quick Action Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        if (!isChannel && !isGroupChat) {
                            QuickInfoAction(icon = Icons.Default.Call, label = "Audio", onClick = onVoiceCallClick)
                            QuickInfoAction(icon = Icons.Default.Videocam, label = "Video", onClick = onVideoCallClick)
                        }
                        QuickInfoAction(icon = Icons.Default.Search, label = "Search") {}
                    }
                }
                HorizontalDivider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
            }

            // About status or Group description
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = if (isChannel) {
                            "Official announcements, notifications and critical system updates. Only channel admins can post to this channel."
                        } else if (isGroupChat) {
                            "Welcome to the group chat! Share files, images, links and chat live with other group members."
                        } else {
                            contact?.aboutStatus?.takeIf { it.isNotBlank() } ?: "Hey there! I am using VIBEZ."
                        },
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (isChannel) "Channel description" else if (isGroupChat) "Group description" else "About",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
                HorizontalDivider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
            }

            // Media, links, and docs
            item {
                val mediaMessages = remember(messages) {
                    messages.filter { it.messageType != "TEXT" && it.messageType != "SYSTEM" }
                }
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 14.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onAllMediaClick() }
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Media, links, and docs",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = mediaMessages.size.toString(),
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                contentDescription = "View media",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    if (mediaMessages.isEmpty()) {
                        Text(
                            text = "No media, links, or docs shared yet",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                    } else {
                        LazyRow(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(mediaMessages) { msg ->
                                Card(
                                    modifier = Modifier
                                        .size(72.dp)
                                        .clickable { onMediaItemClick(msg) },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                                ) {
                                    Box(
                                        modifier = Modifier.fillMaxSize(),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        when (msg.messageType) {
                                            "IMAGE" -> {
                                                AsyncImage(
                                                    model = msg.mediaUrl,
                                                    contentDescription = "Shared photo",
                                                    modifier = Modifier.fillMaxSize(),
                                                    contentScale = ContentScale.Crop
                                                )
                                            }
                                            else -> {
                                                Icon(
                                                    imageVector = when(msg.messageType) {
                                                        "VIDEO" -> Icons.Default.PlayArrow
                                                        "AUDIO" -> Icons.Default.Mic
                                                        else -> Icons.Default.Description
                                                    },
                                                    contentDescription = null,
                                                    tint = Color.Gray
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                HorizontalDivider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
            }

            // Participants section (for groups)
            if (isGroupChat && groupMembers.isNotEmpty()) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 14.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${groupMembers.size} participants",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "Search members",
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        // Add Participants Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onAddMember() }
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(WhatsAppEmerald),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PersonAdd,
                                    contentDescription = "Add",
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Text(
                                text = "Add participants",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                color = WhatsAppEmerald
                            )
                        }

                        groupMembers.forEach { member ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onMemberClick(member.id) }
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AvatarView(
                                    name = member.name,
                                    avatarUrl = member.avatarUrl,
                                    size = 40.dp,
                                    isVerified = member.isVerified
                                )
                                Spacer(modifier = Modifier.width(14.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = member.name,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        maxLines = 1
                                    )
                                    Text(
                                        text = member.aboutStatus,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                    HorizontalDivider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
                }
            }

            // Mute and other settings
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            isMuted = !isMuted
                            chat?.let { onToggleMuteChat(it.id) }
                        }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.NotificationsOff, contentDescription = "Mute", tint = Color.Gray)
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(text = "Mute notifications", fontSize = 16.sp, modifier = Modifier.weight(1f))
                    Switch(
                        checked = isMuted,
                        onCheckedChange = {
                            isMuted = it
                            chat?.let { onToggleMuteChat(it.id) }
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = WhatsAppEmerald)
                    )
                }
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.Lock, contentDescription = "Encryption", tint = Color.Gray)
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "Encryption", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        Text(text = "Messages and calls are end-to-end encrypted. Tap to verify.", fontSize = 13.sp, color = Color.Gray)
                    }
                }
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onStarredMessagesClick)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.Star, contentDescription = "Starred", tint = Color.Gray)
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(text = "Starred messages", fontSize = 16.sp)
                }
                
                HorizontalDivider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
            }

            // Destructive Actions
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onDeleteChatClick)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = Color.Red)
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(
                        text = when {
                            isChannel -> "Delete channel"
                            isGroupChat -> "Exit group"
                            else -> "Delete chat"
                        },
                        fontSize = 16.sp,
                        color = Color.Red,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (!isGroupChat && !isChannel) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { /* Block logic */ }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.Block, contentDescription = "Block", tint = Color.Red)
                        Spacer(modifier = Modifier.width(16.dp))
                        Text(text = "Block contact", fontSize = 16.sp, color = Color.Red, fontWeight = FontWeight.Bold)
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                val targetId = chat?.contactId?.takeIf { it.isNotBlank() } ?: contact?.id ?: ""
                                val targetName = displayName
                                onReportClick(targetId, targetName)
                            }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.Warning, contentDescription = "Report", tint = Color.Red)
                        Spacer(modifier = Modifier.width(16.dp))
                        Text(text = "Report contact", fontSize = 16.sp, color = Color.Red, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun QuickInfoAction(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = WhatsAppEmerald.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(imageVector = icon, contentDescription = label, tint = WhatsAppEmerald)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = label, fontSize = 12.sp, color = WhatsAppEmerald, fontWeight = FontWeight.Bold)
        }
    }
}
