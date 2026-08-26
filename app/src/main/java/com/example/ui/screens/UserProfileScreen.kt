package com.example.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.asImageBitmap
import com.example.util.QrCodeGenerator
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PermIdentity
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.AvatarView
import com.example.ui.components.VerifiedBadge
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.launch
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.FirebaseAuth
import com.example.BuildConfig
import com.example.R
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.BorderStroke

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun UserProfileScreen(
    contactId: String = "ME",
    contactName: String,
    contactPhone: String,
    contactAvatar: String = "",
    contactStatus: String = "⚡ Vibing in VIBEZ",
    isCurrentUser: Boolean = false,
    isGroup: Boolean = false,
    isVerified: Boolean = false,
    onBackClick: () -> Unit,
    onChangePhoneClick: (() -> Unit)? = null,
    onUpdateProfile: ((name: String, phone: String, status: String, avatarUrl: String?) -> Unit)? = null,
    onUpdateContact: ((contactId: String, name: String, phone: String, about: String) -> Unit)? = null,
    onMessageClick: (() -> Unit)? = null,
    onVoiceCallClick: (() -> Unit)? = null,
    onVideoCallClick: (() -> Unit)? = null,
    onQrScanClick: (() -> Unit)? = null,
    onMediaClick: (() -> Unit)? = null,
    onGetBadgeClick: () -> Unit = {},
    onViewBadgeReceiptClick: () -> Unit = {}
) {
    val clipboardManager = LocalClipboardManager.current
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val credentialManager = remember { CredentialManager.create(context) }
    var isLinkingGoogle by remember { mutableStateOf(false) }
    val firebaseAuth = remember { FirebaseAuth.getInstance() }
    var currentUserState by remember { mutableStateOf(firebaseAuth.currentUser) }

    // Local mutable state for editing
    var currentName by remember(contactName) { mutableStateOf(contactName) }
    var currentPhone by remember(contactPhone) { mutableStateOf(contactPhone) }
    var currentStatus by remember(contactStatus) { mutableStateOf(contactStatus) }
    var currentAvatar by remember(contactAvatar) { mutableStateOf(contactAvatar) }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val uriStr = uri.toString()
            currentAvatar = uriStr
            onUpdateProfile?.invoke(currentName, currentPhone, currentStatus, uriStr)
            scope.launch {
                snackbarHostState.showSnackbar("Profile photo updated & synced with backend")
            }
        }
    }

    // Dialog state
    var showNameLockedInfoDialog by remember { mutableStateOf(false) }
    var showEditStatusDialog by remember { mutableStateOf(false) }
    var showEditContactDialog by remember { mutableStateOf(false) }
    var showQrDialog by remember { mutableStateOf(false) }

    // Temporary editing values for dialogs
    var editNameInput by remember { mutableStateOf("") }
    var editPhoneInput by remember { mutableStateOf("") }
    var editStatusInput by remember { mutableStateOf("") }

    val presetVibes = listOf(
        "⚡ Vibing in VIBEZ",
        "💻 Code & Chill",
        "🎧 Music Mode",
        "🌴 On Vacation",
        "🔋 Battery Low",
        "🚀 Building the future",
        "✨ Living in the moment",
        "☕ Coffee & Chat"
    )

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isCurrentUser) "Profile" else "Contact Info",
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Bold
                    )
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
                    if (isCurrentUser) {
                        IconButton(onClick = { showQrDialog = true }) {
                            Icon(
                                imageVector = Icons.Default.QrCode,
                                contentDescription = "My QR Code",
                                tint = WhatsAppMinimalPrimary
                            )
                        }
                    } else {
                        IconButton(onClick = {
                            editNameInput = currentName
                            editPhoneInput = currentPhone
                            editStatusInput = currentStatus
                            showEditContactDialog = true
                        }) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Edit Contact",
                                tint = WhatsAppMinimalPrimary
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // 1. HERO IDENTITY CARD
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                brush = Brush.verticalGradient(
                                    colors = listOf(
                                        WhatsAppMinimalNavPill,
                                        MaterialTheme.colorScheme.surfaceVariant
                                    )
                                )
                            )
                            .padding(vertical = 24.dp, horizontal = 20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Avatar view with camera / edit badge
                        Box(contentAlignment = Alignment.BottomEnd) {
                            Box(
                                modifier = Modifier
                                    .size(116.dp)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.linearGradient(
                                            colors = listOf(WhatsAppMinimalAccent, WhatsAppMinimalPrimary)
                                        )
                                    )
                                    .padding(3.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                AvatarView(
                                    name = currentName,
                                    avatarUrl = currentAvatar,
                                    isGroup = isGroup,
                                    size = 110.dp
                                )
                            }

                            if (isCurrentUser) {
                                Surface(
                                    shape = CircleShape,
                                    color = WhatsAppMinimalPrimary,
                                    shadowElevation = 4.dp,
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clickable {
                                            imagePickerLauncher.launch("image/*")
                                        }
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.PhotoCamera,
                                            contentDescription = "Change photo",
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(WhatsAppMinimalPrimary)
                                        .padding(2.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Verified,
                                        contentDescription = "Verified",
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Full Display Name (Read-Only Identity)
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable(enabled = isCurrentUser) {
                                showNameLockedInfoDialog = true
                            }
                        ) {
                            Text(
                                text = currentName,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            if (isVerified) {
                                VerifiedBadge(size = 22.dp)
                            }
                            if (isCurrentUser) {
                                Spacer(modifier = Modifier.width(8.dp))
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = "Name is locked",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        // Phone Number Chip (Read-Only Identity with Change Request Action)
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = WhatsAppMinimalPrimary.copy(alpha = 0.12f),
                                modifier = Modifier.clickable {
                                    clipboardManager.setText(AnnotatedString(currentPhone))
                                    scope.launch {
                                        snackbarHostState.showSnackbar("Phone number copied to clipboard")
                                    }
                                }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Phone,
                                        contentDescription = "Phone",
                                        tint = WhatsAppMinimalPrimary,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = currentPhone,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = WhatsAppMinimalPrimary
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Icon(
                                        imageVector = Icons.Default.ContentCopy,
                                        contentDescription = "Copy phone number",
                                        tint = WhatsAppMinimalPrimary,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                            }

                            if (isCurrentUser && onChangePhoneClick != null) {
                                Spacer(modifier = Modifier.width(8.dp))
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = WhatsAppMinimalAccent.copy(alpha = 0.15f),
                                    modifier = Modifier.clickable {
                                        onChangePhoneClick()
                                    }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Edit,
                                            contentDescription = "Change Number",
                                            tint = WhatsAppMinimalAccent,
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "Change",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = WhatsAppMinimalAccent
                                        )
                                    }
                                }
                            }
                        }

                        // Quick Actions Bar (for contacts)
                        if (!isCurrentUser && (onMessageClick != null || onVoiceCallClick != null || onVideoCallClick != null)) {
                            Spacer(modifier = Modifier.height(20.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (onMessageClick != null) {
                                    ProfileActionButton(
                                        icon = Icons.Default.Chat,
                                        label = "Message",
                                        onClick = onMessageClick
                                    )
                                }
                                if (onVoiceCallClick != null) {
                                    ProfileActionButton(
                                        icon = Icons.Default.Call,
                                        label = "Audio",
                                        onClick = onVoiceCallClick
                                    )
                                }
                                if (onVideoCallClick != null) {
                                    ProfileActionButton(
                                        icon = Icons.Default.Videocam,
                                        label = "Video",
                                        onClick = onVideoCallClick
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // LINKED ACCOUNTS SECTION (Only visible to current user for binding accounts)
            if (isCurrentUser) {
                item {
                    val isGoogleLinked = currentUserState?.providerData?.any {
                        it.providerId == com.google.firebase.auth.GoogleAuthProvider.PROVIDER_ID
                    } == true
                    val googleEmail = currentUserState?.providerData?.find {
                        it.providerId == com.google.firebase.auth.GoogleAuthProvider.PROVIDER_ID
                    }?.email ?: currentUserState?.email

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Linked Accounts",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = WhatsAppMinimalPrimary
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_google_logo),
                                    contentDescription = "Google",
                                    tint = Color.Unspecified,
                                    modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.width(14.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = if (isGoogleLinked && !googleEmail.isNullOrEmpty()) googleEmail else "Google Account",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = if (isGoogleLinked) "Linked securely for verification & easy backups" else "Not linked",
                                        fontSize = 12.sp,
                                        color = if (isGoogleLinked) WhatsAppMinimalPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                if (isGoogleLinked) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Linked",
                                        tint = WhatsAppMinimalPrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            if (!isGoogleLinked) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "Link your Google account to secure your chats, enable easy cloud backups, and allow seamless logins across devices.",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    lineHeight = 16.sp
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        scope.launch {
                                            isLinkingGoogle = true
                                            try {
                                                if (BuildConfig.GOOGLE_WEB_CLIENT_ID.isEmpty() || BuildConfig.GOOGLE_WEB_CLIENT_ID == "your-google-web-client-id.apps.googleusercontent.com") {
                                                    snackbarHostState.showSnackbar("Google Web Client ID is not configured!")
                                                    isLinkingGoogle = false
                                                    return@launch
                                                }

                                                val googleIdOption = GetGoogleIdOption.Builder()
                                                    .setFilterByAuthorizedAccounts(false)
                                                    .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                                                    .setAutoSelectEnabled(false)
                                                    .build()

                                                val request = GetCredentialRequest.Builder()
                                                    .addCredentialOption(googleIdOption)
                                                    .build()

                                                val result = credentialManager.getCredential(
                                                    context = context,
                                                    request = request
                                                )

                                                val credential = result.credential
                                                if (credential is GoogleIdTokenCredential) {
                                                    val rawIdToken = credential.idToken
                                                    val firebaseCredential = GoogleAuthProvider.getCredential(rawIdToken, null)
                                                    val user = firebaseAuth.currentUser
                                                    if (user != null) {
                                                        user.linkWithCredential(firebaseCredential)
                                                            .addOnCompleteListener { task ->
                                                                isLinkingGoogle = false
                                                                if (task.isSuccessful) {
                                                                    currentUserState = firebaseAuth.currentUser
                                                                    scope.launch {
                                                                        snackbarHostState.showSnackbar("Google Account linked successfully!")
                                                                    }
                                                                    onUpdateProfile?.invoke(
                                                                        currentName,
                                                                        currentPhone,
                                                                        currentStatus,
                                                                        currentAvatar
                                                                    )
                                                                } else {
                                                                    val msg = task.exception?.localizedMessage ?: "Failed to link Google account."
                                                                    scope.launch {
                                                                        if (msg.contains("credential already associated") || msg.contains("PROVIDER_ALREADY_LINKED")) {
                                                                            snackbarHostState.showSnackbar("This Google Account is already linked to another profile.")
                                                                        } else {
                                                                            snackbarHostState.showSnackbar("Linking failed: $msg")
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                    } else {
                                                        isLinkingGoogle = false
                                                    }
                                                } else {
                                                    isLinkingGoogle = false
                                                }
                                            } catch (e: Exception) {
                                                isLinkingGoogle = false
                                                e.printStackTrace()
                                                val msg = e.localizedMessage ?: "Error during Google Account selection."
                                                snackbarHostState.showSnackbar(msg)
                                            }
                                        }
                                    },
                                    enabled = !isLinkingGoogle,
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(text = if (isLinkingGoogle) "Linking Google..." else "Link Google Account", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            // 2. ABOUT & VIBE STATUS (READ & WRITE)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "About & Status",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            if (isCurrentUser) {
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = WhatsAppMinimalPrimary.copy(alpha = 0.12f),
                                    modifier = Modifier.clickable {
                                        editStatusInput = currentStatus
                                        showEditStatusDialog = true
                                    }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Edit,
                                            contentDescription = "Edit status",
                                            tint = WhatsAppMinimalPrimary,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "Edit",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = WhatsAppMinimalPrimary
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(enabled = isCurrentUser) {
                                    editStatusInput = currentStatus
                                    showEditStatusDialog = true
                                }
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = WhatsAppMinimalAccent.copy(alpha = 0.15f),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.Info,
                                        contentDescription = "Status",
                                        tint = WhatsAppMinimalAccent,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = currentStatus,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = if (isCurrentUser) "Tap to change your status" else "Active status",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        // Quick vibe status chips for user
                        if (isCurrentUser) {
                            Spacer(modifier = Modifier.height(14.dp))
                            Text(
                                text = "Quick select status:",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                presetVibes.take(4).forEach { vibe ->
                                    val isSelected = currentStatus == vibe
                                    Surface(
                                        shape = RoundedCornerShape(16.dp),
                                        color = if (isSelected) WhatsAppMinimalPrimary else MaterialTheme.colorScheme.surface,
                                        border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                                        modifier = Modifier.clickable {
                                            currentStatus = vibe
                                            onUpdateProfile?.invoke(currentName, currentPhone, currentStatus, currentAvatar)
                                            scope.launch {
                                                snackbarHostState.showSnackbar("Status updated to: $vibe")
                                            }
                                        }
                                    ) {
                                        Text(
                                            text = vibe,
                                            fontSize = 12.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 3. MEDIA, DOCUMENTS & LINKS
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(enabled = onMediaClick != null) { onMediaClick?.invoke() },
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = CircleShape,
                                color = WhatsAppMinimalPrimary.copy(alpha = 0.15f),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.PhotoLibrary,
                                        contentDescription = "Media",
                                        tint = WhatsAppMinimalPrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text(
                                    text = "Media, links, and docs",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = if (isCurrentUser) "All shared items in cloud storage" else "Photos, videos, and links shared",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                            contentDescription = "View media",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // 4. SECURITY & ENCRYPTION
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = CircleShape,
                                color = WhatsAppMinimalPrimary.copy(alpha = 0.15f),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = "Security",
                                        tint = WhatsAppMinimalPrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text(
                                    text = "End-to-End Encrypted",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "AES-256 + Signal Protocol",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Messages and calls are end-to-end encrypted. No one outside of this conversation, not even VIBEZ, can read or listen to them.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            // 5. ACCOUNT DATA & NETWORK STATUS
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = WhatsAppMinimalAccent.copy(alpha = 0.15f),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.PermIdentity,
                                    contentDescription = "User Identity",
                                    tint = WhatsAppMinimalAccent,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            Text(
                                text = if (isCurrentUser) "VIBEZ Member Account" else "Verified VIBEZ Contact",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Active on VIBEZ Network • Data Synced",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(20.dp)) }
        }
    }

    // --- DIALOGS FOR USER PROFILE & DATA ---

    // 1. Name Locked Info Dialog (Read-only identity protection)
    if (showNameLockedInfoDialog) {
        AlertDialog(
            onDismissRequest = { showNameLockedInfoDialog = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    tint = WhatsAppMinimalPrimary,
                    modifier = Modifier.size(32.dp)
                )
            },
            title = { Text("Display Name Is Locked", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        "Your registered name ($currentName) is tied to your cryptographic identity and verified profile on the VIBEZ network.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        "To prevent impersonation, contact spoofing, and fraud, display names cannot be changed directly in the app. For legal or identity corrections, please contact support.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 16.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { showNameLockedInfoDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                ) {
                    Text("Understood")
                }
            }
        )
    }

    // 3. Edit Status / Bio Dialog
    if (showEditStatusDialog) {
        AlertDialog(
            onDismissRequest = { showEditStatusDialog = false },
            title = { Text("Edit About / Status", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        "Custom status message visible to all your contacts:",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = editStatusInput,
                        onValueChange = { editStatusInput = it },
                        label = { Text("Status") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WhatsAppMinimalPrimary,
                            cursorColor = WhatsAppMinimalPrimary
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "Or choose a preset:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        presetVibes.forEach { preset ->
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (editStatusInput == preset) WhatsAppMinimalPrimary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier.clickable { editStatusInput = preset }
                            ) {
                                Text(
                                    text = preset,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (editStatusInput.isNotBlank()) {
                            currentStatus = editStatusInput.trim()
                            onUpdateProfile?.invoke(currentName, currentPhone, currentStatus, currentAvatar)
                            scope.launch {
                                snackbarHostState.showSnackbar("Status updated")
                            }
                        }
                        showEditStatusDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditStatusDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // 4. Edit Contact Dialog (When viewing other contacts)
    if (showEditContactDialog) {
        AlertDialog(
            onDismissRequest = { showEditContactDialog = false },
            title = { Text("Edit Contact Information", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Update this contact's details in your address book.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    OutlinedTextField(
                        value = editNameInput,
                        onValueChange = { editNameInput = it },
                        label = { Text("Contact Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WhatsAppMinimalPrimary,
                            cursorColor = WhatsAppMinimalPrimary
                        )
                    )
                    OutlinedTextField(
                        value = editPhoneInput,
                        onValueChange = { editPhoneInput = it },
                        label = { Text("Phone Number") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WhatsAppMinimalPrimary,
                            cursorColor = WhatsAppMinimalPrimary
                        )
                    )
                    OutlinedTextField(
                        value = editStatusInput,
                        onValueChange = { editStatusInput = it },
                        label = { Text("About / Note") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WhatsAppMinimalPrimary,
                            cursorColor = WhatsAppMinimalPrimary
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (editNameInput.isNotBlank()) {
                            currentName = editNameInput.trim()
                            currentPhone = editPhoneInput.trim()
                            currentStatus = editStatusInput.trim()
                            onUpdateContact?.invoke(contactId, currentName, currentPhone, currentStatus)
                            scope.launch {
                                snackbarHostState.showSnackbar("Contact details updated successfully")
                            }
                        }
                        showEditContactDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                ) {
                    Text("Save Changes")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditContactDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // 5. QR Code Dialog
    if (showQrDialog) {
        val qrBitmap = remember(currentPhone) {
            QrCodeGenerator.generateQrCode(currentPhone, 512)
        }

        AlertDialog(
            onDismissRequest = { showQrDialog = false },
            title = { Text("Your VIBEZ Profile QR", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "Scan to instantly connect with $currentName on VIBEZ",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Box(
                        modifier = Modifier
                            .size(200.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White)
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (qrBitmap != null) {
                            Image(
                                bitmap = qrBitmap.asImageBitmap(),
                                contentDescription = "QR Code",
                                modifier = Modifier.size(180.dp)
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.QrCode,
                                contentDescription = "QR Code Placeholder",
                                tint = Color.Gray,
                                modifier = Modifier.size(150.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = currentPhone,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = WhatsAppMinimalPrimary
                    )
                    
                    if (onQrScanClick != null) {
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedButton(
                            onClick = {
                                showQrDialog = false
                                onQrScanClick()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = WhatsAppMinimalPrimary)
                        ) {
                            Icon(Icons.Default.PhotoCamera, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Scan QR Code")
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { showQrDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                ) {
                    Text("Done")
                }
            }
        )
    }
}

@Composable
private fun ProfileActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Surface(
            shape = CircleShape,
            color = WhatsAppMinimalPrimary,
            modifier = Modifier.size(46.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = Color.White,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
