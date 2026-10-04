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
fun StorageDataSettingsScreen(
    onBackClick: () -> Unit,
    mobileData: String,
    wifi: String,
    roaming: String,
    onStorageChange: (String, String) -> Unit
) {
    var showDialogFor by remember { mutableStateOf<String?>(null) }
    
    val options = listOf("No media", "Photos", "Photos and videos", "All media")
    val serverOptions = listOf("NONE", "PHOTOS", "PHOTOS_VIDEOS", "ALL")

    if (showDialogFor != null) {
        val currentVal = when(showDialogFor) {
            "mobile_data_download" -> mobileData
            "wifi_download" -> wifi
            "roaming_download" -> roaming
            else -> "NONE"
        }
        
        AlertDialog(
            onDismissRequest = { showDialogFor = null },
            title = { 
                Text(
                    when(showDialogFor) {
                        "mobile_data_download" -> "When using mobile data"
                        "wifi_download" -> "When connected on Wi-Fi"
                        "roaming_download" -> "When roaming"
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
                                    onStorageChange(showDialogFor!!, serverOptions[index])
                                    showDialogFor = null
                                }
                                .padding(vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = currentVal == serverOptions[index],
                                onClick = {
                                    onStorageChange(showDialogFor!!, serverOptions[index])
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
                title = { Text("Storage and data", fontWeight = FontWeight.Bold) },
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
                Text(
                    text = "Media auto-download",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = WhatsAppMinimalPrimary,
                    modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 8.dp)
                )
                
                StorageItem(
                    title = "When using mobile data", 
                    subtitle = formatStorageValue(mobileData),
                    onClick = { showDialogFor = "mobile_data_download" }
                )
                StorageItem(
                    title = "When connected on Wi-Fi", 
                    subtitle = formatStorageValue(wifi),
                    onClick = { showDialogFor = "wifi_download" }
                )
                StorageItem(
                    title = "When roaming", 
                    subtitle = formatStorageValue(roaming),
                    onClick = { showDialogFor = "roaming_download" }
                )
            }
        }
    }
}

private fun formatStorageValue(value: String): String {
    return when(value) {
        "NONE" -> "No media"
        "PHOTOS" -> "Photos"
        "PHOTOS_VIDEOS" -> "Photos and videos"
        "ALL" -> "All media"
        else -> value
    }
}

@Composable
private fun StorageItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null, 
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
        if (icon != null) {
            Icon(imageVector = icon, contentDescription = null, tint = WhatsAppMinimalPrimary)
            Spacer(modifier = Modifier.width(16.dp))
        }
        Column {
            Text(text = title, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Text(text = subtitle, fontSize = 13.sp, color = Color.Gray)
        }
    }
}
