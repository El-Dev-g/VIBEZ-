package com.example.data

import android.content.Context
import kotlinx.coroutines.flow.Flow

class WhatsAppDatabase {
    fun whatsAppDao(): WhatsAppDao = WhatsAppDaoImpl()

    companion object {
        @Volatile
        private var INSTANCE: WhatsAppDatabase? = null

        fun getDatabase(context: Context): WhatsAppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = WhatsAppDatabase()
                INSTANCE = instance
                instance
            }
        }
    }
}

class WhatsAppDaoImpl : WhatsAppDao {
    override fun getAllContacts(): Flow<List<ContactEntity>> = kotlinx.coroutines.flow.MutableStateFlow(emptyList())
    override suspend fun getContactById(id: String): ContactEntity? = null
    override suspend fun getContactByRemoteId(remoteId: String): ContactEntity? = null
    override suspend fun insertContact(contact: ContactEntity): String = ""
    override suspend fun updateContact(contact: ContactEntity) {}
    override suspend fun updateContactDetails(id: String, name: String, phone: String, about: String) {}
    override suspend fun updateChatContactName(contactId: String, name: String) {}
    override suspend fun getContactCount(): Int = 0
    override fun getAllChats(): Flow<List<ChatEntity>> = kotlinx.coroutines.flow.MutableStateFlow(emptyList())
    override suspend fun getChatById(chatId: String): ChatEntity? = null
    override suspend fun getChatByRemoteId(remoteId: String): ChatEntity? = null
    override suspend fun getChatByContactId(contactId: String): ChatEntity? = null
    override suspend fun insertChat(chat: ChatEntity): String = ""
    override suspend fun updateChat(chat: ChatEntity) {}
    override suspend fun resetChatUnreadCount(chatId: String) {}
    override suspend fun deleteChat(chatId: String) {}
    override suspend fun updateChatMuteStatus(chatId: String, isMuted: Boolean) {}
    override fun getMessagesForChat(chatId: String): Flow<List<MessageEntity>> = kotlinx.coroutines.flow.MutableStateFlow(emptyList())
    override suspend fun getMessageById(messageId: String): MessageEntity? = null
    override suspend fun getMessageByRemoteId(remoteId: String): MessageEntity? = null
    override fun getStarredMessages(): Flow<List<MessageEntity>> = kotlinx.coroutines.flow.MutableStateFlow(emptyList())
    override fun searchMessages(query: String): Flow<List<MessageEntity>> = kotlinx.coroutines.flow.MutableStateFlow(emptyList())
    override suspend fun insertMessage(message: MessageEntity): String = ""
    override suspend fun updateMessage(message: MessageEntity) {}
    override suspend fun deleteMessage(messageId: String) {}
    override suspend fun clearChatMessages(chatId: String) {}
    override fun getAllStatuses(): Flow<List<StatusEntity>> = kotlinx.coroutines.flow.MutableStateFlow(emptyList())
    override suspend fun insertStatus(status: StatusEntity): String = ""
    override suspend fun markStatusViewed(statusId: String) {}
    override suspend fun deleteStatus(statusId: String) {}
    override suspend fun deleteExpiredStatuses(cutoff: Long) {}
    override fun getAllCallLogs(): Flow<List<CallLogEntity>> = kotlinx.coroutines.flow.MutableStateFlow(emptyList())
    override suspend fun insertCallLog(callLog: CallLogEntity): String = ""
    override suspend fun clearCallLogs() {}
}
