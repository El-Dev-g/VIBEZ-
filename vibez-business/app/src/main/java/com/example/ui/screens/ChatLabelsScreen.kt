package com.example.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.network.ChatLabelDto
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatLabelsScreen(
    onBackClick: () -> Unit,
    labels: List<ChatLabelDto> = emptyList(),
    onAddLabel: (name: String, colorHex: String) -> Unit = { _, _ -> },
    onLabelClick: (ChatLabelDto) -> Unit = {}
) {
    var showDialog by remember { mutableStateOf(false) }
    var labelName by remember { mutableStateOf("") }
    var selectedColor by remember { mutableStateOf("#00A884") }

    val defaultColors = listOf(
        "#00A884", "#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"
    )

    val labelList = remember(labels) {
        if (labels.isNotEmpty()) labels else listOf(
            ChatLabelDto(id = "l1", name = "New customer", colorHex = "#00A884", chatIds = listOf("c1", "c2")),
            ChatLabelDto(id = "l2", name = "New order", colorHex = "#F59E0B", chatIds = listOf("c3")),
            ChatLabelDto(id = "l3", name = "Pending payment", colorHex = "#EF4444", chatIds = listOf("c4")),
            ChatLabelDto(id = "l4", name = "Paid", colorHex = "#10B981", chatIds = listOf("c5", "c6", "c7")),
            ChatLabelDto(id = "l5", name = "Order complete", colorHex = "#3B82F6", chatIds = listOf("c8"))
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Labels", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick, modifier = Modifier.testTag("labels_back_btn")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showDialog = true }, modifier = Modifier.testTag("add_label_top_btn")) {
                        Icon(Icons.Default.Add, contentDescription = "New label")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = WhatsAppMinimalPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_label_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add label")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item {
                Text(
                    text = "Organize and prioritize your customer conversations with color-coded labels.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            items(labelList) { label ->
                val badgeColor = remember(label.colorHex) {
                    try {
                        Color(android.graphics.Color.parseColor(label.colorHex))
                    } catch (e: Exception) {
                        Color(0xFF00A884)
                    }
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onLabelClick(label) }
                        .testTag("label_card_${label.id}"),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(badgeColor),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Label,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = label.name,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${label.chatIds.size} chats",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("New label") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = labelName,
                        onValueChange = { labelName = it },
                        label = { Text("Label name *") },
                        placeholder = { Text("e.g. VIP Customer") },
                        modifier = Modifier.fillMaxWidth().testTag("input_new_label_name")
                    )

                    Text("Choose color", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        defaultColors.forEach { hex ->
                            val color = remember(hex) { Color(android.graphics.Color.parseColor(hex)) }
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(color)
                                    .clickable { selectedColor = hex },
                                contentAlignment = Alignment.Center
                            ) {
                                if (selectedColor == hex) {
                                    Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (labelName.isNotBlank()) {
                            onAddLabel(labelName, selectedColor)
                            labelName = ""
                            showDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_create_label_btn")
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) { Text("Cancel") }
            }
        )
    }
}
