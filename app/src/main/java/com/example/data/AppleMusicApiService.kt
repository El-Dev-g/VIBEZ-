package com.example.data

import com.squareup.moshi.Json
import retrofit2.http.GET
import retrofit2.http.Query

interface AppleMusicApiService {
    @GET("search")
    suspend fun searchMusic(
        @Query("term") term: String,
        @Query("media") media: String = "music",
        @Query("limit") limit: Int = 20
    ): ITunesSearchResponse
}

data class ITunesSearchResponse(
    @Json(name = "resultCount") val resultCount: Int,
    @Json(name = "results") val results: List<ITunesResult>
)

data class ITunesResult(
    @Json(name = "trackId") val trackId: Long,
    @Json(name = "trackName") val trackName: String?,
    @Json(name = "artistName") val artistName: String?,
    @Json(name = "previewUrl") val previewUrl: String?,
    @Json(name = "artworkUrl100") val artworkUrl: String?,
    @Json(name = "trackTimeMillis") val durationMillis: Long?
)
