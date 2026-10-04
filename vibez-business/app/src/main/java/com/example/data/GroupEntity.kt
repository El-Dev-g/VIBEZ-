package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "groups")
data class GroupEntity(
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
    val allowComments: Boolean = true,
    val ephemeralDuration: Int = 0,
    val isLocked: Boolean = false,
    val creatorId: String = "",
    val memberIds: List<String> = emptyList()
)
fun GroupEntity.toChatEntity(): ChatEntity {
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
        isOfficial = false,
        allowComments = this.allowComments,
        ephemeralDuration = this.ephemeralDuration,
        isLocked = this.isLocked
    )
}
