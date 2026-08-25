package com.example.ui.screens

import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.StatusEntity
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalPrimary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyStatusListScreen(
    statuses: List<StatusEntity>,
    onBackClick: () -> Unit,
    onStatusClick: (StatusEntity) -> Unit,
    onViewersClick: (StatusEntity) -> Unit,
    onDeleteStatus: (String) -> Unit,
    onCreateStatusClick: () -> Unit
) {
    var currentTime by androidx.compose.runtime.remember { mutableStateOf<Long>(System.currentTimeMillis()) }
    androidx.compose.runtime.LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(60000)
            currentTime = System.currentTimeMillis()
        }
    }

    val myStatuses = remember(statuses, currentTime) {
        val twentyFourHoursMillis = 24 * 60 * 60 * 1000L
        statuses.filter { it.isMyStatus && (currentTime - it.timestamp) < twentyFourHoursMillis }
            .sortedByDescending { it.timestamp }
    }

    var statusToDelete by remember { mutableStateOf<StatusEntity?>(null) }

    if (statusToDelete != null) {
        AlertDialog(
            onDismissRequest = { statusToDelete = null },
            title = { Text("Delete this status update?", fontWeight = FontWeight.Bold) },
            text = { Text("This status update will be deleted permanently for everyone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        val id = statusToDelete?.id
                        if (id != null) {
                            onDeleteStatus(id)
                        }
                        statusToDelete = null
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { statusToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "My Statuses",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${myStatuses.size} status updates",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick, modifier = Modifier.testTag("back_button")) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        if (myStatuses.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Surface(
                    shape = CircleShape,
                    color = WhatsAppMinimalPrimary.copy(alpha = 0.1f),
                    modifier = Modifier.size(96.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Visibility,
                            contentDescription = null,
                            tint = WhatsAppMinimalPrimary,
                            modifier = Modifier.size(48.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    text = "No status updates",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Share text or photo status updates that disappear after 24 hours.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(32.dp))
                Button(
                    onClick = onCreateStatusClick,
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalAccent),
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.testTag("create_status_empty_btn")
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add Status Update", fontWeight = FontWeight.Bold)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                items(myStatuses, key = { it.id }) { status ->
                    val formattedPostTime = remember(status.timestamp) {
                        val sdf = SimpleDateFormat("h:mm a", Locale.getDefault())
                        "Today at ${sdf.format(Date(status.timestamp))}"
                    }

                    val parsedBgColor = remember(status.backgroundColorHex) {
                        try {
                            Color(android.graphics.Color.parseColor(status.backgroundColorHex))
                        } catch (e: Exception) {
                            Color(0xFF128C7E)
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onStatusClick(status) }
                            .padding(horizontal = 16.dp, vertical = 12.dp)
                            .testTag("my_status_item_${status.id}"),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Thumbnail Preview of Status
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (status.mediaType == "TEXT") parsedBgColor else Color.Black)
                                .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (status.mediaType == "IMAGE") {
                                Image(
                                    painter = painterResource(id = R.drawable.img_status_banner_1787278113131),
                                    contentDescription = "Status photo preview",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Text(
                                    text = status.textCaption,
                                    color = Color.White,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 3,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.padding(4.dp),
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        // Status Info (Caption / Time / Views)
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (status.mediaType == "TEXT") status.textCaption else "Photo Status",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            
                            val timeLeftMillis = remember(status.timestamp, currentTime) {
                                val twentyFourHoursMillis = 24 * 60 * 60 * 1000L
                                val elapsed = currentTime - status.timestamp
                                (twentyFourHoursMillis - elapsed).coerceAtLeast(0L)
                            }
                            
                            val timeLeftText = remember(timeLeftMillis) {
                                val hours = timeLeftMillis / (1000 * 60 * 60)
                                val minutes = (timeLeftMillis / (1000 * 60)) % 60
                                when {
                                    hours > 0 -> "${hours}h ${minutes}m left"
                                    minutes > 0 -> "${minutes}m left"
                                    else -> "Expiring soon"
                                }
                            }
                            
                            val progress = remember(timeLeftMillis) {
                                (timeLeftMillis.toFloat() / (24 * 60 * 60 * 1000L)).coerceIn(0f, 1f)
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = timeLeftText,
                                    fontSize = 11.sp,
                                    color = if (progress < 0.2f) Color.Red else WhatsAppEmerald,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                androidx.compose.material3.LinearProgressIndicator(
                                    progress = { progress },
                                    modifier = Modifier
                                        .width(60.dp)
                                        .height(4.dp)
                                        .clip(RoundedCornerShape(2.dp)),
                                    color = if (progress < 0.2f) Color.Red else WhatsAppEmerald,
                                    trackColor = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(2.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Outlined.Schedule,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = formattedPostTime,
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        // Actions: Viewers Count Chip + Delete Button
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = WhatsAppEmerald.copy(alpha = 0.12f),
                                modifier = Modifier
                                    .clickable { onViewersClick(status) }
                                    .testTag("status_item_views_${status.id}")
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Visibility,
                                        contentDescription = "Views",
                                        tint = WhatsAppEmerald,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = status.viewCount.toString(),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = WhatsAppEmerald
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            IconButton(
                                onClick = { statusToDelete = status },
                                modifier = Modifier.testTag("status_item_delete_${status.id}")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete Status",
                                    tint = MaterialTheme.colorScheme.error,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }

                    HorizontalDivider(
                        thickness = 0.5.dp,
                        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f),
                        modifier = Modifier.padding(start = 86.dp)
                    )
                }
            }
        }
    }
}
