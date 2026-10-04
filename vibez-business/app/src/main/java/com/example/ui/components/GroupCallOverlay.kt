package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.automirrored.filled.ScreenShare
import androidx.compose.material.icons.automirrored.filled.StopScreenShare
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.GroupCallParticipant
import com.example.ui.GroupCallState
import com.example.ui.theme.WhatsAppEmerald

@Composable
fun GroupCallOverlay(
    callState: GroupCallState,
    onLeaveCall: () -> Unit,
    onToggleMute: () -> Unit,
    onToggleVideo: () -> Unit,
    onToggleScreenShare: () -> Unit,
    onSendReaction: (String) -> Unit
) {
    val quickReactions = listOf("🔥", "❤️", "👏", "😂", "🎉", "⚡")

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = callState.callTitle,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "${callState.participants.size + 1} participants • HD Encrypted",
                        fontSize = 12.sp,
                        color = Color(0xFF94A3B8)
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = WhatsAppEmerald.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = if (callState.isVideo) "VIDEO CALL" else "VOICE CALL",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = WhatsAppEmerald,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Participant Grid
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Self tile
                item {
                    ParticipantTile(
                        name = "You (Me)",
                        avatarUrl = "",
                        isMuted = callState.isMuted,
                        isVideoOn = callState.isCameraOn,
                        isSpeaking = false
                    )
                }

                // Other participants
                items(callState.participants) { participant ->
                    ParticipantTile(
                        name = participant.name,
                        avatarUrl = participant.avatarUrl,
                        isMuted = participant.isMuted,
                        isVideoOn = participant.isVideoOn,
                        isSpeaking = participant.isSpeaking
                    )
                }
            }

            // Floating reactions row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                quickReactions.forEach { emoji ->
                    Surface(
                        shape = CircleShape,
                        color = Color.White.copy(alpha = 0.12f),
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .clickable { onSendReaction(emoji) }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(text = emoji, fontSize = 20.sp)
                        }
                    }
                }
            }

            // Bottom control bar
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = Color(0xFF1E293B),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp, bottom = 12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Mute button
                    IconButton(
                        onClick = onToggleMute,
                        modifier = Modifier
                            .size(48.dp)
                            .background(if (callState.isMuted) Color(0xFFEF4444) else Color.White.copy(alpha = 0.15f), CircleShape)
                    ) {
                        Icon(
                            imageVector = if (callState.isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = "Mute",
                            tint = Color.White
                        )
                    }

                    // Video toggle button
                    IconButton(
                        onClick = onToggleVideo,
                        modifier = Modifier
                            .size(48.dp)
                            .background(if (!callState.isCameraOn) Color(0xFFEF4444) else Color.White.copy(alpha = 0.15f), CircleShape)
                    ) {
                        Icon(
                            imageVector = if (callState.isCameraOn) Icons.Default.Videocam else Icons.Default.VideocamOff,
                            contentDescription = "Video",
                            tint = Color.White
                        )
                    }

                    // Screen share button
                    IconButton(
                        onClick = onToggleScreenShare,
                        modifier = Modifier
                            .size(48.dp)
                            .background(if (callState.isScreenSharing) Color(0xFF3B82F6) else Color.White.copy(alpha = 0.15f), CircleShape)
                    ) {
                        Icon(
                            imageVector = if (callState.isScreenSharing) Icons.AutoMirrored.Filled.StopScreenShare else Icons.AutoMirrored.Filled.ScreenShare,
                            contentDescription = "Screen Share",
                            tint = Color.White
                        )
                    }

                    // End call button
                    IconButton(
                        onClick = onLeaveCall,
                        modifier = Modifier
                            .size(52.dp)
                            .background(Color(0xFFEF4444), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.CallEnd,
                            contentDescription = "End Call",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ParticipantTile(
    name: String,
    avatarUrl: String,
    isMuted: Boolean,
    isVideoOn: Boolean,
    isSpeaking: Boolean
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(160.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF1E293B))
            .border(
                width = if (isSpeaking) 2.dp else 0.5.dp,
                color = if (isSpeaking) WhatsAppEmerald else Color.White.copy(alpha = 0.1f),
                shape = RoundedCornerShape(16.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            AvatarView(
                name = name,
                avatarUrl = avatarUrl,
                size = 56.dp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = name,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White,
                textAlign = TextAlign.Center
            )
        }

        if (isMuted) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .size(24.dp)
                    .background(Color(0xFFEF4444), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.MicOff,
                    contentDescription = "Muted",
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}
