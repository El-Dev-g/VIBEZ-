package com.example.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
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
import coil.compose.AsyncImage
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Audiotrack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.StatusEntity
import com.example.ui.components.AvatarView
import androidx.compose.foundation.layout.offset
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.unit.IntOffset
import androidx.compose.material.icons.filled.MusicNote
import kotlin.math.roundToInt
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary
import androidx.compose.ui.text.style.TextOverflow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.Player

private fun resolveMediaUri(url: String): android.net.Uri? {
    if (url.isBlank()) return null
    return try {
        when {
            url.startsWith("http://", ignoreCase = true) || url.startsWith("https://", ignoreCase = true) -> {
                android.net.Uri.parse(url)
            }
            url.startsWith("file://", ignoreCase = true) -> {
                android.net.Uri.parse(url)
            }
            url.startsWith("content://", ignoreCase = true) -> {
                android.net.Uri.parse(url)
            }
            url.startsWith("/uploads", ignoreCase = true) -> {
                android.net.Uri.parse(com.example.data.network.NetworkClient.BASE_URL.trimEnd('/') + url)
            }
            url.startsWith("/") -> {
                val file = java.io.File(url)
                if (file.exists()) android.net.Uri.fromFile(file) else android.net.Uri.parse("file://$url")
            }
            else -> android.net.Uri.parse(url)
        }
    } catch (e: Exception) {
        null
    }
}

@Composable
fun StatusViewerScreen(
    statuses: List<StatusEntity>,
    initialStatus: StatusEntity?,
    onCloseClick: () -> Unit,
    onReplyToStatus: (targetStatus: StatusEntity, replyText: String) -> Unit,
    onStatusViewed: (statusId: String) -> Unit = {},
    onViewersClick: (statusId: String) -> Unit = {}
) {
    if (statuses.isEmpty()) {
        onCloseClick()
        return
    }

    val context = LocalContext.current
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            repeatMode = ExoPlayer.REPEAT_MODE_OFF
            playWhenReady = true
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            exoPlayer.release()
        }
    }

    val initialIndex = remember(initialStatus, statuses) {
        val foundIndex = statuses.indexOfFirst { it.id == initialStatus?.id }
        if (foundIndex >= 0) foundIndex else 0
    }

    val pagerState = rememberPagerState(
        initialPage = initialIndex,
        pageCount = { statuses.size }
    )

    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Horizontal Status Pager through status updates
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            val status = statuses.getOrNull(page) ?: return@HorizontalPager
            StatusPageItem(
                status = status,
                isCurrentPage = (pagerState.currentPage == page),
                pageIndex = page,
                totalPages = statuses.size,
                onCloseClick = onCloseClick,
                onReplyToStatus = { reply -> onReplyToStatus(status, reply) },
                onNextStatus = {
                    if (page < statuses.size - 1) {
                        scope.launch {
                            pagerState.animateScrollToPage(page + 1)
                        }
                    } else {
                        onCloseClick()
                    }
                },
                onPreviousStatus = {
                    if (page > 0) {
                        scope.launch {
                            pagerState.animateScrollToPage(page - 1)
                        }
                    }
                },
                onTimerFinished = {
                    if (page < statuses.size - 1) {
                        scope.launch {
                            pagerState.animateScrollToPage(page + 1)
                        }
                    } else {
                        onCloseClick()
                    }
                },
                onStatusViewed = { onStatusViewed(status.id) },
                onViewersClick = { onViewersClick(status.id) },
                exoPlayer = exoPlayer
            )
        }
    }
}

