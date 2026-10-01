package com.example.data

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.launch
import com.example.data.network.*
import com.example.util.AuthManager
import org.json.JSONObject
import okhttp3.MediaType.Companion.toMediaTypeOrNull

class WhatsAppRepository(private val dao: WhatsAppDao, private val context: android.content.Context? = null) {

    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    var socketManager: SocketManager? = null

    private fun getDeletedChatIds(): Set<String> {
        val prefs = context?.getSharedPreferences("deleted_chats_prefs", android.content.Context.MODE_PRIVATE)
        return prefs?.getStringSet("deleted_chat_ids", emptySet()) ?: emptySet()
    }

    private fun addDeletedChatId(chatId: String) {
        val prefs = context?.getSharedPreferences("deleted_chats_prefs", android.content.Context.MODE_PRIVATE) ?: return
        val current = prefs.getStringSet("deleted_chat_ids", emptySet())?.toMutableSet() ?: mutableSetOf()
        current.add(chatId)
        prefs.edit().putStringSet("deleted_chat_ids", current).apply()
    }

    private fun removeDeletedChatId(chatId: String) {
        val prefs = context?.getSharedPreferences("deleted_chats_prefs", android.content.Context.MODE_PRIVATE) ?: return
        val current = prefs.getStringSet("deleted_chat_ids", emptySet())?.toMutableSet() ?: mutableSetOf()
        if (current.remove(chatId)) {
            prefs.edit().putStringSet("deleted_chat_ids", current).apply()
        }
    }

    // Room-backed Flow streams
    val allChats: Flow<List<ChatEntity>> = dao.getAllChats()
    val allCommunities: Flow<List<CommunityEntity>> = dao.getAllCommunities()
    val allContacts: Flow<List<ContactEntity>> = dao.getAllContacts()
    val allStatuses: Flow<List<StatusEntity>> = dao.getAllStatuses()
    val allCallLogs: Flow<List<CallLogEntity>> = dao.getAllCallLogs()
    val starredMessages: Flow<List<MessageEntity>> = dao.getStarredMessages()

    val typingEvent = kotlinx.coroutines.flow.MutableSharedFlow<Pair<String, Boolean>>()
    val readReceiptEvent = kotlinx.coroutines.flow.MutableSharedFlow<String>()

    init {
        repositoryScope.launch {
            try {
                val localChats = dao.getAllChatsOneShot()
                val localContacts = dao.getAllContactsOneShot()
                localChats.forEach { localChat ->
                    if (localChat.isGroup && localChat.contactId.isNotBlank()) {
                        dao.updateChat(localChat.copy(contactId = ""))
                    } else if (!localChat.isGroup) {
                        val matchedContact = localContacts.firstOrNull {
                            (localChat.contactId.isNotBlank() && (it.id == localChat.contactId || it.remoteId == localChat.contactId)) ||
                            it.id == localChat.id || it.remoteId == localChat.id
                        }
                        val fixedName = localChat.contactName.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                            ?: matchedContact?.name?.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                            ?: matchedContact?.phoneNumber?.takeIf { it.isNotBlank() }
                            ?: localChat.contactName
                        val fixedAvatar = localChat.contactAvatar.ifBlank { matchedContact?.avatarUrl ?: "" }
                        val fixedContactId = localChat.contactId.ifBlank { matchedContact?.id ?: "" }
                        if (localChat.isOfficial || fixedName != localChat.contactName || fixedAvatar != localChat.contactAvatar || fixedContactId != localChat.contactId) {
                            dao.updateChat(
                                localChat.copy(
                                    isOfficial = false,
                                    contactId = fixedContactId,
                                    contactName = fixedName,
                                    contactAvatar = fixedAvatar,
                                    isVerified = localChat.isVerified || matchedContact?.isVerified == true
                                )
                            )
                        }
                    }
                }
            } catch (_: Exception) {}
        }
    }

    fun initSocket(userId: String, token: String? = null, onNewMessage: (MessageEntity) -> Unit) {
        socketManager = SocketManager(userId, token).apply {
            connect { json ->
                try {
                    val messageDto = parseMessageJson(json)
                    val entity = mapMessageDtoToEntity(messageDto)
                    
                    repositoryScope.launch {
                        removeDeletedChatId(entity.chatId)
                        dao.insertMessage(entity)
                        
                        // Update chat's last message or create missing chat entity
                        var chat = dao.getChatById(entity.chatId)
                        if (chat != null) {
                            dao.updateChat(chat.copy(
                                lastMessage = entity.content,
                                lastMessageTime = entity.timestamp,
                                unreadCount = chat.unreadCount + 1
                            ))
                        } else {
                            val token = context?.let { AuthManager(it).getAuthToken() }
                            if (!token.isNullOrBlank()) {
                                try {
                                    syncChats(token)
                                    chat = dao.getChatById(entity.chatId)
                                } catch (_: Exception) {}
                            }
                            
                            if (chat == null) {
                                val senderObj = json.optJSONObject("sender")
                                val senderName = senderObj?.optString("name")?.ifBlank { null }
                                    ?: json.optString("senderName", "").ifBlank { null }
                                    ?: "Contact"
                                val senderAvatar = senderObj?.optString("avatarUrl") ?: ""
                                val newChat = ChatEntity(
                                    id = entity.chatId,
                                    remoteId = entity.chatId,
                                    contactId = entity.senderId,
                                    contactName = senderName,
                                    contactAvatar = senderAvatar,
                                    lastMessage = entity.content,
                                    lastMessageTime = entity.timestamp,
                                    unreadCount = 1,
                                    isGroup = false
                                )
                                dao.insertChat(newChat)
                            }
                        }
                    }
                    
                    onNewMessage(entity)
                } catch (e: Exception) {
                    android.util.Log.e("WhatsAppRepository", "Error parsing socket message", e)
                }
            }
            
            onTypingReceived = { chatId, senderId, isTyping ->
                repositoryScope.launch {
                    typingEvent.emit(Pair(chatId, isTyping))
                }
            }

            onMessageReadReceived = { chatId, senderId ->
                repositoryScope.launch {
                    dao.markSentMessagesAsRead(chatId, userId)
                    readReceiptEvent.emit(chatId)
                }
            }

            onCallOfferReceived = { data ->
                _incomingCall.value = data
            }
            onCallAnswerReceived = { data ->
                _callAnswer.value = data
            }
            onIceCandidateReceived = { data ->
                _iceCandidate.value = data
            }
            onCallEndedReceived = { data ->
                _callEnded.value = data
            }
        }
    }

    private val _incomingCall = MutableStateFlow<JSONObject?>(null)
    val incomingCall = _incomingCall.asStateFlow()

    private val _callAnswer = MutableStateFlow<JSONObject?>(null)
    val callAnswer = _callAnswer.asStateFlow()

    private val _iceCandidate = MutableStateFlow<JSONObject?>(null)
    val iceCandidate = _iceCandidate.asStateFlow()

    private val _callEnded = MutableStateFlow<JSONObject?>(null)
    val callEnded = _callEnded.asStateFlow()

    fun clearIncomingCall() {
        _incomingCall.value = null
    }

    fun clearCallSignals() {
        _incomingCall.value = null
        _callAnswer.value = null
        _iceCandidate.value = null
        _callEnded.value = null
    }

