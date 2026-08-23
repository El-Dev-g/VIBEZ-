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
    val chatId: Long,
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

    val incomingNotification = MutableStateFlow<IncomingNotification?>(null)

    private val repository: WhatsAppRepository

    val searchQuery = MutableStateFlow("")
    val isDarkMode = MutableStateFlow(false)
    val selectedTab = MutableStateFlow(0) // 0: Chats, 1: Updates, 2: Communities, 3: Calls

    val isLoggedIn = MutableStateFlow(true)
    val currentUserPhone = MutableStateFlow("+1 555-0198")
    val currentUserName = MutableStateFlow("Alex Rivers")
    val currentUserStatus = MutableStateFlow("⚡ Vibing in VIBEZ")
    val typingChatId = MutableStateFlow<Long?>(null)

    // Status Privacy State
    val statusPrivacyMode = MutableStateFlow("MY_CONTACTS") // "MY_CONTACTS", "EXCEPT", "ONLY_SHARE"
    val statusPrivacyExcludedIds = MutableStateFlow<Set<Long>>(emptySet())
    val statusPrivacyIncludedIds = MutableStateFlow<Set<Long>>(emptySet())

    // Chat Wallpaper State (chatId -> wallpaperKey / hex / uri)
    val chatWallpapers = MutableStateFlow<Map<Long, String>>(emptyMap())
    val globalWallpaper = MutableStateFlow("DEFAULT")
    val wallpaperDimming = MutableStateFlow(0.15f)

    val contacts: StateFlow<List<ContactEntity>>
    val chats: StateFlow<List<ChatEntity>>
    val filteredChats: StateFlow<List<ChatEntity>>
    val statuses: StateFlow<List<StatusEntity>>
    val callLogs: StateFlow<List<CallLogEntity>>
    val starredMessages: StateFlow<List<MessageEntity>>

    init {
        val database = WhatsAppDatabase.getDatabase(application)
        repository = WhatsAppRepository(database.whatsAppDao())

        viewModelScope.launch {
            repository.seedDatabaseIfEmpty()
            repository.deleteExpiredStatuses()
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

    fun loginUser(phone: String, name: String) {
        currentUserPhone.value = phone
        currentUserName.value = name
        isLoggedIn.value = true
    }

    fun logoutUser() {
        isLoggedIn.value = false
    }

    private val messagesFlowMap = java.util.concurrent.ConcurrentHashMap<Long, StateFlow<List<MessageEntity>>>()

    fun getMessagesForChat(chatId: Long): StateFlow<List<MessageEntity>> {
        return messagesFlowMap.getOrPut(chatId) {
            repository.getMessagesForChat(chatId).stateIn(
                scope = viewModelScope,
                started = SharingStarted.Lazily,
                initialValue = emptyList()
            )
        }
    }

    fun sendMessage(
        chatId: Long,
        content: String,
        messageType: String = "TEXT",
        mediaUrl: String = "",
        voiceDurationSeconds: Int = 0,
        replyToMessageId: Long? = null
    ) {
        viewModelScope.launch {
            repository.sendMessage(
                chatId = chatId,
                content = content,
                messageType = messageType,
                mediaUrl = mediaUrl,
                voiceDurationSeconds = voiceDurationSeconds,
                replyToMessageId = replyToMessageId
            )

            // Trigger typing indicator animation then auto-reply
            delay(1000)
            typingChatId.value = chatId
            delay(2000)
            typingChatId.value = null
            val replyMsg = repository.createAutoReply(chatId, content)
            if (replyMsg != null) {
                val chatObj = chats.value.firstOrNull { it.id == chatId }
                incomingNotification.value = IncomingNotification(
                    contactName = chatObj?.contactName ?: "Contact",
                    content = replyMsg.content,
                    chatId = chatId,
                    contactAvatar = chatObj?.contactAvatar ?: ""
                )
            }
        }
    }

    fun updateCurrentUserProfile(name: String, phone: String, status: String) {
        currentUserName.value = name
        currentUserPhone.value = phone
        currentUserStatus.value = status
    }

    fun updateContact(contactId: Long, name: String, phone: String, about: String) {
        viewModelScope.launch {
            repository.updateContact(contactId, name, phone, about)
        }
    }

    fun createNewContact(name: String, phone: String, about: String, onComplete: (Long) -> Unit) {
        viewModelScope.launch {
            val contactId = repository.createNewContact(name, phone, about)
            onComplete(contactId)
        }
    }

    fun createGroupChat(groupName: String, contactIds: List<Long>, onComplete: (Long) -> Unit) {
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

    fun deleteMessage(messageId: Long) {
        viewModelScope.launch {
            repository.deleteMessage(messageId)
        }
    }

    fun clearChat(chatId: Long) {
        viewModelScope.launch {
            repository.clearChat(chatId)
        }
    }

    fun deleteChat(chatId: Long) {
        viewModelScope.launch {
            repository.deleteChat(chatId)
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
            repository.postStatus(caption, type, colorHex, mediaUrl, songTitle, songArtist, songPreviewUrl, musicOffsetX, musicOffsetY)
        }
    }

    fun markStatusViewed(statusId: Long) {
        viewModelScope.launch {
            repository.markStatusViewed(statusId)
        }
    }

    fun deleteStatus(statusId: Long) {
        viewModelScope.launch {
            repository.deleteStatus(statusId)
        }
    }

    fun getStatusViewers(statusId: Long): List<com.example.data.StatusViewer> {
        val contactList = contacts.value
        val baseTime = System.currentTimeMillis()
        val timeOffsets = listOf(4 * 60 * 1000L, 12 * 60 * 1000L, 26 * 60 * 1000L, 45 * 60 * 1000L)
        val timeLabels = listOf("4 minutes ago", "12 minutes ago", "26 minutes ago", "45 minutes ago")

        return contactList.take(4).mapIndexed { index, contact ->
            val offset = timeOffsets.getOrElse(index) { (index + 1) * 15 * 60 * 1000L }
            val label = timeLabels.getOrElse(index) { "${(index + 1) * 15} minutes ago" }
            com.example.data.StatusViewer(
                contactId = contact.id,
                name = contact.name,
                avatarUrl = contact.avatarUrl,
                phoneNumber = contact.phoneNumber,
                viewedTimestamp = baseTime - offset,
                timeAgoFormatted = label
            )
        }
    }

    fun logCall(contactId: Long, contactName: String, callType: String, isIncoming: Boolean, isMissed: Boolean) {
        viewModelScope.launch {
            repository.logCall(contactId, contactName, callType, isIncoming, isMissed)
        }
    }

    fun toggleDarkMode() {
        isDarkMode.value = !isDarkMode.value
    }

    fun setSelectedTab(index: Int) {
        selectedTab.value = index
    }

    fun clearCallLogs() {
        viewModelScope.launch {
            repository.clearCallLogs()
        }
    }

    fun updateStatusPrivacy(mode: String, excluded: Set<Long>, included: Set<Long>) {
        statusPrivacyMode.value = mode
        statusPrivacyExcludedIds.value = excluded
        statusPrivacyIncludedIds.value = included
    }

    fun setChatWallpaper(chatId: Long?, wallpaperValue: String, dimming: Float = 0.15f) {
        wallpaperDimming.value = dimming
        if (chatId == null || chatId == 0L) {
            globalWallpaper.value = wallpaperValue
        } else {
            val currentMap = chatWallpapers.value.toMutableMap()
            currentMap[chatId] = wallpaperValue
            chatWallpapers.value = currentMap
        }
    }

    fun toggleMuteChat(chatId: Long) {
        viewModelScope.launch {
            val chat = repository.getChatById(chatId)
            if (chat != null) {
                repository.updateChatMuteStatus(chatId, !chat.isMuted)
            }
        }
    }

    suspend fun getMessageById(messageId: Long): MessageEntity? {
        return repository.getMessageById(messageId)
    }

    fun forwardMessage(
        content: String,
        messageType: String,
        mediaUrl: String,
        durationSeconds: Int,
        targetChatIds: List<Long>,
        onComplete: () -> Unit
    ) {
        viewModelScope.launch {
            targetChatIds.forEach { chatId ->
                repository.sendMessage(
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
}
