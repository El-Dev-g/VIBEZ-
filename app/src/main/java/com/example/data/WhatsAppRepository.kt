package com.example.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class WhatsAppRepository(private val dao: WhatsAppDao) {

    val allContacts: Flow<List<ContactEntity>> = dao.getAllContacts()
    val allChats: Flow<List<ChatEntity>> = dao.getAllChats()
    val allStatuses: Flow<List<StatusEntity>> = dao.getAllStatuses().map { list ->
        val cutoff = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
        list.filter { it.timestamp >= cutoff }
    }
    val allCallLogs: Flow<List<CallLogEntity>> = dao.getAllCallLogs()
    val starredMessages: Flow<List<MessageEntity>> = dao.getStarredMessages()

    fun getMessagesForChat(chatId: Long): Flow<List<MessageEntity>> = dao.getMessagesForChat(chatId)
    fun searchMessages(query: String): Flow<List<MessageEntity>> = dao.searchMessages(query)

    suspend fun getMessageById(messageId: Long): MessageEntity? = dao.getMessageById(messageId)
    suspend fun getChatById(chatId: Long): ChatEntity? = dao.getChatById(chatId)
    suspend fun getContactById(id: Long): ContactEntity? = dao.getContactById(id)

    suspend fun sendMessage(
        chatId: Long,
        content: String,
        messageType: String = "TEXT",
        mediaUrl: String = "",
        voiceDurationSeconds: Int = 0,
        replyToMessageId: Long? = null
    ): Long {
        val message = MessageEntity(
            chatId = chatId,
            senderId = 0, // 0 represents current user "Me"
            content = content,
            timestamp = System.currentTimeMillis(),
            status = "SENT",
            messageType = messageType,
            mediaUrl = mediaUrl,
            voiceDurationSeconds = voiceDurationSeconds,
            replyToMessageId = replyToMessageId
        )
        val messageId = dao.insertMessage(message)

        // Update chat's last message
        val chat = dao.getChatById(chatId)
        if (chat != null) {
            val previewText = when (messageType) {
                "IMAGE" -> "📷 Photo"
                "VOICE" -> "🎤 Voice note ($voiceDurationSeconds s)"
                "DOCUMENT" -> "📄 Document"
                "LOCATION" -> "📍 Location"
                else -> content
            }
            dao.updateChat(chat.copy(lastMessage = previewText, lastMessageTime = System.currentTimeMillis()))
        }

        // Simulate delivery tick updates
        withContext(Dispatchers.IO) {
            delay(800)
            dao.updateMessage(message.copy(id = messageId, status = "DELIVERED"))
            delay(1200)
            dao.updateMessage(message.copy(id = messageId, status = "READ"))
        }

        return messageId
    }

    suspend fun createAutoReply(chatId: Long, userMessage: String): MessageEntity? {
        return withContext(Dispatchers.IO) {
            delay(2000)
            val chat = dao.getChatById(chatId) ?: return@withContext null
            val replies = listOf(
                "Hey! Sounds great! Let's touch base soon. 👍",
                "Got it! I'm reviewing this right now.",
                "Awesome! Thanks for sharing. 😊",
                "Sounds like a plan! Let me know when you arrive.",
                "Hey there! Can I call you back in 5 minutes?",
                "Haha that's hilarious! 😂",
                "Sure thing! See you then."
            )
            val replyText = replies.random()
            val replyMessage = MessageEntity(
                chatId = chatId,
                senderId = chat.contactId,
                content = replyText,
                timestamp = System.currentTimeMillis(),
                status = "READ",
                messageType = "TEXT"
            )
            dao.insertMessage(replyMessage)
            dao.updateChat(
                chat.copy(
                    lastMessage = replyText,
                    lastMessageTime = System.currentTimeMillis()
                )
            )
            replyMessage
        }
    }

    suspend fun updateContact(id: Long, name: String, phone: String, about: String) {
        dao.updateContactDetails(id, name, phone, about)
        dao.updateChatContactName(id, name)
    }

    suspend fun createNewContact(name: String, phone: String, about: String = "Available"): Long {
        val contact = ContactEntity(
            name = name,
            phoneNumber = phone,
            aboutStatus = about,
            isOnline = true
        )
        val contactId = dao.insertContact(contact)
        // Also create a chat for this contact
        val chat = ChatEntity(
            contactId = contactId,
            contactName = name,
            lastMessage = "Chat created",
            lastMessageTime = System.currentTimeMillis()
        )
        dao.insertChat(chat)
        return contactId
    }

    suspend fun createGroupChat(groupName: String, contactIds: List<Long>): Long {
        val chat = ChatEntity(
            contactId = -1,
            contactName = groupName,
            isGroup = true,
            lastMessage = "Group created",
            lastMessageTime = System.currentTimeMillis()
        )
        val chatId = dao.insertChat(chat)
        val initialMsg = MessageEntity(
            chatId = chatId,
            senderId = -1,
            content = "You created group \"$groupName\"",
            timestamp = System.currentTimeMillis(),
            messageType = "TEXT"
        )
        dao.insertMessage(initialMsg)
        return chatId
    }

    suspend fun toggleStarMessage(message: MessageEntity) {
        dao.updateMessage(message.copy(isStarred = !message.isStarred))
    }

    suspend fun deleteMessage(messageId: Long) {
        dao.deleteMessage(messageId)
    }

    suspend fun clearChat(chatId: Long) {
        dao.clearChatMessages(chatId)
        val chat = dao.getChatById(chatId)
        if (chat != null) {
            dao.updateChat(chat.copy(lastMessage = "", unreadCount = 0))
        }
    }

    suspend fun deleteChat(chatId: Long) {
        dao.clearChatMessages(chatId)
        dao.deleteChat(chatId)
    }

    suspend fun updateChatMuteStatus(chatId: Long, isMuted: Boolean) {
        dao.updateChatMuteStatus(chatId, isMuted)
    }

    suspend fun postStatus(
        textCaption: String,
        mediaType: String = "TEXT",
        backgroundColorHex: String = "#075E54",
        mediaUrl: String = "",
        songTitle: String? = null,
        songArtist: String? = null,
        songPreviewUrl: String? = null,
        musicOffsetX: Float = 0.5f,
        musicOffsetY: Float = 0.5f
    ): Long {
        val status = StatusEntity(
            contactId = 0,
            contactName = "My status",
            mediaType = mediaType,
            mediaUrl = mediaUrl,
            textCaption = textCaption,
            backgroundColorHex = backgroundColorHex,
            timestamp = System.currentTimeMillis(),
            isMyStatus = true,
            isViewed = true,
            songTitle = songTitle,
            songArtist = songArtist,
            songPreviewUrl = songPreviewUrl,
            musicOffsetX = musicOffsetX,
            musicOffsetY = musicOffsetY
        )
        return dao.insertStatus(status)
    }

    suspend fun markStatusViewed(statusId: Long) {
        dao.markStatusViewed(statusId)
    }

    suspend fun deleteStatus(statusId: Long) {
        dao.deleteStatus(statusId)
    }

    suspend fun deleteExpiredStatuses() {
        val cutoff = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
        dao.deleteExpiredStatuses(cutoff)
    }

    suspend fun logCall(contactId: Long, contactName: String, callType: String, isIncoming: Boolean, isMissed: Boolean): Long {
        val callLog = CallLogEntity(
            contactId = contactId,
            contactName = contactName,
            callType = callType,
            isIncoming = isIncoming,
            isMissed = isMissed,
            timestamp = System.currentTimeMillis(),
            durationSeconds = if (isMissed) 0 else (10..300).random()
        )
        return dao.insertCallLog(callLog)
    }

    suspend fun clearCallLogs() {
        dao.clearCallLogs()
    }

    suspend fun seedDatabaseIfEmpty() {
        if (dao.getContactCount() == 0) {
            val now = System.currentTimeMillis()

            // 1. Contacts
            val c1Id = dao.insertContact(ContactEntity(name = "Sarah Connor", phoneNumber = "+1 555-0142", aboutStatus = "At the gym 🏋️‍♀️", isOnline = true, lastSeen = "Online"))
            val c2Id = dao.insertContact(ContactEntity(name = "Alex Rivers", phoneNumber = "+1 555-0198", aboutStatus = "Coding Jetpack Compose 🚀", isOnline = false, lastSeen = "Today at 10:45 AM"))
            val c3Id = dao.insertContact(ContactEntity(name = "Emily Watson", phoneNumber = "+1 555-0220", aboutStatus = "Busy / Calls only", isOnline = true, lastSeen = "Online"))
            val c4Id = dao.insertContact(ContactEntity(name = "Android Developers", phoneNumber = "+1 000-0000", aboutStatus = "Official Android Community", isOnline = true, lastSeen = "124 members"))
            val c5Id = dao.insertContact(ContactEntity(name = "Meta AI", phoneNumber = "+1 000-9999", aboutStatus = "Ask me anything!", isOnline = true, lastSeen = "Online"))

            // 2. Chats
            val chat1Id = dao.insertChat(ChatEntity(contactId = c1Id, contactName = "Sarah Connor", lastMessage = "Let's meet up at 5 PM for coffee!", lastMessageTime = now - 1000 * 60 * 5, unreadCount = 2, isPinned = true))
            val chat2Id = dao.insertChat(ChatEntity(contactId = c2Id, contactName = "Alex Rivers", lastMessage = "🎤 Voice note (0:18)", lastMessageTime = now - 1000 * 60 * 45, unreadCount = 0))
            val chat3Id = dao.insertChat(ChatEntity(contactId = c3Id, contactName = "Emily Watson", lastMessage = "Did you check out the new design mockups?", lastMessageTime = now - 1000 * 60 * 180, unreadCount = 1))
            val chat4Id = dao.insertChat(ChatEntity(contactId = c4Id, contactName = "Android Developers", lastMessage = "Compose 1.8 released with major performance boosts! 🔥", lastMessageTime = now - 1000 * 60 * 360, unreadCount = 5, isGroup = true))
            val chat5Id = dao.insertChat(ChatEntity(contactId = c5Id, contactName = "Meta AI", lastMessage = "I can help generate code snippets, write emails, or plan trips!", lastMessageTime = now - 1000 * 60 * 1440, unreadCount = 0))

            // 3. Messages for Chat 1 (Sarah)
            dao.insertMessage(MessageEntity(chatId = chat1Id, senderId = c1Id, content = "Hey! Are you free this afternoon?", timestamp = now - 1000 * 60 * 15, status = "READ"))
            dao.insertMessage(MessageEntity(chatId = chat1Id, senderId = 0, content = "Hi Sarah! Yes, I just finished my meeting.", timestamp = now - 1000 * 60 * 10, status = "READ"))
            dao.insertMessage(MessageEntity(chatId = chat1Id, senderId = c1Id, content = "Awesome! Let's meet up at 5 PM for coffee!", timestamp = now - 1000 * 60 * 5, status = "DELIVERED"))

            // 4. Messages for Chat 2 (Alex - Voice Note & Starred)
            dao.insertMessage(MessageEntity(chatId = chat2Id, senderId = 0, content = "Hey Alex, do you have the project update audio?", timestamp = now - 1000 * 60 * 60, status = "READ"))
            dao.insertMessage(MessageEntity(chatId = chat2Id, senderId = c2Id, content = "Voice note update", timestamp = now - 1000 * 60 * 45, status = "READ", messageType = "VOICE", voiceDurationSeconds = 18, isStarred = true))

            // 5. Messages for Chat 3 (Emily)
            dao.insertMessage(MessageEntity(chatId = chat3Id, senderId = c3Id, content = "Did you check out the new design mockups?", timestamp = now - 1000 * 60 * 180, status = "DELIVERED"))

            // 6. Messages for Chat 4 (Android Developers)
            dao.insertMessage(MessageEntity(chatId = chat4Id, senderId = c2Id, content = "Compose 1.8 released with major performance boosts! 🔥", timestamp = now - 1000 * 60 * 360, status = "READ"))

            // 7. Status Updates
            dao.insertStatus(StatusEntity(contactId = 0, contactName = "My Status", mediaType = "TEXT", textCaption = "Building the ultimate VIBEZ app in Compose 🚀", backgroundColorHex = "#128C7E", timestamp = now - 1000 * 60 * 30, isMyStatus = true, isViewed = true))
            dao.insertStatus(StatusEntity(contactId = c1Id, contactName = "Sarah Connor", mediaType = "IMAGE", textCaption = "Sunset vibes at the beach 🌅🌴", backgroundColorHex = "#000000", timestamp = now - 1000 * 60 * 120, isViewed = false))
            dao.insertStatus(StatusEntity(contactId = c2Id, contactName = "Alex Rivers", mediaType = "TEXT", textCaption = "Late night coding session... ☕💻", backgroundColorHex = "#673AB7", timestamp = now - 1000 * 60 * 240, isViewed = false))

            // 8. Call Logs
            dao.insertCallLog(CallLogEntity(contactId = c1Id, contactName = "Sarah Connor", callType = "VIDEO", isIncoming = true, isMissed = false, timestamp = now - 1000 * 60 * 60 * 2, durationSeconds = 145))
            dao.insertCallLog(CallLogEntity(contactId = c2Id, contactName = "Alex Rivers", callType = "VOICE", isIncoming = false, isMissed = false, timestamp = now - 1000 * 60 * 60 * 5, durationSeconds = 320))
            dao.insertCallLog(CallLogEntity(contactId = c3Id, contactName = "Emily Watson", callType = "VOICE", isIncoming = true, isMissed = true, timestamp = now - 1000 * 60 * 60 * 24, durationSeconds = 0))
        }
    }
}
