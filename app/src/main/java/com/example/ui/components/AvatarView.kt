package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.ui.theme.WhatsAppEmerald

@Composable
fun AvatarView(
    name: String,
    avatarUrl: String = "",
    isOnline: Boolean = false,
    isGroup: Boolean = false,
    hasStatusUpdate: Boolean = false,
    isStatusViewed: Boolean = false,
    statusCount: Int = 1,
    size: Dp = 50.dp,
    modifier: Modifier = Modifier
) {
    val strokeWidth = 2.5.dp
    val strokeColor = if (isStatusViewed) Color.Gray else WhatsAppEmerald
    val avatarModifier = modifier.size(size)
    val contentPadding = if (hasStatusUpdate) 3.5.dp else 0.dp

    Box(
        modifier = avatarModifier,
        contentAlignment = Alignment.Center
    ) {
        if (hasStatusUpdate) {
            val strokeWidthPx = with(androidx.compose.ui.platform.LocalDensity.current) { strokeWidth.toPx() }
            androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                val canvasSize = this.size
                val diameter = minOf(canvasSize.width, canvasSize.height) - strokeWidthPx
                val topLeft = androidx.compose.ui.geometry.Offset(
                    (canvasSize.width - diameter) / 2f,
                    (canvasSize.height - diameter) / 2f
                )
                val rectSize = androidx.compose.ui.geometry.Size(diameter, diameter)

                if (statusCount <= 1) {
                    drawArc(
                        color = strokeColor,
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(
                            width = strokeWidthPx
                        )
                    )
                } else {
                    val gapDegrees = if (statusCount > 10) 4f else if (statusCount > 5) 6f else 8f
                    val segmentDegrees = (360f / statusCount) - gapDegrees
                    for (i in 0 until statusCount) {
                        val startAngle = -90f + (i * (segmentDegrees + gapDegrees)) + (gapDegrees / 2)
                        drawArc(
                            color = strokeColor,
                            startAngle = startAngle,
                            sweepAngle = segmentDegrees,
                            useCenter = false,
                            style = androidx.compose.ui.graphics.drawscope.Stroke(
                                width = strokeWidthPx,
                                cap = androidx.compose.ui.graphics.StrokeCap.Round
                            )
                        )
                    }
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(contentPadding),
            contentAlignment = Alignment.Center
        ) {
            if (avatarUrl.isNotBlank()) {
                AsyncImage(
                    model = avatarUrl,
                    contentDescription = name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                )
            } else {
                val colorPairs = listOf(
                    Pair(Color(0xFFDBEAFE), Color(0xFF2563EB)), // Blue
                    Pair(Color(0xFFFFEDD5), Color(0xFFEA580C)), // Orange
                    Pair(Color(0xFFF3E8FF), Color(0xFF9333EA)), // Purple
                    Pair(Color(0xFFD1FAE5), Color(0xFF059669)), // Emerald
                    Pair(Color(0xFFFCE7F3), Color(0xFFDB2777)), // Pink
                    Pair(Color(0xFFFEF3C7), Color(0xFFD97706))  // Amber
                )
                val charCode = name.firstOrNull()?.code ?: 0
                val (bgColor, textColor) = colorPairs[charCode % colorPairs.size]

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(bgColor),
                    contentAlignment = Alignment.Center
                ) {
                    if (isGroup) {
                        Icon(
                            imageVector = Icons.Default.Group,
                            contentDescription = "Group",
                            tint = textColor,
                            modifier = Modifier.size((size - contentPadding * 2) * 0.5f)
                        )
                    } else {
                        val initial = name.take(2).uppercase()
                        Text(
                            text = if (initial.length > 1 && name.contains(" ")) "${initial[0]}${name.substringAfter(" ").firstOrNull()?.uppercase() ?: ""}" else initial.take(1),
                            color = textColor,
                            fontSize = ((size - contentPadding * 2).value * 0.38f).sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        if (isOnline && !isGroup) {
            Box(
                modifier = Modifier
                    .size(size * 0.28f)
                    .clip(CircleShape)
                    .background(WhatsAppEmerald)
                    .border(1.5.dp, MaterialTheme.colorScheme.surface, CircleShape)
                    .align(Alignment.BottomEnd)
            )
        }
    }
}
