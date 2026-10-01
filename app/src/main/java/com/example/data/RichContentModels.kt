package com.example.data

import com.google.gson.Gson

data class PollOption(
    val id: Int,
    val text: String,
    val voterUserIds: MutableList<String> = mutableListOf()
)

data class PollData(
    val id: String = "",
    val question: String,
    val options: List<PollOption>,
    val allowMultiple: Boolean = false,
    val creatorId: String = "ME",
    val totalVotes: Int = 0
) {
    fun toJson(): String {
        return Gson().toJson(this)
    }

    companion object {
        fun fromJson(json: String?): PollData? {
            if (json.isNullOrBlank()) return null
            return try {
                Gson().fromJson(json, PollData::class.java)
            } catch (e: Exception) {
                null
            }
        }
    }
}

data class StickerItem(
    val id: String,
    val name: String,
    val emoji: String,
    val animationUrl: String = "",
    val category: String = "Popular"
)

object StickerRepository {
    val samplePacks = listOf(
        StickerItem("s1", "Party Vibes", "🎉", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif", "Vibes"),
        StickerItem("s2", "Fire Energy", "🔥", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif", "Vibes"),
        StickerItem("s3", "Mind Blown", "🤯", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.gif", "Reactions"),
        StickerItem("s4", "Sparkling Heart", "💖", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.gif", "Love"),
        StickerItem("s5", "Cool Shades", "😎", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif", "Cool"),
        StickerItem("s6", "Laughing Tears", "😂", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif", "Funny"),
        StickerItem("s7", "Rocket Moon", "🚀", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif", "Vibes"),
        StickerItem("s8", "Clapping Hands", "👏", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif", "Reactions"),
        StickerItem("s9", "Thinking Cloud", "🤔", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif", "Reactions"),
        StickerItem("s10", "Diamond Sparkle", "💎", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.gif", "Cool"),
        StickerItem("s11", "Trophy Winner", "🏆", "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.gif", "Vibes"),
        StickerItem("s12", "Salute Respect", "🫡", "https://fonts.gstatic.com/s/e/notoemoji/latest/1fae1/512.gif", "Reactions")
    )
}

data class CreatorTip(
    val id: String = "",
    val channelId: String,
    val creatorName: String,
    val amount: Double,
    val currency: String = "USD",
    val paymentMethod: String = "CARD", // CARD, MOMO, CRYPTO
    val note: String = "",
    val timestamp: Long = System.currentTimeMillis()
)

data class CallParticipant(
    val userId: String,
    val name: String,
    val avatarUrl: String = "",
    val isMuted: Boolean = false,
    val isVideoEnabled: Boolean = true,
    val isScreenSharing: Boolean = false,
    val isSpeaking: Boolean = false,
    val reactionEmoji: String? = null
)
