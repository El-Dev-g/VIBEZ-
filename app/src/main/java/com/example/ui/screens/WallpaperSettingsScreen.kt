package com.example.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ColorLens
import androidx.compose.material.icons.filled.FormatPaint
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Wallpaper
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalPrimary

data class WallpaperPreset(
    val id: String,
    val name: String,
    val hexColor: String? = null,
    val gradientColors: List<Color>? = null,
    val isDoodle: Boolean = false,
    val isCustomImage: Boolean = false,
    val imageUri: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WallpaperSettingsScreen(
    chatId: Long?,
    contactName: String,
    initialWallpaper: String,
    initialDimming: Float,
    isDarkMode: Boolean,
    onBackClick: () -> Unit,
    onSaveWallpaper: (chatId: Long?, wallpaperValue: String, dimming: Float) -> Unit
) {
    val context = LocalContext.current
    var selectedWallpaper by remember { mutableStateOf(if (initialWallpaper.isBlank()) "DEFAULT" else initialWallpaper) }
    var wallpaperDimming by remember { mutableFloatStateOf(initialDimming) }
    var selectedCategoryTab by remember { mutableIntStateOf(0) } // 0: Colors, 1: Gradients, 2: Doodles & Photos

    val solidColorPresets = remember {
        listOf(
            WallpaperPreset("COLOR_DEFAULT", "WhatsApp Classic", hexColor = "#EFEAE2"),
            WallpaperPreset("COLOR_MINT", "Mint Breeze", hexColor = "#E0F2F1"),
            WallpaperPreset("COLOR_SKY", "Sky Blue", hexColor = "#E3F2FD"),
            WallpaperPreset("COLOR_LAVENDER", "Soft Lavender", hexColor = "#EDE7F6"),
            WallpaperPreset("COLOR_PEACH", "Warm Peach", hexColor = "#FBE9E7"),
            WallpaperPreset("COLOR_DARK_SLATE", "Deep Slate", hexColor = "#111B21"),
            WallpaperPreset("COLOR_MIDNIGHT", "Midnight Teal", hexColor = "#0B141A"),
            WallpaperPreset("COLOR_CHARCOAL", "Charcoal Gray", hexColor = "#202C33"),
            WallpaperPreset("COLOR_FOREST", "Pine Forest", hexColor = "#0A281E"),
            WallpaperPreset("COLOR_INDIGO", "Cosmic Indigo", hexColor = "#1A1A3A")
        )
    }

    val gradientPresets = remember {
        listOf(
            WallpaperPreset("GRAD_EMERALD", "Emerald Glow", gradientColors = listOf(Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364))),
            WallpaperPreset("GRAD_SUNSET", "Sunset Amber", gradientColors = listOf(Color(0xFFFF512F), Color(0xFFDD2476))),
            WallpaperPreset("GRAD_AURORA", "Aurora Borealis", gradientColors = listOf(Color(0xFF00C9FF), Color(0xFF92FE9D))),
            WallpaperPreset("GRAD_NEON", "Neon Cyber", gradientColors = listOf(Color(0xFF8A2387), Color(0xFFE94057), Color(0xFFF27121))),
            WallpaperPreset("GRAD_PASTEL", "Pastel Dream", gradientColors = listOf(Color(0xFFA1C4FD), Color(0xFFC2E9FB))),
            WallpaperPreset("GRAD_DARK_NEBULA", "Deep Nebula", gradientColors = listOf(Color(0xFF141E30), Color(0xFF243B55)))
        )
    }

    // Photo picker for custom gallery image
    val pickCustomImageLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            selectedWallpaper = uri.toString()
            Toast.makeText(context, "Custom image selected", Toast.LENGTH_SHORT).show()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Chat wallpaper",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = if (chatId == null || chatId == 0L) "Default for all chats" else "For chat: $contactName",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            selectedWallpaper = "DEFAULT"
                            wallpaperDimming = 0.15f
                            Toast.makeText(context, "Reset to default wallpaper", Toast.LENGTH_SHORT).show()
                        }
                    ) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Reset")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            Surface(
                tonalElevation = 6.dp,
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (chatId != null && chatId != 0L) {
                            OutlinedButton(
                                onClick = {
                                    onSaveWallpaper(null, selectedWallpaper, wallpaperDimming)
                                    Toast.makeText(context, "Applied to all chats", Toast.LENGTH_SHORT).show()
                                    onBackClick()
                                },
                                shape = RoundedCornerShape(20.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("For All Chats", fontSize = 13.sp)
                            }
                        }

                        Button(
                            onClick = {
                                onSaveWallpaper(chatId, selectedWallpaper, wallpaperDimming)
                                Toast.makeText(context, "Wallpaper saved successfully", Toast.LENGTH_SHORT).show()
                                onBackClick()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Set Wallpaper", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // 1. Interactive Real-time Mockup Preview
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "LIVE PREVIEW",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    // Phone mockup container
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(230.dp),
                        shape = RoundedCornerShape(18.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
                    ) {
                        Box(modifier = Modifier.fillMaxSize()) {
                            // Render chosen wallpaper background
                            when {
                                selectedWallpaper.startsWith("content://") || selectedWallpaper.startsWith("file://") -> {
                                    AsyncImage(
                                        model = selectedWallpaper,
                                        contentDescription = "Custom Wallpaper",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                selectedWallpaper.startsWith("COLOR_") -> {
                                    val preset = solidColorPresets.firstOrNull { it.id == selectedWallpaper }
                                    val color = preset?.hexColor?.let { Color(android.graphics.Color.parseColor(it)) }
                                        ?: (if (isDarkMode) Color(0xFF0B141A) else Color(0xFFEFEAE2))
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(color)
                                    )
                                }
                                selectedWallpaper.startsWith("GRAD_") -> {
                                    val preset = gradientPresets.firstOrNull { it.id == selectedWallpaper }
                                    val colors = preset?.gradientColors ?: listOf(Color(0xFF0F2027), Color(0xFF2C5364))
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(Brush.verticalGradient(colors))
                                    )
                                }
                                else -> {
                                    // Default WhatsApp doodle pattern
                                    Image(
                                        painter = painterResource(id = R.drawable.img_chat_wallpaper_1787278101057),
                                        contentDescription = null,
                                        contentScale = ContentScale.Crop,
                                        alpha = 0.3f,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(if (isDarkMode) Color(0xFF0B141A).copy(alpha = 0.85f) else Color(0xFFEFEAE2).copy(alpha = 0.7f))
                                    )
                                }
                            }

                            // Wallpaper Dimming Overlay
                            if (wallpaperDimming > 0f) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(Color.Black.copy(alpha = wallpaperDimming))
                                )
                            }

                            // Realistic Chat Message Bubbles inside preview
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(14.dp),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                // Incoming message
                                Row(modifier = Modifier.fillMaxWidth()) {
                                    Card(
                                        shape = RoundedCornerShape(14.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = if (isDarkMode) Color(0xFF202C33) else Color.White
                                        ),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                                        modifier = Modifier.widthIn(max = 240.dp)
                                    ) {
                                        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)) {
                                            Text(
                                                text = "Hey! How does this wallpaper look?",
                                                fontSize = 13.sp,
                                                color = if (isDarkMode) Color.White else Color.Black
                                            )
                                            Text(
                                                text = "10:42 AM",
                                                fontSize = 10.sp,
                                                color = Color.Gray,
                                                modifier = Modifier.align(Alignment.End)
                                            )
                                        }
                                    }
                                }

                                // Outgoing message
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    Card(
                                        shape = RoundedCornerShape(14.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = if (isDarkMode) Color(0xFF005C4B) else Color(0xFFE7FFDB)
                                        ),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                                        modifier = Modifier.widthIn(max = 240.dp)
                                    ) {
                                        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)) {
                                            Text(
                                                text = "It looks crisp and elegant! ✨",
                                                fontSize = 13.sp,
                                                color = if (isDarkMode) Color.White else Color.Black
                                            )
                                            Row(
                                                modifier = Modifier.align(Alignment.End),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = "10:43 AM",
                                                    fontSize = 10.sp,
                                                    color = Color.Gray
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("✓✓", fontSize = 11.sp, color = WhatsAppMinimalPrimary)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 2. Wallpaper Dimming Slider
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Wallpaper Dimming",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${(wallpaperDimming * 100).toInt()}%",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = WhatsAppMinimalPrimary
                        )
                    }
                    Slider(
                        value = wallpaperDimming,
                        onValueChange = { wallpaperDimming = it },
                        valueRange = 0f..0.6f,
                        colors = SliderDefaults.colors(
                            thumbColor = WhatsAppMinimalPrimary,
                            activeTrackColor = WhatsAppMinimalPrimary
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
            }

            // 3. Category Selector Tabs
            item {
                TabRow(
                    selectedTabIndex = selectedCategoryTab,
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = WhatsAppMinimalPrimary
                ) {
                    Tab(
                        selected = selectedCategoryTab == 0,
                        onClick = { selectedCategoryTab = 0 },
                        text = { Text("Solid Colors", fontSize = 13.sp, fontWeight = FontWeight.SemiBold) },
                        icon = { Icon(imageVector = Icons.Default.ColorLens, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    )
                    Tab(
                        selected = selectedCategoryTab == 1,
                        onClick = { selectedCategoryTab = 1 },
                        text = { Text("Gradients", fontSize = 13.sp, fontWeight = FontWeight.SemiBold) },
                        icon = { Icon(imageVector = Icons.Default.FormatPaint, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    )
                    Tab(
                        selected = selectedCategoryTab == 2,
                        onClick = { selectedCategoryTab = 2 },
                        text = { Text("Photos & Custom", fontSize = 13.sp, fontWeight = FontWeight.SemiBold) },
                        icon = { Icon(imageVector = Icons.Default.Wallpaper, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    )
                }
                Spacer(modifier = Modifier.height(14.dp))
            }

            // 4. Tab Content
            when (selectedCategoryTab) {
                0 -> {
                    // Solid Colors Grid
                    item {
                        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                            Text(
                                text = "Select a Solid Pastel or Dark Shade:",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            val rows = solidColorPresets.chunked(2)
                            rows.forEach { rowPresets ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    rowPresets.forEach { preset ->
                                        val isSelected = selectedWallpaper == preset.id
                                        val color = preset.hexColor?.let { Color(android.graphics.Color.parseColor(it)) } ?: Color.White

                                        Surface(
                                            shape = RoundedCornerShape(14.dp),
                                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                            border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, WhatsAppMinimalPrimary) else null,
                                            modifier = Modifier
                                                .weight(1f)
                                                .clickable { selectedWallpaper = preset.id }
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(10.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(36.dp)
                                                        .clip(CircleShape)
                                                        .background(color)
                                                        .border(1.dp, Color.Gray.copy(alpha = 0.3f), CircleShape),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    if (isSelected) {
                                                        Icon(
                                                            imageVector = Icons.Default.Check,
                                                            contentDescription = null,
                                                            tint = if (preset.hexColor?.startsWith("#1") == true || preset.hexColor?.startsWith("#0") == true) Color.White else Color.Black,
                                                            modifier = Modifier.size(18.dp)
                                                        )
                                                    }
                                                }
                                                Spacer(modifier = Modifier.width(10.dp))
                                                Text(
                                                    text = preset.name,
                                                    fontSize = 13.sp,
                                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                                    color = MaterialTheme.colorScheme.onSurface
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                1 -> {
                    // Gradients Grid
                    item {
                        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                            Text(
                                text = "Select an Aesthetic Gradient:",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            val rows = gradientPresets.chunked(2)
                            rows.forEach { rowPresets ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    rowPresets.forEach { preset ->
                                        val isSelected = selectedWallpaper == preset.id
                                        val colors = preset.gradientColors ?: listOf(Color.DarkGray, Color.Black)

                                        Surface(
                                            shape = RoundedCornerShape(14.dp),
                                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                            border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, WhatsAppMinimalPrimary) else null,
                                            modifier = Modifier
                                                .weight(1f)
                                                .clickable { selectedWallpaper = preset.id }
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(10.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(36.dp)
                                                        .clip(CircleShape)
                                                        .background(Brush.linearGradient(colors)),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    if (isSelected) {
                                                        Icon(
                                                            imageVector = Icons.Default.Check,
                                                            contentDescription = null,
                                                            tint = Color.White,
                                                            modifier = Modifier.size(18.dp)
                                                        )
                                                    }
                                                }
                                                Spacer(modifier = Modifier.width(10.dp))
                                                Text(
                                                    text = preset.name,
                                                    fontSize = 13.sp,
                                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                                    color = MaterialTheme.colorScheme.onSurface
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                2 -> {
                    // Photos & Custom Gallery picker
                    item {
                        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                            // Default Doodle Option
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                border = if (selectedWallpaper == "DEFAULT") androidx.compose.foundation.BorderStroke(2.dp, WhatsAppMinimalPrimary) else null,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedWallpaper = "DEFAULT" }
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(46.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(WhatsAppEmerald),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(imageVector = Icons.Default.Wallpaper, contentDescription = null, tint = Color.White)
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("WhatsApp Official Doodle", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text("Standard illustration pattern", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                    if (selectedWallpaper == "DEFAULT") {
                                        Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = WhatsAppMinimalPrimary)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Pick from Photos / Gallery Card
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                border = if (selectedWallpaper.startsWith("content://") || selectedWallpaper.startsWith("file://")) androidx.compose.foundation.BorderStroke(2.dp, WhatsAppMinimalPrimary) else null,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        pickCustomImageLauncher.launch(
                                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                        )
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(46.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(WhatsAppMinimalAccent),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(imageVector = Icons.Default.AddPhotoAlternate, contentDescription = null, tint = Color.White)
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Choose from Gallery", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text("Select any personal photo as chat background", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                    Icon(imageVector = Icons.Default.Image, contentDescription = null, tint = WhatsAppMinimalPrimary)
                                }
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(30.dp))
            }
        }
    }
}
