package com.example.util

import android.content.Context
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
        try {
            mediaPlayer = MediaPlayer().apply {
                if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://") || mediaUrl.startsWith("content://") || mediaUrl.startsWith("file://")) {
                    setDataSource(context, Uri.parse(mediaUrl))
                } else {
                    val file = File(mediaUrl)
                    if (file.exists()) {
                        setDataSource(file.absolutePath)
                    } else {
                        setDataSource(context, Uri.parse(mediaUrl))
                    }
                }
                prepare()
                start()
                this@AudioPlayer.isPlaying = true
                setOnCompletionListener {
                    this@AudioPlayer.isPlaying = false
                    onCompletionListener?.invoke()
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

    fun getCurrentPosition(): Int = mediaPlayer?.currentPosition ?: 0
    fun getDuration(): Int = mediaPlayer?.duration ?: 0
}
