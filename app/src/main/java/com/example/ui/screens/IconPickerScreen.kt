package com.example.ui.screens

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import android.widget.Toast
import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import com.example.R
import com.example.ui.components.VerifiedBadge

data class AppIconOption(
    val id: String,
    val name: String,
    val description: String,
    val primaryColor: Color,
    val secondaryColor: Color,
    val gradientColors: List<Color>,
    val componentAlias: String,
    val drawableResId: Int
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
    
    // Detect currently enabled icon
    var selectedIconId by remember {
        val savedId = prefs.getString("selected_app_icon_id", null)
        mutableStateOf(savedId ?: getCurrentlyEnabledIconId(context))
    }

    val iconOptions = remember {
        listOf(
            AppIconOption(
                id = "DEFAULT",
                name = "VIBEZ Chat Official",
                description = "Modern neon chat bubble emblem",
                primaryColor = Color(0xFF10B981),
                secondaryColor = Color(0xFF047857),
                gradientColors = listOf(Color(0xFF10B981), Color(0xFF047857)),
                componentAlias = "com.example.MainActivityAliasDefault",
                drawableResId = R.drawable.img_icon_vibez_chat_1788421904730
            ),
            AppIconOption(
                id = "GOLD",
                name = "VIBEZ Obsidian Gold",
                description = "Luxury 3D embossed audio wave emblem",
                primaryColor = Color(0xFFF59E0B),
                secondaryColor = Color(0xFF78350F),
                gradientColors = listOf(Color(0xFFF59E0B), Color(0xFF78350F)),
                componentAlias = "com.example.MainActivityAliasGold",
                drawableResId = R.drawable.img_icon_vibez_badge_1788421921971
            ),
            AppIconOption(
                id = "CYBER",
                name = "VIBEZ Cyber Hologram",
                description = "Holographic sphere & soundwave core",
                primaryColor = Color(0xFFEC4899),
                secondaryColor = Color(0xFF3B82F6),
                gradientColors = listOf(Color(0xFFEC4899), Color(0xFF3B82F6)),
                componentAlias = "com.example.MainActivityAliasCyber",
                drawableResId = R.drawable.img_icon_vibez_launcher_1788421937855
            ),
            AppIconOption(
                id = "EMERALD",
                name = "VIBEZ Emerald Matrix",
                description = "Dynamic matrix equalizer soundbars",
                primaryColor = Color(0xFF10B981),
                secondaryColor = Color(0xFF022C22),
                gradientColors = listOf(Color(0xFF10B981), Color(0xFF022C22)),
                componentAlias = "com.example.MainActivityAliasEmerald",
                drawableResId = R.drawable.img_icon_emerald_matrix_1788422251464
            ),
            AppIconOption(
                id = "SUNSET",
                name = "VIBEZ Sunset Pulse",
                description = "Tropical soundwave & sunrise gradient",
                primaryColor = Color(0xFFF43F5E),
                secondaryColor = Color(0xFF881337),
                gradientColors = listOf(Color(0xFFF43F5E), Color(0xFF881337)),
                componentAlias = "com.example.MainActivityAliasSunset",
                drawableResId = R.drawable.img_icon_sunset_pulse_1788422268827
            ),
            AppIconOption(
                id = "MIDNIGHT",
                name = "VIBEZ Sapphire Crystal",
                description = "Faceted 3D deep ocean crystal emblem",
                primaryColor = Color(0xFF06B6D4),
                secondaryColor = Color(0xFF1E3A8A),
                gradientColors = listOf(Color(0xFF06B6D4), Color(0xFF1E3A8A)),
                componentAlias = "com.example.MainActivityAliasMidnight",
                drawableResId = R.drawable.img_icon_midnight_sapphire_1788422287861
            ),
            AppIconOption(
                id = "SOLAR",
                name = "VIBEZ Solar Flare",
                description = "Explosive radiant plasma energy aura",
                primaryColor = Color(0xFFFACC15),
                secondaryColor = Color(0xFFEA580C),
                gradientColors = listOf(Color(0xFFFACC15), Color(0xFFEA580C)),
                componentAlias = "com.example.MainActivityAliasSolar",
                drawableResId = R.drawable.img_icon_solar_flare_1788422303822
            ),
            AppIconOption(
                id = "AMETHYST",
                name = "VIBEZ Royal Amethyst",
                description = "Mystical cosmic nebula jewel emblem",
                primaryColor = Color(0xFFA855F7),
                secondaryColor = Color(0xFF581C87),
                gradientColors = listOf(Color(0xFFA855F7), Color(0xFF581C87)),
                componentAlias = "com.example.MainActivityAliasAmethyst",
                drawableResId = R.drawable.img_icon_royal_amethyst_1788422319400
            ),
            AppIconOption(
                id = "TITANIUM",
                name = "VIBEZ Brushed Titanium",
                description = "Minimalist beveled metal monogram",
                primaryColor = Color(0xFFCBD5E1),
                secondaryColor = Color(0xFF334155),
                gradientColors = listOf(Color(0xFFCBD5E1), Color(0xFF334155)),
                componentAlias = "com.example.MainActivityAliasTitanium",
                drawableResId = R.drawable.img_icon_minimal_titanium_1788422338960
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
                    containerColor = if (isVerified) Color(0xFFECFDF5) else MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
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
                            imageVector = Icons.Filled.Palette,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "App Icon Customizer",
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
                            text = "Choose your favorite custom launcher icon to personalize your device home screen.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (isVerified) Color(0xFF047857) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            if (!isVerified) {
                OutlinedButton(
                    onClick = onGetBadgeClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Filled.Star, contentDescription = null, tint = Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Get Verified Badge for Profile",
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            Text(
                text = "SELECT APP ICON STYLE",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 4.dp)
            )

            // Display icons in a 4-in-a-row compact grid
            val iconChunks = remember(iconOptions) { iconOptions.chunked(4) }

            iconChunks.forEach { rowOptions ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    rowOptions.forEach { option ->
                        val isSelected = selectedIconId == option.id

                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .border(
                                    width = if (isSelected) 2.dp else 1.dp,
                                    color = if (isSelected) Color(0xFF10B981) else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f),
                                    shape = RoundedCornerShape(14.dp)
                                )
                                .background(
                                    if (isSelected) Color(0xFFECFDF5) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.25f)
                                )
                                .clickable {
                                    selectedIconId = option.id
                                    prefs.edit().putString("selected_app_icon_id", option.id).apply()

                                    val success = applyAppIcon(context, option.id)
                                    if (success) {
                                        Toast.makeText(context, "${option.name} applied! Launcher will refresh icon.", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Icon preference saved: ${option.name}", Toast.LENGTH_SHORT).show()
                                    }
                                }
                                .padding(vertical = 10.dp, horizontal = 4.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            // Icon Preview Box with Badge Overlay
                            Box(
                                modifier = Modifier
                                    .size(52.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Brush.linearGradient(option.gradientColors)),
                                contentAlignment = Alignment.Center
                            ) {
                                Image(
                                    painter = painterResource(id = option.drawableResId),
                                    contentDescription = option.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )

                                if (isSelected) {
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .offset(x = 2.dp, y = 2.dp)
                                            .size(18.dp)
                                            .clip(CircleShape)
                                            .background(Color.White),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.CheckCircle,
                                            contentDescription = "Selected",
                                            tint = Color(0xFF10B981),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }

                            // Short Label
                            val shortName = option.name.removePrefix("VIBEZ ").trim()
                            Text(
                                text = shortName,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                textAlign = TextAlign.Center,
                                color = if (isSelected) Color(0xFF065F46) else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    // Fill remaining slots in the 4-item row with empty space if needed
                    val emptySlots = 4 - rowOptions.size
                    for (i in 0 until emptySlots) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

private fun getCurrentlyEnabledIconId(context: Context): String {
    val pm = context.packageManager
    val pkg = context.packageName

    val aliasMap = mapOf(
        "GOLD" to "com.example.MainActivityAliasGold",
        "EMERALD" to "com.example.MainActivityAliasEmerald",
        "CYBER" to "com.example.MainActivityAliasCyber",
        "SUNSET" to "com.example.MainActivityAliasSunset",
        "MIDNIGHT" to "com.example.MainActivityAliasMidnight",
        "SOLAR" to "com.example.MainActivityAliasSolar",
        "AMETHYST" to "com.example.MainActivityAliasAmethyst",
        "TITANIUM" to "com.example.MainActivityAliasTitanium",
        "DEFAULT" to "com.example.MainActivityAliasDefault"
    )

    for ((id, alias) in aliasMap) {
        try {
            val state = pm.getComponentEnabledSetting(ComponentName(pkg, alias))
            if (state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                return id
            }
        } catch (e: Exception) {
            // Check next
        }
    }
    return "DEFAULT"
}

private fun applyAppIcon(context: Context, iconId: String): Boolean {
    val pm = context.packageManager
    val pkg = context.packageName
    // In Android with namespace com.example and applicationId com.aistudio.vibez.app,
    // components in AndroidManifest are registered with the java class name package "com.example.<Name>"
    // while the package parameter to ComponentName must be the applicationId (pkg).

    val targetAliasName = when (iconId) {
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

    val allAliasNames = listOf(
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

    var anySuccess = false

    // Step 1: Always keep MainActivity enabled (internal target activity)
    try {
        pm.setComponentEnabledSetting(
            ComponentName(pkg, "com.example.MainActivity"),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )
    } catch (e: Exception) {
        Log.w("IconCustomizer", "Failed to set MainActivity enabled", e)
    }

    // Step 2: Enable the target alias FIRST so launcher always has a valid launcher intent
    try {
        pm.setComponentEnabledSetting(
            ComponentName(pkg, targetAliasName),
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )
        anySuccess = true
        Log.d("IconCustomizer", "Successfully enabled alias: $targetAliasName in package: $pkg")
    } catch (e: Exception) {
        Log.w("IconCustomizer", "Error enabling target alias $targetAliasName with pkg $pkg", e)
        try {
            pm.setComponentEnabledSetting(
                ComponentName(context, targetAliasName),
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            anySuccess = true
        } catch (e2: Exception) {
            Log.e("IconCustomizer", "Fallback enable failed", e2)
        }
    }

    // Step 3: Disable all other aliases AFTER target is active
    allAliasNames.filter { it != targetAliasName }.forEach { aliasName ->
        try {
            pm.setComponentEnabledSetting(
                ComponentName(pkg, aliasName),
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )
        } catch (e: Exception) {
            try {
                pm.setComponentEnabledSetting(
                    ComponentName(context, aliasName),
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
                )
            } catch (ignored: Exception) {}
        }
    }

    return anySuccess
}

