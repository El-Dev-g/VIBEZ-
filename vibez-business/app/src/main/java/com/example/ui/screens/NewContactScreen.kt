package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import com.example.util.PhoneNumberValidator
import com.example.util.ValidationResult
import com.example.util.PhoneAuthPolicyManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewContactScreen(
    onBackClick: () -> Unit,
    onSaveContact: (name: String, phone: String, about: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var rawPhone by remember { mutableStateOf("") }
    var about by remember { mutableStateOf("Hey there! I am using VIBEZ.") }
    var selectedCountry by remember { mutableStateOf(PhoneAuthPolicyManager.getValidSelectedCountry(PhoneNumberValidator.COUNTRIES[0])) } // US
    var showCountrySheet by remember { mutableStateOf(false) }
    var countrySearchQuery by remember { mutableStateOf("") }

    val validationResult by remember(selectedCountry, rawPhone) {
        derivedStateOf {
            PhoneNumberValidator.validate(selectedCountry, rawPhone)
        }
    }

    val isPhoneValid by remember(validationResult) {
        derivedStateOf { validationResult is ValidationResult.Valid }
    }

    val finalE164Phone by remember(validationResult, selectedCountry, rawPhone) {
        derivedStateOf {
            when (val res = validationResult) {
                is ValidationResult.Valid -> res.formattedE164
                else -> "${selectedCountry.dialCode}${PhoneNumberValidator.cleanDigits(rawPhone)}"
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = "New contact", fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick, modifier = Modifier.testTag("new_contact_back_btn")) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        enabled = name.isNotBlank() && isPhoneValid,
                        onClick = { onSaveContact(name.trim(), finalE164Phone, about.trim()) },
                        modifier = Modifier.testTag("new_contact_save_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Save",
                            tint = if (name.isNotBlank() && isPhoneValid) WhatsAppEmerald else Color.Gray
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Name Field
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("First name & Last name") },
                leadingIcon = { Icon(imageVector = Icons.Default.Person, contentDescription = "Name") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("new_contact_name_input"),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Country Selector Button
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { showCountrySheet = true }
                    .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(12.dp)),
                color = MaterialTheme.colorScheme.surface
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = selectedCountry.flag, fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = selectedCountry.name, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = selectedCountry.dialCode, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = WhatsAppEmerald)
                        Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Phone input with real-time validation indicator
            OutlinedTextField(
                value = rawPhone,
                onValueChange = { input ->
                    rawPhone = input.filter { it.isDigit() || it == '-' || it == ' ' || it == '(' || it == ')' }
                },
                label = { Text("Phone number") },
                placeholder = { Text(selectedCountry.exampleFormat) },
                leadingIcon = { Icon(imageVector = Icons.Default.Phone, contentDescription = "Phone") },
                trailingIcon = {
                    if (isPhoneValid) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Valid",
                            tint = WhatsAppEmerald
                        )
                    } else if (rawPhone.isNotEmpty()) {
                        Icon(
                            imageVector = Icons.Default.ErrorOutline,
                            contentDescription = "Invalid",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Phone,
                    imeAction = ImeAction.Next
                ),
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("new_contact_phone_input"),
                shape = RoundedCornerShape(12.dp)
            )

            // Validation Helper Text
            Spacer(modifier = Modifier.height(6.dp))
            when (val res = validationResult) {
                is ValidationResult.Valid -> {
                    Text(
                        text = "Validated: ${res.formattedDisplay} (${res.formattedE164})",
                        color = WhatsAppEmerald,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(start = 4.dp)
                    )
                }
                is ValidationResult.Invalid -> {
                    if (rawPhone.isNotEmpty()) {
                        Text(
                            text = res.errorMessage,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(start = 4.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // About Field
            OutlinedTextField(
                value = about,
                onValueChange = { about = it },
                label = { Text("About status") },
                leadingIcon = { Icon(imageVector = Icons.Default.Edit, contentDescription = "About") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("new_contact_about_input"),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(28.dp))

            Button(
                onClick = { onSaveContact(name.trim(), finalE164Phone, about.trim()) },
                enabled = name.isNotBlank() && isPhoneValid,
                colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("new_contact_submit_btn")
            ) {
                Text(text = "Save Contact", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }

    // Country selection modal bottom sheet
    if (showCountrySheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val filteredCountries = remember(countrySearchQuery) {
            val enabled = PhoneAuthPolicyManager.getEnabledCountries()
            if (countrySearchQuery.isBlank()) enabled
            else enabled.filter {
                it.name.contains(countrySearchQuery, ignoreCase = true) ||
                        it.dialCode.contains(countrySearchQuery) ||
                        it.code.contains(countrySearchQuery, ignoreCase = true)
            }
        }

        ModalBottomSheet(
            onDismissRequest = {
                showCountrySheet = false
                countrySearchQuery = ""
            },
            sheetState = sheetState,
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 32.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Choose a country",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = { showCountrySheet = false }) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = countrySearchQuery,
                    onValueChange = { countrySearchQuery = it },
                    placeholder = { Text("Search country") },
                    leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = "Search") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(modifier = Modifier.height(340.dp)) {
                    items(filteredCountries) { country ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedCountry = country
                                    showCountrySheet = false
                                    countrySearchQuery = ""
                                }
                                .padding(vertical = 12.dp, horizontal = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = country.flag, fontSize = 22.sp)
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(text = country.name, fontSize = 15.sp)
                            }
                            Text(text = country.dialCode, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = WhatsAppEmerald)
                        }
                        HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                    }
                }
            }
        }
    }
}
