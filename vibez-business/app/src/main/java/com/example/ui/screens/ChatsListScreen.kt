package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import com.example.data.ChatEntity
import com.example.data.ContactEntity
import com.example.data.GroupEntity
import com.example.data.ChannelEntity
import com.example.data.toChatEntity
import com.example.ui.components.AvatarView
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.Divider
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.testTag
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.VerifiedBadge
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalPrimary

@Composable
fun ChatsListScreen(
    chats: List<ChatEntity>,
    contacts: List<ContactEntity> = emptyList(),
    groups: List<com.example.data.GroupEntity> = emptyList(),
    channels: List<com.example.data.ChannelEntity> = emptyList(),
    typingChatId: String? = null,
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    onChatClick: (String) -> Unit,
    onNewChatClick: () -> Unit,
    onAiChatClick: () -> Unit = {},
    onAvatarClick: (String) -> Unit = {},
    onDeleteChat: (String) -> Unit = {},
    onDeleteChatsBulk: (List<String>) -> Unit = {},
    onMuteChatsBulk: (List<String>) -> Unit = {},
    onPinChatsBulk: (List<String>) -> Unit = {},
    onMarkReadChatsBulk: (List<String>) -> Unit = {},
    onBroadcastMessage: (List<String>, String) -> Unit = { _, _ -> },
    onBusinessToolsClick: () -> Unit = {},
    onLabelsClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var selectedCategory by remember { mutableStateOf("All") }
    var chatToDelete by remember { mutableStateOf<ChatEntity?>(null) }
    
    // Multi-Selection State
    var selectedChatIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    val isSelectionMode = selectedChatIds.isNotEmpty()

    // Bulk Delete Dialog State
    var showBulkDeleteDialog by remember { mutableStateOf(false) }

    // Broadcast Message Dialog State
    var showBroadcastDialog by remember { mutableStateOf(false) }
    var broadcastText by remember { mutableStateOf("") }

    if (chatToDelete != null) {
        val target = chatToDelete!!
        AlertDialog(
            onDismissRequest = { chatToDelete = null },
            icon = {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(28.dp)
                )
            },
            title = {
                Text(
                    text = "Delete chat?",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Text(
                    text = "Are you sure you want to delete this chat with \"${target.contactName}\"? Messages and media will be permanently removed from this device and the database.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val id = target.id
                        chatToDelete = null
                        onDeleteChat(id)
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete chat", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { chatToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showBulkDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showBulkDeleteDialog = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(28.dp)
                )
            },
            title = {
                Text(
                    text = "Delete ${selectedChatIds.size} chats?",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Text(
                    text = "Are you sure you want to delete these ${selectedChatIds.size} selected chats? All messages, media, and cached histories will be permanently removed from this device.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDeleteChatsBulk(selectedChatIds.toList())
                        selectedChatIds = emptySet()
                        showBulkDeleteDialog = false
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete All", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showBulkDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showBroadcastDialog) {
        AlertDialog(
            onDismissRequest = { showBroadcastDialog = false },
            title = {
                Text(
                    text = "Broadcast to ${selectedChatIds.size} chats",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column {
                    Text(
                        text = "This will forward/send a message directly to all selected recipients individually.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    OutlinedTextField(
                        value = broadcastText,
                        onValueChange = { broadcastText = it },
                        placeholder = { Text("Type broadcast message...") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 4,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WhatsAppMinimalPrimary,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                        )
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (broadcastText.isNotBlank()) {
                            onBroadcastMessage(selectedChatIds.toList(), broadcastText)
                            broadcastText = ""
                            selectedChatIds = emptySet()
                            showBroadcastDialog = false
                        }
                    },
                    enabled = broadcastText.isNotBlank()
                ) {
                    Text("Send Broadcast", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showBroadcastDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    val categories = listOf("All", "Unread", "New customer", "New order", "Pending payment", "Paid", "Order complete", "Groups", "Pinned")

    val filteredChats = remember(chats, groups, selectedCategory, searchQuery) {
        val baseChats = when (selectedCategory) {
            "Groups" -> groups.map { it.toChatEntity() }
            else -> chats + groups.map { it.toChatEntity() }
        }

        baseChats.filter { chat ->
            val matchesCategory = when (selectedCategory) {
                "Unread" -> chat.unreadCount > 0
                "Pinned" -> chat.isPinned
                "Groups" -> chat.isGroup
                "New customer", "New order", "Pending payment", "Paid", "Order complete" -> {
                    // Match chat name/contact hash or content to the selected business label filter
                    (chat.id.hashCode() % 5) == when (selectedCategory) {
                        "New customer" -> 0
                        "New order" -> 1
                        "Pending payment" -> 2
                        "Paid" -> 3
                        else -> 4
                    }
                }
                else -> true
            }
            val matchesQuery = if (searchQuery.isBlank()) true else {
                chat.contactName.contains(searchQuery, ignoreCase = true) ||
                        chat.lastMessage.contains(searchQuery, ignoreCase = true)
            }
            matchesCategory && matchesQuery
        }.sortedByDescending { it.lastMessageTime }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            if (!isSelectionMode) {
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.padding(bottom = 12.dp, end = 4.dp)
                ) {
                    // Vibez AI FAB: Positioned directly on top of the New Chat button
                    FloatingActionButton(
                        onClick = onAiChatClick,
                        containerColor = MaterialTheme.colorScheme.surface,
                        contentColor = Color.Unspecified,
                        shape = CircleShape,
                        modifier = Modifier
                            .size(48.dp)
                            .border(
                                width = 2.dp,
                                brush = Brush.sweepGradient(
                                    listOf(
                                        Color(0xFF00A884), // Emerald
                                        Color(0xFF6366F1), // Indigo
                                        Color(0xFFEC4899), // Pink
                                        Color(0xFF3B82F6), // Blue
                                        Color(0xFF00A884)
                                    )
                                ),
                                shape = CircleShape
                            )
                            .testTag("vibez_ai_fab"),
                        elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 4.dp)
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = "Vibez Ai",
                                tint = Color(0xFF6366F1),
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }

                    // New Chat Button (contacts)
                    FloatingActionButton(
                        onClick = onNewChatClick,
                        containerColor = WhatsAppMinimalAccent,
                        contentColor = Color.White,
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.testTag("new_chat_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Chat,
                            contentDescription = "New chat"
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Contextual Selection Bar (CAB) for Multi-Selection
            AnimatedVisibility(
                visible = isSelectionMode,
                enter = slideInVertically() + fadeIn(),
                exit = slideOutVertically() + fadeOut()
            ) {
                Surface(
                    color = WhatsAppMinimalPrimary,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 6.dp),
                    shadowElevation = 4.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = { selectedChatIds = emptySet() }) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Clear Selection",
                                    tint = Color.White
                                )
                            }
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "${selectedChatIds.size} Selected",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Pin
                            IconButton(
                                onClick = {
                                    onPinChatsBulk(selectedChatIds.toList())
                                    selectedChatIds = emptySet()
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PushPin,
                                    contentDescription = "Toggle Pin Selected",
                                    tint = Color.White
                                )
                            }

                            // Mute
                            IconButton(
                                onClick = {
                                    onMuteChatsBulk(selectedChatIds.toList())
                                    selectedChatIds = emptySet()
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.VolumeOff,
                                    contentDescription = "Toggle Mute Selected",
                                    tint = Color.White
                                )
                            }

                            // Mark Read
                            IconButton(
                                onClick = {
                                    onMarkReadChatsBulk(selectedChatIds.toList())
                                    selectedChatIds = emptySet()
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.DoneAll,
                                    contentDescription = "Mark Selected as Read",
                                    tint = Color.White
                                )
                            }

                            // Broadcast / Forward custom message
                            IconButton(
                                onClick = {
                                    showBroadcastDialog = true
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.Send,
                                    contentDescription = "Forward or Broadcast Message",
                                    tint = Color.White
                                )
                            }

                            // Delete
                            IconButton(
                                onClick = {
                                    showBulkDeleteDialog = true
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete Selected",
                                    tint = Color.White
                                )
                            }
                        }
                    }
                }
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 20.dp)
            ) {
                // 0. Search Bar (Integrated, only show if not in selection mode to avoid confusion)
                if (!isSelectionMode) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = onSearchQueryChange,
                                placeholder = { Text("Search name or message...", fontSize = 14.sp) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(26.dp),
                                singleLine = true,
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Search,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                        modifier = Modifier.size(20.dp)
                                    )
                                },
                                trailingIcon = if (searchQuery.isNotEmpty()) {
                                    {
                                        Icon(
                                            imageVector = Icons.Default.Close,
                                            contentDescription = "Clear",
                                            modifier = Modifier
                                                .size(18.dp)
                                                .clickable { onSearchQueryChange("") },
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                } else null,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color.Transparent,
                                    unfocusedBorderColor = Color.Transparent,
                                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                                )
                            )
                        }
                    }
                }

                // 0.5. Premium Merchant CRM & Analytics Dashboard Panel (Vibez Business Core)
                if (!isSelectionMode && searchQuery.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = WhatsAppMinimalPrimary.copy(alpha = 0.08f)
                            ),
                            border = androidx.compose.foundation.BorderStroke(
                                width = 1.dp,
                                color = WhatsAppMinimalPrimary.copy(alpha = 0.15f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                // Header row
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(Color(0xFF10B981))
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Vibez Merchant Console",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = WhatsAppMinimalPrimary
                                        )
                                    }
                                    Text(
                                        text = "Live Sync Active",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF10B981)
                                    )
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // Sales & CRM KPI Analytics Row
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text("Pending Orders", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text("12 Active", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onSurface)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Response Speed", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text("99% Elite", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF10B981))
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Active Funnel", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text("CRM Enabled", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = WhatsAppMinimalPrimary)
                                    }
                                }

                                Spacer(modifier = Modifier.height(14.dp))
                                Divider(color = WhatsAppMinimalPrimary.copy(alpha = 0.1f))
                                Spacer(modifier = Modifier.height(10.dp))

                                // CRM Quick Tools Shortcuts
                                Text(
                                    text = "QUICK CRM SUITE SHORTCUTS",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                    letterSpacing = 0.5.sp
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    // Catalog Shortcut
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = MaterialTheme.colorScheme.surface,
                                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { onBusinessToolsClick() }
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(vertical = 8.dp, horizontal = 10.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.Center
                                        ) {
                                            Icon(Icons.Default.ShoppingBag, contentDescription = null, tint = WhatsAppMinimalPrimary, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Catalog", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    // Chat Labels Shortcut
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = MaterialTheme.colorScheme.surface,
                                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { onLabelsClick() }
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(vertical = 8.dp, horizontal = 10.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.Center
                                        ) {
                                            Icon(Icons.Default.Label, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Labels", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    // Suite Settings Shortcut
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = MaterialTheme.colorScheme.surface,
                                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { onBusinessToolsClick() }
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(vertical = 8.dp, horizontal = 10.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.Center
                                        ) {
                                            Icon(Icons.Default.Settings, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Suite", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 1. Category Filter Pills (Only show if not in selection mode)
                if (!isSelectionMode) {
                    item {
                        LazyRow(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 10.dp),
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            items(categories) { category ->
                                val isSelected = (selectedCategory == category)
                                val chipColor = when (category) {
                                    "New customer" -> Color(0xFF00A884)
                                    "New order" -> Color(0xFFF59E0B)
                                    "Pending payment" -> Color(0xFFEF4444)
                                    "Paid" -> Color(0xFF10B981)
                                    "Order complete" -> Color(0xFF3B82F6)
                                    else -> WhatsAppMinimalPrimary
                                }
                                Surface(
                                    shape = RoundedCornerShape(20.dp),
                                    color = if (isSelected) chipColor else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                    contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.clickable { selectedCategory = category }
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
                                    ) {
                                        if (category in listOf("New customer", "New order", "Pending payment", "Paid", "Order complete")) {
                                            Box(
                                                modifier = Modifier
                                                    .size(8.dp)
                                                    .clip(CircleShape)
                                                    .background(if (isSelected) Color.White else chipColor)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                        }
                                        Text(
                                            text = category,
                                            fontSize = 13.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // 2. Conversations Feed
                if (filteredChats.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(280.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.Chat,
                                    contentDescription = "No chats",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                                    modifier = Modifier.size(54.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = if (searchQuery.isBlank()) "No $selectedCategory conversations" else "No matches for \"$searchQuery\"",
                                    fontSize = 15.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    items(filteredChats, key = { it.id }) { chat ->
                        val isSelected = selectedChatIds.contains(chat.id)
                        VibezChatItemCard(
                            chat = chat,
                            contacts = contacts,
                            typingChatId = typingChatId,
                            isSelected = isSelected,
                            isSelectionMode = isSelectionMode,
                            onClick = {
                                if (isSelectionMode) {
                                    selectedChatIds = if (isSelected) {
                                        selectedChatIds - chat.id
                                    } else {
                                        selectedChatIds + chat.id
                                    }
                                } else {
                                    onChatClick(chat.id)
                                }
                            },
                            onLongClick = {
                                if (!isSelectionMode) {
                                    selectedChatIds = setOf(chat.id)
                                }
                            },
                            onAvatarClick = { onAvatarClick(chat.id) }
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun VibezChatItemCard(
    chat: ChatEntity,
    contacts: List<ContactEntity> = emptyList(),
    typingChatId: String? = null,
    isSelected: Boolean = false,
    isSelectionMode: Boolean = false,
    onClick: () -> Unit,
    onLongClick: () -> Unit = {},
    onAvatarClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 5.dp)
            .combinedClickable(
                onClick = onClick,
                onLongClick = onLongClick
            ),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) {
                WhatsAppMinimalPrimary.copy(alpha = 0.15f)
            } else {
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
            }
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Multi-Select Checkbox Indicator
            if (isSelectionMode) {
                Checkbox(
                    checked = isSelected,
                    onCheckedChange = { onClick() },
                    colors = CheckboxDefaults.colors(
                        checkedColor = WhatsAppMinimalPrimary,
                        uncheckedColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    ),
                    modifier = Modifier.padding(end = 6.dp)
                )
            }

            val contact = contacts.firstOrNull {
                chat.contactId.isNotBlank() && (it.id == chat.contactId || it.remoteId == chat.contactId)
            }
            val isOnline = contact?.isOnline == true
            val displayName = chat.contactName.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                ?: contact?.name?.takeIf { it.isNotBlank() }
                ?: chat.contactName.ifBlank { "Contact" }
            val displayAvatar = chat.contactAvatar.ifBlank { contact?.avatarUrl ?: "" }
            val isChannel = chat.isGroup && chat.isOfficial

            // Avatar with Active Indicator - Clicking Avatar opens User Profile
            Box(
                modifier = Modifier.clickable(onClick = onAvatarClick)
            ) {
                AvatarView(
                    name = displayName,
                    avatarUrl = displayAvatar,
                    isGroup = chat.isGroup,
                    isOfficial = isChannel,
                    isVerified = chat.isVerified || isChannel || contact?.isVerified == true,
                    isOnline = isOnline,
                    size = 52.dp
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            // Main Message Content
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = displayName,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (chat.isVerified || isChannel || contact?.isVerified == true) {
                            Spacer(modifier = Modifier.width(4.dp))
                            VerifiedBadge(size = 18.dp)
                        }
                    }

                    val timeFormat = java.text.SimpleDateFormat("h:mm a", java.util.Locale.getDefault())
                    val formattedTime = timeFormat.format(java.util.Date(chat.lastMessageTime))

                    Text(
                        text = formattedTime,
                        fontSize = 12.sp,
                        fontWeight = if (chat.unreadCount > 0) FontWeight.Bold else FontWeight.Medium,
                        color = if (chat.unreadCount > 0) WhatsAppMinimalAccent else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val isTyping = (typingChatId == chat.id)
                    val displayMessage = if (isTyping) "typing..." else {
                        when {
                            chat.lastMessage.startsWith("📍 ") -> "📍 Location"
                            chat.lastMessage.startsWith("👤 ") -> "👤 Contact: ${chat.lastMessage.substringBefore("\n").removePrefix("👤 ")}"
                            else -> chat.lastMessage
                        }
                    }
                    Text(
                        text = displayMessage,
                        fontSize = 14.sp,
                        fontWeight = if (isTyping) FontWeight.Bold else FontWeight.Normal,
                        color = if (isTyping) WhatsAppMinimalPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (chat.isPinned) {
                            Icon(
                                imageVector = Icons.Default.PushPin,
                                contentDescription = "Pinned",
                                tint = WhatsAppMinimalAccent,
                                modifier = Modifier.size(15.dp)
                            )
                        }

                        if (chat.isMuted) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.VolumeOff,
                                contentDescription = "Muted",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                                modifier = Modifier.size(15.dp)
                            )
                        }

                        if (chat.unreadCount > 0) {
                            Surface(
                                color = WhatsAppMinimalAccent,
                                shape = CircleShape
                            ) {
                                Text(
                                    text = chat.unreadCount.toString(),
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
