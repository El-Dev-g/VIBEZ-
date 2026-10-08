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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
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
import coil.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale
import com.example.data.network.BusinessProfileDto
import com.example.data.network.CatalogItemDto
import com.example.ui.components.AvatarView
import com.example.ui.components.VerifiedBadge
import com.example.ui.theme.WhatsAppEmerald
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
    isOfficial: Boolean = false,
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
    onToggleMute: (() -> Unit)? = null,
    isMuted: Boolean = false,
    onGetBadgeClick: () -> Unit = {},
    onViewBadgeReceiptClick: () -> Unit = {},
    onBusinessStorefrontClick: (() -> Unit)? = null,
    isBusiness: Boolean = false,
    businessProfile: BusinessProfileDto? = null,
    businessCatalog: List<CatalogItemDto> = emptyList()
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
                    val topBarTitle = if (isCurrentUser) {
                        "Profile"
                    } else {
                        currentName.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                            ?: currentPhone.takeIf { it.isNotBlank() }
                            ?: "User Profile"
                    }
                    Text(
                        text = topBarTitle,
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
                                name = currentName.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" } ?: currentPhone.ifBlank { "User" },
                                avatarUrl = currentAvatar,
                                isGroup = false,
                                isOfficial = false,
                                isVerified = isVerified,
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
                if (isBusiness) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                val resolvedDisplayName = businessProfile?.businessName?.takeIf { it.isNotBlank() }
                                    ?: currentName.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                                    ?: currentPhone.takeIf { it.isNotBlank() }
                                    ?: "Vibez Business Merchant"

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center,
                                    modifier = Modifier.padding(bottom = 6.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Storefront,
                                        contentDescription = null,
                                        tint = WhatsAppEmerald,
                                        modifier = Modifier.size(24.dp).padding(end = 6.dp)
                                    )
                                    Text(
                                        text = resolvedDisplayName,
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    if (isVerified || businessProfile?.isVerified == true) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        VerifiedBadge(size = 20.dp)
                                    }
                                }

                                Surface(
                                    color = WhatsAppEmerald.copy(alpha = 0.12f),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.padding(bottom = 8.dp)
                                ) {
                                    Text(
                                        text = "OFFICIAL BUSINESS ACCOUNT",
                                        color = WhatsAppEmerald,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        letterSpacing = 0.5.sp
                                    )
                                }

                                val categoryText = businessProfile?.category?.takeIf { it.isNotBlank() } ?: "Shopping & Retail"
                                Surface(
                                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.padding(bottom = 8.dp)
                                ) {
                                    Text(
                                        text = categoryText,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                                    )
                                }

                                if (currentPhone.isNotBlank() && currentPhone != resolvedDisplayName) {
                                    Text(
                                        text = currentPhone,
                                        fontSize = 15.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontWeight = FontWeight.Medium
                                    )
                                }

                                val businessDesc = businessProfile?.description?.takeIf { it.isNotBlank() }
                                    ?: currentStatus.takeIf { it.isNotBlank() && it != "Hey there! I am using VIBEZ." && it != "⚡ Vibing in VIBEZ" }
                                    ?: "Welcome to our official business storefront! Browse products or chat with us directly."
                                Text(
                                    text = businessDesc,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(top = 6.dp, bottom = 4.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    ProfileActionButton(icon = Icons.AutoMirrored.Filled.Chat, label = "Chat Now", onClick = { onMessageClick?.invoke() })
                                    ProfileActionButton(icon = Icons.Default.Call, label = "Voice Call", onClick = { onVoiceCallClick?.invoke() })
                                    ProfileActionButton(icon = Icons.Default.Videocam, label = "Video Call", onClick = { onVideoCallClick?.invoke() })
                                    if (isBusiness || onBusinessStorefrontClick != null) {
                                        ProfileActionButton(icon = Icons.Default.ShoppingBag, label = "Catalog", onClick = { onBusinessStorefrontClick?.invoke() })
                                    }
                                }
                            }
                        }
                    }

                    // Business Info Card (Hours, Address, Website, Email)
                    val hasBusinessDetails = businessProfile?.businessHours?.isNotBlank() == true ||
                            businessProfile?.address?.isNotBlank() == true ||
                            businessProfile?.website?.isNotBlank() == true ||
                            businessProfile?.email?.isNotBlank() == true

                    if (hasBusinessDetails) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 4.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f))
                            ) {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Text(
                                        text = "Business Details",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = WhatsAppMinimalPrimary
                                    )

                                    businessProfile?.businessHours?.takeIf { it.isNotBlank() }?.let { hours ->
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.AccessTime, contentDescription = null, tint = WhatsAppEmerald, modifier = Modifier.size(20.dp))
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column {
                                                Text("Hours", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text(hours, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                            }
                                        }
                                    }

                                    businessProfile?.address?.takeIf { it.isNotBlank() }?.let { addr ->
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = WhatsAppEmerald, modifier = Modifier.size(20.dp))
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column {
                                                Text("Address", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text(addr, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                            }
                                        }
                                    }

                                    businessProfile?.website?.takeIf { it.isNotBlank() }?.let { web ->
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.Language, contentDescription = null, tint = WhatsAppEmerald, modifier = Modifier.size(20.dp))
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column {
                                                Text("Website", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text(web, fontSize = 14.sp, color = WhatsAppEmerald, fontWeight = FontWeight.Medium)
                                            }
                                        }
                                    }

                                    businessProfile?.email?.takeIf { it.isNotBlank() }?.let { mail ->
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.Email, contentDescription = null, tint = WhatsAppEmerald, modifier = Modifier.size(20.dp))
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column {
                                                Text("Email", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                Text(mail, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Featured Products Showcase (if catalog is available)
                    if (businessCatalog.isNotEmpty()) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 4.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Products & Services",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        if (onBusinessStorefrontClick != null) {
                                            Text(
                                                text = "See all (${businessCatalog.size})",
                                                color = WhatsAppEmerald,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                modifier = Modifier.clickable { onBusinessStorefrontClick() }
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    androidx.compose.foundation.lazy.LazyRow(
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        items(businessCatalog.take(5)) { item ->
                                            Card(
                                                modifier = Modifier
                                                    .width(140.dp)
                                                    .clickable { onBusinessStorefrontClick?.invoke() },
                                                shape = RoundedCornerShape(12.dp),
                                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                                            ) {
                                                Column(modifier = Modifier.padding(8.dp)) {
                                                    if (!item.imageUrl.isNullOrBlank()) {
                                                        AsyncImage(
                                                            model = item.imageUrl,
                                                            contentDescription = item.title,
                                                            contentScale = ContentScale.Crop,
                                                            modifier = Modifier
                                                                .fillMaxWidth()
                                                                .height(90.dp)
                                                                .clip(RoundedCornerShape(8.dp))
                                                        )
                                                    } else {
                                                        Box(
                                                            modifier = Modifier
                                                                .fillMaxWidth()
                                                                .height(90.dp)
                                                                .clip(RoundedCornerShape(8.dp))
                                                                .background(WhatsAppEmerald.copy(alpha = 0.12f)),
                                                            contentAlignment = Alignment.Center
                                                        ) {
                                                            Icon(
                                                                imageVector = Icons.Default.ShoppingBag,
                                                                contentDescription = null,
                                                                tint = WhatsAppEmerald,
                                                                modifier = Modifier.size(36.dp)
                                                            )
                                                        }
                                                    }
                                                    Spacer(modifier = Modifier.height(6.dp))
                                                    Text(
                                                        text = item.title,
                                                        fontSize = 13.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        maxLines = 1,
                                                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                                    )
                                                    Text(
                                                        text = "$${"%.2f".format(item.price)} ${item.currency}",
                                                        fontSize = 12.sp,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = WhatsAppEmerald
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                } else {
                    // REGULAR CONSUMER CONTACT VIEW
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            val resolvedDisplayName = currentName.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                                ?: currentPhone.takeIf { it.isNotBlank() }
                                ?: "User"
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center,
                                modifier = Modifier.padding(bottom = 4.dp)
                            ) {
                                Text(
                                    text = resolvedDisplayName,
                                    fontSize = 26.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                )
                                if (isVerified) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    VerifiedBadge(size = 24.dp)
                                }
                            }

                            if (currentPhone.isNotBlank() && currentPhone != resolvedDisplayName) {
                                Text(
                                    text = currentPhone,
                                    fontSize = 16.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontWeight = FontWeight.Medium
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly
                            ) {
                                ProfileActionButton(icon = Icons.AutoMirrored.Filled.Chat, label = "Message", onClick = { onMessageClick?.invoke() })
                                ProfileActionButton(icon = Icons.Default.Call, label = "Audio", onClick = { onVoiceCallClick?.invoke() })
                                ProfileActionButton(icon = Icons.Default.Videocam, label = "Video", onClick = { onVideoCallClick?.invoke() })
                                if (isBusiness && onBusinessStorefrontClick != null) {
                                    ProfileActionButton(icon = Icons.Default.Storefront, label = "Store", onClick = { onBusinessStorefrontClick.invoke() })
                                }
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
                            containerColor = if (isVerified) Color(0xFF1D9BF0).copy(alpha = 0.08f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isVerified) Color(0xFF1D9BF0).copy(alpha = 0.3f) else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
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
                                        color = if (isVerified) Color(0xFF1D9BF0) else MaterialTheme.colorScheme.onSurface
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
                                tint = if (isVerified) Color(0xFF1D9BF0) else Color.Gray
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

            if (!isCurrentUser && onToggleMute != null) {
                item {
                    ListItem(
                        headlineContent = { Text("Mute notifications") },
                        leadingContent = { Icon(if (isMuted) Icons.Default.NotificationsOff else Icons.Default.Notifications, contentDescription = null, tint = WhatsAppMinimalPrimary) },
                        trailingContent = {
                            Switch(
                                checked = isMuted,
                                onCheckedChange = { onToggleMute() },
                                colors = SwitchDefaults.colors(checkedThumbColor = WhatsAppMinimalPrimary)
                            )
                        },
                        modifier = Modifier.clickable { onToggleMute() }
                    )
                }
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
                        color = Color(0xFF1D9BF0).copy(alpha = 0.1f),
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
                                    color = Color(0xFF1D9BF0)
                                )
                                Text(
                                    text = "Authenticity certificate verified",
                                    fontSize = 11.sp,
                                    color = Color(0xFF1D9BF0).copy(alpha = 0.8f)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showTrustDialog = false }) {
                    Text("Done", fontWeight = FontWeight.Bold, color = Color(0xFF1D9BF0))
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
