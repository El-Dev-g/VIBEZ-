package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.WhatsAppViewModel
import kotlinx.coroutines.delay

private val WhatsAppEmerald = Color(0xFF00A884)
private val WhatsAppDarkBg = Color(0xFF0B141A)
private val WhatsAppSurface = Color(0xFF111B21)
private val WhatsAppDivider = Color(0xFF202C33)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportUserScreen(
    reportedUserId: String,
    reportedUserName: String,
    viewModel: WhatsAppViewModel,
    onBackClick: () -> Unit
) {
    var selectedReason by remember { mutableStateOf("Spam") }
    var description by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var resultMessage by remember { mutableStateOf<String?>(null) }
    var isSuccess by remember { mutableStateOf(false) }

    val reasons = listOf(
        "Spam",
        "Harassment or Abuse",
        "Inappropriate Content",
        "Fraud or Scam",
        "Impersonation",
        "Other"
    )

    val keyboardController = LocalSoftwareKeyboardController.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Report User",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = WhatsAppSurface
                )
            )
        },
        contentWindowInsets = WindowInsets.safeDrawing
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(WhatsAppDarkBg)
                .padding(paddingValues)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Warning Hero Header
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(Color.Red.copy(alpha = 0.15f), RoundedCornerShape(32.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Warning",
                        tint = Color.Red,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Report $reportedUserName",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Your report is anonymous. We will review this user's recent messages, activity, and account status.",
                    fontSize = 13.sp,
                    color = Color.Gray,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Reasons Card List
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = WhatsAppSurface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(vertical = 8.dp)) {
                        Text(
                            text = "SELECT A REASON",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = WhatsAppEmerald,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                        )

                        reasons.forEach { reason ->
                            val isSelected = selectedReason == reason
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedReason = reason }
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = isSelected,
                                    onClick = { selectedReason = reason },
                                    colors = RadioButtonDefaults.colors(
                                        selectedColor = WhatsAppEmerald,
                                        unselectedColor = Color.Gray
                                    )
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = reason,
                                    fontSize = 15.sp,
                                    color = if (isSelected) Color.White else Color.LightGray,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                            if (reason != reasons.last()) {
                                Divider(color = WhatsAppDivider, thickness = 1.dp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Additional Details Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = WhatsAppSurface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "ADDITIONAL DETAILS",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = WhatsAppEmerald,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            placeholder = { Text("Please describe the behavior or what happened...", fontSize = 14.sp) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .testTag("report_details_input"),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = WhatsAppEmerald,
                                unfocusedBorderColor = WhatsAppDivider,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.LightGray,
                                cursorColor = WhatsAppEmerald,
                                focusedContainerColor = WhatsAppDarkBg,
                                unfocusedContainerColor = WhatsAppDarkBg
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(30.dp))

                // Submit Button
                Button(
                    onClick = {
                        isSubmitting = true
                        keyboardController?.hide()
                        val finalReason = "$selectedReason - $description"
                        viewModel.reportUser(reportedUserId, finalReason) { success, msg ->
                            isSubmitting = false
                            isSuccess = success
                            resultMessage = msg
                        }
                    },
                    enabled = !isSubmitting,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("submit_report_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = WhatsAppEmerald,
                        disabledContainerColor = WhatsAppEmerald.copy(alpha = 0.5f)
                    ),
                    shape = RoundedCornerShape(25.dp)
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Text(
                            text = "Submit Report",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
            }

            // Status Message Dialog
            if (resultMessage != null) {
                AlertDialog(
                    onDismissRequest = {
                        val wasSuccess = isSuccess
                        resultMessage = null
                        if (wasSuccess) {
                            onBackClick()
                        }
                    },
                    icon = {
                        Icon(
                            imageVector = if (isSuccess) Icons.Default.CheckCircle else Icons.Default.Warning,
                            contentDescription = if (isSuccess) "Success" else "Error",
                            tint = if (isSuccess) WhatsAppEmerald else Color.Red,
                            modifier = Modifier.size(40.dp)
                        )
                    },
                    title = {
                        Text(
                            text = if (isSuccess) "Report Submitted" else "Error Submitting Report",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    },
                    text = {
                        Text(
                            text = resultMessage ?: "",
                            fontSize = 14.sp,
                            color = Color.LightGray,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                val wasSuccess = isSuccess
                                resultMessage = null
                                if (wasSuccess) {
                                    onBackClick()
                                }
                            }
                        ) {
                            Text("OK", color = WhatsAppEmerald, fontWeight = FontWeight.Bold)
                        }
                    },
                    containerColor = WhatsAppSurface
                )
            }
        }
    }
}
