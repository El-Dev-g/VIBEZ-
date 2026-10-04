package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "communities")
data class CommunityEntity(
    @PrimaryKey val id: String = "",
    val name: String,
    val description: String = "",
    val avatarUrl: String = "",
    val ownerId: String = "",
    val membersCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val isOfficial: Boolean = false,
    val allowComments: Boolean = true,
    val allowReactions: Boolean = true
)
