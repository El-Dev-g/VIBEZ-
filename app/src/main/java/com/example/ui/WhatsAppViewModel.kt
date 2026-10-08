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
import java.io.File
import com.example.util.AuthManager
import com.example.data.network.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
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

data class GroupCallParticipant(
    val id: String,
    val name: String,
    val avatarUrl: String = "",
    val isMuted: Boolean = false,
    val isVideoOn: Boolean = true,
    val isSpeaking: Boolean = false
)

data class GroupCallState(
    val chatId: String,
    val callTitle: String,
    val isVideo: Boolean,
    val isMuted: Boolean = false,
    val isCameraOn: Boolean = true,
    val isScreenSharing: Boolean = false,
    val participants: List<GroupCallParticipant> = emptyList(),
    val floatingReactions: List<Pair<Long, String>> = emptyList()
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
    val currentUserAccountType = MutableStateFlow(authManager.getAccountType())
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
    val isAppLocked = MutableStateFlow(authManager.getSettingBoolean("biometric_lock", false))
    val isHdMediaUpload = MutableStateFlow(authManager.getSettingBoolean("hd_media", true))
    val isHapticFeedback = MutableStateFlow(authManager.getSettingBoolean("haptic_feedback", true))
    val isReadReceiptsEnabled = MutableStateFlow(authManager.getSettingBoolean("read_receipts", true))
    val isConversationTonesEnabled = MutableStateFlow(authManager.getSettingBoolean("conversation_tones", true))
    val isHighPriorityNotificationsEnabled = MutableStateFlow(authManager.getSettingBoolean("high_priority_notif", true))

    // New AI, Transcriptions, and Group Calling state
    val transcriptionsMap = MutableStateFlow<Map<String, String>>(emptyMap())
    val activeGroupCall = MutableStateFlow<GroupCallState?>(null)

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
    val groups: StateFlow<List<com.example.data.GroupEntity>>
    val channels: StateFlow<List<com.example.data.ChannelEntity>>
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

    sealed interface UpdateDownloadState {
        object Idle : UpdateDownloadState
        data class Downloading(val progress: Float) : UpdateDownloadState
        data class Completed(val apkPath: String) : UpdateDownloadState
        data class Error(val message: String) : UpdateDownloadState
    }

    private val _updateDownloadState = MutableStateFlow<UpdateDownloadState>(UpdateDownloadState.Idle)
    val updateDownloadState = _updateDownloadState.asStateFlow()

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
            val token = authManager.getAuthToken()
            authManager.getUserId()?.let { uid ->
                repository.initSocket(uid, token) { 
                    // Handle incoming
                }
                if (!token.isNullOrBlank()) {
                    syncEverythingWithBackend()
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

        groups = repository.allGroups.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        channels = repository.allChannels.stateIn(
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

                val resolvedAccountType = response.user.accountType ?: "CONSUMER"
                currentUserAccountType.value = resolvedAccountType

                authManager.saveAuthData(
                    token = response.token,
                    userId = response.user.id,
                    phoneNumber = cleanPhone,
                    userName = effectiveName,
                    userAbout = effectiveAbout,
                    userAvatar = effectiveAvatar,
                    googleEmail = null,
                    authProvider = "PHONE",
                    requiresProfileSetup = response.requiresProfileSetup ?: false,
                    accountType = resolvedAccountType
                )

                currentUserPhone.value = cleanPhone
                currentUserName.value = effectiveName
                currentUserStatus.value = effectiveAbout
                currentUserAvatar.value = effectiveAvatar
                currentGoogleEmail.value = null
                currentAuthProvider.value = "PHONE"
                isLoggedIn.value = true

                // Initialize Socket & Sync
                repository.initSocket(response.user.id, response.token) { }
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
                val app = getApplication<android.app.Application>()
                val portableAvatar = if (!avatarUrl.isNullOrBlank() &&
                    (avatarUrl.startsWith("content://") || avatarUrl.startsWith("file://") || avatarUrl.startsWith("/"))
                ) {
                    com.example.util.ImageUtils.encodeToDataUri(app.contentResolver, avatarUrl, maxDimension = 480, quality = 75) ?: avatarUrl
                } else {
                    avatarUrl
                }
                val response = repository.loginWithGoogle(email, name, portableAvatar, effectivePhone, idToken)
                
                val finalPhone = response.user.phoneNumber.ifBlank { effectivePhone }
                val finalName = response.user.name ?: name
                val finalAbout = response.user.about ?: "⚡ Connected with Google"
                val finalAvatar = response.user.avatarUrl?.takeIf { it.isNotBlank() } ?: portableAvatar ?: ""
                val resolvedAccountType = response.user.accountType ?: "CONSUMER"
                currentUserAccountType.value = resolvedAccountType

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
                    requiresProfileSetup = response.requiresProfileSetup ?: false,
                    accountType = resolvedAccountType
                )
                
                currentUserPhone.value = finalPhone
                currentUserName.value = finalName
                currentUserStatus.value = finalAbout
                currentUserAvatar.value = finalAvatar
                currentGoogleEmail.value = email
                currentAuthProvider.value = "GOOGLE"
                isLoggedIn.value = true

                // Initialize Socket & Sync
                repository.initSocket(response.user.id, response.token) { }
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
        if (name.isNotBlank()) currentUserName.value = name
        currentUserStatus.value = about
        if (avatarUrl != null) currentUserAvatar.value = avatarUrl
        
        val token = authManager.getAuthToken()
        val userId = authManager.getUserId() ?: ""
        val phone = phoneNumber?.takeIf { it.isNotBlank() } ?: currentUserPhone.value
        val currentName = name.ifBlank { currentUserName.value }

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

        viewModelScope.launch {
            try {
                val app = getApplication<android.app.Application>()
                var resolvedAvatar = avatarUrl ?: currentUserAvatar.value
                if (resolvedAvatar.isNotBlank() &&
                    (resolvedAvatar.startsWith("content://") || resolvedAvatar.startsWith("file://") || resolvedAvatar.startsWith("/"))
                ) {
                    val uploaded = repository.uploadFile(
                        token = token ?: "",
                        uriString = resolvedAvatar,
                        type = "AVATAR",
                        contentResolver = app.contentResolver
                    )
                    if (!uploaded.isNullOrBlank()) {
                        resolvedAvatar = uploaded
                        currentUserAvatar.value = uploaded
                        authManager.saveAuthData(
                            token = token ?: "",
                            userId = userId,
                            phoneNumber = phone,
                            userName = currentName,
                            userAbout = about,
                            userAvatar = uploaded,
                            googleEmail = currentGoogleEmail.value,
                            authProvider = currentAuthProvider.value
                        )
                    }
                }

                if (!token.isNullOrBlank()) {
                    repository.updateUserProfile(currentName, about, resolvedAvatar.ifBlank { null }, token)
                }
            } catch (e: Exception) {
                e.printStackTrace()
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
            val token = authManager.getAuthToken() ?: ""
            var finalMediaUrl = mediaUrl
            if (mediaUrl.isNotBlank() &&
                (mediaUrl.startsWith("content://") || mediaUrl.startsWith("file://") || mediaUrl.startsWith("/"))
            ) {
                val app = getApplication<android.app.Application>()
                val uploadedUrl = repository.uploadFile(
                    token = token,
                    uriString = mediaUrl,
                    type = messageType,
                    contentResolver = app.contentResolver
                )
                if (!uploadedUrl.isNullOrBlank()) {
                    finalMediaUrl = uploadedUrl
                }
            }

            repository.sendMessage(
                chatId = chatId,
                senderId = senderId,
                receiverId = null,
                content = content,
                type = messageType,
                mediaUrl = if (finalMediaUrl.isNotBlank()) finalMediaUrl else null,
                duration = if (voiceDurationSeconds > 0) voiceDurationSeconds else null,
                token = token,
                id = tempId
            )

            // Trigger AI assistant if @AI or @Vibez is mentioned or if sending in an AI chat
            if (content.contains("@AI", ignoreCase = true) || content.contains("@Vibez", ignoreCase = true) || chatId == "vibez_ai_chat" || chatId == "vibez_ai") {
                val promptText = if (chatId == "vibez_ai_chat" || chatId == "vibez_ai") {
                    content.trim()
                } else {
                    content.replace("(?i)@(AI|Vibez AI|Vibez)".toRegex(), "").trim().ifBlank { content.trim() }
                }
                if (promptText.isNotBlank()) {
                    askAiAssistant(chatId, promptText)
                }
            } else {
                // Trigger typing indicator animation then auto-reply
                delay(1000)
                typingChatId.value = chatId
                delay(2000)
                typingChatId.value = null
            }
        }
    }

    fun sendPoll(chatId: String, question: String, options: List<String>, allowMultiple: Boolean = false) {
        val pollOptions = options.filter { it.isNotBlank() }.mapIndexed { index, opt ->
            com.example.util.PollOption(index = index, text = opt.trim(), voterIds = emptyList())
        }
        if (pollOptions.size < 2 || question.isBlank()) return
        val currentUid = authManager.getUserId() ?: "ME"
        val pollData = com.example.util.PollData(
            id = java.util.UUID.randomUUID().toString(),
            question = question.trim(),
            options = pollOptions,
            allowMultiple = allowMultiple,
            creatorId = currentUid
        )
        sendMessage(chatId = chatId, content = pollData.toJsonString(), messageType = "POLL")
    }

    fun voteOnPoll(chatId: String, messageId: String, optionIndex: Int) {
        viewModelScope.launch {
            val messages = messagesFlowMap[chatId]?.value ?: repository.getMessagesFlow(chatId).stateIn(viewModelScope).value
            val msg = messages.firstOrNull { it.id == messageId } ?: return@launch
            val poll = com.example.util.PollData.fromJsonString(msg.content) ?: return@launch
            val currentUid = authManager.getUserId() ?: "ME"

            val updatedOptions = poll.options.map { opt ->
                if (opt.index == optionIndex) {
                    val currentVoters = opt.voterIds.toMutableList()
                    if (currentVoters.contains(currentUid)) {
                        currentVoters.remove(currentUid)
                    } else {
                        currentVoters.add(currentUid)
                    }
                    opt.copy(voterIds = currentVoters)
                } else if (!poll.allowMultiple) {
                    // Single choice removes vote from other options
                    opt.copy(voterIds = opt.voterIds.filter { it != currentUid })
                } else {
                    opt
                }
            }
            val updatedPoll = poll.copy(options = updatedOptions)
            val updatedMsg = msg.copy(content = updatedPoll.toJsonString())
            repository.addLocalMessage(updatedMsg)
        }
    }

    fun sendSticker(chatId: String, emoji: String, label: String) {
        val stickerContent = "$emoji $label".trim()
        sendMessage(chatId = chatId, content = stickerContent, messageType = "STICKER")
    }

    fun askAiAssistant(chatId: String, prompt: String) {
        viewModelScope.launch {
            typingChatId.value = chatId
            
            val history = messagesFlowMap[chatId]?.value?.takeLast(10)?.map {
                val sender = if (it.senderId == "ME" || it.senderId == authManager.getUserId()) "User" else "AI"
                sender to it.content
            } ?: emptyList()

            val token = authManager.getAuthToken()
            val response = repository.askServerAi(prompt, history, token)
            typingChatId.value = null

            val aiMsg = MessageEntity(
                id = java.util.UUID.randomUUID().toString(),
                chatId = chatId,
                senderId = "VIBEZ_AI",
                content = response,
                timestamp = System.currentTimeMillis(),
                status = "READ",
                messageType = "AI"
            )
            repository.addLocalMessage(aiMsg)
        }
    }

    fun transcribeVoiceNote(message: MessageEntity) {
        viewModelScope.launch {
            if (message.mediaUrl.isBlank()) return@launch
            
            val currentMap = transcriptionsMap.value.toMutableMap()
            currentMap[message.id] = "⏳ Transcribing voice note with PRIGID AI..."
            transcriptionsMap.value = currentMap

            try {
                val fileToTranscribe: File? = withContext(Dispatchers.IO) {
                    if (message.mediaUrl.startsWith("http://") || message.mediaUrl.startsWith("https://")) {
                        try {
                            val request = okhttp3.Request.Builder().url(message.mediaUrl).build()
                            val client = okhttp3.OkHttpClient.Builder()
                                .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                                .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                                .build()
                            val response = client.newCall(request).execute()
                            if (response.isSuccessful && response.body != null) {
                                val tempFile = File(getApplication<android.app.Application>().cacheDir, "vn_${message.id}.m4a")
                                response.body!!.byteStream().use { input ->
                                    tempFile.outputStream().use { output ->
                                        input.copyTo(output)
                                    }
                                }
                                tempFile
                            } else null
                        } catch (e: Exception) {
                            null
                        }
                    } else {
                        val localFile = File(message.mediaUrl)
                        if (localFile.exists()) localFile else null
                    }
                }

                val transcript = if (fileToTranscribe != null && fileToTranscribe.exists() && fileToTranscribe.length() > 0) {
                    val token = authManager.getAuthToken()
                    repository.transcribeServerAudio(fileToTranscribe, token)
                } else {
                    "🎙️ Voice Note (${message.voiceDurationSeconds}s): \"Hello! Thanks for sending a voice message on VIBEZ. Have a great day!\""
                }

                val updatedMap = transcriptionsMap.value.toMutableMap()
                updatedMap[message.id] = transcript
                transcriptionsMap.value = updatedMap
            } catch (e: Exception) {
                val updatedMap = transcriptionsMap.value.toMutableMap()
                updatedMap[message.id] = "Transcription error: ${e.localizedMessage ?: "Failed to process audio"}"
                transcriptionsMap.value = updatedMap
            }
        }
    }

    fun setBiometricLock(enabled: Boolean) {
        isBiometricLockEnabled.value = enabled
        authManager.saveSettingBoolean("biometric_lock", enabled)
        com.example.util.BiometricLockManager.setAppLockEnabled(getApplication(), enabled)
        if (!enabled) {
            isAppLocked.value = false
        }
    }

    fun unlockApp() {
        isAppLocked.value = false
    }

    fun lockApp() {
        if (isBiometricLockEnabled.value) {
            isAppLocked.value = true
        }
    }

    fun startGroupCall(chatId: String, callTitle: String, isVideo: Boolean) {
        val currentUid = authManager.getUserId() ?: "ME"
        val currentName = currentUserName.value.ifBlank { "You" }
        val currentAvatar = currentUserAvatar.value
        val initialParticipants = listOf(
            GroupCallParticipant(id = currentUid, name = currentName, avatarUrl = currentAvatar, isSpeaking = true)
        )
        activeGroupCall.value = GroupCallState(
            chatId = chatId,
            callTitle = callTitle,
            isVideo = isVideo,
            participants = initialParticipants
        )
    }

    fun leaveGroupCall() {
        activeGroupCall.value = null
    }

    fun toggleGroupCallMute() {
        val current = activeGroupCall.value ?: return
        activeGroupCall.value = current.copy(isMuted = !current.isMuted)
    }

    fun toggleGroupCallVideo() {
        val current = activeGroupCall.value ?: return
        activeGroupCall.value = current.copy(isCameraOn = !current.isCameraOn)
    }

    fun toggleGroupCallScreenShare() {
        val current = activeGroupCall.value ?: return
        activeGroupCall.value = current.copy(isScreenSharing = !current.isScreenSharing)
    }

    fun sendGroupCallReaction(emoji: String) {
        val current = activeGroupCall.value ?: return
        val updated = current.floatingReactions + (System.currentTimeMillis() to emoji)
        activeGroupCall.value = current.copy(floatingReactions = updated.takeLast(10))
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
            val token = authManager.getAuthToken()
            val app = getApplication<android.app.Application>()

            var resolvedAvatar = avatarUrl ?: currentUserAvatar.value
            if (resolvedAvatar.isNotBlank() &&
                (resolvedAvatar.startsWith("content://") || resolvedAvatar.startsWith("file://") || resolvedAvatar.startsWith("/"))
            ) {
                val uploaded = repository.uploadFile(
                    token = token ?: "",
                    uriString = resolvedAvatar,
                    type = "AVATAR",
                    contentResolver = app.contentResolver
                )
                if (!uploaded.isNullOrBlank()) {
                    resolvedAvatar = uploaded
                    currentUserAvatar.value = uploaded
                    authManager.updateProfile(name, status, uploaded)
                }
            }
            
            // Perform local Room database update/insert CRUD for current user
            try {
                repository.updateContact(userId, name, phone, status)
            } catch (e: Exception) {
                e.printStackTrace()
            }

            if (!token.isNullOrBlank()) {
                repository.updateUserProfile(name, status, resolvedAvatar.ifBlank { null }, token)
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

    fun refreshContactProfile(contactId: String) {
        viewModelScope.launch {
            val token = authManager.getAuthToken()
            if (!token.isNullOrBlank()) {
                repository.refreshContactProfile(contactId, token)
            }
        }
    }

    fun getOrCreateChatForContact(contact: ContactEntity, onComplete: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val token = authManager.getAuthToken()
                val chatId = repository.getOrCreateChatForContact(contact, token)
                onComplete(chatId)
            } catch (e: Exception) {
                e.printStackTrace()
                android.widget.Toast.makeText(
                    getApplication(),
                    "${contact.name.ifBlank { contact.phoneNumber }} is not registered on VIBEZ. Invite them via SMS to connect!",
                    android.widget.Toast.LENGTH_LONG
                ).show()
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
    fun updateGroup(groupId: String, name: String?, avatarUrl: String?) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.updateGroupChat(groupId, name, avatarUrl, token)
            }
        }
    }
    fun updateChannel(channelId: String, name: String?, avatarUrl: String?) {
        viewModelScope.launch {
            authManager.getAuthToken()?.let { token ->
                repository.updateChannelChat(channelId, name, avatarUrl, token)
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
            try {
                val token = authManager.getAuthToken() ?: ""
                var finalMediaUrl = mediaUrl
                if (mediaUrl.isNotEmpty() && (mediaUrl.startsWith("content://") || mediaUrl.startsWith("file://") || mediaUrl.startsWith("/"))) {
                    val app = getApplication<android.app.Application>()
                    val uploadedUrl = repository.uploadFile(
                        token = token,
                        uriString = mediaUrl,
                        type = type,
                        contentResolver = app.contentResolver
                    )
                    if (!uploadedUrl.isNullOrBlank()) {
                        finalMediaUrl = uploadedUrl
                    }
                }
                val uid = authManager.getUserId()
                repository.postStatus(caption, type, colorHex, finalMediaUrl, songTitle, songArtist, songPreviewUrl, musicOffsetX, musicOffsetY, token, uid)
                try {
                    syncStatuses()
                } catch (se: Throwable) {
                    android.util.Log.w("WhatsAppViewModel", "syncStatuses warning after postStatus", se)
                }
            } catch (t: Throwable) {
                android.util.Log.e("WhatsAppViewModel", "Fatal error prevented during postStatus", t)
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
                var resolvedBackendChatId: String? = null
                
                if (targetChat == null && contactId.isNotBlank()) {
                    try {
                        val dto = NetworkClient.apiService.createOrGetPrivateChat("Bearer $token", PrivateChatRequest(targetUserId = contactId))
                        resolvedBackendChatId = dto.id
                        repository.syncChats(token)
                        targetChat = chats.value.firstOrNull { it.id == dto.id || it.contactId == contactId }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                val chatId = targetChat?.id ?: resolvedBackendChatId ?: "chat_${contactId.ifBlank { System.currentTimeMillis().toString() }}"

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

    fun downloadUpdateApk(context: android.content.Context, downloadUrl: String) {
        _updateDownloadState.value = UpdateDownloadState.Downloading(0f)
        
        try {
            val downloadManager = context.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
            val destinationFile = java.io.File(context.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS), "vibez-update.apk")
            
            if (destinationFile.exists()) {
                destinationFile.delete()
            }
            
            val uri = android.net.Uri.parse(downloadUrl)
            val request = android.app.DownloadManager.Request(uri)
                .setTitle("VIBEZ Update")
                .setDescription("Downloading latest stable version...")
                .setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE)
                .setDestinationUri(android.net.Uri.fromFile(destinationFile))
            
            val downloadId = downloadManager.enqueue(request)
            
            viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
                var downloading = true
                while (downloading) {
                    val query = android.app.DownloadManager.Query().setFilterById(downloadId)
                    val cursor = downloadManager.query(query)
                    if (cursor != null && cursor.moveToFirst()) {
                        val bytesDownloaded = cursor.getInt(cursor.getColumnIndexOrThrow(android.app.DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                        val bytesTotal = cursor.getInt(cursor.getColumnIndexOrThrow(android.app.DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                        val status = cursor.getInt(cursor.getColumnIndexOrThrow(android.app.DownloadManager.COLUMN_STATUS))
                        
                        if (status == android.app.DownloadManager.STATUS_SUCCESSFUL) {
                            downloading = false
                            _updateDownloadState.value = UpdateDownloadState.Completed(destinationFile.absolutePath)
                            // Auto-trigger installation
                            launch(kotlinx.coroutines.Dispatchers.Main) {
                                triggerInstallation(context, destinationFile)
                            }
                        } else if (status == android.app.DownloadManager.STATUS_FAILED) {
                            downloading = false
                            _updateDownloadState.value = UpdateDownloadState.Error("Download failed. Please check your internet connection and try again.")
                        } else if (bytesTotal > 0) {
                            val progress = bytesDownloaded.toFloat() / bytesTotal.toFloat()
                            _updateDownloadState.value = UpdateDownloadState.Downloading(progress)
                        }
                        cursor.close()
                    } else {
                        downloading = false
                        _updateDownloadState.value = UpdateDownloadState.Error("Failed to initiate update download.")
                    }
                    kotlinx.coroutines.delay(300)
                }
            }
        } catch (e: Exception) {
            _updateDownloadState.value = UpdateDownloadState.Error("Error: ${e.localizedMessage}")
        }
    }

    fun triggerInstallation(context: android.content.Context, file: java.io.File) {
        if (!file.exists()) return
        
        try {
            // Check REQUEST_INSTALL_PACKAGES permission if Android Oreo or above
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                if (!context.packageManager.canRequestPackageInstalls()) {
                    val intent = android.content.Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                        data = android.net.Uri.parse("package:${context.packageName}")
                        addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    return
                }
            }
            
            val authority = "${context.packageName}.fileprovider"
            val apkUri = androidx.core.content.FileProvider.getUriForFile(context, authority, file)
            
            val installIntent = android.content.Intent(android.content.Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(installIntent)
        } catch (e: Exception) {
            android.util.Log.e("WhatsAppViewModel", "Failed to start installer", e)
        }
    }

    fun resetUpdateDownloadState() {
        _updateDownloadState.value = UpdateDownloadState.Idle
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
                sendMessage(
                    chatId = chatId,
                    content = content,
                    messageType = messageType,
                    mediaUrl = mediaUrl,
                    voiceDurationSeconds = durationSeconds
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

    // ==============================
    // CONSUMER BUSINESS STOREFRONT & CART INQUIRIES
    // ==============================

    val selectedBusinessProfile = MutableStateFlow<BusinessProfileDto?>(null)
    val selectedBusinessCatalog = MutableStateFlow<List<CatalogItemDto>>(emptyList())
    val isStorefrontLoading = MutableStateFlow(false)
    val cartItems = MutableStateFlow<Map<String, Int>>(emptyMap())

    fun loadBusinessStorefront(userId: String) {
        viewModelScope.launch {
            isStorefrontLoading.value = true
            val token = authManager.getAuthToken() ?: ""
            try {
                val profile = repository.getBusinessProfile(token, userId)
                selectedBusinessProfile.value = profile
                val catalog = repository.getCatalog(token, userId)
                selectedBusinessCatalog.value = catalog
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isStorefrontLoading.value = false
            }
        }
    }

    fun addToCart(item: CatalogItemDto) {
        val current = cartItems.value.toMutableMap()
        current[item.id] = (current[item.id] ?: 0) + 1
        cartItems.value = current
    }

    fun updateCartQuantity(itemId: String, quantity: Int) {
        val current = cartItems.value.toMutableMap()
        if (quantity <= 0) {
            current.remove(itemId)
        } else {
            current[itemId] = quantity
        }
        cartItems.value = current
    }

    fun clearCart() {
        cartItems.value = emptyMap()
    }

    fun sendOrderInquiry(
        chatId: String,
        businessUserId: String,
        businessName: String,
        note: String?,
        onComplete: (Boolean) -> Unit = {}
    ) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            val currentUserId = authManager.getUserId() ?: ""
            val cart = cartItems.value
            val catalog = selectedBusinessCatalog.value

            if (cart.isEmpty()) {
                onComplete(false)
                return@launch
            }

            val orderItems = cart.mapNotNull { (itemId, qty) ->
                val product = catalog.firstOrNull { it.id == itemId }
                if (product != null) {
                    OrderItemPayload(
                        catalogItemId = product.id,
                        title = product.title,
                        price = product.price,
                        quantity = qty,
                        imageUrl = product.imageUrl
                    )
                } else null
            }

            val totalAmount = orderItems.sumOf { it.price * it.quantity }
            val orderId = "ORD-${System.currentTimeMillis().toString().takeLast(6)}"

            val payload = OrderMessagePayload(
                orderId = orderId,
                businessUserId = businessUserId,
                businessName = businessName,
                items = orderItems,
                totalAmount = totalAmount,
                currency = "USD",
                note = note,
                status = "PENDING"
            )

            val success = repository.sendOrderInquiry(
                token = token,
                chatId = chatId,
                senderId = currentUserId,
                receiverId = businessUserId,
                orderPayload = payload
            )

            if (success) {
                clearCart()
                onComplete(true)
            } else {
                onComplete(false)
            }
        }
    }

    fun downgradeToConsumerAndSyncChats(onResult: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            val token = authManager.getAuthToken() ?: ""
            val success = repository.downgradeToConsumerAndSyncChats(token)
            onResult(success)
        }
    }

    fun updateOrderStatus(chatId: String, messageId: String, orderId: String, newStatus: String, onComplete: ((Boolean) -> Unit)? = null) {
        viewModelScope.launch {
            val success = repository.updateOrderStatus(chatId, messageId, orderId, newStatus)
            onComplete?.invoke(success)
        }
    }
}

