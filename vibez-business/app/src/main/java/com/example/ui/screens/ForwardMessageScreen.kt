package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.FormatQuote
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ChatEntity
import com.example.data.MessageEntity
import com.example.ui.components.AvatarView
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForwardMessageScreen(
    messageToForward: MessageEntity?,
    chats: List<ChatEntity>,
    onBackClick: () -> Unit,
    onForwardToChats: (targetChatIds: List<String>) -> Unit
) {
    if (messageToForward == null) return

    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedChatIds by remember { mutableStateOf<Set<String>>(emptySet()) }

    val filteredChats = remember(chats, searchQuery) {
        if (searchQuery.isBlank()) chats
        else chats.filter {
            it.contactName.contains(searchQuery, ignoreCase = true) ||
                    it.lastMessage.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Forward to...",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        if (selectedChatIds.isNotEmpty()) {
                            Text(
                                text = "${selectedChatIds.size} ${if (selectedChatIds.size == 1) "chat" else "chats"} selected",
                                fontSize = 12.sp,
                                color = WhatsAppMinimalPrimary,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            AnimatedVisibility(visible = selectedChatIds.isNotEmpty()) {
                FloatingActionButton(
                    onClick = {
                        onForwardToChats(selectedChatIds.toList())
                        Toast.makeText(
                            context,
                            "Forwarded to ${selectedChatIds.size} ${if (selectedChatIds.size == 1) "chat" else "chats"}",
                            Toast.LENGTH_SHORT
                        ).show()
                    },
                    containerColor = WhatsAppMinimalPrimary,
                    contentColor = Color.White,
                    modifier = Modifier.testTag("confirm_forward_fab")
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send forwarded message"
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Forward (${selectedChatIds.size})",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // 1. Message Preview Box
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(WhatsAppMinimalPrimary.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = when (messageToForward.messageType) {
                                    "IMAGE" -> Icons.Default.Image
                                    "VOICE" -> Icons.Default.GraphicEq
                                    "DOCUMENT" -> Icons.Default.Description
                                    "LOCATION" -> Icons.Default.LocationOn
                                    "CONTACT" -> Icons.Default.Person
                                    else -> Icons.Default.FormatQuote
                                },
                                contentDescription = null,
                                tint = WhatsAppMinimalPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Forwarding message:",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = WhatsAppMinimalPrimary
                            )
                            Text(
                                text = when (messageToForward.messageType) {
                                    "IMAGE" -> "📷 Photo"
                                    "VOICE" -> "🎤 Voice note (${messageToForward.voiceDurationSeconds}s)"
                                    "DOCUMENT" -> "📄 ${messageToForward.content}"
                                    "LOCATION" -> "📍 Location"
                                    "CONTACT" -> "👤 Contact Card"
                                    else -> messageToForward.content
                                },
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }

            // 2. Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search chats and contacts...") },
                    singleLine = true,
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Clear")
                            }
                        }
                    },
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = WhatsAppMinimalPrimary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                )
                Spacer(modifier = Modifier.height(6.dp))
            }

            // 3. Section Title
            item {
                Text(
                    text = "RECENT CHATS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp,
                    color = WhatsAppMinimalPrimary,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                )
            }

            // 4. Chats List with selection checkboxes
            items(filteredChats, key = { it.id }) { chat ->
                val isSelected = selectedChatIds.contains(chat.id)

                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            selectedChatIds = if (isSelected) {
                                selectedChatIds - chat.id
                            } else {
                                selectedChatIds + chat.id
                            }
                        }
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(14.dp),
                    color = if (isSelected) WhatsAppMinimalPrimary.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surface
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AvatarView(
                            name = chat.contactName,
                            avatarUrl = chat.contactAvatar,
                            size = 46.dp
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = chat.contactName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = chat.lastMessage,
                                fontSize = 12.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Checkbox(
                            checked = isSelected,
                            onCheckedChange = { checked ->
                                selectedChatIds = if (checked) {
                                    selectedChatIds + chat.id
                                } else {
                                    selectedChatIds - chat.id
                                }
                            },
                            colors = CheckboxDefaults.colors(
                                checkedColor = WhatsAppMinimalPrimary,
                                uncheckedColor = MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            modifier = Modifier.testTag("checkbox_chat_${chat.id}")
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}
