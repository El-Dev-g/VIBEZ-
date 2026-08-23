package com.example.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Reply
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Done
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.MessageEntity
import com.example.ui.theme.WhatsAppBubbleReceived
import com.example.ui.theme.WhatsAppBubbleSent
import com.example.ui.theme.WhatsAppCheckBlue
import com.example.ui.theme.WhatsAppDarkBubbleReceived
import com.example.ui.theme.WhatsAppDarkBubbleSent
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MessageBubble(
    message: MessageEntity,
    quotedMessage: MessageEntity? = null,
    contactName: String = "Contact",
    isDarkMode: Boolean = false,
    onLongClick: () -> Unit = {},
    onClick: () -> Unit = {},
    onReply: (MessageEntity) -> Unit = {},
    onQuotedClick: (Long) -> Unit = {},
    onMediaClick: (MessageEntity) -> Unit = {}
) {
    if (message.messageType == "SYSTEM") {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 24.dp),
            contentAlignment = Alignment.Center
        ) {
            Surface(
                color = if (isDarkMode) Color(0xFF182229) else Color(0xFFF0F2F5),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("system_message_${message.id}")
            ) {
                Text(
                    text = message.content,
                    fontSize = 11.sp,
                    color = if (isDarkMode) Color(0xFF8696A0) else Color(0xFF667781),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    fontWeight = FontWeight.Medium
                )
            }
        }
        return
    }

    val isSentByMe = message.senderId == 0L
    val coroutineScope = rememberCoroutineScope()
    val offsetX = remember { Animatable(0f) }

    val bubbleBg = when {
        isSentByMe -> if (isDarkMode) WhatsAppDarkBubbleSent else WhatsAppBubbleSent
        else -> if (isDarkMode) WhatsAppDarkBubbleReceived else WhatsAppBubbleReceived
    }

    val alignment = if (isSentByMe) Alignment.CenterEnd else Alignment.CenterStart
    val shape = if (isSentByMe) {
        RoundedCornerShape(topStart = 14.dp, topEnd = 2.dp, bottomStart = 14.dp, bottomEnd = 14.dp)
    } else {
        RoundedCornerShape(topStart = 2.dp, topEnd = 14.dp, bottomStart = 14.dp, bottomEnd = 14.dp)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 10.dp, vertical = 3.dp)
            .testTag("message_bubble_${message.id}")
            .pointerInput(message.id) {
                detectHorizontalDragGestures(
                    onHorizontalDrag = { change, dragAmount ->
                        change.consume()
                        coroutineScope.launch {
                            // User requested "Slider to left to reply specific message"
                            // Also support slight swipe for intuitive gesture
                            val newOffset = (offsetX.value + dragAmount).coerceIn(-180f, 60f)
                            offsetX.snapTo(newOffset)
                        }
                    },
                    onDragEnd = {
                        coroutineScope.launch {
                            if (offsetX.value < -80f) {
                                onReply(message)
                            }
                            offsetX.animateTo(0f, animationSpec = spring(dampingRatio = 0.7f, stiffness = 400f))
                        }
                    },
                    onDragCancel = {
                        coroutineScope.launch {
                            offsetX.animateTo(0f, animationSpec = spring(dampingRatio = 0.7f, stiffness = 400f))
                        }
                    }
                )
            },
        contentAlignment = alignment
    ) {
        // Reply indicator revealed on drag to left
        if (offsetX.value < -20f) {
            val replyProgress = (-offsetX.value / 80f).coerceIn(0f, 1f)
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 6.dp)
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(WhatsAppMinimalPrimary.copy(alpha = 0.15f + 0.85f * replyProgress)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Reply,
                    contentDescription = "Reply",
                    tint = if (replyProgress >= 0.9f) Color.White else WhatsAppMinimalPrimary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        Column(
            modifier = Modifier
                .offset { IntOffset(offsetX.value.roundToInt(), 0) }
                .widthIn(max = 310.dp)
                .clip(shape)
                .background(bubbleBg)
                .combinedClickable(
                    onClick = onClick,
                    onLongClick = onLongClick
                )
                .padding(horizontal = 9.dp, vertical = 6.dp)
        ) {
            // Quoted Reply Preview
            if (quotedMessage != null) {
                val quotedIsMe = quotedMessage.senderId == 0L
                val quotedSender = if (quotedIsMe) "You" else contactName
                val quoteAccentColor = if (quotedIsMe) WhatsAppMinimalPrimary else Color(0xFF00897B)

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.65f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 6.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .combinedClickable(onClick = { onQuotedClick(quotedMessage.id) })
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Colored vertical accent line
                        Box(
                            modifier = Modifier
                                .width(4.dp)
                                .height(36.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(quoteAccentColor)
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = quotedSender,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = quoteAccentColor,
                                maxLines = 1
                            )
                            Spacer(modifier = Modifier.height(1.dp))
                            Text(
                                text = when (quotedMessage.messageType) {
                                    "IMAGE" -> "📷 Photo"
                                    "VOICE" -> "🎤 Voice note"
                                    "DOCUMENT" -> "📄 Document"
                                    "LOCATION" -> "📍 Location"
                                    "CONTACT" -> "👤 Contact"
                                    else -> quotedMessage.content
                                },
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }

            // Main Message Content according to Type
            when (message.messageType) {
                "IMAGE" -> {
                    if (message.mediaUrl.isNotBlank()) {
                        val imageModel: Any = remember(message.mediaUrl) {
                            val f = File(message.mediaUrl)
                            if (f.exists()) f else message.mediaUrl
                        }
                        AsyncImage(
                            model = imageModel,
                            contentDescription = "Image attachment",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .combinedClickable(
                                    onClick = { onMediaClick(message) },
                                    onLongClick = onLongClick
                                )
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                    }
                    if (message.content.isNotBlank() && message.content != "Photo") {
                        Text(
                            text = message.content,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                "VOICE" -> {
                    VoiceNotePlayer(
                        durationSeconds = message.voiceDurationSeconds.coerceAtLeast(3),
                        mediaUrl = message.mediaUrl,
                        isSentByMe = isSentByMe
                    )
                }
                "DOCUMENT" -> {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .combinedClickable(
                                onClick = { onMediaClick(message) },
                                onLongClick = onLongClick
                            )
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF7F66FF)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Description,
                                    contentDescription = "Document",
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = message.content.ifBlank { "Document.pdf" },
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "PDF • 2.4 MB",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
                "LOCATION" -> {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF00C853)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = "Location",
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = message.content.ifBlank { "Shared Location" },
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
                "CONTACT" -> {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF0091EA)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = "Contact",
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = message.content.ifBlank { "Contact Card" },
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
                else -> {
                    Text(
                        text = message.content,
                        fontSize = 15.sp,
                        lineHeight = 20.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Message timestamp and status indicators
            Row(
                modifier = Modifier.align(Alignment.End),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.End
            ) {
                if (message.isStarred) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "Starred",
                        tint = Color(0xFFFFB300),
                        modifier = Modifier
                            .size(12.dp)
                            .padding(end = 2.dp)
                    )
                }

                val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
                val formattedTime = timeFormat.format(Date(message.timestamp))

                Text(
                    text = formattedTime,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                )

                if (isSentByMe) {
                    Spacer(modifier = Modifier.width(4.dp))
                    val icon = when (message.status) {
                        "READ" -> Icons.Default.DoneAll
                        "DELIVERED" -> Icons.Default.DoneAll
                        else -> Icons.Default.Done
                    }
                    val tint = if (message.status == "READ") WhatsAppCheckBlue else Color.Gray

                    Icon(
                        imageVector = icon,
                        contentDescription = message.status,
                        tint = tint,
                        modifier = Modifier.size(15.dp)
                    )
                }
            }
        }
    }
}
