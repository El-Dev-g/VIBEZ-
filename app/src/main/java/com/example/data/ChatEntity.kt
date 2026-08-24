package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

data class ChatEntity(
    val id: String = "",
    val remoteId: String? = null,
    val contactId: String,
    val contactName: String,
    val contactAvatar: String = "",
    val lastMessage: String = "",
    val lastMessageTime: Long = System.currentTimeMillis(),
    val unreadCount: Int = 0,
    val isPinned: Boolean = false,
    val isArchived: Boolean = false,
    val isGroup: Boolean = false,
    val isMuted: Boolean = false
)
