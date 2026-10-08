package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BusinessToolsScreen(
    onBackClick: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToCatalog: () -> Unit,
    onNavigateToGreetingMessage: () -> Unit,
    onNavigateToAwayMessage: () -> Unit,
    onNavigateToQuickReplies: () -> Unit,
    onNavigateToLabels: () -> Unit,
    isBusiness: Boolean = true,
    onNavigateToMigration: () -> Unit = {}
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Business tools",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBackClick,
                        modifier = Modifier.testTag("business_tools_back_btn")
                    ) {
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ) {
            if (!isBusiness) {
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.25f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .clickable { onNavigateToMigration() },
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Personal Account Active",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "You are currently using a personal account. Upgrade to a Vibez Business Account to create catalogs, set operating hours, and automate customer chats.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.85f)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = onNavigateToMigration,
                            colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Convert to Business Account", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Header Banner
            Surface(
                color = WhatsAppMinimalPrimary.copy(alpha = 0.08f),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(WhatsAppMinimalPrimary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Home,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Vibez Business Suite",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = "Verified",
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Text(
                            text = "Grow your sales, automate customer service, and showcase products.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // SECTION 1: Business Profile & Showcase
            BusinessSectionTitle("BUSINESS PROFILE & SHOWCASE")
            BusinessToolItem(
                icon = Icons.Default.Home,
                title = "Business profile",
                subtitle = "Manage address, operating hours, websites and email",
                onClick = onNavigateToProfile,
                testTag = "tool_business_profile"
            )
            BusinessToolItem(
                icon = Icons.Default.List,
                title = "Catalog",
                subtitle = "Showcase your products, pricing, and services",
                onClick = onNavigateToCatalog,
                testTag = "tool_catalog"
            )

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // SECTION 2: Messaging Tools
            BusinessSectionTitle("MESSAGING TOOLS")
            BusinessToolItem(
                icon = Icons.Default.Chat,
                title = "Greeting message",
                subtitle = "Greet new customers automatically when they first message",
                onClick = onNavigateToGreetingMessage,
                testTag = "tool_greeting_message"
            )
            BusinessToolItem(
                icon = Icons.Default.Notifications,
                title = "Away message",
                subtitle = "Reply automatically when you are outside business hours",
                onClick = onNavigateToAwayMessage,
                testTag = "tool_away_message"
            )
            BusinessToolItem(
                icon = Icons.Default.Star,
                title = "Quick replies",
                subtitle = "Reuse frequent messages using shortcuts (e.g., /thanks, /hours)",
                onClick = onNavigateToQuickReplies,
                testTag = "tool_quick_replies"
            )

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // SECTION 3: Organize Customer Chats
            BusinessSectionTitle("ORGANIZE CUSTOMERS")
            BusinessToolItem(
                icon = Icons.Default.Label,
                title = "Labels",
                subtitle = "Organize customer chats by status (New, Paid, Pending)",
                onClick = onNavigateToLabels,
                testTag = "tool_chat_labels"
            )

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun BusinessSectionTitle(text: String) {
    Text(
        text = text,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        color = WhatsAppMinimalPrimary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
    )
}

@Composable
fun BusinessToolItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    testTag: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .testTag(testTag),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Icon(
            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
