package com.example.util

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.util.Log
import java.io.File

class AudioPlayer(private val context: Context) {

    private var mediaPlayer: MediaPlayer? = null
    var onCompletionListener: (() -> Unit)? = null
    var isPlaying: Boolean = false
        private set

    fun play(mediaUrl: String, onProgress: ((Float, Int) -> Unit)? = null) {
        stop()
        if (mediaUrl.isBlank()) return
        try {
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )

                setOnCompletionListener {
                    this@AudioPlayer.isPlaying = false
                    onCompletionListener?.invoke()
                }

                setOnErrorListener { _, what, extra ->
                    Log.e("AudioPlayer", "MediaPlayer error: what=$what, extra=$extra")
                    this@AudioPlayer.isPlaying = false
                    onCompletionListener?.invoke()
                    true
                }

                if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://") || mediaUrl.startsWith("content://")) {
                    setDataSource(context, Uri.parse(mediaUrl))
                    setOnPreparedListener { mp ->
                        try {
                            mp.start()
                            this@AudioPlayer.isPlaying = true
                        } catch (e: Exception) {
                            Log.e("AudioPlayer", "Error starting async playback: ${e.message}", e)
                        }
                    }
                    prepareAsync()
                } else {
                    val file = if (mediaUrl.startsWith("file://")) {
                        File(Uri.parse(mediaUrl).path ?: mediaUrl.removePrefix("file://"))
                    } else {
                        File(mediaUrl)
                    }

                    if (file.exists()) {
                        setDataSource(file.absolutePath)
                    } else {
                        setDataSource(context, Uri.parse(mediaUrl))
                    }
                    prepare()
                    start()
                    this@AudioPlayer.isPlaying = true
                }
            }
        } catch (e: Exception) {
            Log.e("AudioPlayer", "Failed to play audio: ${e.message}", e)
            isPlaying = false
            mediaPlayer?.release()
            mediaPlayer = null
        }
    }

    fun pause() {
        try {
            mediaPlayer?.pause()
            isPlaying = false
        } catch (e: Exception) {
            Log.e("AudioPlayer", "Error pausing audio: ${e.message}", e)
        }
    }

    fun resume() {
        try {
            mediaPlayer?.start()
            isPlaying = true
        } catch (e: Exception) {
            Log.e("AudioPlayer", "Error resuming audio: ${e.message}", e)
        }
    }

    fun stop() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
        } catch (_: Exception) {
        } finally {
            mediaPlayer = null
            isPlaying = false
        }
    }

    fun getCurrentPosition(): Int = try { mediaPlayer?.currentPosition ?: 0 } catch (_: Exception) { 0 }
    fun getDuration(): Int = try { mediaPlayer?.duration ?: 0 } catch (_: Exception) { 0 }
}
