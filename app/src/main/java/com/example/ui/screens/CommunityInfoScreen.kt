package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ChatEntity
import com.example.data.CommunityEntity
import com.example.ui.components.AvatarView
import com.example.ui.components.VerifiedBadge
import com.example.ui.components.VerifiedBadgePill
import com.example.ui.theme.WhatsAppEmerald
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityInfoScreen(
    community: CommunityEntity?,
    channels: List<ChatEntity> = emptyList(),
    isAdmin: Boolean = false,
    onBackClick: () -> Unit,
    onChannelClick: (ChatEntity) -> Unit,
    onShareClick: () -> Unit = {},
    onToggleComments: (Boolean) -> Unit = {},
    onToggleReactions: (Boolean) -> Unit = {},
    onToggleVerifyPerk: () -> Unit = {},
    onDeleteCommunityClick: () -> Unit = {}
) {
    if (community == null) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = WhatsAppEmerald)
        }
        return
    }

    val context = LocalContext.current
    val formattedDate = remember(community.createdAt) {
        val sdf = SimpleDateFormat("MMMM yyyy", Locale.getDefault())
        sdf.format(Date(community.createdAt))
    }

    var commentsEnabled by remember { mutableStateOf(community.allowComments) }
    var reactionsEnabled by remember { mutableStateOf(community.allowReactions) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Community Profile", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onShareClick) {
                        Icon(imageVector = Icons.Default.Share, contentDescription = "Share Community")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
                .testTag("community_info_screen")
        ) {
            // 1. Beautiful Hero Banner with Overlapping Logo & Gradient Cover
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                ) {
                    // Modern gradient cover representing a vibrant community banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .background(
                                Brush.linearGradient(
                                    colors = if (community.isOfficial) {
                                        listOf(Color(0xFF1E3A8A), Color(0xFF3B82F6))
                                    } else {
                                        listOf(WhatsAppEmerald, Color(0xFF10B981))
                                    }
                                )
                            )
                    ) {
                        // Subtle design motifs
                        Icon(
                            imageVector = Icons.Default.Groups,
                            contentDescription = null,
                            tint = Color.White.copy(alpha = 0.15f),
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .size(120.dp)
                                .offset(x = 20.dp, y = 20.dp)
                        )
                    }

                    // Floating Community avatar logo overlapping the banner
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .align(Alignment.BottomStart)
                            .offset(x = 24.dp, y = 0.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .border(3.dp, MaterialTheme.colorScheme.surface, RoundedCornerShape(20.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        AvatarView(
                            avatarUrl = community.avatarUrl,
                            name = community.name,
                            size = 74.dp,
                            isGroup = true
                        )
                    }
                }
            }

            // 2. Primary Title & Metadata Header
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = community.name,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )

                        if (community.isOfficial) {
                            Spacer(modifier = Modifier.width(6.dp))
                            VerifiedBadge(size = 22.dp)
                        }
                    }

                    if (community.isOfficial) {
                        Spacer(modifier = Modifier.height(6.dp))
                        VerifiedBadgePill(label = "Platform Official Community")
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(
                                imageVector = Icons.Default.People,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "${community.membersCount} participants",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        Text(
                            text = "•",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Text(
                            text = "Created $formattedDate",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // 3. About / Description Card
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                    ),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        Text(
                            text = "About this community",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = WhatsAppEmerald,
                            letterSpacing = 0.8.sp,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        Text(
                            text = community.description.ifBlank { "No description has been provided for this community yet. Enjoy chatting with other members!" },
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface,
                            lineHeight = 22.sp
                        )
                    }
                }
            }

            // VIBEZ Pro Subscriber Official Community Perk
            if (isAdmin) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (community.isOfficial) Color(0xFFECFDF5) else MaterialTheme.colorScheme.surface
                        ),
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(1.dp, if (community.isOfficial) Color(0xFF10B981) else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "Official Community Badge",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = if (community.isOfficial) Color(0xFF065F46) else MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    VerifiedBadge(size = 18.dp)
                                }
                                Text(
                                    text = if (community.isOfficial)
                                        "Verified Badge active for this Community & Announcements Channel."
                                    else
                                        "Apply your VIBEZ Pro perk to grant an Official Green Badge to 1 owned community.",
                                    fontSize = 12.sp,
                                    color = if (community.isOfficial) Color(0xFF047857) else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = community.isOfficial,
                                onCheckedChange = { onToggleVerifyPerk() },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = Color(0xFF10B981)
                                )
                            )
                        }
                    }
                }
            }

            // 4. Distinctive Community Rules (Differentiating from user profile)
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(bottom = 12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Gavel,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "Community Guidelines",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        // Code of Conduct bullet points
                        RuleItem(number = "1", title = "Be Respectful", desc = "Harassment, hate speech, and spamming are strictly prohibited.")
                        RuleItem(number = "2", title = "Stay On-Topic", desc = "Post and discuss topics relevant to this community's theme.")
                        RuleItem(number = "3", title = "No Self-Promotion", desc = "Avoid sending promotional URLs or external links without admin consent.")
                    }
                }
            }

            // 5. Community Channels/Chats List Section
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 12.dp)
                ) {
                    Text(
                        text = "CHANNELS IN THIS COMMUNITY",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 1.2.sp
                    )
                }
            }

            if (channels.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.ChatBubbleOutline,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "No separate channels available.",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(channels) { channel ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onChannelClick(channel) }
                            .padding(horizontal = 24.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(WhatsAppEmerald.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (channel.isOfficial) Icons.Default.Campaign else Icons.Default.Tag,
                                contentDescription = null,
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = channel.contactName,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                if (channel.isOfficial || channel.isVerified) {
                                    Spacer(modifier = Modifier.width(6.dp))
                                    VerifiedBadge(size = 16.dp)
                                }
                            }
                            if (channel.lastMessage.isNotBlank()) {
                                Text(
                                    text = channel.lastMessage,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = "Open Chat",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // 6. Administrative Interactive Controls (Toggles)
            if (isAdmin) {
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp)
                        ) {
                            Text(
                                text = "Administrative Controls",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(bottom = 12.dp)
                            )

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Allow Feed Comments", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                    Text("Let community members post replies to announcements.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Switch(
                                    checked = commentsEnabled,
                                    onCheckedChange = {
                                        commentsEnabled = it
                                        onToggleComments(it)
                                    },
                                    colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = WhatsAppEmerald)
                                )
                            }

                            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Allow Post Reactions", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                    Text("Enable members to react with emoji high-fives and hearts.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Switch(
                                    checked = reactionsEnabled,
                                    onCheckedChange = {
                                        reactionsEnabled = it
                                        onToggleReactions(it)
                                    },
                                    colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = WhatsAppEmerald)
                                )
                            }
                            
                            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                            
                            TextButton(
                                onClick = onDeleteCommunityClick,
                                modifier = Modifier.fillMaxWidth().testTag("delete_community_button"),
                                colors = ButtonDefaults.textButtonColors(contentColor = Color.Red)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Delete Community", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun RuleItem(number: String, title: String, desc: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(CircleShape)
                .background(WhatsAppEmerald.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = number,
                color = WhatsAppEmerald,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = desc,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 16.sp
            )
        }
    }
}
