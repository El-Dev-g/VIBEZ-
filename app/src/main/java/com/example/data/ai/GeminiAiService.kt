package com.example.data.ai

import android.util.Base64
import android.util.Log
import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

object GeminiAiService {
    private const val TAG = "GeminiAiService"
    private const val MODEL_NAME = "gemini-3.5-flash"
    private const val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val apiKey: String
        get() = try {
            BuildConfig.GEMINI_API_KEY
        } catch (e: Exception) {
            ""
        }

    suspend fun askAiAssistant(
        prompt: String,
        chatHistory: List<Pair<String, String>> = emptyList()
    ): String = withContext(Dispatchers.IO) {
        if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY") {
            return@withContext "✨ Hello! I'm Vibez AI, your personal assistant in Vibez. To activate live Gemini AI responses, please add your Gemini API key in AI Studio Secrets panel. Meanwhile, feel free to explore or draft questions!"
        }

        try {
            val url = "$BASE_URL/$MODEL_NAME:generateContent?key=$apiKey"
            val contentsArray = JSONArray()

            // System prompt + context
            val systemObj = JSONObject().apply {
                put("role", "user")
                put("parts", JSONArray().put(JSONObject().put("text", 
                    "You are VIBEZ AI, an intelligent, helpful, and concise assistant integrated directly inside the VIBEZ messenger. Keep answers snappy, formatting clean, and conversational."
                )))
            }
            contentsArray.put(systemObj)

            // Conversation history
            chatHistory.takeLast(6).forEach { (sender, text) ->
                val role = if (sender.equals("AI", ignoreCase = true) || sender.equals("Assistant", ignoreCase = true)) "model" else "user"
                val item = JSONObject().apply {
                    put("role", role)
                    put("parts", JSONArray().put(JSONObject().put("text", "$sender: $text")))
                }
                contentsArray.put(item)
            }

            // Current prompt
            val userMsg = JSONObject().apply {
                put("role", "user")
                put("parts", JSONArray().put(JSONObject().put("text", prompt)))
            }
            contentsArray.put(userMsg)

            val payload = JSONObject().apply {
                put("contents", contentsArray)
                put("generationConfig", JSONObject().apply {
                    put("temperature", 0.7)
                    put("maxOutputTokens", 1024)
                })
            }

            val request = Request.Builder()
                .url(url)
                .post(payload.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    Log.e(TAG, "Gemini API failed: ${response.code} $body")
                    return@withContext "🤖 [VIBEZ AI]: Unable to process request (HTTP ${response.code})."
                }

                val json = JSONObject(body)
                val candidates = json.optJSONArray("candidates")
                if (candidates != null && candidates.length() > 0) {
                    val first = candidates.getJSONObject(0)
                    val content = first.optJSONObject("content")
                    val parts = content?.optJSONArray("parts")
                    if (parts != null && parts.length() > 0) {
                        return@withContext parts.getJSONObject(0).optString("text", "No response received.")
                    }
                }
                "🤖 [VIBEZ AI]: No response generated."
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error querying Gemini", e)
            "🤖 [VIBEZ AI Error]: ${e.localizedMessage ?: "Failed to generate AI response"}"
        }
    }

    suspend fun transcribeAudio(audioFile: File): String = withContext(Dispatchers.IO) {
        if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY") {
            return@withContext "🎙️ [Transcribed Voice Note]: Audio received. (Set GEMINI_API_KEY for live AI transcription)."
        }

        try {
            if (!audioFile.exists() || audioFile.length() == 0L) {
                return@withContext "Audio file is empty or unavailable."
            }

            val bytes = audioFile.readBytes()
            val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
            val mimeType = when {
                audioFile.name.endsWith(".m4a", true) -> "audio/mp4"
                audioFile.name.endsWith(".mp3", true) -> "audio/mp3"
                audioFile.name.endsWith(".wav", true) -> "audio/wav"
                else -> "audio/aac"
            }

            val url = "$BASE_URL/$MODEL_NAME:generateContent?key=$apiKey"
            val promptPart = JSONObject().put("text", "Transcribe the following voice note verbatim into clear text. Do not add conversational commentary, just output the transcription text:")
            val inlineData = JSONObject().apply {
                put("mimeType", mimeType)
                put("data", base64)
            }
            val audioPart = JSONObject().put("inlineData", inlineData)

            val content = JSONObject().apply {
                put("role", "user")
                put("parts", JSONArray().put(promptPart).put(audioPart))
            }

            val payload = JSONObject().apply {
                put("contents", JSONArray().put(content))
            }

            val request = Request.Builder()
                .url(url)
                .post(payload.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    return@withContext "Transcription unavailable (HTTP ${response.code})."
                }

                val json = JSONObject(body)
                val candidates = json.optJSONArray("candidates")
                val text = candidates?.optJSONObject(0)
                    ?.optJSONObject("content")
                    ?.optJSONArray("parts")
                    ?.optJSONObject(0)
                    ?.optString("text")

                return@withContext text?.trim() ?: "Could not transcribe audio."
            }
        } catch (e: Exception) {
            Log.e(TAG, "Audio transcription failed", e)
            "Transcription error: ${e.localizedMessage}"
        }
    }

    suspend fun translateText(text: String, targetLanguage: String): String = withContext(Dispatchers.IO) {
        if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY") {
            return@withContext text
        }
        val prompt = "Translate the following message directly into $targetLanguage. Output only the translated message without explanation:\n\n\"$text\""
        askAiAssistant(prompt)
    }
}
