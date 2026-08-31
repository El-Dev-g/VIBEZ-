package com.example.data.network

import android.util.Log
import com.example.BuildConfig
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager(private val userId: String) {
    private var socket: Socket? = null
    private val TAG = "SocketManager"
    
    var onCallOfferReceived: ((JSONObject) -> Unit)? = null
    var onCallAnswerReceived: ((JSONObject) -> Unit)? = null
    var onIceCandidateReceived: ((JSONObject) -> Unit)? = null
    var onTypingReceived: ((String, String, Boolean) -> Unit)? = null
    var onMessageReadReceived: ((String, String) -> Unit)? = null

    fun connect(onMessageReceived: (JSONObject) -> Unit) {
        try {
            val opts = IO.Options().apply {
                query = "userId=$userId"
            }
            val rawUrl = BuildConfig.BACKEND_URL.ifEmpty { "https://your-backend-url.com/" }
            val baseUrl = if (rawUrl.endsWith("/")) rawUrl.substring(0, rawUrl.length - 1) else rawUrl
            
            socket = IO.socket(baseUrl, opts)
            
            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Connected to socket server")
            }

            socket?.on("receive_message") { args ->
                val data = args[0] as JSONObject
                onMessageReceived(data)
            }

            socket?.on("typing") { args ->
                try {
                    val data = args[0] as JSONObject
                    val chatId = data.optString("chatId", "")
                    val senderId = data.optString("senderId", "")
                    val isTyping = data.optBoolean("isTyping", false)
                    onTypingReceived?.invoke(chatId, senderId, isTyping)
                } catch (e: Exception) {
                    Log.e(TAG, "Error handling typing event", e)
                }
            }

            socket?.on("message_read") { args ->
                try {
                    val data = args[0] as JSONObject
                    val chatId = data.optString("chatId", "")
                    val senderId = data.optString("senderId", "")
                    onMessageReadReceived?.invoke(chatId, senderId)
                } catch (e: Exception) {
                    Log.e(TAG, "Error handling message_read event", e)
                }
            }

            socket?.on("call_offer") { args ->
                val data = args[0] as JSONObject
                onCallOfferReceived?.invoke(data)
            }

            socket?.on("call_answer") { args ->
                val data = args[0] as JSONObject
                onCallAnswerReceived?.invoke(data)
            }

            socket?.on("ice_candidate") { args ->
                val data = args[0] as JSONObject
                onIceCandidateReceived?.invoke(data)
            }

            socket?.on("new_message_notification") { args ->
                val data = args[0] as JSONObject
                // Handle background notification or badge update
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Socket connection error", e)
        }
    }

    fun joinChat(chatId: String) {
        socket?.emit("join_chat", chatId)
    }

    fun sendMessage(chatId: String, senderId: String, receiverId: String?, content: String, type: String, mediaUrl: String? = null, duration: Int? = null, id: String? = null) {
        val data = JSONObject().apply {
            put("id", id ?: java.util.UUID.randomUUID().toString())
            put("chatId", chatId)
            put("senderId", senderId)
            put("receiverId", receiverId)
            put("content", content)
            put("type", type)
            put("mediaUrl", mediaUrl)
            put("duration", duration)
        }
        socket?.emit("send_message", data)
    }

    fun emitTyping(chatId: String, isTyping: Boolean) {
        val data = JSONObject().apply {
            put("chatId", chatId)
            put("isTyping", isTyping)
        }
        socket?.emit("typing", data)
    }

    fun emitMessageRead(chatId: String, senderId: String) {
        val data = JSONObject().apply {
            put("chatId", chatId)
            put("senderId", senderId)
        }
        socket?.emit("message_read", data)
    }

    fun sendCallOffer(targetUserId: String, sdp: String) {
        val data = JSONObject().apply {
            put("targetUserId", targetUserId)
            put("sdp", sdp)
        }
        socket?.emit("call_offer", data)
    }

    fun sendCallAnswer(targetUserId: String, sdp: String) {
        val data = JSONObject().apply {
            put("targetUserId", targetUserId)
            put("sdp", sdp)
        }
        socket?.emit("call_answer", data)
    }

    fun sendIceCandidate(targetUserId: String, sdpMid: String, sdpMLineIndex: Int, candidate: String) {
        val data = JSONObject().apply {
            put("targetUserId", targetUserId)
            put("sdpMid", sdpMid)
            put("sdpMLineIndex", sdpMLineIndex)
            put("candidate", candidate)
        }
        socket?.emit("ice_candidate", data)
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
    }
}
