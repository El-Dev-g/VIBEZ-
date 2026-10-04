package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chats")
data class ChatEntity(
    @PrimaryKey val id: String = "",
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
    val isMuted: Boolean = false,
    val customWallpaper: String? = null,
    val isVerified: Boolean = false,
    val isOfficial: Boolean = false,
    val allowComments: Boolean = true,
    val allowReactions: Boolean = true,
    val ephemeralDuration: Int = 0,
    val isLocked: Boolean = false,
    val isSubscriberOnly: Boolean = false,
    val subscriptionPrice: Double = 0.0,
    val isSubscribed: Boolean = false
)
