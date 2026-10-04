package com.example.unit

import com.example.data.CallLogEntity
import com.example.data.ChatEntity
import com.example.data.ContactEntity
import com.example.data.Converters
import com.example.data.MessageEntity
import com.example.data.StatusEntity
import com.example.data.StatusViewer
import org.junit.Assert.*
import org.junit.Test

/**
 * 1. Unit Testing (continued)
 * Focus: Serialization, TypeConverters, Entity model contracts, status flags, and immutability.
 */
class DataConvertersAndModelsUnitTest {

    private val converters = Converters()

    @Test
    fun testStatusViewerListSerializationAndDeserialization() {
        val viewers = listOf(
            StatusViewer(
                contactId = "user_101",
                name = "Alice Wonder",
                avatarUrl = "https://example.com/alice.png",
                phoneNumber = "+14155550101",
                viewedTimestamp = 1700000000000L,
                timeAgoFormatted = "5m ago"
            ),
            StatusViewer(
                contactId = "user_102",
                name = "Bob Marley",
                avatarUrl = "",
                phoneNumber = "+14155550102",
                viewedTimestamp = 1700000060000L,
                timeAgoFormatted = "1h ago"
            )
        )

        val json = converters.fromStatusViewerList(viewers)
        assertNotNull(json)
        assertTrue(json.contains("Alice Wonder"))
        assertTrue(json.contains("user_101"))

        val restored = converters.toStatusViewerList(json)
        assertEquals(2, restored.size)
        assertEquals("Alice Wonder", restored[0].name)
        assertEquals("+14155550101", restored[0].phoneNumber)
        assertEquals("Bob Marley", restored[1].name)
    }

    @Test
    fun testEmptyStatusViewerListSerialization() {
        val emptyList = emptyList<StatusViewer>()
        val json = converters.fromStatusViewerList(emptyList)
        val restored = converters.toStatusViewerList(json)
        assertTrue(restored.isEmpty())
    }

    @Test
    fun testMessageEntityInvariantsAndCopy() {
        val original = MessageEntity(
            id = "msg_1",
            remoteId = "rem_1",
            chatId = "chat_abc",
            senderId = "ME",
            content = "Hello there!",
            timestamp = 1000L,
            status = "SENT",
            messageType = "TEXT"
        )

        assertEquals("SENT", original.status)
        assertFalse(original.isStarred)
        assertFalse(original.isPinned)

        val updated = original.copy(status = "DELIVERED", isStarred = true)
        assertEquals("DELIVERED", updated.status)
        assertTrue(updated.isStarred)
        assertEquals("Hello there!", updated.content)
        assertEquals(original.id, updated.id)
    }

    @Test
    fun testChatEntityUnreadCountAndPinning() {
        val chat = ChatEntity(
            id = "chat_1",
            contactId = "contact_1",
            contactName = "General Chat",
            contactAvatar = "",
            lastMessage = "See you tomorrow",
            lastMessageTime = 2000L,
            unreadCount = 5,
            isPinned = false,
            isMuted = false
        )

        assertEquals(5, chat.unreadCount)
        val readChat = chat.copy(unreadCount = 0, isPinned = true)
        assertEquals(0, readChat.unreadCount)
        assertTrue(readChat.isPinned)
    }

    @Test
    fun testCallLogEntityTypes() {
        val videoCall = CallLogEntity(
            id = "call_v1",
            contactId = "c1",
            contactName = "David",
            callType = "VIDEO",
            isIncoming = true,
            isMissed = false,
            timestamp = 3000L
        )
        assertEquals("VIDEO", videoCall.callType)
        assertTrue(videoCall.isIncoming)
        assertFalse(videoCall.isMissed)

        val missedVoice = videoCall.copy(callType = "VOICE", isMissed = true)
        assertEquals("VOICE", missedVoice.callType)
        assertTrue(missedVoice.isMissed)
    }
}
