package com.example.ui.screens

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.InfiniteRepeatableSpec
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Cameraswitch
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.example.data.ContactEntity
import com.example.ui.components.AvatarView
import com.example.ui.theme.WhatsAppDarkHeader
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalPrimary
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CallScreen(
    contact: ContactEntity?,
    isVideoCall: Boolean,
    onEndCallClick: () -> Unit
) {
    val context = LocalContext.current

    // Request Camera & Record Audio permissions dynamically
    val permissionsState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
    )

    val hasCameraPermission = permissionsState.permissions.find { it.permission == Manifest.permission.CAMERA }?.status?.isGranted == true
    val hasAudioPermission = permissionsState.permissions.find { it.permission == Manifest.permission.RECORD_AUDIO }?.status?.isGranted == true

    LaunchedEffect(Unit) {
        if (!hasCameraPermission || !hasAudioPermission) {
            permissionsState.launchMultiplePermissionRequest()
        }
    }

    var isMuted by remember { mutableStateOf(false) }
    var isSpeakerOn by remember { mutableStateOf(isVideoCall) }
    var isVideoEnabled by remember { mutableStateOf(isVideoCall) }
    var isFrontCamera by remember { mutableStateOf(true) }
    var isCallPickedUp by remember { mutableStateOf(false) }
    var durationSeconds by remember { mutableIntStateOf(0) }
    var actionToast by remember { mutableStateOf<String?>(null) }

    // Simulate call pickup after ringing
    LaunchedEffect(Unit) {
        delay(3200)
        isCallPickedUp = true
    }

    // Call Timer - ONLY increments after call is picked up
    LaunchedEffect(isCallPickedUp) {
        if (isCallPickedUp) {
            while (true) {
                delay(1000)
                durationSeconds++
            }
        }
    }

    // Auto dismiss action toast
    LaunchedEffect(actionToast) {
        if (actionToast != null) {
            delay(2000)
            actionToast = null
        }
    }

    val transition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by transition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.15f,
        animationSpec = InfiniteRepeatableSpec(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    // Real Microphone amplitude level detector
    val liveMicLevel = rememberLiveMicLevel(isMuted = isMuted, hasAudioPermission = hasAudioPermission)

    // Route speakerphone audio settings
    LaunchedEffect(isSpeakerOn) {
        try {
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            audioManager?.let {
                it.mode = AudioManager.MODE_IN_COMMUNICATION
                it.isSpeakerphoneOn = isSpeakerOn
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // Reset audio settings on leaving call screen
    DisposableEffect(Unit) {
        onDispose {
            try {
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
                audioManager?.mode = AudioManager.MODE_NORMAL
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    val formattedDuration = String.format("%02d:%02d", durationSeconds / 60, durationSeconds % 60)
    val statusSubtitle = if (isCallPickedUp) formattedDuration else "Ringing..."

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(WhatsAppDarkHeader)
    ) {
        if (isVideoCall && isVideoEnabled) {
            // --- LIVE CAMERA VIDEO CALL VIEW ---
            Box(modifier = Modifier.fillMaxSize()) {
                if (hasCameraPermission) {
                    // Fullscreen Real Camera Preview
                    CameraPreviewView(
                        isFrontCamera = isFrontCamera,
                        isPaused = !isVideoEnabled,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    // Permission Banner fallback
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFF0F172A)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "Camera Permission Required",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { permissionsState.launchMultiplePermissionRequest() },
                                colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                            ) {
                                Text("Grant Camera Permission")
                            }
                        }
                    }
                }

                // Top Floating Glassmorphism Header
                Surface(
                    color = Color.Black.copy(alpha = 0.5f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 48.dp, bottom = 16.dp, start = 20.dp, end = 20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(Color.Green)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "VIBEZ Live HD Video",
                                color = Color.White.copy(alpha = 0.9f),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = contact?.name ?: "Contact",
                            color = Color.White,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = statusSubtitle,
                            color = if (isCallPickedUp) Color.Green else Color.Yellow,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                // Floating Remote Contact PIP Card overlay
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 130.dp, end = 16.dp)
                        .width(100.dp)
                        .height(140.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.Black.copy(alpha = 0.6f))
                        .border(2.dp, WhatsAppMinimalPrimary, RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        AvatarView(
                            name = contact?.name ?: "Contact",
                            avatarUrl = contact?.avatarUrl ?: "",
                            size = 50.dp
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = contact?.name?.take(10) ?: "Contact",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        } else {
            // --- VOICE CALL CANVAS ---
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .padding(top = 60.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = if (isVideoCall) "Video Paused" else "VIBEZ Voice Call",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = contact?.name ?: "Contact",
                    color = Color.White,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = statusSubtitle,
                    color = if (isCallPickedUp) WhatsAppMinimalPrimary else Color.Yellow,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(50.dp))

                // Avatar Ring & Dynamic Voice Level Visualizer
                Box(
                    modifier = Modifier
                        .size((160 + (liveMicLevel * 40)).dp)
                        .scale(if (liveMicLevel > 0.05f) 1f + liveMicLevel * 0.15f else pulseScale)
                        .clip(CircleShape)
                        .background(
                            if (liveMicLevel > 0.05f) WhatsAppMinimalPrimary.copy(alpha = 0.4f)
                            else WhatsAppMinimalAccent.copy(alpha = 0.2f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    AvatarView(
                        name = contact?.name ?: "Contact",
                        avatarUrl = contact?.avatarUrl ?: "",
                        size = 130.dp
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Real Microphone VU Meter Wave Indicators
                if (!isMuted && hasAudioPermission) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.GraphicEq,
                            contentDescription = "Mic Activity",
                            tint = WhatsAppMinimalPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                        val levelPct = (liveMicLevel * 100).toInt().coerceIn(0, 100)
                        Text(
                            text = if (liveMicLevel > 0.05f) "Live Mic Active ($levelPct%)" else "Microphone Listening...",
                            color = if (liveMicLevel > 0.05f) Color.Green else Color.White.copy(alpha = 0.7f),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                } else if (isMuted) {
                    Text(
                        text = "Microphone Muted",
                        color = Color.Red.copy(alpha = 0.8f),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // --- ACTION TOAST BANNER ---
        AnimatedVisibility(
            visible = actionToast != null,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 160.dp)
        ) {
            Surface(
                color = Color.Black.copy(alpha = 0.8f),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.padding(horizontal = 24.dp)
            ) {
                Text(
                    text = actionToast ?: "",
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }
        }

        // --- BOTTOM INTERACTIVE CONTROLS BAR ---
        Surface(
            color = Color.Black.copy(alpha = 0.85f),
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 24.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 1. Speakerphone Toggle
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(if (isSpeakerOn) WhatsAppMinimalAccent else Color.White.copy(alpha = 0.2f))
                        .clickable {
                            isSpeakerOn = !isSpeakerOn
                            actionToast = if (isSpeakerOn) "Speakerphone ON" else "Speakerphone OFF"
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isSpeakerOn) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                        contentDescription = "Speaker",
                        tint = if (isSpeakerOn) Color.Black else Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }

                // 2. Microphone Mute Toggle
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(if (isMuted) Color.White else Color.White.copy(alpha = 0.2f))
                        .clickable {
                            if (!hasAudioPermission) {
                                permissionsState.launchMultiplePermissionRequest()
                            } else {
                                isMuted = !isMuted
                                actionToast = if (isMuted) "Microphone Muted" else "Microphone Active"
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Mute",
                        tint = if (isMuted) Color.Red else Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                }

                // 3. Video On/Off Toggle (if Video Call mode)
                if (isVideoCall) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(if (!isVideoEnabled) Color.White else Color.White.copy(alpha = 0.2f))
                            .clickable {
                                if (!hasCameraPermission) {
                                    permissionsState.launchMultiplePermissionRequest()
                                } else {
                                    isVideoEnabled = !isVideoEnabled
                                    actionToast = if (isVideoEnabled) "Video Enabled" else "Video Paused"
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isVideoEnabled) Icons.Default.Videocam else Icons.Default.VideocamOff,
                            contentDescription = "Toggle Video",
                            tint = if (!isVideoEnabled) Color.Red else Color.White,
                            modifier = Modifier.size(26.dp)
                        )
                    }

                    // 4. Camera Switch (Front/Back)
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                            .clickable {
                                isFrontCamera = !isFrontCamera
                                actionToast = if (isFrontCamera) "Switched to Front Camera" else "Switched to Rear Camera"
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Cameraswitch,
                            contentDescription = "Switch Camera",
                            tint = Color.White,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                }

                // 5. End Call Button
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFDC2626))
                        .clickable(onClick = onEndCallClick),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CallEnd,
                        contentDescription = "End call",
                        tint = Color.White,
                        modifier = Modifier.size(30.dp)
                    )
                }
            }
        }
    }
}

// --- CAMERAX PREVIEW COMPOSABLE ---
@Composable
fun CameraPreviewView(
    isFrontCamera: Boolean,
    isPaused: Boolean,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    if (isPaused) {
        Box(
            modifier = modifier.background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.VideocamOff,
                contentDescription = "Camera Paused",
                tint = Color.White.copy(alpha = 0.5f),
                modifier = Modifier.size(48.dp)
            )
        }
    } else {
        AndroidView(
            factory = { ctx ->
                val previewView = PreviewView(ctx).apply {
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
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
                        e.printStackTrace()
                    }
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            },
            update = { previewView ->
                val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
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
                        e.printStackTrace()
                    }
                }, ContextCompat.getMainExecutor(context))
            },
            modifier = modifier
        )
    }
}

// --- LIVE MICROPHONE AMPLITUDE DETECTOR ---
@SuppressLint("MissingPermission")
@Composable
fun rememberLiveMicLevel(isMuted: Boolean, hasAudioPermission: Boolean): Float {
    var micLevel by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(isMuted, hasAudioPermission) {
        if (!hasAudioPermission || isMuted) {
            micLevel = 0f
            return@LaunchedEffect
        }

        withContext(Dispatchers.IO) {
            val sampleRate = 8000
            val channelConfig = AudioFormat.CHANNEL_IN_MONO
            val audioFormat = AudioFormat.ENCODING_PCM_16BIT
            val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)

            if (bufferSize <= 0) return@withContext

            var audioRecord: AudioRecord? = null
            try {
                audioRecord = AudioRecord(
                    MediaRecorder.AudioSource.MIC,
                    sampleRate,
                    channelConfig,
                    audioFormat,
                    bufferSize
                )

                if (audioRecord.state == AudioRecord.STATE_INITIALIZED) {
                    audioRecord.startRecording()
                    val buffer = ShortArray(bufferSize)

                    while (isActive && !isMuted) {
                        val readSize = audioRecord.read(buffer, 0, buffer.size)
                        if (readSize > 0) {
                            var maxAmp = 0
                            for (i in 0 until readSize) {
                                val absVal = Math.abs(buffer[i].toInt())
                                if (absVal > maxAmp) maxAmp = absVal
                            }
                            val normalized = (maxAmp / 8000f).coerceIn(0f, 1f)
                            withContext(Dispatchers.Main) {
                                micLevel = normalized
                            }
                        }
                        delay(60)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                try {
                    audioRecord?.stop()
                    audioRecord?.release()
                } catch (e: Exception) {
                    // Ignore release errors
                }
            }
        }
    }

    return micLevel
}
