package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Photo
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.data.StatusEntity
import com.example.ui.theme.WhatsAppEmerald

@Composable
fun StatusPreviewView(
    status: StatusEntity?,
    statusCount: Int,
    isStatusViewed: Boolean,
    size: Dp = 50.dp,
    modifier: Modifier = Modifier
) {
    val strokeWidth = 2.5.dp
    val strokeColor = if (isStatusViewed) Color.Gray else WhatsAppEmerald
    val containerModifier = modifier.size(size)
    val hasStatusUpdate = statusCount > 0
    val contentPadding = if (hasStatusUpdate) 3.5.dp else 0.dp

    Box(
        modifier = containerModifier,
        contentAlignment = Alignment.Center
    ) {
        // 1. Outer status ring indicator
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

        // 2. Inner preview content
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(contentPadding),
            contentAlignment = Alignment.Center
        ) {
            if (status != null) {
                when (status.mediaType) {
                    "IMAGE" -> {
                        AsyncImage(
                            model = status.mediaUrl,
                            contentDescription = "Status preview image",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape),
                            placeholder = androidx.compose.ui.res.painterResource(id = R.drawable.img_status_banner_1787278113131),
                            error = androidx.compose.ui.res.painterResource(id = R.drawable.img_status_banner_1787278113131)
                        )
                    }
                    "VIDEO" -> {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = status.mediaUrl.takeIf { it.isNotBlank() } ?: R.drawable.img_status_banner_1787278113131,
                                contentDescription = "Status preview video thumbnail",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize(),
                                placeholder = androidx.compose.ui.res.painterResource(id = R.drawable.img_status_banner_1787278113131),
                                error = androidx.compose.ui.res.painterResource(id = R.drawable.img_status_banner_1787278113131)
                            )
                            // Play overlay icon for videos
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color.Black.copy(alpha = 0.35f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PlayArrow,
                                    contentDescription = "Video Status",
                                    tint = Color.White,
                                    modifier = Modifier.size((size - contentPadding * 2) * 0.45f)
                                )
                            }
                        }
                    }
                    else -> { // TEXT-only
                        val parsedColor = remember(status.backgroundColorHex) {
                            try {
                                Color(android.graphics.Color.parseColor(status.backgroundColorHex))
                            } catch (e: Exception) {
                                Color(0xFF075E54) // Fallback green
                            }
                        }
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(parsedColor)
                                .padding(4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = status.textCaption,
                                color = Color.White,
                                fontSize = ((size - contentPadding * 2).value * 0.16f).sp,
                                fontWeight = FontWeight.Black,
                                textAlign = TextAlign.Center,
                                maxLines = 3,
                                overflow = TextOverflow.Ellipsis,
                                lineHeight = ((size - contentPadding * 2).value * 0.20f).sp
                            )
                        }
                    }
                }
            } else {
                // Fallback icon placeholder if no active status
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Photo,
                        contentDescription = "No status content",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.size((size - contentPadding * 2) * 0.45f)
                    )
                }
            }
        }
    }
}
