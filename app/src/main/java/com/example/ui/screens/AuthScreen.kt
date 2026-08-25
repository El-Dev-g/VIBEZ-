package com.example.ui.screens

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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.example.BuildConfig
import com.example.R
import com.example.ui.theme.WhatsAppEmerald
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    onAuthSuccess: (phone: String, name: String, about: String) -> Unit,
    onGoogleAuthSuccess: ((email: String, name: String, avatarUrl: String?, phone: String?, idToken: String?) -> Unit)? = null,
    onNavigateToPhoneIdentity: ((email: String, name: String, avatarUrl: String?, idToken: String?) -> Unit)? = null
) {
    var activeTab by remember { mutableStateOf(0) } // 0 = Google Sign-In, 1 = Phone Sign-In
    var phoneName by remember { mutableStateOf("") }
    var phoneNumber by remember { mutableStateOf("") }
    var isSigningIn by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    val credentialManager = CredentialManager.create(context)

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 28.dp),
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
                        .size(88.dp)
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
                                modifier = Modifier.size(48.dp)
                            )
                        } else {
                            Icon(
                                imageVector = androidx.compose.material.icons.Icons.Default.Lock,
                                contentDescription = "Secure",
                                tint = WhatsAppEmerald,
                                modifier = Modifier.size(44.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // App Name
                Text(
                    text = "VIBEZ",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                    letterSpacing = 1.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Clean Subtitle
                Text(
                    text = if (activeTab == 0) "Sign in with Google to continue" else "Sign in with your phone number",
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(28.dp))

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
                            .background(if (activeTab == 0) WhatsAppEmerald else Color.Transparent)
                            .clickable { activeTab = 0 }
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
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (activeTab == 1) WhatsAppEmerald else Color.Transparent)
                            .clickable { activeTab = 1 }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Phone Number",
                            color = if (activeTab == 1) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                if (activeTab == 0) {
                    // 1. Google Sign-In Button Block
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
                                        if (BuildConfig.GOOGLE_WEB_CLIENT_ID.isEmpty() || BuildConfig.GOOGLE_WEB_CLIENT_ID == "your-google-web-client-id.apps.googleusercontent.com") {
                                            errorMessage = "Google Web Client ID is not configured!\n\nPlease configure GOOGLE_WEB_CLIENT_ID in the Secrets panel in AI Studio or your .env file, or use the Phone Number sign-in option to log in instantly."
                                            isSigningIn = false
                                            return@launch
                                        }

                                        val googleIdOption = GetGoogleIdOption.Builder()
                                            .setFilterByAuthorizedAccounts(false)
                                            .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
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
                                        if (credential is com.google.android.libraries.identity.googleid.GoogleIdTokenCredential) {
                                            val googleIdTokenCredential = credential
                                            val email = googleIdTokenCredential.id
                                            val name = googleIdTokenCredential.displayName ?: email.substringBefore("@")
                                            val avatar = googleIdTokenCredential.profilePictureUri?.toString()
                                            val idToken = googleIdTokenCredential.idToken

                                            if (onNavigateToPhoneIdentity != null) {
                                                onNavigateToPhoneIdentity(email, name, avatar, idToken)
                                            } else if (onGoogleAuthSuccess != null) {
                                                onGoogleAuthSuccess(email, name, avatar, null, idToken)
                                            }
                                        }
                                    } catch (e: GetCredentialException) {
                                        e.printStackTrace()
                                        errorMessage = "Google Sign-In failed: ${e.message ?: "Authentication failed."}\n\nPlease check if your device has Google Play Services active and set up with a Google account, or use the alternative Phone Number sign-in option above."
                                        isSigningIn = false
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                        errorMessage = "An unexpected error occurred: ${e.message ?: "Unknown error"}\n\nMake sure the Web Client ID is valid, or use the alternative Phone Number sign-in."
                                        isSigningIn = false
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
                } else {
                    // 2. Beautiful Phone Sign-In Form Block
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        OutlinedTextField(
                            value = phoneName,
                            onValueChange = { phoneName = it },
                            label = { Text("Display Name") },
                            placeholder = { Text("e.g. Jane Doe") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("phone_auth_name_field")
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = phoneNumber,
                            onValueChange = { phoneNumber = it },
                            label = { Text("Phone Number") },
                            placeholder = { Text("e.g. +1 555-0199") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("phone_auth_number_field")
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                if (phoneName.isBlank() || phoneNumber.isBlank()) {
                                    errorMessage = "Please enter both a display name and a phone number to sign in."
                                    return@Button
                                }
                                onAuthSuccess(phoneNumber.trim(), phoneName.trim(), "Hey there! I am using VIBEZ.")
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = WhatsAppEmerald,
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(27.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp)
                                .shadow(elevation = 2.dp, shape = RoundedCornerShape(27.dp))
                                .testTag("phone_auth_submit_btn")
                        ) {
                            Text(
                                text = "Sign in with Phone Number",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Subtle Privacy & Security Note
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Encrypted",
                        tint = WhatsAppEmerald,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "End-to-end encrypted messaging",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (errorMessage != null) {
                    AlertDialog(
                        onDismissRequest = { errorMessage = null },
                        title = { Text("Authentication Note", fontWeight = FontWeight.Bold) },
                        text = { Text(errorMessage!!) },
                        confirmButton = {
                            TextButton(onClick = { errorMessage = null }) {
                                Text("OK")
                            }
                        },
                        shape = RoundedCornerShape(20.dp)
                    )
                }
            }
        }
    }
}
