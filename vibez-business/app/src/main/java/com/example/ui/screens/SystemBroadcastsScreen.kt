package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL

data class BroadcastData(
    val id: String,
    val title: String,
    val message: String,
    val targetAudience: String,
    val sentBy: String,
    val sentAt: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SystemBroadcastsScreen(
    backendUrl: String = "http://10.0.2.2:8000",
    onBackClick: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val broadcasts = remember { mutableStateListOf<BroadcastData>() }
    var isLoading by remember { mutableStateOf(true) }
    var selectedBroadcastId by remember { mutableStateOf<String?>(null) }

    fun fetchBroadcastsFromBackend() {
        isLoading = true
        coroutineScope.launch(Dispatchers.IO) {
            val list = mutableListOf<BroadcastData>()
            try {
                val url = URL("$backendUrl/api/broadcasts")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "GET"
                conn.connectTimeout = 4000
                conn.readTimeout = 4000

                if (conn.responseCode == 200) {
                    val stream = conn.inputStream
                    val responseText = stream.bufferedReader().use { it.readText() }
                    val jsonArray = JSONArray(responseText)
                    for (i in 0 until jsonArray.length()) {
                        val obj = jsonArray.getJSONObject(i)
                        list.add(
                            BroadcastData(
                                id = obj.optString("id", "b$i"),
                                title = obj.optString("title", "System Announcement"),
                                message = obj.optString("message", ""),
                                targetAudience = obj.optString("targetAudience", "ALL"),
                                sentBy = obj.optString("sentBy", "VIBEZ Team"),
                                sentAt = obj.optString("sentAt", "Recently")
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            if (list.isEmpty()) {
                // Fallback announcements
                list.add(
                    BroadcastData(
                        id = "b1",
                        title = "📢 System Maintenance & Upgrades",
                        message = "Scheduled server optimization will take place on Sunday at 02:00 UTC. Messaging and calling services remain fully operational.",
                        targetAudience = "ALL",
                        sentBy = "VIBEZ Infrastructure Team",
                        sentAt = "Aug 25, 2026"
                    )
                )
                list.add(
                    BroadcastData(
                        id = "b2",
                        title = "🟢 Official Green Badge Verification",
                        message = "Enhance your profile credibility with an official Green Checkmark badge! Verified users get custom badge indicators on all chats and public communities.",
                        targetAudience = "ALL",
                        sentBy = "Verification Team",
                        sentAt = "Aug 24, 2026"
                    )
                )
            }

            withContext(Dispatchers.Main) {
                broadcasts.clear()
                broadcasts.addAll(list)
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchBroadcastsFromBackend()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "System Broadcasts",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            ),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Official updates & platform notices",
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBackClick,
                        modifier = Modifier.testTag("back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = { fetchBroadcastsFromBackend() },
                        modifier = Modifier.testTag("refresh_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = WhatsAppMinimalPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    // Banner Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(
                                            WhatsAppMinimalPrimary,
                                            Color(0xFF0F766E),
                                            WhatsAppMinimalAccent
                                        )
                                    )
                                )
                                .padding(20.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                        .background(Color.White.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Campaign,
                                        contentDescription = "Broadcast Banner",
                                        tint = Color.White,
                                        modifier = Modifier.size(28.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(14.dp))
                                Column {
                                    Text(
                                        text = "Official System Alerts",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 17.sp
                                    )
                                    Text(
                                        text = "Direct announcements from VIBEZ Platform Administrators.",
                                        color = Color.White.copy(alpha = 0.85f),
                                        fontSize = 12.sp,
                                        lineHeight = 16.sp
                                    )
                                }
                            }
                        }
                    }
                }

                if (isLoading) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = WhatsAppMinimalPrimary)
                        }
                    }
                } else {
                    items(broadcasts, key = { it.id }) { item ->
                        val isExpanded = selectedBroadcastId == item.id
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("broadcast_card_${item.id}")
                                .clickable {
                                    selectedBroadcastId = if (isExpanded) null else item.id
                                },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surface
                            ),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .clip(CircleShape)
                                                .background(WhatsAppMinimalNavPill),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = if (item.targetAudience == "VERIFIED_ONLY") Icons.Default.CheckCircle else Icons.Default.NotificationsActive,
                                                contentDescription = null,
                                                tint = WhatsAppMinimalPrimary,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                text = item.title,
                                                style = MaterialTheme.typography.titleMedium.copy(
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 15.sp
                                                ),
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = "${item.sentBy} • ${item.sentAt}",
                                                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Text(
                                    text = item.message,
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        fontSize = 13.5.sp,
                                        lineHeight = 19.sp
                                    ),
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.9f)
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(50),
                                        color = if (item.targetAudience == "VERIFIED_ONLY") Color(0xFFDCFCE7) else WhatsAppMinimalNavPill,
                                        border = androidx.compose.foundation.BorderStroke(
                                            1.dp,
                                            if (item.targetAudience == "VERIFIED_ONLY") Color(0xFF16A34A) else WhatsAppMinimalPrimary.copy(alpha = 0.3f)
                                        )
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = if (item.targetAudience == "VERIFIED_ONLY") Icons.Default.Shield else Icons.Default.Info,
                                                contentDescription = null,
                                                tint = if (item.targetAudience == "VERIFIED_ONLY") Color(0xFF15803D) else WhatsAppMinimalPrimary,
                                                modifier = Modifier.size(12.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = if (item.targetAudience == "VERIFIED_ONLY") "Verified Users Only" else "All VIBEZ Users",
                                                fontSize = 10.5.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (item.targetAudience == "VERIFIED_ONLY") Color(0xFF15803D) else WhatsAppMinimalPrimary
                                            )
                                        }
                                    }

                                    Text(
                                        text = "Official Notice",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}
