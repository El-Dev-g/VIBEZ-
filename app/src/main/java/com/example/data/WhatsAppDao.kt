package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

interface WhatsAppDao {

    // Contacts
    fun getAllContacts(): Flow<List<ContactEntity>>
    suspend fun getContactById(id: String): ContactEntity?
    suspend fun getContactByRemoteId(remoteId: String): ContactEntity?
    suspend fun insertContact(contact: ContactEntity): String
    suspend fun updateContact(contact: ContactEntity)
    suspend fun updateContactDetails(id: String, name: String, phone: String, about: String)
    suspend fun updateChatContactName(contactId: String, name: String)
    suspend fun getContactCount(): Int

    // Chats
    fun getAllChats(): Flow<List<ChatEntity>>
    suspend fun getChatById(chatId: String): ChatEntity?
    suspend fun getChatByRemoteId(remoteId: String): ChatEntity?
    suspend fun getChatByContactId(contactId: String): ChatEntity?
    suspend fun insertChat(chat: ChatEntity): String
    suspend fun updateChat(chat: ChatEntity)
    suspend fun resetChatUnreadCount(chatId: String)
    suspend fun deleteChat(chatId: String)
    suspend fun updateChatMuteStatus(chatId: String, isMuted: Boolean)

    // Messages
    fun getMessagesForChat(chatId: String): Flow<List<MessageEntity>>
    suspend fun getMessageById(messageId: String): MessageEntity?
    suspend fun getMessageByRemoteId(remoteId: String): MessageEntity?
    fun getStarredMessages(): Flow<List<MessageEntity>>
    fun searchMessages(query: String): Flow<List<MessageEntity>>
    suspend fun insertMessage(message: MessageEntity): String
    suspend fun updateMessage(message: MessageEntity)
    suspend fun deleteMessage(messageId: String)
    suspend fun clearChatMessages(chatId: String)

    // Statuses
    fun getAllStatuses(): Flow<List<StatusEntity>>
    suspend fun insertStatus(status: StatusEntity): String
    suspend fun markStatusViewed(statusId: String)
    suspend fun deleteStatus(statusId: String)
    suspend fun deleteExpiredStatuses(cutoff: Long)

    // Calls
    fun getAllCallLogs(): Flow<List<CallLogEntity>>
    suspend fun insertCallLog(callLog: CallLogEntity): String
    suspend fun clearCallLogs()
}
