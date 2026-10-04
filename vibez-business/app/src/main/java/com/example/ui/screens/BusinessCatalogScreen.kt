package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import coil.compose.AsyncImage
import com.example.data.network.CatalogItemDto
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BusinessCatalogScreen(
    onBackClick: () -> Unit,
    items: List<CatalogItemDto> = emptyList(),
    onAddItem: (title: String, price: Double, description: String, link: String) -> Unit = { _, _, _, _ -> },
    onDeleteItem: (id: String) -> Unit = {},
    onShareItemToChat: (item: CatalogItemDto) -> Unit = {}
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var itemTitle by remember { mutableStateOf("") }
    var itemPrice by remember { mutableStateOf("") }
    var itemDescription by remember { mutableStateOf("") }
    var itemLink by remember { mutableStateOf("") }

    // Seed preview items if empty
    val catalogList = remember(items) {
        if (items.isNotEmpty()) items else listOf(
            CatalogItemDto(
                id = "item_1",
                title = "Vibez Pro Business Subscription",
                description = "Automated sales bot, unlimited customer labels, and priority support.",
                price = 29.99,
                currency = "USD"
            ),
            CatalogItemDto(
                id = "item_2",
                title = "1-on-1 Consultation Call (30 min)",
                description = "Direct consultation over high-definition WebRTC video call.",
                price = 49.00,
                currency = "USD"
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Catalog", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick, modifier = Modifier.testTag("catalog_back_btn")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showAddDialog = true }, modifier = Modifier.testTag("add_catalog_item_icon")) {
                        Icon(Icons.Default.Add, contentDescription = "Add Item")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = WhatsAppMinimalPrimary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_catalog_item_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add item")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    text = "${catalogList.size} Items in Catalog",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }

            items(catalogList) { item ->
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("catalog_item_${item.id}"),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(WhatsAppMinimalPrimary.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ShoppingBag,
                                    contentDescription = null,
                                    tint = WhatsAppMinimalPrimary,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.title,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "$${"%.2f".format(item.price)} ${item.currency}",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = WhatsAppEmerald
                                )
                            }
                            IconButton(onClick = { onDeleteItem(item.id) }) {
                                Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                            }
                        }

                        if (!item.description.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = item.description,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            OutlinedButton(
                                onClick = { onShareItemToChat(item) },
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.testTag("share_catalog_item_${item.id}")
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Send to customer")
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }

    // Add Item Dialog
    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Add new item or service") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = itemTitle,
                        onValueChange = { itemTitle = it },
                        label = { Text("Item title *") },
                        modifier = Modifier.fillMaxWidth().testTag("input_item_title")
                    )
                    OutlinedTextField(
                        value = itemPrice,
                        onValueChange = { itemPrice = it },
                        label = { Text("Price (USD) *") },
                        modifier = Modifier.fillMaxWidth().testTag("input_item_price")
                    )
                    OutlinedTextField(
                        value = itemDescription,
                        onValueChange = { itemDescription = it },
                        label = { Text("Description") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth().testTag("input_item_desc")
                    )
                    OutlinedTextField(
                        value = itemLink,
                        onValueChange = { itemLink = it },
                        label = { Text("Website or payment link") },
                        modifier = Modifier.fillMaxWidth().testTag("input_item_link")
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val parsedPrice = itemPrice.toDoubleOrNull() ?: 0.0
                        if (itemTitle.isNotBlank()) {
                            onAddItem(itemTitle, parsedPrice, itemDescription, itemLink)
                            itemTitle = ""
                            itemPrice = ""
                            itemDescription = ""
                            itemLink = ""
                            showAddDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_add_catalog_item_btn")
                ) {
                    Text("Add Item")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
