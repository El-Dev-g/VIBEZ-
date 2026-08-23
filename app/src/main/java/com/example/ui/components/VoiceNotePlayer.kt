package com.example.ui.components

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppEmerald
import com.example.util.AudioPlayer
import kotlinx.coroutines.delay
import java.io.File

@Composable
fun VoiceNotePlayer(
    durationSeconds: Int = 12,
    mediaUrl: String = "",
    isSentByMe: Boolean = true,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isPlaying by remember { mutableStateOf(false) }
    var currentProgress by remember { mutableFloatStateOf(0f) }
    val audioPlayer = remember { AudioPlayer(context) }

    val hasRealFile = remember(mediaUrl) {
        if (mediaUrl.isBlank()) false
        else {
            val f = File(mediaUrl)
            f.exists() && f.length() > 0
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            audioPlayer.stop()
        }
    }

    LaunchedEffect(isPlaying) {
        if (isPlaying) {
            if (hasRealFile) {
                audioPlayer.onCompletionListener = {
                    isPlaying = false
                    currentProgress = 0f
                }
                audioPlayer.play(mediaUrl)
                while (isPlaying && audioPlayer.isPlaying) {
                    val dur = audioPlayer.getDuration()
                    val pos = audioPlayer.getCurrentPosition()
                    if (dur > 0) {
                        currentProgress = (pos.toFloat() / dur.toFloat()).coerceIn(0f, 1f)
                    }
                    delay(100)
                }
            } else {
                // Fallback simulation timer
                val actualDuration = durationSeconds.coerceAtLeast(3)
                while (currentProgress < 1f && isPlaying) {
                    delay(100)
                    currentProgress += 0.1f / actualDuration
                }
                isPlaying = false
                currentProgress = 0f
            }
        } else {
            audioPlayer.stop()
        }
    }

    val activeColor = WhatsAppEmerald
    val trackColor = if (isSentByMe) Color(0xFFB2DFDB) else Color.LightGray

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(activeColor)
                .clickable { isPlaying = !isPlaying },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                contentDescription = if (isPlaying) "Pause voice note" else "Play voice note",
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        Column(modifier = Modifier.weight(1f)) {
            // Waveform bars with tap seek
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(24.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                val barHeights = remember { listOf(8, 14, 20, 12, 18, 22, 10, 16, 24, 14, 8, 18, 20, 12, 16, 10) }
                val activeBarIndex = (currentProgress * barHeights.size).toInt()

                barHeights.forEachIndexed { index, height ->
                    val color = if (index <= activeBarIndex) activeColor else trackColor
                    Box(
                        modifier = Modifier
                            .width(3.dp)
                            .height(height.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(color)
                    )
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            val elapsedSec = (currentProgress * durationSeconds.coerceAtLeast(3)).toInt()
            val formattedTime = String.format("%02d:%02d", elapsedSec / 60, elapsedSec % 60)
            val formattedTotal = String.format("%02d:%02d", durationSeconds.coerceAtLeast(3) / 60, durationSeconds.coerceAtLeast(3) % 60)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = if (isPlaying) formattedTime else formattedTotal,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                Text(
                    text = "🎤 Voice Note",
                    fontSize = 11.sp,
                    color = activeColor
                )
            }
        }
    }
}
