package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "channels")
data class ChannelEntity(
    @PrimaryKey val id: String = "",
    val remoteId: String? = null,
    val name: String,
    val avatarUrl: String = "",
    val lastMessage: String = "",
    val lastMessageTime: Long = System.currentTimeMillis(),
    val unreadCount: Int = 0,
    val isPinned: Boolean = false,
    val isMuted: Boolean = false,
    val customWallpaper: String? = null,
    val isVerified: Boolean = false,
    val isOfficial: Boolean = true,
    val allowComments: Boolean = true,
    val subscriberCount: Int = 0,
    val isSubscribed: Boolean = false,
    val memberIds: List<String> = emptyList()
)
fun ChannelEntity.toChatEntity(): ChatEntity {
    return ChatEntity(
        id = this.id,
        remoteId = this.remoteId,
        contactId = "",
        contactName = this.name,
        contactAvatar = this.avatarUrl,
        lastMessage = this.lastMessage,
        lastMessageTime = this.lastMessageTime,
        unreadCount = this.unreadCount,
        isPinned = this.isPinned,
        isGroup = true,
        isMuted = this.isMuted,
        customWallpaper = this.customWallpaper,
        isVerified = this.isVerified,
        isOfficial = true,
        allowComments = this.allowComments,
        isSubscribed = this.isSubscribed
    )
}
