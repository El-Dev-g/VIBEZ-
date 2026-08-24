package com.example.ui.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.ContactsContract
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Contacts
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.data.ContactEntity
import com.example.ui.components.AvatarView
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.launch

data class DeviceContactRaw(
    val name: String,
    val rawPhone: String,
    val normalizedPhone: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SelectContactScreen(
    contacts: List<ContactEntity>,
    isSyncing: Boolean = false,
    syncStatusMessage: String? = null,
    onBackClick: () -> Unit,
    onContactSelect: (ContactEntity) -> Unit,
    onNewGroupClick: () -> Unit,
    onNewContactClick: () -> Unit,
    onQrScanClick: (() -> Unit)? = null,
    onSyncPhoneNumbers: ((List<String>) -> Unit)? = null
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var searchQuery by remember { mutableStateOf("") }
    var isSearchActive by remember { mutableStateOf(false) }

    var hasContactPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_CONTACTS
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    var rawDeviceContacts by remember { mutableStateOf<List<DeviceContactRaw>>(emptyList()) }

    fun normalizeNumber(number: String): String {
        return number.replace(Regex("[^0-9+]"), "").trim()
    }

    fun loadAndSyncDeviceContacts() {
        if (!hasContactPermission) return
        val list = mutableListOf<DeviceContactRaw>()
        try {
            val cursor = context.contentResolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                arrayOf(
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                ),
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            )
            cursor?.use {
                val nameIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                val numberIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                while (it.moveToNext()) {
                    val name = if (nameIndex >= 0) it.getString(nameIndex) else "Contact"
                    val phone = if (numberIndex >= 0) it.getString(numberIndex) else ""
                    val normalized = normalizeNumber(phone)
                    if (name.isNotBlank() && normalized.isNotBlank() && list.none { c -> c.normalizedPhone == normalized }) {
                        list.add(DeviceContactRaw(name = name, rawPhone = phone, normalizedPhone = normalized))
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        rawDeviceContacts = list

        // Trigger backend contact matching
        if (list.isNotEmpty()) {
            onSyncPhoneNumbers?.invoke(list.map { it.normalizedPhone })
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasContactPermission = isGranted
        if (isGranted) {
            loadAndSyncDeviceContacts()
        }
    }

    LaunchedEffect(hasContactPermission) {
        if (hasContactPermission) {
            loadAndSyncDeviceContacts()
        }
    }

    // Split contacts into VIBEZ (registered) vs Invite (unregistered)
    // 1. Registered contacts from backend & repository
    val registeredPhoneSet = remember(contacts) {
        contacts.map { normalizeNumber(it.phoneNumber) }.toSet()
    }

    val filteredRegisteredContacts = remember(contacts, searchQuery) {
        if (searchQuery.isBlank()) contacts else contacts.filter {
            it.name.contains(searchQuery, ignoreCase = true) || it.phoneNumber.contains(searchQuery)
        }
    }

    // 2. Unregistered phonebook contacts to invite
    val unregisteredDeviceContacts = remember(rawDeviceContacts, registeredPhoneSet, searchQuery) {
        val nonMembers = rawDeviceContacts.filter { raw ->
            !registeredPhoneSet.contains(raw.normalizedPhone) &&
                    contacts.none { it.name.equals(raw.name, ignoreCase = true) }
        }
        if (searchQuery.isBlank()) nonMembers else nonMembers.filter {
            it.name.contains(searchQuery, ignoreCase = true) || it.rawPhone.contains(searchQuery)
        }
    }

    val totalContactsCount = filteredRegisteredContacts.size + unregisteredDeviceContacts.size

    fun sendInvite(phone: String, name: String) {
        try {
            val intent = Intent(Intent.ACTION_SENDTO).apply {
                data = Uri.parse("smsto:$phone")
                putExtra("sms_body", "Hey $name! Let's connect on VIBEZ for instant secure messaging: https://vibez.chat/join")
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback to share intent
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, "Hey $name! Let's connect on VIBEZ for instant secure messaging: https://vibez.chat/join")
            }
            context.startActivity(Intent.createChooser(shareIntent, "Invite via"))
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    if (isSearchActive) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Search name or number...") },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                    } else {
                        Column {
                            Text(text = "Select Contact", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text(
                                text = "$totalContactsCount contacts (${filteredRegisteredContacts.size} on VIBEZ)",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (isSearchActive) {
                            isSearchActive = false
                            searchQuery = ""
                        } else {
                            onBackClick()
                        }
                    }) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (isSearchActive) {
                        IconButton(onClick = {
                            searchQuery = ""
                            isSearchActive = false
                        }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close search")
                        }
                    } else {
                        IconButton(onClick = { isSearchActive = true }) {
                            Icon(imageVector = Icons.Default.Search, contentDescription = "Search")
                        }
                        if (onQrScanClick != null) {
                            IconButton(onClick = onQrScanClick) {
                                Icon(imageVector = Icons.Default.QrCode, contentDescription = "Scan QR", tint = WhatsAppMinimalPrimary)
                            }
                        }
                        IconButton(
                            onClick = {
                                if (hasContactPermission) {
                                    loadAndSyncDeviceContacts()
                                    scope.launch {
                                        snackbarHostState.showSnackbar("Address book synced with VIBEZ database")
                                    }
                                } else {
                                    permissionLauncher.launch(Manifest.permission.READ_CONTACTS)
                                }
                            }
                        ) {
                            if (isSyncing) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    strokeWidth = 2.dp,
                                    color = WhatsAppMinimalPrimary
                                )
                            } else {
                                Icon(imageVector = Icons.Default.Sync, contentDescription = "Sync Contacts", tint = WhatsAppMinimalPrimary)
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Live sync progress bar
            if (isSyncing) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth(),
                    color = WhatsAppMinimalPrimary,
                    trackColor = WhatsAppMinimalNavPill
                )
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize()
            ) {
                // Sync status banner if syncing or status message active
                if (syncStatusMessage != null) {
                    item {
                        Surface(
                            color = WhatsAppMinimalPrimary.copy(alpha = 0.1f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Sync,
                                    contentDescription = "Syncing",
                                    tint = WhatsAppMinimalPrimary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = syncStatusMessage,
                                    fontSize = 12.sp,
                                    color = WhatsAppMinimalPrimary,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }

                // Permission request banner if not granted
                if (!hasContactPermission) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            colors = CardDefaults.cardColors(containerColor = WhatsAppMinimalNavPill),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(WhatsAppMinimalPrimary.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Contacts,
                                        contentDescription = "Contacts Permission",
                                        tint = WhatsAppMinimalPrimary,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(14.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Sync Device Address Book",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = WhatsAppMinimalPrimary
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "Grant contact permission to automatically detect friends using VIBEZ and chat in real-time.",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Button(
                                        onClick = {
                                            permissionLauncher.launch(Manifest.permission.READ_CONTACTS)
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary),
                                        shape = RoundedCornerShape(20.dp)
                                    ) {
                                        Text("Allow Contact Sync", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }

                // Action 1: New Group
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(onClick = onNewGroupClick)
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(WhatsAppMinimalAccent),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Default.GroupAdd, contentDescription = "New group", tint = Color.White)
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(text = "New group", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Text(text = "Create a community chat", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }

                // Action 2: New Contact
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(onClick = onNewContactClick)
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(WhatsAppMinimalAccent),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Default.PersonAdd, contentDescription = "New contact", tint = Color.White)
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(text = "New contact", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Text(text = "Add number to VIBEZ directory", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }

                // Section 1: Contacts on VIBEZ
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Contacts on VIBEZ",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = WhatsAppMinimalPrimary
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = WhatsAppMinimalPrimary.copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = "${filteredRegisteredContacts.size}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = WhatsAppMinimalPrimary,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }

                if (filteredRegisteredContacts.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (searchQuery.isNotBlank()) "No contacts matching \"$searchQuery\"" else "No synced contacts yet. Tap + to add.",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    items(filteredRegisteredContacts, key = { "app_${it.id}" }) { contact ->
                        Column {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onContactSelect(contact) }
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AvatarView(
                                    name = contact.name,
                                    avatarUrl = contact.avatarUrl,
                                    isOnline = contact.isOnline,
                                    size = 48.dp
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(text = contact.name, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Icon(
                                            imageVector = Icons.Default.Verified,
                                            contentDescription = "Verified VIBEZ user",
                                            tint = WhatsAppMinimalPrimary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = contact.aboutStatus,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1
                                    )
                                }
                                if (contact.isOnline) {
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = WhatsAppMinimalPrimary.copy(alpha = 0.12f)
                                    ) {
                                        Text(
                                            text = "Online",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = WhatsAppMinimalPrimary,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }
                                }
                            }
                            HorizontalDivider(
                                modifier = Modifier.padding(start = 80.dp),
                                thickness = 0.5.dp,
                                color = MaterialTheme.colorScheme.outlineVariant
                            )
                        }
                    }
                }

                // Section 2: Invite to VIBEZ (Address book contacts not yet registered)
                if (unregisteredDeviceContacts.isNotEmpty()) {
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Invite to VIBEZ (${unregisteredDeviceContacts.size})",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    items(unregisteredDeviceContacts, key = { "raw_${it.normalizedPhone}" }) { rawContact ->
                        Column {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AvatarView(
                                    name = rawContact.name,
                                    avatarUrl = "",
                                    isOnline = false,
                                    size = 48.dp
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = rawContact.name, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = rawContact.rawPhone,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                OutlinedButton(
                                    onClick = { sendInvite(rawContact.rawPhone, rawContact.name) },
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = WhatsAppMinimalPrimary),
                                    shape = RoundedCornerShape(16.dp)
                                ) {
                                    Text("Invite", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            HorizontalDivider(
                                modifier = Modifier.padding(start = 80.dp),
                                thickness = 0.5.dp,
                                color = MaterialTheme.colorScheme.outlineVariant
                            )
                        }
                    }
                }

                // Action: Share invite link
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(
                                        Intent.EXTRA_TEXT,
                                        "Let's chat on VIBEZ! It's a modern, ultra-fast and private messenger with music status: https://vibez.chat/join"
                                    )
                                }
                                context.startActivity(Intent.createChooser(shareIntent, "Share VIBEZ link"))
                            }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "Share invite link",
                                tint = WhatsAppMinimalPrimary
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(text = "Share invite link", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text(text = "Invite friends via link", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(30.dp)) }
            }
        }
    }
}
