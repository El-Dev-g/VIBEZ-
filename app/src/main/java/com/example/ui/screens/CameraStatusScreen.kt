package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CropRotate
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEmotions
import androidx.compose.material.icons.filled.FlashAuto
import androidx.compose.material.icons.filled.FlashOff
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.FlipCameraAndroid
import androidx.compose.material.icons.filled.GridOn
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PhotoLibrary
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.unit.IntOffset
import kotlin.math.roundToInt
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.runtime.rememberCoroutineScope
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.example.R
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CameraStatusScreen(
    onBackClick: () -> Unit,
    onPostPhotoStatus: (caption: String, photoResOrUri: String, songTitle: String?, songArtist: String?, songPreviewUrl: String?, offsetX: Float, offsetY: Float) -> Unit
) {
    // Gallery preset photos available in the simulator
    val sampleGalleryPhotos = listOf(
        Pair(R.drawable.img_status_banner_1787278113131, "Golden Sunset 🌅"),
        Pair(R.drawable.img_chat_wallpaper_1787278101057, "Minimal Canvas 🎨"),
        Pair(R.drawable.img_app_icon_1787278021236, "VIBEZ Aesthetic ⚡")
    )

    var capturedPhotoRes by remember { mutableStateOf<Int?>(null) }
    var captionText by remember { mutableStateOf("") }
    var flashMode by remember { mutableIntStateOf(0) } // 0: Off, 1: On, 2: Auto
    var isFrontCamera by remember { mutableStateOf(false) }
    var showGrid by remember { mutableStateOf(false) }
    var isShutterPressed by remember { mutableStateOf(false) }

    var selectedTrack by remember { mutableStateOf<com.example.data.MusicTrack?>(null) }
    var showMusicSearch by remember { mutableStateOf(false) }

    var musicOffsetX by remember { mutableStateOf(0f) }
    var musicOffsetY by remember { mutableStateOf(0f) }
    var screenWidth by remember { mutableStateOf(0f) }
    var screenHeight by remember { mutableStateOf(0f) }

    val context = LocalContext.current
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            repeatMode = ExoPlayer.REPEAT_MODE_OFF
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            exoPlayer.release()
        }
    }

    LaunchedEffect(selectedTrack) {
        if (selectedTrack != null && selectedTrack?.previewUrl != null) {
            val mediaItem = MediaItem.fromUri(selectedTrack!!.previewUrl!!)
            exoPlayer.setMediaItem(mediaItem)
            exoPlayer.prepare()
            exoPlayer.play()
        } else {
            exoPlayer.stop()
        }
    }

    val flashIcons = listOf(Icons.Default.FlashOff, Icons.Default.FlashOn, Icons.Default.FlashAuto)
    val flashDescriptions = listOf("Flash Off", "Flash On", "Flash Auto")

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = Color.Black,
            modifier = Modifier.fillMaxSize()
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(Color.Black)
            ) {
                if (capturedPhotoRes == null) {
                    // Viewfinder Mode
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = if (isFrontCamera) {
                                        listOf(Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF020617))
                                    } else {
                                        listOf(Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF0A0A0A))
                                    }
                                )
                            )
                    ) {
                        // Real CameraX Viewfinder
                        CameraPreview(
                            isFrontCamera = isFrontCamera,
                            modifier = Modifier.fillMaxSize()
                        )

                        // Optional Grid Lines Overlay
                        if (showGrid) {
                            Column(modifier = Modifier.fillMaxSize()) {
                                Spacer(modifier = Modifier.weight(1f))
                                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.3f)))
                                Spacer(modifier = Modifier.weight(1f))
                                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.3f)))
                                Spacer(modifier = Modifier.weight(1f))
                            }
                            Row(modifier = Modifier.fillMaxSize()) {
                                Spacer(modifier = Modifier.weight(1f))
                                Box(modifier = Modifier.fillMaxSize().width(1.dp).background(Color.White.copy(alpha = 0.3f)))
                                Spacer(modifier = Modifier.weight(1f))
                                Box(modifier = Modifier.fillMaxSize().width(1.dp).background(Color.White.copy(alpha = 0.3f)))
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }

                        // Top Control Bar
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 16.dp, start = 12.dp, end = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = onBackClick,
                                modifier = Modifier.testTag("camera_close_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Close Camera",
                                    tint = Color.White
                                )
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(
                                    onClick = { flashMode = (flashMode + 1) % 3 },
                                    modifier = Modifier.testTag("camera_flash_button")
                                ) {
                                    Icon(
                                        imageVector = flashIcons[flashMode],
                                        contentDescription = flashDescriptions[flashMode],
                                        tint = if (flashMode > 0) WhatsAppEmerald else Color.White
                                    )
                                }

                                IconButton(
                                    onClick = { showGrid = !showGrid },
                                    modifier = Modifier.testTag("camera_grid_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.GridOn,
                                        contentDescription = "Toggle Grid",
                                        tint = if (showGrid) WhatsAppEmerald else Color.White
                                    )
                                }
                            }
                        }

                        // Bottom Camera Controls
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .align(Alignment.BottomCenter)
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f))
                                    )
                                )
                                .padding(bottom = 32.dp, top = 20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Quick Gallery Picker Strip
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PhotoLibrary,
                                    contentDescription = null,
                                    tint = Color.White.copy(alpha = 0.8f),
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Recent Photos",
                                    color = Color.White.copy(alpha = 0.8f),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 20.dp)
                            ) {
                                itemsIndexed(sampleGalleryPhotos) { index, item ->
                                    Box(
                                        modifier = Modifier
                                            .size(64.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .border(1.5.dp, Color.White.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                            .clickable {
                                                capturedPhotoRes = item.first
                                                captionText = item.second
                                            }
                                            .testTag("gallery_item_$index")
                                    ) {
                                        Image(
                                            painter = painterResource(id = item.first),
                                            contentDescription = item.second,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    }
                                }
                            }

                            // Shutter & Camera Controls Row
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 32.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Gallery button
                                IconButton(
                                    onClick = {
                                        capturedPhotoRes = sampleGalleryPhotos.first().first
                                        captionText = "Captured moment 📸"
                                    },
                                    modifier = Modifier
                                        .size(48.dp)
                                        .background(Color.White.copy(alpha = 0.2f), CircleShape)
                                        .testTag("gallery_picker_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.PhotoLibrary,
                                        contentDescription = "Gallery",
                                        tint = Color.White
                                    )
                                }

                                // Shutter Capture Button
                                Box(
                                    modifier = Modifier
                                        .size(80.dp)
                                        .clip(CircleShape)
                                        .border(4.dp, Color.White, CircleShape)
                                        .padding(6.dp)
                                        .clip(CircleShape)
                                        .background(Color.White)
                                        .clickable {
                                            capturedPhotoRes = R.drawable.img_status_banner_1787278113131
                                            captionText = "VIBEZ photo status ✨"
                                        }
                                        .testTag("camera_shutter_button"),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CameraAlt,
                                        contentDescription = "Take Photo",
                                        tint = Color.Black,
                                        modifier = Modifier.size(32.dp)
                                    )
                                }

                                // Flip Camera Button
                                IconButton(
                                    onClick = { isFrontCamera = !isFrontCamera },
                                    modifier = Modifier
                                        .size(48.dp)
                                        .background(Color.White.copy(alpha = 0.2f), CircleShape)
                                        .testTag("camera_flip_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.FlipCameraAndroid,
                                        contentDescription = "Flip Camera",
                                        tint = Color.White
                                    )
                                }
                            }
                        }
                    }
                } else {
                    // Photo Preview & Caption / Send Mode
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .onGloballyPositioned { coordinates ->
                                screenWidth = coordinates.size.width.toFloat()
                                screenHeight = coordinates.size.height.toFloat()
                            }
                    ) {
                        Image(
                            painter = painterResource(id = capturedPhotoRes!!),
                            contentDescription = "Captured photo preview",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )

                        // Top Action Tools
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 16.dp, start = 12.dp, end = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = { capturedPhotoRes = null },
                                modifier = Modifier.testTag("retake_photo_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Retake",
                                    tint = Color.White
                                )
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = { showMusicSearch = true }) {
                                    Icon(
                                        imageVector = if (selectedTrack != null) Icons.Default.MusicNote else Icons.Default.AutoAwesome,
                                        contentDescription = "Add music",
                                        tint = if (selectedTrack != null) WhatsAppEmerald else Color.White
                                    )
                                }
                                IconButton(onClick = { captionText += " 🔥" }) {
                                    Icon(imageVector = Icons.Default.EmojiEmotions, contentDescription = "Emoji sticker", tint = Color.White)
                                }
                                IconButton(onClick = { }) {
                                    Icon(imageVector = Icons.Default.CropRotate, contentDescription = "Crop", tint = Color.White)
                                }
                            }
                        }

                        // Selected Music Pill over image
                        selectedTrack?.let { track ->
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Color.Black.copy(alpha = 0.6f),
                                modifier = Modifier
                                    .offset {
                                        IntOffset(
                                            x = musicOffsetX.roundToInt(),
                                            y = musicOffsetY.roundToInt()
                                        )
                                    }
                                    .pointerInput(Unit) {
                                        detectDragGestures { change, dragAmount ->
                                            change.consume()
                                            musicOffsetX += dragAmount.x
                                            musicOffsetY += dragAmount.y
                                        }
                                    }
                                    .clickable { selectedTrack = null }
                                    .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.MusicNote,
                                        contentDescription = null,
                                        tint = WhatsAppEmerald,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(text = track.title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        Text(text = track.artist, color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(text = "✕", color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp)
                                }
                            }
                        }

                        // Bottom Caption Bar & Send Button
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .align(Alignment.BottomCenter)
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f))
                                    )
                                )
                                .padding(horizontal = 14.dp, vertical = 20.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Card(
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.65f))
                            ) {
                                OutlinedTextField(
                                    value = captionText,
                                    onValueChange = { captionText = it },
                                    placeholder = {
                                        Text("Add a caption...", color = Color.White.copy(alpha = 0.7f))
                                    },
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedBorderColor = Color.Transparent,
                                        unfocusedBorderColor = Color.Transparent
                                    ),
                                    singleLine = true,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("photo_status_caption_input")
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            FloatingActionButton(
                                onClick = {
                                    val finalOffsetX = if (screenWidth > 0) musicOffsetX / screenWidth else 0.5f
                                    val finalOffsetY = if (screenHeight > 0) musicOffsetY / screenHeight else 0.5f
                                    onPostPhotoStatus(
                                        captionText.trim(),
                                        "img_status_banner_1787278113131",
                                        selectedTrack?.title,
                                        selectedTrack?.artist,
                                        selectedTrack?.previewUrl,
                                        finalOffsetX,
                                        finalOffsetY
                                    )
                                    onBackClick()
                                },
                                containerColor = WhatsAppEmerald,
                                contentColor = Color.White,
                                shape = CircleShape,
                                modifier = Modifier
                                    .size(52.dp)
                                    .testTag("post_photo_status_fab")
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.Send,
                                    contentDescription = "Post photo status",
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Full-screen Music Search Overlay for Camera
        androidx.compose.animation.AnimatedVisibility(
            visible = showMusicSearch,
            enter = androidx.compose.animation.expandVertically(),
            exit = androidx.compose.animation.shrinkVertically()
        ) {
            MusicSearchOverlay(
                onTrackSelected = { track ->
                    selectedTrack = track
                    showMusicSearch = false
                },
                onClose = { showMusicSearch = false }
            )
        }
    }
}

@Composable
fun CameraPreview(
    isFrontCamera: Boolean,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalContext.current as LifecycleOwner
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    AndroidView(
        factory = { ctx ->
            val previewView = PreviewView(ctx)
            val executor = ContextCompat.getMainExecutor(ctx)
            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                val cameraSelector = if (isFrontCamera) {
                    CameraSelector.DEFAULT_FRONT_CAMERA
                } else {
                    CameraSelector.DEFAULT_BACK_CAMERA
                }

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview
                    )
                } catch (e: Exception) {
                    android.util.Log.e("CameraPreview", "Use case binding failed", e)
                }
            }, executor)
            previewView
        },
        modifier = modifier,
        update = { previewView ->
            val cameraProvider = cameraProviderFuture.get()
            val cameraSelector = if (isFrontCamera) {
                CameraSelector.DEFAULT_FRONT_CAMERA
            } else {
                CameraSelector.DEFAULT_BACK_CAMERA
            }
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview
                )
            } catch (e: Exception) {}
        }
    )
}
