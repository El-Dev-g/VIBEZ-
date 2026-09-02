package com.example.ui.screens

import android.app.Activity
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import com.example.util.PhoneNumberValidator
import com.example.util.ValidationResult
import com.example.util.CountryValidationRule
import com.example.util.PhoneAuthPolicyManager
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialCustomException
import androidx.credentials.exceptions.GetCredentialException
import com.example.BuildConfig
import com.example.R
import com.example.ui.theme.WhatsAppEmerald
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    onAuthSuccess: (phone: String, name: String, about: String, firebaseIdToken: String?, onComplete: (Boolean, String?) -> Unit) -> Unit,
    onGoogleAuthSuccess: ((email: String, name: String, avatarUrl: String?, phone: String?, idToken: String?, onComplete: (Boolean, String?) -> Unit) -> Unit)? = null,
    onNavigateToPhoneIdentity: ((email: String, name: String, avatarUrl: String?, idToken: String?) -> Unit)? = null
) {
    val isDemoMode = false // Set to true ONLY for internal testing/preview
    
    var activeTab by remember { mutableIntStateOf(1) } // 1 = Firebase Phone Auth (Default), 0 = Google Sign-In
    val policyVersion by PhoneAuthPolicyManager.policyVersion.collectAsState()
    
    // Country Selector State
    var selectedCountry by remember {
        mutableStateOf(
            PhoneAuthPolicyManager.getValidSelectedCountry(
                PhoneNumberValidator.COUNTRIES.firstOrNull { it.code == "GH" }
                    ?: PhoneNumberValidator.COUNTRIES.first()
            )
        )
    }
    var showCountrySheet by remember { mutableStateOf(false) }
    var countrySearchQuery by remember { mutableStateOf("") }

    val context = LocalContext.current

    LaunchedEffect(Unit) {
        PhoneAuthPolicyManager.syncWithBackend(context)
    }

    LaunchedEffect(policyVersion) {
        if (!PhoneAuthPolicyManager.isCountryEnabled(selectedCountry.code)) {
            selectedCountry = PhoneAuthPolicyManager.getValidSelectedCountry(selectedCountry)
        }
    }

    // Phone Auth Form States
    var phoneName by remember { mutableStateOf("") }
    var phoneNumber by remember { mutableStateOf("") }
    var verificationCode by remember { mutableStateOf("") }

    val validationResult by remember(selectedCountry, phoneNumber) {
        derivedStateOf {
            PhoneNumberValidator.validate(selectedCountry, phoneNumber)
        }
    }

    val isPhoneValid by remember(validationResult) {
        derivedStateOf { validationResult is ValidationResult.Valid }
    }

    val fullE164Phone by remember(validationResult, selectedCountry, phoneNumber) {
        derivedStateOf {
            when (val res = validationResult) {
                is ValidationResult.Valid -> res.formattedE164
                else -> "${selectedCountry.dialCode}${PhoneNumberValidator.cleanDigits(phoneNumber)}"
            }
        }
    }
    
    // Phone OTP Flow State: 0 = Input Phone & Name, 1 = Enter SMS OTP
    var phoneAuthStep by remember { mutableIntStateOf(0) }
    var verificationIdState by remember { mutableStateOf("") }
    var resendTokenState by remember { mutableStateOf<PhoneAuthProvider.ForceResendingToken?>(null) }
    var resendCountdown by remember { mutableIntStateOf(60) }
    
    var isSigningIn by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var statusNotice by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val credentialManager = remember { CredentialManager.create(context) }
    val firebaseAuth = remember { 
        try { 
            FirebaseAuth.getInstance() 
        } catch (e: Exception) { 
            null 
        } 
    }

    // Countdown for OTP resend
    LaunchedEffect(phoneAuthStep, resendCountdown) {
        if (phoneAuthStep == 1 && resendCountdown > 0) {
            delay(1000)
            resendCountdown -= 1
        }
    }

    fun completePhoneAuthWithCredential(credential: PhoneAuthCredential) {
        isSigningIn = true
        val auth = firebaseAuth
        if (auth == null) {
            isSigningIn = false
            errorMessage = "Firebase Authentication is unavailable on this device."
            return
        }

        auth.signInWithCredential(credential)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val user = auth.currentUser
                    user?.getIdToken(false)?.addOnCompleteListener { tokenTask ->
                        val idToken = if (tokenTask.isSuccessful) tokenTask.result.token else null
                        val finalPhone = user?.phoneNumber?.ifBlank { fullE164Phone.trim() } ?: fullE164Phone.trim()
                        val finalName = phoneName.trim()
                        onAuthSuccess(finalPhone, finalName, "Hey there! I am using VIBEZ.", idToken) { success, errorMsg ->
                            isSigningIn = false
                            if (!success) {
                                errorMessage = errorMsg ?: "Backend authentication failed."
                            }
                        }
                    } ?: run {
                        isSigningIn = false
                        errorMessage = "Could not retrieve Firebase authentication token."
                    }
                } else {
                    isSigningIn = false
                    val exc = task.exception
                    errorMessage = "Phone verification failed: ${exc?.localizedMessage ?: "Invalid verification code"}"
                }
            }
    }

    fun startFirebasePhoneVerification(isResend: Boolean = false) {
        val cleanPhone = fullE164Phone.trim()
        if (cleanPhone.isBlank() || !isPhoneValid) {
            errorMessage = when (val res = validationResult) {
                is ValidationResult.Invalid -> res.errorMessage
                else -> "Please enter a valid phone number"
            }
            return
        }

        isSigningIn = true
        errorMessage = null
        statusNotice = null

        val auth = firebaseAuth
        val activity = context as? Activity

        if (auth == null || activity == null) {
            isSigningIn = false
            errorMessage = "Firebase initialization failed. Please check your configuration."
            return
        }

        val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                // Instant verification or auto-retrieval
                isSigningIn = false
                completePhoneAuthWithCredential(credential)
            }

            override fun onVerificationFailed(e: FirebaseException) {
                isSigningIn = false
                e.printStackTrace()
                
                val msg = e.message ?: ""
                val specificError = when {
                    msg.contains("-14") || msg.contains("Integrity API") -> 
                        "Google Play Integrity failed because your Play Store is outdated. Please update the Google Play Store to the latest version."
                    msg.contains("INVALID_CERT_HASH") || msg.contains("certificate hash") -> 
                        "Security mismatch: The app's certificate hash doesn't match Firebase settings. Please register the current SHA fingerprint in Firebase Console."
                    msg.contains("reCAPTCHA") -> 
                        "App verification failed (reCAPTCHA). Ensure reCAPTCHA Enterprise is enabled in Firebase Console."
                    else -> "Firebase SMS verification: ${e.message ?: "Failed to send SMS code."}"
                }
                
                errorMessage = specificError
            }

            override fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken) {
                isSigningIn = false
                verificationIdState = verificationId
                resendTokenState = token
                resendCountdown = 60
                phoneAuthStep = 1
                statusNotice = "A 6-digit security code was sent via SMS to $cleanPhone"
            }
        }

        try {
            val optionsBuilder = PhoneAuthOptions.newBuilder(auth)
                .setPhoneNumber(cleanPhone)
                .setTimeout(60L, TimeUnit.SECONDS)
                .setActivity(activity)
                .setCallbacks(callbacks)

            if (isResend && resendTokenState != null) {
                optionsBuilder.setForceResendingToken(resendTokenState!!)
            }

            PhoneAuthProvider.verifyPhoneNumber(optionsBuilder.build())
        } catch (e: Exception) {
            isSigningIn = false
            e.printStackTrace()
            errorMessage = "Verification request failed: ${e.message}"
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Centered App Brand Icon Circle
                Surface(
                    modifier = Modifier
                        .size(80.dp)
                        .shadow(elevation = 6.dp, shape = CircleShape, ambientColor = Color.Black.copy(alpha = 0.1f))
                        .clip(CircleShape)
                        .border(1.dp, Color(0xFFE8EAED), CircleShape),
                    color = Color.White
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        if (activeTab == 0) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_google_logo),
                                contentDescription = "Google",
                                tint = Color.Unspecified,
                                modifier = Modifier.size(44.dp)
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = "Phone Auth",
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(40.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // App Name
                Text(
                    text = "VIBEZ",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                    letterSpacing = 1.sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Clean Subtitle
                Text(
                    text = if (activeTab == 0) "Sign in with Google to continue" else "Phone Number Authentication",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(22.dp))

                // Custom Segmented Tabs Selector
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (activeTab == 1) WhatsAppEmerald else Color.Transparent)
                            .clickable {
                                activeTab = 1
                                errorMessage = null
                            }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = null,
                                tint = if (activeTab == 1) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Phone Number",
                                color = if (activeTab == 1) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (activeTab == 0) WhatsAppEmerald else Color.Transparent)
                            .clickable {
                                activeTab = 0
                                errorMessage = null
                            }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Google Account",
                            color = if (activeTab == 0) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                if (activeTab == 1) {
                    // FIREBASE PHONE NUMBER AUTHENTICATION FLOW
                    if (phoneAuthStep == 0) {
                        // Step 0: Phone Number Input and Country Selection
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Country Selection Dropdown Trigger
                            Surface(
                                onClick = { showCountrySheet = true },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(56.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(14.dp)),
                                color = MaterialTheme.colorScheme.surface
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(text = selectedCountry.flag, fontSize = 20.sp)
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Text(
                                            text = selectedCountry.name,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = selectedCountry.dialCode,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = WhatsAppEmerald
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Icon(
                                            imageVector = Icons.Default.ArrowDropDown,
                                            contentDescription = "Select Country",
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Phone Number Input Field
                            OutlinedTextField(
                                value = phoneNumber,
                                onValueChange = {
                                    phoneNumber = it
                                    errorMessage = null
                                },
                                label = { Text("Phone Number") },
                                placeholder = { Text(selectedCountry.exampleFormat) },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                leadingIcon = {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(start = 12.dp, end = 8.dp)
                                    ) {
                                        Text(
                                            text = selectedCountry.dialCode,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = WhatsAppEmerald
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Box(
                                            modifier = Modifier
                                                .width(1.dp)
                                                .height(20.dp)
                                                .background(MaterialTheme.colorScheme.outlineVariant)
                                        )
                                    }
                                },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("phone_auth_number_field"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = WhatsAppEmerald,
                                    cursorColor = WhatsAppEmerald
                                )
                            )

                            // Dynamic Helper/Error Text
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 4.dp, vertical = 6.dp)
                            ) {
                                val showErr = phoneNumber.isNotEmpty() && !isPhoneValid
                                Text(
                                    text = if (showErr) {
                                        when (val res = validationResult) {
                                            is ValidationResult.Invalid -> res.errorMessage
                                            else -> "Invalid phone number format"
                                        }
                                    } else {
                                        selectedCountry.helperText
                                    },
                                    color = if (showErr) Color.Red else MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 11.sp,
                                    modifier = Modifier.align(Alignment.CenterStart)
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    val clean = phoneNumber.trim()
                                    if (clean.isBlank()) {
                                        errorMessage = "Please enter your phone number."
                                        return@Button
                                    }
                                    startFirebasePhoneVerification(isResend = false)
                                },
                                enabled = !isSigningIn && phoneNumber.isNotBlank() && isPhoneValid,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = WhatsAppEmerald,
                                    contentColor = Color.White
                                ),
                                shape = RoundedCornerShape(27.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp)
                                    .shadow(elevation = 2.dp, shape = RoundedCornerShape(27.dp))
                                    .testTag("phone_auth_send_otp_btn")
                            ) {
                                if (isSigningIn) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        modifier = Modifier.size(24.dp),
                                        strokeWidth = 2.5.dp
                                    )
                                } else {
                                    Text(
                                        text = "Send Verification Code via SMS",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    } else {
                        // Step 1: 6-Digit SMS Verification Code
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = WhatsAppEmerald.copy(alpha = 0.12f),
                                modifier = Modifier.size(54.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.Key,
                                        contentDescription = null,
                                        tint = WhatsAppEmerald,
                                        modifier = Modifier.size(28.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = "Enter 6-Digit SMS Code",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = "Sent to ${fullE164Phone.trim()}",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            if (statusNotice != null) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = WhatsAppEmerald.copy(alpha = 0.1f),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = statusNotice ?: "",
                                        fontSize = 12.sp,
                                        color = WhatsAppEmerald,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(8.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            OutlinedTextField(
                                value = verificationCode,
                                onValueChange = {
                                    if (it.length <= 6) {
                                        verificationCode = it
                                        errorMessage = null
                                    }
                                },
                                label = { Text("6-Digit Code") },
                                placeholder = { Text("123456") },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("phone_auth_code_field"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = WhatsAppEmerald,
                                    cursorColor = WhatsAppEmerald
                                )
                            )

                            Spacer(modifier = Modifier.height(18.dp))

                            Button(
                                onClick = {
                                    val code = verificationCode.trim()
                                    if (code.length < 6) {
                                        errorMessage = "Please enter the complete 6-digit code"
                                        return@Button
                                    }

                                    val vid = verificationIdState
                                    if (vid.isNotBlank()) {
                                        val credential = PhoneAuthProvider.getCredential(vid, code)
                                        completePhoneAuthWithCredential(credential)
                                    } else {
                                        errorMessage = "Invalid verification state. Please request a new SMS code."
                                    }
                                },
                                enabled = !isSigningIn && verificationCode.length == 6,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = WhatsAppEmerald,
                                    contentColor = Color.White
                                ),
                                shape = RoundedCornerShape(27.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp)
                                    .shadow(elevation = 2.dp, shape = RoundedCornerShape(27.dp))
                                    .testTag("phone_auth_verify_btn")
                            ) {
                                if (isSigningIn) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        modifier = Modifier.size(24.dp),
                                        strokeWidth = 2.5.dp
                                    )
                                } else {
                                    Text(
                                        text = "Verify & Sign In",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextButton(
                                    onClick = { phoneAuthStep = 0 }
                                ) {
                                    Text("Change Number", fontSize = 13.sp)
                                }

                                TextButton(
                                    onClick = {
                                        if (resendCountdown == 0) {
                                            startFirebasePhoneVerification(isResend = true)
                                        }
                                    },
                                    enabled = resendCountdown == 0 && !isSigningIn
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Refresh,
                                            contentDescription = null,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = if (resendCountdown > 0) "Resend (${resendCountdown}s)" else "Resend SMS",
                                            fontSize = 13.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // GOOGLE SIGN-IN TAB
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp)
                            .shadow(elevation = 3.dp, shape = RoundedCornerShape(27.dp))
                            .clip(RoundedCornerShape(27.dp))
                            .border(
                                BorderStroke(1.dp, Color(0xFFDADCE0)),
                                RoundedCornerShape(27.dp)
                            )
                            .clickable(enabled = !isSigningIn) {
                                scope.launch {
                                    isSigningIn = true
                                    try {
                                        val clientId = if (BuildConfig.GOOGLE_WEB_CLIENT_ID.isNotEmpty() && 
                                                           !BuildConfig.GOOGLE_WEB_CLIENT_ID.contains("your-google-web-client-id") && 
                                                           !BuildConfig.GOOGLE_WEB_CLIENT_ID.contains("your_google_web_client_id") &&
                                                           !BuildConfig.GOOGLE_WEB_CLIENT_ID.contains("yourgooglewebclientid")) {
                                            BuildConfig.GOOGLE_WEB_CLIENT_ID
                                        } else {
                                            "31813758410-qtfe29f8ufi980db5a8qpeehl5cvntls.apps.googleusercontent.com"
                                        }

                                        val googleIdOption = GetGoogleIdOption.Builder()
                                            .setFilterByAuthorizedAccounts(false)
                                            .setServerClientId(clientId)
                                            .setAutoSelectEnabled(false)
                                            .build()

                                        val request = GetCredentialRequest.Builder()
                                            .addCredentialOption(googleIdOption)
                                            .build()

                                        val result = credentialManager.getCredential(
                                            context = context,
                                            request = request
                                        )

                                        val credential = result.credential
                                        val googleIdTokenCredential = when (credential) {
                                            is GoogleIdTokenCredential -> credential
                                            is CustomCredential -> {
                                                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                                                    try {
                                                        GoogleIdTokenCredential.createFrom(credential.data)
                                                    } catch (e: Exception) {
                                                        null
                                                    }
                                                } else {
                                                    null
                                                }
                                            }
                                            else -> null
                                        }

                                        if (googleIdTokenCredential != null) {
                                            val email = googleIdTokenCredential.id
                                            val name = googleIdTokenCredential.displayName ?: email.substringBefore("@")
                                            val avatar = googleIdTokenCredential.profilePictureUri?.toString()
                                            val rawIdToken = googleIdTokenCredential.idToken

                                            val auth = firebaseAuth
                                            if (auth != null) {
                                                val firebaseCredential = GoogleAuthProvider.getCredential(rawIdToken, null)
                                                auth.signInWithCredential(firebaseCredential)
                                                    .addOnCompleteListener { firebaseTask ->
                                                        isSigningIn = false
                                                        if (firebaseTask.isSuccessful) {
                                                            val firebaseUser = auth.currentUser
                                                            firebaseUser?.getIdToken(false)?.addOnCompleteListener { tokenTask ->
                                                                val firebaseIdToken = if (tokenTask.isSuccessful) tokenTask.result?.token else rawIdToken
                                                                if (onNavigateToPhoneIdentity != null) {
                                                                    onNavigateToPhoneIdentity(email, name, avatar, firebaseIdToken)
                                                                } else if (onGoogleAuthSuccess != null) {
                                                                    isSigningIn = true
                                                                    onGoogleAuthSuccess(email, name, avatar, null, firebaseIdToken) { success, errorMsg ->
                                                                        isSigningIn = false
                                                                        if (!success) {
                                                                            errorMessage = errorMsg ?: "Google authentication failed."
                                                                        }
                                                                    }
                                                                }
                                                            } ?: run {
                                                                if (onNavigateToPhoneIdentity != null) {
                                                                    onNavigateToPhoneIdentity(email, name, avatar, rawIdToken)
                                                                } else if (onGoogleAuthSuccess != null) {
                                                                    isSigningIn = true
                                                                    onGoogleAuthSuccess(email, name, avatar, null, rawIdToken) { success, errorMsg ->
                                                                        isSigningIn = false
                                                                        if (!success) {
                                                                            errorMessage = errorMsg ?: "Google authentication failed."
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        } else {
                                                            val exc = firebaseTask.exception
                                                            errorMessage = "Firebase Google Sign-In error: ${exc?.localizedMessage ?: "Could not complete Firebase authentication."}"
                                                        }
                                                    }
                                            } else {
                                                if (onNavigateToPhoneIdentity != null) {
                                                    isSigningIn = false
                                                    onNavigateToPhoneIdentity(email, name, avatar, rawIdToken)
                                                } else if (onGoogleAuthSuccess != null) {
                                                    isSigningIn = true
                                                    onGoogleAuthSuccess(email, name, avatar, null, rawIdToken) { success, errorMsg ->
                                                        isSigningIn = false
                                                        if (!success) {
                                                            errorMessage = errorMsg ?: "Google authentication failed."
                                                        }
                                                    }
                                                } else {
                                                    isSigningIn = false
                                                }
                                            }
                                        } else {
                                            isSigningIn = false
                                            errorMessage = "Could not extract Google credential from system response."
                                        }
                                    } catch (e: GetCredentialCancellationException) {
                                        // User dismissed or cancelled the Google chooser dialog
                                        isSigningIn = false
                                    } catch (e: GetCredentialCustomException) {
                                        isSigningIn = false
                                        e.printStackTrace()
                                        errorMessage = "Google Sign-In: ${e.message ?: "Authentication failed"}"
                                    } catch (e: GetCredentialException) {
                                        isSigningIn = false
                                        e.printStackTrace()
                                        errorMessage = "Google Sign-In: ${e.message ?: "No credentials available on device."}"
                                    } catch (e: Exception) {
                                        isSigningIn = false
                                        e.printStackTrace()
                                        errorMessage = "An error occurred: ${e.message ?: "Unknown error"}"
                                    } finally {
                                        // Guarantee loading spinner resets
                                        if (isSigningIn) {
                                            isSigningIn = false
                                        }
                                    }
                                }
                            }
                            .testTag("google_auth_btn"),
                        color = Color.White
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 20.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            if (isSigningIn) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    color = Color(0xFF4285F4),
                                    strokeWidth = 2.5.dp
                                )
                            } else {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_google_logo),
                                    contentDescription = "Google",
                                    tint = Color.Unspecified,
                                    modifier = Modifier.size(24.dp)
                                )

                                Spacer(modifier = Modifier.width(12.dp))

                                Text(
                                    text = "Sign in with Google",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF3C4043)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // End-to-end security badge
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = "Encrypted",
                        tint = WhatsAppEmerald,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "End-to-end encrypted • Secure Session",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Powered by PRIGID GROUP",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                    letterSpacing = 0.5.sp
                )

                if (errorMessage != null) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFFFEBEE),
                        border = BorderStroke(1.dp, Color(0xFFFFCDD2)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp)
                    ) {
                        Text(
                            text = errorMessage ?: "",
                            fontSize = 12.sp,
                            color = Color(0xFFC62828),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
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
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Select Country",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = {
                        showCountrySheet = false
                        countrySearchQuery = ""
                    }) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = countrySearchQuery,
                    onValueChange = { countrySearchQuery = it },
                    placeholder = { Text("Search country or code...") },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.Search, contentDescription = "Search")
                    },
                    trailingIcon = {
                        if (countrySearchQuery.isNotEmpty()) {
                            IconButton(onClick = { countrySearchQuery = "" }) {
                                Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(360.dp)
                ) {
                    items(filteredCountries, key = { it.code + it.dialCode }) { country ->
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .clickable {
                                    selectedCountry = country
                                    showCountrySheet = false
                                    countrySearchQuery = ""
                                },
                            color = if (country == selectedCountry) WhatsAppEmerald.copy(alpha = 0.1f) else Color.Transparent
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(text = country.flag, fontSize = 22.sp)
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = country.name,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = country.helperText,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Text(
                                    text = country.dialCode,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = WhatsAppEmerald
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
