package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.network.CatalogItemDto
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BusinessProfileScreen(
    onBackClick: () -> Unit,
    initialName: String = "Vibez Official Store",
    initialCategory: String = "Shopping & Retail",
    initialDescription: String = "Welcome to our store! We provide high quality products with fast delivery.",
    initialCoverUrl: String? = null,
    initialAvatarUrl: String? = null,
    initialAddress: String = "742 Evergreen Terrace, Suite 100",
    initialHours: String = "Mon - Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM",
    initialWebsite: String = "https://vibez.app/business",
    initialEmail: String = "sales@vibez.app",
    catalogItems: List<CatalogItemDto> = emptyList(),
    onSaveProfile: (
        name: String,
        cat: String,
        desc: String,
        cover: String?,
        addr: String,
        hrs: String,
        web: String,
        mail: String
    ) -> Unit = { _, _, _, _, _, _, _, _ -> }
) {
    val context = LocalContext.current
    var businessName by remember { mutableStateOf(initialName) }
    var category by remember { mutableStateOf(initialCategory) }
    var description by remember { mutableStateOf(initialDescription) }
    var coverUrl by remember { mutableStateOf(initialCoverUrl) }
    var avatarUrl by remember { mutableStateOf(initialAvatarUrl) }
    var address by remember { mutableStateOf(initialAddress) }
    var hours by remember { mutableStateOf(initialHours) }
    var website by remember { mutableStateOf(initialWebsite) }
    var email by remember { mutableStateOf(initialEmail) }
    var isSavedSnackbar by remember { mutableStateOf(false) }

    // Cover Photo Picker
    val coverPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            coverUrl = uri.toString()
        }
    }

    // Avatar Picker
    val avatarPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            avatarUrl = uri.toString()
        }
    }

    val categories = listOf(
        "Shopping & Retail",
        "Restaurant & Cafe",
        "Beauty, Spa & Salon",
        "Clothing & Apparel",
        "Grocery & Supermarket",
        "Electronics & Gadgets",
        "Professional Services",
        "Automotive",
        "Education & Tutoring",
        "Health & Medical",
        "Finance & Insurance",
        "Other"
    )
    var isCategoryExpanded by remember { mutableStateOf(false) }

    // Calculate real-time Open / Closed status based on local time
    val isOpenNow = remember(hours) {
        val calendar = Calendar.getInstance()
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
        val hourOfDay = calendar.get(Calendar.HOUR_OF_DAY)
        // Default business hours rule: Mon-Fri (2-6) 9AM-6PM, Sat (7) 10AM-4PM
        when (dayOfWeek) {
            Calendar.SUNDAY -> false
            Calendar.SATURDAY -> hourOfDay in 10..16
            else -> hourOfDay in 9..18
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Business profile", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick, modifier = Modifier.testTag("business_profile_back_btn")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    TextButton(
                        onClick = {
                            onSaveProfile(businessName, category, description, coverUrl, address, hours, website, email)
                            isSavedSnackbar = true
                        },
                        modifier = Modifier.testTag("save_business_profile_btn")
                    ) {
                        Text("SAVE", fontWeight = FontWeight.Bold, color = WhatsAppEmerald)
                    }
                }
            )
        },
        snackbarHost = {
            if (isSavedSnackbar) {
                Snackbar(
                    action = {
                        TextButton(onClick = { isSavedSnackbar = false }) { Text("OK", color = Color.White) }
                    },
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text("Business profile updated successfully!")
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ) {
            // 1. HERO COVER BANNER & OVERLAPPING LOGO AVATAR
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
            ) {
                // Cover Image / Fallback Gradient
                if (!coverUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = coverUrl,
                        contentDescription = "Cover Image",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .background(
                                Brush.horizontalGradient(
                                    listOf(WhatsAppMinimalPrimary, WhatsAppEmerald.copy(alpha = 0.8f))
                                )
                            )
                    )
                }

                // Edit Cover Button
                IconButton(
                    onClick = {
                        coverPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(36.dp)
                        .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                        .testTag("change_cover_btn")
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "Change Cover",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                // Overlapping Avatar Logo
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(start = 16.dp)
                        .size(80.dp)
                ) {
                    if (!avatarUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = avatarUrl,
                            contentDescription = "Business Logo",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .border(3.dp, MaterialTheme.colorScheme.surface, CircleShape)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(WhatsAppMinimalPrimary)
                                .border(3.dp, MaterialTheme.colorScheme.surface, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Storefront,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(42.dp)
                            )
                        }
                    }

                    // Edit Avatar Badge
                    IconButton(
                        onClick = {
                            avatarPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                        },
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(28.dp)
                            .background(WhatsAppEmerald, CircleShape)
                            .border(1.5.dp, MaterialTheme.colorScheme.surface, CircleShape)
                            .testTag("change_avatar_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Change Avatar",
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }

            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                // Business Name & Badges
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = businessName.ifBlank { "My Business" },
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Verified Official Business",
                        tint = WhatsAppEmerald,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                ) {
                    SuggestionChip(
                        onClick = {},
                        label = { Text(category, fontSize = 12.sp) },
                        colors = SuggestionChipDefaults.suggestionChipColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        ),
                        border = null,
                        modifier = Modifier.height(28.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    // Real-time Operating Hours Status Pill
                    Surface(
                        color = if (isOpenNow) WhatsAppEmerald.copy(alpha = 0.15f) else Color.Red.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (isOpenNow) WhatsAppEmerald else Color.Red)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (isOpenNow) "Open Now" else "Closed",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isOpenNow) WhatsAppEmerald else Color.Red
                            )
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                // 2. PINNED CATALOG PREVIEW CAROUSEL
                if (catalogItems.isNotEmpty()) {
                    Text(
                        text = "FEATURED PRODUCTS & SERVICES",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                    ) {
                        items(catalogItems) { item ->
                            Card(
                                modifier = Modifier
                                    .width(140.dp)
                                    .clip(RoundedCornerShape(12.dp)),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            ) {
                                Column {
                                    if (!item.imageUrl.isNullOrBlank()) {
                                        AsyncImage(
                                            model = item.imageUrl,
                                            contentDescription = item.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(90.dp)
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(90.dp)
                                                .background(WhatsAppMinimalPrimary.copy(alpha = 0.15f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(Icons.Default.ShoppingBag, contentDescription = null, tint = WhatsAppMinimalPrimary)
                                        }
                                    }
                                    Column(modifier = Modifier.padding(8.dp)) {
                                        Text(
                                            text = item.title,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 13.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = "$${item.price} ${item.currency}",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp,
                                            color = WhatsAppEmerald
                                        )
                                    }
                                }
                            }
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                }

                // 3. EDITABLE BUSINESS PROFILE FIELDS
                Text(
                    text = "STOREFRONT INFORMATION",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = businessName,
                    onValueChange = { businessName = it },
                    label = { Text("Business name *") },
                    leadingIcon = { Icon(Icons.Default.Storefront, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("input_business_name")
                )

                // Category Dropdown
                ExposedDropdownMenuBox(
                    expanded = isCategoryExpanded,
                    onExpandedChange = { isCategoryExpanded = !isCategoryExpanded },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                ) {
                    OutlinedTextField(
                        value = category,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Category") },
                        leadingIcon = { Icon(Icons.Default.Category, contentDescription = null) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isCategoryExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth().testTag("input_business_category")
                    )
                    ExposedDropdownMenu(
                        expanded = isCategoryExpanded,
                        onDismissRequest = { isCategoryExpanded = false }
                    ) {
                        categories.forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat) },
                                onClick = {
                                    category = cat
                                    isCategoryExpanded = false
                                }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("input_business_desc")
                )

                // Address with Map intent action
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Business address") },
                    leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                    trailingIcon = {
                        if (address.isNotBlank()) {
                            IconButton(onClick = {
                                val mapIntent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${Uri.encode(address)}"))
                                context.startActivity(mapIntent)
                            }) {
                                Icon(Icons.Default.Directions, contentDescription = "View on Map", tint = WhatsAppEmerald)
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("input_business_address")
                )

                OutlinedTextField(
                    value = hours,
                    onValueChange = { hours = it },
                    label = { Text("Operating hours") },
                    leadingIcon = { Icon(Icons.Default.Schedule, contentDescription = null) },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("input_business_hours")
                )

                // Email with Mail intent
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email address") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                    trailingIcon = {
                        if (email.isNotBlank()) {
                            IconButton(onClick = {
                                val emailIntent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email"))
                                context.startActivity(emailIntent)
                            }) {
                                Icon(Icons.Default.Send, contentDescription = "Send Email", tint = WhatsAppEmerald)
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("input_business_email")
                )

                // Website with Browser intent
                OutlinedTextField(
                    value = website,
                    onValueChange = { website = it },
                    label = { Text("Official Website") },
                    leadingIcon = { Icon(Icons.Default.Language, contentDescription = null) },
                    trailingIcon = {
                        if (website.isNotBlank()) {
                            IconButton(onClick = {
                                val formattedUrl = if (!website.startsWith("http://") && !website.startsWith("https://")) "https://$website" else website
                                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(formattedUrl))
                                context.startActivity(browserIntent)
                            }) {
                                Icon(Icons.Default.OpenInNew, contentDescription = "Open Website", tint = WhatsAppEmerald)
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp).testTag("input_business_website")
                )

                Button(
                    onClick = {
                        onSaveProfile(businessName, category, description, coverUrl, address, hours, website, email)
                        isSavedSnackbar = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("submit_save_profile_button"),
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save Storefront Changes", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
