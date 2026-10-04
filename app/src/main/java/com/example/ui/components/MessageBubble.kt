package com.example.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
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
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
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
    currentUserId: String = "ME",
    onLongClick: () -> Unit = {},
    onClick: () -> Unit = {},
    onReply: (MessageEntity) -> Unit = {},
    onQuotedClick: (String) -> Unit = {},
    onMediaClick: (MessageEntity) -> Unit = {},
    onVotePoll: (Int) -> Unit = {},
    onTranscribeVoice: () -> Unit = {},
    transcriptionText: String? = null
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

    val isSentByMe = message.senderId == "ME" || (currentUserId.isNotBlank() && message.senderId == currentUserId)
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
                val quotedIsMe = quotedMessage.senderId == "ME"
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
                    val imageModel = remember(message.mediaUrl) {
                        com.example.util.ImageUtils.resolveImageModel(message.mediaUrl)
                    }
                    if (imageModel != null) {
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
                "POLL" -> {
                    val poll = remember(message.content) {
                        com.example.util.PollData.fromJsonString(message.content)
                    }
                    if (poll != null) {
                        Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "📊",
                                    fontSize = 18.sp,
                                    modifier = Modifier.padding(end = 6.dp)
                                )
                                Text(
                                    text = poll.question,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                            Text(
                                text = if (poll.allowMultiple) "Select one or more" else "Select one",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 2.dp, bottom = 8.dp)
                            )

                            poll.options.forEach { option ->
                                val isSelected = poll.isOptionSelectedBy(option.index, currentUserId)
                                val percentage = poll.percentageFor(option.index)
                                val percentInt = (percentage * 100).toInt()

                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (isSelected) WhatsAppEmerald.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 3.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .clickable { onVotePoll(option.index) }
                                ) {
                                    Box(modifier = Modifier.fillMaxWidth()) {
                                        // Progress bar fill
                                        if (poll.totalVotes > 0) {
                                            Box(
                                                modifier = Modifier
                                                    .matchParentSize()
                                                    .fillMaxWidth(fraction = percentage)
                                                    .background(if (isSelected) WhatsAppEmerald.copy(alpha = 0.35f) else WhatsAppMinimalPrimary.copy(alpha = 0.15f))
                                            )
                                        }

                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(horizontal = 12.dp, vertical = 10.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = if (isSelected) "✓ " + option.text else option.text,
                                                fontSize = 14.sp,
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                                color = MaterialTheme.colorScheme.onSurface,
                                                modifier = Modifier.weight(1f)
                                            )
                                            if (poll.totalVotes > 0) {
                                                Text(
                                                    text = "$percentInt% (${option.voterIds.size})",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            Text(
                                text = "${poll.totalVotes} ${if (poll.totalVotes == 1) "vote" else "votes"}",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 4.dp).align(Alignment.End)
                            )
                        }
                    } else {
                        Text(
                            text = message.content,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                "STICKER" -> {
                    Column(
                        modifier = Modifier
                            .padding(8.dp)
                            .combinedClickable(onClick = onClick, onLongClick = onLongClick),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        val stickerText = message.content.trim()
                        val emoji = stickerText.takeWhile { !it.isWhitespace() }
                        val label = stickerText.dropWhile { !it.isWhitespace() }.trim()

                        Text(
                            text = emoji.ifBlank { "✨" },
                            fontSize = 58.sp,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                        if (label.isNotBlank()) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = WhatsAppEmerald.copy(alpha = 0.18f),
                                modifier = Modifier.padding(top = 2.dp)
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = WhatsAppMinimalPrimary,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
                "AI" -> {
                    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 6.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Color(0xFF6366F1),
                                modifier = Modifier.padding(end = 6.dp)
                            ) {
                                Text(
                                    text = "AI ASSISTANT",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                            Text(
                                text = "Gemini Flash",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            text = message.content,
                            fontSize = 15.sp,
                            lineHeight = 21.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                "VOICE" -> {
                    Column {
                        VoiceNotePlayer(
                            durationSeconds = message.voiceDurationSeconds.coerceAtLeast(3),
                            mediaUrl = message.mediaUrl,
                            isSentByMe = isSentByMe
                        )
                        if (transcriptionText != null) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.7f),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp)
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("✨ AI Transcript", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6366F1))
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = transcriptionText,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        } else {
                            TextButton(
                                onClick = onTranscribeVoice,
                                modifier = Modifier.padding(top = 2.dp)
                            ) {
                                Text("✨ Transcribe with AI", fontSize = 12.sp, color = Color(0xFF6366F1))
                            }
                        }
                    }
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
                        shape = RoundedCornerShape(12.dp),
                        color = if (isDarkMode) Color(0xFF1F2C33) else Color(0xFFFFFFFF),
                        tonalElevation = 2.dp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(12.dp))
                    ) {
                        Column {
                            // Location Header with Icon
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(140.dp)
                                    .background(if (isDarkMode) Color(0xFF232D36) else Color(0xFFF0F2F5)),
                                contentAlignment = Alignment.Center
                            ) {
                                // Background pattern placeholder
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = WhatsAppEmerald.copy(alpha = 0.1f),
                                    modifier = Modifier.size(100.dp)
                                )
                                // Main Marker
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(Color.White),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocationOn,
                                        contentDescription = null,
                                        tint = Color(0xFFE53935), // Red marker
                                        modifier = Modifier.size(28.dp)
                                    )
                                }
                            }
                            
                            Column(modifier = Modifier.padding(12.dp)) {
                                val locationTitle = message.content.substringBefore("\n").removePrefix("📍 ")
                                val locationAddress = message.content.substringAfter("\n", "")
                                
                                Text(
                                    text = locationTitle,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                if (locationAddress.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = locationAddress,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(10.dp))
                                
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = WhatsAppMinimalPrimary.copy(alpha = 0.1f),
                                    modifier = Modifier.fillMaxWidth().clickable { /* Open Map */ }
                                ) {
                                    Text(
                                        text = "View Location",
                                        color = WhatsAppMinimalPrimary,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(vertical = 8.dp),
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                    )
                                }
                            }
                        }
                    }
                }
                "CONTACT" -> {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isDarkMode) Color(0xFF1F2C33) else Color(0xFFFFFFFF),
                        tonalElevation = 2.dp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val contactName = message.content.substringBefore("\n").removePrefix("👤 ")
                                val contactPhone = message.content.substringAfter("\n", "")
                                
                                AvatarView(
                                    name = contactName,
                                    avatarUrl = "",
                                    size = 48.dp
                                )
                                Spacer(modifier = Modifier.width(14.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = contactName,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = contactPhone,
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            
                            HorizontalDivider(
                                modifier = Modifier.padding(horizontal = 16.dp),
                                thickness = 0.5.dp,
                                color = MaterialTheme.colorScheme.outlineVariant
                            )
                            
                            Row(modifier = Modifier.fillMaxWidth()) {
                                Text(
                                    text = "Message",
                                    color = WhatsAppMinimalPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { /* Message action */ }
                                        .padding(vertical = 12.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                                Box(modifier = Modifier.width(0.5.dp).height(40.dp).background(MaterialTheme.colorScheme.outlineVariant).align(Alignment.CenterVertically))
                                Text(
                                    text = "Call",
                                    color = WhatsAppMinimalPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { /* Call action */ }
                                        .padding(vertical = 12.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }
                    }
                }
                "ORDER" -> {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = if (isDarkMode) Color(0xFF1F2C33) else Color(0xFFFFFFFF),
                        tonalElevation = 2.dp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(12.dp))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(WhatsAppEmerald.copy(alpha = 0.15f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.ShoppingCart,
                                            contentDescription = null,
                                            tint = WhatsAppEmerald,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Order Inquiry",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = WhatsAppEmerald.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = "Pending",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = WhatsAppEmerald,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            HorizontalDivider(
                                modifier = Modifier.padding(vertical = 8.dp),
                                color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                            )

                            Text(
                                text = message.content,
                                fontSize = 13.sp,
                                lineHeight = 18.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
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
                    val (icon, tint) = when (message.status) {
                        "READ" -> Icons.Default.DoneAll to WhatsAppCheckBlue
                        "DELIVERED" -> Icons.Default.DoneAll to MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        "SENT" -> Icons.Default.Done to MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        else -> Icons.Default.Done to MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    }

                    Icon(
                        imageVector = icon,
                        contentDescription = "Message status: ${message.status}",
                        tint = tint,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
