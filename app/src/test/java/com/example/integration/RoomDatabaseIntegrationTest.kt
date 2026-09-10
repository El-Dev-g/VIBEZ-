package com.example.integration

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.ChatEntity
import com.example.data.ContactEntity
import com.example.data.MessageEntity
import com.example.data.WhatsAppDao
import com.example.data.WhatsAppDatabase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 4. Integration Testing
 * Focus: Real SQLite in-memory persistence, Data Access Objects (DAOs), Reactive Flows,
 * transaction boundaries, and multi-entity relationship integrity.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class RoomDatabaseIntegrationTest {

    private lateinit var database: WhatsAppDatabase
    private lateinit var dao: WhatsAppDao

    @Before
    fun createDb() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, WhatsAppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        dao = database.whatsAppDao()
    }

    @After
    fun closeDb() {
        database.close()
    }

    @Test
    fun testContactInsertionAndRetrieval() = runBlocking {
        val contact = ContactEntity(
            id = "c_1",
            remoteId = "rem_c1",
            name = "Maya Lin",
            phoneNumber = "+14155550200",
            aboutStatus = "Building architecture",
            isVerified = true
        )

        dao.insertContact(contact)

        val retrieved = dao.getContactById("c_1")
        assertNotNull(retrieved)
        assertEquals("Maya Lin", retrieved?.name)
        assertEquals("+14155550200", retrieved?.phoneNumber)
        assertTrue(retrieved?.isVerified == true)

        val byPhone = dao.getContactByPhone("+14155550200")
        assertNotNull(byPhone)
        assertEquals("c_1", byPhone?.id)

        assertEquals(1, dao.getContactCount())
    }

    @Test
    fun testChatAndMessageIntegrationFlow() = runBlocking {
        // 1. Create a Chat
        val chat = ChatEntity(
            id = "chat_abc",
            contactId = "c_1",
            contactName = "Maya Lin",
            contactAvatar = "",
            lastMessage = "Hey Maya!",
            lastMessageTime = 1000L,
            unreadCount = 0
        )
        dao.insertChat(chat)

        // 2. Insert outgoing and incoming messages
        val msg1 = MessageEntity(
            id = "m_1",
            chatId = "chat_abc",
            senderId = "ME",
            content = "Hey Maya!",
            timestamp = 1000L,
            status = "SENT"
        )
        val msg2 = MessageEntity(
            id = "m_2",
            chatId = "chat_abc",
            senderId = "c_1",
            content = "Hey! How is everything going?",
            timestamp = 1050L,
            status = "DELIVERED"
        )
        dao.insertMessage(msg1)
        dao.insertMessage(msg2)

        // 3. Query messages for the chat in chronological order
        val messages = dao.getMessagesForChat("chat_abc").first()
        assertEquals(2, messages.size)
        assertEquals("m_1", messages[0].id)
        assertEquals("m_2", messages[1].id)
        assertEquals("Hey! How is everything going?", messages[1].content)

        // 4. Update chat with incoming unread count and latest message
        val updatedChat = chat.copy(
            lastMessage = msg2.content,
            lastMessageTime = msg2.timestamp,
            unreadCount = 1
        )
        dao.updateChat(updatedChat)

        val retrievedChat = dao.getChatById("chat_abc")
        assertEquals(1, retrievedChat?.unreadCount)
        assertEquals("Hey! How is everything going?", retrievedChat?.lastMessage)

        // 5. Read incoming messages and reset unread count
        dao.markMessagesAsRead("chat_abc", "ME")
        dao.resetChatUnreadCount("chat_abc")

        val unreadClearedChat = dao.getChatById("chat_abc")
        assertEquals(0, unreadClearedChat?.unreadCount)

        val readMessages = dao.getMessagesForChat("chat_abc").first()
        val incomingMsg = readMessages.find { it.id == "m_2" }
        assertEquals("READ", incomingMsg?.status)
    }

    @Test
    fun testSearchMessagesByKeyword() = runBlocking {
        val chatId = "chat_search"
        dao.insertChat(ChatEntity(id = chatId, contactId = "u_search", contactName = "Search Contact"))

        dao.insertMessage(MessageEntity(id = "m_s1", chatId = chatId, senderId = "ME", content = "Meeting scheduled for 3pm"))
        dao.insertMessage(MessageEntity(id = "m_s2", chatId = chatId, senderId = "u_search", content = "Sounds great, see you then!"))
        dao.insertMessage(MessageEntity(id = "m_s3", chatId = chatId, senderId = "ME", content = "Please bring the project files"))

        val searchResults = dao.searchMessages("Meeting").first()
        assertEquals(1, searchResults.size)
        assertEquals("m_s1", searchResults[0].id)

        val allProjectMatches = dao.searchMessages("project").first()
        assertEquals(1, allProjectMatches.size)
        assertEquals("m_s3", allProjectMatches[0].id)
    }

    @Test
    fun testDeleteChatAndClearMessages() = runBlocking {
        val chatId = "chat_del"
        dao.insertChat(ChatEntity(id = chatId, contactId = "u_del", contactName = "To Delete"))
        dao.insertMessage(MessageEntity(id = "m_d1", chatId = chatId, senderId = "ME", content = "Temp message"))

        dao.clearChatMessages(chatId)
        val msgs = dao.getMessagesForChatOneShot(chatId)
        assertTrue("Messages should be cleared", msgs.isEmpty())

        dao.deleteChat(chatId)
        val chat = dao.getChatById(chatId)
        assertNull("Chat should be deleted", chat)
    }
}
