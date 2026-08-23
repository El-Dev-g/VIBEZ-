package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val chatId: Long,
    val senderId: Long, // 0 for Me, or contactId
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val status: String = "READ", // SENT, DELIVERED, READ
    val messageType: String = "TEXT", // TEXT, IMAGE, VOICE, DOCUMENT, LOCATION
    val mediaUrl: String = "",
    val voiceDurationSeconds: Int = 0,
    val isStarred: Boolean = false,
    val replyToMessageId: Long? = null,
    val reaction: String? = null
)
