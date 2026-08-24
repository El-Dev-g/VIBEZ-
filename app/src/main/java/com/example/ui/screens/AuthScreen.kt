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
    var isSigningIn by remember { mutableStateOf(false) }
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
                // Centered Google Brand Icon Circle
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
                        Icon(
                            painter = painterResource(id = R.drawable.ic_google_logo),
                            contentDescription = "Google",
                            tint = Color.Unspecified,
                            modifier = Modifier.size(48.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

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
                    text = "Sign in with Google to continue",
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(36.dp))

                // Centered Google Sign-In Button
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
                                    val googleIdOption = GetGoogleIdOption.Builder()
                                        .setFilterByAuthorizedAccounts(false)
                                        .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                                        .setAutoSelectEnabled(true)
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
                                    isSigningIn = false
                                } catch (e: Exception) {
                                    e.printStackTrace()
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
                            // Centered Google G icon
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
            }
        }
    }
}
