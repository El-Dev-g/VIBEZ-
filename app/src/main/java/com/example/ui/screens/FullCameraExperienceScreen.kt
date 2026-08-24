package com.example.ui.screens

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FallbackStrategy
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import kotlinx.coroutines.withTimeoutOrNull
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import coil.compose.AsyncImage
import com.example.data.MusicTrack
import com.example.data.MusicSearchService
import com.example.ui.theme.WhatsAppEmerald
import kotlinx.coroutines.delay
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.roundToInt

@OptIn(androidx.camera.core.ExperimentalGetImage::class)
@Composable
fun FullCameraExperienceScreen(
    onBackClick: () -> Unit,
    onMediaCaptured: (Uri, String?, MusicTrack?, Float, Float, String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // Permissions State
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED
        )
    }
    var hasAudioPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasCameraPermission = permissions[android.Manifest.permission.CAMERA] ?: hasCameraPermission
        hasAudioPermission = permissions[android.Manifest.permission.RECORD_AUDIO] ?: hasAudioPermission
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission || !hasAudioPermission) {
            permissionLauncher.launch(
                arrayOf(
                    android.Manifest.permission.CAMERA,
                    android.Manifest.permission.RECORD_AUDIO
                )
            )
        }
    }

    if (!hasCameraPermission) {
        Box(modifier = Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Camera permission is required", color = Color.White)
                Button(
                    onClick = {
                        permissionLauncher.launch(
                            arrayOf(
                                android.Manifest.permission.CAMERA,
                                android.Manifest.permission.RECORD_AUDIO
                            )
                        )
                    },
                    modifier = Modifier.padding(top = 16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald)
                ) {
                    Text("Grant Permission")
                }
            }
        }
        return
    }

    // Camera State
    var lensFacing by remember { mutableStateOf(CameraSelector.LENS_FACING_BACK) }
    var flashMode by remember { mutableIntStateOf(androidx.camera.core.ImageCapture.FLASH_MODE_OFF) }
    var isRecording by remember { mutableStateOf(false) }
    var recordingDuration by remember { mutableLongStateOf(0L) }
    var capturedMediaUri by remember { mutableStateOf<Uri?>(null) }
    var capturedMediaType by remember { mutableStateOf("VIDEO") } // "IMAGE" or "VIDEO"

    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            repeatMode = Player.REPEAT_MODE_ONE
        }
    }

    // Unbind camera on dispose
    DisposableEffect(Unit) {
        onDispose {
            try {
                val cameraProvider = ProcessCameraProvider.getInstance(context).get()
                cameraProvider.unbindAll()
            } catch (e: Exception) {
                Log.e("CameraExperience", "Error unbinding on dispose", e)
            }
            exoPlayer.release()
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            capturedMediaUri = uri
            // Detect if it's a video or image based on content type
            val contentResolver = context.contentResolver
            val type = contentResolver.getType(uri)
            capturedMediaType = if (type?.startsWith("video") == true) "VIDEO" else "IMAGE"
        }
    }
    
    // Music State
    var selectedTrack by remember { mutableStateOf<MusicTrack?>(null) }
    var showMusicSearch by remember { mutableStateOf(false) }
    var musicVolume by remember { mutableFloatStateOf(0.7f) }
    var isMicMuted by remember { mutableStateOf(false) }
    var songStartTime by remember { mutableLongStateOf(0L) }
    
    // UI State
    var captionText by remember { mutableStateOf("") }
    var showFilters by remember { mutableStateOf(false) }
    var selectedFilter by remember { mutableStateOf("None") }

    // Timer for recording
    LaunchedEffect(isRecording) {
        if (isRecording) {
            val startTime = System.currentTimeMillis()
            while (isRecording) {
                recordingDuration = System.currentTimeMillis() - startTime
                delay(100)
            }
        } else {
            recordingDuration = 0L
        }
    }

    // Play music during recording or preview
    LaunchedEffect(selectedTrack, isRecording, capturedMediaUri, musicVolume) {
        if (selectedTrack != null && (isRecording || capturedMediaUri != null)) {
            if (exoPlayer.currentMediaItem?.localConfiguration?.uri?.toString() != selectedTrack!!.previewUrl) {
                val mediaItem = MediaItem.fromUri(selectedTrack!!.previewUrl!!)
                exoPlayer.setMediaItem(mediaItem)
                exoPlayer.prepare()
            }
            exoPlayer.volume = musicVolume
            exoPlayer.seekTo(songStartTime)
            exoPlayer.play()
        } else {
            exoPlayer.stop()
        }
    }

    var shutterTrigger by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        if (capturedMediaUri == null) {
            // Live Camera Preview
            CameraPreview(
                lensFacing = lensFacing,
                flashMode = flashMode,
                isRecording = isRecording,
                shutterTrigger = shutterTrigger,
                hasAudioPermission = hasAudioPermission,
                onShutterConsumed = { shutterTrigger = false },
                onRecordingStarted = { isRecording = true },
                onRecordingStopped = { uri -> 
                    isRecording = false
                    capturedMediaUri = uri
                    capturedMediaType = "VIDEO"
                },
                onPhotoCaptured = { uri ->
                    capturedMediaUri = uri
                    capturedMediaType = "IMAGE"
                }
            )

            // Top Controls
            if (!isRecording) {
                Box(modifier = Modifier.fillMaxWidth().align(Alignment.TopCenter)) {
                    CameraTopBar(
                        flashMode = flashMode,
                        onFlashToggle = { 
                            flashMode = when(flashMode) {
                                androidx.camera.core.ImageCapture.FLASH_MODE_OFF -> androidx.camera.core.ImageCapture.FLASH_MODE_ON
                                else -> androidx.camera.core.ImageCapture.FLASH_MODE_OFF
                            }
                        },
                        onClose = onBackClick,
                        onMusicClick = { showMusicSearch = true },
                        hasMusic = selectedTrack != null
                    )
                }
            }

            // Recording Overlay
            if (isRecording) {
                RecordingOverlay(
                    duration = recordingDuration,
                    track = selectedTrack,
                    volume = musicVolume,
                    isMuted = isMicMuted,
                    onVolumeChange = { musicVolume = it },
                    onMuteToggle = { isMicMuted = !isMicMuted }
                )
            }

            // Bottom Shutter & Controls
            Box(modifier = Modifier.fillMaxWidth().align(Alignment.BottomCenter)) {
                CameraBottomControls(
                    onRecordStart = { isRecording = true },
                    onRecordEnd = { isRecording = false },
                    onTakePhoto = { shutterTrigger = true },
                    onFlipCamera = {
                        lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) 
                            CameraSelector.LENS_FACING_FRONT else CameraSelector.LENS_FACING_BACK
                    },
                    onGalleryClick = { galleryLauncher.launch("*/*") },
                    onFiltersClick = { showFilters = !showFilters },
                    isRecording = isRecording
                )
            }
        } else {
            // Video/Photo Preview & Edit Mode
            VideoPreviewScreen(
                videoUri = capturedMediaUri!!,
                mediaType = capturedMediaType,
                caption = captionText,
                onCaptionChange = { captionText = it },
                onRetake = { capturedMediaUri = null },
                onSend = {
                    onMediaCaptured(capturedMediaUri!!, captionText, selectedTrack, 0.5f, 0.5f, capturedMediaType)
                },
                track = selectedTrack
            )
        }

        // Music Selector Overlay (Advanced)
        AnimatedVisibility(
            visible = showMusicSearch,
            enter = slideInVertically(initialOffsetY = { it }),
            exit = slideOutVertically(targetOffsetY = { it })
        ) {
            AdvancedMusicSelectorOverlay(
                onTrackSelected = { track, startTime, volume ->
                    selectedTrack = track
                    songStartTime = startTime
                    musicVolume = volume
                    showMusicSearch = false
                },
                onClose = { showMusicSearch = false }
            )
        }
    }
}

