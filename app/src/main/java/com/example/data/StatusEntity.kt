package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "statuses")
data class StatusEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val contactId: Long,
    val contactName: String,
    val contactAvatar: String = "",
    val mediaType: String = "IMAGE", // IMAGE, TEXT
    val mediaUrl: String = "",
    val textCaption: String = "",
    val backgroundColorHex: String = "#075E54",
    val timestamp: Long = System.currentTimeMillis(),
    val isViewed: Boolean = false,
    val isMyStatus: Boolean = false,
    val songTitle: String? = null,
    val songArtist: String? = null,
    val songPreviewUrl: String? = null,
    val musicOffsetX: Float = 0.5f, // Normalized 0-1
    val musicOffsetY: Float = 0.5f,  // Normalized 0-1
    val videoDurationMillis: Long = 0
)
