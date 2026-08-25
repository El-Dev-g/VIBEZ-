package com.example.data

data class CommunityEntity(
    val id: String = "",
    val name: String,
    val description: String = "",
    val avatarUrl: String = "",
    val membersCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val isOfficial: Boolean = false,
    val allowComments: Boolean = true,
    val allowReactions: Boolean = true
)
