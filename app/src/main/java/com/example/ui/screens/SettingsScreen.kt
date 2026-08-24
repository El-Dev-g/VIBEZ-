package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CleanHands
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Hd
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.PermIdentity
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.Vibration
import androidx.compose.material.icons.filled.Wallpaper
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.AvatarView
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(
    isDarkMode: Boolean,
    userName: String = "Alex Rivers",
    userPhone: String = "+1 555-0198",
    googleEmail: String? = null,
    onBackClick: () -> Unit,
    onToggleDarkMode: () -> Unit,
    onLogoutClick: () -> Unit = {},
    onProfileClick: () -> Unit = {},
    onWallpaperClick: () -> Unit = {},
    onGoogleAuthClick: () -> Unit = {},
    onBackendSyncClick: () -> Unit = {},
    onQrScanClick: () -> Unit = {}
) {
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var activeVibeStatus by remember { mutableStateOf("⚡ Vibing in VIBEZ") }
    var showQrModal by remember { mutableStateOf(false) }
    var showLogoutModal by remember { mutableStateOf(false) }
    var hdMediaUpload by remember { mutableStateOf(true) }
    var hapticFeedback by remember { mutableStateOf(true) }
    var biometricLock by remember { mutableStateOf(false) }

    val vibeStatusOptions = listOf(
        "⚡ Vibing in VIBEZ",
        "💻 Code & Chill",
        "🎧 Music Mode",
        "🌴 On Vacation",
        "🔋 Battery Low"
    )

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.ElectricBolt,
                            contentDescription = "VIBEZ",
                            tint = WhatsAppMinimalPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "VIBEZ Settings",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
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

            // 1. HERO VIBEZ PROFILE CARD
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onProfileClick),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                brush = Brush.linearGradient(
                                    colors = listOf(
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
                            Box(modifier = Modifier.clickable(onClick = onProfileClick)) {
                                AvatarView(name = userName, avatarUrl = "", size = 72.dp)
                                Box(
                                    modifier = Modifier
                                        .size(18.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF22C55E))
                                        .border(2.dp, MaterialTheme.colorScheme.surface, CircleShape)
                                        .align(Alignment.BottomEnd)
                                )
                            }

                            Spacer(modifier = Modifier.width(16.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = userName,
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = userPhone,
                                    fontSize = 14.sp,
                                    color = WhatsAppMinimalPrimary,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Surface(
                                    color = WhatsAppMinimalPrimary.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(
                                        text = activeVibeStatus,
                                        fontSize = 12.sp,
                                        color = WhatsAppMinimalPrimary,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            IconButton(
                                onClick = { showQrModal = true },
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(WhatsAppMinimalPrimary.copy(alpha = 0.1f))
                            ) {
                                Icon(
                                    imageVector = Icons.Default.QrCode2,
                                    contentDescription = "My QR",
                                    tint = WhatsAppMinimalPrimary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Status Chip Picker
                        Text(
                            text = "Set Current Status",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            vibeStatusOptions.forEach { statusOption ->
                                val isSelected = (statusOption == activeVibeStatus)
                                Surface(
                                    modifier = Modifier.clickable {
                                        activeVibeStatus = statusOption
                                        scope.launch {
                                            snackbarHostState.showSnackbar("VIBEZ status updated to: $statusOption")
                                        }
                                    },
                                    color = if (isSelected) WhatsAppMinimalPrimary else MaterialTheme.colorScheme.surface,
                                    shape = RoundedCornerShape(20.dp),
                                    border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                                ) {
                                    Text(
                                        text = statusOption,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 2. QUICK VIBEZ DASHBOARD GRID
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Dark Mode Card
                    VibesQuickTile(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.DarkMode,
                        title = "Dark Theme",
                        subtitle = if (isDarkMode) "Enabled" else "Disabled",
                        isActive = isDarkMode,
                        onClick = onToggleDarkMode
                    )

                    // Biometric Lock Card
                    VibesQuickTile(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.Fingerprint,
                        title = "App Lock",
                        subtitle = if (biometricLock) "Active" else "Off",
                        isActive = biometricLock,
                        onClick = {
                            biometricLock = !biometricLock
                            scope.launch {
                                snackbarHostState.showSnackbar(
                                    if (biometricLock) "VIBEZ Fingerprint Lock Enabled" else "VIBEZ App Lock Disabled"
                                )
                            }
                        }
                    )
                }
            }

            // 3. STORAGE & DATA CLEANER CARD
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Storage,
                                    contentDescription = "Storage",
                                    tint = WhatsAppMinimalPrimary
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(text = "VIBEZ Vault Storage", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                    Text(text = "1.4 GB / 32 GB Used", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                            OutlinedButton(
                                onClick = {
                                    scope.launch {
                                        snackbarHostState.showSnackbar("VIBEZ Cache Cleared! 240 MB freed.")
                                    }
                                },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Clean", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        LinearProgressIndicator(
                            progress = { 0.18f },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = WhatsAppMinimalPrimary,
                            trackColor = MaterialTheme.colorScheme.outlineVariant
                        )
                    }
                }
            }

            // 4. VIBEZ PREFERENCES LIST
            item {
                Text(
                    text = "VIBEZ PREFERENCES",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = WhatsAppMinimalPrimary,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(start = 4.dp, top = 8.dp)
                )
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column {
                        // HD Uploads Toggle
                        VibesSettingToggleRow(
                            icon = Icons.Default.Hd,
                            title = "HD Media Uploads",
                            subtitle = "Always upload photos and videos in full uncompressed resolution",
                            isChecked = hdMediaUpload,
                            onCheckedChange = {
                                hdMediaUpload = it
                                scope.launch {
                                    snackbarHostState.showSnackbar("HD Media Uploads set to $it")
                                }
                            }
                        )

                        // Haptic Feedback
                        VibesSettingToggleRow(
                            icon = Icons.Default.Vibration,
                            title = "VIBEZ Haptics & Vibration",
                            subtitle = "Tactile feedback on messages and calls",
                            isChecked = hapticFeedback,
                            onCheckedChange = {
                                hapticFeedback = it
                            }
                        )

                        // Google Authentication & Cloud Services
                        VibesSettingClickRow(
                            icon = Icons.Default.AccountCircle,
                            title = "Google Account & Cloud Auth",
                            subtitle = googleEmail?.let { "Connected as $it" } ?: "Link Google Account & Drive Backup",
                            onClick = onGoogleAuthClick
                        )

                        // Backend & Cloud Synchronization Hub
                        VibesSettingClickRow(
                            icon = Icons.Default.CloudSync,
                            title = "Backend & Cloud Synchronization",
                            subtitle = "Verify API live sync, WebSocket, and cloud storage",
                            onClick = onBackendSyncClick
                        )

                        // Security Shield
                        VibesSettingClickRow(
                            icon = Icons.Default.Security,
                            title = "Security & Encryption",
                            subtitle = "256-bit End-to-end active protection",
                            onClick = {
                                scope.launch {
                                    snackbarHostState.showSnackbar("All VIBEZ chats & calls are E2E encrypted.")
                                }
                            }
                        )

                        // Linked Devices
                        VibesSettingClickRow(
                            icon = Icons.Default.Devices,
                            title = "Connected Web Devices",
                            subtitle = "1 active web session online",
                            onClick = {
                                scope.launch {
                                    snackbarHostState.showSnackbar("VIBEZ Web Session: Chrome on macOS")
                                }
                            }
                        )

                        // Chat Wallpaper Option
                        VibesSettingClickRow(
                            icon = Icons.Default.Wallpaper,
                            title = "Chat Wallpaper",
                            subtitle = "Customize background color, gradient, or custom photos",
                            onClick = onWallpaperClick
                        )

                        // Help & Support
                        VibesSettingClickRow(
                            icon = Icons.Default.HelpOutline,
                            title = "VIBEZ Help Center",
                            subtitle = "FAQs, app version v2.4.0, contact us",
                            onClick = {
                                scope.launch {
                                    snackbarHostState.showSnackbar("VIBEZ Version 2.4.0 (Build 2026)")
                                }
                            }
                        )
                    }
                }
            }

            // 5. ACCOUNT LOG OUT
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showLogoutModal = true },
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Red.copy(alpha = 0.08f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = "Logout",
                            tint = Color.Red
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(
                                text = "Switch Account / Log Out",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Red
                            )
                            Text(
                                text = "Unlink current phone number $userPhone",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }

    // --- QR CODE MODAL DIALOG ---
    if (showQrModal) {
        val qrBitmap = remember(userPhone) {
            QrCodeGenerator.generateQrCode(userPhone, 512)
        }

        AlertDialog(
            onDismissRequest = { showQrModal = false },
            title = {
                Text(
                    text = "My VIBEZ QR Code",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(220.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White)
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (qrBitmap != null) {
                            Image(
                                bitmap = qrBitmap.asImageBitmap(),
                                contentDescription = "QR Code",
                                modifier = Modifier.size(200.dp)
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.QrCode2,
                                contentDescription = "QR Code Placeholder",
                                tint = Color.Gray,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Scan this code to instantly add $userName on VIBEZ",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedButton(
                        onClick = {
                            showQrModal = false
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
            },
            confirmButton = {
                Button(
                    onClick = { showQrModal = false },
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                ) {
                    Text("Close")
                }
            }
        )
    }

    // --- LOGOUT CONFIRMATION MODAL ---
    if (showLogoutModal) {
        AlertDialog(
            onDismissRequest = { showLogoutModal = false },
            title = { Text("Log Out of VIBEZ?", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to log out of $userPhone? You will need to verify your SMS code to sign back in.") },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutModal = false
                        onLogoutClick()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
                ) {
                    Text("Log Out", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutModal = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun VibesQuickTile(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    title: String,
    subtitle: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) WhatsAppMinimalPrimary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = if (isActive) WhatsAppMinimalPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = if (isActive) WhatsAppMinimalPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
fun VibesSettingToggleRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!isChecked) }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(imageVector = icon, contentDescription = title, tint = WhatsAppMinimalPrimary)
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text(text = subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(
            checked = isChecked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = WhatsAppMinimalAccent
            )
        )
    }
}

@Composable
fun VibesSettingClickRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(imageVector = icon, contentDescription = title, tint = WhatsAppMinimalPrimary)
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text(text = subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