    private fun mapMessageDtoToEntity(dto: MessageDto): MessageEntity {
        return MessageEntity(
            id = dto.id,
            remoteId = dto.id,
            chatId = dto.chatId,
            senderId = if (dto.senderId == "ME") "ME" else dto.senderId,
            content = dto.content,
            timestamp = parseDate(dto.createdAt),
            status = dto.status,
            messageType = dto.type,
            mediaUrl = dto.mediaUrl ?: "",
            voiceDurationSeconds = dto.duration ?: 0,
            isStarred = dto.isStarred,
            isPinned = dto.isPinned
        )
    }

    suspend fun loginWithGoogle(
        email: String,
        name: String,
        avatarUrl: String? = null,
        phoneNumber: String? = null,
        idToken: String? = null
    ): LoginResponse {
        return try {
            NetworkClient.apiService.loginWithGoogle(
                GoogleAuthRequest(
                    idToken = idToken,
                    email = email,
                    name = name,
                    avatarUrl = avatarUrl,
                    phoneNumber = phoneNumber
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
            throw e
        }
    }

    suspend fun loginWithPhone(
        phoneNumber: String,
        name: String? = null,
        about: String? = null,
        avatarUrl: String? = null,
        firebaseIdToken: String? = null
    ): LoginResponse {
        return try {
            NetworkClient.apiService.loginWithPhone(
                PhoneAuthRequest(
                    phoneNumber = phoneNumber.trim(),
                    name = name?.trim(),
                    about = about?.trim(),
                    avatarUrl = avatarUrl,
                    firebaseIdToken = firebaseIdToken
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
            throw e
        }
    }

    fun logout() {
        try {
            socketManager?.disconnect()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        socketManager = null
        repositoryScope.launch {
            dao.clearCallLogs()
            // We usually don't clear everything on logout in WhatsApp, but we could if needed
        }
    }

    suspend fun syncChats(token: String) {
        try {
            val deletedIds = getDeletedChatIds()
            val currentUserId = context?.let { AuthManager(it).getUserId() } ?: ""

            // Clean up any previously corrupted local chats where group chats had a contactId or 1:1 chats were marked official
            try {
                val localChats = dao.getAllChatsOneShot()
                localChats.forEach { localChat ->
                    if (localChat.isGroup && localChat.contactId.isNotBlank()) {
                        dao.updateChat(localChat.copy(contactId = ""))
                    } else if (!localChat.isGroup && localChat.isOfficial) {
                        dao.updateChat(localChat.copy(isOfficial = false))
                    }
                }
            } catch (_: Exception) {}

            val remoteChats = NetworkClient.apiService.getChats("Bearer $token")
            remoteChats.forEach { dto ->
                if (deletedIds.contains(dto.id)) {
                    // Skip inserting deleted chat
                    dao.deleteChat(dto.id)
                    dao.clearChatMessages(dto.id)
                    return@forEach
                }
                if (dto.id.isBlank()) return@forEach
                val isOff = dto.isGroup && (dto.isOfficial || dto.id.contains("system_official", ignoreCase = true))
                val otherMember = if (!dto.isGroup) {
                    dto.members.firstOrNull { it.userId != currentUserId && it.user.id != currentUserId && it.user.id != "ME" }
                        ?: dto.members.firstOrNull { it.user.id != currentUserId }
                } else null
                val otherUser = otherMember?.user

                val isVer = if (dto.isGroup) {
                    dto.isVerified || isOff
                } else {
                    otherUser?.isVerified == true || dto.isVerified
                }

                val resolvedContactId = if (dto.isGroup || isOff) {
                    ""
                } else {
                    otherUser?.id?.takeIf { it.isNotBlank() }
                        ?: otherMember?.userId?.takeIf { it.isNotBlank() }
                        ?: ""
                }

                // Sync 1-on-1 chat partner into contacts so public users have name, avatar, phone, about, and verification badge
                var existingContact = if (resolvedContactId.isNotBlank()) {
                    dao.getContactById(resolvedContactId) ?: dao.getContactByRemoteId(resolvedContactId)
                } else null

                if (!dto.isGroup && otherUser != null && otherUser.id.isNotBlank()) {
                    val userRealName = otherUser.name?.takeIf { it.isNotBlank() }
                        ?: otherUser.phoneNumber.takeIf { it.isNotBlank() }
                        ?: "User"
                    val effectiveName = if (existingContact != null && existingContact.name.isNotBlank() && existingContact.name != "Contact" && existingContact.name != "Unknown") {
                        existingContact.name
                    } else {
                        userRealName
                    }
                    val effectiveAvatar = otherUser.avatarUrl?.takeIf { it.isNotBlank() } ?: existingContact?.avatarUrl ?: ""
                    val effectivePhone = otherUser.phoneNumber.takeIf { it.isNotBlank() } ?: existingContact?.phoneNumber ?: ""
                    val effectiveAbout = otherUser.about?.takeIf { it.isNotBlank() } ?: existingContact?.aboutStatus ?: "Hey there! I am using VIBEZ."
                    val updatedContact = ContactEntity(
                        id = existingContact?.id ?: otherUser.id,
                        remoteId = otherUser.id,
                        name = effectiveName,
                        phoneNumber = effectivePhone,
                        avatarUrl = effectiveAvatar,
                        aboutStatus = effectiveAbout,
                        isOnline = existingContact?.isOnline ?: false,
                        lastSeen = otherUser.lastSeen.takeIf { it.isNotBlank() } ?: existingContact?.lastSeen ?: "Recently",
                        isVerified = otherUser.isVerified || existingContact?.isVerified == true
                    )
                    dao.insertContact(updatedContact)
                    existingContact = updatedContact
                }

                val resolvedContactName = if (dto.isGroup) {
                    dto.name?.takeIf { it.isNotBlank() } ?: "Group"
                } else {
                    existingContact?.name?.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                        ?: otherUser?.name?.takeIf { it.isNotBlank() }
                        ?: dto.name?.takeIf { it.isNotBlank() }
                        ?: otherUser?.phoneNumber?.takeIf { it.isNotBlank() }
                        ?: "Unknown"
                }

                val resolvedContactAvatar = if (dto.isGroup) {
                    dto.avatarUrl?.takeIf { it.isNotBlank() } ?: ""
                } else {
                    otherUser?.avatarUrl?.takeIf { it.isNotBlank() }
                        ?: existingContact?.avatarUrl?.takeIf { it.isNotBlank() }
                        ?: dto.avatarUrl?.takeIf { it.isNotBlank() }
                        ?: ""
                }

                val entity = ChatEntity(
                    id = dto.id,
                    remoteId = dto.id,
                    contactId = resolvedContactId,
                    contactName = resolvedContactName,
                    contactAvatar = resolvedContactAvatar,
                    lastMessage = dto.messages.firstOrNull()?.content ?: "",
                    lastMessageTime = parseDate(dto.messages.firstOrNull()?.createdAt),
                    unreadCount = 0,
                    isGroup = dto.isGroup,
                    isMuted = dto.isMuted,
                    customWallpaper = dto.wallpaper,
                    isOfficial = isOff,
                    isVerified = isVer || existingContact?.isVerified == true,
                    allowComments = dto.allowComments
                )
                dao.insertChat(entity)
                
                // Sync messages for each chat
                dto.messages.forEach { msgDto ->
                    dao.insertMessage(mapMessageDtoToEntity(msgDto))
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun fetchMessagesForChat(chatId: String, token: String) {
        try {
            val dtos = NetworkClient.apiService.getMessages("Bearer $token", chatId)
            dtos.forEach { 
                dao.insertMessage(mapMessageDtoToEntity(it))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getMessagesFlow(chatId: String): Flow<List<MessageEntity>> = dao.getMessagesForChat(chatId)

    suspend fun addLocalChat(chat: ChatEntity) {
        dao.insertChat(chat)
    }

    suspend fun addLocalMessage(message: MessageEntity) {
        removeDeletedChatId(message.chatId)
        dao.insertMessage(message)
        val chat = dao.getChatById(message.chatId)
        if (chat != null) {
            dao.updateChat(chat.copy(
                lastMessage = if (message.messageType == "VOICE") "🎤 Voice note" else message.content,
                lastMessageTime = message.timestamp
            ))
        } else if (message.chatId == "vibez_ai_chat") {
            dao.insertChat(ChatEntity(
                id = "vibez_ai_chat",
                contactId = "vibez_ai",
                contactName = "VIBEZ AI Assistant",
                contactAvatar = "",
                lastMessage = message.content,
                lastMessageTime = message.timestamp,
                isOfficial = true,
                isVerified = true
            ))
        }
    }

    suspend fun sendMessage(
        chatId: String,
        senderId: String,
        receiverId: String?,
        content: String,
        type: String = "TEXT",
        mediaUrl: String? = null,
        duration: Int? = null,
        token: String,
        id: String? = null
    ) {
        removeDeletedChatId(chatId)
        socketManager?.sendMessage(
            chatId = chatId,
            senderId = senderId,
            receiverId = receiverId,
            content = content,
            type = type,
            mediaUrl = mediaUrl,
            duration = duration,
            id = id
        )
    }

    private fun parseMessageJson(json: JSONObject): MessageDto {
        val mUrl = if (json.has("mediaUrl") && !json.isNull("mediaUrl")) json.optString("mediaUrl") else null
        val rId = if (json.has("receiverId") && !json.isNull("receiverId")) json.optString("receiverId") else null
        return MessageDto(
            id = json.optString("id", java.util.UUID.randomUUID().toString()),
            content = json.optString("content", ""),
            type = json.optString("type", "TEXT"),
            status = json.optString("status", "SENT"),
            mediaUrl = mUrl,
            duration = if (!json.isNull("duration")) json.optInt("duration", 0) else null,
            senderId = json.optString("senderId", "unknown"),
            receiverId = rId,
            chatId = json.optString("chatId", "unknown"),
            createdAt = json.optString("createdAt", ""),
            sender = null
        )
    }

    private fun parseDate(dateStr: String?): Long {
        if (dateStr == null) return System.currentTimeMillis()
        return try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                java.time.Instant.parse(dateStr).toEpochMilli()
            } else {
                val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
                format.timeZone = java.util.TimeZone.getTimeZone("UTC")
                format.parse(dateStr)?.time ?: System.currentTimeMillis()
            }
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }

    suspend fun resetChatUnreadCount(chatId: String, userId: String) {
        dao.resetChatUnreadCount(chatId)
        dao.markMessagesAsRead(chatId, userId)
        socketManager?.emitMessageRead(chatId, userId)
    }

    suspend fun updateChatWallpaper(chatId: String, wallpaper: String, token: String) {
        try {
            NetworkClient.apiService.updateChat("Bearer $token", chatId, UpdateChatRequest(wallpaper = wallpaper))
            val chat = dao.getChatById(chatId)
            chat?.let {
                dao.updateChat(it.copy(customWallpaper = wallpaper))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updateChatMuteStatus(chatId: String, isMuted: Boolean, token: String) {
        try {
            NetworkClient.apiService.updateChat("Bearer $token", chatId, UpdateChatRequest(isMuted = isMuted))
            dao.updateChatMuteStatus(chatId, isMuted)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updateChatPinStatus(chatId: String, isPinned: Boolean) {
        try {
            dao.updateChatPinStatus(chatId, isPinned)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun getChatById(chatId: String): ChatEntity? = dao.getChatById(chatId)
    suspend fun getMessageById(messageId: String): MessageEntity? = dao.getMessageById(messageId)

    suspend fun deleteMessage(messageId: String, token: String) {
        try {
            val message = dao.getMessageById(messageId)
            message?.let { msg ->
                if (msg.mediaUrl.isNotEmpty() && !msg.mediaUrl.startsWith("http")) {
                    try {
                        val file = java.io.File(msg.mediaUrl)
                        if (file.exists()) file.delete()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
            NetworkClient.apiService.deleteMessage("Bearer $token", messageId)
            dao.deleteMessage(messageId)
        } catch (e: Exception) {
            e.printStackTrace()
            // Always try to delete locally even if network fails
            dao.deleteMessage(messageId)
        }
    }

    suspend fun clearChat(chatId: String, token: String) {
        try {
            val messages = dao.getMessagesForChatOneShot(chatId)
            messages.forEach { msg ->
                if (msg.mediaUrl.isNotEmpty() && !msg.mediaUrl.startsWith("http")) {
                    try {
                        val file = java.io.File(msg.mediaUrl)
                        if (file.exists()) file.delete()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
            NetworkClient.apiService.clearChatMessages("Bearer $token", chatId)
            dao.clearChatMessages(chatId)
            val chat = dao.getChatById(chatId)
            chat?.let {
                dao.updateChat(it.copy(lastMessage = "", lastMessageTime = System.currentTimeMillis()))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            dao.clearChatMessages(chatId)
        }
    }

    suspend fun deleteChat(chatId: String, token: String) {
        try {
            val messages = dao.getMessagesForChatOneShot(chatId)
            messages.forEach { msg ->
                if (msg.mediaUrl.isNotEmpty() && !msg.mediaUrl.startsWith("http")) {
                    try {
                        val file = java.io.File(msg.mediaUrl)
                        if (file.exists()) file.delete()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
            addDeletedChatId(chatId)
            NetworkClient.apiService.deleteChat("Bearer $token", chatId)
            dao.deleteChat(chatId)
            dao.clearChatMessages(chatId)
        } catch (e: Exception) {
            e.printStackTrace()
            addDeletedChatId(chatId)
            dao.deleteChat(chatId)
            dao.clearChatMessages(chatId)
        }
    }

    suspend fun toggleStarMessage(message: MessageEntity, token: String) {
        try {
            val newStarred = !message.isStarred
            NetworkClient.apiService.updateMessage("Bearer $token", message.id, UpdateMessageRequest(isStarred = newStarred))
            dao.updateMessage(message.copy(isStarred = newStarred))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updateContact(id: String, name: String, phone: String, about: String) {
        dao.updateContactDetails(id, name, phone, about)
        dao.updateChatContactName(id, name)
    }

    private fun phonesMatch(phoneA: String?, phoneB: String?): Boolean {
        if (phoneA.isNullOrBlank() || phoneB.isNullOrBlank()) return false
        val digitsA = phoneA.replace(Regex("[^0-9]"), "")
        val digitsB = phoneB.replace(Regex("[^0-9]"), "")
        if (digitsA == digitsB && digitsA.isNotEmpty()) return true

        val noZeroA = digitsA.replace(Regex("^0+"), "")
        val noZeroB = digitsB.replace(Regex("^0+"), "")
        if (noZeroA == noZeroB && noZeroA.isNotEmpty()) return true

        val minLen = minOf(digitsA.length, digitsB.length)
        if (minLen >= 7) {
            val matchLen = minOf(minLen, 10)
            return digitsA.takeLast(matchLen) == digitsB.takeLast(matchLen)
        }
        return false
    }

    suspend fun createNewContact(name: String, phone: String, about: String, token: String): String {
        val cleanPhone = phone.replace(Regex("[^0-9+]"), "").trim()
        val existingContacts = try { dao.getAllContactsOneShot() } catch (_: Exception) { emptyList() }

        return try {
            val searchResults = NetworkClient.apiService.searchUsers("Bearer $token", cleanPhone)
            val targetUser = searchResults.firstOrNull { 
                val userClean = (it.phoneNumber ?: "").replace(Regex("[^0-9+]"), "").trim()
                userClean == cleanPhone || phonesMatch(it.phoneNumber, cleanPhone)
            }

            val existingLocal = existingContacts.firstOrNull { 
                (targetUser != null && (it.id == targetUser.id || it.remoteId == targetUser.id)) || phonesMatch(it.phoneNumber, cleanPhone)
            }

            val finalContactId = targetUser?.id ?: existingLocal?.id ?: "contact_${System.currentTimeMillis()}"
            val finalPhone = targetUser?.phoneNumber ?: phone

            val mergedContact = ContactEntity(
                id = finalContactId,
                remoteId = targetUser?.id ?: existingLocal?.remoteId ?: finalContactId,
                name = if (name.isNotBlank()) name else (targetUser?.name ?: existingLocal?.name ?: finalPhone),
                phoneNumber = finalPhone,
                avatarUrl = targetUser?.avatarUrl ?: existingLocal?.avatarUrl ?: "",
                aboutStatus = if (about.isNotBlank()) about else (targetUser?.about ?: existingLocal?.aboutStatus ?: "Hey there! I am using VIBEZ."),
                isOnline = true,
                lastSeen = targetUser?.lastSeen ?: existingLocal?.lastSeen ?: "Recently",
                isVerified = (targetUser?.isVerified == true) || (existingLocal?.isVerified == true)
            )

            if (existingLocal != null && existingLocal.id != finalContactId) {
                dao.deleteContactById(existingLocal.id)
                dao.updateChatContactIdAndName(existingLocal.id, finalContactId, mergedContact.name)
            } else {
                dao.updateChatContactName(finalContactId, mergedContact.name)
            }

            dao.insertContact(mergedContact)

            if (targetUser != null) {
                try {
                    NetworkClient.apiService.createOrGetPrivateChat("Bearer $token", PrivateChatRequest(targetUserId = targetUser.id))
                    syncChats(token)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            finalContactId
        } catch (e: Exception) {
            e.printStackTrace()
            val existingLocal = existingContacts.firstOrNull { phonesMatch(it.phoneNumber, cleanPhone) }
            val localId = existingLocal?.id ?: "contact_${System.currentTimeMillis()}"

            val fallbackContact = ContactEntity(
                id = localId,
                remoteId = existingLocal?.remoteId ?: localId,
                name = if (name.isNotBlank()) name else (existingLocal?.name ?: phone),
                phoneNumber = phone,
                avatarUrl = existingLocal?.avatarUrl ?: "",
                aboutStatus = if (about.isNotBlank()) about else (existingLocal?.aboutStatus ?: "Hey there! I am using VIBEZ."),
                isOnline = false
            )

            dao.insertContact(fallbackContact)
            localId
        }
    }

    suspend fun getOrCreateChatForContact(contact: ContactEntity, token: String?): String {
        val contactId = contact.id
        val remoteId = contact.remoteId
        val phone = contact.phoneNumber
        val name = contact.name.ifBlank { phone }

        removeDeletedChatId(contactId)
        if (!remoteId.isNullOrBlank()) removeDeletedChatId(remoteId)

        // 1. Try backend API first if token is present to obtain the real Chat UUID
        var backendChatId: String? = null
        if (!token.isNullOrBlank()) {
            val targetUserId = if (!remoteId.isNullOrBlank() && !remoteId.startsWith("contact_")) {
                remoteId
            } else if (!contactId.startsWith("contact_") && contactId.length > 15) {
                contactId
            } else {
                try {
                    val cleanPhone = phone.replace(Regex("[^0-9+]"), "").trim()
                    if (cleanPhone.isNotBlank()) {
                        val users = NetworkClient.apiService.searchUsers("Bearer $token", cleanPhone)
                        users.firstOrNull { phonesMatch(it.phoneNumber, cleanPhone) }?.id
                    } else null
                } catch (_: Exception) {
                    null
                }
            }

            if (!targetUserId.isNullOrBlank()) {
                try {
                    val dto = NetworkClient.apiService.createOrGetPrivateChat("Bearer $token", PrivateChatRequest(targetUserId = targetUserId))
                    backendChatId = dto.id
                    val otherUser = dto.members.firstOrNull { it.userId == targetUserId || it.user.id == targetUserId }?.user
                    val resolvedName = name.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                        ?: otherUser?.name?.takeIf { it.isNotBlank() }
                        ?: dto.name?.takeIf { it.isNotBlank() }
                        ?: otherUser?.phoneNumber?.takeIf { it.isNotBlank() }
                        ?: name
                    val resolvedAvatar = contact.avatarUrl.takeIf { it.isNotBlank() }
                        ?: otherUser?.avatarUrl?.takeIf { it.isNotBlank() }
                        ?: dto.avatarUrl?.takeIf { it.isNotBlank() }
                        ?: ""
                    val isVer = contact.isVerified || otherUser?.isVerified == true || dto.isVerified
                    val entity = ChatEntity(
                        id = dto.id,
                        remoteId = dto.id,
                        contactId = contactId,
                        contactName = resolvedName,
                        contactAvatar = resolvedAvatar,
                        lastMessage = dto.messages.firstOrNull()?.content ?: "",
                        lastMessageTime = parseDate(dto.messages.firstOrNull()?.createdAt),
                        unreadCount = 0,
                        isGroup = false,
                        isOfficial = false,
                        isVerified = isVer
                    )
                    dao.insertContact(
                        contact.copy(
                            remoteId = targetUserId,
                            name = resolvedName,
                            phoneNumber = contact.phoneNumber.ifBlank { otherUser?.phoneNumber ?: "" },
                            avatarUrl = resolvedAvatar,
                            aboutStatus = otherUser?.about?.takeIf { it.isNotBlank() } ?: contact.aboutStatus,
                            isVerified = isVer
                        )
                    )
                    dao.insertChat(entity)
                    removeDeletedChatId(dto.id)
                    return dto.id
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        // 2. Check existing local chats (only non-group 1-on-1 chats)
        val allLocalChats = try { dao.getAllChatsOneShot() } catch (_: Exception) { emptyList() }
        val existingChat = allLocalChats.firstOrNull { chat ->
            !chat.isGroup && (
                chat.contactId == contactId ||
                (!remoteId.isNullOrBlank() && (chat.contactId == remoteId || chat.remoteId == remoteId)) ||
                chat.id == contactId ||
                (!remoteId.isNullOrBlank() && chat.id == remoteId) ||
                (phone.isNotBlank() && (chat.contactId == phone || phonesMatch(chat.contactId, phone)))
            )
        }

        if (existingChat != null) {
            removeDeletedChatId(existingChat.id)
            if (existingChat.contactName != name || (contact.avatarUrl.isNotBlank() && existingChat.contactAvatar != contact.avatarUrl)) {
                val updated = existingChat.copy(
                    contactName = name,
                    contactAvatar = if (contact.avatarUrl.isNotBlank()) contact.avatarUrl else existingChat.contactAvatar,
                    isVerified = contact.isVerified || existingChat.isVerified
                )
                dao.updateChat(updated)
            }
            return existingChat.id
        }

        // 3. Guaranteed local fallback chat in Room
        val fallbackChatId = backendChatId ?: "chat_${contactId}"
        val localChat = ChatEntity(
            id = fallbackChatId,
            remoteId = remoteId ?: fallbackChatId,
            contactId = contactId,
            contactName = name,
            contactAvatar = contact.avatarUrl,
            lastMessage = "",
            lastMessageTime = System.currentTimeMillis(),
            unreadCount = 0,
            isGroup = false,
            isVerified = contact.isVerified
        )
        dao.insertContact(contact)
        dao.insertChat(localChat)
        removeDeletedChatId(fallbackChatId)
        return fallbackChatId
    }

    suspend fun getOrCreateChatForContactId(contactId: String, token: String?): String {
        val contact = dao.getContactById(contactId) ?: dao.getContactByRemoteId(contactId)
        return if (contact != null) {
            getOrCreateChatForContact(contact, token)
        } else {
            val existingChat = dao.getChatById(contactId) ?: dao.getChatByContactId(contactId)
            if (existingChat != null) {
                removeDeletedChatId(existingChat.id)
                return existingChat.id
            }

            val placeholder = ContactEntity(
                id = contactId,
                name = existingChat?.contactName?.takeIf { it.isNotBlank() } ?: "User",
                phoneNumber = "",
                aboutStatus = "Hey there! I am using VIBEZ."
            )
            getOrCreateChatForContact(placeholder, token)
        }
    }

    suspend fun refreshContactProfile(idOrChatId: String, token: String) {
        if (idOrChatId.isBlank() || idOrChatId == "ME" || idOrChatId == "me") return
        try {
            val currentUserId = context?.let { AuthManager(it).getUserId() } ?: ""
            val existingChat = dao.getChatById(idOrChatId) ?: dao.getChatByContactId(idOrChatId)
            if (existingChat?.isGroup == true) return

            val targetUserId = existingChat?.contactId?.takeIf { it.isNotBlank() }
                ?: idOrChatId.removePrefix("chat_").removePrefix("contact_")

            val existingContact = dao.getContactById(targetUserId)
                ?: dao.getContactByRemoteId(targetUserId)
                ?: dao.getContactById(idOrChatId)

            var resolvedUser: UserDto? = null
            try {
                val searchList = NetworkClient.apiService.searchUsers("Bearer $token", targetUserId)
                resolvedUser = searchList.firstOrNull {
                    it.id == targetUserId || it.phoneNumber == targetUserId || phonesMatch(it.phoneNumber, targetUserId)
                }
            } catch (_: Exception) {}

            if (resolvedUser == null && !targetUserId.startsWith("contact_")) {
                try {
                    val chatDto = NetworkClient.apiService.createOrGetPrivateChat(
                        "Bearer $token",
                        PrivateChatRequest(targetUserId = targetUserId)
                    )
                    resolvedUser = chatDto.members.firstOrNull {
                        it.userId != currentUserId && it.user.id != currentUserId && it.user.id != "ME"
                    }?.user
                } catch (_: Exception) {}
            }

            if (resolvedUser != null && resolvedUser.id.isNotBlank()) {
                val finalName = existingContact?.name?.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" && it != "User" }
                    ?: resolvedUser.name?.takeIf { it.isNotBlank() }
                    ?: existingChat?.contactName?.takeIf { it.isNotBlank() && it != "Contact" && it != "Unknown" }
                    ?: resolvedUser.phoneNumber.takeIf { it.isNotBlank() }
                    ?: "User"
                val finalAvatar = resolvedUser.avatarUrl?.takeIf { it.isNotBlank() }
                    ?: existingContact?.avatarUrl?.takeIf { it.isNotBlank() }
                    ?: existingChat?.contactAvatar?.takeIf { it.isNotBlank() }
                    ?: ""
                val finalPhone = resolvedUser.phoneNumber.takeIf { it.isNotBlank() }
                    ?: existingContact?.phoneNumber?.takeIf { it.isNotBlank() }
                    ?: ""
                val finalAbout = resolvedUser.about?.takeIf { it.isNotBlank() }
                    ?: existingContact?.aboutStatus?.takeIf { it.isNotBlank() }
                    ?: "Hey there! I am using VIBEZ."
                val finalVerified = resolvedUser.isVerified || existingContact?.isVerified == true || existingChat?.isVerified == true

                val updatedContact = ContactEntity(
                    id = existingContact?.id ?: resolvedUser.id,
                    remoteId = resolvedUser.id,
                    name = finalName,
                    phoneNumber = finalPhone,
                    avatarUrl = finalAvatar,
                    aboutStatus = finalAbout,
                    isOnline = existingContact?.isOnline ?: true,
                    lastSeen = resolvedUser.lastSeen.takeIf { it.isNotBlank() } ?: existingContact?.lastSeen ?: "Recently",
                    isVerified = finalVerified
                )
                dao.insertContact(updatedContact)

                if (existingChat != null && !existingChat.isGroup) {
                    dao.updateChat(
                        existingChat.copy(
                            contactId = updatedContact.id,
                            contactName = finalName,
                            contactAvatar = finalAvatar,
                            isOfficial = false,
                            isVerified = finalVerified
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun createGroupChat(groupName: String, contactIds: List<String>, token: String): String {
        return try {
            val memberIds = contactIds.filter { !it.contains("_") } 
            val request = CreateGroupRequest(name = groupName, memberIds = memberIds)
            val chatDto = NetworkClient.apiService.createGroupChat("Bearer $token", request)
            syncChats(token)
            chatDto.id
        } catch (e: Exception) {
            e.printStackTrace()
            throw e
        }
    }

    suspend fun syncContacts(phoneNumbers: List<String>, token: String): List<ContactEntity> {
        return try {
            val remoteUsers = NetworkClient.apiService.syncContacts("Bearer $token", SyncContactsRequest(phoneNumbers))
            val existingContacts = dao.getAllContactsOneShot()
            val syncedList = mutableListOf<ContactEntity>()

            for (user in remoteUsers) {
                val userPhone = user.phoneNumber ?: continue
                val remoteUserId = user.id

                val existing = existingContacts.firstOrNull {
                    it.id == remoteUserId || it.remoteId == remoteUserId || phonesMatch(it.phoneNumber, userPhone)
                }

                val contactName = when {
                    existing != null && existing.name.isNotBlank() && existing.name != userPhone && existing.name != "Contact" -> existing.name
                    !user.name.isNullOrBlank() -> user.name
                    else -> userPhone
                }

                val mergedContact = ContactEntity(
                    id = remoteUserId,
                    remoteId = remoteUserId,
                    name = contactName,
                    phoneNumber = userPhone,
                    avatarUrl = if (!user.avatarUrl.isNullOrEmpty()) user.avatarUrl else (existing?.avatarUrl ?: ""),
                    aboutStatus = if (!user.about.isNullOrEmpty()) user.about else (existing?.aboutStatus ?: "Hey there! I am using VIBEZ."),
                    isOnline = true,
                    lastSeen = user.lastSeen ?: existing?.lastSeen ?: "Recently",
                    isVerified = (user.isVerified == true) || (existing?.isVerified == true)
                )

                if (existing != null && existing.id != remoteUserId) {
                    dao.deleteContactById(existing.id)
                    dao.updateChatContactIdAndName(existing.id, remoteUserId, contactName)
                } else {
                    dao.updateChatContactName(remoteUserId, contactName)
                }

                dao.insertContact(mergedContact)
                syncedList.add(mergedContact)
            }
            syncedList
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun updateUserProfile(name: String, about: String, avatarUrl: String?, token: String): UserDto? {
        return try {
            val params = mutableMapOf<String, String>()
            if (name.isNotBlank()) {
                params["name"] = name
                params["displayName"] = name
            }
            params["about"] = about
            if (avatarUrl != null) params["avatarUrl"] = avatarUrl
            
            val updatedUser = NetworkClient.apiService.updateProfile("Bearer $token", params)
            
            // Perform CRUD with Room database
            val userId = updatedUser.id
            val resolvedAvatar = updatedUser.avatarUrl?.takeIf { it.isNotBlank() } ?: avatarUrl
            if (userId.isNotBlank()) {
                val existing = dao.getContactById(userId) ?: dao.getContactByRemoteId(userId)
                if (existing != null) {
                    val updatedContact = existing.copy(
                        name = if (name.isNotBlank()) name else existing.name,
                        aboutStatus = about,
                        avatarUrl = resolvedAvatar ?: existing.avatarUrl
                    )
                    dao.insertContact(updatedContact)
                    if (name.isNotBlank()) {
                        dao.updateChatContactName(existing.id, name)
                    }
                } else {
                    dao.insertContact(
                        ContactEntity(
                            id = userId,
                            remoteId = userId,
                            name = name,
                            phoneNumber = updatedUser.phoneNumber ?: "",
                            avatarUrl = resolvedAvatar ?: "",
                            aboutStatus = about,
                            isOnline = true
                        )
                    )
                }
            }
            
            updatedUser
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun requestPhoneChange(currentPhone: String, newPhone: String, token: String): RequestPhoneChangeResponse {
        return NetworkClient.apiService.requestPhoneChange(
            "Bearer $token",
            RequestPhoneChangeRequest(currentPhone = currentPhone, newPhone = newPhone)
        )
    }

    suspend fun verifyPhoneChange(requestId: String, verificationCode: String, token: String): VerifyPhoneChangeResponse {
        return NetworkClient.apiService.verifyPhoneChange(
            "Bearer $token",
            VerifyPhoneChangeRequest(requestId = requestId, verificationCode = verificationCode)
        )
    }

    suspend fun searchUsers(query: String, token: String): List<UserDto> {
        return try {
            NetworkClient.apiService.searchUsers("Bearer $token", query)
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun syncCommunities(token: String) {
        try {
            val dtos = NetworkClient.apiService.getCommunities("Bearer $token")
            dtos.forEach { 
                dao.insertCommunity(mapCommunityDtoToEntity(it))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun createCommunity(name: String, description: String?, avatarUrl: String?, token: String): CommunityEntity? {
        return try {
            val request = CreateCommunityRequest(name, description, avatarUrl)
            val dto = NetworkClient.apiService.createCommunity("Bearer $token", request)
            val entity = mapCommunityDtoToEntity(dto)
            dao.insertCommunity(entity)
            entity
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun deleteCommunity(communityId: String, token: String) {
        try {
            // First fetch the associated chats to delete them locally
            val chats = NetworkClient.apiService.getCommunityChats("Bearer $token", communityId)
            chats.forEach { chatDto ->
                dao.clearChatMessages(chatDto.id)
                dao.deleteChat(chatDto.id)
            }
            NetworkClient.apiService.deleteCommunity("Bearer $token", communityId)
            dao.deleteCommunity(communityId)
        } catch (e: Exception) {
            e.printStackTrace()
            // Ensure it's deleted locally even if network fails
            dao.deleteCommunity(communityId)
        }
    }

    suspend fun getCommunityChats(communityId: String, token: String): List<ChatEntity> {
        return try {
            val dtos = NetworkClient.apiService.getCommunityChats("Bearer $token", communityId)
            val entities = dtos.mapNotNull { dto ->
                if (dto.id.isBlank()) return@mapNotNull null
                val isOff = dto.isGroup && (dto.isOfficial || dto.id.contains("system_official", ignoreCase = true))
                ChatEntity(
                    id = dto.id,
                    remoteId = dto.id,
                    contactId = "",
                    contactName = dto.name ?: "Unknown",
                    lastMessage = dto.messages.firstOrNull()?.content ?: "",
                    lastMessageTime = parseDate(dto.messages.firstOrNull()?.createdAt),
                    unreadCount = 0,
                    isGroup = dto.isGroup,
                    isOfficial = isOff,
                    isVerified = isOff || dto.isVerified,
                    allowComments = dto.allowComments
                )
            }
            entities.forEach { dao.insertChat(it) }

            dtos.forEach { dto ->
                dto.messages.forEach { msgDto ->
                    dao.insertMessage(mapMessageDtoToEntity(msgDto))
                }
            }

            entities
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    private fun mapCommunityDtoToEntity(dto: CommunityDto): CommunityEntity {
        return CommunityEntity(
            id = dto.id,
            name = dto.name,
            description = dto.description ?: "",
            avatarUrl = dto.avatarUrl ?: "",
            ownerId = dto.ownerId ?: "",
            membersCount = dto.membersCount,
            createdAt = parseDate(dto.createdAt),
            isOfficial = dto.isOfficial,
            allowComments = dto.allowComments,
            allowReactions = dto.allowReactions
        )
    }

    suspend fun syncStatuses(token: String, currentUserId: String?) {
        try {
            val dtos = NetworkClient.apiService.getStatuses("Bearer $token")
            dtos.forEach { 
                dao.insertStatus(mapStatusDtoToEntity(it, currentUserId))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun markStatusViewed(statusId: String, token: String) {
        try {
            NetworkClient.apiService.viewStatus("Bearer $token", statusId)
            dao.markStatusViewed(statusId)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun deleteStatus(statusId: String, token: String) {
        try {
            val status = dao.getStatusById(statusId)
            status?.let { s ->
                if (s.mediaUrl.isNotEmpty() && !s.mediaUrl.startsWith("http")) {
                    try {
                        val file = java.io.File(s.mediaUrl)
                        if (file.exists()) file.delete()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
            NetworkClient.apiService.deleteStatus("Bearer $token", statusId)
            dao.deleteStatus(statusId)
        } catch (e: Exception) {
            e.printStackTrace()
            dao.deleteStatus(statusId)
        }
    }

    suspend fun uploadFile(
        token: String,
        uriString: String,
        type: String,
        contentResolver: android.content.ContentResolver
    ): String? = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
        if (uriString.isBlank()) return@withContext null
        if (uriString.startsWith("http://", ignoreCase = true) ||
            uriString.startsWith("https://", ignoreCase = true) ||
            uriString.startsWith("data:image", ignoreCase = true)
        ) {
            return@withContext uriString
        }

        val isImage = type.equals("IMAGE", ignoreCase = true) || 
                      type.equals("AVATAR", ignoreCase = true) || 
                      type.equals("PHOTO", ignoreCase = true) || 
                      type.equals("STATUS", ignoreCase = true) ||
                      type.equals("STATUS_PHOTO", ignoreCase = true)

        try {
            val ext = when {
                type.equals("VIDEO", ignoreCase = true) -> "mp4"
                type.equals("VOICE", ignoreCase = true) -> "m4a"
                type.equals("DOCUMENT", ignoreCase = true) -> "pdf"
                else -> "jpg"
            }
            val contentType = when {
                type.equals("VIDEO", ignoreCase = true) -> "video/mp4"
                type.equals("VOICE", ignoreCase = true) -> "audio/mp4"
                type.equals("DOCUMENT", ignoreCase = true) -> "application/pdf"
                else -> "image/jpeg"
            }
            val fileName = "${type.lowercase()}_${System.currentTimeMillis()}.$ext"

            val bytes: ByteArray? = when {
                isImage -> {
                    // Client-side image compression to reduce bandwidth and speed up posting
                    com.example.util.ImageUtils.compressImageBytes(contentResolver, uriString, maxDimension = 1080, quality = 80)
                }
                uriString.startsWith("/") -> {
                    val file = java.io.File(uriString)
                    if (file.exists()) file.readBytes() else null
                }
                else -> {
                    val uri = android.net.Uri.parse(uriString)
                    contentResolver.openInputStream(uri)?.use { it.readBytes() }
                }
            }

            if (bytes != null && bytes.isNotEmpty() && token.isNotBlank()) {
                val requestMap = mapOf(
                    "fileName" to fileName,
                    "contentType" to contentType
                )
                val response = NetworkClient.apiService.getUploadUrl("Bearer $token", requestMap)
                val uploadUrl = response.uploadUrl
                val publicUrl = response.publicUrl

                val isValidR2Url = uploadUrl.startsWith("https://") &&
                    !uploadUrl.contains("undefined") &&
                    publicUrl.startsWith("https://") &&
                    !publicUrl.contains("undefined")

                if (isValidR2Url) {
                    val okHttpClient = okhttp3.OkHttpClient()
                    val requestBody = okhttp3.RequestBody.create(contentType.toMediaTypeOrNull(), bytes)
                    val putRequest = okhttp3.Request.Builder()
                        .url(uploadUrl)
                        .put(requestBody)
                        .build()

                    val callResponse = okHttpClient.newCall(putRequest).execute()
                    if (callResponse.isSuccessful) {
                        return@withContext publicUrl
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Fallback for images/avatars: encode as compressed JPEG Base64 data URI so it syncs reliably across all devices
        if (isImage) {
            val maxDim = if (type.equals("AVATAR", ignoreCase = true)) 480 else 960
            return@withContext com.example.util.ImageUtils.encodeToDataUri(
                contentResolver = contentResolver,
                uriOrPath = uriString,
                maxDimension = maxDim,
                quality = 75
            )
        }

        null
    }

    suspend fun postStatus(
        caption: String,
        type: String,
        colorHex: String,
        mediaUrl: String,
        songTitle: String?,
        songArtist: String?,
        songPreviewUrl: String?,
        musicOffsetX: Float,
        musicOffsetY: Float,
        token: String,
        currentUserId: String? = null
    ): String {
        return try {
            val textStyleJson = if (songTitle != null) {
                val json = JSONObject()
                json.put("songTitle", songTitle)
                json.put("songArtist", songArtist ?: "")
                json.put("songPreviewUrl", songPreviewUrl ?: "")
                json.put("musicOffsetX", musicOffsetX.toDouble())
                json.put("musicOffsetY", musicOffsetY.toDouble())
                json.toString()
            } else {
                null
            }

            val request = CreateStatusRequest(
                content = caption,
                type = type,
                mediaUrl = mediaUrl,
                backgroundColor = colorHex,
                textStyle = textStyleJson
            )
            val dto = NetworkClient.apiService.createStatus("Bearer $token", request)
            val uid = currentUserId ?: context?.let { AuthManager(it).getUserId() }
            val entity = mapStatusDtoToEntity(dto, uid)
            dao.insertStatus(entity)
            entity.id
        } catch (e: Exception) {
            e.printStackTrace()
            ""
        }
    }

    private fun mapStatusDtoToEntity(dto: StatusDto, currentUserId: String?): StatusEntity {
        var sTitle: String? = null
        var sArtist: String? = null
        var sPreviewUrl: String? = null
        var sOffsetX = 0.5f
        var sOffsetY = 0.5f

        val ts = dto.textStyle
        if (!ts.isNullOrEmpty() && ts.startsWith("{") && ts.endsWith("}")) {
            try {
                val json = JSONObject(ts)
                sTitle = if (json.has("songTitle") && !json.isNull("songTitle")) json.optString("songTitle") else null
                sArtist = if (json.has("songArtist") && !json.isNull("songArtist")) json.optString("songArtist") else null
                sPreviewUrl = if (json.has("songPreviewUrl") && !json.isNull("songPreviewUrl")) json.optString("songPreviewUrl") else null
                sOffsetX = json.optDouble("musicOffsetX", 0.5).toFloat()
                sOffsetY = json.optDouble("musicOffsetY", 0.5).toFloat()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        val activeUid = currentUserId ?: context?.let { AuthManager(it).getUserId() }
        val isMine = (activeUid != null && (dto.userId == activeUid || dto.userId == "ME")) || dto.userId.contains("ME", ignoreCase = true)
        val authManager = context?.let { AuthManager(it) }
        val myName = authManager?.getUserName()
        val myAvatar = authManager?.getUserAvatar()

        val resolvedName = dto.user?.name?.takeIf { it.isNotBlank() && it != "Unknown" }
            ?: if (isMine) (myName?.takeIf { it.isNotBlank() && it != "Unknown" } ?: "My Status") else "Contact"
        val resolvedAvatar = dto.user?.avatarUrl?.takeIf { it.isNotBlank() }
            ?: if (isMine) (myAvatar ?: "") else ""

        val resolvedMediaType = when {
            dto.type.equals("VIDEO", ignoreCase = true) -> "VIDEO"
            !dto.mediaUrl.isNullOrBlank() -> "IMAGE"
            else -> "TEXT"
        }

        return StatusEntity(
            id = dto.id,
            contactId = dto.userId,
            contactName = resolvedName,
            contactAvatar = resolvedAvatar,
            mediaType = resolvedMediaType,
            mediaUrl = dto.mediaUrl ?: "",
            textCaption = dto.content ?: "",
            backgroundColorHex = dto.backgroundColor ?: "#075E54",
            timestamp = parseDate(dto.createdAt),
            isViewed = activeUid != null && dto.viewers.any { it.userId == activeUid },
            isMyStatus = isMine,
            viewCount = dto.viewers.size,
            songTitle = sTitle,
            songArtist = sArtist,
            songPreviewUrl = sPreviewUrl,
            musicOffsetX = sOffsetX,
            musicOffsetY = sOffsetY,
            viewers = dto.viewers.map { v ->
                val viewerTimestamp = parseDate(v.viewedAt)
                StatusViewer(
                    contactId = v.userId,
                    name = v.user?.name ?: "Unknown",
                    avatarUrl = v.user?.avatarUrl ?: "",
                    phoneNumber = v.user?.phoneNumber ?: "",
                    viewedTimestamp = viewerTimestamp,
                    timeAgoFormatted = formatTimeAgo(viewerTimestamp)
                )
            }
        )
    }

    private fun formatTimeAgo(timestamp: Long): String {
        val now = System.currentTimeMillis()
        val diff = now - timestamp
        return when {
            diff < 60000 -> "Just now"
            diff < 3600000 -> "${diff / 60000}m ago"
            diff < 86400000 -> "${diff / 3600000}h ago"
            else -> {
                val sdf = java.text.SimpleDateFormat("MMM d, h:mm a", java.util.Locale.getDefault())
                sdf.format(java.util.Date(timestamp))
            }
        }
    }

    suspend fun deleteExpiredStatuses() {
        val twentyFourHoursAgo = System.currentTimeMillis() - (24 * 60 * 60 * 1000L)
        try {
            val expired = dao.getExpiredStatuses(twentyFourHoursAgo)
            expired.forEach { s ->
                if (s.mediaUrl.isNotEmpty() && !s.mediaUrl.startsWith("http")) {
                    try {
                        val file = java.io.File(s.mediaUrl)
                        if (file.exists()) file.delete()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        dao.deleteExpiredStatuses(twentyFourHoursAgo)
    }

    suspend fun logCall(contactId: String, contactName: String, callType: String, isIncoming: Boolean, isMissed: Boolean, token: String? = null): String {
        val effectiveName = if (contactName.isBlank() || contactName == "Contact" || contactName == "Unknown") {
            val dbContact = dao.getContactById(contactId) ?: dao.getContactByRemoteId(contactId)
            dbContact?.name ?: "Contact"
        } else contactName

        val id = "call_${System.currentTimeMillis()}"
        val newLog = CallLogEntity(
            id = id,
            contactId = contactId,
            contactName = effectiveName,
            timestamp = System.currentTimeMillis(),
            callType = callType,
            isIncoming = isIncoming,
            isMissed = isMissed
        )
        dao.insertCallLog(newLog)

        try {
            if (!token.isNullOrBlank()) {
                val statusStr = if (isMissed) "MISSED" else "COMPLETED"
                logRemoteCall(contactId, callType, statusStr, 0, token)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return id
    }

    suspend fun syncCallLogs(token: String) {
        try {
            val dtos = NetworkClient.apiService.getCallLogs("Bearer $token")
            dtos.forEach { dto ->
                dao.insertCallLog(CallLogEntity(
                    id = dto.id,
                    contactId = if (dto.callerId == "ME") dto.receiverId else dto.callerId,
                    contactName = (if (dto.callerId == "ME") dto.receiver?.name else dto.caller?.name) ?: "Unknown",
                    timestamp = parseDate(dto.createdAt),
                    callType = dto.type,
                    isIncoming = dto.receiverId == "ME",
                    isMissed = dto.status == "MISSED"
                ))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun logRemoteCall(receiverId: String, type: String, status: String, duration: Int?, token: String) {
        try {
            NetworkClient.apiService.createCallLog("Bearer $token", CreateCallRequest(receiverId, type, status, duration))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun clearCallLogs(token: String? = null) {
        if (token != null) {
            clearRemoteCallLogs(token)
        } else {
            dao.clearCallLogs()
        }
    }

    suspend fun clearRemoteCallLogs(token: String) {
        try {
            NetworkClient.apiService.clearCallLogs("Bearer $token")
            dao.clearCallLogs()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updateStatusPrivacyRemote(mode: String, excluded: List<String>, included: List<String>, token: String) {
        try {
            NetworkClient.apiService.updateStatusPrivacy("Bearer $token", StatusPrivacyRequest(mode, excluded, included))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun getSettings(token: String): UserSettingsDto? {
        return try {
            NetworkClient.apiService.getSettings("Bearer $token")
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun updateSettings(settings: UserSettingsDto, token: String) {
        try {
            NetworkClient.apiService.updateSettings("Bearer $token", settings)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun getBadgeStatus(token: String): BadgeStatusResponse? {
        return try {
            NetworkClient.apiService.getBadgeStatus("Bearer $token")
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun processVerificationPayment(provider: String, token: String): BadgePaymentResponse? {
        return try {
            NetworkClient.apiService.processVerificationPayment(
                "Bearer $token",
                ProcessBadgePaymentRequest(paymentProvider = provider)
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun getSystemStatus(): SystemStatusResponse? {
        return try {
            NetworkClient.apiService.getSystemStatus()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun getAvailablePaymentProviders(token: String): List<PaymentProviderDto> {
        return NetworkClient.apiService.getAvailablePaymentProviders("Bearer $token")
    }

    suspend fun createPayment(token: String, request: CreatePaymentRequest): CreatePaymentResponse {
        return NetworkClient.apiService.createPayment("Bearer $token", request)
    }

    suspend fun reportUser(token: String, reportedUserId: String, reason: String): ReportUserResponse {
        return NetworkClient.apiService.reportUser("Bearer $token", ReportUserRequest(reportedUserId, reason))
    }

    suspend fun getLatestUpdate(): AppUpdateDto {
        return NetworkClient.apiService.getLatestUpdate()
    }

    suspend fun toggleCommunityVerifyPerk(communityId: String, token: String): Boolean {
        return try {
            val dto = NetworkClient.apiService.toggleCommunityVerifyPerk("Bearer $token", communityId)
            dao.insertCommunity(
                CommunityEntity(
                    id = dto.id,
                    name = dto.name,
                    description = dto.description ?: "",
                    avatarUrl = dto.avatarUrl ?: "",
                    ownerId = dto.ownerId ?: "",
                    isOfficial = dto.isOfficial,
                    allowComments = dto.allowComments,
                    allowReactions = dto.allowReactions,
                    createdAt = parseDate(dto.createdAt),
                    membersCount = dto.membersCount
                )
            )
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun toggleGroupVerifyPerk(chatId: String, token: String): Boolean {
        return try {
            val dto = NetworkClient.apiService.toggleGroupVerifyPerk("Bearer $token", chatId)
            val existing = dao.getChatById(chatId)
            val updated = existing?.copy(
                isOfficial = dto.isOfficial,
                isVerified = dto.isVerified
            ) ?: ChatEntity(
                id = dto.id,
                remoteId = dto.id,
                contactId = "",
                contactName = dto.name ?: "Group",
                lastMessage = "",
                unreadCount = 0,
                isGroup = dto.isGroup,
                isOfficial = dto.isOfficial,
                isVerified = dto.isVerified
            )
            dao.insertChat(updated)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun purgeExpiredMessages(): Int {
        return try {
            dao.purgeExpiredMessages(System.currentTimeMillis())
        } catch (e: Exception) {
            0
        }
    }

    suspend fun updateMessageTranscription(messageId: String, transcription: String) {
        try {
            dao.updateMessageTranscription(messageId, transcription)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updateChatEphemeralDuration(chatId: String, duration: Int) {
        try {
            dao.updateChatEphemeralDuration(chatId, duration)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updateChatLockStatus(chatId: String, isLocked: Boolean) {
        try {
            dao.updateChatLockStatus(chatId, isLocked)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun updateChatSubscriptionStatus(chatId: String, isSubscribed: Boolean) {
        try {
            dao.updateChatSubscriptionStatus(chatId, isSubscribed)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
