package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.WhatsAppMinimalAccent
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import kotlinx.coroutines.delay

enum class AuthStep {
    PHONE_ENTRY,
    OTP_VERIFICATION,
    PROFILE_SETUP
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    onAuthSuccess: (phone: String, name: String) -> Unit
) {
    var step by remember { mutableStateOf(AuthStep.PHONE_ENTRY) }
    var selectedCountryCode by remember { mutableStateOf("+1 (US)") }
    var phoneNumber by remember { mutableStateOf("555-0198") }
    var otpCode by remember { mutableStateOf("") }
    var userName by remember { mutableStateOf("Alex Rivers") }
    var userAbout by remember { mutableStateOf("Hey there! I am using VIBEZ.") }
    var countryDropdownExpanded by remember { mutableStateOf(false) }

    val mockOtp = "123456"
    var otpTimer by remember { mutableIntStateOf(60) }
    var isTimerRunning by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(isTimerRunning) {
        if (isTimerRunning) {
            otpTimer = 60
            while (otpTimer > 0) {
                delay(1000)
                otpTimer--
            }
            isTimerRunning = false
        }
    }

    val countryCodes = listOf("+1 (US)", "+44 (UK)", "+91 (India)", "+49 (Germany)", "+81 (Japan)")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = when (step) {
                            AuthStep.PHONE_ENTRY -> "Enter phone number"
                            AuthStep.OTP_VERIFICATION -> "Verify phone number"
                            AuthStep.PROFILE_SETUP -> "Profile info"
                        },
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = WhatsAppMinimalPrimary
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                when (step) {
                    AuthStep.PHONE_ENTRY -> {
                        Text(
                            text = "VIBEZ will send an SMS message to verify your phone number. Enter your country code and phone number.",
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 24.dp)
                        )

                        // Country selector
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = selectedCountryCode,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Country / Region") },
                                trailingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = "Select country",
                                        modifier = Modifier.clickable { countryDropdownExpanded = true }
                                    )
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { countryDropdownExpanded = true },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = WhatsAppMinimalPrimary,
                                    unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                                )
                            )
                            DropdownMenu(
                                expanded = countryDropdownExpanded,
                                onDismissRequest = { countryDropdownExpanded = false }
                            ) {
                                countryCodes.forEach { code ->
                                    DropdownMenuItem(
                                        text = { Text(code) },
                                        onClick = {
                                            selectedCountryCode = code
                                            countryDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Phone Number Input
                        OutlinedTextField(
                            value = phoneNumber,
                            onValueChange = { phoneNumber = it },
                            label = { Text("Phone Number") },
                            leadingIcon = { Icon(imageVector = Icons.Default.Phone, contentDescription = "Phone") },
                            placeholder = { Text("555-0198") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = WhatsAppMinimalPrimary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                            )
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "Security",
                                tint = WhatsAppMinimalPrimary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Carrier SMS charges may apply",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    AuthStep.OTP_VERIFICATION -> {
                        Text(
                            text = "Waiting to automatically detect an SMS sent to $selectedCountryCode $phoneNumber.",
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Simulation Toast Banner for Easy Verification
                        Card(
                            colors = CardDefaults.cardColors(containerColor = WhatsAppMinimalNavPill),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Shield,
                                    contentDescription = "Verification",
                                    tint = WhatsAppMinimalPrimary
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Verification Code Sent!",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = WhatsAppMinimalPrimary
                                    )
                                    Text(
                                        text = "Your VIBEZ code is: $mockOtp",
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                TextButton(onClick = { otpCode = mockOtp }) {
                                    Text("Auto-fill", color = WhatsAppMinimalPrimary, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // OTP Code Input
                        OutlinedTextField(
                            value = otpCode,
                            onValueChange = { if (it.length <= 6) otpCode = it },
                            label = { Text("6-Digit OTP Code") },
                            placeholder = { Text("123456") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = WhatsAppMinimalPrimary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                            )
                        )

                        if (errorMessage != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = errorMessage!!, color = Color.Red, fontSize = 13.sp)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isTimerRunning) "Resend code in ${otpTimer}s" else "Didn't receive code?",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            if (!isTimerRunning) {
                                TextButton(onClick = { isTimerRunning = true }) {
                                    Text("Resend SMS", color = WhatsAppMinimalPrimary, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    AuthStep.PROFILE_SETUP -> {
                        Text(
                            text = "Please provide your name and an optional profile picture.",
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 24.dp)
                        )

                        Box(
                            modifier = Modifier
                                .size(90.dp)
                                .clip(CircleShape)
                                .background(WhatsAppMinimalNavPill),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile Photo",
                                tint = WhatsAppMinimalPrimary,
                                modifier = Modifier.size(50.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        OutlinedTextField(
                            value = userName,
                            onValueChange = { userName = it },
                            label = { Text("Type your name here") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = WhatsAppMinimalPrimary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                            )
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = userAbout,
                            onValueChange = { userAbout = it },
                            label = { Text("About Status") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = WhatsAppMinimalPrimary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                            )
                        )
                    }
                }
            }

            // Bottom Next / Verify Action Button
            Column(modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = {
                        when (step) {
                            AuthStep.PHONE_ENTRY -> {
                                if (phoneNumber.isNotBlank()) {
                                    step = AuthStep.OTP_VERIFICATION
                                    isTimerRunning = true
                                }
                            }
                            AuthStep.OTP_VERIFICATION -> {
                                if (otpCode == mockOtp || otpCode.length == 6) {
                                    errorMessage = null
                                    step = AuthStep.PROFILE_SETUP
                                } else {
                                    errorMessage = "Invalid verification code. Please enter $mockOtp."
                                }
                            }
                            AuthStep.PROFILE_SETUP -> {
                                if (userName.isNotBlank()) {
                                    onAuthSuccess("$selectedCountryCode $phoneNumber", userName.trim())
                                }
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(26.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalAccent)
                ) {
                    Text(
                        text = when (step) {
                            AuthStep.PHONE_ENTRY -> "Next"
                            AuthStep.OTP_VERIFICATION -> "Verify & Continue"
                            AuthStep.PROFILE_SETUP -> "Finish Setup"
                        },
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                if (step == AuthStep.OTP_VERIFICATION) {
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(
                        onClick = { step = AuthStep.PHONE_ENTRY },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Wrong phone number?", color = WhatsAppMinimalPrimary)
                    }
                }
            }
        }
    }
}
