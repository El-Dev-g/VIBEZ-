package com.example.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
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
                    onClick = { uriHandler.openUri("https://faq.whatsapp.com") }
                )
                HelpItem(
                    icon = Icons.Default.Group, 
                    title = "Contact us", 
                    subtitle = "Questions? Need help?",
                    onClick = { /* Could open email or a form */ }
                )
                HelpItem(
                    icon = Icons.Default.Description, 
                    title = "Terms and Privacy Policy", 
                    subtitle = "How we protect your data",
                    onClick = { uriHandler.openUri("https://www.whatsapp.com/legal") }
                )
                HelpItem(
                    icon = Icons.Default.Info, 
                    title = "App info", 
                    subtitle = "Version, licenses",
                    onClick = { /* Show a dialog or another screen */ }
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
