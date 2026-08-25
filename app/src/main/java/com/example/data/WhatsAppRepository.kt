package com.example.data

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.launch
import com.example.data.network.*
import org.json.JSONObject

class WhatsAppRepository(private val dao: WhatsAppDao) { // Keeping dao for binary compatibility if needed, but not using it

    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var socketManager: SocketManager? = null

    private val _allChats = MutableStateFlow<List<ChatEntity>>(emptyList())
    val allChats: StateFlow<List<ChatEntity>> = _allChats.asStateFlow()

    private val _allCommunities = MutableStateFlow<List<CommunityEntity>>(emptyList())
    val allCommunities: StateFlow<List<CommunityEntity>> = _allCommunities.asStateFlow()

    private val _allContacts = MutableStateFlow<List<ContactEntity>>(emptyList())
    val allContacts: StateFlow<List<ContactEntity>> = _allContacts.asStateFlow()

    private val _currentChatMessages = MutableStateFlow<Map<String, List<MessageEntity>>>(emptyMap())

    fun initSocket(userId: String, onNewMessage: (MessageEntity) -> Unit) {
        socketManager = SocketManager(userId).apply {
            connect { json ->
                val messageDto = parseMessageJson(json)
                val entity = mapMessageDtoToEntity(messageDto)
                
                // Update in-memory messages
                val currentList = _currentChatMessages.value[entity.chatId] ?: emptyList()
                val newList = (currentList + entity).distinctBy { it.id }
                _currentChatMessages.value = _currentChatMessages.value + (entity.chatId to newList)
                
                onNewMessage(entity)
            }
        }
    }

