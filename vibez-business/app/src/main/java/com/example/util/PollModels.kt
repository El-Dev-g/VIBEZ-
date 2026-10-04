package com.example.util

import org.json.JSONArray
import org.json.JSONObject

data class PollOption(
    val index: Int,
    val text: String,
    val voterIds: List<String> = emptyList()
)

data class PollData(
    val id: String,
    val question: String,
    val options: List<PollOption>,
    val allowMultiple: Boolean = false,
    val creatorId: String = ""
) {
    val totalVotes: Int get() = options.sumOf { it.voterIds.size }

    fun percentageFor(optionIndex: Int): Float {
        val total = totalVotes
        if (total == 0) return 0f
        val opt = options.getOrNull(optionIndex) ?: return 0f
        return (opt.voterIds.size.toFloat() / total.toFloat())
    }

    fun hasVoted(userId: String): Boolean {
        return options.any { it.voterIds.contains(userId) }
    }

    fun isOptionSelectedBy(optionIndex: Int, userId: String): Boolean {
        return options.getOrNull(optionIndex)?.voterIds?.contains(userId) == true
    }

    fun toJsonString(): String {
        val root = JSONObject()
        root.put("id", id)
        root.put("question", question)
        root.put("allowMultiple", allowMultiple)
        root.put("creatorId", creatorId)

        val optionsArr = JSONArray()
        options.forEach { opt ->
            val optObj = JSONObject()
            optObj.put("index", opt.index)
            optObj.put("text", opt.text)
            val votersArr = JSONArray()
            opt.voterIds.forEach { votersArr.put(it) }
            optObj.put("voterIds", votersArr)
            optionsArr.put(optObj)
        }
        root.put("options", optionsArr)
        return root.toString()
    }

    companion object {
        fun fromJsonString(raw: String): PollData? {
            if (raw.isBlank() || !raw.trim().startsWith("{")) return null
            return try {
                val root = JSONObject(raw)
                val id = root.optString("id", "")
                val question = root.optString("question", "")
                val allowMultiple = root.optBoolean("allowMultiple", false)
                val creatorId = root.optString("creatorId", "")

                val options = mutableListOf<PollOption>()
                val optionsArr = root.optJSONArray("options")
                if (optionsArr != null) {
                    for (i in 0 until optionsArr.length()) {
                        val optObj = optionsArr.getJSONObject(i)
                        val idx = optObj.optInt("index", i)
                        val text = optObj.optString("text", "")
                        val voters = mutableListOf<String>()
                        val votersArr = optObj.optJSONArray("voterIds")
                        if (votersArr != null) {
                            for (j in 0 until votersArr.length()) {
                                voters.add(votersArr.getString(j))
                            }
                        }
                        options.add(PollOption(index = idx, text = text, voterIds = voters))
                    }
                }
                PollData(id = id, question = question, options = options, allowMultiple = allowMultiple, creatorId = creatorId)
            } catch (e: Exception) {
                null
            }
        }
    }
}

object StickerCollections {
    data class StickerItem(val id: String, val emoji: String, val label: String, val category: String)

    val allStickers = listOf(
        // Vibes
        StickerItem("vibe_fire", "🔥", "LIT VIBES", "Vibes"),
        StickerItem("vibe_bolt", "⚡", "HIGH ENERGY", "Vibes"),
        StickerItem("vibe_rocket", "🚀", "TO THE MOON", "Vibes"),
        StickerItem("vibe_gem", "💎", "PURE GEM", "Vibes"),
        StickerItem("vibe_crown", "👑", "CHAMPION", "Vibes"),
        StickerItem("vibe_party", "🎉", "CELEBRATE", "Vibes"),
        // Reactions
        StickerItem("react_love", "❤️", "BIG LOVE", "Reactions"),
        StickerItem("react_laugh", "😂", "DEAD LAUGHING", "Reactions"),
        StickerItem("react_cool", "😎", "CHILLING", "Reactions"),
        StickerItem("react_mindblown", "🤯", "MIND BLOWN", "Reactions"),
        StickerItem("react_eyes", "👀", "I SEE YOU", "Reactions"),
        StickerItem("react_100", "💯", "ONE HUNDRED", "Reactions"),
        // Lifestyle
        StickerItem("life_coffee", "☕", "COFFEE BREAK", "Lifestyle"),
        StickerItem("life_music", "🎧", "BEATS ON", "Lifestyle"),
        StickerItem("life_money", "💸", "BAG SECURED", "Lifestyle"),
        StickerItem("life_gaming", "🎮", "GAME TIME", "Lifestyle"),
        StickerItem("life_gym", "💪", "GRIND MODE", "Lifestyle"),
        StickerItem("life_travel", "✈️", "ON THE WAY", "Lifestyle")
    )
}
