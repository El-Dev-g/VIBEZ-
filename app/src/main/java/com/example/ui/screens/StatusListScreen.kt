package com.example.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
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
import com.example.ui.components.AvatarView
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalPrimary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Security

data class GroupedStatus(
    val contactId: String,
    val contactName: String,
    val contactAvatar: String,
    val statuses: List<StatusEntity>
) {
    val isViewed: Boolean get() = statuses.all { it.isViewed }
    val latestStatus: StatusEntity get() = statuses.maxByOrNull { it.timestamp } ?: statuses.first()
}

@Composable
fun StatusListScreen(
    statuses: List<StatusEntity>,
    onStatusClick: (StatusEntity) -> Unit,
    onCreateTextStatusClick: () -> Unit,
    onCreatePhotoStatusClick: () -> Unit,
    onViewersClick: (StatusEntity) -> Unit = {},
    onStatusPrivacyClick: () -> Unit = {},
    onMyStatusListClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val myStatuses = remember(statuses) { statuses.filter { it.isMyStatus }.sortedBy { it.timestamp } }
    val myStatus = myStatuses.firstOrNull()

    val contactStatusesGrouped = remember(statuses) {
        statuses.filter { !it.isMyStatus }
            .groupBy { it.contactId }
            .map { (contactId, list) ->
                val sorted = list.sortedBy { it.timestamp }
                val first = sorted.first()
                GroupedStatus(
                    contactId = contactId,
                    contactName = first.contactName,
                    contactAvatar = first.contactAvatar,
                    statuses = sorted
                )
            }
            .sortedByDescending { it.latestStatus.timestamp }
    }

    val recentStatusesGrouped = remember(contactStatusesGrouped) {
        contactStatusesGrouped.filter { !it.isViewed }
    }

    val viewedStatusesGrouped = remember(contactStatusesGrouped) {
        contactStatusesGrouped.filter { it.isViewed }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        floatingActionButton = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                SmallFloatingActionButton(
                    onClick = onCreateTextStatusClick,
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    shape = CircleShape,
                    modifier = Modifier.padding(bottom = 12.dp).testTag("create_text_status_fab")
                ) {
                    Icon(imageVector = Icons.Default.Edit, contentDescription = "Create text status")
                }

                FloatingActionButton(
                    onClick = onCreatePhotoStatusClick,
                    containerColor = WhatsAppMinimalAccent,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier.padding(bottom = 16.dp).testTag("add_photo_status_fab")
                ) {
                    Icon(imageVector = Icons.Default.CameraAlt, contentDescription = "Add status photo")
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            // 1. Status Carousel Header & Status Circles
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp, bottom = 8.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Status",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = WhatsAppMinimalPrimary.copy(alpha = 0.12f),
                                modifier = Modifier
                                    .clickable { onStatusPrivacyClick() }
                                    .testTag("status_privacy_button")
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = "Status Privacy",
                                        tint = WhatsAppMinimalPrimary,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Privacy",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = WhatsAppMinimalPrimary
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Text(
                                    text = "${contactStatusesGrouped.size + if (myStatus != null) 1 else 0} active",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        // User's Own Status Circle
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .width(72.dp)
                                    .clickable {
                                        if (myStatus != null) {
                                            onStatusClick(myStatus)
                                        } else {
                                            onCreatePhotoStatusClick()
                                        }
                                    }
                                    .testTag("my_status_circle")
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    AvatarView(
                                        name = myStatus?.contactName ?: "Me",
                                        avatarUrl = myStatus?.contactAvatar ?: "",
                                        hasStatusUpdate = myStatuses.isNotEmpty(),
                                        isStatusViewed = myStatuses.all { it.isViewed },
                                        statusCount = myStatuses.size,
                                        size = 68.dp
                                    )

                                    // Add badge icon if no active status or for quick adding
                                    if (myStatus == null) {
                                        Box(
                                            modifier = Modifier
                                                .size(22.dp)
                                                .clip(CircleShape)
                                                .background(WhatsAppMinimalAccent)
                                                .border(2.dp, MaterialTheme.colorScheme.surface, CircleShape)
                                                .align(Alignment.BottomEnd),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Add,
                                                contentDescription = "Add status",
                                                tint = Color.White,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = if (myStatus != null) "My status" else "Add status",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }

                        // Contact Statuses connected directly to status viewer
                        items(contactStatusesGrouped, key = { "group_${it.contactId}" }) { statusGroup ->
                            val latest = statusGroup.latestStatus
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .width(72.dp)
                                    .clickable { onStatusClick(latest) }
                            ) {
                                AvatarView(
                                    name = statusGroup.contactName,
                                    avatarUrl = statusGroup.contactAvatar,
                                    hasStatusUpdate = true,
                                    isStatusViewed = statusGroup.isViewed,
                                    statusCount = statusGroup.statuses.size,
                                    size = 68.dp
                                )

                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = statusGroup.contactName.split(" ").firstOrNull() ?: statusGroup.contactName,
                                    fontSize = 12.sp,
                                    fontWeight = if (!statusGroup.isViewed) FontWeight.Bold else FontWeight.Normal,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(6.dp))
                HorizontalDivider(thickness = 0.6.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
            }

            // 2. My Status Detailed Card
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                        .clickable {
                            if (myStatus != null) onMyStatusListClick() else onCreatePhotoStatusClick()
                        }
                        .testTag("my_status_card"),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(contentAlignment = Alignment.BottomEnd) {
                            AvatarView(
                                name = myStatus?.contactName ?: "My status",
                                avatarUrl = myStatus?.contactAvatar ?: "",
                                hasStatusUpdate = myStatuses.isNotEmpty(),
                                isStatusViewed = myStatuses.all { it.isViewed },
                                statusCount = myStatuses.size,
                                size = 52.dp
                            )
                            if (myStatus == null) {
                                Box(
                                    modifier = Modifier
                                        .size(18.dp)
                                        .clip(CircleShape)
                                        .background(WhatsAppMinimalAccent)
                                        .border(1.5.dp, MaterialTheme.colorScheme.surface, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = "Add status",
                                        tint = Color.White,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "My status",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            if (myStatus != null) {
                                val timeLeftMillis = remember(myStatus.timestamp) {
                                    val twentyFourHoursMillis = 24 * 60 * 60 * 1000L
                                    val elapsed = System.currentTimeMillis() - myStatus.timestamp
                                    (twentyFourHoursMillis - elapsed).coerceAtLeast(0L)
                                }
                                
                                val timeLeftText = remember(timeLeftMillis) {
                                    val hours = timeLeftMillis / (1000 * 60 * 60)
                                    val minutes = (timeLeftMillis / (1000 * 60)) % 60
                                    when {
                                        hours > 0 -> "${hours}h left"
                                        minutes > 0 -> "${minutes}m left"
                                        else -> "Expiring"
                                    }
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = timeLeftText,
                                        fontSize = 12.sp,
                                        color = if (timeLeftMillis < 1000 * 60 * 60) Color.Red else WhatsAppEmerald,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Box(modifier = Modifier.size(3.dp).clip(CircleShape).background(MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Tap to view update",
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            } else {
                                Text(
                                    text = "Tap to add status update",
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (myStatus != null) {
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = WhatsAppEmerald.copy(alpha = 0.12f),
                                    modifier = Modifier
                                        .clickable { onViewersClick(myStatus) }
                                        .testTag("my_status_viewers_chip")
                                ) {
                                    Text(
                                        text = "Viewers",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = WhatsAppEmerald,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                            }

                            Surface(
                                shape = CircleShape,
                                color = WhatsAppMinimalPrimary.copy(alpha = 0.12f),
                                modifier = Modifier
                                    .clickable { onCreatePhotoStatusClick() }
                                    .testTag("my_status_camera_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CameraAlt,
                                    contentDescription = "Add status photo",
                                    tint = WhatsAppMinimalPrimary,
                                    modifier = Modifier
                                        .padding(8.dp)
                                        .size(18.dp)
                                )
                            }
                        }
                    }
                }
            }

            // 2. Recent Updates Section
            if (recentStatusesGrouped.isNotEmpty()) {
                item {
                    Text(
                        text = "Recent updates (${recentStatusesGrouped.size})",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = WhatsAppMinimalAccent,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }

                items(recentStatusesGrouped, key = { "recent_${it.contactId}" }) { group ->
                    StatusItemRow(
                        group = group,
                        onClick = {
                            val firstUnviewed = group.statuses.firstOrNull { !it.isViewed } ?: group.statuses.first()
                            onStatusClick(firstUnviewed)
                        }
                    )
                }
            }

            // 4. Viewed Updates Section
            if (viewedStatusesGrouped.isNotEmpty()) {
                item {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Viewed updates",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }

                items(viewedStatusesGrouped, key = { "viewed_${it.contactId}" }) { group ->
                    StatusItemRow(
                        group = group,
                        onClick = {
                            onStatusClick(group.statuses.first())
                        }
                    )
                }
            }

            // Empty State when no contact statuses
            if (contactStatusesGrouped.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 40.dp, bottom = 40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = RoundedCornerShape(24.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                            modifier = Modifier.size(180.dp)
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.no_status_updates_illustration_1787447329121),
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "No status updates",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "When your contacts post status updates, they will appear here.",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 40.dp)
                        )
                    }
                }
            }

            // End-to-End Encryption Banner at the bottom
            item {
                Spacer(modifier = Modifier.height(24.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Your status updates are end-to-end encrypted",
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
fun StatusItemRow(
    group: GroupedStatus,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 4.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.25f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AvatarView(
                name = group.contactName,
                avatarUrl = group.contactAvatar,
                hasStatusUpdate = true,
                isStatusViewed = group.isViewed,
                statusCount = group.statuses.size,
                size = 52.dp
            )

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = group.contactName,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(2.dp))
                val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
                val lastStatus = group.latestStatus
                
                val timeLeftMillis = remember(lastStatus.timestamp) {
                    val twentyFourHoursMillis = 24 * 60 * 60 * 1000L
                    val elapsed = System.currentTimeMillis() - lastStatus.timestamp
                    (twentyFourHoursMillis - elapsed).coerceAtLeast(0L)
                }
                
                val timeLeftText = remember(timeLeftMillis) {
                    val hours = timeLeftMillis / (1000 * 60 * 60)
                    val minutes = (timeLeftMillis / (1000 * 60)) % 60
                    when {
                        hours > 0 -> "${hours}h left"
                        minutes > 0 -> "${minutes}m left"
                        else -> "Expiring"
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Today, " + timeFormat.format(Date(lastStatus.timestamp)),
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(modifier = Modifier.size(3.dp).clip(CircleShape).background(MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = timeLeftText,
                        fontSize = 12.sp,
                        color = if (timeLeftMillis < 1000 * 60 * 60) Color.Red else WhatsAppEmerald,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                if (lastStatus.textCaption.isNotBlank()) {
                    Text(
                        text = lastStatus.textCaption,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
