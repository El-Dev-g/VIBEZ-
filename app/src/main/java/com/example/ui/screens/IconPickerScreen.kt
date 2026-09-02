package com.example.ui.screens

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.VerifiedBadge

data class AppIconOption(
    val id: String,
    val name: String,
    val description: String,
    val primaryColor: Color,
    val secondaryColor: Color,
    val gradientColors: List<Color>,
    val componentAlias: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IconPickerScreen(
    isVerified: Boolean,
    onBack: () -> Unit,
    onGetBadgeClick: () -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("vibez_app_settings", Context.MODE_PRIVATE) }
    var selectedIconId by remember { mutableStateOf(prefs.getString("selected_app_icon_id", "DEFAULT") ?: "DEFAULT") }

    val iconOptions = remember {
        listOf(
            AppIconOption(
                id = "DEFAULT",
                name = "VIBEZ Classic",
                description = "Dark Violet & Obsidian (Original)",
                primaryColor = Color(0xFF2D005D),
                secondaryColor = Color(0xFF1A1A1A),
                gradientColors = listOf(Color(0xFF2D005D), Color(0xFF1A1A1A)),
                componentAlias = "com.example.MainActivityAliasDefault"
            ),
            AppIconOption(
                id = "GOLD",
                name = "Obsidian Gold Pro",
                description = "Luxury Amber & Warm Gold Gradient",
                primaryColor = Color(0xFFF59E0B),
                secondaryColor = Color(0xFF78350F),
                gradientColors = listOf(Color(0xFFF59E0B), Color(0xFF78350F)),
                componentAlias = "com.example.MainActivityAliasGold"
            ),
            AppIconOption(
                id = "EMERALD",
                name = "Emerald Neon Glow",
                description = "Vibrant Cyber Green & Mint",
                primaryColor = Color(0xFF10B981),
                secondaryColor = Color(0xFF022C22),
                gradientColors = listOf(Color(0xFF10B981), Color(0xFF022C22)),
                componentAlias = "com.example.MainActivityAliasEmerald"
            ),
            AppIconOption(
                id = "CYBER",
                name = "Cyberpunk Magenta",
                description = "Neon Pink & Electric Blue",
                primaryColor = Color(0xFFEC4899),
                secondaryColor = Color(0xFF3B82F6),
                gradientColors = listOf(Color(0xFFEC4899), Color(0xFF3B82F6)),
                componentAlias = "com.example.MainActivityAliasCyber"
            ),
            AppIconOption(
                id = "SUNSET",
                name = "Sunset Coral Pro",
                description = "Warm Rose Coral & Deep Crimson",
                primaryColor = Color(0xFFF43F5E),
                secondaryColor = Color(0xFF881337),
                gradientColors = listOf(Color(0xFFF43F5E), Color(0xFF881337)),
                componentAlias = "com.example.MainActivityAliasSunset"
            ),
            AppIconOption(
                id = "MIDNIGHT",
                name = "Midnight Sapphire Pro",
                description = "Deep Oceanic Blue & Electric Cyan",
                primaryColor = Color(0xFF06B6D4),
                secondaryColor = Color(0xFF1E3A8A),
                gradientColors = listOf(Color(0xFF06B6D4), Color(0xFF1E3A8A)),
                componentAlias = "com.example.MainActivityAliasMidnight"
            ),
            AppIconOption(
                id = "SOLAR",
                name = "Solar Flare Neon Pro",
                description = "Electric Yellow & Radiant Orange",
                primaryColor = Color(0xFFFACC15),
                secondaryColor = Color(0xFFEA580C),
                gradientColors = listOf(Color(0xFFFACC15), Color(0xFFEA580C)),
                componentAlias = "com.example.MainActivityAliasSolar"
            ),
            AppIconOption(
                id = "AMETHYST",
                name = "Royal Amethyst Pro",
                description = "Imperial Purple & Velvet Violet",
                primaryColor = Color(0xFFA855F7),
                secondaryColor = Color(0xFF581C87),
                gradientColors = listOf(Color(0xFFA855F7), Color(0xFF581C87)),
                componentAlias = "com.example.MainActivityAliasAmethyst"
            ),
            AppIconOption(
                id = "TITANIUM",
                name = "Minimal Titanium Pro",
                description = "Platinum Silver & Dark Slate",
                primaryColor = Color(0xFFCBD5E1),
                secondaryColor = Color(0xFF334155),
                gradientColors = listOf(Color(0xFFCBD5E1), Color(0xFF334155)),
                componentAlias = "com.example.MainActivityAliasTitanium"
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("App Icon Customizer", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.surface)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Info Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isVerified) Color(0xFFECFDF5) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                )
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(if (isVerified) Color(0xFF10B981) else MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isVerified) Icons.Filled.Palette else Icons.Filled.Lock,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Pro Icon Customizer",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium,
                                color = if (isVerified) Color(0xFF065F46) else MaterialTheme.colorScheme.onSurface
                            )
                            if (isVerified) {
                                Spacer(modifier = Modifier.width(4.dp))
                                VerifiedBadge(size = 18.dp)
                            }
                        }
                        Text(
                            text = if (isVerified)
                                "Subscribers can switch home screen icons anytime."
                            else
                                "Exclusive feature for Green Verification Badge subscribers.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (isVerified) Color(0xFF047857) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            if (!isVerified) {
                Button(
                    onClick = onGetBadgeClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Filled.Star, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Get Verified Badge to Unlock Icons",
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            Text(
                text = "SELECT APP ICON STYLE",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 8.dp)
            )

            iconOptions.forEach { option ->
                val isSelected = selectedIconId == option.id

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .border(
                            width = if (isSelected) 2.dp else 1.dp,
                            color = if (isSelected) Color(0xFF10B981) else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f),
                            shape = RoundedCornerShape(20.dp)
                        )
                        .clickable {
                            if (!isVerified && option.id != "DEFAULT") {
                                Toast.makeText(context, "Subscribe to Verified Badge to unlock ${option.name}!", Toast.LENGTH_SHORT).show()
                                onGetBadgeClick()
                                return@clickable
                            }

                            selectedIconId = option.id
                            prefs.edit().putString("selected_app_icon_id", option.id).apply()

                            try {
                                applyAppIcon(context, option.id)
                                Toast.makeText(context, "Icon updated to ${option.name}!", Toast.LENGTH_SHORT).show()
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        },
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) Color(0xFFECFDF5) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Icon Preview Box
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Brush.linearGradient(option.gradientColors)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "V",
                                color = Color.White,
                                fontWeight = FontWeight.Black,
                                fontSize = 24.sp
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = option.name,
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleSmall
                            )
                            Text(
                                text = option.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        if (isSelected) {
                            Icon(
                                imageVector = Icons.Filled.CheckCircle,
                                contentDescription = "Selected",
                                tint = Color(0xFF10B981),
                                modifier = Modifier.size(28.dp)
                            )
                        } else if (!isVerified) {
                            Icon(
                                imageVector = Icons.Filled.Lock,
                                contentDescription = "Locked",
                                tint = MaterialTheme.colorScheme.outline,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun applyAppIcon(context: Context, iconId: String) {
    val pm = context.packageManager
    val pkg = context.packageName

    val targetAlias = when (iconId) {
        "GOLD" -> "com.example.MainActivityAliasGold"
        "EMERALD" -> "com.example.MainActivityAliasEmerald"
        "CYBER" -> "com.example.MainActivityAliasCyber"
        "SUNSET" -> "com.example.MainActivityAliasSunset"
        "MIDNIGHT" -> "com.example.MainActivityAliasMidnight"
        "SOLAR" -> "com.example.MainActivityAliasSolar"
        "AMETHYST" -> "com.example.MainActivityAliasAmethyst"
        "TITANIUM" -> "com.example.MainActivityAliasTitanium"
        else -> "com.example.MainActivityAliasDefault"
    }

    val allAliases = listOf(
        "com.example.MainActivityAliasDefault",
        "com.example.MainActivityAliasGold",
        "com.example.MainActivityAliasEmerald",
        "com.example.MainActivityAliasCyber",
        "com.example.MainActivityAliasSunset",
        "com.example.MainActivityAliasMidnight",
        "com.example.MainActivityAliasSolar",
        "com.example.MainActivityAliasAmethyst",
        "com.example.MainActivityAliasTitanium"
    )

    // Keep the target MainActivity class enabled at all times
    try {
        pm.setComponentEnabledSetting(
            ComponentName(pkg, "com.example.MainActivity"),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )
    } catch (e: Exception) {
        e.printStackTrace()
    }

    allAliases.forEach { alias ->
        val newState = if (alias == targetAlias) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        }
        try {
            pm.setComponentEnabledSetting(
                ComponentName(pkg, alias),
                newState,
                PackageManager.DONT_KILL_APP
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
