package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Store
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.network.BusinessProfileDto
import com.example.data.network.CatalogItemDto
import com.example.ui.WhatsAppViewModel
import com.example.ui.components.AvatarView
import com.example.ui.components.VerifiedBadge
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BusinessStorefrontScreen(
    businessUserId: String,
    chatId: String,
    viewModel: WhatsAppViewModel,
    onBackClick: () -> Unit,
    onOrderSent: () -> Unit,
    onVoiceCallClick: (() -> Unit)? = null,
    onVideoCallClick: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val profile by viewModel.selectedBusinessProfile.collectAsState()
    val catalog by viewModel.selectedBusinessCatalog.collectAsState()
    val cartItems by viewModel.cartItems.collectAsState()
    val isLoading by viewModel.isStorefrontLoading.collectAsState()

    var showCartSheet by remember { mutableStateOf(false) }
    var selectedProductForDetail by remember { mutableStateOf<CatalogItemDto?>(null) }
    var orderNote by remember { mutableStateOf("") }
    var isSubmittingOrder by remember { mutableStateOf(false) }

    LaunchedEffect(businessUserId) {
        viewModel.loadBusinessStorefront(businessUserId)
    }

    val totalItemsCount = cartItems.values.sum()
    val totalAmount = cartItems.entries.sumOf { (itemId, qty) ->
        val item = catalog.firstOrNull { it.id == itemId }
        (item?.price ?: 0.0) * qty
    }

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = profile?.businessName ?: "Storefront",
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        if (profile?.isVerified == true || profile?.user?.isVerified == true) {
                            Spacer(modifier = Modifier.width(6.dp))
                            VerifiedBadge(size = 18.dp)
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick, modifier = Modifier.testTag("storefront_back_btn")) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    if (onVoiceCallClick != null) {
                        IconButton(onClick = onVoiceCallClick, modifier = Modifier.testTag("storefront_call_btn")) {
                            Icon(
                                imageVector = Icons.Default.Call,
                                contentDescription = "Call Business",
                                tint = WhatsAppEmerald
                            )
                        }
                    }
                    if (onVideoCallClick != null) {
                        IconButton(onClick = onVideoCallClick, modifier = Modifier.testTag("storefront_videocall_btn")) {
                            Icon(
                                imageVector = Icons.Default.Videocam,
                                contentDescription = "Video Call Business",
                                tint = WhatsAppEmerald
                            )
                        }
                    }
                    if (totalItemsCount > 0) {
                        Box(modifier = Modifier.padding(end = 8.dp)) {
                            IconButton(onClick = { showCartSheet = true }) {
                                Icon(
                                    imageVector = Icons.Default.ShoppingCart,
                                    contentDescription = "Shopping Cart",
                                    tint = WhatsAppEmerald
                                )
                            }
                            Surface(
                                shape = CircleShape,
                                color = WhatsAppEmerald,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(top = 4.dp, end = 4.dp)
                            ) {
                                Text(
                                    text = totalItemsCount.toString(),
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            AnimatedVisibility(
                visible = totalItemsCount > 0,
                enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
                exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
            ) {
                Surface(
                    tonalElevation = 8.dp,
                    shadowElevation = 8.dp,
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "$totalItemsCount ${if (totalItemsCount == 1) "item" else "items"} in Cart",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = String.format(Locale.US, "$%.2f USD", totalAmount),
                                fontSize = 18.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = WhatsAppMinimalPrimary
                            )
                        }

                        Button(
                            onClick = { showCartSheet = true },
                            colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.testTag("view_cart_btn")
                        ) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("View Cart & Order", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (isLoading && profile == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = WhatsAppEmerald)
            }
        } else {
            val effProfile = profile ?: com.example.data.network.BusinessProfileDto(
                id = businessUserId,
                userId = businessUserId,
                businessName = "Official Storefront",
                category = "Shopping & Retail",
                description = "Welcome to our business storefront! Browse products and place orders directly.",
                isVerified = true
            )
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(bottom = if (totalItemsCount > 0) 90.dp else 24.dp)
            ) {
                // 1. Cover Photo & Business Header Banner
                item {
                    val coverUrl = profile?.coverImageUrl
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(Color(0xFF005C4B), Color(0xFF023E34))
                                )
                            )
                    ) {
                        if (!coverUrl.isNullOrBlank()) {
                            AsyncImage(
                                model = coverUrl,
                                contentDescription = "Business Cover",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Store,
                                        contentDescription = null,
                                        tint = Color.White.copy(alpha = 0.6f),
                                        modifier = Modifier.size(48.dp)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        text = "Official Storefront",
                                        color = Color.White.copy(alpha = 0.8f),
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }

                // 2. Business Profile Card Overlap
                item {
                    val p = profile
                    val bizName = p?.businessName?.ifBlank { p.user?.name ?: "Business" } ?: "Business"
                    val avatar = p?.user?.avatarUrl ?: ""

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .padding(top = 12.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                AvatarView(
                                    name = bizName,
                                    avatarUrl = avatar,
                                    isGroup = false,
                                    isVerified = p?.isVerified == true || p?.user?.isVerified == true,
                                    size = 56.dp
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = bizName,
                                            fontSize = 18.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        if (p?.isVerified == true || p?.user?.isVerified == true) {
                                            Spacer(modifier = Modifier.width(4.dp))
                                            VerifiedBadge(size = 18.dp)
                                        }
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = WhatsAppEmerald.copy(alpha = 0.15f),
                                        modifier = Modifier.padding(top = 4.dp)
                                    ) {
                                        Text(
                                            text = p?.category ?: "Shopping & Retail",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = WhatsAppEmerald,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }

                            if (!p?.description.isNullOrBlank()) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = p!!.description!!,
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    lineHeight = 20.sp
                                )
                            }

                            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                            // Details list
                            if (!p?.businessHours.isNullOrBlank()) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(vertical = 3.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AccessTime,
                                        contentDescription = null,
                                        tint = WhatsAppEmerald,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = p!!.businessHours!!,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = Color(0xFF25D366).copy(alpha = 0.2f)
                                    ) {
                                        Text(
                                            text = "Open",
                                            color = Color(0xFF25D366),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                                        )
                                    }
                                }
                            }

                            if (!p?.address.isNullOrBlank()) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(vertical = 3.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocationOn,
                                        contentDescription = null,
                                        tint = Color(0xFFE53935),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = p!!.address!!,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }

                            if (!p?.email.isNullOrBlank()) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(vertical = 3.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Email,
                                        contentDescription = null,
                                        tint = WhatsAppMinimalPrimary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = p!!.email!!,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }

                            if (onVoiceCallClick != null || onVideoCallClick != null) {
                                HorizontalDivider(
                                    modifier = Modifier.padding(vertical = 12.dp),
                                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    if (onVoiceCallClick != null) {
                                        OutlinedButton(
                                            onClick = onVoiceCallClick,
                                            modifier = Modifier.weight(1f).testTag("storefront_quick_audio_btn"),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Call,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp),
                                                tint = WhatsAppEmerald
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Audio Call", fontSize = 12.sp, color = WhatsAppEmerald)
                                        }
                                    }
                                    if (onVideoCallClick != null) {
                                        OutlinedButton(
                                            onClick = onVideoCallClick,
                                            modifier = Modifier.weight(1f).testTag("storefront_quick_video_btn"),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Videocam,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp),
                                                tint = WhatsAppEmerald
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Video Call", fontSize = 12.sp, color = WhatsAppEmerald)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 3. Product Catalog Header
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .padding(top = 20.dp, bottom = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.ShoppingBag,
                                contentDescription = null,
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Products & Services",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Text(
                            text = "${catalog.size} items",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // 4. Catalog Items List
                if (catalog.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Store,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                                    modifier = Modifier.size(48.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "No catalog items listed yet",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    items(catalog, key = { it.id }) { item ->
                        val qty = cartItems[item.id] ?: 0
                        ConsumerCatalogItemCard(
                            item = item,
                            quantityInCart = qty,
                            onAddToCart = { viewModel.addToCart(item) },
                            onIncrement = { viewModel.updateCartQuantity(item.id, qty + 1) },
                            onDecrement = { viewModel.updateCartQuantity(item.id, qty - 1) },
                            onItemClick = { selectedProductForDetail = item }
                        )
                    }
                }
            }
        }
    }

    // Modal Bottom Sheet: Cart & Checkout Summary
    if (showCartSheet) {
        ModalBottomSheet(
            onDismissRequest = { showCartSheet = false },
            sheetState = sheetState
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 32.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Your Order Cart",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    TextButton(onClick = { viewModel.clearCart() }) {
                        Text("Clear all", color = Color.Red, fontSize = 13.sp)
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                // Items list in cart
                LazyColumn(modifier = Modifier.height((cartItems.size * 70).coerceAtMost(250).dp)) {
                    items(cartItems.entries.toList(), key = { it.key }) { (itemId, qty) ->
                        val product = catalog.firstOrNull { it.id == itemId }
                        if (product != null) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (!product.imageUrl.isNullOrBlank()) {
                                    AsyncImage(
                                        model = product.imageUrl,
                                        contentDescription = null,
                                        modifier = Modifier
                                            .size(44.dp)
                                            .clip(RoundedCornerShape(8.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = product.title,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = String.format(Locale.US, "$%.2f each", product.price),
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    IconButton(
                                        onClick = { viewModel.updateCartQuantity(product.id, qty - 1) },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(
                                            imageVector = if (qty == 1) Icons.Default.Delete else Icons.Default.Remove,
                                            contentDescription = "Decrease",
                                            tint = if (qty == 1) Color.Red else MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                    Text(
                                        text = qty.toString(),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        modifier = Modifier.padding(horizontal = 6.dp)
                                    )
                                    IconButton(
                                        onClick = { viewModel.updateCartQuantity(product.id, qty + 1) },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Add,
                                            contentDescription = "Increase",
                                            tint = WhatsAppEmerald
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Optional Order Note / Instructions
                OutlinedTextField(
                    value = orderNote,
                    onValueChange = { orderNote = it },
                    label = { Text("Note / Delivery instructions (optional)") },
                    placeholder = { Text("e.g., Preferred size, pickup time...") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 2
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Subtotal Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Total Estimated Amount",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = String.format(Locale.US, "$%.2f USD", totalAmount),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = WhatsAppEmerald
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        isSubmittingOrder = true
                        val bizName = profile?.businessName ?: "Merchant"
                        viewModel.sendOrderInquiry(
                            chatId = chatId,
                            businessUserId = businessUserId,
                            businessName = bizName,
                            note = orderNote.takeIf { it.isNotBlank() }
                        ) { success ->
                            isSubmittingOrder = false
                            if (success) {
                                Toast.makeText(context, "Order sent to $bizName!", Toast.LENGTH_SHORT).show()
                                showCartSheet = false
                                onOrderSent()
                            } else {
                                Toast.makeText(context, "Failed to send order inquiry. Please try again.", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("send_order_inquiry_btn"),
                    enabled = !isSubmittingOrder && cartItems.isNotEmpty()
                ) {
                    if (isSubmittingOrder) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Icon(Icons.Default.Send, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Send Order Inquiry to Business", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    if (selectedProductForDetail != null) {
        val detailItem = selectedProductForDetail!!
        val qty = cartItems[detailItem.id] ?: 0
        ProductDetailSheet(
            item = detailItem,
            quantityInCart = qty,
            onAddToCart = { viewModel.addToCart(detailItem) },
            onIncrement = { viewModel.updateCartQuantity(detailItem.id, qty + 1) },
            onDecrement = { viewModel.updateCartQuantity(detailItem.id, qty - 1) },
            onDismiss = { selectedProductForDetail = null }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailSheet(
    item: CatalogItemDto,
    quantityInCart: Int,
    onAddToCart: () -> Unit,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp)
                .verticalScroll(rememberScrollState())
        ) {
            if (!item.imageUrl.isNullOrBlank()) {
                AsyncImage(
                    model = item.imageUrl,
                    contentDescription = item.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(16.dp))
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(WhatsAppEmerald.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ShoppingBag,
                        contentDescription = null,
                        tint = WhatsAppEmerald,
                        modifier = Modifier.size(56.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = item.title,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = String.format(Locale.US, "$%.2f %s", item.price, item.currency),
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                color = WhatsAppMinimalPrimary
            )

            if (!item.description.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Description",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = item.description!!,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            if (!item.link.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable {
                        try {
                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(item.link))
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "Could not open link", Toast.LENGTH_SHORT).show()
                        }
                    }
                ) {
                    Icon(Icons.Default.Language, contentDescription = null, tint = WhatsAppEmerald, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = item.link!!, color = WhatsAppEmerald, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        val shareText = "🛍️ *${item.title}*\nPrice: $${String.format(Locale.US, "%.2f", item.price)} ${item.currency}\n${item.description ?: ""}\n${item.link ?: ""}".trim()
                        val sendIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                            putExtra(android.content.Intent.EXTRA_TEXT, shareText)
                            type = "text/plain"
                        }
                        context.startActivity(android.content.Intent.createChooser(sendIntent, "Share Product"))
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Share")
                }

                if (quantityInCart == 0) {
                    Button(
                        onClick = onAddToCart,
                        colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1.5f)
                    ) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add to Cart", fontWeight = FontWeight.Bold)
                    }
                } else {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = WhatsAppEmerald.copy(alpha = 0.15f),
                        modifier = Modifier.weight(1.5f)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            modifier = Modifier.padding(vertical = 4.dp)
                        ) {
                            IconButton(onClick = onDecrement) {
                                Icon(
                                    imageVector = if (quantityInCart == 1) Icons.Default.Delete else Icons.Default.Remove,
                                    contentDescription = null,
                                    tint = if (quantityInCart == 1) Color.Red else WhatsAppEmerald
                                )
                            }
                            Text("$quantityInCart in Cart", fontWeight = FontWeight.Bold, color = WhatsAppEmerald, fontSize = 14.sp)
                            IconButton(onClick = onIncrement) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = WhatsAppEmerald)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConsumerCatalogItemCard(
    item: CatalogItemDto,
    quantityInCart: Int,
    onAddToCart: () -> Unit,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    onItemClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onItemClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (!item.imageUrl.isNullOrBlank()) {
                AsyncImage(
                    model = item.imageUrl,
                    contentDescription = item.title,
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(10.dp)),
                    contentScale = ContentScale.Crop
                )
                Spacer(modifier = Modifier.width(12.dp))
            } else {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(WhatsAppEmerald.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ShoppingBag,
                        contentDescription = null,
                        tint = WhatsAppEmerald,
                        modifier = Modifier.size(32.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (!item.description.isNullOrBlank()) {
                    Text(
                        text = item.description!!,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
                Text(
                    text = String.format(Locale.US, "$%.2f %s", item.price, item.currency),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = WhatsAppMinimalPrimary,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            // Add to cart or quantity stepper
            if (quantityInCart == 0) {
                Button(
                    onClick = onAddToCart,
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald.copy(alpha = 0.15f)),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = null,
                        tint = WhatsAppEmerald,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add", color = WhatsAppEmerald, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            } else {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = WhatsAppEmerald.copy(alpha = 0.15f)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = onDecrement,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = if (quantityInCart == 1) Icons.Default.Delete else Icons.Default.Remove,
                                contentDescription = "Decrease",
                                tint = if (quantityInCart == 1) Color.Red else WhatsAppEmerald,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Text(
                            text = quantityInCart.toString(),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = WhatsAppEmerald,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                        IconButton(
                            onClick = onIncrement,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Increase",
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
