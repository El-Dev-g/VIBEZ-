package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
fun AutomatedMessagesScreen(
    onBackClick: () -> Unit,
    initialGreetingEnabled: Boolean = true,
    initialGreetingText: String = "Thank you for contacting us! How can we help you today?",
    initialAwayEnabled: Boolean = true,
    initialAwayText: String = "Thank you for reaching out! We are currently outside of business hours and will reply to your message first thing tomorrow morning.",
    initialSchedule: String = "Outside of business hours",
    onSaveAutomatedMessages: (greetingOn: Boolean, greeting: String, awayOn: Boolean, away: String, schedule: String) -> Unit = { _, _, _, _, _ -> }
) {
    var greetingEnabled by remember { mutableStateOf(initialGreetingEnabled) }
    var greetingText by remember { mutableStateOf(initialGreetingText) }
    var awayEnabled by remember { mutableStateOf(initialAwayEnabled) }
    var awayText by remember { mutableStateOf(initialAwayText) }
    var scheduleOption by remember { mutableStateOf(initialSchedule) }
    var showSnackbar by remember { mutableStateOf(false) }

    val schedules = listOf("Always send", "Outside of business hours", "Custom schedule")
    var scheduleExpanded by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Automated messages", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick, modifier = Modifier.testTag("automated_messages_back_btn")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    TextButton(
                        onClick = {
                            onSaveAutomatedMessages(greetingEnabled, greetingText, awayEnabled, awayText, scheduleOption)
                            showSnackbar = true
                        },
                        modifier = Modifier.testTag("save_automated_messages_btn")
                    ) {
                        Text("SAVE", fontWeight = FontWeight.Bold, color = WhatsAppEmerald)
                    }
                }
            )
        },
        snackbarHost = {
            if (showSnackbar) {
                Snackbar(
                    action = { TextButton(onClick = { showSnackbar = false }) { Text("OK", color = Color.White) } },
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text("Automated messages saved!")
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // CARD 1: Greeting Message
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth().testTag("greeting_message_card")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(WhatsAppMinimalPrimary.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.WavingHand, contentDescription = null, tint = WhatsAppMinimalPrimary)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Greeting message", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Greet customers automatically", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(
                            checked = greetingEnabled,
                            onCheckedChange = { greetingEnabled = it },
                            modifier = Modifier.testTag("greeting_toggle_switch")
                        )
                    }

                    if (greetingEnabled) {
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = greetingText,
                            onValueChange = { greetingText = it },
                            label = { Text("Greeting text") },
                            minLines = 3,
                            modifier = Modifier.fillMaxWidth().testTag("input_greeting_text")
                        )
                    }
                }
            }

            // CARD 2: Away Message
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth().testTag("away_message_card")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(WhatsAppEmerald.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.NightlightRound, contentDescription = null, tint = WhatsAppEmerald)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Away message", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Reply when you are away", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(
                            checked = awayEnabled,
                            onCheckedChange = { awayEnabled = it },
                            modifier = Modifier.testTag("away_toggle_switch")
                        )
                    }

                    if (awayEnabled) {
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = awayText,
                            onValueChange = { awayText = it },
                            label = { Text("Away text") },
                            minLines = 3,
                            modifier = Modifier.fillMaxWidth().testTag("input_away_text")
                        )

                        Spacer(modifier = Modifier.height(12.dp))
                        ExposedDropdownMenuBox(
                            expanded = scheduleExpanded,
                            onExpandedChange = { scheduleExpanded = !scheduleExpanded },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OutlinedTextField(
                                value = scheduleOption,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Schedule") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = scheduleExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth().testTag("input_away_schedule")
                            )
                            ExposedDropdownMenu(
                                expanded = scheduleExpanded,
                                onDismissRequest = { scheduleExpanded = false }
                            ) {
                                schedules.forEach { opt ->
                                    DropdownMenuItem(
                                        text = { Text(opt) },
                                        onClick = {
                                            scheduleOption = opt
                                            scheduleExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = {
                    onSaveAutomatedMessages(greetingEnabled, greetingText, awayEnabled, awayText, scheduleOption)
                    showSnackbar = true
                },
                modifier = Modifier.fillMaxWidth().height(48.dp).testTag("submit_save_automated_messages_button"),
                colors = ButtonDefaults.buttonColors(containerColor = WhatsAppMinimalPrimary)
            ) {
                Text("Save Settings", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
