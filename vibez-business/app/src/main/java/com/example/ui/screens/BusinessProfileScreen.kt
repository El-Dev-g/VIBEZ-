package com.example.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BusinessProfileScreen(
    onBackClick: () -> Unit,
    initialName: String = "Vibez Official Store",
    initialCategory: String = "Shopping & Retail",
    initialDescription: String = "Welcome to our store! We provide high quality products with fast delivery.",
    initialAddress: String = "742 Evergreen Terrace, Suite 100",
    initialHours: String = "Mon - Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM",
    initialWebsite: String = "https://vibez.app/business",
    initialEmail: String = "sales@vibez.app",
    onSaveProfile: (name: String, cat: String, desc: String, addr: String, hrs: String, web: String, mail: String) -> Unit = { _, _, _, _, _, _, _ -> }
) {
    var businessName by remember { mutableStateOf(initialName) }
    var category by remember { mutableStateOf(initialCategory) }
    var description by remember { mutableStateOf(initialDescription) }
    var address by remember { mutableStateOf(initialAddress) }
    var hours by remember { mutableStateOf(initialHours) }
    var website by remember { mutableStateOf(initialWebsite) }
    var email by remember { mutableStateOf(initialEmail) }
    var isSavedSnackbar by remember { mutableStateOf(false) }

    val categories = listOf(
        "Shopping & Retail",
        "Restaurant & Food",
        "Professional Services",
        "Health & Beauty",
        "Education & Training",
        "Entertainment",
        "Automotive",
        "Finance & Insurance"
    )
    var isCategoryExpanded by remember { mutableStateOf(false) }

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
                            onSaveProfile(businessName, category, description, address, hours, website, email)
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
                .padding(16.dp)
        ) {
            // Header Profile Preview
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(WhatsAppMinimalPrimary),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Home,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(38.dp)
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = businessName.ifBlank { "My Business" },
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Verified Business",
                            tint = WhatsAppEmerald,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Text(
                        text = category,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Input Fields
            OutlinedTextField(
                value = businessName,
                onValueChange = { businessName = it },
                label = { Text("Business name") },
                leadingIcon = { Icon(Icons.Default.Home, contentDescription = null) },
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
                    leadingIcon = { Icon(Icons.Default.List, contentDescription = null) },
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

            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                label = { Text("Business address") },
                leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("input_business_address")
            )

            OutlinedTextField(
                value = hours,
                onValueChange = { hours = it },
                label = { Text("Business hours") },
                leadingIcon = { Icon(Icons.Default.Notifications, contentDescription = null) },
                minLines = 2,
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("input_business_hours")
            )

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email address") },
                leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).testTag("input_business_email")
            )

            OutlinedTextField(
                value = website,
                onValueChange = { website = it },
                label = { Text("Website") },
                leadingIcon = { Icon(Icons.Default.Share, contentDescription = null) },
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp).testTag("input_business_website")
            )

            Button(
                onClick = {
                    onSaveProfile(businessName, category, description, address, hours, website, email)
                    isSavedSnackbar = true
                },
                modifier = Modifier.fillMaxWidth().height(48.dp).testTag("submit_save_profile_button"),
                colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
            ) {
                Icon(Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Save Changes", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