@OptIn(UnstableApi::class)
@Composable
fun StatusPageItem(
    status: StatusEntity,
    isCurrentPage: Boolean,
    pageIndex: Int,
    totalPages: Int,
    onCloseClick: () -> Unit,
    onReplyToStatus: (replyText: String) -> Unit,
    onNextStatus: () -> Unit,
    onPreviousStatus: () -> Unit,
    onTimerFinished: () -> Unit,
    onStatusViewed: () -> Unit,
    onViewersClick: () -> Unit = {},
    exoPlayer: ExoPlayer
) {
    var replyText by remember { mutableStateOf("") }
    val progress = remember { Animatable(0f) }
    var isPaused by remember { mutableStateOf(false) }
    var hasPlaybackError by remember { mutableStateOf(false) }

    var screenWidth by remember { mutableStateOf(0f) }
    var screenHeight by remember { mutableStateOf(0f) }

    val isVideoStatus = status.mediaType.equals("VIDEO", ignoreCase = true)
    val isImageStatus = status.mediaType.equals("IMAGE", ignoreCase = true) ||
            status.mediaType.equals("PHOTO", ignoreCase = true)

    // Media & Music control logic
    LaunchedEffect(isCurrentPage, status.mediaType, status.mediaUrl, status.songPreviewUrl) {
        if (isCurrentPage) {
            hasPlaybackError = false
            progress.snapTo(0f)
            val uriToPlay = if (isVideoStatus) {
                status.mediaUrl
            } else {
                status.songPreviewUrl
            }
            val resolvedUri = uriToPlay?.let { resolveMediaUri(it) }
            if (resolvedUri != null) {
                try {
                    val mediaItem = MediaItem.fromUri(resolvedUri)
                    exoPlayer.setMediaItem(mediaItem)
                    exoPlayer.repeatMode = Player.REPEAT_MODE_OFF
                    exoPlayer.prepare()
                    exoPlayer.playWhenReady = !isPaused
                } catch (e: Exception) {
                    android.util.Log.e("StatusViewer", "Failed to setMediaItem for $resolvedUri", e)
                    hasPlaybackError = true
                }
            } else {
                exoPlayer.stop()
            }
        } else {
            progress.snapTo(0f)
        }
    }

    DisposableEffect(exoPlayer, isCurrentPage, isVideoStatus) {
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_ENDED && isCurrentPage) {
                    onTimerFinished()
                }
            }

            override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                android.util.Log.e("StatusViewer", "ExoPlayer playback error: ${error.message}", error)
                if (isCurrentPage) {
                    hasPlaybackError = true
                }
            }
        }
        if (isCurrentPage) {
            exoPlayer.addListener(listener)
        }
        onDispose {
            exoPlayer.removeListener(listener)
        }
    }

    LaunchedEffect(isCurrentPage, isPaused) {
        if (isCurrentPage) {
            exoPlayer.playWhenReady = !isPaused
        }
    }

    // Video status: track actual video playback position accurately in real time (~30fps)
    LaunchedEffect(isCurrentPage, isPaused, isVideoStatus, hasPlaybackError) {
        if (isCurrentPage && isVideoStatus && !hasPlaybackError) {
            onStatusViewed()
            while (!isPaused) {
                val dur = exoPlayer.duration
                val pos = exoPlayer.currentPosition
                if (dur > 0 && pos >= 0) {
                    val fraction = (pos.toFloat() / dur.toFloat()).coerceIn(0f, 1f)
                    progress.snapTo(fraction)
                }
                if (exoPlayer.playbackState == Player.STATE_ENDED) {
                    progress.snapTo(1f)
                    onTimerFinished()
                    break
                }
                kotlinx.coroutines.delay(33)
            }
        }
    }

    // Image/Text status (or playback error fallback): animate linear progress
    LaunchedEffect(isCurrentPage, isPaused, isVideoStatus, hasPlaybackError) {
        if (isCurrentPage && (!isVideoStatus || hasPlaybackError)) {
            if (!isPaused) {
                if (progress.value == 0f) {
                    onStatusViewed()
                }
                val durationMs = if (hasPlaybackError) 3000L else 6000L
                val remainingFraction = 1f - progress.value
                val duration = (remainingFraction * durationMs).toInt()

                if (duration > 0) {
                    progress.animateTo(
                        targetValue = 1f,
                        animationSpec = tween(durationMillis = duration, easing = LinearEasing)
                    )
                }

                if (progress.value >= 1f) {
                    onTimerFinished()
                }
            } else {
                progress.stop()
            }
        }
    }

    val parsedColor = remember(status.backgroundColorHex) {
        try {
            Color(android.graphics.Color.parseColor(status.backgroundColorHex))
        } catch (e: Exception) {
            Color(0xFF128C7E)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(if (status.mediaType == "TEXT") parsedColor else Color.Black)
            .onGloballyPositioned { coordinates ->
                screenWidth = coordinates.size.width.toFloat()
                screenHeight = coordinates.size.height.toFloat()
            }
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isPaused = true
                        try {
                            awaitRelease()
                        } finally {
                            isPaused = false
                        }
                    },
                    onTap = { offset ->
                        val screenW = size.width
                        val x = offset.x
                        when {
                            x < screenW / 3 -> onPreviousStatus()
                            x > (screenW * 2) / 3 -> onNextStatus()
                            else -> isPaused = !isPaused
                        }
                    }
                )
            }
    ) {
        // Status Background Media / Content
        if (isVideoStatus && status.mediaUrl.isNotBlank() && !hasPlaybackError) {
            AndroidView(
                factory = { ctx ->
                    androidx.media3.ui.PlayerView(ctx).apply {
                        player = if (isCurrentPage) exoPlayer else null
                        useController = false
                        resizeMode = androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
                    }
                },
                update = { playerView ->
                    val target = if (isCurrentPage) exoPlayer else null
                    if (playerView.player != target) {
                        playerView.player = target
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        } else if (hasPlaybackError) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Playback Error",
                        tint = Color.White.copy(alpha = 0.7f),
                        modifier = Modifier.size(56.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Video preview unavailable",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = status.textCaption.ifBlank { "Advancing to next status..." },
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else if (isImageStatus && status.mediaUrl.isNotBlank()) {
            val statusImageModel = remember(status.mediaUrl) {
                com.example.util.ImageUtils.resolveImageModel(status.mediaUrl) ?: status.mediaUrl
            }
            AsyncImage(
                model = statusImageModel,
                contentDescription = "Status photo",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 32.dp, vertical = 80.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = status.textCaption,
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    lineHeight = 38.sp
                )
            }
        }

        // Top Header Overlay with progress indicator and contact avatar
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 40.dp, start = 12.dp, end = 12.dp)
        ) {
            // Segmented status progress bar row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                for (i in 0 until totalPages) {
                    val fillFraction = when {
                        i < pageIndex -> 1f
                        i == pageIndex -> progress.value
                        else -> 0f
                    }
                    LinearProgressIndicator(
                        progress = { fillFraction },
                        modifier = Modifier
                            .weight(1f)
                            .height(3.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = Color.White,
                        trackColor = Color.White.copy(alpha = 0.3f)
                    )
                }
            }

            // Saved Position Music Pill
            if (status.songTitle != null && screenWidth > 0 && screenHeight > 0) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color.Black.copy(alpha = 0.5f),
                    modifier = Modifier
                        .offset {
                            IntOffset(
                                x = (status.musicOffsetX * screenWidth).roundToInt(),
                                y = (status.musicOffsetY * screenHeight).roundToInt()
                            )
                        }
                        .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.MusicNote,
                            contentDescription = null,
                            tint = WhatsAppEmerald,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = status.songTitle,
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = status.songArtist ?: "Unknown",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 10.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AvatarView(
                    name = status.contactName,
                    avatarUrl = status.contactAvatar,
                    size = 40.dp
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (status.isMyStatus) "My status" else status.contactName,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
                    Text(
                        text = timeFormat.format(Date(status.timestamp)),
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
                IconButton(onClick = onCloseClick) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                }
            }
        }

        // Media caption overlay if IMAGE or VIDEO status
        if ((status.mediaType == "IMAGE" || status.mediaType == "VIDEO") && status.textCaption.isNotBlank()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .padding(bottom = if (status.isMyStatus) 90.dp else 80.dp, start = 16.dp, end = 16.dp)
                    .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = status.textCaption,
                    color = Color.White,
                    fontSize = 16.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // Bottom Bar: Status Viewers Indicator for My Status OR Reply Bar for Contact Status
        if (status.isMyStatus) {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 24.dp)
                    .clickable { onViewersClick() }
                    .testTag("status_viewers_bottom_bar"),
                shape = RoundedCornerShape(24.dp),
                color = Color.Black.copy(alpha = 0.65f)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowUp,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${status.viewCount} views • Tap to see viewers",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        } else {
            // Reply Bar at bottom
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = 12.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.5f))
                ) {
                    OutlinedTextField(
                        value = replyText,
                        onValueChange = { replyText = it },
                        placeholder = { Text("Reply...", color = Color.White.copy(alpha = 0.7f)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                if (replyText.isNotBlank()) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(WhatsAppMinimalPrimary)
                            .clickable {
                                onReplyToStatus(replyText)
                                replyText = ""
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send reply",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}
