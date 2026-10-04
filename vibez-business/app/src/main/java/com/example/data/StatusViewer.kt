package com.example.data

data class StatusViewer(
    val contactId: String,
    val name: String,
    val avatarUrl: String = "",
    val phoneNumber: String = "",
    val viewedTimestamp: Long,
    val timeAgoFormatted: String
)
