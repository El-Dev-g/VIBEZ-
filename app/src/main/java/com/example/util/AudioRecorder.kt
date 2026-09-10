package com.example.util

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import java.io.File
import java.io.IOException

class AudioRecorder(private val context: Context) {

    private var recorder: MediaRecorder? = null
    private var currentOutputFile: File? = null
    private var recordingStartTimeMs: Long = 0

    fun startRecording(): File? {
        try {
            cancelRecording()
            val outputDir = File(context.cacheDir, "voice_notes").apply {
                if (!exists()) mkdirs()
            }
            val outputFile = File(outputDir, "VN_${System.currentTimeMillis()}.m4a")
            currentOutputFile = outputFile

            val newRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            try {
                newRecorder.apply {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioEncodingBitRate(128000)
                    setAudioSamplingRate(44100)
                    setOutputFile(outputFile.absolutePath)
                    prepare()
                    start()
                }
            } catch (e: Exception) {
                Log.w("AudioRecorder", "High-quality audio setup failed, using default AAC config: ${e.message}")
                try {
                    newRecorder.reset()
                } catch (_: Exception) {}
                newRecorder.apply {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setOutputFile(outputFile.absolutePath)
                    prepare()
                    start()
                }
            }

            recorder = newRecorder
            recordingStartTimeMs = System.currentTimeMillis()
            return outputFile
        } catch (e: IOException) {
            Log.e("AudioRecorder", "Failed to start recording: ${e.message}", e)
            cancelRecording()
            return null
        } catch (e: Exception) {
            Log.e("AudioRecorder", "Recording exception: ${e.message}", e)
            cancelRecording()
            return null
        }
    }

    fun stopRecording(): File? {
        val durationMs = System.currentTimeMillis() - recordingStartTimeMs
        if (durationMs < 400) {
            // Android MediaRecorder throws if stopped too quickly; brief delay ensures minimum frames written
            try {
                Thread.sleep(400 - durationMs)
            } catch (_: Exception) {}
        }

        return try {
            recorder?.stop()
            try { recorder?.release() } catch (_: Exception) {}
            recorder = null

            val file = currentOutputFile
            if (file != null && file.exists() && file.length() > 0) {
                file
            } else {
                cancelRecording()
                null
            }
        } catch (e: Exception) {
            Log.e("AudioRecorder", "Error stopping recorder: ${e.message}", e)
            try { recorder?.release() } catch (_: Exception) {}
            recorder = null

            val file = currentOutputFile
            if (file != null && file.exists() && file.length() > 0) {
                file
            } else {
                cancelRecording()
                null
            }
        }
    }

    fun cancelRecording() {
        try {
            try { recorder?.stop() } catch (_: Exception) {}
            try { recorder?.release() } catch (_: Exception) {}
        } catch (_: Exception) {
        } finally {
            recorder = null
            currentOutputFile?.let {
                if (it.exists()) it.delete()
            }
            currentOutputFile = null
        }
    }

    fun getMaxAmplitude(): Int {
        return try {
            recorder?.maxAmplitude ?: 0
        } catch (_: Exception) {
            0
        }
    }
}
