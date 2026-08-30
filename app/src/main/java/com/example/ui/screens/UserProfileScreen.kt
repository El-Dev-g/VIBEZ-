package com.example.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.AvatarView
import com.example.ui.components.VerifiedBadge
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import com.example.util.QrCodeGenerator
import kotlinx.coroutines.launch

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
    onEncryptionClick: (() -> Unit)? = null,
    onGetBadgeClick: () -> Unit = {},
    onViewBadgeReceiptClick: () -> Unit = {}
) {
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

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
                snackbarHostState.showSnackbar("Profile photo updated")
            }
        }
    }

    // Dialog state
    var showEditNameDialog by remember { mutableStateOf(false) }
    var showEditStatusDialog by remember { mutableStateOf(false) }
    var showEditContactDialog by remember { mutableStateOf(false) }
    var showQrDialog by remember { mutableStateOf(false) }
    var showTrustDialog by remember { mutableStateOf(false) }

    // Temporary editing values for dialogs
    var editNameInput by remember { mutableStateOf("") }
    var editPhoneInput by remember { mutableStateOf("") }
    var editStatusInput by remember { mutableStateOf("") }

    val focusManager = androidx.compose.ui.platform.LocalFocusManager.current
    DisposableEffect(Unit) {
        onDispose {
            focusManager.clearFocus()
        }
    }

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
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            // 1. HERO IDENTITY (Avatar)
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(contentAlignment = Alignment.BottomEnd) {
                        Box(
                            modifier = Modifier
                                .size(160.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .padding(4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            AvatarView(
                                name = currentName,
                                avatarUrl = currentAvatar,
                                isGroup = isGroup,
                                size = 150.dp
                            )
                        }

                        if (isCurrentUser) {
                            Surface(
                                shape = CircleShape,
                                color = WhatsAppMinimalPrimary,
                                shadowElevation = 4.dp,
                                modifier = Modifier
                                    .size(44.dp)
                                    .clickable { imagePickerLauncher.launch("image/*") }
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.PhotoCamera,
                                        contentDescription = "Change photo",
                                        tint = Color.White,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 2. PROFILE DETAILS
            if (isCurrentUser) {
                item {
                    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                        ProfileInfoRow(
                            icon = Icons.Default.Person,
                            label = "Name",
                            value = currentName,
                            isVerified = isVerified,
                            onEditClick = {
                                editNameInput = currentName
                                showEditNameDialog = true
                            }
                        )
                        Text(
                            text = "This is not your username or pin. This name will be visible to your VIBEZ contacts.",
                            fontSize = 12.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(start = 56.dp, top = 4.dp, bottom = 16.dp)
                        )
                        
                        ProfileInfoRow(
                            icon = Icons.Default.Info,
                            label = "About",
                            value = currentStatus,
                            isVerified = false,
                            onEditClick = {
                                editStatusInput = currentStatus
                                showEditStatusDialog = true
                            }
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        ProfileInfoRow(
                            icon = Icons.Default.Phone,
                            label = "Phone",
                            value = currentPhone,
                            isVerified = false,
                            onEditClick = null
                        )
                    }
                }
            } else {
                // CONTACT VIEW (For other users / Viewers - Read Only)
                item {
                    Column(modifier = Modifier.padding(horizontal = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = currentName,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold
                            )
                            if (isVerified) {
                                Spacer(modifier = Modifier.width(6.dp))
                                VerifiedBadge(size = 22.dp)
                            }
                        }
                        Text(
                            text = currentPhone,
                            fontSize = 16.sp,
                            color = Color.Gray
                        )
                        
                        Spacer(modifier = Modifier.height(20.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            ProfileActionButton(icon = Icons.Default.Chat, label = "Message", onClick = { onMessageClick?.invoke() })
                            ProfileActionButton(icon = Icons.Default.Call, label = "Audio", onClick = { onVoiceCallClick?.invoke() })
                            ProfileActionButton(icon = Icons.Default.Videocam, label = "Video", onClick = { onVideoCallClick?.invoke() })
                        }
                    }
                }
                
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(text = "About", fontWeight = FontWeight.Bold, color = WhatsAppMinimalPrimary)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = currentStatus, fontSize = 15.sp)
                        }
                    }
                }
            }

            // 3. BADGES & VERIFICATION STATUS SECTION
            if (isVerified || isCurrentUser) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isVerified) Color(0xFF10B981).copy(alpha = 0.08f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isVerified) Color(0xFF10B981).copy(alpha = 0.3f) else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    if (isCurrentUser) {
                                        if (isVerified) onViewBadgeReceiptClick() else onGetBadgeClick()
                                    } else {
                                        showTrustDialog = true
                                    }
                                }
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            VerifiedBadge(size = 28.dp)
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = if (isVerified) "Official Verified Badge" else "Get Verified Badge",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isVerified) Color(0xFF047857) else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = if (isVerified) {
                                        if (isCurrentUser) "Cryptographically signed by VIBEZ • Tap to view certificate & invoice"
                                        else "Verified authentic identity signed by VIBEZ platform"
                                    } else "Display the green checkmark next to your name • $3.00 USD",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                contentDescription = null,
                                tint = if (isVerified) Color(0xFF10B981) else Color.Gray
                            )
                        }
                    }
                }
            }

            // Common sections
            item {
                ListItem(
                    headlineContent = { Text("Media, links, and docs") },
                    supportingContent = { Text("Photos, videos, and links shared") },
                    leadingContent = { Icon(Icons.Default.PhotoLibrary, contentDescription = null, tint = WhatsAppMinimalPrimary) },
                    trailingContent = { Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null) },
                    modifier = Modifier.clickable { onMediaClick?.invoke() }
                )
            }
            
            item {
                ListItem(
                    headlineContent = { Text("Encryption") },
                    supportingContent = { Text("Messages and calls are end-to-end encrypted. Tap to verify.") },
                    leadingContent = { Icon(Icons.Default.Lock, contentDescription = null, tint = WhatsAppMinimalPrimary) },
                    modifier = Modifier.clickable { onEncryptionClick?.invoke() }
                )
            }

            if (!isCurrentUser) {
                item {
                    ListItem(
                        headlineContent = { Text("Block $currentName", color = MaterialTheme.colorScheme.error) },
                        leadingContent = { Icon(Icons.Default.Block, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
                        modifier = Modifier.clickable {
                            scope.launch {
                                snackbarHostState.showSnackbar("$currentName has been blocked")
                            }
                        }
                    )
                }

                item {
                    ListItem(
                        headlineContent = { Text("Report $currentName", color = MaterialTheme.colorScheme.error) },
                        leadingContent = { Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
                        modifier = Modifier.clickable {
                            scope.launch {
                                snackbarHostState.showSnackbar("Report submitted to VIBEZ Security")
                            }
                        }
                    )
                }
            }
        }
    }

    // Dialogs
    if (showEditNameDialog) {
        AlertDialog(
            onDismissRequest = { showEditNameDialog = false },
            title = { Text("Edit Name") },
            text = {
                OutlinedTextField(
                    value = editNameInput,
                    onValueChange = { editNameInput = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    currentName = editNameInput
                    onUpdateProfile?.invoke(currentName, currentPhone, currentStatus, currentAvatar)
                    showEditNameDialog = false
                }) { Text("Save") }
            },
            dismissButton = {
                TextButton(onClick = { showEditNameDialog = false }) { Text("Cancel") }
            }
        )
    }

    if (showEditStatusDialog) {
        AlertDialog(
            onDismissRequest = { showEditStatusDialog = false },
            title = { Text("Edit About") },
            text = {
                OutlinedTextField(
                    value = editStatusInput,
                    onValueChange = { editStatusInput = it },
                    label = { Text("About") },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    currentStatus = editStatusInput
                    onUpdateProfile?.invoke(currentName, currentPhone, currentStatus, currentAvatar)
                    showEditStatusDialog = false
                }) { Text("Save") }
            },
            dismissButton = {
                TextButton(onClick = { showEditStatusDialog = false }) { Text("Cancel") }
            }
        )
    }

    if (showTrustDialog) {
        AlertDialog(
            onDismissRequest = { showTrustDialog = false },
            icon = {
                VerifiedBadge(size = 48.dp)
            },
            title = {
                Text(
                    text = "Official Verified Profile",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "$currentName has verified their identity with the VIBEZ Platform Security Network.",
                        fontSize = 14.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFF10B981).copy(alpha = 0.1f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = Color(0xFF047857),
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Status: Authentic & Active",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF047857)
                                )
                                Text(
                                    text = "Authenticity certificate verified",
                                    fontSize = 11.sp,
                                    color = Color(0xFF047857).copy(alpha = 0.8f)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showTrustDialog = false }) {
                    Text("Done", fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                }
            }
        )
    }
}

@Composable
private fun ProfileInfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    isVerified: Boolean = false,
    onEditClick: (() -> Unit)?
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = onEditClick != null) { onEditClick?.invoke() }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Color.Gray,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(32.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = label, fontSize = 14.sp, color = Color.Gray)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = value,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (isVerified) {
                    Spacer(modifier = Modifier.width(6.dp))
                    VerifiedBadge(size = 18.dp)
                }
            }
        }
        if (onEditClick != null) {
            Icon(
                imageVector = Icons.Default.Edit,
                contentDescription = "Edit",
                tint = WhatsAppMinimalPrimary,
                modifier = Modifier.size(20.dp)
            )
        }
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
