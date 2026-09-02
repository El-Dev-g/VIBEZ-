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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpSettingsScreen(
    onBackClick: () -> Unit
) {
    val uriHandler = androidx.compose.ui.platform.LocalUriHandler.current
    val context = androidx.compose.ui.platform.LocalContext.current
    var showInfoDialog by remember { mutableStateOf(false) }

    var helpCenterUrl by remember { mutableStateOf("https://support.vibez.chat") }
    var legalUrl by remember { mutableStateOf("https://vibez.chat/privacy") }
    var supportEmail by remember { mutableStateOf("support@vibez.chat") }

    LaunchedEffect(Unit) {
        try {
            val config = com.example.data.network.NetworkClient.apiService.getPublicAppConfig()
            if (!config.helpCenterUrl.isNullOrBlank()) helpCenterUrl = config.helpCenterUrl!!
            else if (!config.faqUrl.isNullOrBlank()) helpCenterUrl = config.faqUrl!!
            
            if (!config.privacyPolicyUrl.isNullOrBlank()) legalUrl = config.privacyPolicyUrl!!
            else if (!config.termsOfServiceUrl.isNullOrBlank()) legalUrl = config.termsOfServiceUrl!!
            
            if (!config.contactEmail.isNullOrBlank()) supportEmail = config.contactEmail!!
        } catch (_: Exception) {}
    }

    if (showInfoDialog) {
        AlertDialog(
            onDismissRequest = { showInfoDialog = false },
            title = { Text("App Info") },
            text = {
                Column {
                    Text("VIBEZ for Android", fontWeight = FontWeight.Bold)
                    Text("Version: 1.0.0 (Stable)")
                    Text("Build: August 30, 2026")
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("© 2026 VIBEZ. Powered by PRIGID GROUP.")
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(
                        onClick = { uriHandler.openUri("https://vibez.app") },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text("Visit Website", color = WhatsAppMinimalPrimary)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showInfoDialog = false }) {
                    Text("OK", color = WhatsAppMinimalPrimary)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Help", fontWeight = FontWeight.Bold) },
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
                HelpItem(
                    icon = Icons.Default.HelpCenter, 
                    title = "Help Center", 
                    subtitle = "Read our FAQs and guides",
                    onClick = { uriHandler.openUri(helpCenterUrl) }
                )
                HelpItem(
                    icon = Icons.Default.Group, 
                    title = "Contact us", 
                    subtitle = "Questions? Need help?",
                    onClick = {
                        val intent = android.content.Intent(android.content.Intent.ACTION_SENDTO).apply {
                            data = android.net.Uri.parse("mailto:$supportEmail")
                            putExtra(android.content.Intent.EXTRA_SUBJECT, "VIBEZ Support - Android")
                        }
                        try {
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            // Handle if no email app is installed
                        }
                    }
                )
                HelpItem(
                    icon = Icons.Default.Description, 
                    title = "Terms and Privacy Policy", 
                    subtitle = "How we protect your data",
                    onClick = { uriHandler.openUri(legalUrl) }
                )
                HelpItem(
                    icon = Icons.Default.Info, 
                    title = "App info", 
                    subtitle = "Version, licenses",
                    onClick = { showInfoDialog = true }
                )
            }
        }
    }
}

@Composable
private fun HelpItem(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = WhatsAppMinimalPrimary)
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(text = title, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Text(text = subtitle, fontSize = 13.sp, color = Color.Gray)
        }
    }
}
