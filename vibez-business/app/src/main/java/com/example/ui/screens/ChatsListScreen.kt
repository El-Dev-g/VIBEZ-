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
    chatLabels: List<com.example.data.network.ChatLabelDto> = emptyList(),
    orderMessages: List<com.example.data.MessageEntity> = emptyList(),
    onToggleChatLabel: (String, String) -> Unit = { _, _ -> },
    modifier: Modifier = Modifier
) {
    var selectedCategory by remember { mutableStateOf("All") }
    var chatToDelete by remember { mutableStateOf<ChatEntity?>(null) }
    
    // Multi-Selection State
    var selectedChatIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    val isSelectionMode = selectedChatIds.isNotEmpty()

    // Bulk Delete Dialog State
    var showBulkDeleteDialog by remember { mutableStateOf(false) }

    // Label Selected Chats Dialog State
    var showLabelDialog by remember { mutableStateOf(false) }

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

    if (showLabelDialog && isSelectionMode) {
        val availableLabels = remember(chatLabels) {
            if (chatLabels.isNotEmpty()) chatLabels else listOf(
                com.example.data.network.ChatLabelDto(id = "l1", name = "New customer", colorHex = "#00A884"),
                com.example.data.network.ChatLabelDto(id = "l2", name = "New order", colorHex = "#F59E0B"),
                com.example.data.network.ChatLabelDto(id = "l3", name = "Pending payment", colorHex = "#EF4444"),
                com.example.data.network.ChatLabelDto(id = "l4", name = "Paid", colorHex = "#10B981"),
                com.example.data.network.ChatLabelDto(id = "l5", name = "Order complete", colorHex = "#3B82F6")
            )
        }
        AlertDialog(
            onDismissRequest = { showLabelDialog = false },
            title = {
                Text(
                    text = "Label ${selectedChatIds.size} Chat${if (selectedChatIds.size > 1) "s" else ""}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(availableLabels) { label ->
                        val isAllSelected = selectedChatIds.all { label.chatIds.contains(it) }
                        val labelColor = remember(label.colorHex) {
                            try { Color(android.graphics.Color.parseColor(label.colorHex)) } catch (_: Exception) { Color(0xFF00A884) }
                        }
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isAllSelected) labelColor.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedChatIds.forEach { chatId ->
                                        onToggleChatLabel(label.id, chatId)
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(14.dp)
                                        .clip(CircleShape)
                                        .background(labelColor)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = label.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.weight(1f)
                                )
                                Checkbox(
                                    checked = isAllSelected,
                                    onCheckedChange = {
                                        selectedChatIds.forEach { chatId ->
                                            onToggleChatLabel(label.id, chatId)
                                        }
                                    },
                                    colors = CheckboxDefaults.colors(checkedColor = labelColor)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLabelDialog = false
                        selectedChatIds = emptySet()
                    }
                ) {
                    Text("Done", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLabelDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    val defaultCategories = listOf("All", "New order", "Pending payment", "Paid", "Order complete", "Unread", "New customer", "Groups", "Pinned")
    val customCategories = remember(chatLabels) {
        chatLabels.map { it.name }.filter { name -> defaultCategories.none { it.equals(name, ignoreCase = true) } }
    }
    val categories = remember(customCategories) {
        defaultCategories + customCategories
    }

    fun chatMatchesLabel(chat: ChatEntity, labelName: String): Boolean {
        return chatLabels.any { 
            it.name.equals(labelName, ignoreCase = true) && 
            (it.chatIds.contains(chat.id) || 
             (chat.remoteId != null && it.chatIds.contains(chat.remoteId)) ||
             (chat.contactId.isNotBlank() && it.chatIds.contains(chat.contactId)))
        }
    }

    fun getChatOrderStatus(chat: ChatEntity): String? {
        val orderMsg = orderMessages.firstOrNull { 
            it.chatId == chat.id || 
            (chat.remoteId != null && it.chatId == chat.remoteId) ||
            (chat.contactId.isNotBlank() && (it.chatId == chat.contactId || it.senderId == chat.contactId))
        }
        if (orderMsg != null) {
            try {
                if (orderMsg.mediaUrl.isNotBlank()) {
                    val json = org.json.JSONObject(orderMsg.mediaUrl)
                    val st = json.optString("status", "").uppercase().replace(" ", "_")
                    if (st.isNotBlank()) return st
                }
            } catch (_: Exception) {}
            val mc = orderMsg.content
            val contentStatus = when {
                mc.contains("Status: Completed", ignoreCase = true) || mc.contains("Order Fulfilled", ignoreCase = true) -> "COMPLETED"
                mc.contains("Status: Paid", ignoreCase = true) -> "PAID"
                mc.contains("Status: Out for Delivery", ignoreCase = true) -> "OUT_FOR_DELIVERY"
                mc.contains("Status: Preparing", ignoreCase = true) -> "PREPARING"
                mc.contains("Status: Confirmed", ignoreCase = true) -> "CONFIRMED"
                mc.contains("Status: Pending Payment", ignoreCase = true) -> "PENDING_PAYMENT"
                mc.contains("Status: Cancelled", ignoreCase = true) -> "CANCELLED"
                else -> null
            }
            if (contentStatus != null) return contentStatus
        }
        val lm = chat.lastMessage
        val lastMsgStatus = when {
            lm.contains("Order complete", ignoreCase = true) || lm.contains("Order Fulfilled", ignoreCase = true) || lm.contains("Completed", ignoreCase = true) -> "COMPLETED"
            lm.contains("Paid", ignoreCase = true) -> "PAID"
            lm.contains("Out for Delivery", ignoreCase = true) || lm.contains("OUT_FOR_DELIVERY", ignoreCase = true) -> "OUT_FOR_DELIVERY"
            lm.contains("Preparing", ignoreCase = true) -> "PREPARING"
            lm.contains("Confirmed", ignoreCase = true) -> "CONFIRMED"
            lm.contains("Pending Payment", ignoreCase = true) || lm.contains("PENDING_PAYMENT", ignoreCase = true) -> "PENDING_PAYMENT"
            lm.contains("Order Inquiry", ignoreCase = true) || lm.startsWith("🛒") || lm.contains("#ORD-") -> "PENDING"
            else -> null
        }
        if (lastMsgStatus != null) return lastMsgStatus

        return when {
            chatMatchesLabel(chat, "Order complete") -> "COMPLETED"
            chatMatchesLabel(chat, "Paid") -> "PAID"
            chatMatchesLabel(chat, "Pending payment") -> "PENDING_PAYMENT"
            chatMatchesLabel(chat, "New order") -> "PENDING"
            else -> null
        }
    }

    val allDisplayChats = remember(chats, groups) {
        chats + groups.map { it.toChatEntity() }
    }

    fun isChatMatchingCategory(chat: ChatEntity, category: String): Boolean {
        return when (category) {
            "All" -> true
            "Unread" -> chat.unreadCount > 0
            "Pinned" -> chat.isPinned
            "Groups" -> chat.isGroup
            "New order" -> {
                val status = getChatOrderStatus(chat)
                chatMatchesLabel(chat, "New order") || status == "PENDING"
            }
            "Pending payment" -> {
                val status = getChatOrderStatus(chat)
                chatMatchesLabel(chat, "Pending payment") || status in listOf("CONFIRMED", "PREPARING", "PENDING_PAYMENT")
            }
            "Paid" -> {
                val status = getChatOrderStatus(chat)
                chatMatchesLabel(chat, "Paid") || status in listOf("PAID", "OUT_FOR_DELIVERY")
            }
            "Order complete" -> {
                val status = getChatOrderStatus(chat)
                chatMatchesLabel(chat, "Order complete") || status == "COMPLETED"
            }
            "New customer" -> {
                val isRecent = !chat.isGroup && (System.currentTimeMillis() - chat.lastMessageTime < 14 * 86400000L)
                chatMatchesLabel(chat, "New customer") || isRecent
            }
            else -> chatMatchesLabel(chat, category)
        }
    }

    val categoryCounts = remember(allDisplayChats, categories, chatLabels, orderMessages) {
        categories.associateWith { cat ->
            if (cat == "All") allDisplayChats.size
            else allDisplayChats.count { isChatMatchingCategory(it, cat) }
        }
    }

    val filteredChats = remember(allDisplayChats, selectedCategory, searchQuery, chatLabels, orderMessages) {
        val baseChats = when (selectedCategory) {
            "Groups" -> groups.map { it.toChatEntity() }
            else -> allDisplayChats
        }

        baseChats.filter { chat ->
            val matchesCategory = isChatMatchingCategory(chat, selectedCategory)
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

                            // Label Selected Chats
                            IconButton(
                                onClick = {
                                    showLabelDialog = true
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Label,
                                    contentDescription = "Label Selected Chats",
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
                                val count = categoryCounts[category] ?: 0
                                val chipColor = when (category) {
                                    "New customer" -> Color(0xFF00A884)
                                    "New order" -> Color(0xFFF59E0B)
                                    "Pending payment" -> Color(0xFFEF4444)
                                    "Paid" -> Color(0xFF10B981)
                                    "Order complete" -> Color(0xFF3B82F6)
                                    else -> {
                                        val custom = chatLabels.firstOrNull { it.name.equals(category, ignoreCase = true) }
                                        if (custom != null) {
                                            try { Color(android.graphics.Color.parseColor(custom.colorHex)) } catch (_: Exception) { WhatsAppMinimalPrimary }
                                        } else WhatsAppMinimalPrimary
                                    }
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
                                        val hasColorDot = category in listOf("New customer", "New order", "Pending payment", "Paid", "Order complete") ||
                                                chatLabels.any { it.name.equals(category, ignoreCase = true) }
                                        if (hasColorDot) {
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
                                        if (count > 0 && category != "All") {
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Surface(
                                                shape = CircleShape,
                                                color = if (isSelected) Color.White.copy(alpha = 0.25f) else chipColor.copy(alpha = 0.15f),
                                                contentColor = if (isSelected) Color.White else chipColor
                                            ) {
                                                Text(
                                                    text = count.toString(),
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                                                )
                                            }
                                        }
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
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.padding(horizontal = 24.dp)
                            ) {
                                val (emptyIcon, emptyTitle, emptySubtitle) = when (selectedCategory) {
                                    "New order" -> Triple(
                                        Icons.Default.ShoppingBag,
                                        "No New Orders",
                                        "Incoming order inquiries from customers will appear here."
                                    )
                                    "Pending payment" -> Triple(
                                        Icons.Default.FilterList,
                                        "No Orders Pending Payment",
                                        "Orders awaiting customer payment will appear here."
                                    )
                                    "Paid" -> Triple(
                                        Icons.Default.Check,
                                        "No Paid Orders",
                                        "Orders with confirmed payments will appear here."
                                    )
                                    "Order complete" -> Triple(
                                        Icons.Default.DoneAll,
                                        "No Completed Orders",
                                        "Fulfilled and completed orders will appear here."
                                    )
                                    "New customer" -> Triple(
                                        Icons.Default.Storefront,
                                        "No New Customers",
                                        "Conversations from new customer inquiries will appear here."
                                    )
                                    "Unread" -> Triple(
                                        Icons.AutoMirrored.Filled.Chat,
                                        "No Unread Chats",
                                        "All customer conversations are caught up."
                                    )
                                    "Groups" -> Triple(
                                        Icons.AutoMirrored.Filled.Chat,
                                        "No Group Chats",
                                        "Groups will appear here."
                                    )
                                    "Pinned" -> Triple(
                                        Icons.Default.PushPin,
                                        "No Pinned Chats",
                                        "Long-press a conversation and tap Pin to keep it at the top."
                                    )
                                    else -> Triple(
                                        Icons.AutoMirrored.Filled.Chat,
                                        if (searchQuery.isBlank()) "No $selectedCategory conversations" else "No matches found",
                                        if (searchQuery.isBlank()) "Conversations labeled \"$selectedCategory\" will appear here." else "No chats matching \"$searchQuery\"."
                                    )
                                }
                                Icon(
                                    imageVector = emptyIcon,
                                    contentDescription = emptyTitle,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                                    modifier = Modifier.size(52.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = emptyTitle,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = emptySubtitle,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
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
                            chatLabels = chatLabels,
                            orderStatus = getChatOrderStatus(chat),
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
    chatLabels: List<com.example.data.network.ChatLabelDto> = emptyList(),
    orderStatus: String? = null,
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

                // Order Status & Label Badges Row
                val assignedLabels = remember(chatLabels, chat.id) {
                    chatLabels.filter { it.chatIds.contains(chat.id) || (chat.remoteId != null && it.chatIds.contains(chat.remoteId)) }
                }
                if (orderStatus != null || assignedLabels.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Order Status Pill
                        if (orderStatus != null) {
                            val (badgeText, badgeBg, badgeTextColor) = when (orderStatus) {
                                "PENDING" -> Triple("New order", Color(0xFFFEF3C7), Color(0xFFD97706))
                                "CONFIRMED" -> Triple("Confirmed", Color(0xFFE0F2FE), Color(0xFF0284C7))
                                "PREPARING" -> Triple("Preparing", Color(0xFFEDE9FE), Color(0xFF6D28D9))
                                "PENDING_PAYMENT" -> Triple("Pending payment", Color(0xFFFEE2E2), Color(0xFFEF4444))
                                "OUT_FOR_DELIVERY" -> Triple("Out for Delivery", Color(0xFFDBEAFE), Color(0xFF2563EB))
                                "COMPLETED" -> Triple("Order complete", Color(0xFFDCFCE7), Color(0xFF15803D))
                                "CANCELLED" -> Triple("Cancelled", Color(0xFFFEE2E2), Color(0xFFDC2626))
                                "PAID" -> Triple("Paid", Color(0xFFDCFCE7), Color(0xFF10B981))
                                else -> Triple(orderStatus, Color(0xFFFEF3C7), Color(0xFFD97706))
                            }
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = badgeBg,
                                contentColor = badgeTextColor
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(CircleShape)
                                            .background(badgeTextColor)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = badgeText,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = badgeTextColor
                                    )
                                }
                            }
                        }

                        // Label Chips
                        assignedLabels.take(3).forEach { label ->
                            val labelColor = remember(label.colorHex) {
                                try { Color(android.graphics.Color.parseColor(label.colorHex)) } catch (_: Exception) { Color(0xFF00A884) }
                            }
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = labelColor.copy(alpha = 0.15f),
                                contentColor = labelColor
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(CircleShape)
                                            .background(labelColor)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = label.name,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = labelColor
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