@Composable
fun AdvancedMusicSelectorOverlay(
    onTrackSelected: (MusicTrack, Long, Float) -> Unit,
    onClose: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedTrackForPreview by remember { mutableStateOf<MusicTrack?>(null) }
    var trimStartTime by remember { mutableFloatStateOf(0f) }
    var trackVolume by remember { mutableFloatStateOf(0.7f) }
    var searchResults by remember { mutableStateOf<List<MusicTrack>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }

    LaunchedEffect(searchQuery) {
        if (searchQuery.isNotBlank()) {
            isSearching = true
            delay(500) // Debounce
            searchResults = MusicSearchService.searchTracks(searchQuery)
            isSearching = false
        } else {
            searchResults = emptyList()
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.surface
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onClose) {
                    Icon(Icons.Default.Close, contentDescription = "Close")
                }
                Text(
                    text = "Add music",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                placeholder = { Text("Search for music...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (isSearching) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp, color = WhatsAppEmerald)
                    }
                },
                shape = RoundedCornerShape(24.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = WhatsAppEmerald,
                    unfocusedBorderColor = Color.LightGray
                )
            )

            if (selectedTrackForPreview == null) {
                // Track List
                if (searchQuery.isBlank()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.MusicNote, contentDescription = null, modifier = Modifier.size(64.dp), tint = Color.LightGray)
                            Text("Search for your favorite songs", color = Color.Gray, modifier = Modifier.padding(top = 16.dp))
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f).padding(top = 16.dp)
                    ) {
                        items(searchResults) { track ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedTrackForPreview = track }
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier.size(56.dp).clip(RoundedCornerShape(8.dp)).background(WhatsAppEmerald.copy(0.1f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (track.artworkUrl != null) {
                                        AsyncImage(
                                            model = track.artworkUrl,
                                            contentDescription = null,
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        Icon(Icons.Default.MusicNote, contentDescription = null, tint = WhatsAppEmerald)
                                    }
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(track.title, fontWeight = FontWeight.Bold, fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(track.artist, color = Color.Gray, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                                Text(track.duration, color = Color.Gray, fontSize = 12.sp)
                            }
                        }
                    }
                }
            } else {
                // Trimming & Volume View
                Column(
                    modifier = Modifier.weight(1f).padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier.size(120.dp).clip(RoundedCornerShape(16.dp)).background(WhatsAppEmerald.copy(0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.MusicNote, contentDescription = null, tint = WhatsAppEmerald, modifier = Modifier.size(64.dp))
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(selectedTrackForPreview!!.title, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                    Text(selectedTrackForPreview!!.artist, color = Color.Gray, fontSize = 16.sp)

                    Spacer(modifier = Modifier.height(32.dp))

                    // Trimming
                    Text("Select section", fontWeight = FontWeight.Bold, modifier = Modifier.align(Alignment.Start))
                    Slider(
                        value = trimStartTime,
                        onValueChange = { trimStartTime = it },
                        valueRange = 0f..60f,
                        colors = SliderDefaults.colors(thumbColor = WhatsAppEmerald, activeTrackColor = WhatsAppEmerald)
                    )
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Start: ${trimStartTime.toInt()}s", fontSize = 12.sp, color = Color.Gray)
                        Text("Previewing 15s", fontSize = 12.sp, color = Color.Gray)
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Volume
                    Text("Music volume", fontWeight = FontWeight.Bold, modifier = Modifier.align(Alignment.Start))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.VolumeDown, contentDescription = null, tint = Color.Gray)
                        Slider(
                            value = trackVolume,
                            onValueChange = { trackVolume = it },
                            modifier = Modifier.weight(1f),
                            colors = SliderDefaults.colors(thumbColor = WhatsAppEmerald, activeTrackColor = WhatsAppEmerald)
                        )
                        Icon(Icons.Default.VolumeUp, contentDescription = null, tint = Color.Gray)
                    }

                    Spacer(modifier = Modifier.weight(1f))

                    Button(
                        onClick = { onTrackSelected(selectedTrackForPreview!!, (trimStartTime * 1000).toLong(), trackVolume) },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald),
                        shape = RoundedCornerShape(25.dp)
                    ) {
                        Text("Done", fontWeight = FontWeight.Bold)
                    }
                    
                    TextButton(onClick = { selectedTrackForPreview = null }, modifier = Modifier.padding(top = 8.dp)) {
                        Text("Back to list", color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
fun CameraPreview(
    lensFacing: Int,
    flashMode: Int,
    isRecording: Boolean,
    shutterTrigger: Boolean,
    hasAudioPermission: Boolean,
    onShutterConsumed: () -> Unit,
    onRecordingStarted: () -> Unit,
    onRecordingStopped: (Uri) -> Unit,
    onPhotoCaptured: (Uri) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }
    
    val videoCaptureState = remember { mutableStateOf<VideoCapture<Recorder>?>(null) }
    val imageCaptureState = remember { mutableStateOf<ImageCapture?>(null) }
    val recordingState = remember { mutableStateOf<Recording?>(null) }

    LaunchedEffect(lensFacing) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

            val qualitySelector = QualitySelector.fromOrderedList(
                listOf(Quality.HD, Quality.SD, Quality.LOWEST),
                FallbackStrategy.lowerQualityOrHigherThan(Quality.LOWEST)
            )
            
            val videoCapture = try {
                val recorder = Recorder.Builder()
                    .setQualitySelector(qualitySelector)
                    .build()
                VideoCapture.withOutput(recorder)
            } catch (e: Exception) {
                Log.e("CameraExperience", "Failed to initialize VideoCapture, falling back to lower quality", e)
                try {
                    val fallbackRecorder = Recorder.Builder()
                        .setQualitySelector(QualitySelector.from(Quality.LOWEST))
                        .build()
                    VideoCapture.withOutput(fallbackRecorder)
                } catch (e2: Exception) {
                    Log.e("CameraExperience", "Completely failed to initialize VideoCapture", e2)
                    null
                }
            }
            videoCaptureState.value = videoCapture

            val imageCapture = ImageCapture.Builder()
                .setFlashMode(flashMode)
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()
            imageCaptureState.value = imageCapture

            val cameraSelector = CameraSelector.Builder()
                .requireLensFacing(lensFacing)
                .build()

            if (!cameraProvider.hasCamera(cameraSelector)) {
                Log.e("CameraExperience", "Camera not found for lensFacing: $lensFacing")
                return@addListener
            }

            try {
                cameraProvider.unbindAll()
                // On some devices/emulators, binding 3 use cases fails. 
                // We attempt 3, then 2 (Preview + Image), then just Preview if needed.
                try {
                    if (videoCapture != null) {
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            cameraSelector,
                            preview,
                            videoCapture,
                            imageCapture
                        )
                    } else {
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            cameraSelector,
                            preview,
                            imageCapture
                        )
                    }
                } catch (e: Exception) {
                    Log.w("CameraExperience", "Binding 3 use cases failed, falling back to 2", e)
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview,
                        imageCapture
                    )
                    videoCaptureState.value = null
                }
            } catch (e: Exception) {
                Log.e("CameraExperience", "Camera binding completely failed", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    // Update flash mode without rebinding if possible
    LaunchedEffect(flashMode) {
        imageCaptureState.value?.flashMode = flashMode
    }

    LaunchedEffect(shutterTrigger) {
        val imageCapture = imageCaptureState.value
        if (shutterTrigger && imageCapture != null) {
            val name = "VIBEZ_" + SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(System.currentTimeMillis()) + ".jpg"
            val file = File(context.cacheDir, name)
            val outputOptions = ImageCapture.OutputFileOptions.Builder(file).build()

            imageCapture.takePicture(
                outputOptions,
                ContextCompat.getMainExecutor(context),
                object : ImageCapture.OnImageSavedCallback {
                    override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                        onPhotoCaptured(Uri.fromFile(file))
                        onShutterConsumed()
                    }

                    override fun onError(exception: ImageCaptureException) {
                        exception.printStackTrace()
                        onShutterConsumed()
                    }
                }
            )
        }
    }

    LaunchedEffect(isRecording) {
        val videoCapture = videoCaptureState.value
        if (isRecording && videoCapture != null) {
            val name = "VIBEZ_" + SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(System.currentTimeMillis()) + ".mp4"
            val file = File(context.cacheDir, name)
            val outputOptions = FileOutputOptions.Builder(file).build()

            onRecordingStarted()
            
            val recordingBuilder = videoCapture.output
                .prepareRecording(context, outputOptions)
            
            if (hasAudioPermission) {
                recordingBuilder.withAudioEnabled()
            }
            
            recordingState.value = recordingBuilder
                .start(ContextCompat.getMainExecutor(context)) { event ->
                    if (event is VideoRecordEvent.Finalize) {
                        if (!event.hasError()) {
                            onRecordingStopped(Uri.fromFile(file))
                        }
                    }
                }
        } else {
            recordingState.value?.stop()
            recordingState.value = null
        }
    }

    AndroidView(
        factory = { previewView },
        modifier = Modifier.fillMaxSize()
    )
}

@Composable
fun CameraTopBar(
    flashMode: Int,
    onFlashToggle: () -> Unit,
    onClose: () -> Unit,
    onMusicClick: () -> Unit,
    hasMusic: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onClose) {
            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
        }

        IconButton(
            onClick = onMusicClick,
            modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(if(hasMusic) WhatsAppEmerald else Color.Black.copy(0.4f))
        ) {
            Icon(
                imageVector = Icons.Default.MusicNote,
                contentDescription = "Music",
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
        }

        IconButton(onClick = onFlashToggle) {
            Icon(
                imageVector = if (flashMode == androidx.camera.core.ImageCapture.FLASH_MODE_OFF) Icons.Default.FlashOff else Icons.Default.FlashOn,
                contentDescription = "Flash",
                tint = if (flashMode == androidx.camera.core.ImageCapture.FLASH_MODE_OFF) Color.White else Color.Yellow
            )
        }
    }
}

@Composable
fun RecordingOverlay(
    duration: Long,
    track: MusicTrack?,
    volume: Float,
    isMuted: Boolean,
    onVolumeChange: (Float) -> Unit,
    onMuteToggle: () -> Unit
) {
    val time = SimpleDateFormat("mm:ss", Locale.getDefault()).format(Date(duration))
    
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            color = Color.Red,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.padding(top = 40.dp)
        ) {
            Text(
                text = time,
                color = Color.White,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        if (track != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.Black.copy(0.6f)),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.padding(bottom = 120.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.MusicNote, contentDescription = null, tint = WhatsAppEmerald)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(track.title, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text(track.artist, color = Color.White.copy(0.7f), fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    IconButton(onClick = onMuteToggle) {
                        Icon(
                            if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = "Mute",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CameraBottomControls(
    onRecordStart: () -> Unit,
    onRecordEnd: () -> Unit,
    onTakePhoto: () -> Unit,
    onFlipCamera: () -> Unit,
    onFiltersClick: () -> Unit,
    onGalleryClick: () -> Unit,
    isRecording: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(bottom = 24.dp, start = 32.dp, end = 32.dp).padding(horizontal = 32.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (!isRecording) {
            IconButton(onClick = onGalleryClick) {
                Icon(Icons.Default.PhotoLibrary, contentDescription = "Gallery", tint = Color.White, modifier = Modifier.size(32.dp))
            }
        } else {
            Spacer(modifier = Modifier.size(48.dp))
        }

        // Shutter Button
        Box(
            modifier = Modifier
                .size(if (isRecording) 100.dp else 80.dp)
                .clip(CircleShape)
                .border(4.dp, Color.White, CircleShape)
                .padding(6.dp)
                .clip(CircleShape)
                .background(if (isRecording) Color.Red.copy(0.3f) else Color.White)
                .pointerInput(Unit) {
                    awaitPointerEventScope {
                        while (true) {
                            val event = awaitFirstDown()
                            val startTime = System.currentTimeMillis()
                            var isLongPress = false
                            
                            // Track the press
                            while (true) {
                                val nextEvent = withTimeoutOrNull(500) {
                                    awaitPointerEvent()
                                }
                                
                                if (nextEvent == null) {
                                    // Timeout reached, this is a long press
                                    if (!isLongPress) {
                                        isLongPress = true
                                        onRecordStart()
                                    }
                                } else {
                                    val change = nextEvent.changes.first()
                                    if (!change.pressed) {
                                        // Released
                                        if (isLongPress) {
                                            onRecordEnd()
                                        } else {
                                            onTakePhoto()
                                        }
                                        break
                                    }
                                }
                            }
                        }
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(if (isRecording) 40.dp else 60.dp)
                    .clip(if (isRecording) RoundedCornerShape(8.dp) else CircleShape)
                    .background(Color.Red)
            )
        }

        if (!isRecording) {
            IconButton(onClick = onFlipCamera) {
                Icon(Icons.Default.FlipCameraAndroid, contentDescription = "Flip", tint = Color.White, modifier = Modifier.size(32.dp))
            }
        } else {
            Spacer(modifier = Modifier.size(48.dp))
        }
    }
}

@Composable
fun VideoPreviewScreen(
    videoUri: Uri,
    mediaType: String,
    caption: String,
    onCaptionChange: (String) -> Unit,
    onRetake: () -> Unit,
    onSend: () -> Unit,
    track: MusicTrack?
) {
    var trimRange by remember { mutableStateOf(0f..1f) }
    var showTextDialog by remember { mutableStateOf(false) }
    var currentText by remember { mutableStateOf("") }
    var textOverlays by remember { mutableStateOf(listOf<TextOverlayData>()) }
    var showStickers by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        // Video Preview Placeholder
        Box(modifier = Modifier.fillMaxSize().background(Color.DarkGray), contentAlignment = Alignment.Center) {
            if (mediaType == "VIDEO") {
                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.White, modifier = Modifier.size(80.dp))
            } else {
                AsyncImage(
                    model = videoUri,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
            }
            
            // Render Text Overlays
            textOverlays.forEach { data ->
                TextOverlayItem(data)
            }
        }

        // Top Controls
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Spacer(modifier = Modifier.weight(1f))
            IconButton(onClick = { showStickers = true }) {
                Icon(Icons.Default.EmojiEmotions, contentDescription = "Stickers", tint = Color.White)
            }
            IconButton(onClick = { showTextDialog = true }) {
                Icon(Icons.Default.TextFields, contentDescription = "Text", tint = Color.White)
            }
            IconButton(onClick = { }) {
                Icon(Icons.Default.Edit, contentDescription = "Draw", tint = Color.White)
            }
        }

        // Trimmer UI (only for video)
        if (mediaType == "VIDEO") {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 100.dp)
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
            ) {
                Text("Trim video", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                RangeSlider(
                    value = trimRange,
                    onValueChange = { trimRange = it },
                    modifier = Modifier.fillMaxWidth(),
                    colors = SliderDefaults.colors(thumbColor = WhatsAppEmerald, activeTrackColor = WhatsAppEmerald)
                )
            }
        }

        // Bottom Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black)))
                .navigationBarsPadding()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = caption,
                onValueChange = onCaptionChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Add a caption...", color = Color.White.copy(0.6f)) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent
                ),
                shape = RoundedCornerShape(24.dp)
            )

            Spacer(modifier = Modifier.width(8.dp))

            FloatingActionButton(
                onClick = onSend,
                containerColor = WhatsAppEmerald,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send")
            }
        }

        if (track != null) {
            Card(
                modifier = Modifier.align(Alignment.TopCenter).padding(top = 80.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Black.copy(0.4f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.MusicNote, contentDescription = null, tint = WhatsAppEmerald, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${track.title} • ${track.artist}", color = Color.White, fontSize = 12.sp)
                }
            }
        }

        // Text Input Dialog
        if (showTextDialog) {
            AlertDialog(
                onDismissRequest = { showTextDialog = false },
                title = { Text("Add Text") },
                text = {
                    TextField(value = currentText, onValueChange = { currentText = it })
                },
                confirmButton = {
                    TextButton(onClick = {
                        if (currentText.isNotBlank()) {
                            textOverlays = textOverlays + TextOverlayData(currentText, Color.White)
                            currentText = ""
                        }
                        showTextDialog = false
                    }) { Text("Add") }
                }
            )
        }
    }
}

data class TextOverlayData(
    val text: String,
    val color: Color,
    var offset: IntOffset = IntOffset(0, 0)
)

@Composable
fun TextOverlayItem(data: TextOverlayData) {
    var offset by remember { mutableStateOf(data.offset) }
    Text(
        text = data.text,
        color = data.color,
        fontSize = 24.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .offset { offset }
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    offset = IntOffset(
                        offset.x + dragAmount.x.toInt(),
                        offset.y + dragAmount.y.toInt()
                    )
                    data.offset = offset
                }
            }
            .padding(8.dp)
    )
}
