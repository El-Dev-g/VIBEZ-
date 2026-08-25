package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.CallLogEntity
import com.example.data.ChatEntity
import com.example.data.ContactEntity
import com.example.data.MessageEntity
import com.example.data.StatusEntity
import com.example.data.WhatsAppDatabase
import com.example.data.WhatsAppRepository
import com.example.util.AuthManager
import com.example.data.network.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import com.example.data.AppleMusicApiService
import com.example.data.ITunesResult
import com.example.data.MusicTrack
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.flow.asStateFlow
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

data class IncomingNotification(
    val contactName: String,
    val content: String,
    val chatId: String,
    val contactAvatar: String = ""
)

class WhatsAppViewModel(application: Application) : AndroidViewModel(application) {
    
    private val appleMusicApi: AppleMusicApiService by lazy {
        val moshi = Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()
        Retrofit.Builder()
            .baseUrl("https://itunes.apple.com/")
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(AppleMusicApiService::class.java)
    }

    private val _musicSearchResults = MutableStateFlow<List<MusicTrack>>(emptyList())
    val musicSearchResults = _musicSearchResults.asStateFlow()

    private val _isMusicSearching = MutableStateFlow(false)
    val isMusicSearching = _isMusicSearching.asStateFlow()

    fun searchAppleMusic(query: String) {
        if (query.isBlank()) {
            _musicSearchResults.value = emptyList()
            return
        }
        viewModelScope.launch {
            _isMusicSearching.value = true
            try {
                val response = appleMusicApi.searchMusic(query)
                _musicSearchResults.value = response.results.map {
                    MusicTrack(
                        title = it.trackName ?: "Unknown",
                        artist = it.artistName ?: "Unknown",
                        duration = formatDuration(it.durationMillis ?: 0L),
                        previewUrl = it.previewUrl,
                        artworkUrl = it.artworkUrl
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _musicSearchResults.value = emptyList()
            } finally {
                _isMusicSearching.value = false
            }
        }
    }

    private fun formatDuration(millis: Long): String {
        val seconds = (millis / 1000) % 60
        val minutes = (millis / (1000 * 60)) % 60
        return String.format("%d:%02d", minutes, seconds)
    }

    private val authManager = AuthManager(application)
    
    val isLoggedIn = MutableStateFlow(authManager.isLoggedIn())
    val currentUserPhone = MutableStateFlow(authManager.getPhoneNumber() ?: "")
    val currentUserName = MutableStateFlow(authManager.getUserName() ?: authManager.getPhoneNumber()?.let { "User" } ?: "")
    val currentUserStatus = MutableStateFlow(authManager.getUserAbout() ?: "")
    val currentUserAvatar = MutableStateFlow(authManager.getUserAvatar() ?: "")
    val currentGoogleEmail = MutableStateFlow(authManager.getGoogleEmail())
    val currentAuthProvider = MutableStateFlow(authManager.getAuthProvider())
    val typingChatId = MutableStateFlow<String?>(null)

    // Verification Badge State
    val isVerified = MutableStateFlow(false)
    val badgeStatus = MutableStateFlow<BadgeStatusResponse?>(null)

    // Maintenance Mode State
    val isMaintenanceMode = MutableStateFlow(false)

    // Contact Sync State
    val isSyncingContacts = MutableStateFlow(false)
    val syncStatusMessage = MutableStateFlow<String?>(null)

    // Settings preferences state
    val isBiometricLockEnabled = MutableStateFlow(authManager.getSettingBoolean("biometric_lock", false))
    val isHdMediaUpload = MutableStateFlow(authManager.getSettingBoolean("hd_media", true))
    val isHapticFeedback = MutableStateFlow(authManager.getSettingBoolean("haptic_feedback", true))
    val isReadReceiptsEnabled = MutableStateFlow(authManager.getSettingBoolean("read_receipts", true))
    val isConversationTonesEnabled = MutableStateFlow(authManager.getSettingBoolean("conversation_tones", true))
    val isHighPriorityNotificationsEnabled = MutableStateFlow(authManager.getSettingBoolean("high_priority_notif", true))

    // Status Privacy State
    val statusPrivacyMode = MutableStateFlow("MY_CONTACTS") // "MY_CONTACTS", "EXCEPT", "ONLY_SHARE"
    val statusPrivacyExcludedIds = MutableStateFlow<Set<String>>(emptySet())
    val statusPrivacyIncludedIds = MutableStateFlow<Set<String>>(emptySet())

    // Chat Wallpaper State (chatId -> wallpaperKey / hex / uri)
    val chatWallpapers = MutableStateFlow<Map<String, String>>(emptyMap())
    val globalWallpaper = MutableStateFlow("DEFAULT")
    val wallpaperDimming = MutableStateFlow(0.15f)

    val contacts: StateFlow<List<ContactEntity>>
    val chats: StateFlow<List<ChatEntity>>
    val communities: StateFlow<List<com.example.data.CommunityEntity>>
    val filteredChats: StateFlow<List<ChatEntity>>
    val statuses: StateFlow<List<StatusEntity>>
    val callLogs: StateFlow<List<CallLogEntity>>
    val starredMessages: StateFlow<List<MessageEntity>>

    val searchQuery = MutableStateFlow("")
    val isDarkMode = MutableStateFlow(false)
    val selectedTab = MutableStateFlow(0) // 0: Chats, 1: Updates, 2: Communities, 3: Calls

    val incomingNotification = MutableStateFlow<IncomingNotification?>(null)

    private val repository: WhatsAppRepository

    init {
        val database = WhatsAppDatabase.getDatabase(application)
        repository = WhatsAppRepository(database.whatsAppDao())

        viewModelScope.launch {
            repository.deleteExpiredStatuses()
            
            // If logged in, init socket and sync data
            authManager.getUserId()?.let { uid ->
                repository.initSocket(uid) { 
                    // Handle incoming
                }
                authManager.getAuthToken()?.let { token ->
                    repository.syncStatuses(token)
                    repository.syncCommunities(token)
                }
            }
        }

        contacts = repository.allContacts.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        chats = repository.allChats.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
        
        communities = repository.allCommunities.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        statuses = repository.allStatuses.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        callLogs = repository.allCallLogs.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        starredMessages = repository.starredMessages.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        filteredChats = combine(chats, searchQuery) { chatList, query ->
            if (query.isBlank()) {
                chatList
            } else {
                chatList.filter {
                    it.contactName.contains(query, ignoreCase = true) ||
                            it.lastMessage.contains(query, ignoreCase = true)
                }
            }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
    }

    fun getAuthToken(): String? = authManager.getAuthToken()

    suspend fun syncEverythingWithBackend() {
        authManager.getAuthToken()?.let { token ->
            repository.syncChats(token)
            repository.syncStatuses(token)
            repository.syncCommunities(token)
            repository.syncCallLogs(token)
            repository.getSettings(token)?.let { settings ->
                statusPrivacyMode.value = settings.statusPrivacyMode
            }
        }
    }

    fun loginWithGoogle(
        email: String,
        name: String,
        avatarUrl: String? = null,
        phone: String? = null,
        idToken: String? = null,
        onComplete: ((Boolean, String?) -> Unit)? = null
    ) {
        viewModelScope.launch {
            try {
                val effectivePhone = phone?.ifBlank { null } ?: ""
                val response = repository.loginWithGoogle(email, name, avatarUrl, effectivePhone, idToken)
                
                authManager.saveAuthData(
                    token = response.token,
                    userId = response.user.id,
                    phoneNumber = response.user.phoneNumber.ifBlank { effectivePhone },
                    userName = response.user.name ?: name,
                    userAbout = response.user.about ?: "⚡ Connected with Google",
                    userAvatar = response.user.avatarUrl ?: avatarUrl,
                    googleEmail = email,
                    authProvider = "GOOGLE"
                )
                
                currentUserPhone.value = response.user.phoneNumber.ifBlank { effectivePhone }
                currentUserName.value = response.user.name ?: name
                currentUserStatus.value = response.user.about ?: "⚡ Connected with Google"
                currentUserAvatar.value = response.user.avatarUrl ?: avatarUrl ?: ""
                currentGoogleEmail.value = email
                currentAuthProvider.value = "GOOGLE"
                isLoggedIn.value = true

                // Initialize Socket & Sync
                repository.initSocket(response.user.id) { }
                repository.syncChats(response.token)
                repository.syncStatuses(response.token)
                repository.syncCommunities(response.token)

                onComplete?.invoke(true, null)
            } catch (e: Exception) {
                e.printStackTrace()
                onComplete?.invoke(false, e.message)
            }
        }
    }

    fun handleScannedQr(result: String, onComplete: (String?) -> Unit) {
        // Scanned result is expected to be a phone number for simplicity
        val cleaned = result.filter { it.isDigit() || it == '+' }
        if (cleaned.isNotEmpty()) {
            createNewContact("New Contact", cleaned, "Added via QR Code") { contactId ->
                val existingChat = chats.value.firstOrNull { it.contactId == contactId }
                onComplete(existingChat?.id)
            }
        } else {
            onComplete(null)
        }
    }

    fun logoutUser() {
        authManager.logout()
        isLoggedIn.value = false
    }

    fun updateUserProfile(name: String, about: String, phoneNumber: String? = null, avatarUrl: String? = null) {
        currentUserName.value = name
        currentUserStatus.value = about
        if (phoneNumber != null) currentUserPhone.value = phoneNumber
        if (avatarUrl != null) currentUserAvatar.value = avatarUrl
        authManager.saveAuthData(
            token = authManager.getAuthToken() ?: "",
            userId = authManager.getUserId() ?: "",
            phoneNumber = phoneNumber ?: currentUserPhone.value,
            userName = name,
            userAbout = about,
            userAvatar = avatarUrl ?: currentUserAvatar.value,
            googleEmail = currentGoogleEmail.value,
            authProvider = currentAuthProvider.value
        )
    }

    fun unlinkGoogleAccount() {
        currentGoogleEmail.value = null
        currentAuthProvider.value = "PHONE"
        authManager.saveAuthData(
            token = authManager.getAuthToken() ?: "",
            userId = authManager.getUserId() ?: "",
            phoneNumber = currentUserPhone.value,
            userName = currentUserName.value,
            userAbout = currentUserStatus.value,
            userAvatar = currentUserAvatar.value,
            googleEmail = null,
            authProvider = "PHONE"
        )
    }

    private val messagesFlowMap = java.util.concurrent.ConcurrentHashMap<String, StateFlow<List<MessageEntity>>>()

    fun getMessagesForChat(chatId: String): StateFlow<List<MessageEntity>> {
        return messagesFlowMap.getOrPut(chatId) {
            repository.getMessagesFlow(chatId).stateIn(
                scope = viewModelScope,
                started = SharingStarted.Lazily,
                initialValue = emptyList()
            )
        }
    }

    fun sendMessage(
        chatId: String,
        content: String,
        messageType: String = "TEXT",
        mediaUrl: String = "",
        voiceDurationSeconds: Int = 0,
        replyToMessageId: String? = null
    ) {
        viewModelScope.launch {
            repository.sendMessage(
                chatId = chatId,
                senderId = authManager.getUserId() ?: "ME",
                receiverId = null, // Backend can infer or we pass it
                content = content,
                type = messageType,
                token = authManager.getAuthToken() ?: ""
            )

            // Trigger typing indicator animation then auto-reply
            delay(1000)
            typingChatId.value = chatId
            delay(2000)
            typingChatId.value = null
        }
    }

    fun updateCurrentUserProfile(
        name: String,
        phone: String,
        status: String,
        avatarUrl: String? = null,
        onComplete: ((Boolean) -> Unit)? = null
    ) {
        currentUserName.value = name
        currentUserPhone.value = phone
        currentUserStatus.value = status
        if (avatarUrl != null) {
            currentUserAvatar.value = avatarUrl
        }
        authManager.updateProfile(name, status, avatarUrl ?: currentUserAvatar.value)
        
        viewModelScope.launch {
            val token = authManager.getAuthToken()
            if (!token.isNullOrBlank()) {
                repository.updateUserProfile(name, status, avatarUrl ?: currentUserAvatar.value, token)
            }
            onComplete?.invoke(true)
        }
    }

    fun syncContacts(phoneNumbers: List<String>, onComplete: ((List<ContactEntity>) -> Unit)? = null) {
        viewModelScope.launch {
            isSyncingContacts.value = true
            syncStatusMessage.value = "Syncing ${phoneNumbers.size} contacts with VIBEZ directory..."
            try {
                val token = authManager.getAuthToken() ?: ""
                val syncedList = repository.syncContacts(phoneNumbers, token)
                syncStatusMessage.value = "Synced ${syncedList.size} registered VIBEZ contacts"
                delay(1200)
                syncStatusMessage.value = null
                onComplete?.invoke(syncedList)
            } catch (e: Exception) {
                e.printStackTrace()
                syncStatusMessage.value = "Contact sync completed"
                delay(1200)
                syncStatusMessage.value = null
                onComplete?.invoke(contacts.value)
            } finally {
                isSyncingContacts.value = false
            }
        }
    }

    fun setSetting(key: String, value: Boolean) {
        authManager.setSettingBoolean(key, value)
        when (key) {
            "biometric_lock" -> isBiometricLockEnabled.value = value
            "hd_media" -> isHdMediaUpload.value = value
            "haptic_feedback" -> isHapticFeedback.value = value
            "read_receipts" -> isReadReceiptsEnabled.value = value
            "conversation_tones" -> isConversationTonesEnabled.value = value
            "high_priority_notif" -> isHighPriorityNotificationsEnabled.value = value
        }
    }

    fun updateContact(contactId: String, name: String, phone: String, about: String) {
        viewModelScope.launch {
            repository.updateContact(contactId, name, phone, about)
        }
    }

    fun createNewContact(name: String, phone: String, about: String, onComplete: (String) -> Unit) {
        viewModelScope.launch {
            val contactId = repository.createNewContact(name, phone, about)
            onComplete(contactId)
        }
    }

    fun createGroupChat(groupName: String, contactIds: List<String>, onComplete: (String) -> Unit) {
        viewModelScope.launch {
            val chatId = repository.createGroupChat(groupName, contactIds)
            onComplete(chatId)
        }
    }

    fun toggleStarMessage(message: MessageEntity) {
        viewModelScope.launch {
            repository.toggleStarMessage(message)
        }
    }

    fun deleteMessage(messageId: String) {
        viewModelScope.launch {
            repository.deleteMessage(messageId)
        }
    }

    fun clearChat(chatId: String) {
        viewModelScope.launch {
            repository.clearChat(chatId)
        }
    }

    fun deleteChat(chatId: String) {
        viewModelScope.launch {
            repository.deleteChat(chatId)
        }
    }

    fun resetChatUnreadCount(chatId: String) {
        viewModelScope.launch {
            repository.resetChatUnreadCount(chatId)
        }
    }

    fun syncStatuses() {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.syncStatuses(token)
            }
        }
    }

    fun postStatus(
        caption: String,
        type: String = "TEXT",
        colorHex: String = "#075E54",
        mediaUrl: String = "",
        songTitle: String? = null,
        songArtist: String? = null,
        songPreviewUrl: String? = null,
        musicOffsetX: Float = 0.5f,
        musicOffsetY: Float = 0.5f
    ) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.postStatus(caption, type, colorHex, mediaUrl, songTitle, songArtist, songPreviewUrl, musicOffsetX, musicOffsetY, token)
            }
        }
    }

    fun markStatusViewed(statusId: String) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.markStatusViewed(statusId, token)
            }
        }
    }

    fun deleteStatus(statusId: String) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.deleteStatus(statusId, token)
            }
        }
    }

    fun getStatusViewers(statusId: String): List<com.example.data.StatusViewer> {
        return emptyList()
    }

    fun logCall(contactId: String, contactName: String, callType: String, isIncoming: Boolean, isMissed: Boolean) {
        viewModelScope.launch {
            repository.logCall(contactId, contactName, callType, isIncoming, isMissed)
        }
    }

    fun toggleDarkMode() {
        isDarkMode.value = !isDarkMode.value
    }

    fun setSelectedTab(index: Int) {
        selectedTab.value = index
        if (index == 1) { // Updates tab
            syncStatuses()
        }
        if (index == 2) { // Communities tab
            syncCommunities()
        }
    }

    fun syncCommunities() {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.syncCommunities(token)
            }
        }
    }

    fun createCommunity(name: String, description: String?, avatarUrl: String?, onComplete: (com.example.data.CommunityEntity?) -> Unit) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                val community = repository.createCommunity(name, description, avatarUrl, token)
                onComplete(community)
            }
        }
    }

    fun getCommunityChats(communityId: String, onComplete: (List<ChatEntity>) -> Unit) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                val chats = repository.getCommunityChats(communityId, token)
                onComplete(chats)
            }
        }
    }

    fun clearCallLogs() {
        viewModelScope.launch {
            repository.clearCallLogs()
        }
    }

    fun updateStatusPrivacy(mode: String, excluded: Set<String>, included: Set<String>) {
        statusPrivacyMode.value = mode
        statusPrivacyExcludedIds.value = excluded
        statusPrivacyIncludedIds.value = included
        
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.updateStatusPrivacyRemote(mode, excluded.toList(), included.toList(), token)
            }
        }
    }

    fun setChatWallpaper(chatId: String?, wallpaperValue: String, dimming: Float = 0.15f) {
        wallpaperDimming.value = dimming
        if (chatId == null || chatId == "") {
            globalWallpaper.value = wallpaperValue
        } else {
            val currentMap = chatWallpapers.value.toMutableMap()
            currentMap[chatId] = wallpaperValue
            chatWallpapers.value = currentMap
        }
    }

    fun toggleMuteChat(chatId: String) {
        viewModelScope.launch {
            val chat = repository.getChatById(chatId)
            if (chat != null) {
                repository.updateChatMuteStatus(chatId, !chat.isMuted)
            }
        }
    }

    suspend fun getMessageById(messageId: String): MessageEntity? {
        return repository.getMessageById(messageId)
    }

    fun forwardMessage(
        content: String,
        messageType: String,
        mediaUrl: String,
        durationSeconds: Int,
        targetChatIds: List<String>,
        onComplete: () -> Unit
    ) {
        viewModelScope.launch {
            targetChatIds.forEach { chatId ->
                repository.sendMessage(
                    chatId = chatId,
                    senderId = authManager.getUserId() ?: "ME",
                    receiverId = null,
                    content = content,
                    type = messageType,
                    token = authManager.getAuthToken() ?: ""
                )
            }
            onComplete()
        }
    }

    fun refreshBadgeStatus() {
        viewModelScope.launch {
            val token = authManager.getAuthToken()
            if (!token.isNullOrBlank()) {
                val response = repository.getBadgeStatus(token)
                if (response != null) {
                    badgeStatus.value = response
                    isVerified.value = response.isVerified
                    return@launch
                }
            }
            // Fallback or unauthenticated check: fetch from public system status endpoint
            val systemStatus = repository.getSystemStatus()
            if (systemStatus != null) {
                val formattedPrice = String.format(java.util.Locale.US, "$%.2f USD", systemStatus.badgePrice)
                badgeStatus.value = (badgeStatus.value ?: com.example.data.network.BadgeStatusResponse(
                    isVerified = isVerified.value,
                    verifiedAt = null
                )).copy(
                    badgePrice = systemStatus.badgePrice,
                    price = formattedPrice
                )
            }
        }
    }

    fun processVerificationPayment(provider: String, onComplete: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            val token = authManager.getAuthToken()
            if (token.isNullOrBlank()) {
                onComplete(false, "User not authenticated")
                return@launch
            }

            val response = repository.processVerificationPayment(provider, token)
            if (response != null && response.success) {
                isVerified.value = true
                refreshBadgeStatus()
                onComplete(true, response.message)
            } else {
                onComplete(false, response?.message ?: "Payment failed")
            }
        }
    }

    fun checkSystemStatus() {
        viewModelScope.launch {
            val status = repository.getSystemStatus()
            if (status != null) {
                isMaintenanceMode.value = status.maintenanceMode
                val formattedPrice = String.format(java.util.Locale.US, "$%.2f USD", status.badgePrice)
                badgeStatus.value = (badgeStatus.value ?: com.example.data.network.BadgeStatusResponse(
                    isVerified = isVerified.value,
                    verifiedAt = null
                )).copy(
                    badgePrice = status.badgePrice,
                    price = formattedPrice
                )
            }
        }
    }
}