    private fun mapMessageDtoToEntity(dto: MessageDto): MessageEntity {
        return MessageEntity(
            id = dto.id,
            chatId = dto.chatId,
            senderId = if (dto.senderId == "ME") "ME" else dto.senderId,
            content = dto.content,
            timestamp = parseDate(dto.createdAt),
            status = dto.status,
            messageType = dto.type,
            mediaUrl = dto.mediaUrl ?: "",
            voiceDurationSeconds = dto.duration ?: 0
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

    suspend fun syncChats(token: String) {
        try {
            val remoteChats = NetworkClient.apiService.getChats("Bearer $token")
            val chatEntities = remoteChats.map { dto ->
                ChatEntity(
                    id = dto.id,
                    contactId = dto.members.firstOrNull { it.user.phoneNumber != "" }?.user?.id ?: "",
                    contactName = dto.name ?: dto.members.firstOrNull { it.user.phoneNumber != "" }?.user?.name ?: "Unknown",
                    lastMessage = dto.messages.firstOrNull()?.content ?: "",
                    lastMessageTime = parseDate(dto.messages.firstOrNull()?.createdAt),
                    unreadCount = 0,
                    isGroup = dto.isGroup
                )
            }
            _allChats.value = chatEntities
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun getMessagesForChat(chatId: String, token: String): List<MessageEntity> {
        return try {
            val dtos = NetworkClient.apiService.getMessages("Bearer $token", chatId)
            val entities = dtos.map { mapMessageDtoToEntity(it) }
            _currentChatMessages.value = _currentChatMessages.value + (chatId to entities)
            entities
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun getMessagesFlow(chatId: String): Flow<List<MessageEntity>> = MutableStateFlow(_currentChatMessages.value[chatId] ?: emptyList())

    suspend fun sendMessage(
        chatId: String,
        senderId: String,
        receiverId: String?,
        content: String,
        type: String = "TEXT",
        token: String
    ) {
        socketManager?.sendMessage(chatId, senderId, receiverId, content, type)
    }

    private fun parseMessageJson(json: JSONObject): MessageDto {
        return MessageDto(
            id = json.getString("id"),
            content = json.getString("content"),
            type = json.getString("type"),
            status = json.getString("status"),
            mediaUrl = json.optString("mediaUrl", null),
            duration = if (json.has("duration")) json.getInt("duration") else null,
            senderId = json.getString("senderId"),
            receiverId = json.optString("receiverId", null),
            chatId = json.getString("chatId"),
            createdAt = json.getString("createdAt"),
            sender = null
        )
    }

    private fun parseDate(dateStr: String?): Long {
        if (dateStr == null) return System.currentTimeMillis()
        return System.currentTimeMillis() // Simplified
    }

    suspend fun resetChatUnreadCount(chatId: String) {
        _allChats.value = _allChats.value.map {
            if (it.id == chatId) it.copy(unreadCount = 0) else it
        }
    }

    suspend fun updateChatMuteStatus(chatId: String, isMuted: Boolean) {
        _allChats.value = _allChats.value.map {
            if (it.id == chatId) it.copy(isMuted = isMuted) else it
        }
    }

    suspend fun getChatById(chatId: String): ChatEntity? = _allChats.value.find { it.id == chatId }
    suspend fun getMessageById(messageId: String): MessageEntity? = _currentChatMessages.value.values.flatten().find { it.id == messageId }

    suspend fun deleteMessage(messageId: String) {
        val currentMap = _currentChatMessages.value.toMutableMap()
        for ((cId, msgList) in currentMap) {
            val updated = msgList.filter { it.id != messageId }
            if (updated.size != msgList.size) {
                currentMap[cId] = updated
            }
        }
        _currentChatMessages.value = currentMap
    }

    suspend fun clearChat(chatId: String) {
        val currentMap = _currentChatMessages.value.toMutableMap()
        currentMap[chatId] = emptyList()
        _currentChatMessages.value = currentMap
        _allChats.value = _allChats.value.map {
            if (it.id == chatId) it.copy(lastMessage = "", lastMessageTime = System.currentTimeMillis()) else it
        }
    }

    suspend fun deleteChat(chatId: String) {
        _allChats.value = _allChats.value.filter { it.id != chatId }
        val currentMap = _currentChatMessages.value.toMutableMap()
        currentMap.remove(chatId)
        _currentChatMessages.value = currentMap
    }

    suspend fun toggleStarMessage(message: MessageEntity) {
        val currentMap = _currentChatMessages.value.toMutableMap()
        val list = currentMap[message.chatId] ?: return
        val updated = list.map {
            if (it.id == message.id) it.copy(isStarred = !it.isStarred) else it
        }
        currentMap[message.chatId] = updated
        _currentChatMessages.value = currentMap
    }

    suspend fun updateContact(id: String, name: String, phone: String, about: String) {
        _allContacts.value = _allContacts.value.map {
            if (it.id == id) it.copy(name = name, phoneNumber = phone, aboutStatus = about) else it
        }
        _allChats.value = _allChats.value.map {
            if (it.contactId == id) it.copy(contactName = name) else it
        }
    }

    suspend fun createNewContact(name: String, phone: String, about: String): String {
        val newId = "contact_${System.currentTimeMillis()}"
        val newContact = ContactEntity(
            id = newId,
            name = name,
            phoneNumber = phone,
            aboutStatus = if (about.isNotBlank()) about else "Hey there! I am using VIBEZ.",
            isOnline = true
        )
        _allContacts.value = (_allContacts.value.filter { it.phoneNumber != phone } + newContact)
        
        // Also ensure a chat entry exists or can be created
        val existingChat = _allChats.value.find { it.contactId == newId || it.contactName == name }
        if (existingChat == null) {
            val newChat = ChatEntity(
                id = "chat_${System.currentTimeMillis()}",
                contactId = newId,
                contactName = name,
                lastMessage = about.ifBlank { "Tap to start conversation" },
                lastMessageTime = System.currentTimeMillis(),
                unreadCount = 0,
                isGroup = false
            )
            _allChats.value = listOf(newChat) + _allChats.value
        }
        return newId
    }

    suspend fun createGroupChat(groupName: String, contactIds: List<String>): String {
        val newChatId = "group_${System.currentTimeMillis()}"
        val newChat = ChatEntity(
            id = newChatId,
            contactId = "",
            contactName = groupName,
            lastMessage = "You created group \"$groupName\"",
            lastMessageTime = System.currentTimeMillis(),
            unreadCount = 0,
            isGroup = true
        )
        _allChats.value = listOf(newChat) + _allChats.value
        return newChatId
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
            
            // Merge with existing contacts
            val currentMap = _allContacts.value.associateBy { it.phoneNumber }.toMutableMap()
            mappedContacts.forEach { currentMap[it.phoneNumber] = it }
            _allContacts.value = currentMap.values.toList()
            mappedContacts
        } catch (e: Exception) {
            e.printStackTrace()
            // Fallback for demo: return any matching from current contacts
            _allContacts.value
        }
    }

    suspend fun updateUserProfile(name: String, about: String, avatarUrl: String?, token: String): UserDto? {
        return try {
            val params = mutableMapOf("name" to name, "about" to about)
            if (avatarUrl != null) params["avatarUrl"] = avatarUrl
            NetworkClient.apiService.updateProfile("Bearer $token", params)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
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
            _allCommunities.value = dtos.map { mapCommunityDtoToEntity(it) }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun createCommunity(name: String, description: String?, avatarUrl: String?, token: String): CommunityEntity? {
        return try {
            val request = CreateCommunityRequest(name, description, avatarUrl)
            val dto = NetworkClient.apiService.createCommunity("Bearer $token", request)
            val entity = mapCommunityDtoToEntity(dto)
            _allCommunities.value = _allCommunities.value + entity
            entity
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun getCommunityChats(communityId: String, token: String): List<ChatEntity> {
        return try {
            val dtos = NetworkClient.apiService.getCommunityChats("Bearer $token", communityId)
            dtos.map { dto ->
                ChatEntity(
                    id = dto.id,
                    contactId = "",
                    contactName = dto.name ?: "Unknown",
                    lastMessage = dto.messages.firstOrNull()?.content ?: "",
                    lastMessageTime = parseDate(dto.messages.firstOrNull()?.createdAt),
                    unreadCount = 0,
                    isGroup = dto.isGroup
                )
            }
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
            membersCount = dto.membersCount,
            createdAt = parseDate(dto.createdAt)
        )
    }

    suspend fun syncStatuses(token: String) {
        try {
            val dtos = NetworkClient.apiService.getStatuses("Bearer $token")
            _allStatuses.value = dtos.map { mapStatusDtoToEntity(it) }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun markStatusViewed(statusId: String, token: String) {
        try {
            NetworkClient.apiService.viewStatus("Bearer $token", statusId)
            _allStatuses.value = _allStatuses.value.map {
                if (it.id == statusId) it.copy(isViewed = true) else it
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun deleteStatus(statusId: String, token: String) {
        try {
            NetworkClient.apiService.deleteStatus("Bearer $token", statusId)
            _allStatuses.value = _allStatuses.value.filter { it.id != statusId }
        } catch (e: Exception) {
            e.printStackTrace()
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
            val request = CreateStatusRequest(
                content = caption,
                type = type,
                mediaUrl = mediaUrl,
                backgroundColor = colorHex
            )
            val dto = NetworkClient.apiService.createStatus("Bearer $token", request)
            val entity = mapStatusDtoToEntity(dto)
            _allStatuses.value = _allStatuses.value + entity
            entity.id
        } catch (e: Exception) {
            e.printStackTrace()
            ""
        }
    }

    private fun mapStatusDtoToEntity(dto: StatusDto): StatusEntity {
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
            isViewed = dto.viewers.any { it.userId == "ME" }, // Simplified
            isMyStatus = dto.userId == "ME",
            viewCount = dto.viewers.size
        )
    }

    suspend fun deleteExpiredStatuses() {}
    suspend fun clearCallLogs() {
        _allCallLogs.value = emptyList()
    }

    suspend fun logCall(contactId: String, contactName: String, callType: String, isIncoming: Boolean, isMissed: Boolean): String {
        val newLog = CallLogEntity(
            id = "call_${System.currentTimeMillis()}",
            contactId = contactId,
            contactName = contactName,
            timestamp = System.currentTimeMillis(),
            callType = callType,
            isIncoming = isIncoming,
            isMissed = isMissed
        )
        _allCallLogs.value = listOf(newLog) + _allCallLogs.value
        return newLog.id
    }
    suspend fun syncCallLogs(token: String) {
        try {
            val dtos = NetworkClient.apiService.getCallLogs("Bearer $token")
            _allCallLogs.value = dtos.map { dto ->
                CallLogEntity(
                    id = dto.id,
                    contactId = if (dto.callerId == "ME") dto.receiverId else dto.callerId,
                    contactName = (if (dto.callerId == "ME") dto.receiver?.name else dto.caller?.name) ?: "Unknown",
                    timestamp = parseDate(dto.createdAt),
                    callType = dto.type,
                    isIncoming = dto.receiverId == "ME",
                    isMissed = dto.status == "MISSED"
                )
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

    suspend fun clearRemoteCallLogs(token: String) {
        try {
            NetworkClient.apiService.clearCallLogs("Bearer $token")
            _allCallLogs.value = emptyList()
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

    private val _allStatuses = MutableStateFlow<List<StatusEntity>>(emptyList())
    val allStatuses: StateFlow<List<StatusEntity>> = _allStatuses.asStateFlow()

    private val _allCallLogs = MutableStateFlow<List<CallLogEntity>>(emptyList())
    val allCallLogs: StateFlow<List<CallLogEntity>> = _allCallLogs.asStateFlow()
    val starredMessages: Flow<List<MessageEntity>> = MutableStateFlow<List<MessageEntity>>(emptyList())
}
