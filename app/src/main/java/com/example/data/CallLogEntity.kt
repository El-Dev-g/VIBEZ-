package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

data class CallLogEntity(
    val id: String = "",
    val contactId: String,
    val contactName: String,
    val contactAvatar: String = "",
    val callType: String = "VOICE", // VOICE, VIDEO
    val isIncoming: Boolean = true,
    val isMissed: Boolean = false,
    val timestamp: Long = System.currentTimeMillis(),
    val durationSeconds: Int = 0
)
