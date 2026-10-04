package com.example.e2e

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.ChatEntity
import com.example.data.ContactEntity
import com.example.data.MessageEntity
import com.example.data.WhatsAppDao
import com.example.data.WhatsAppDatabase
import com.example.util.AuthManager
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
 * 5. End-to-End (E2E) Testing
 * Focus: Complete Critical User Journey (CUJ) execution covering user authentication,
 * contact creation, conversational exchange, status progression, and persistence.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class MessagingEndToEndCujTest {

    private lateinit var context: Context
    private lateinit var database: WhatsAppDatabase
    private lateinit var dao: WhatsAppDao
    private lateinit var authManager: AuthManager

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        database = Room.inMemoryDatabaseBuilder(context, WhatsAppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        dao = database.whatsAppDao()
        authManager = AuthManager(context)
        authManager.logout()
    }

    @After
    fun tearDown() {
        database.close()
        authManager.logout()
    }

    @Test
    fun executeCompleteMessagingCriticalUserJourney() = runBlocking {
        // STEP 1: User Authentication & Profile Initialization
        authManager.saveAuthData(
            token = "jwt_live_session_cuj_token",
            userId = "usr_primary_me",
            phoneNumber = "+14155550100",
            userName = "Dev Tester",
            userAbout = "Testing E2E messaging flow",
            requiresProfileSetup = false
        )
        assertTrue("User must be logged in after authentication", authManager.isLoggedIn())
        val currentUserId = authManager.getUserId() ?: "ME"

        // STEP 2: Contact Discovery & Addition
        val recipientContact = ContactEntity(
            id = "user_rec_42",
            remoteId = "rem_42",
            name = "Dr. Clara Oswald",
            phoneNumber = "+447911123456",
            aboutStatus = "Exploring time and space",
            isOnline = true,
            isVerified = true
        )
        dao.insertContact(recipientContact)
        val verifiedContact = dao.getContactById("user_rec_42")
        assertNotNull("Contact must be stored and queryable", verifiedContact)
        assertEquals("Dr. Clara Oswald", verifiedContact?.name)

        // STEP 3: Start New Chat Conversation
        val chatId = "chat_cuj_1001"
        val initialChat = ChatEntity(
            id = chatId,
            contactId = recipientContact.id,
            contactName = recipientContact.name,
            contactAvatar = recipientContact.avatarUrl,
            lastMessage = "Hey Clara!",
            lastMessageTime = System.currentTimeMillis(),
            unreadCount = 0,
            isVerified = true
        )
        dao.insertChat(initialChat)

        // STEP 4: Compose & Send Outgoing Message
        val outgoingMsgId = "msg_out_001"
        val outgoingMessage = MessageEntity(
            id = outgoingMsgId,
            chatId = chatId,
            senderId = currentUserId,
            content = "Hey Clara, the system tests are running!",
            timestamp = System.currentTimeMillis(),
            status = "SENT",
            messageType = "TEXT"
        )
        dao.insertMessage(outgoingMessage)

        var messagesInChat = dao.getMessagesForChat(chatId).first()
        assertEquals(1, messagesInChat.size)
        assertEquals("SENT", messagesInChat[0].status)

        // STEP 5: Delivery & Read Receipt Flow
        // Server acknowledges delivery
        val deliveredMsg = outgoingMessage.copy(status = "DELIVERED")
        dao.updateMessage(deliveredMsg)
        assertEquals("DELIVERED", dao.getMessageById(outgoingMsgId)?.status)

        // Recipient reads the message
        val readMsg = deliveredMsg.copy(status = "READ")
        dao.updateMessage(readMsg)
        assertEquals("READ", dao.getMessageById(outgoingMsgId)?.status)

        // STEP 6: Incoming Response Received
        val incomingMsgId = "msg_in_002"
        val incomingMessage = MessageEntity(
            id = incomingMsgId,
            chatId = chatId,
            senderId = recipientContact.id,
            content = "Brilliant! Looking forward to the test report.",
            timestamp = System.currentTimeMillis() + 1000L,
            status = "DELIVERED",
            messageType = "TEXT"
        )
        dao.insertMessage(incomingMessage)

        // Update chat list item
        val chatWithIncoming = initialChat.copy(
            lastMessage = incomingMessage.content,
            lastMessageTime = incomingMessage.timestamp,
            unreadCount = 1
        )
        dao.updateChat(chatWithIncoming)

        val updatedChat = dao.getChatById(chatId)
        assertEquals(1, updatedChat?.unreadCount)
        assertEquals("Brilliant! Looking forward to the test report.", updatedChat?.lastMessage)

        // STEP 7: User Opens Chat, Marks Messages as Read
        dao.markMessagesAsRead(chatId, currentUserId)
        dao.resetChatUnreadCount(chatId)

        val finalChatState = dao.getChatById(chatId)
        assertEquals(0, finalChatState?.unreadCount)

        val finalIncomingMsg = dao.getMessageById(incomingMsgId)
        assertEquals("READ", finalIncomingMsg?.status)

        // STEP 8: Star Message & Verify Pinning
        dao.updateMessage(incomingMessage.copy(isStarred = true))
        val starredList = dao.getStarredMessages().first()
        assertEquals(1, starredList.size)
        assertEquals(incomingMsgId, starredList[0].id)

        // STEP 9: End of Session & Cleanup Verification
        dao.deleteChat(chatId)
        dao.clearChatMessages(chatId)
        assertNull(dao.getChatById(chatId))
        assertTrue(dao.getMessagesForChatOneShot(chatId).isEmpty())
    }
}
