package com.example.ui.screens

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.CallMade
import androidx.compose.material.icons.filled.CallReceived
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import android.widget.Toast
import android.content.Intent
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.CallLogEntity
import com.example.ui.components.AvatarView
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalPrimary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun CallsListScreen(
    callLogs: List<CallLogEntity>,
    onStartCallClick: (ContactId: String, isVideo: Boolean) -> Unit,
    onNewCallFabClick: () -> Unit,
    onAvatarClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    var showCallLinkDialog by remember { mutableStateOf(false) }
    var callTypeIsVideo by remember { mutableStateOf(true) }
    val generatedCode = remember { "vibez-" + (100000..999999).random().toString() }
    val linkText = "https://call.vibez.chat/join/$generatedCode?type=${if (callTypeIsVideo) "video" else "voice"}"

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNewCallFabClick,
                containerColor = WhatsAppMinimalAccent,
                contentColor = Color.White,
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Icon(imageVector = Icons.Default.Phone, contentDescription = "New call")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Create call link row
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showCallLinkDialog = true }
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .testTag("create_call_link_row"),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AvatarView(
                        name = "Call link",
                        avatarUrl = "",
                        size = 50.dp
                    )

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Create call link",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Share a link for your WhatsApp call",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                }
            }

            item {
                Text(
                    text = "Recent",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
                )
            }

            if (callLogs.isEmpty()) {
                item {
                    Text(
                        text = "No call history yet",
                        fontSize = 14.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 20.dp)
                    )
                }
            } else {
                items(callLogs) { call ->
                    CallLogItemRow(
                        call = call,
                        onCallClick = { onStartCallClick(call.contactId, call.callType == "VIDEO") },
                        onAvatarClick = { onAvatarClick(call.contactId) }
                    )
                }
            }
        }
    }

    if (showCallLinkDialog) {
        AlertDialog(
            onDismissRequest = { showCallLinkDialog = false },
            title = {
                Text(
                    text = "Create call link",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
            },
            text = {
                Column {
                    Text(
                        text = "People can tap this link to join your Vibez call. Only share it with people you trust.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    androidx.compose.material3.Surface(
                        color = WhatsAppMinimalPrimary.copy(alpha = 0.08f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Link,
                                contentDescription = null,
                                tint = WhatsAppMinimalPrimary,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = linkText,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = WhatsAppMinimalPrimary,
                                maxLines = 2,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Call type",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { callTypeIsVideo = true }
                            .padding(vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = callTypeIsVideo,
                            onClick = { callTypeIsVideo = true },
                            colors = RadioButtonDefaults.colors(selectedColor = WhatsAppMinimalPrimary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Video", fontSize = 15.sp)
                    }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { callTypeIsVideo = false }
                            .padding(vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = !callTypeIsVideo,
                            onClick = { callTypeIsVideo = false },
                            colors = RadioButtonDefaults.colors(selectedColor = WhatsAppMinimalPrimary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Voice", fontSize = 15.sp)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp)
                    ) {
                        androidx.compose.material3.OutlinedButton(
                            onClick = {
                                clipboardManager.setText(AnnotatedString(linkText))
                                Toast.makeText(context, "Link copied to clipboard", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f).testTag("copy_call_link_button"),
                            colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(contentColor = WhatsAppMinimalPrimary)
                        ) {
                            Icon(imageVector = Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Copy link", fontSize = 13.sp)
                        }

                        androidx.compose.material3.Button(
                            onClick = {
                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(Intent.EXTRA_TEXT, "Join my Vibez call: $linkText")
                                }
                                context.startActivity(Intent.createChooser(shareIntent, "Share Call Link"))
                            },
                            modifier = Modifier.weight(1f).testTag("share_call_link_button"),
                            colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                        ) {
                            Icon(imageVector = Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Share link", fontSize = 13.sp, color = Color.White)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showCallLinkDialog = false }, modifier = Modifier.testTag("close_call_link_button")) {
                    Text("Done", color = WhatsAppMinimalPrimary)
                }
            }
        )
    }
}

@Composable
fun CallLogItemRow(
    call: CallLogEntity,
    onCallClick: () -> Unit,
    onAvatarClick: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onCallClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(modifier = Modifier.clickable(onClick = onAvatarClick)) {
                AvatarView(
                    name = call.contactName,
                    avatarUrl = call.contactAvatar,
                    size = 52.dp
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = call.contactName,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (call.isMissed) Color(0xFFEF4444) else MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(2.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    val icon = if (call.isIncoming) Icons.Default.CallReceived else Icons.Default.CallMade
                    val iconTint = if (call.isMissed) Color(0xFFEF4444) else WhatsAppMinimalAccent

                    Icon(
                        imageVector = icon,
                        contentDescription = if (call.isIncoming) "Incoming" else "Outgoing",
                        tint = iconTint,
                        modifier = Modifier.size(16.dp)
                    )

                    Spacer(modifier = Modifier.width(6.dp))

                    val timeFormat = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())
                    Text(
                        text = timeFormat.format(Date(call.timestamp)),
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            IconButton(onClick = onCallClick) {
                Icon(
                    imageVector = if (call.callType == "VIDEO") Icons.Default.Videocam else Icons.Default.Call,
                    contentDescription = "Start Call",
                    tint = WhatsAppMinimalPrimary
                )
            }
        }
        HorizontalDivider(
            modifier = Modifier.padding(start = 84.dp),
            thickness = 0.8.dp,
            color = MaterialTheme.colorScheme.outlineVariant
        )
    }
}
