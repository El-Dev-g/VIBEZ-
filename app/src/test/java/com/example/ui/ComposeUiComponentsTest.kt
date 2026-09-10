package com.example.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.example.data.CallLogEntity
import com.example.data.ChatEntity
import com.example.ui.screens.CallsListScreen
import com.example.ui.screens.ChatsListScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.theme.WhatsAppTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 3. UI Testing
 * Focus: Jetpack Compose component hierarchy, click handlers, state mutations, and UI assertions.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ComposeUiComponentsTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testChatsListScreenDisplaysConversationsAndHandlesClicks() {
        var clickedChatId: String? = null

        val sampleChats = listOf(
            ChatEntity(
                id = "chat_test_101",
                contactId = "user_101",
                contactName = "Sophia Adams",
                contactAvatar = "",
                lastMessage = "Let's review the mockups.",
                lastMessageTime = System.currentTimeMillis(),
                unreadCount = 3,
                isPinned = true
            ),
            ChatEntity(
                id = "chat_test_102",
                contactId = "user_102",
                contactName = "Engineering Team",
                contactAvatar = "",
                lastMessage = "Sprint planning at 10 AM",
                lastMessageTime = System.currentTimeMillis() - 60000,
                unreadCount = 0,
                isGroup = true
            )
        )

        composeTestRule.setContent {
            WhatsAppTheme {
                ChatsListScreen(
                    chats = sampleChats,
                    searchQuery = "",
                    onSearchQueryChange = {},
                    onChatClick = { clickedChatId = it },
                    onNewChatClick = {}
                )
            }
        }

        composeTestRule.waitForIdle()

        // Assert contacts and messages are displayed
        composeTestRule.onNodeWithText("Sophia Adams").assertIsDisplayed()
        composeTestRule.onNodeWithText("Engineering Team").assertIsDisplayed()
        composeTestRule.onNodeWithText("Let's review the mockups.").assertIsDisplayed()

        // Perform click on a chat item
        composeTestRule.onNodeWithText("Sophia Adams").performClick()
        composeTestRule.waitForIdle()

        assertEquals("chat_test_101", clickedChatId)
    }

    @Test
    fun testCallsListScreenDisplaysRecentCalls() {
        val sampleCalls = listOf(
            CallLogEntity(
                id = "call_rec_1",
                contactId = "user_301",
                contactName = "Marcus Vance",
                callType = "VIDEO",
                isIncoming = true,
                isMissed = false,
                timestamp = System.currentTimeMillis()
            )
        )

        composeTestRule.setContent {
            WhatsAppTheme {
                CallsListScreen(
                    callLogs = sampleCalls,
                    onStartCallClick = { _, _ -> },
                    onNewCallFabClick = {}
                )
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithText("Marcus Vance").assertIsDisplayed()
    }

    @Test
    fun testSettingsScreenDisplaysUserProfileAndHandlesActions() {
        var badgeReceiptClicked = false

        composeTestRule.setContent {
            WhatsAppTheme {
                SettingsScreen(
                    isDarkMode = false,
                    userName = "Elena Rostova",
                    userPhone = "+1 555-0144",
                    isVerified = true,
                    onBackClick = {},
                    onToggleDarkMode = {},
                    onViewBadgeReceiptClick = { badgeReceiptClicked = true }
                )
            }
        }

        composeTestRule.waitForIdle()

        // Verify profile details (displayed in header)
        composeTestRule.onAllNodesWithText("Elena Rostova").onFirst().assertIsDisplayed()
        composeTestRule.onNodeWithText("Verification & Badges").assertIsDisplayed().performClick()
        composeTestRule.waitForIdle()

        assertTrue("Badge click should trigger receipt callback when verified", badgeReceiptClicked)
    }
}
