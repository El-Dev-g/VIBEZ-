package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

data class MessageEntity(
    val id: String = "",
    val remoteId: String? = null,
    val chatId: String,
    val senderId: String, // "ME" for Me, or contactId
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val status: String = "SENT", // SENT, DELIVERED, READ
    val messageType: String = "TEXT", // TEXT, IMAGE, VOICE, DOCUMENT, LOCATION
    val mediaUrl: String = "",
    val voiceDurationSeconds: Int = 0,
    val isStarred: Boolean = false,
    val replyToMessageId: String? = null,
    val reaction: String? = null
)
