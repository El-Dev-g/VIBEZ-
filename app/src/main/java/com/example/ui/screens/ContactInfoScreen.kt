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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.NotificationsOff
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Photo
import androidx.compose.runtime.LaunchedEffect
import coil.compose.AsyncImage
import com.example.data.ChatEntity
import com.example.data.ContactEntity
import com.example.data.MessageEntity
import com.example.ui.components.AvatarView
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
    onDeleteChatClick: () -> Unit
) {
    var isMuted by remember { mutableStateOf(chat?.isMuted == true) }

    LaunchedEffect(chat?.isMuted) {
        isMuted = chat?.isMuted == true
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = "Contact info", fontSize = 18.sp, fontWeight = FontWeight.Bold) },
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
                    AvatarView(
                        name = chat?.contactName ?: contact?.name ?: "Contact",
                        avatarUrl = chat?.contactAvatar ?: contact?.avatarUrl ?: "",
                        isGroup = chat?.isGroup == true,
                        size = 110.dp
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = chat?.contactName ?: contact?.name ?: "Contact",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = contact?.phoneNumber ?: "+1 555-0100",
                        fontSize = 15.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Quick Action Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        QuickInfoAction(icon = Icons.Default.Call, label = "Audio", onClick = onVoiceCallClick)
                        QuickInfoAction(icon = Icons.Default.Videocam, label = "Video", onClick = onVideoCallClick)
                        QuickInfoAction(icon = Icons.Default.Search, label = "Search") {}
                    }
                }
                Divider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
            }

            // About status
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = contact?.aboutStatus ?: "Hey there! I am using VIBEZ.",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "About",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
                Divider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
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
                            .clickable {
                                onAllMediaClick()
                            }
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
                                                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                                                )
                                            }
                                            "VOICE" -> {
                                                Icon(
                                                    imageVector = Icons.Default.Mic,
                                                    contentDescription = "Voice note",
                                                    tint = WhatsAppEmerald,
                                                    modifier = Modifier.size(28.dp)
                                                )
                                            }
                                            "DOCUMENT" -> {
                                                Icon(
                                                    imageVector = Icons.Default.Description,
                                                    contentDescription = "Shared document",
                                                    tint = WhatsAppEmerald,
                                                    modifier = Modifier.size(28.dp)
                                                )
                                            }
                                            "LOCATION" -> {
                                                Icon(
                                                    imageVector = Icons.Default.LocationOn,
                                                    contentDescription = "Shared location",
                                                    tint = WhatsAppEmerald,
                                                    modifier = Modifier.size(28.dp)
                                                )
                                            }
                                            else -> {
                                                Icon(
                                                    imageVector = Icons.Default.Photo,
                                                    contentDescription = "Media file",
                                                    tint = WhatsAppEmerald,
                                                    modifier = Modifier.size(28.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                Divider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
            }

            // Settings options list
            item {
                // Mute
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val target = !isMuted
                            isMuted = target
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
                        onCheckedChange = { checked ->
                            isMuted = checked
                            chat?.let { onToggleMuteChat(it.id) }
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = WhatsAppEmerald)
                    )
                }

                // Encryption
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

                // Disappearing messages
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.Timer, contentDescription = "Disappearing", tint = Color.Gray)
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "Disappearing messages", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        Text(text = "Off", fontSize = 13.sp, color = Color.Gray)
                    }
                }

                // Starred messages
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

                Divider(thickness = 8.dp, color = MaterialTheme.colorScheme.surfaceVariant)
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
                    Text(text = "Delete chat", fontSize = 16.sp, color = Color.Red, fontWeight = FontWeight.Bold)
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.Block, contentDescription = "Block", tint = Color.Red)
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(text = "Block contact", fontSize = 16.sp, color = Color.Red, fontWeight = FontWeight.Bold)
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
