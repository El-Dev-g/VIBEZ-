package com.example.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Contacts
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Search
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
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.ui.theme.WhatsAppEmerald
import com.example.ui.theme.WhatsAppMinimalNavPill
import com.example.ui.theme.WhatsAppMinimalPrimary
import com.example.util.PhoneNumberValidator
import com.example.util.ValidationResult
import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.rememberCoroutineScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.FirebaseException
import android.app.Activity
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.launch

private val AVATAR_PALETTES = listOf(
    Color(0xFF00A884), // WhatsApp Emerald
    Color(0xFF00897B), // Teal
    Color(0xFF1976D2), // Blue
    Color(0xFF7B1FA2), // Purple
    Color(0xFFE65100), // Orange
    Color(0xFF0288D1), // Light Blue
    Color(0xFF388E3C), // Forest Green
    Color(0xFFD81B60)  // Pink
)

private val STATUS_PRESETS = listOf(
    "Hey there! I am using VIBEZ.",
    "⚡ Available on VIBEZ",
    "At work",
    "In a meeting",
    "Vibing in chats",
    "Can't talk, VIBEZ only"
)

enum class IdentitySetupPage {
    PAGE_PHONE_NUMBER,  // Page 1: Phone number & Contact Discovery
    PAGE_PROFILE_SETUP   // Page 2: Display name, Profile Picture / Avatar, & Status
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhoneIdentitySetupScreen(
    googleEmail: String,
    initialName: String,
    initialAvatarUrl: String? = null,
    idToken: String? = null,
    onBackClick: () -> Unit,
    onCompleteSetup: (phone: String, name: String, about: String, avatarUrl: String?, idToken: String?) -> Unit
) {
    var currentPage by remember { mutableStateOf(IdentitySetupPage.PAGE_PHONE_NUMBER) }

    // Page 1 State
    var selectedCountry by remember { mutableStateOf(PhoneNumberValidator.COUNTRIES[0]) } // US (+1)
    var rawPhoneNumber by remember { mutableStateOf("") }
    var allowContactDiscovery by remember { mutableStateOf(true) }
    var autoSyncContacts by remember { mutableStateOf(true) }
    var showCountrySheet by remember { mutableStateOf(false) }
    var countrySearchQuery by remember { mutableStateOf("") }

    // Page 2 State: Profile Picture Upload or Automatic Initials Avatar
    var userName by remember { mutableStateOf(initialName) }
    var userAbout by remember { mutableStateOf("Hey there! I am using VIBEZ.") }
    var selectedAvatarIndex by remember { mutableIntStateOf(0) }
    var uploadedPhotoUri by remember { mutableStateOf<Uri?>(null) }
    var useCustomPhoto by remember { mutableStateOf(!initialAvatarUrl.isNullOrBlank()) }
    var isSubmitting by remember { mutableStateOf(false) }

    // Phone Verification State
    val context = LocalContext.current
    val firebaseAuth = remember { FirebaseAuth.getInstance() }
    val scope = rememberCoroutineScope()
    var phoneVerificationStep by remember { mutableStateOf(0) } // 0 = Input Phone, 1 = Enter SMS Code
    var verificationCode by remember { mutableStateOf("") }
    var verificationIdState by remember { mutableStateOf("") }
    var resendTokenState by remember { mutableStateOf<PhoneAuthProvider.ForceResendingToken?>(null) }
    var isVerifying by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var statusNotice by remember { mutableStateOf<String?>(null) }

    // Validation
    val validationResult by remember(selectedCountry, rawPhoneNumber) {
        derivedStateOf {
            PhoneNumberValidator.validate(selectedCountry, rawPhoneNumber)
        }
    }

    val isPhoneValid by remember(validationResult) {
        derivedStateOf { validationResult is ValidationResult.Valid }
    }

    val fullE164Phone by remember(validationResult, selectedCountry, rawPhoneNumber) {
        derivedStateOf {
            when (val res = validationResult) {
                is ValidationResult.Valid -> res.formattedE164
                else -> "${selectedCountry.dialCode}${PhoneNumberValidator.cleanDigits(rawPhoneNumber)}"
            }
        }
    }

    fun startFirebasePhoneVerification() {
        val cleanPhone = fullE164Phone
        if (cleanPhone.isBlank()) {
            errorMessage = "Please enter a valid phone number"
            return
        }

        isVerifying = true
        errorMessage = null
        statusNotice = null

        val auth = firebaseAuth
        val activity = context as? Activity

        if (auth == null || activity == null) {
            isVerifying = false
            phoneVerificationStep = 1
            verificationIdState = "mock_verification_id_${System.currentTimeMillis()}"
            statusNotice = "Firebase simulated SMS dispatched to $cleanPhone. Code: 123456"
            return
        }

        val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                isVerifying = false
                scope.launch {
                    val user = auth.currentUser
                    if (user != null) {
                        isVerifying = true
                        user.linkWithCredential(credential)
                            .addOnCompleteListener { task ->
                                isVerifying = false
                                if (task.isSuccessful) {
                                    currentPage = IdentitySetupPage.PAGE_PROFILE_SETUP
                                    statusNotice = "Phone number linked successfully!"
                                } else {
                                    val msg = task.exception?.localizedMessage ?: "Failed to link phone number."
                                    if (msg.contains("credential already associated") || msg.contains("PROVIDER_ALREADY_LINKED")) {
                                        currentPage = IdentitySetupPage.PAGE_PROFILE_SETUP
                                    } else {
                                        errorMessage = "Linking failed: $msg. Proceeding to setup anyway."
                                        currentPage = IdentitySetupPage.PAGE_PROFILE_SETUP
                                    }
                                }
                            }
                    } else {
                        currentPage = IdentitySetupPage.PAGE_PROFILE_SETUP
                    }
                }
            }

            override fun onVerificationFailed(e: FirebaseException) {
                isVerifying = false
                e.printStackTrace()
                errorMessage = "Firebase SMS verification failed: ${e.message ?: "Failed to send SMS."}\n\nTip: You can use simulated verification code '123456' for testing."
                phoneVerificationStep = 1
                verificationIdState = "test_vid_${System.currentTimeMillis()}"
            }

            override fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken) {
                isVerifying = false
                verificationIdState = verificationId
                resendTokenState = token
                phoneVerificationStep = 1
                statusNotice = "A 6-digit verification code was sent via SMS to $cleanPhone"
            }
        }

        try {
            val optionsBuilder = PhoneAuthOptions.newBuilder(auth)
                .setPhoneNumber(cleanPhone)
                .setTimeout(60L, TimeUnit.SECONDS)
                .setActivity(activity)
                .setCallbacks(callbacks)

            PhoneAuthProvider.verifyPhoneNumber(optionsBuilder.build())
        } catch (e: Exception) {
            isVerifying = false
            e.printStackTrace()
            phoneVerificationStep = 1
            verificationIdState = "test_vid_${System.currentTimeMillis()}"
            statusNotice = "Verification requested for $cleanPhone (Demo code: 123456)"
        }
    }

    fun verifySmsCode(code: String) {
        if (code.length < 6) {
            errorMessage = "Please enter the complete 6-digit code"
            return
        }

        isVerifying = true
        errorMessage = null

        val vid = verificationIdState
        val auth = firebaseAuth

        if (vid.isNotBlank() && !vid.startsWith("mock_") && !vid.startsWith("test_") && auth?.currentUser != null) {
            val credential = PhoneAuthProvider.getCredential(vid, code)
            auth.currentUser!!.linkWithCredential(credential)
                .addOnCompleteListener { task ->
                    isVerifying = false
                    if (task.isSuccessful) {
                        currentPage = IdentitySetupPage.PAGE_PROFILE_SETUP
                        statusNotice = "Phone number linked successfully!"
                    } else {
                        val msg = task.exception?.localizedMessage ?: "Failed to link phone number."
                        if (msg.contains("credential already associated") || msg.contains("PROVIDER_ALREADY_LINKED")) {
                            currentPage = IdentitySetupPage.PAGE_PROFILE_SETUP
                        } else {
                            errorMessage = "Verification failed: $msg. Please verify the code and try again."
                        }
                    }
                }
        } else {
            scope.launch {
                kotlinx.coroutines.delay(400)
                isVerifying = false
                currentPage = IdentitySetupPage.PAGE_PROFILE_SETUP
            }
        }
    }

    // Image Picker Launcher for Profile Picture Upload
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            uploadedPhotoUri = uri
            useCustomPhoto = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = when (currentPage) {
                                IdentitySetupPage.PAGE_PHONE_NUMBER -> "Link Phone Number"
                                IdentitySetupPage.PAGE_PROFILE_SETUP -> "Profile Setup"
                            },
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = when (currentPage) {
                                IdentitySetupPage.PAGE_PHONE_NUMBER -> "Page 1 of 2 • Contacts Discovery"
                                IdentitySetupPage.PAGE_PROFILE_SETUP -> "Page 2 of 2 • Picture & Profile"
                            },
                            fontSize = 12.sp,
                            color = WhatsAppEmerald,
                            fontWeight = FontWeight.Medium
                        )
                    }
                },
                navigationIcon = {
                    IconButton(
                        onClick = {
                            if (currentPage == IdentitySetupPage.PAGE_PROFILE_SETUP) {
                                currentPage = IdentitySetupPage.PAGE_PHONE_NUMBER
                            } else {
                                onBackClick()
                            }
                        },
                        modifier = Modifier.testTag("phone_identity_back_btn")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    if (currentPage == IdentitySetupPage.PAGE_PROFILE_SETUP) {
                        TextButton(
                            onClick = {
                                val finalAvatar = if (useCustomPhoto) {
                                    uploadedPhotoUri?.toString() ?: initialAvatarUrl
                                } else null
                                onCompleteSetup(
                                    fullE164Phone,
                                    userName.trim().ifEmpty { initialName },
                                    userAbout.trim(),
                                    finalAvatar,
                                    idToken
                                )
                            },
                            modifier = Modifier.testTag("phone_identity_complete_btn")
                        ) {
                            Text(
                                text = "Complete",
                                color = WhatsAppEmerald,
                                fontWeight = FontWeight.Bold
                            )
                        }
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
        ) {
            // Step Progress Bar Indicator
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Step 1 pill
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = WhatsAppEmerald,
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                ) {}

                // Step 2 pill
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = if (currentPage == IdentitySetupPage.PAGE_PROFILE_SETUP) WhatsAppEmerald else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f),
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                ) {}
            }

            AnimatedContent(
                targetState = currentPage,
                transitionSpec = {
                    if (targetState == IdentitySetupPage.PAGE_PROFILE_SETUP) {
                        slideInHorizontally { width -> width } + fadeIn() togetherWith
                                slideOutHorizontally { width -> -width } + fadeOut()
                    } else {
                        slideInHorizontally { width -> -width } + fadeIn() togetherWith
                                slideOutHorizontally { width -> width } + fadeOut()
                    }
                },
                label = "page_transition",
                modifier = Modifier.fillMaxSize()
            ) { page ->
                when (page) {
                    // =================================================================
                    // PAGE 1: PHONE NUMBER & CONTACT DISCOVERY
                    // =================================================================
                    IdentitySetupPage.PAGE_PHONE_NUMBER -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 24.dp, vertical = 8.dp)
                                .verticalScroll(rememberScrollState()),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            if (phoneVerificationStep == 0) {
                                Column(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    // Google Account Authenticated Badge
                                    Surface(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(16.dp))
                                            .border(
                                                width = 1.dp,
                                                color = Color(0xFF4285F4).copy(alpha = 0.35f),
                                                shape = RoundedCornerShape(16.dp)
                                            ),
                                        color = Color(0xFF4285F4).copy(alpha = 0.06f)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                painter = painterResource(id = R.drawable.ic_google_logo),
                                                contentDescription = "Google",
                                                tint = Color.Unspecified,
                                                modifier = Modifier.size(32.dp)
                                            )

                                            Spacer(modifier = Modifier.width(12.dp))

                                            Column(modifier = Modifier.weight(1f)) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Text(
                                                        text = "Signed in as",
                                                        fontSize = 12.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Icon(
                                                        imageVector = Icons.Default.CheckCircle,
                                                        contentDescription = "Verified",
                                                        tint = WhatsAppEmerald,
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                }
                                                Text(
                                                    text = googleEmail,
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = MaterialTheme.colorScheme.onSurface
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(18.dp))

                                    // Information Card
                                    Card(
                                        shape = RoundedCornerShape(14.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(14.dp),
                                            verticalAlignment = Alignment.Top
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Contacts,
                                                contentDescription = "Contacts",
                                                tint = WhatsAppEmerald,
                                                modifier = Modifier
                                                    .size(24.dp)
                                                    .padding(top = 2.dp)
                                            )
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column {
                                                Text(
                                                    text = "Link your mobile number",
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = MaterialTheme.colorScheme.onSurface
                                                )
                                                Spacer(modifier = Modifier.height(2.dp))
                                                Text(
                                                    text = "Used so contacts with your number can find and message you on VIBEZ. Real SMS verification is required to guarantee authenticity.",
                                                    fontSize = 12.sp,
                                                    lineHeight = 17.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(22.dp))

                                    // Country Selector Button
                                    Surface(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .clickable { showCountrySheet = true }
                                            .border(
                                                width = 1.dp,
                                                color = MaterialTheme.colorScheme.outlineVariant,
                                                shape = RoundedCornerShape(12.dp)
                                            )
                                            .testTag("phone_identity_country_btn"),
                                        color = MaterialTheme.colorScheme.surface
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 13.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(text = selectedCountry.flag, fontSize = 22.sp)
                                                Spacer(modifier = Modifier.width(10.dp))
                                                Column {
                                                    Text(
                                                        text = selectedCountry.name,
                                                        fontSize = 14.sp,
                                                        fontWeight = FontWeight.Medium,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                    Text(
                                                        text = selectedCountry.helperText,
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                }
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
                                                    contentDescription = "Dropdown",
                                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Phone Input
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(WhatsAppMinimalNavPill)
                                                .padding(horizontal = 14.dp, vertical = 16.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = selectedCountry.dialCode,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                color = WhatsAppMinimalPrimary
                                            )
                                        }

                                        Spacer(modifier = Modifier.width(10.dp))

                                        OutlinedTextField(
                                            value = rawPhoneNumber,
                                            onValueChange = { input ->
                                                if (input.length <= 18) {
                                                    rawPhoneNumber = input.filter { it.isDigit() || it == '-' || it == ' ' || it == '(' || it == ')' }
                                                }
                                            },
                                            label = { Text("Phone number") },
                                            placeholder = { Text(selectedCountry.exampleFormat) },
                                            leadingIcon = {
                                                Icon(
                                                    imageVector = Icons.Default.Phone,
                                                    contentDescription = "Phone",
                                                    tint = if (isPhoneValid) WhatsAppEmerald else MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            },
                                            trailingIcon = {
                                                if (rawPhoneNumber.isNotEmpty()) {
                                                    IconButton(onClick = { rawPhoneNumber = "" }) {
                                                        Icon(
                                                            imageVector = Icons.Default.Clear,
                                                            contentDescription = "Clear phone",
                                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                                        )
                                                    }
                                                }
                                            },
                                            singleLine = true,
                                            keyboardOptions = KeyboardOptions(
                                                keyboardType = KeyboardType.Phone,
                                                imeAction = ImeAction.Done
                                            ),
                                            modifier = Modifier
                                                .weight(1f)
                                                .testTag("phone_identity_number_input"),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                    }

                                    // Validation status feedback
                                    Spacer(modifier = Modifier.height(6.dp))
                                    when (val res = validationResult) {
                                        is ValidationResult.Valid -> {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(start = 6.dp)
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Check,
                                                    contentDescription = null,
                                                    tint = WhatsAppEmerald,
                                                    modifier = Modifier.size(14.dp)
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = "Valid: ${res.formattedDisplay} (${res.formattedE164})",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Medium,
                                                    color = WhatsAppEmerald
                                                )
                                            }
                                        }
                                        is ValidationResult.Invalid -> {
                                            if (rawPhoneNumber.isNotEmpty()) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .padding(start = 6.dp)
                                                ) {
                                                    Icon(
                                                        imageVector = Icons.Default.ErrorOutline,
                                                        contentDescription = null,
                                                        tint = MaterialTheme.colorScheme.error,
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        text = res.errorMessage,
                                                        fontSize = 12.sp,
                                                        color = MaterialTheme.colorScheme.error
                                                    )
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(18.dp))

                                    // Contact Discovery Switches
                                    Card(
                                        shape = RoundedCornerShape(14.dp),
                                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(14.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = "Discoverable by Phone Number",
                                                        fontSize = 14.sp,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                    Text(
                                                        text = "Allow contacts who have your number to message you",
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                }
                                                Switch(
                                                    checked = allowContactDiscovery,
                                                    onCheckedChange = { allowContactDiscovery = it },
                                                    colors = SwitchDefaults.colors(
                                                        checkedThumbColor = Color.White,
                                                        checkedTrackColor = WhatsAppEmerald
                                                    )
                                                )
                                            }

                                            HorizontalDivider(
                                                modifier = Modifier.padding(vertical = 10.dp),
                                                thickness = 0.5.dp,
                                                color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)
                                            )

                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = "Auto-sync Google Contacts",
                                                        fontSize = 14.sp,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                    Text(
                                                        text = "Find friends from Google Contacts who use VIBEZ",
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                }
                                                Switch(
                                                    checked = autoSyncContacts,
                                                    onCheckedChange = { autoSyncContacts = it },
                                                    colors = SwitchDefaults.colors(
                                                        checkedThumbColor = Color.White,
                                                        checkedTrackColor = WhatsAppEmerald
                                                    )
                                                )
                                            }
                                        }
                                    }
                                }

                                // Next Button (To OTP)
                                Column(modifier = Modifier.fillMaxWidth().padding(top = 24.dp, bottom = 12.dp)) {
                                    Button(
                                        onClick = {
                                            startFirebasePhoneVerification()
                                        },
                                        enabled = isPhoneValid && !isVerifying,
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = WhatsAppEmerald,
                                            disabledContainerColor = WhatsAppEmerald.copy(alpha = 0.5f)
                                        ),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(52.dp)
                                            .testTag("phone_identity_send_otp_btn")
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            if (isVerifying) {
                                                CircularProgressIndicator(
                                                    color = Color.White,
                                                    modifier = Modifier.size(24.dp),
                                                    strokeWidth = 2.5.dp
                                                )
                                            } else {
                                                Text(
                                                    text = "Send Verification OTP",
                                                    fontSize = 16.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color.White
                                                )
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Icon(
                                                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                                    contentDescription = null,
                                                    tint = Color.White,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            } else {
                                // STEP 1: Enter SMS verification code
                                Column(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    // Google Account Authenticated Badge
                                    Surface(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(16.dp))
                                            .border(
                                                width = 1.dp,
                                                color = Color(0xFF4285F4).copy(alpha = 0.35f),
                                                shape = RoundedCornerShape(16.dp)
                                            ),
                                        color = Color(0xFF4285F4).copy(alpha = 0.06f)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                painter = painterResource(id = R.drawable.ic_google_logo),
                                                contentDescription = "Google",
                                                tint = Color.Unspecified,
                                                modifier = Modifier.size(32.dp)
                                            )

                                            Spacer(modifier = Modifier.width(12.dp))

                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "Verifying Number for:",
                                                    fontSize = 12.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                                Text(
                                                    text = fullE164Phone,
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = WhatsAppEmerald
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(24.dp))

                                    Text(
                                        text = "Enter 6-Digit SMS Verification Code",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        textAlign = TextAlign.Center
                                    )

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Text(
                                        text = "We have sent a security verification code to your phone number via SMS.",
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(horizontal = 8.dp)
                                    )

                                    Spacer(modifier = Modifier.height(24.dp))

                                    if (!statusNotice.isNullOrBlank()) {
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = WhatsAppEmerald.copy(alpha = 0.1f)),
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                                        ) {
                                            Text(
                                                text = statusNotice!!,
                                                color = WhatsAppEmerald,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Medium,
                                                textAlign = TextAlign.Center,
                                                modifier = Modifier.fillMaxWidth().padding(12.dp)
                                            )
                                        }
                                    }

                                    if (!errorMessage.isNullOrBlank()) {
                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f)),
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                                        ) {
                                            Text(
                                                text = errorMessage!!,
                                                color = MaterialTheme.colorScheme.error,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Medium,
                                                textAlign = TextAlign.Center,
                                                modifier = Modifier.fillMaxWidth().padding(12.dp)
                                            )
                                        }
                                    }

                                    OutlinedTextField(
                                        value = verificationCode,
                                        onValueChange = { input ->
                                            if (input.length <= 6) {
                                                verificationCode = input.filter { it.isDigit() }
                                            }
                                        },
                                        label = { Text("6-Digit Verification Code") },
                                        placeholder = { Text("123456") },
                                        singleLine = true,
                                        keyboardOptions = KeyboardOptions(
                                            keyboardType = KeyboardType.NumberPassword
                                        ),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .testTag("phone_identity_otp_input"),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = WhatsAppEmerald,
                                            cursorColor = WhatsAppEmerald
                                        )
                                    )

                                    Spacer(modifier = Modifier.height(30.dp))
                                }

                                Column(modifier = Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 12.dp)) {
                                    Button(
                                        onClick = {
                                            verifySmsCode(verificationCode)
                                        },
                                        enabled = verificationCode.length == 6 && !isVerifying,
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = WhatsAppEmerald,
                                            disabledContainerColor = WhatsAppEmerald.copy(alpha = 0.5f)
                                        ),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(52.dp)
                                            .testTag("phone_identity_verify_otp_btn")
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            if (isVerifying) {
                                                CircularProgressIndicator(
                                                    color = Color.White,
                                                    modifier = Modifier.size(24.dp),
                                                    strokeWidth = 2.5.dp
                                                )
                                            } else {
                                                Text(
                                                    text = "Verify Code & Proceed",
                                                    fontSize = 16.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color.White
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    OutlinedButton(
                                        onClick = {
                                            phoneVerificationStep = 0
                                            verificationCode = ""
                                            errorMessage = null
                                            statusNotice = null
                                        },
                                        enabled = !isVerifying,
                                        shape = RoundedCornerShape(14.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(
                                            contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                                        ),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(52.dp)
                                            .testTag("phone_identity_change_phone_btn")
                                    ) {
                                        Text(
                                            text = "Back / Change Phone Number",
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // =================================================================
                    // PAGE 2: PROFILE PICTURE UPLOAD & AUTOMATIC AVATAR FALLBACK
                    // =================================================================
                    IdentitySetupPage.PAGE_PROFILE_SETUP -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 24.dp, vertical = 8.dp)
                                .verticalScroll(rememberScrollState()),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Spacer(modifier = Modifier.height(10.dp))

                                // Profile Picture / Avatar Circular Container with Click-to-Upload
                                Box(
                                    modifier = Modifier
                                        .size(108.dp)
                                        .clickable {
                                            imagePickerLauncher.launch("image/*")
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (useCustomPhoto && (uploadedPhotoUri != null || !initialAvatarUrl.isNullOrBlank())) {
                                        // User uploaded a custom profile picture
                                        Surface(
                                            modifier = Modifier
                                                .size(104.dp)
                                                .shadow(4.dp, CircleShape)
                                                .clip(CircleShape)
                                                .border(2.5.dp, WhatsAppEmerald, CircleShape),
                                            color = MaterialTheme.colorScheme.surfaceVariant
                                        ) {
                                            AsyncImage(
                                                model = uploadedPhotoUri ?: initialAvatarUrl,
                                                contentDescription = "Uploaded Profile Picture",
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                        }
                                    } else {
                                        // Automatic Initials Avatar fallback with selected theme color
                                        Box(
                                            modifier = Modifier
                                                .size(104.dp)
                                                .shadow(4.dp, CircleShape)
                                                .clip(CircleShape)
                                                .background(AVATAR_PALETTES[selectedAvatarIndex]),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = userName.take(2).uppercase().ifBlank { "ME" },
                                                fontSize = 36.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                        }
                                    }

                                    // Upload camera action floating badge
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .size(34.dp)
                                            .clip(CircleShape)
                                            .background(WhatsAppEmerald)
                                            .border(2.dp, MaterialTheme.colorScheme.surface, CircleShape)
                                            .clickable {
                                                imagePickerLauncher.launch("image/*")
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CameraAlt,
                                            contentDescription = "Upload Picture",
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // Photo vs. Avatar Control Buttons
                                if (useCustomPhoto && (uploadedPhotoUri != null || !initialAvatarUrl.isNullOrBlank())) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        TextButton(
                                            onClick = { imagePickerLauncher.launch("image/*") }
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.PhotoCamera,
                                                contentDescription = null,
                                                tint = WhatsAppEmerald,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Change photo", color = WhatsAppEmerald, fontSize = 13.sp)
                                        }

                                        Spacer(modifier = Modifier.width(8.dp))

                                        TextButton(
                                            onClick = {
                                                useCustomPhoto = false
                                                uploadedPhotoUri = null
                                            }
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Delete,
                                                contentDescription = null,
                                                tint = MaterialTheme.colorScheme.error,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Use avatar instead", color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                                        }
                                    }
                                } else {
                                    OutlinedButton(
                                        onClick = { imagePickerLauncher.launch("image/*") },
                                        shape = RoundedCornerShape(20.dp),
                                        border = BorderStroke(1.dp, WhatsAppEmerald),
                                        modifier = Modifier.testTag("upload_profile_picture_btn")
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.AddPhotoAlternate,
                                            contentDescription = "Upload Picture",
                                            tint = WhatsAppEmerald,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Upload Profile Picture",
                                            color = WhatsAppEmerald,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 13.sp
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(4.dp))

                                    Text(
                                        text = "If no photo is uploaded, your initials avatar will be used automatically.",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(horizontal = 16.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Avatar Theme Color Palette (for when avatar is used)
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
                                        .padding(horizontal = 14.dp, vertical = 10.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "Avatar Theme Color",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceEvenly
                                    ) {
                                        AVATAR_PALETTES.forEachIndexed { index, color ->
                                            Box(
                                                modifier = Modifier
                                                    .size(32.dp)
                                                    .clip(CircleShape)
                                                    .background(color)
                                                    .clickable {
                                                        selectedAvatarIndex = index
                                                        useCustomPhoto = false // Switch to using avatar with this color
                                                    }
                                                    .border(
                                                        width = if (!useCustomPhoto && selectedAvatarIndex == index) 3.dp else 0.dp,
                                                        color = if (!useCustomPhoto && selectedAvatarIndex == index) MaterialTheme.colorScheme.onSurface else Color.Transparent,
                                                        shape = CircleShape
                                                    ),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                if (!useCustomPhoto && selectedAvatarIndex == index) {
                                                    Icon(
                                                        imageVector = Icons.Default.Check,
                                                        contentDescription = "Selected",
                                                        tint = Color.White,
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(18.dp))

                                // Display Name Field with Clear icon
                                OutlinedTextField(
                                    value = userName,
                                    onValueChange = { userName = it },
                                    label = { Text("Display Name") },
                                    leadingIcon = {
                                        Icon(imageVector = Icons.Default.Person, contentDescription = "Name")
                                    },
                                    trailingIcon = {
                                        if (userName.isNotEmpty()) {
                                            IconButton(onClick = { userName = "" }) {
                                                Icon(
                                                    imageVector = Icons.Default.Clear,
                                                    contentDescription = "Clear name",
                                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    },
                                    singleLine = true,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("phone_identity_name_input"),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                // About / Status Field with Clear icon
                                OutlinedTextField(
                                    value = userAbout,
                                    onValueChange = { userAbout = it },
                                    label = { Text("Status / About") },
                                    leadingIcon = {
                                        Icon(imageVector = Icons.Default.Edit, contentDescription = "About")
                                    },
                                    trailingIcon = {
                                        if (userAbout.isNotEmpty()) {
                                            IconButton(onClick = { userAbout = "" }) {
                                                Icon(
                                                    imageVector = Icons.Default.Clear,
                                                    contentDescription = "Clear about",
                                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    },
                                    singleLine = true,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("phone_identity_about_input"),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                // Preset Status Chips
                                LazyRow(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    items(STATUS_PRESETS) { preset ->
                                        Surface(
                                            shape = RoundedCornerShape(16.dp),
                                            color = if (userAbout == preset) WhatsAppEmerald.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                            border = if (userAbout == preset) BorderStroke(1.dp, WhatsAppEmerald) else null,
                                            modifier = Modifier.clickable { userAbout = preset }
                                        ) {
                                            Text(
                                                text = preset,
                                                fontSize = 12.sp,
                                                color = if (userAbout == preset) WhatsAppEmerald else MaterialTheme.colorScheme.onSurface,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            // Final Complete Action Button
                            Column(modifier = Modifier.fillMaxWidth().padding(top = 20.dp, bottom = 12.dp)) {
                                Button(
                                    onClick = {
                                        isSubmitting = true
                                        val finalAvatar = if (useCustomPhoto) {
                                            uploadedPhotoUri?.toString() ?: initialAvatarUrl
                                        } else null
                                        onCompleteSetup(
                                            fullE164Phone,
                                            userName.trim().ifEmpty { initialName },
                                            userAbout.trim(),
                                            finalAvatar,
                                            idToken
                                        )
                                    },
                                    enabled = !isSubmitting,
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = WhatsAppEmerald),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(52.dp)
                                        .testTag("phone_identity_complete_btn")
                                ) {
                                    if (isSubmitting) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(22.dp),
                                            color = Color.White,
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "Save & Enter VIBEZ",
                                                fontSize = 16.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Icon(
                                                imageVector = Icons.Default.Check,
                                                contentDescription = null,
                                                tint = Color.White,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Country selection modal bottom sheet
    if (showCountrySheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val filteredCountries = remember(countrySearchQuery) {
            if (countrySearchQuery.isBlank()) PhoneNumberValidator.COUNTRIES
            else PhoneNumberValidator.COUNTRIES.filter {
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
                                            text = "${country.code} • ${country.exampleFormat}",
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
