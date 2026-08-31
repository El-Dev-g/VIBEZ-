package com.example.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface WhatsAppDao {

    // Contacts
    @Query("SELECT * FROM contacts ORDER BY name ASC")
    fun getAllContacts(): Flow<List<ContactEntity>>

    @Query("SELECT * FROM contacts WHERE id = :id")
    suspend fun getContactById(id: String): ContactEntity?

    @Query("SELECT * FROM contacts WHERE remoteId = :remoteId")
    suspend fun getContactByRemoteId(remoteId: String): ContactEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertContact(contact: ContactEntity)

    @Update
    suspend fun updateContact(contact: ContactEntity)

    @Query("UPDATE contacts SET name = :name, phoneNumber = :phone, aboutStatus = :about WHERE id = :id")
    suspend fun updateContactDetails(id: String, name: String, phone: String, about: String)

    @Query("UPDATE chats SET contactName = :name WHERE contactId = :contactId")
    suspend fun updateChatContactName(contactId: String, name: String)

    @Query("SELECT COUNT(*) FROM contacts")
    suspend fun getContactCount(): Int

    // Chats
    @Query("SELECT * FROM chats ORDER BY lastMessageTime DESC")
    fun getAllChats(): Flow<List<ChatEntity>>

    @Query("SELECT * FROM chats")
    suspend fun getAllChatsOneShot(): List<ChatEntity>

    @Query("SELECT * FROM chats WHERE id = :chatId")
    suspend fun getChatById(chatId: String): ChatEntity?

    @Query("SELECT * FROM chats WHERE remoteId = :remoteId")
    suspend fun getChatByRemoteId(remoteId: String): ChatEntity?

    @Query("SELECT * FROM chats WHERE contactId = :contactId")
    suspend fun getChatByContactId(contactId: String): ChatEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChat(chat: ChatEntity)

    @Update
    suspend fun updateChat(chat: ChatEntity)

    @Query("UPDATE chats SET unreadCount = 0 WHERE id = :chatId")
    suspend fun resetChatUnreadCount(chatId: String)

    @Query("UPDATE messages SET status = 'READ' WHERE chatId = :chatId AND senderId != :currentUserId")
    suspend fun markMessagesAsRead(chatId: String, currentUserId: String)

    @Query("UPDATE messages SET status = 'READ' WHERE chatId = :chatId AND senderId = :currentUserId")
    suspend fun markSentMessagesAsRead(chatId: String, currentUserId: String)

    @Query("DELETE FROM chats WHERE id = :chatId")
    suspend fun deleteChat(chatId: String)

    @Query("UPDATE chats SET isMuted = :isMuted WHERE id = :chatId")
    suspend fun updateChatMuteStatus(chatId: String, isMuted: Boolean)

    @Query("UPDATE chats SET isPinned = :isPinned WHERE id = :chatId")
    suspend fun updateChatPinStatus(chatId: String, isPinned: Boolean)

    // Messages
    @Query("SELECT * FROM messages WHERE chatId = :chatId ORDER BY timestamp ASC")
    fun getMessagesForChat(chatId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE chatId = :chatId")
    suspend fun getMessagesForChatOneShot(chatId: String): List<MessageEntity>

    @Query("SELECT * FROM messages WHERE id = :messageId")
    suspend fun getMessageById(messageId: String): MessageEntity?

    @Query("SELECT * FROM messages WHERE remoteId = :remoteId")
    suspend fun getMessageByRemoteId(remoteId: String): MessageEntity?

    @Query("SELECT * FROM messages WHERE isStarred = 1 ORDER BY timestamp DESC")
    fun getStarredMessages(): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE content LIKE '%' || :query || '%' ORDER BY timestamp DESC")
    fun searchMessages(query: String): Flow<List<MessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Update
    suspend fun updateMessage(message: MessageEntity)

    @Query("DELETE FROM messages WHERE id = :messageId")
    suspend fun deleteMessage(messageId: String)

    @Query("DELETE FROM messages WHERE chatId = :chatId")
    suspend fun clearChatMessages(chatId: String)

    // Statuses
    @Query("SELECT * FROM statuses ORDER BY timestamp DESC")
    fun getAllStatuses(): Flow<List<StatusEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStatus(status: StatusEntity)

    @Query("UPDATE statuses SET isViewed = 1 WHERE id = :statusId")
    suspend fun markStatusViewed(statusId: String)

    @Query("SELECT * FROM statuses WHERE id = :statusId")
    suspend fun getStatusById(statusId: String): StatusEntity?

    @Query("DELETE FROM statuses WHERE id = :statusId")
    suspend fun deleteStatus(statusId: String)

    @Query("SELECT * FROM statuses WHERE timestamp < :cutoff")
    suspend fun getExpiredStatuses(cutoff: Long): List<StatusEntity>

    @Query("DELETE FROM statuses WHERE timestamp < :cutoff")
    suspend fun deleteExpiredStatuses(cutoff: Long)

    // Calls
    @Query("SELECT * FROM call_logs ORDER BY timestamp DESC")
    fun getAllCallLogs(): Flow<List<CallLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCallLog(callLog: CallLogEntity)

    @Query("DELETE FROM call_logs")
    suspend fun clearCallLogs()

    // Communities
    @Query("SELECT * FROM communities ORDER BY createdAt DESC")
    fun getAllCommunities(): Flow<List<CommunityEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCommunity(community: CommunityEntity)

    @Query("DELETE FROM communities WHERE id = :id")
    suspend fun deleteCommunity(id: String)
}
