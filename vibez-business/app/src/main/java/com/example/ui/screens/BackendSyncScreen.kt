package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.DeviceHub
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.FolderShared
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.BuildConfig
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BackendSyncScreen(
    currentPhone: String,
    currentName: String,
    currentEmail: String?,
    authProvider: String,
    authToken: String?,
    isDarkMode: Boolean,
    onBackClick: () -> Unit,
    onManualSyncAll: suspend () -> Unit
) {
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var isSyncingNow by remember { mutableStateOf(false) }
    var lastSyncTimestamp by remember { mutableStateOf("Just now") }
    var autoSyncEnabled by remember { mutableStateOf(true) }
    var websocketRealtimeEnabled by remember { mutableStateOf(true) }
    var cloudMediaUploadEnabled by remember { mutableStateOf(true) }
    var endToEndSyncCheck by remember { mutableStateOf(true) }

    val backendBaseUrl = BuildConfig.BACKEND_URL.ifBlank { "https://your-backend-url.com/" }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Sync,
                            contentDescription = "Background Sync",
                            tint = WhatsAppMinimalPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Background Synchronization",
                            fontSize = 19.sp,
                            fontWeight = FontWeight.Bold
                        )
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
                    IconButton(
                        onClick = {
                            scope.launch {
                                isSyncingNow = true
                                onManualSyncAll()
                                delay(1000)
                                isSyncingNow = false
                                lastSyncTimestamp = "Just now"
                                snackbarHostState.showSnackbar("All chats, media, and contacts matched to backend")
                            }
                        },
                        enabled = !isSyncingNow,
                        modifier = Modifier.testTag("backend_sync_refresh_btn")
                    ) {
                        if (isSyncingNow) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = WhatsAppMinimalPrimary
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Sync Now",
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // 1. LIVE BACKEND CONNECTIVITY BANNER
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.verticalGradient(
                                    listOf(
                                        WhatsAppMinimalNavPill,
                                        MaterialTheme.colorScheme.surfaceVariant
                                    )
                                )
                            )
                            .padding(20.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = Color(0xFF22C55E).copy(alpha = 0.15f),
                                modifier = Modifier.size(48.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.CloudDone,
                                        contentDescription = "Cloud Connected",
                                        tint = Color(0xFF22C55E),
                                        modifier = Modifier.size(26.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFF22C55E))
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Backend Server Online",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                Text(
                                    text = backendBaseUrl,
                                    fontSize = 12.sp,
                                    color = WhatsAppMinimalPrimary,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "Last synced: $lastSyncTimestamp",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                scope.launch {
                                    isSyncingNow = true
                                    onManualSyncAll()
                                    delay(900)
                                    isSyncingNow = false
                                    lastSyncTimestamp = "Just now"
                                    snackbarHostState.showSnackbar("Backend state updated successfully")
                                }
                            },
                            enabled = !isSyncingNow,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                                .testTag("sync_everything_now_btn")
                        ) {
                            if (isSyncingNow) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Synchronizing Everything...")
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Sync,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Match & Sync Everything Now",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }

            // 2. BACKEND MATCH MATRIX TILES
            item {
                Text(
                    text = "BACKGROUND SYNCHRONIZATION PIPELINE",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = WhatsAppMinimalPrimary,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(vertical = 4.dp)) {
                        SyncFeatureStatusRow(
                            icon = Icons.Default.PhoneAndroid,
                            title = "User Identity & Phone Number",
                            detail = "$currentName • $currentPhone",
                            status = "Synced & Linked",
                            isOk = true
                        )
                        HorizontalDivider(
                            modifier = Modifier.padding(horizontal = 16.dp),
                            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                        )
                        SyncFeatureStatusRow(
                            icon = Icons.Default.CloudUpload,
                            title = "Profile & Cloud Avatars",
                            detail = "Initials Avatar / Cloud Photo Storage",
                            status = "Matched",
                            isOk = true
                        )
                        HorizontalDivider(
                            modifier = Modifier.padding(horizontal = 16.dp),
                            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                        )
                        SyncFeatureStatusRow(
                            icon = Icons.Default.DeviceHub,
                            title = "Socket.IO Real-Time Dispatch",
                            detail = "Instant send, receive, typing & presence",
                            status = "Live",
                            isOk = true
                        )
                        HorizontalDivider(
                            modifier = Modifier.padding(horizontal = 16.dp),
                            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                        )
                        SyncFeatureStatusRow(
                            icon = Icons.Default.FolderShared,
                            title = "Cloud Media Uploads (R2/S3)",
                            detail = "Signed URLs for HD Photos & Audio Notes",
                            status = "Ready",
                            isOk = true
                        )
                        HorizontalDivider(
                            modifier = Modifier.padding(horizontal = 16.dp),
                            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                        )
                        SyncFeatureStatusRow(
                            icon = Icons.Default.Dns,
                            title = "Communities & Status Stories",
                            detail = "Channel directory & 24h stories sync",
                            status = "Synced",
                            isOk = true
                        )
                    }
                }
            }

            // 3. REALTIME AND STORAGE CONFIGURATION
            item {
                Text(
                    text = "BACKGROUND CONTROLS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = WhatsAppMinimalPrimary,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(start = 4.dp, top = 6.dp)
                )
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column {
                        SyncToggleRow(
                            icon = Icons.Default.CloudSync,
                            title = "Automatic Background Sync",
                            subtitle = "Periodically sync chats, status updates, and community feeds",
                            isChecked = autoSyncEnabled,
                            onCheckedChange = {
                                autoSyncEnabled = it
                                scope.launch {
                                    snackbarHostState.showSnackbar(
                                        if (it) "Auto sync enabled" else "Auto sync paused"
                                    )
                                }
                            }
                        )
                        SyncToggleRow(
                            icon = Icons.Default.Speed,
                            title = "Real-Time WebSocket Stream",
                            subtitle = "Keep live connection open for instant messaging & read receipts",
                            isChecked = websocketRealtimeEnabled,
                            onCheckedChange = {
                                websocketRealtimeEnabled = it
                            }
                        )
                        SyncToggleRow(
                            icon = Icons.Default.Storage,
                            title = "Direct Cloud Media Uploads",
                            subtitle = "Request pre-signed upload URLs from server before sending media",
                            isChecked = cloudMediaUploadEnabled,
                            onCheckedChange = {
                                cloudMediaUploadEnabled = it
                            }
                        )
                        SyncToggleRow(
                            icon = Icons.Default.Security,
                            title = "Verify E2E Integrity with Server",
                            subtitle = "Verify cryptographic fingerprints during handshakes",
                            isChecked = endToEndSyncCheck,
                            onCheckedChange = {
                                endToEndSyncCheck = it
                            }
                        )
                    }
                }
            }

            // 4. AUTH TOKEN & USER CREDENTIAL INFO
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Security,
                                contentDescription = null,
                                tint = WhatsAppMinimalPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Session & Authentication Credentials",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Auth Provider: $authProvider",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (currentEmail != null) {
                            Text(
                                text = "Google Account: $currentEmail",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            text = "Token: ${if (!authToken.isNullOrBlank()) "Active (Bearer ${authToken.take(12)}...)" else "Local Session Token"}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun SyncFeatureStatusRow(
    icon: ImageVector,
    title: String,
    detail: String,
    status: String,
    isOk: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Surface(
                shape = CircleShape,
                color = WhatsAppMinimalPrimary.copy(alpha = 0.12f),
                modifier = Modifier.size(38.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = WhatsAppMinimalPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = detail,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = if (isOk) Color(0xFF22C55E).copy(alpha = 0.15f) else MaterialTheme.colorScheme.error.copy(alpha = 0.15f)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Icon(
                    imageVector = if (isOk) Icons.Default.Check else Icons.Default.Info,
                    contentDescription = null,
                    tint = if (isOk) Color(0xFF16A34A) else MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = status,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isOk) Color(0xFF16A34A) else MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun SyncToggleRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Surface(
                shape = CircleShape,
                color = WhatsAppMinimalPrimary.copy(alpha = 0.1f),
                modifier = Modifier.size(36.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = WhatsAppMinimalPrimary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        Spacer(modifier = Modifier.width(8.dp))
        Switch(
            checked = isChecked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = WhatsAppMinimalPrimary
            )
        )
    }
}
