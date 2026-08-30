package com.example.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.network.AppUpdateDto
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppUpdateScreen(
    onBackClick: () -> Unit,
    latestUpdate: AppUpdateDto?,
    isChecking: Boolean,
    error: String?,
    onCheckUpdate: () -> Unit
) {
    val uriHandler = LocalUriHandler.current
    val currentVersionCode = 1 // Hardcoded for this applet
    val currentVersionName = "1.0.0"

    LaunchedEffect(Unit) {
        onCheckUpdate()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("App updates") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Color.Black
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.SystemUpdate,
                contentDescription = null,
                modifier = Modifier.size(80.dp),
                tint = WhatsAppMinimalPrimary
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "VIBEZ Version",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = currentVersionName,
                fontSize = 14.sp,
                color = Color.Gray
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            if (isChecking) {
                CircularProgressIndicator(color = WhatsAppMinimalPrimary)
                Text(
                    text = "Checking for updates...",
                    modifier = Modifier.padding(top = 16.dp),
                    color = Color.Gray
                )
            } else if (error != null) {
                Text(
                    text = error,
                    color = Color.Red,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                Button(
                    onClick = onCheckUpdate,
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                ) {
                    Text("TRY AGAIN")
                }
            } else if (latestUpdate != null) {
                val hasUpdate = latestUpdate.versionCode > currentVersionCode
                
                if (hasUpdate) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "New version available!",
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF2E7D32)
                            )
                            Text(
                                text = "v${latestUpdate.versionName}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Text(
                                text = "What's new:",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = latestUpdate.releaseNotes,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                            
                            if (latestUpdate.isCritical) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "This is a critical update recommended for all users.",
                                    color = Color.Red,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Button(
                                onClick = { uriHandler.openUri(latestUpdate.downloadUrl) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                            ) {
                                Text("UPDATE NOW")
                            }
                        }
                    }
                } else {
                    Text(
                        text = "VIBEZ is up to date",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF2E7D32)
                    )
                    Text(
                        text = "Last checked: Just now",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    OutlinedButton(
                        onClick = onCheckUpdate,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("CHECK AGAIN", color = WhatsAppMinimalPrimary)
                    }
                }
            } else {
                // Initial state before checking or fallback
                Button(
                    onClick = onCheckUpdate,
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                ) {
                    Text("CHECK FOR UPDATES")
                }
            }
            
            Spacer(modifier = Modifier.height(48.dp))
            
            Text(
                text = "Beta Program",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                modifier = Modifier.align(Alignment.Start)
            )
            Text(
                text = "You are currently using the stable version of VIBEZ. Join our beta program to try new features before they are released.",
                fontSize = 12.sp,
                color = Color.Gray,
                modifier = Modifier
                    .align(Alignment.Start)
                    .padding(top = 4.dp)
            )
            TextButton(
                onClick = { uriHandler.openUri("https://vibez.app/beta") },
                modifier = Modifier.align(Alignment.Start)
            ) {
                Text("LEARN MORE", color = WhatsAppMinimalPrimary)
            }
        }
    }
}
