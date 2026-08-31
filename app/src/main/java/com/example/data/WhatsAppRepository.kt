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
import org.json.JSONObject
import okhttp3.MediaType.Companion.toMediaTypeOrNull

class WhatsAppRepository(private val dao: WhatsAppDao) {

    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    var socketManager: SocketManager? = null

    // Room-backed Flow streams
    val allChats: Flow<List<ChatEntity>> = dao.getAllChats()
    val allCommunities: Flow<List<CommunityEntity>> = dao.getAllCommunities()
    val allContacts: Flow<List<ContactEntity>> = dao.getAllContacts()
    val allStatuses: Flow<List<StatusEntity>> = dao.getAllStatuses()
    val allCallLogs: Flow<List<CallLogEntity>> = dao.getAllCallLogs()
    val starredMessages: Flow<List<MessageEntity>> = dao.getStarredMessages()

    fun initSocket(userId: String, onNewMessage: (MessageEntity) -> Unit) {
        socketManager = SocketManager(userId).apply {
            connect { json ->
                try {
                    val messageDto = parseMessageJson(json)
                    val entity = mapMessageDtoToEntity(messageDto)
                    
                    repositoryScope.launch {
                        dao.insertMessage(entity)
                        
                        // Update chat's last message
                        val chat = dao.getChatById(entity.chatId)
                        chat?.let {
                            dao.updateChat(it.copy(
                                lastMessage = entity.content,
                                lastMessageTime = entity.timestamp,
                                unreadCount = it.unreadCount + 1
                            ))
                        }
                    }
                    
                    onNewMessage(entity)
                } catch (e: Exception) {
                    android.util.Log.e("WhatsAppRepository", "Error parsing socket message", e)
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
        }
    }

    private val _incomingCall = MutableStateFlow<JSONObject?>(null)
    val incomingCall = _incomingCall.asStateFlow()

    private val _callAnswer = MutableStateFlow<JSONObject?>(null)
    val callAnswer = _callAnswer.asStateFlow()

    private val _iceCandidate = MutableStateFlow<JSONObject?>(null)
    val iceCandidate = _iceCandidate.asStateFlow()

    fun clearCallSignals() {
        _incomingCall.value = null
        _callAnswer.value = null
        _iceCandidate.value = null
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
            val remoteChats = NetworkClient.apiService.getChats("Bearer $token")
            remoteChats.forEach { dto ->
                val isOff = dto.isOfficial || dto.id.contains("official", ignoreCase = true) || dto.name?.contains("Official", ignoreCase = true) == true
                val isVer = dto.isVerified || isOff || dto.members.any { it.user.isVerified }
                val entity = ChatEntity(
                    id = dto.id,
                    remoteId = dto.id,
                    contactId = dto.members.firstOrNull { it.user.phoneNumber != "" }?.user?.id ?: "",
                    contactName = dto.name ?: dto.members.firstOrNull { it.user.phoneNumber != "" }?.user?.name ?: "Unknown",
                    lastMessage = dto.messages.firstOrNull()?.content ?: "",
                    lastMessageTime = parseDate(dto.messages.firstOrNull()?.createdAt),
                    unreadCount = 0,
                    isGroup = dto.isGroup,
                    isMuted = dto.isMuted,
                    customWallpaper = dto.wallpaper,
                    isOfficial = isOff,
                    isVerified = isVer
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
        dao.insertMessage(message)
        val chat = dao.getChatById(message.chatId)
        chat?.let {
            dao.updateChat(it.copy(
                lastMessage = message.content,
                lastMessageTime = message.timestamp
            ))
        }
    }

    suspend fun sendMessage(
        chatId: String,
        senderId: String,
        receiverId: String?,
        content: String,
        type: String = "TEXT",
        token: String,
        id: String? = null
    ) {
        socketManager?.sendMessage(chatId, senderId, receiverId, content, type, id = id)
    }

    private fun parseMessageJson(json: JSONObject): MessageDto {
        return MessageDto(
            id = json.optString("id", java.util.UUID.randomUUID().toString()),
            content = json.optString("content", ""),
            type = json.optString("type", "TEXT"),
            status = json.optString("status", "SENT"),
            mediaUrl = json.optString("mediaUrl", null),
            duration = if (!json.isNull("duration")) json.optInt("duration", 0) else null,
            senderId = json.optString("senderId", "unknown"),
            receiverId = json.optString("receiverId", null),
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

    suspend fun resetChatUnreadCount(chatId: String) {
        dao.resetChatUnreadCount(chatId)
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
            NetworkClient.apiService.deleteChat("Bearer $token", chatId)
            dao.deleteChat(chatId)
            dao.clearChatMessages(chatId)
        } catch (e: Exception) {
            e.printStackTrace()
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

    suspend fun createNewContact(name: String, phone: String, about: String, token: String): String {
        val cleanPhone = phone.replace(Regex("[^0-9+]"), "").trim()
        return try {
            val searchResults = NetworkClient.apiService.searchUsers("Bearer $token", cleanPhone)
            val targetUser = searchResults.firstOrNull { 
                val userClean = (it.phoneNumber ?: "").replace(Regex("[^0-9+]"), "").trim()
                userClean == cleanPhone || (cleanPhone.length >= 7 && userClean.endsWith(cleanPhone.takeLast(7)))
            }
            
            val finalContactId = targetUser?.id ?: "contact_${System.currentTimeMillis()}"
            val finalPhone = targetUser?.phoneNumber ?: phone

            // Always insert contact into Room database so they appear in contact list
            dao.insertContact(
                ContactEntity(
                    id = finalContactId,
                    remoteId = finalContactId,
                    name = name,
                    phoneNumber = finalPhone,
                    avatarUrl = targetUser?.avatarUrl ?: "",
                    aboutStatus = about,
                    isOnline = true
                )
            )

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
            // Fallback: save contact locally
            val localId = "contact_${System.currentTimeMillis()}"
            dao.insertContact(
                ContactEntity(
                    id = localId,
                    remoteId = localId,
                    name = name,
                    phoneNumber = phone,
                    avatarUrl = "",
                    aboutStatus = about,
                    isOnline = false
                )
            )
            localId
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
            val mappedContacts = remoteUsers.map { user ->
                ContactEntity(
                    id = user.id,
                    remoteId = user.id,
                    name = user.name ?: user.phoneNumber,
                    phoneNumber = user.phoneNumber,
                    avatarUrl = user.avatarUrl ?: "",
                    aboutStatus = user.about ?: "Hey there! I am using VIBEZ.",
                    isOnline = true,
                    lastSeen = user.lastSeen
                )
            }
            
            mappedContacts.forEach { 
                dao.insertContact(it)
            }
            mappedContacts
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
            if (userId.isNotBlank()) {
                val existing = dao.getContactById(userId) ?: dao.getContactByRemoteId(userId)
                if (existing != null) {
                    dao.updateContactDetails(existing.id, name, existing.phoneNumber, about)
                    dao.updateChatContactName(existing.id, name)
                } else {
                    dao.insertContact(
                        ContactEntity(
                            id = userId,
                            remoteId = userId,
                            name = name,
                            phoneNumber = updatedUser.phoneNumber ?: "",
                            avatarUrl = avatarUrl ?: "",
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

    suspend fun getCommunityChats(communityId: String, token: String): List<ChatEntity> {
        return try {
            val dtos = NetworkClient.apiService.getCommunityChats("Bearer $token", communityId)
            val entities = dtos.map { dto ->
                val isOff = dto.isOfficial || dto.id.contains("official", ignoreCase = true) || dto.name?.contains("Official", ignoreCase = true) == true
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
                    isVerified = isOff || dto.isVerified
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
    ): String? {
        return try {
            val uri = android.net.Uri.parse(uriString)
            val fileName = "status_${System.currentTimeMillis()}.${if (type == "VIDEO") "mp4" else "jpg"}"
            val contentType = if (type == "VIDEO") "video/mp4" else "image/jpeg"

            val requestMap = mapOf(
                "fileName" to fileName,
                "contentType" to contentType
            )
            val response = NetworkClient.apiService.getUploadUrl("Bearer $token", requestMap)
            val uploadUrl = response.uploadUrl
            val publicUrl = response.publicUrl

            val inputStream = contentResolver.openInputStream(uri) ?: return null
            val bytes = inputStream.readBytes()
            inputStream.close()

            val okHttpClient = okhttp3.OkHttpClient()
            val requestBody = okhttp3.RequestBody.create(contentType.toMediaTypeOrNull(), bytes)
            val putRequest = okhttp3.Request.Builder()
                .url(uploadUrl)
                .put(requestBody)
                .build()

            val callResponse = okHttpClient.newCall(putRequest).execute()
            if (callResponse.isSuccessful) {
                publicUrl
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
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
        token: String
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
            val entity = mapStatusDtoToEntity(dto, null)
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
                sTitle = json.optString("songTitle", null)
                sArtist = json.optString("songArtist", null)
                sPreviewUrl = json.optString("songPreviewUrl", null)
                sOffsetX = json.optDouble("musicOffsetX", 0.5).toFloat()
                sOffsetY = json.optDouble("musicOffsetY", 0.5).toFloat()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        return StatusEntity(
            id = dto.id,
            contactId = dto.userId,
            contactName = dto.user?.name ?: "Unknown",
            contactAvatar = dto.user?.avatarUrl ?: "",
            mediaType = dto.type,
            mediaUrl = dto.mediaUrl ?: "",
            textCaption = dto.content ?: "",
            backgroundColorHex = dto.backgroundColor ?: "#075E54",
            timestamp = parseDate(dto.createdAt),
            isViewed = currentUserId != null && dto.viewers.any { it.userId == currentUserId },
            isMyStatus = currentUserId != null && dto.userId == currentUserId,
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
            dbContact?.name ?: if (contactId == "network_test_echo") "Network & Echo Test Server" else "Contact"
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
            if (!token.isNullOrBlank() && contactId != "network_test_echo") {
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
}
