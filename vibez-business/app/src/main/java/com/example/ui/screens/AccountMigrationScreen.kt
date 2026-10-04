package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountMigrationScreen(
    currentPhoneNumber: String,
    currentName: String,
    onBackClick: () -> Unit,
    onMigrationSuccess: () -> Unit,
    onPerformMigration: suspend (
        businessName: String,
        category: String,
        description: String,
        address: String,
        hours: String,
        website: String,
        email: String
    ) -> Boolean
) {
    val coroutineScope = rememberCoroutineScope()
    var step by remember { mutableIntStateOf(1) } // 1: Info/Warning, 2: Setup Business Details, 3: Migration Progress
    
    var businessName by remember { mutableStateOf(if (currentName.isNotBlank()) "$currentName Store" else "My Business") }
    var category by remember { mutableStateOf("Shopping & Retail") }
    var description by remember { mutableStateOf("Welcome to our official business store on Vibez!") }
    var address by remember { mutableStateOf("") }
    var businessHours by remember { mutableStateOf("Mon - Fri: 9:00 AM - 6:00 PM") }
    var website by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }

    var isCategoryExpanded by remember { mutableStateOf(false) }
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
        "Non-Profit & Organization",
        "Other"
    )

    var migrationStage by remember { mutableStateOf("Initializing transfer...") }
    var migrationProgress by remember { mutableFloatStateOf(0.1f) }
    var migrationError by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (step == 3) "Migrating Account" else "Switch to Vibez Business",
                        fontWeight = FontWeight.Bold,
                        fontSize = 19.sp
                    )
                },
                navigationIcon = {
                    if (step != 3) {
                        IconButton(onClick = onBackClick, modifier = Modifier.testTag("migration_back_btn")) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (step) {
                1 -> {
                    // Step 1: Migration Notice & Value Prop
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Box(
                            modifier = Modifier
                                .size(96.dp)
                                .clip(CircleShape)
                                .background(WhatsAppMinimalPrimary.copy(alpha = 0.12f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Business,
                                contentDescription = null,
                                tint = WhatsAppMinimalPrimary,
                                modifier = Modifier.size(54.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "Upgrade to Vibez Business",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Use phone number $currentPhoneNumber as your professional business account.",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(32.dp))

                        // Migration Highlights Cards
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                MigrationFeatureItem(
                                    icon = Icons.Default.SwapHoriz,
                                    title = "Full Chat & Media Migration",
                                    subtitle = "All your personal chats, photos, videos, and groups will be safely transferred to Vibez Business."
                                )
                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                                MigrationFeatureItem(
                                    icon = Icons.Default.Storefront,
                                    title = "Professional Storefront",
                                    subtitle = "Unlock product catalogs, operating hours, quick replies, and customer chat labels."
                                )
                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                                MigrationFeatureItem(
                                    icon = Icons.Default.Lock,
                                    title = "Single Account Security",
                                    subtitle = "Your consumer account on this number will be upgraded so customer inquiries are routed cleanly."
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(32.dp))

                        Button(
                            onClick = { step = 2 },
                            colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("continue_to_setup_btn")
                        ) {
                            Text("Agree & Continue", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                        }
                    }
                }

                2 -> {
                    // Step 2: Configure Business Storefront Details
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState())
                    ) {
                        Text(
                            text = "Set up your business profile",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Customers will see these details on your official profile page.",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        OutlinedTextField(
                            value = businessName,
                            onValueChange = { businessName = it },
                            label = { Text("Business Name *") },
                            leadingIcon = { Icon(Icons.Default.Storefront, contentDescription = null) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("migration_input_name")
                        )

                        // Category Picker
                        ExposedDropdownMenuBox(
                            expanded = isCategoryExpanded,
                            onExpandedChange = { isCategoryExpanded = !isCategoryExpanded },
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                        ) {
                            OutlinedTextField(
                                value = category,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Business Category *") },
                                leadingIcon = { Icon(Icons.Default.Category, contentDescription = null) },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isCategoryExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth().testTag("migration_input_category")
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
                            label = { Text("Business Description") },
                            leadingIcon = { Icon(Icons.Default.Info, contentDescription = null) },
                            maxLines = 3,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("migration_input_desc")
                        )

                        OutlinedTextField(
                            value = businessHours,
                            onValueChange = { businessHours = it },
                            label = { Text("Operating Hours") },
                            leadingIcon = { Icon(Icons.Default.Schedule, contentDescription = null) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("migration_input_hours")
                        )

                        OutlinedTextField(
                            value = address,
                            onValueChange = { address = it },
                            label = { Text("Physical Address (Optional)") },
                            leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("migration_input_address")
                        )

                        OutlinedTextField(
                            value = website,
                            onValueChange = { website = it },
                            label = { Text("Official Website (Optional)") },
                            leadingIcon = { Icon(Icons.Default.Language, contentDescription = null) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("migration_input_website")
                        )

                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text("Business Email (Optional)") },
                            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp).testTag("migration_input_email")
                        )

                        Button(
                            onClick = {
                                step = 3
                                coroutineScope.launch {
                                    migrationStage = "Backing up local chat database..."
                                    migrationProgress = 0.25f
                                    delay(600)
                                    migrationStage = "Transferring messages & media to Vibez Business..."
                                    migrationProgress = 0.55f
                                    delay(700)
                                    migrationStage = "Registering business storefront on server..."
                                    migrationProgress = 0.85f
                                    
                                    val success = onPerformMigration(
                                        businessName,
                                        category,
                                        description,
                                        address,
                                        businessHours,
                                        website,
                                        email
                                    )
                                    if (success) {
                                        migrationProgress = 1.0f
                                        migrationStage = "Migration complete! Launching business suite..."
                                        delay(800)
                                        onMigrationSuccess()
                                    } else {
                                        migrationError = "Failed to complete account migration. Please check your network connection and try again."
                                    }
                                }
                            },
                            enabled = businessName.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("start_migration_btn")
                        ) {
                            Text("Start Chat & Account Migration", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                        }
                    }
                }

                3 -> {
                    // Step 3: Migration Progress Animation
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(100.dp)
                                .clip(CircleShape)
                                .background(WhatsAppEmerald.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (migrationProgress >= 1f) Icons.Default.CheckCircle else Icons.Default.Sync,
                                contentDescription = null,
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(54.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(28.dp))
                        Text(
                            text = if (migrationProgress >= 1f) "Welcome to Vibez Business!" else "Migrating your chats...",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = migrationStage,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(24.dp))
                        LinearProgressIndicator(
                            progress = { migrationProgress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = WhatsAppEmerald,
                            trackColor = MaterialTheme.colorScheme.surfaceVariant
                        )

                        if (migrationError != null) {
                            Spacer(modifier = Modifier.height(20.dp))
                            Text(
                                text = migrationError ?: "",
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 14.sp,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { step = 2; migrationError = null },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                            ) {
                                Text("Retry Migration")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MigrationFeatureItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String
) {
    Row(verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(WhatsAppMinimalPrimary.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = WhatsAppMinimalPrimary, modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.width(14.dp))
        Column {
            Text(text = title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurface)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = subtitle, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
