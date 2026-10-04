package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.network.QuickReplyDto
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickRepliesScreen(
    onBackClick: () -> Unit,
    replies: List<QuickReplyDto> = emptyList(),
    onAddReply: (shortcut: String, message: String) -> Unit = { _, _ -> },
    onDeleteReply: (id: String) -> Unit = {}
) {
    var showDialog by remember { mutableStateOf(false) }
    var shortcutText by remember { mutableStateOf("") }
    var messageText by remember { mutableStateOf("") }

    val replyList = remember(replies) {
        if (replies.isNotEmpty()) replies else listOf(
            QuickReplyDto(
                id = "qr_1",
                shortcut = "/thanks",
                message = "Thank you for shopping with us! Please let us know if you need anything else."
            ),
            QuickReplyDto(
                id = "qr_2",
                shortcut = "/hours",
                message = "We are open Monday to Friday from 9:00 AM to 6:00 PM."
            ),
            QuickReplyDto(
                id = "qr_3",
                shortcut = "/address",
                message = "Our location: 742 Evergreen Terrace, Suite 100."
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quick replies", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick, modifier = Modifier.testTag("quick_replies_back_btn")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showDialog = true }, modifier = Modifier.testTag("add_quick_reply_top_btn")) {
                        Icon(Icons.Default.Add, contentDescription = "Add")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = WhatsAppMinimalPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_quick_reply_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add quick reply")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Surface(
                    color = WhatsAppMinimalPrimary.copy(alpha = 0.08f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = WhatsAppMinimalPrimary)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "To send a quick reply, type '/' followed by the shortcut in any conversation chat bar.",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            items(replyList) { item ->
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("quick_reply_card_${item.id}"),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(WhatsAppEmerald.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Bolt,
                                contentDescription = null,
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.shortcut,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = WhatsAppMinimalPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = item.message,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        IconButton(onClick = { onDeleteReply(item.id) }) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("Create quick reply") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = shortcutText,
                        onValueChange = { shortcutText = it },
                        label = { Text("Shortcut (e.g. /thanks)") },
                        placeholder = { Text("/thanks") },
                        modifier = Modifier.fillMaxWidth().testTag("input_quick_reply_shortcut")
                    )
                    OutlinedTextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        label = { Text("Reply message *") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth().testTag("input_quick_reply_message")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (messageText.isNotBlank()) {
                            val formatted = if (shortcutText.startsWith("/")) shortcutText else "/${shortcutText.ifBlank { "quick" }}"
                            onAddReply(formatted, messageText)
                            shortcutText = ""
                            messageText = ""
                            showDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_add_quick_reply_btn")
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) { Text("Cancel") }
            }
        )
    }
}
