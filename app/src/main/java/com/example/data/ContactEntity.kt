package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "contacts")
data class ContactEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val phoneNumber: String,
    val avatarUrl: String = "",
    val aboutStatus: String = "Hey there! I am using VIBEZ.",
    val isOnline: Boolean = false,
    val lastSeen: String = "Recently"
)
