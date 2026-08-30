package com.example.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrivacySettingsScreen(
    onBackClick: () -> Unit,
    onStatusPrivacyClick: () -> Unit,
    lastSeen: String,
    profilePhoto: String,
    about: String,
    readReceipts: Boolean,
    onPrivacyChange: (String, String) -> Unit,
    onReadReceiptsChange: (Boolean) -> Unit
) {
    var showDialogFor by remember { mutableStateOf<String?>(null) }
    
    val options = listOf("Everyone", "My contacts", "My contacts except...", "Nobody")
    val serverOptions = listOf("EVERYONE", "MY_CONTACTS", "MY_CONTACTS_EXCEPT", "NOBODY")

    if (showDialogFor != null) {
        val currentVal = when(showDialogFor) {
            "last_seen_privacy" -> lastSeen
            "profile_photo_privacy" -> profilePhoto
            "about_privacy" -> about
            else -> "EVERYONE"
        }
        
        AlertDialog(
            onDismissRequest = { showDialogFor = null },
            title = { 
                Text(
                    when(showDialogFor) {
                        "last_seen_privacy" -> "Last seen and online"
                        "profile_photo_privacy" -> "Profile photo"
                        "about_privacy" -> "About"
                        else -> ""
                    }
                ) 
            },
            text = {
                Column {
                    options.forEachIndexed { index, option ->
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onPrivacyChange(showDialogFor!!, serverOptions[index])
                                    showDialogFor = null
                                }
                                .padding(vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = currentVal == serverOptions[index],
                                onClick = {
                                    onPrivacyChange(showDialogFor!!, serverOptions[index])
                                    showDialogFor = null
                                }
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(option)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showDialogFor = null }) {
                    Text("CANCEL")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Privacy", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
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
        ) {
            item {
                PrivacyHeader("Who can see my personal info")
                PrivacyItem(
                    title = "Last seen and online", 
                    subtitle = formatPrivacy(lastSeen), 
                    onClick = { showDialogFor = "last_seen_privacy" }
                )
                PrivacyItem(
                    title = "Profile photo", 
                    subtitle = formatPrivacy(profilePhoto), 
                    onClick = { showDialogFor = "profile_photo_privacy" }
                )
                PrivacyItem(
                    title = "About", 
                    subtitle = formatPrivacy(about), 
                    onClick = { showDialogFor = "about_privacy" }
                )
                PrivacyItem(title = "Status", subtitle = "My contacts", onClick = onStatusPrivacyClick)
                
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Color.LightGray.copy(alpha = 0.3f))
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onReadReceiptsChange(!readReceipts) }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "Read receipts", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(
                            text = "If turned off, you won't send or receive Read receipts. Read receipts are always sent for group chats.",
                            fontSize = 13.sp,
                            color = Color.Gray
                        )
                    }
                    Switch(
                        checked = readReceipts,
                        onCheckedChange = { onReadReceiptsChange(it) },
                        colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = WhatsAppMinimalPrimary)
                    )
                }
            }
        }
    }
}

private fun formatPrivacy(value: String): String {
    return when(value) {
        "EVERYONE" -> "Everyone"
        "MY_CONTACTS" -> "My contacts"
        "MY_CONTACTS_EXCEPT" -> "My contacts except..."
        "NOBODY" -> "Nobody"
        else -> value
    }
}

@Composable
private fun PrivacyHeader(title: String) {
    Text(
        text = title,
        fontSize = 14.sp,
        fontWeight = FontWeight.Bold,
        color = WhatsAppMinimalPrimary,
        modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 8.dp)
    )
}

@Composable
private fun PrivacyItem(title: String, subtitle: String, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Text(text = title, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Text(text = subtitle, fontSize = 13.sp, color = Color.Gray)
    }
}
