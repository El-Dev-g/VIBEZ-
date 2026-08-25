package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

data class ContactEntity(
    val id: String = "",
    val remoteId: String? = null,
    val name: String,
    val phoneNumber: String,
    val avatarUrl: String = "",
    val aboutStatus: String = "Hey there! I am using VIBEZ.",
    val isOnline: Boolean = false,
    val lastSeen: String = "Recently",
    val isVerified: Boolean = false
)
