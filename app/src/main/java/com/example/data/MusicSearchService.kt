package com.example.data

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder

data class MusicTrack(
    val title: String,
    val artist: String,
    val duration: String = "0:00",
    val previewUrl: String? = null,
    val artworkUrl: String? = null
)

object MusicSearchService {
    private val client = OkHttpClient()

    suspend fun searchTracks(query: String): List<MusicTrack> = withContext(Dispatchers.IO) {
        if (query.isBlank()) return@withContext emptyList()
        try {
            val encodedQuery = URLEncoder.encode(query, "UTF-8")
            val url = "https://itunes.apple.com/search?term=$encodedQuery&media=music&limit=10"
            val request = Request.Builder()
                .url(url)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val bodyString = response.body?.string() ?: return@withContext emptyList()
                val jsonObject = JSONObject(bodyString)
                val resultsArray = jsonObject.optJSONArray("results") ?: return@withContext emptyList()
                val tracks = mutableListOf<MusicTrack>()
                for (i in 0 until resultsArray.length()) {
                    val trackObj = resultsArray.optJSONObject(i) ?: continue
                    val trackName = trackObj.optString("trackName", "")
                    val artistName = trackObj.optString("artistName", "")
                    val previewUrl = trackObj.optString("previewUrl", "")
                    val artworkUrl = trackObj.optString("artworkUrl100", "")
                    val durationMillis = trackObj.optLong("trackTimeMillis", 0L)
                    
                    if (trackName.isNotBlank() && artistName.isNotBlank()) {
                        val seconds = (durationMillis / 1000) % 60
                        val minutes = (durationMillis / (1000 * 60)) % 60
                        val durationStr = String.format("%d:%02d", minutes, seconds)
                        
                        tracks.add(
                            MusicTrack(
                                title = trackName,
                                artist = artistName,
                                duration = durationStr,
                                previewUrl = if (previewUrl.isNotBlank()) previewUrl else null,
                                artworkUrl = if (artworkUrl.isNotBlank()) artworkUrl else null
                            )
                        )
                    }
                }
                tracks
            }
        } catch (e: Exception) {
            Log.e("MusicSearchService", "Error searching music: ", e)
            // Fallback list of popular mock songs if network is unavailable
            listOf(
                MusicTrack("Blinding Lights", "The Weeknd"),
                MusicTrack("Shape of You", "Ed Sheeran"),
                MusicTrack("As It Was", "Harry Styles"),
                MusicTrack("Bad Habits", "Ed Sheeran"),
                MusicTrack("Levitating", "Dua Lipa"),
                MusicTrack("Save Your Tears", "The Weeknd"),
                MusicTrack("Perfect", "Ed Sheeran"),
                MusicTrack("Stay", "The Kid LAROI & Justin Bieber"),
                MusicTrack("Flowers", "Miley Cyrus"),
                MusicTrack("Cold Heart", "Elton John & Dua Lipa")
            ).filter { it.title.contains(query, ignoreCase = true) || it.artist.contains(query, ignoreCase = true) }
        }
    }
}
