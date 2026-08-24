package com.example.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.data.MessageEntity
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SharedMediaScreen(
    contactName: String,
    messages: List<MessageEntity>,
    onBackClick: () -> Unit,
    onMediaItemClick: (MessageEntity) -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Media", "Docs", "Links")

    val mediaMessages = messages.filter { it.messageType == "IMAGE" || it.messageType == "VIDEO" }
    val docMessages = messages.filter { it.messageType == "DOCUMENT" }
    val linkMessages = messages.filter { it.content.contains("http", ignoreCase = true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(contactName, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        Text("${mediaMessages.size} media, ${docMessages.size} docs", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = WhatsAppMinimalPrimary,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = WhatsAppMinimalPrimary
                    )
                }
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal) }
                    )
                }
            }

            when (selectedTab) {
                0 -> MediaGrid(mediaMessages, onMediaItemClick)
                1 -> DocumentsList(docMessages, onMediaItemClick)
                2 -> LinksList(linkMessages)
            }
        }
    }
}

@Composable
fun MediaGrid(messages: List<MessageEntity>, onItemClick: (MessageEntity) -> Unit) {
    if (messages.isEmpty()) {
        EmptyState("No media shared yet")
    } else {
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(1.dp),
            horizontalArrangement = Arrangement.spacedBy(1.dp),
            verticalArrangement = Arrangement.spacedBy(1.dp)
        ) {
            items(messages) { message ->
                Box(
                    modifier = Modifier
                        .aspectRatio(1f)
                        .clickable { onItemClick(message) }
                ) {
                    if (message.mediaUrl.isNotBlank()) {
                        AsyncImage(
                            model = message.mediaUrl,
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Image(
                            painter = painterResource(id = R.drawable.img_chat_wallpaper_1787278101057),
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    if (message.messageType == "VIDEO") {
                        Icon(
                            imageVector = Icons.Default.PlayCircle,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(4.dp)
                                .size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DocumentsList(messages: List<MessageEntity>, onItemClick: (MessageEntity) -> Unit) {
    if (messages.isEmpty()) {
        EmptyState("No documents shared yet")
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            messages.forEach { message ->
                ListItem(
                    headlineContent = { Text(message.content, fontWeight = FontWeight.Medium) },
                    supportingContent = { Text("PDF • 1.2 MB • Oct 12, 2023", fontSize = 12.sp) },
                    leadingContent = {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = WhatsAppMinimalPrimary.copy(alpha = 0.1f),
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Description, contentDescription = null, tint = WhatsAppMinimalPrimary)
                            }
                        }
                    },
                    modifier = Modifier.clickable { onItemClick(message) }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant)
            }
        }
    }
}

@Composable
fun LinksList(messages: List<MessageEntity>) {
    if (messages.isEmpty()) {
        EmptyState("No links shared yet")
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            messages.forEach { message ->
                ListItem(
                    headlineContent = { Text(message.content, color = WhatsAppMinimalPrimary, maxLines = 1) },
                    supportingContent = { Text("Shared Oct 10, 2023", fontSize = 12.sp) },
                    leadingContent = {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color.Gray.copy(alpha = 0.1f),
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Link, contentDescription = null, tint = Color.Gray)
                            }
                        }
                    }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant)
            }
        }
    }
}

@Composable
fun EmptyState(text: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
