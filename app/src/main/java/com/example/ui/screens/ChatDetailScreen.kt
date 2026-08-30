package com.example.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.EmojiEmotions
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.R
import com.example.data.ChatEntity
import com.example.data.MessageEntity
import com.example.ui.components.AvatarView
import com.example.ui.components.MessageBubble
import com.example.ui.components.VerifiedBadge
import com.example.ui.theme.WhatsAppBackgroundLight
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalPrimary
import com.example.util.AudioRecorder
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream

import androidx.compose.material.icons.automirrored.filled.Forward
import androidx.compose.material.icons.filled.Backspace
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Wallpaper
import androidx.compose.ui.graphics.Brush
import coil.compose.AsyncImage
import com.example.data.ContactEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatDetailScreen(
    chat: ChatEntity?,
    contact: ContactEntity? = null,
    messages: List<MessageEntity>,
    isDarkMode: Boolean,
    isTyping: Boolean = false,
    customWallpaper: String? = null,
    wallpaperDimming: Float = 0.15f,
    isAdmin: Boolean = false,
    onBackClick: () -> Unit,
    onContactInfoClick: () -> Unit,
    onWallpaperClick: () -> Unit = {},
    onVoiceCallClick: () -> Unit,
    onVideoCallClick: () -> Unit,
    onSendMessage: (content: String, type: String, mediaUrl: String, duration: Int, replyToMessageId: String?) -> Unit,
    onToggleStarMessage: (MessageEntity) -> Unit,
    onDeleteMessage: (String) -> Unit,
    onForwardMessage: (MessageEntity) -> Unit = {},
    onMediaClick: (MessageEntity) -> Unit = {},
    onCameraClick: () -> Unit = {},
    onToggleMuteChat: (String) -> Unit = {},
    onClearChat: () -> Unit,
    onChatRead: () -> Unit = {}
) {
    if (chat == null) return

    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(chat.id, chat.unreadCount) {
        if (chat.unreadCount > 0) {
            onChatRead()
        }
    }

    var showLocalSearch by remember { mutableStateOf(false) }
    var localSearchQuery by remember { mutableStateOf("") }
    var showDisappearingDialog by remember { mutableStateOf(false) }

    var inputText by remember { mutableStateOf("") }
    var isRecordingVoice by remember { mutableStateOf(false) }
    var voiceRecordDuration by remember { mutableIntStateOf(0) }
    var isRecordingHoldActive by remember { mutableStateOf(false) }
    var isRecordingLocked by remember { mutableStateOf(false) }
    var recordingDragOffset by remember { mutableStateOf(0f) }
    var showRecordingCancelledToast by remember { mutableStateOf(false) }
    var showAttachmentMenu by remember { mutableStateOf(false) }
    var showOptionsMenu by remember { mutableStateOf(false) }
    var showEmojiPicker by remember { mutableStateOf(false) }
    var selectedEmojiCategory by remember { mutableIntStateOf(0) }
    var selectedMessageForAction by remember { mutableStateOf<MessageEntity?>(null) }
    var replyingToMessage by remember { mutableStateOf<MessageEntity?>(null) }
    var showLocationDialog by remember { mutableStateOf(false) }
    var showContactDialog by remember { mutableStateOf(false) }

    val audioRecorder = remember { AudioRecorder(context) }
    var recordedAudioFile by remember { mutableStateOf<File?>(null) }

    val listState = rememberLazyListState()

    // Helper function to save bitmap to cache/files dir
    fun saveBitmapToFile(bitmap: Bitmap): String {
        val mediaDir = File(context.filesDir, "chat_media").apply { if (!exists()) mkdirs() }
        val imageFile = File(mediaDir, "IMG_${System.currentTimeMillis()}.jpg")
        FileOutputStream(imageFile).use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
        }
        return imageFile.absolutePath
    }

    // Helper to copy selected Uri to local app storage
    fun copyUriToLocalStorage(uri: Uri, prefix: String, extension: String): String {
        return try {
            val mediaDir = File(context.filesDir, "chat_media").apply { if (!exists()) mkdirs() }
            val destFile = File(mediaDir, "${prefix}_${System.currentTimeMillis()}.$extension")
            context.contentResolver.openInputStream(uri)?.use { input ->
                FileOutputStream(destFile).use { output ->
                    input.copyTo(output)
                }
            }
            destFile.absolutePath
        } catch (e: Exception) {
            uri.toString()
        }
    }

    // Helper to query file display name from Uri
    fun getUriDisplayName(uri: Uri): String {
        var name = "Document.pdf"
        try {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (cursor.moveToFirst() && nameIndex >= 0) {
                    name = cursor.getString(nameIndex)
                }
            }
        } catch (_: Exception) {}
        return name
    }

    // Camera Capture Launcher (Real implementation for image capture)
    val takePictureLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        if (bitmap != null) {
            val savedPath = saveBitmapToFile(bitmap)
            onSendMessage("Photo", "IMAGE", savedPath, 0, replyingToMessage?.id)
            replyingToMessage = null
        }
    }

    // Gallery Picker Launcher
    val pickPhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            val savedPath = copyUriToLocalStorage(uri, "GALLERY", "jpg")
            onSendMessage("Photo", "IMAGE", savedPath, 0, replyingToMessage?.id)
            replyingToMessage = null
        }
    }

    // Document Picker Launcher
    val pickDocumentLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            val fileName = getUriDisplayName(uri)
            val savedPath = copyUriToLocalStorage(uri, "DOC", "pdf")
            onSendMessage(fileName, "DOCUMENT", savedPath, 0, replyingToMessage?.id)
            replyingToMessage = null
        }
    }

    // Audio Picker Launcher
    val pickAudioLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            val fileName = getUriDisplayName(uri)
            val savedPath = copyUriToLocalStorage(uri, "AUDIO", "mp3")
            onSendMessage("🎵 $fileName", "VOICE", savedPath, 15, replyingToMessage?.id)
            replyingToMessage = null
        }
    }

    // Microphone Permission Launcher
    val recordAudioPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            val file = audioRecorder.startRecording()
            if (file != null) {
                recordedAudioFile = file
                isRecordingVoice = true
            } else {
                Toast.makeText(context, "Microphone recording started", Toast.LENGTH_SHORT).show()
                isRecordingVoice = true
            }
        } else {
            Toast.makeText(context, "Microphone permission is required to record voice notes.", Toast.LENGTH_SHORT).show()
        }
    }

    // Stop and release recorder if screen leaves
    DisposableEffect(Unit) {
        onDispose {
            if (isRecordingVoice) {
                audioRecorder.cancelRecording()
            }
        }
    }

    // Scroll to bottom when new messages arrive
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    // Voice recording timer
    LaunchedEffect(isRecordingVoice) {
        if (isRecordingVoice) {
            voiceRecordDuration = 0
            while (isRecordingVoice) {
                delay(1000)
                if (isRecordingVoice) {
                    voiceRecordDuration++
                }
            }
        }
    }

    // Dismiss recording cancelled banner
    LaunchedEffect(showRecordingCancelledToast) {
        if (showRecordingCancelledToast) {
            delay(2500)
            showRecordingCancelledToast = false
        }
    }

    // Dialog for Long-clicked message
    if (selectedMessageForAction != null) {
        val msg = selectedMessageForAction!!
        AlertDialog(
            onDismissRequest = { selectedMessageForAction = null },
            title = { Text("Message Options") },
            text = {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                replyingToMessage = msg
                                selectedMessageForAction = null
                            }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Reply", tint = WhatsAppEmerald)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("Reply to message", fontSize = 16.sp)
                    }

                    // Forward message option
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                val targetMsg = msg
                                selectedMessageForAction = null
                                onForwardMessage(targetMsg)
                            }
                            .padding(vertical = 12.dp)
                            .testTag("forward_message_option"),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Forward,
                            contentDescription = "Forward",
                            tint = WhatsAppMinimalPrimary
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("Forward message", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                    }

                    // Copy text option
                    if (msg.messageType == "TEXT" || msg.content.isNotBlank()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
                                    val clip = android.content.ClipData.newPlainText("Copied Text", msg.content)
                                    clipboard?.setPrimaryClip(clip)
                                    selectedMessageForAction = null
                                    Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()
                                }
                                .padding(vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "Copy", tint = Color.Gray)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Copy text", fontSize = 16.sp)
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                onToggleStarMessage(msg)
                                selectedMessageForAction = null
                            }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "Star",
                            tint = if (msg.isStarred) Color(0xFFFFB300) else Color.Gray
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(if (msg.isStarred) "Unstar message" else "Star message", fontSize = 16.sp)
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                onDeleteMessage(msg.id)
                                selectedMessageForAction = null
                            }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = Color.Red)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("Delete message", color = Color.Red, fontSize = 16.sp)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedMessageForAction = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Location Picker Dialog
    if (showLocationDialog) {
        AlertDialog(
            onDismissRequest = { showLocationDialog = false },
            title = { Text("Share Location") },
            text = {
                Column(modifier = Modifier.padding(top = 8.dp)) {
                    Text("Select a location to share in this chat:", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(14.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                showLocationDialog = false
                                onSendMessage("📍 Current Location\nGoogle HQ, 1600 Amphitheatre Pkwy, Mountain View, CA", "LOCATION", "geo:37.4220,-122.0841", 0, replyingToMessage?.id)
                                replyingToMessage = null
                            }
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.LocationOn, contentDescription = "Current Location", tint = Color(0xFF00C853))
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Share Current Location", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Accurate to 5 meters", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                showLocationDialog = false
                                onSendMessage("📍 Office • Metropolis Tower, 5th Floor", "LOCATION", "geo:37.7749,-122.4194", 0, replyingToMessage?.id)
                                replyingToMessage = null
                            }
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.LocationOn, contentDescription = "Office", tint = WhatsAppMinimalPrimary)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Share Work Address", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Metropolis Tower, 5th Floor", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showLocationDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Contact Card Picker Dialog
    if (showContactDialog) {
        AlertDialog(
            onDismissRequest = { showContactDialog = false },
            title = { Text("Share Contact Card") },
            text = {
                Column(modifier = Modifier.padding(top = 8.dp)) {
                    Text("Select a contact to share:", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(12.dp))
                    listOf(
                        "Alex Morgan" to "+1 (555) 234-5678",
                        "Sarah Connor" to "+1 (555) 987-6543",
                        "Tech Support Team" to "+1 (800) 555-0199"
                    ).forEach { (name, phone) ->
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable {
                                    showContactDialog = false
                                    onSendMessage("👤 $name\n$phone", "CONTACT", phone, 0, replyingToMessage?.id)
                                    replyingToMessage = null
                                }
                        ) {
                            Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                AvatarView(name = name, avatarUrl = "", size = 36.dp)
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(phone, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showContactDialog = false }) { Text("Cancel") }
            }
        )
    }

    DisposableEffect(Unit) {
        onDispose {
            focusManager.clearFocus()
        }
    }

    Scaffold(
        topBar = {
            if (showLocalSearch) {
                TopAppBar(
                    title = {
                        androidx.compose.material3.TextField(
                            value = localSearchQuery,
                            onValueChange = { localSearchQuery = it },
                            placeholder = { Text("Search messages...", fontSize = 15.sp) },
                            colors = androidx.compose.material3.TextFieldDefaults.colors(
                                focusedContainerColor = Color.Transparent,
                                unfocusedContainerColor = Color.Transparent,
                                disabledContainerColor = Color.Transparent,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent,
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("chat_local_search_input")
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = {
                            showLocalSearch = false
                            localSearchQuery = ""
                        }, modifier = Modifier.testTag("chat_local_search_close")) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close Search")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
                )
            } else {
                TopAppBar(
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clickable { onContactInfoClick() }
                                .padding(vertical = 4.dp)
                        ) {
                            AvatarView(
                                name = chat.contactName,
                                avatarUrl = chat.contactAvatar,
                                size = 40.dp
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = chat.contactName,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    if (chat.isVerified || contact?.isVerified == true) {
                                        VerifiedBadge(size = 18.dp)
                                    }
                                }
                                Text(
                                    text = when {
                                        isTyping -> "typing..."
                                        chat.isGroup -> "Tap for group info"
                                        contact?.isOnline == true -> "Online"
                                        !contact?.lastSeen.isNullOrBlank() -> {
                                            if (contact!!.lastSeen.equals("Online", ignoreCase = true)) "Online"
                                            else "last seen ${contact!!.lastSeen}"
                                        }
                                        else -> "offline"
                                    },
                                    fontSize = 12.sp,
                                    fontWeight = if (isTyping) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isTyping) WhatsAppMinimalPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBackClick) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = onVideoCallClick) {
                            Icon(imageVector = Icons.Default.Videocam, contentDescription = "Video Call")
                        }
                        IconButton(onClick = onVoiceCallClick) {
                            Icon(imageVector = Icons.Default.Call, contentDescription = "Voice Call")
                        }
                        Box {
                            IconButton(onClick = { showOptionsMenu = true }) {
                                Icon(imageVector = Icons.Default.MoreVert, contentDescription = "Options")
                            }
                            DropdownMenu(
                                expanded = showOptionsMenu,
                                onDismissRequest = { showOptionsMenu = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Contact info") },
                                    onClick = {
                                        showOptionsMenu = false
                                        onContactInfoClick()
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Media, links, and docs") },
                                    onClick = {
                                        showOptionsMenu = false
                                        onContactInfoClick()
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Search") },
                                    onClick = {
                                        showOptionsMenu = false
                                        showLocalSearch = true
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text(if (chat.isMuted) "Unmute notifications" else "Mute notifications") },
                                    onClick = {
                                        showOptionsMenu = false
                                        onToggleMuteChat(chat.id)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Disappearing messages") },
                                    onClick = {
                                        showOptionsMenu = false
                                        showDisappearingDialog = true
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Wallpaper") },
                                    leadingIcon = {
                                        Icon(imageVector = Icons.Default.Wallpaper, contentDescription = null, tint = WhatsAppMinimalPrimary)
                                    },
                                    onClick = {
                                        showOptionsMenu = false
                                        onWallpaperClick()
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Clear chat") },
                                    onClick = {
                                        showOptionsMenu = false
                                        onClearChat()
                                    }
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(if (isDarkMode) Color(0xFF0B141A) else WhatsAppBackgroundLight)
                .pointerInput(Unit) {
                    detectTapGestures(onTap = {
                        focusManager.clearFocus()
                        showAttachmentMenu = false
                        showEmojiPicker = false
                    })
                }
        ) {
            // Dynamic Wallpaper Rendering
            val effectiveWallpaper = customWallpaper ?: "DEFAULT"
            when {
                effectiveWallpaper.startsWith("content://") || effectiveWallpaper.startsWith("file://") -> {
                    AsyncImage(
                        model = effectiveWallpaper,
                        contentDescription = "Chat Wallpaper",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                effectiveWallpaper.startsWith("COLOR_") -> {
                    val colorHex = when (effectiveWallpaper) {
                        "COLOR_MINT" -> "#E0F2F1"
                        "COLOR_SKY" -> "#E3F2FD"
                        "COLOR_LAVENDER" -> "#EDE7F6"
                        "COLOR_PEACH" -> "#FBE9E7"
                        "COLOR_DARK_SLATE" -> "#111B21"
                        "COLOR_MIDNIGHT" -> "#0B141A"
                        "COLOR_CHARCOAL" -> "#202C33"
                        "COLOR_FOREST" -> "#0A281E"
                        "COLOR_INDIGO" -> "#1A1A3A"
                        else -> "#EFEAE2"
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(android.graphics.Color.parseColor(colorHex)))
                    )
                }
                effectiveWallpaper.startsWith("GRAD_") -> {
                    val colors = when (effectiveWallpaper) {
                        "GRAD_EMERALD" -> listOf(Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364))
                        "GRAD_SUNSET" -> listOf(Color(0xFFFF512F), Color(0xFFDD2476))
                        "GRAD_AURORA" -> listOf(Color(0xFF00C9FF), Color(0xFF92FE9D))
                        "GRAD_NEON" -> listOf(Color(0xFF8A2387), Color(0xFFE94057), Color(0xFFF27121))
                        "GRAD_PASTEL" -> listOf(Color(0xFFA1C4FD), Color(0xFFC2E9FB))
                        else -> listOf(Color(0xFF141E30), Color(0xFF243B55))
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Brush.verticalGradient(colors))
                    )
                }
                else -> {
                    Image(
                        painter = painterResource(id = R.drawable.img_chat_wallpaper_1787278101057),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        alpha = 0.18f,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            // Wallpaper Dimming Layer
            if (wallpaperDimming > 0f) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = wallpaperDimming))
                )
            }

            val displayedMessages = if (localSearchQuery.isBlank()) messages else messages.filter {
                it.content.contains(localSearchQuery, ignoreCase = true)
            }

            Column(modifier = Modifier.fillMaxSize()) {
                // Messages List
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .padding(vertical = 8.dp)
                ) {
                    item {
                        // Encryption Badge Banner
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp, horizontal = 24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = Color(0xFFFFE082).copy(alpha = 0.3f)
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = "🔒 Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.",
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                    modifier = Modifier.padding(8.dp)
                                )
                            }
                        }
                    }

                    items(displayedMessages, key = { it.id }) { msg ->
                        val quotedMsg = msg.replyToMessageId?.let { refId ->
                            messages.firstOrNull { it.id == refId }
                        }

                        MessageBubble(
                            message = msg,
                            quotedMessage = quotedMsg,
                            contactName = chat.contactName,
                            isDarkMode = isDarkMode,
                            onLongClick = { selectedMessageForAction = msg },
                            onReply = { messageToReply ->
                                replyingToMessage = messageToReply
                            },
                            onMediaClick = { clickedMsg ->
                                onMediaClick(clickedMsg)
                            },
                            onQuotedClick = { quotedId ->
                                val targetIndex = messages.indexOfFirst { it.id == quotedId }
                                if (targetIndex >= 0) {
                                    coroutineScope.launch {
                                        listState.animateScrollToItem(targetIndex + 1)
                                    }
                                }
                            }
                        )
                    }
                }

                // Recording Cancelled Banner Notification
                AnimatedVisibility(visible = showRecordingCancelledToast) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Cancelled", tint = Color.Red)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Voice recording cancelled and discarded.",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.Red
                            )
                        }
                    }
                }

                // Attachment Overlay Menu Popup
                AnimatedVisibility(
                    visible = showAttachmentMenu,
                    enter = fadeIn() + slideInVertically { it / 2 },
                    exit = fadeOut() + slideOutVertically { it / 2 }
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(18.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                AttachmentOptionItem(
                                    icon = Icons.Default.Description,
                                    label = "Document",
                                    bgColor = Color(0xFF7F66FF)
                                ) {
                                    showAttachmentMenu = false
                                    pickDocumentLauncher.launch("*/*")
                                }
                                AttachmentOptionItem(
                                    icon = Icons.Default.CameraAlt,
                                    label = "Camera",
                                    bgColor = Color(0xFFFF4274)
                                ) {
                                    showAttachmentMenu = false
                                    takePictureLauncher.launch(null)
                                }
                                AttachmentOptionItem(
                                    icon = Icons.Default.Image,
                                    label = "Gallery",
                                    bgColor = Color(0xFFC861FB)
                                ) {
                                    showAttachmentMenu = false
                                    pickPhotoLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                AttachmentOptionItem(
                                    icon = Icons.Default.Headphones,
                                    label = "Audio",
                                    bgColor = Color(0xFFFF9800)
                                ) {
                                    showAttachmentMenu = false
                                    pickAudioLauncher.launch("audio/*")
                                }
                                AttachmentOptionItem(
                                    icon = Icons.Default.LocationOn,
                                    label = "Location",
                                    bgColor = Color(0xFF00C853)
                                ) {
                                    showAttachmentMenu = false
                                    showLocationDialog = true
                                }
                                AttachmentOptionItem(
                                    icon = Icons.Default.Person,
                                    label = "Contact",
                                    bgColor = Color(0xFF0091EA)
                                ) {
                                    showAttachmentMenu = false
                                    showContactDialog = true
                                }
                            }
                        }
                    }
                }

                // WhatsApp-Style Reply Bar (Displayed when replyingToMessage != null)
                AnimatedVisibility(
                    visible = replyingToMessage != null,
                    enter = fadeIn() + slideInVertically { it },
                    exit = fadeOut() + slideOutVertically { it }
                ) {
                    val replyMsg = replyingToMessage
                    if (replyMsg != null) {
                        val replyIsMe = replyMsg.senderId == "ME"
                        val replySenderName = if (replyIsMe) "You" else chat.contactName

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                                .testTag("reply_preview_card"),
                            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 8.dp, bottomEnd = 8.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.9f)
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .width(4.dp)
                                        .height(38.dp)
                                        .clip(RoundedCornerShape(2.dp))
                                        .background(WhatsAppMinimalPrimary)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Replying to $replySenderName",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = WhatsAppMinimalPrimary
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = when (replyMsg.messageType) {
                                            "IMAGE" -> "📷 Photo"
                                            "VOICE" -> "🎤 Voice note"
                                            "DOCUMENT" -> "📄 Document"
                                            "LOCATION" -> "📍 Location"
                                            "CONTACT" -> "👤 Contact"
                                            else -> replyMsg.content
                                        },
                                        fontSize = 12.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                IconButton(
                                    onClick = { replyingToMessage = null },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Cancel reply",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Chat Input Bar
                if (chat != null && chat.isOfficial && !chat.allowComments && !isAdmin) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                            .padding(vertical = 14.dp, horizontal = 20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Only system administrators can send messages to this community.",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                } else {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 8.dp)
                            ) {
                                IconButton(
                                    onClick = {
                                        showEmojiPicker = !showEmojiPicker
                                        if (showEmojiPicker) showAttachmentMenu = false
                                    },
                                    modifier = Modifier.testTag("emoji_picker_toggle_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.EmojiEmotions,
                                        contentDescription = "Emojis",
                                        tint = if (showEmojiPicker) WhatsAppMinimalPrimary else Color.Gray
                                    )
                                }

                                if (isRecordingVoice) {
                                    Row(
                                        modifier = Modifier.weight(1f),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Mic,
                                            contentDescription = "Recording",
                                            tint = Color.Red,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = String.format("%02d:%02d", voiceRecordDuration / 60, voiceRecordDuration % 60),
                                            color = Color.Red,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Spacer(modifier = Modifier.width(16.dp))

                                        // Animated "Slide to cancel"
                                        Text(
                                            text = if (isRecordingLocked) "Recording..." else "< Slide to cancel",
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontSize = 14.sp,
                                            modifier = Modifier.weight(1f)
                                        )

                                        if (isRecordingLocked) {
                                            TextButton(
                                                onClick = {
                                                    audioRecorder.cancelRecording()
                                                    recordedAudioFile = null
                                                    isRecordingVoice = false
                                                    isRecordingLocked = false
                                                    voiceRecordDuration = 0
                                                    showRecordingCancelledToast = true
                                                }
                                            ) {
                                                Text("Discard", color = Color.Red)
                                            }
                                        }
                                    }
                                } else {
                                    OutlinedTextField(
                                        value = inputText,
                                        onValueChange = { inputText = it },
                                        placeholder = { Text("Message") },
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = Color.Transparent,
                                            unfocusedBorderColor = Color.Transparent
                                        ),
                                        modifier = Modifier
                                            .weight(1f)
                                            .testTag("chat_input_field")
                                    )
                                }

                                if (!isRecordingVoice) {
                                    IconButton(
                                        onClick = { showAttachmentMenu = !showAttachmentMenu },
                                        modifier = Modifier.testTag("attachment_button")
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.AttachFile,
                                            contentDescription = "Attach file",
                                            tint = Color.Gray
                                        )
                                    }

                                    if (inputText.isBlank()) {
                                        IconButton(
                                            onClick = {
                                                onCameraClick()
                                            },
                                            modifier = Modifier.testTag("camera_icon_button")
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.CameraAlt,
                                                contentDescription = "Camera",
                                                tint = Color.Gray
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        // Floating Send / Record button
                        Box(
                            modifier = Modifier
                                .size(if (isRecordingVoice && !isRecordingLocked) 64.dp else 48.dp)
                                .clip(CircleShape)
                                .background(if (isRecordingVoice) WhatsAppMinimalPrimary else WhatsAppMinimalAccent)
                                .pointerInput(Unit) {
                                    detectDragGestures(
                                        onDragStart = { _ ->
                                            if (!isRecordingVoice && inputText.isBlank()) {
                                                val hasMicPermission = ContextCompat.checkSelfPermission(
                                                    context,
                                                    Manifest.permission.RECORD_AUDIO
                                                ) == PackageManager.PERMISSION_GRANTED

                                                if (hasMicPermission) {
                                                    val file = audioRecorder.startRecording()
                                                    recordedAudioFile = file
                                                    isRecordingVoice = true
                                                    isRecordingHoldActive = true
                                                } else {
                                                    recordAudioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                                }
                                            }
                                        },
                                        onDrag = { change, dragAmount ->
                                            change.consume()
                                            if (isRecordingHoldActive && !isRecordingLocked) {
                                                recordingDragOffset += dragAmount.x
                                                // If slid left enough, cancel
                                                if (recordingDragOffset < -250f) {
                                                    audioRecorder.cancelRecording()
                                                    recordedAudioFile = null
                                                    isRecordingVoice = false
                                                    isRecordingHoldActive = false
                                                    voiceRecordDuration = 0
                                                    showRecordingCancelledToast = true
                                                    recordingDragOffset = 0f
                                                }
                                            }
                                        },
                                        onDragEnd = {
                                            if (isRecordingHoldActive && !isRecordingLocked) {
                                                // Complete and send
                                                val stoppedFile = audioRecorder.stopRecording() ?: recordedAudioFile
                                                val finalPath = stoppedFile?.absolutePath ?: ""
                                                val duration = voiceRecordDuration.coerceAtLeast(1)
                                                isRecordingVoice = false
                                                isRecordingHoldActive = false
                                                recordedAudioFile = null
                                                voiceRecordDuration = 0
                                                onSendMessage("Voice note", "VOICE", finalPath, duration, replyingToMessage?.id)
                                                replyingToMessage = null
                                                recordingDragOffset = 0f
                                            }
                                        },
                                        onDragCancel = {
                                            if (isRecordingHoldActive && !isRecordingLocked) {
                                                audioRecorder.cancelRecording()
                                                recordedAudioFile = null
                                                isRecordingVoice = false
                                                isRecordingHoldActive = false
                                                voiceRecordDuration = 0
                                                recordingDragOffset = 0f
                                            }
                                        }
                                    )
                                }
                                .clickable {
                                    if (isRecordingLocked) {
                                        // Send locked recording
                                        val stoppedFile = audioRecorder.stopRecording() ?: recordedAudioFile
                                        val finalPath = stoppedFile?.absolutePath ?: ""
                                        val duration = voiceRecordDuration.coerceAtLeast(1)
                                        isRecordingVoice = false
                                        isRecordingLocked = false
                                        recordedAudioFile = null
                                        voiceRecordDuration = 0
                                        onSendMessage("Voice note", "VOICE", finalPath, duration, replyingToMessage?.id)
                                        replyingToMessage = null
                                    } else if (inputText.isNotBlank()) {
                                        onSendMessage(inputText.trim(), "TEXT", "", 0, replyingToMessage?.id)
                                        inputText = ""
                                        replyingToMessage = null
                                    }
                                }
                                .testTag("send_record_button"),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = when {
                                    isRecordingVoice -> Icons.AutoMirrored.Filled.Send
                                    inputText.isNotBlank() -> Icons.AutoMirrored.Filled.Send
                                    else -> Icons.Default.Mic
                                },
                                contentDescription = "Send or Record",
                                tint = Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }

                // Interactive Emoji Keyboard Picker Panel
                AnimatedVisibility(
                    visible = showEmojiPicker,
                    enter = fadeIn() + slideInVertically { it },
                    exit = fadeOut() + slideOutVertically { it }
                ) {
                    EmojiPickerKeyboard(
                        onEmojiSelected = { emoji ->
                            inputText += emoji
                        },
                        onBackspace = {
                            if (inputText.isNotEmpty()) {
                                inputText = inputText.dropLast(1)
                            }
                        }
                    )
                }
            }
        }
    }

    if (showDisappearingDialog) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showDisappearingDialog = false },
            title = { Text("Disappearing messages", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Make messages in this chat disappear. New messages will disappear for everyone after the selected duration. Keep in mind that recipients can still save these messages elsewhere.", fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    listOf("24 hours", "7 days", "90 days", "Off").forEach { option ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showDisappearingDialog = false
                                    val statusMessage = if (option == "Off") {
                                        "You turned off disappearing messages."
                                    } else {
                                        "You set messages to disappear after $option."
                                    }
                                    onSendMessage(statusMessage, "SYSTEM", "", 0, null)
                                }
                                .padding(vertical = 12.dp)
                        ) {
                            androidx.compose.material3.RadioButton(
                                selected = false,
                                onClick = null
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(option, fontSize = 16.sp)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showDisappearingDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun EmojiPickerKeyboard(
    onEmojiSelected: (String) -> Unit,
    onBackspace: () -> Unit
) {
    var selectedCategory by remember { mutableIntStateOf(0) }

    val smileyEmojis = remember {
        listOf(
            "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥹", "☺️",
            "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗",
            "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🫣",
            "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏",
            "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪", "🤤", "😴",
            "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵",
            "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😱", "😨", "😰"
        )
    }

    val gestureEmojis = remember {
        listOf(
            "👍", "👎", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️",
            "💅", "🤳", "💪", "🦾", "🦵", "🦶", "👂", "👃", "🧠", "🫀",
            "👀", "👁️", "👅", "👄", "🫦", "👋", "🤚", "🖐️", "✋", "🖖",
            "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈",
            "👉", "👆", "👇", "☝️", "🫵", "✊", "👊", "🤛", "🤜", "🤝"
        )
    }

    val heartEmojis = remember {
        listOf(
            "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
            "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
            "💟", "🔥", "✨", "💫", "⭐", "🌟", "💥", "💯", "💢", "💨",
            "💦", "💤", "🕳️", "🎉", "🎊", "🎂", "🎁", "🎈", "🍻", "🥂"
        )
    }

    val objectEmojis = remember {
        listOf(
            "☕", "🍕", "🍔", "🍟", "🍩", "🍦", "🏆", "🥇", "⚽", "🏀",
            "🎮", "🎧", "📱", "💻", "🚀", "🚗", "✈️", "🏖️", "🏝️", "🏕️",
            "💡", "🔑", "💎", "📷", "🎥", "🎬", "🎨", "🎤", "🎸", "🎹",
            "📚", "📝", "📌", "📍", "⏰", "⌛", "🎁", "💌", "📦", "🎯"
        )
    }

    val currentList = when (selectedCategory) {
        0 -> smileyEmojis
        1 -> gestureEmojis
        2 -> heartEmojis
        else -> objectEmojis
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(230.dp)
            .testTag("emoji_keyboard_panel"),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 6.dp
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Category navigation bar + backspace
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                listOf("😃", "👍", "❤️", "🎉").forEachIndexed { index, iconText ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (selectedCategory == index) WhatsAppMinimalPrimary.copy(alpha = 0.2f) else Color.Transparent)
                            .clickable { selectedCategory = index }
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = iconText, fontSize = 18.sp)
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                }

                Spacer(modifier = Modifier.weight(1f))

                // Backspace button
                IconButton(
                    onClick = onBackspace,
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Backspace,
                        contentDescription = "Backspace",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // Grid of emojis
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                val chunks = currentList.chunked(7)
                items(chunks) { rowEmojis ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        rowEmojis.forEach { emoji ->
                            Text(
                                text = emoji,
                                fontSize = 24.sp,
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .clickable { onEmojiSelected(emoji) }
                                    .padding(4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AttachmentOptionItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    bgColor: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable(onClick = onClick)
            .testTag("attachment_item_$label")
    ) {
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(CircleShape)
                .background(bgColor),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = label, tint = Color.White)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
    }
}
