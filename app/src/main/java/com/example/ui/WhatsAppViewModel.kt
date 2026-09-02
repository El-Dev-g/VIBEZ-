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

    val authManager = AuthManager(application)
    
    val isLoggedIn = MutableStateFlow(authManager.isLoggedIn())
    val currentUserPhone = MutableStateFlow(authManager.getPhoneNumber() ?: "")
    val currentUserName = MutableStateFlow(authManager.getUserName() ?: authManager.getPhoneNumber()?.let { "User" } ?: "")
    val currentUserStatus = MutableStateFlow(authManager.getUserAbout() ?: "")
    val currentUserAvatar = MutableStateFlow(authManager.getUserAvatar() ?: "")
    val currentGoogleEmail = MutableStateFlow(authManager.getGoogleEmail())
    val currentAuthProvider = MutableStateFlow(authManager.getAuthProvider())
    val isNewUser = MutableStateFlow<Boolean?>(null)
    val requiresProfileSetup = MutableStateFlow<Boolean?>(if (authManager.isLoggedIn()) authManager.getRequiresProfileSetup() else null)
    val typingChatId = MutableStateFlow<String?>(null)

    // Verification Badge State
    val isVerified = MutableStateFlow(authManager.isVerified())
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

    // Privacy settings state
    val lastSeenPrivacy: MutableStateFlow<String> = MutableStateFlow(authManager.getSettingString("last_seen_privacy") ?: "EVERYONE")
    val profilePhotoPrivacy: MutableStateFlow<String> = MutableStateFlow(authManager.getSettingString("profile_photo_privacy") ?: "EVERYONE")
    val aboutPrivacy: MutableStateFlow<String> = MutableStateFlow(authManager.getSettingString("about_privacy") ?: "EVERYONE")

    // Storage settings state
    val mobileDataDownload: MutableStateFlow<String> = MutableStateFlow(authManager.getSettingString("mobile_data_download") ?: "PHOTOS")
    val wifiDownload: MutableStateFlow<String> = MutableStateFlow(authManager.getSettingString("wifi_download") ?: "ALL")
    val roamingDownload: MutableStateFlow<String> = MutableStateFlow(authManager.getSettingString("roaming_download") ?: "NONE")

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

    // App Update State
    val latestUpdate = MutableStateFlow<AppUpdateDto?>(null)
    val isCheckingForUpdates = MutableStateFlow(false)
    val updateError = MutableStateFlow<String?>(null)

    val incomingNotification = MutableStateFlow<IncomingNotification?>(null)
    val repository: WhatsAppRepository

    init {
        val database = WhatsAppDatabase.getDatabase(application)
        repository = WhatsAppRepository(database.whatsAppDao(), application)

        viewModelScope.launch {
            repository.typingEvent.collect { (chatId, isTyping) ->
                typingChatId.value = if (isTyping) chatId else null
            }
        }

        viewModelScope.launch {
            repository.readReceiptEvent.collect { chatId ->
                // Triggers flow updates automatically since messages list is collected from Room Flow
            }
        }

        viewModelScope.launch {
            repository.deleteExpiredStatuses()
            refreshBadgeStatus()
            checkSystemStatus()
            
            // If logged in, init socket and sync data
            authManager.getUserId()?.let { uid ->
                repository.initSocket(uid) { 
                    // Handle incoming
                }
                authManager.getAuthToken()?.let { token ->
                    repository.syncStatuses(token, uid)
                    repository.syncCommunities(token)
                    
                    // Trigger background contact sync if permission would likely be granted or just try
                    // Note: Actual permission check happens in UI, but we can attempt to sync what we have
                    // or just wait for the SelectContactScreen. 
                    // Let's at least sync with backend for existing local contacts if any.
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
            val uid = authManager.getUserId()
            repository.syncChats(token)
            repository.syncStatuses(token, uid)
            repository.syncCommunities(token)
            repository.syncCallLogs(token)
            repository.getSettings(token)?.let { settings ->
                statusPrivacyMode.value = settings.statusPrivacyMode
                isReadReceiptsEnabled.value = settings.readReceipts
                isHighPriorityNotificationsEnabled.value = settings.notificationsEnabled
                isHdMediaUpload.value = settings.hdMedia
                isBiometricLockEnabled.value = settings.biometricLock
                
                // Save to local for persistence during offline
                authManager.setSettingBoolean("read_receipts", settings.readReceipts)
                authManager.setSettingBoolean("high_priority_notif", settings.notificationsEnabled)
                authManager.setSettingBoolean("hd_media", settings.hdMedia)
                authManager.setSettingBoolean("biometric_lock", settings.biometricLock)
            }
        }
    }

    fun loginWithPhone(
        phone: String,
        name: String,
        about: String = "Hey there! I am using VIBEZ.",
        avatarUrl: String? = null,
        firebaseIdToken: String? = null,
        onComplete: ((Boolean, String?) -> Unit)? = null
    ) {
        viewModelScope.launch {
            try {
                val cleanPhone = phone.trim()
                val response = repository.loginWithPhone(
                    phoneNumber = cleanPhone,
                    name = name.trim(),
                    about = about.trim(),
                    avatarUrl = avatarUrl,
                    firebaseIdToken = firebaseIdToken
                )

                val effectiveName = response.user.name ?: ""
                val effectiveAbout = response.user.about?.takeIf { it.isNotBlank() } ?: about
                val effectiveAvatar = response.user.avatarUrl ?: avatarUrl ?: ""

                isNewUser.value = response.isNewUser
                requiresProfileSetup.value = response.requiresProfileSetup

                if (com.example.BuildConfig.DEBUG) {
                    android.util.Log.d("VibezAuth", "[loginWithPhone] Resolved User ID: ${response.user.id}, name: $effectiveName, isNewUser: ${response.isNewUser}, requiresProfileSetup: ${response.requiresProfileSetup}")
                }

                authManager.saveAuthData(
                    token = response.token,
                    userId = response.user.id,
                    phoneNumber = cleanPhone,
                    userName = effectiveName,
                    userAbout = effectiveAbout,
                    userAvatar = effectiveAvatar,
                    googleEmail = null,
                    authProvider = "PHONE",
                    requiresProfileSetup = response.requiresProfileSetup ?: false
                )

                currentUserPhone.value = cleanPhone
                currentUserName.value = effectiveName
                currentUserStatus.value = effectiveAbout
                currentUserAvatar.value = effectiveAvatar
                currentGoogleEmail.value = null
                currentAuthProvider.value = "PHONE"
                isLoggedIn.value = true

                // Initialize Socket & Sync
                repository.initSocket(response.user.id) { }
                syncEverythingWithBackend()

                onComplete?.invoke(true, null)
            } catch (e: Exception) {
                e.printStackTrace()
                onComplete?.invoke(false, e.message)
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
                
                val finalPhone = response.user.phoneNumber.ifBlank { effectivePhone }
                val finalName = response.user.name ?: name
                val finalAbout = response.user.about ?: "⚡ Connected with Google"
                val finalAvatar = response.user.avatarUrl ?: avatarUrl ?: ""

                isNewUser.value = response.isNewUser
                requiresProfileSetup.value = response.requiresProfileSetup

                if (com.example.BuildConfig.DEBUG) {
                    android.util.Log.d("VibezAuth", "[loginWithGoogle] Resolved User ID: ${response.user.id}, name: $finalName, isNewUser: ${response.isNewUser}, requiresProfileSetup: ${response.requiresProfileSetup}")
                }

                authManager.saveAuthData(
                    token = response.token,
                    userId = response.user.id,
                    phoneNumber = finalPhone,
                    userName = finalName,
                    userAbout = finalAbout,
                    userAvatar = finalAvatar,
                    googleEmail = email,
                    authProvider = "GOOGLE",
                    requiresProfileSetup = response.requiresProfileSetup ?: false
                )
                
                currentUserPhone.value = finalPhone
                currentUserName.value = finalName
                currentUserStatus.value = finalAbout
                currentUserAvatar.value = finalAvatar
                currentGoogleEmail.value = email
                currentAuthProvider.value = "GOOGLE"
                isLoggedIn.value = true

                // Initialize Socket & Sync
                repository.initSocket(response.user.id) { }
                syncEverythingWithBackend()

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
        currentUserPhone.value = ""
        currentUserName.value = ""
        currentUserStatus.value = ""
        currentUserAvatar.value = ""
        currentGoogleEmail.value = null
        currentAuthProvider.value = "PHONE"
        requiresProfileSetup.value = null
        isLoggedIn.value = false
        isVerified.value = false
        badgeStatus.value = null
        repository.logout()
    }

    fun deleteAccountLocal() {
        authManager.deleteLocalAccountData()
        currentUserPhone.value = ""
        currentUserName.value = ""
        currentUserStatus.value = ""
        currentUserAvatar.value = ""
        currentGoogleEmail.value = null
        currentAuthProvider.value = "PHONE"
        requiresProfileSetup.value = null
        isLoggedIn.value = false
        isVerified.value = false
        badgeStatus.value = null
        repository.logout()
    }

    fun updateUserProfile(name: String, about: String, phoneNumber: String? = null, avatarUrl: String? = null) {
        currentUserStatus.value = about
        if (avatarUrl != null) currentUserAvatar.value = avatarUrl
        
        val token = authManager.getAuthToken()
        val userId = authManager.getUserId() ?: ""
        val phone = currentUserPhone.value
        val currentName = currentUserName.value.ifBlank { name }

        authManager.saveAuthData(
            token = token ?: "",
            userId = userId,
            phoneNumber = phone,
            userName = currentName,
            userAbout = about,
            userAvatar = avatarUrl ?: currentUserAvatar.value,
            googleEmail = currentGoogleEmail.value,
            authProvider = currentAuthProvider.value
        )

        if (!token.isNullOrBlank()) {
            viewModelScope.launch {
                try {
                    repository.updateUserProfile(currentName, about, avatarUrl, token)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    fun requestPhoneChange(
        currentPhone: String,
        newPhone: String,
        onResult: (Boolean, String, String?, Long) -> Unit
    ) {
        val token = authManager.getAuthToken()
        if (token.isNullOrBlank()) {
            onResult(false, "Authentication token missing. Please sign in again.", null, 0)
            return
        }

        viewModelScope.launch {
            try {
                val response = repository.requestPhoneChange(currentPhone, newPhone, token)
                if (response.success) {
                    onResult(true, response.message, response.verificationCode, response.expiresInSeconds)
                } else {
                    onResult(false, response.message, null, 0)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                val message = e.message ?: "Failed to initiate phone number change request with server"
                onResult(false, message, null, 0)
            }
        }
    }

    fun verifyPhoneChange(
        requestId: String,
        verificationCode: String,
        onResult: (Boolean, String) -> Unit
    ) {
        val token = authManager.getAuthToken()
        if (token.isNullOrBlank()) {
            onResult(false, "Authentication token missing. Please sign in again.")
            return
        }

        viewModelScope.launch {
            try {
                val response = repository.verifyPhoneChange(requestId, verificationCode, token)
                if (response.success) {
                    val updatedPhone = response.user.phoneNumber
                    val updatedName = response.user.name ?: currentUserName.value
                    val updatedAbout = response.user.about ?: currentUserStatus.value
                    val updatedAvatar = response.user.avatarUrl ?: currentUserAvatar.value

                    authManager.saveAuthData(
                        token = response.token,
                        userId = response.user.id,
                        phoneNumber = updatedPhone,
                        userName = updatedName,
                        userAbout = updatedAbout,
                        userAvatar = updatedAvatar,
                        googleEmail = currentGoogleEmail.value,
                        authProvider = currentAuthProvider.value
                    )

                    currentUserPhone.value = updatedPhone
                    currentUserName.value = updatedName
                    currentUserStatus.value = updatedAbout
                    currentUserAvatar.value = updatedAvatar

                    // Re-sync with the refreshed token
                    repository.syncChats(response.token)
                    repository.syncStatuses(response.token, response.user.id)

                    onResult(true, response.message)
                } else {
                    onResult(false, response.message)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                val message = e.message ?: "Failed to verify phone change code on server"
                onResult(false, message)
            }
        }
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

    fun fetchMessages(chatId: String) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.fetchMessagesForChat(chatId, token)
            }
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
        val tempId = java.util.UUID.randomUUID().toString()
        val senderId = authManager.getUserId() ?: "ME"
        
        // Optimistic UI: Add message locally immediately
        val localMessage = com.example.data.MessageEntity(
            id = tempId,
            chatId = chatId,
            senderId = senderId,
            content = content,
            timestamp = System.currentTimeMillis(),
            status = "SENDING",
            messageType = messageType,
            mediaUrl = mediaUrl,
            voiceDurationSeconds = voiceDurationSeconds
        )
        viewModelScope.launch {
            repository.addLocalMessage(localMessage)
        }

        viewModelScope.launch {
            repository.sendMessage(
                chatId = chatId,
                senderId = senderId,
                receiverId = null,
                content = content,
                type = messageType,
                token = authManager.getAuthToken() ?: "",
                id = tempId
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
        requiresProfileSetup.value = false
        authManager.setRequiresProfileSetup(false)
        authManager.updateProfile(name, status, avatarUrl ?: currentUserAvatar.value)
        
        viewModelScope.launch {
            val userId = authManager.getUserId() ?: "ME"
            
            // Perform local Room database update/insert CRUD for current user
            try {
                repository.updateContact(userId, name, phone, status)
            } catch (e: Exception) {
                e.printStackTrace()
            }

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

    fun setPrivacySetting(key: String, value: String) {
        authManager.setSettingString(key, value)
        when (key) {
            "last_seen_privacy" -> lastSeenPrivacy.value = value
            "profile_photo_privacy" -> profilePhotoPrivacy.value = value
            "about_privacy" -> aboutPrivacy.value = value
        }
        
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                val current = repository.getSettings(token) ?: UserSettingsDto(
                    statusPrivacyMode = statusPrivacyMode.value ?: "MY_CONTACTS",
                    lastSeenPrivacy = lastSeenPrivacy.value ?: "EVERYONE",
                    profilePhotoPrivacy = profilePhotoPrivacy.value ?: "EVERYONE",
                    aboutPrivacy = aboutPrivacy.value ?: "EVERYONE",
                    readReceipts = isReadReceiptsEnabled.value ?: true,
                    notificationsEnabled = isHighPriorityNotificationsEnabled.value ?: true
                )
                
                val updated = when (key) {
                    "last_seen_privacy" -> current.copy(lastSeenPrivacy = value)
                    "profile_photo_privacy" -> current.copy(profilePhotoPrivacy = value)
                    "about_privacy" -> current.copy(aboutPrivacy = value)
                    else -> current
                }
                repository.updateSettings(updated, token)
            }
        }
    }

    fun setStorageSetting(key: String, value: String) {
        authManager.setSettingString(key, value)
        when (key) {
            "mobile_data_download" -> mobileDataDownload.value = value
            "wifi_download" -> wifiDownload.value = value
            "roaming_download" -> roamingDownload.value = value
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
        
        // Sync with server
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                val current = repository.getSettings(token) ?: UserSettingsDto(
                    statusPrivacyMode = statusPrivacyMode.value,
                    lastSeenPrivacy = "EVERYONE",
                    profilePhotoPrivacy = globalWallpaper.value,
                    aboutPrivacy = "EVERYONE",
                    readReceipts = isReadReceiptsEnabled.value,
                    notificationsEnabled = isHighPriorityNotificationsEnabled.value
                )
                
                val updated = when (key) {
                    "biometric_lock" -> current.copy(biometricLock = value)
                    "hd_media" -> current.copy(hdMedia = value)
                    "read_receipts" -> current.copy(readReceipts = value)
                    "high_priority_notif" -> current.copy(notificationsEnabled = value)
                    else -> current
                }
                repository.updateSettings(updated, token)
            }
        }
    }

    fun updateContact(contactId: String, name: String, phone: String, about: String) {
        viewModelScope.launch {
            repository.updateContact(contactId, name, phone, about)
        }
    }

    fun createNewContact(name: String, phone: String, about: String, onComplete: (String) -> Unit) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            val contactId = repository.createNewContact(name, phone, about, token)
            onComplete(contactId)
        }
    }

    suspend fun getChatById(chatId: String): ChatEntity? {
        return repository.getChatById(chatId)
    }

    fun getOrCreateChatForContact(contact: ContactEntity, onComplete: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val token = authManager.getAuthToken()
                val chatId = repository.getOrCreateChatForContact(contact, token)
                onComplete(chatId)
            } catch (e: Exception) {
                e.printStackTrace()
                val fallbackId = "chat_${contact.id}"
                val localChat = ChatEntity(
                    id = fallbackId,
                    contactId = contact.id,
                    contactName = contact.name.ifBlank { contact.phoneNumber },
                    contactAvatar = contact.avatarUrl,
                    lastMessage = "",
                    lastMessageTime = System.currentTimeMillis()
                )
                repository.addLocalChat(localChat)
                onComplete(fallbackId)
            }
        }
    }

    fun getOrCreateChatForContactId(contactId: String, onComplete: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val token = authManager.getAuthToken()
                val chatId = repository.getOrCreateChatForContactId(contactId, token)
                onComplete(chatId)
            } catch (e: Exception) {
                e.printStackTrace()
                val fallbackId = "chat_${contactId}"
                val localChat = ChatEntity(
                    id = fallbackId,
                    contactId = contactId,
                    contactName = "Contact",
                    lastMessage = "",
                    lastMessageTime = System.currentTimeMillis()
                )
                repository.addLocalChat(localChat)
                onComplete(fallbackId)
            }
        }
    }

    fun createGroupChat(groupName: String, contactIds: List<String>, onComplete: (String) -> Unit) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                val chatId = repository.createGroupChat(groupName, contactIds, token)
                onComplete(chatId)
            }
        }
    }

    fun toggleStarMessage(message: MessageEntity) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.toggleStarMessage(message, token)
            }
        }
    }

    fun deleteMessage(messageId: String) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            repository.deleteMessage(messageId, token)
        }
    }

    fun clearChat(chatId: String) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            repository.clearChat(chatId, token)
        }
    }

    fun joinChat(chatId: String) {
        repository.socketManager?.joinChat(chatId)
    }

    fun setLocalUserTyping(chatId: String, isTyping: Boolean) {
        viewModelScope.launch {
            repository.socketManager?.emitTyping(chatId, isTyping)
        }
    }

    fun deleteChat(chatId: String) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            repository.deleteChat(chatId, token)
        }
    }

    fun resetChatUnreadCount(chatId: String) {
        viewModelScope.launch {
            val userId = authManager.getUserId() ?: "ME"
            repository.resetChatUnreadCount(chatId, userId)
        }
    }

    fun syncStatuses() {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.syncStatuses(token, authManager.getUserId())
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
                var finalMediaUrl = mediaUrl
                if (mediaUrl.isNotEmpty() && (mediaUrl.startsWith("content://") || mediaUrl.startsWith("file://"))) {
                    val app = getApplication<android.app.Application>()
                    val uploadedUrl = repository.uploadFile(
                        token = token,
                        uriString = mediaUrl,
                        type = type,
                        contentResolver = app.contentResolver
                    )
                    if (uploadedUrl != null) {
                        finalMediaUrl = uploadedUrl
                    }
                }
                repository.postStatus(caption, type, colorHex, finalMediaUrl, songTitle, songArtist, songPreviewUrl, musicOffsetX, musicOffsetY, token)
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
            val token = authManager.getAuthToken() ?: ""
            repository.deleteStatus(statusId, token)
        }
    }

    fun getStatusViewers(statusId: String): List<com.example.data.StatusViewer> {
        return statuses.value.firstOrNull { it.id == statusId }?.viewers ?: emptyList()
    }

    fun replyToStatus(
        targetStatus: StatusEntity,
        replyText: String,
        onComplete: (String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val token = authManager.getAuthToken() ?: ""
                val contactId = targetStatus.contactId
                val contactName = if (targetStatus.contactName != "Unknown") targetStatus.contactName else "Contact"
                
                // Find existing chat or create one
                var targetChat = chats.value.firstOrNull { it.contactId == contactId || it.id == contactId }
                
                if (targetChat == null && contactId.isNotBlank()) {
                    try {
                        val dto = NetworkClient.apiService.createOrGetPrivateChat("Bearer $token", PrivateChatRequest(targetUserId = contactId))
                        repository.syncChats(token)
                        targetChat = chats.value.firstOrNull { it.id == dto.id || it.contactId == contactId }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                val chatId = targetChat?.id ?: if (contactId.isNotBlank()) contactId else "chat_${System.currentTimeMillis()}"

                // Ensure local chat exists in Room DB if network call was offline
                if (targetChat == null) {
                    val fallbackChat = ChatEntity(
                        id = chatId,
                        remoteId = chatId,
                        contactId = contactId,
                        contactName = contactName,
                        lastMessage = replyText,
                        lastMessageTime = System.currentTimeMillis(),
                        unreadCount = 0,
                        isGroup = false
                    )
                    repository.addLocalChat(fallbackChat)
                }

                val statusSnippet = when {
                    targetStatus.textCaption.isNotBlank() -> targetStatus.textCaption
                    targetStatus.mediaType == "IMAGE" -> "📷 Photo Status"
                    targetStatus.mediaType == "VIDEO" -> "🎥 Video Status"
                    else -> "Status"
                }

                val formattedContent = "Replied to status ($statusSnippet):\n$replyText"
                sendMessage(chatId, formattedContent, "TEXT")

                onComplete(chatId)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun logCall(contactId: String, contactName: String, callType: String, isIncoming: Boolean, isMissed: Boolean) {
        viewModelScope.launch {
            val token = authManager.getAuthToken()
            repository.logCall(contactId, contactName, callType, isIncoming, isMissed, token)
        }
    }

    fun toggleDarkMode() {
        isDarkMode.value = !isDarkMode.value
    }

    fun checkForUpdates() {
        viewModelScope.launch {
            isCheckingForUpdates.value = true
            updateError.value = null
            try {
                val update = repository.getLatestUpdate()
                latestUpdate.value = update
            } catch (e: Exception) {
                updateError.value = "Failed to check for updates. Please try again later."
                android.util.Log.e("WhatsAppViewModel", "Error checking for updates", e)
            } finally {
                isCheckingForUpdates.value = false
            }
        }
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

    fun deleteCommunity(communityId: String) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            repository.deleteCommunity(communityId, token)
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
            val token = authManager.getAuthToken()
            repository.clearCallLogs(token)
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
            // Global wallpaper can be stored in general settings
            viewModelScope.launch {
                authManager.getAuthToken()?.let { token ->
                    repository.updateSettings(
                        repository.getSettings(token)?.copy(profilePhotoPrivacy = "WALLPAPER:$wallpaperValue") ?: UserSettingsDto(
                            statusPrivacyMode = statusPrivacyMode.value,
                            lastSeenPrivacy = "EVERYONE",
                            profilePhotoPrivacy = "WALLPAPER:$wallpaperValue",
                            aboutPrivacy = "EVERYONE",
                            readReceipts = isReadReceiptsEnabled.value,
                            notificationsEnabled = isHighPriorityNotificationsEnabled.value
                        ),
                        token
                    )
                }
            }
        } else {
            val currentMap = chatWallpapers.value.toMutableMap()
            currentMap[chatId] = wallpaperValue
            chatWallpapers.value = currentMap
            
            viewModelScope.launch {
                authManager.getAuthToken()?.let { token ->
                    repository.updateChatWallpaper(chatId, wallpaperValue, token)
                }
            }
        }
    }

    fun toggleMuteChat(chatId: String) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                val chat = repository.getChatById(chatId)
                if (chat != null) {
                    repository.updateChatMuteStatus(chatId, !chat.isMuted, token)
                }
            }
        }
    }

    fun togglePinChat(chatId: String) {
        viewModelScope.launch {
            val chat = repository.getChatById(chatId)
            if (chat != null) {
                repository.updateChatPinStatus(chatId, !chat.isPinned)
            }
        }
    }

    fun deleteChatsBulk(chatIds: List<String>) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            chatIds.forEach { chatId ->
                repository.deleteChat(chatId, token)
            }
        }
    }

    fun toggleMuteChatsBulk(chatIds: List<String>) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            chatIds.forEach { chatId ->
                val chat = repository.getChatById(chatId)
                if (chat != null) {
                    repository.updateChatMuteStatus(chatId, !chat.isMuted, token)
                }
            }
        }
    }

    fun togglePinChatsBulk(chatIds: List<String>) {
        viewModelScope.launch {
            chatIds.forEach { chatId ->
                val chat = repository.getChatById(chatId)
                if (chat != null) {
                    repository.updateChatPinStatus(chatId, !chat.isPinned)
                }
            }
        }
    }

    fun markChatsAsReadBulk(chatIds: List<String>) {
        viewModelScope.launch {
            val userId = authManager.getUserId() ?: "ME"
            chatIds.forEach { chatId ->
                repository.resetChatUnreadCount(chatId, userId)
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
                    authManager.setVerified(response.isVerified)
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

    private val _paymentProviders = MutableStateFlow<List<com.example.data.network.PaymentProviderDto>>(emptyList())
    val paymentProviders = _paymentProviders.asStateFlow()

    fun loadPaymentProviders() {
        viewModelScope.launch {
            try {
                val token = authManager.getAuthToken() ?: return@launch
                val providers = repository.getAvailablePaymentProviders(token)
                _paymentProviders.value = providers
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun processVerificationPayment(provider: String, amount: Double, onComplete: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            val token = authManager.getAuthToken()
            if (token.isNullOrBlank()) {
                onComplete(false, "User not authenticated")
                return@launch
            }

            try {
                val response = repository.createPayment(
                    token,
                    com.example.data.network.CreatePaymentRequest(
                        provider = provider,
                        amount = amount,
                        metadata = mapOf("purpose" to "VERIFICATION_BADGE")
                    )
                )
                if (response.success) {
                    isVerified.value = true
                    authManager.setVerified(true)
                    refreshBadgeStatus()
                    onComplete(true, response.message)
                } else {
                    onComplete(false, response.message)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                onComplete(false, e.message ?: "Payment failed")
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

    fun reportUser(reportedUserId: String, reason: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            val token = authManager.getAuthToken()
            if (token.isNullOrBlank()) {
                onResult(false, "User not authenticated")
                return@launch
            }
            try {
                val response = repository.reportUser(token, reportedUserId, reason)
                if (response.success) {
                    onResult(true, "Thank you for your report. Our team will review this user shortly.")
                } else {
                    onResult(false, response.message ?: "Failed to file report")
                }
            } catch (e: Exception) {
                e.printStackTrace()
                onResult(false, e.message ?: "Network error. Please try again.")
            }
        }
    }

    fun toggleCommunityVerifyPerk(communityId: String, onResult: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            val success = repository.toggleCommunityVerifyPerk(communityId, token)
            if (success) {
                syncCommunities()
            }
            onResult(success)
        }
    }

    fun toggleGroupVerifyPerk(chatId: String, onResult: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            val success = repository.toggleGroupVerifyPerk(chatId, token)
            if (success) {
                repository.syncChats(token)
            }
            onResult(success)
        }
    }
}
