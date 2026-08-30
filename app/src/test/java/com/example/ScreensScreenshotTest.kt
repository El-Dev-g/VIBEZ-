package com.example

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.example.data.CallLogEntity
import com.example.data.ChatEntity
import com.example.data.CommunityEntity
import com.example.data.ContactEntity
import com.example.data.StatusEntity
import com.example.ui.screens.CallsListScreen
import com.example.ui.screens.ChatsListScreen
import com.example.ui.screens.CommunitiesScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.screens.StatusListScreen
import com.example.ui.theme.WhatsAppTheme
import com.github.takahirom.roborazzi.RobolectricDeviceQualifiers
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = RobolectricDeviceQualifiers.Pixel8, sdk = [36])
class ScreensScreenshotTest {

  @get:Rule val composeTestRule = createComposeRule()

  @Test
  fun testChatsListScreenRendering() {
    val sampleChats = listOf(
      ChatEntity(
        id = "chat_1",
        contactId = "user_1",
        contactName = "Sarah Jenkins",
        contactAvatar = "",
        lastMessage = "Hey! Did you check out the new design?",
        lastMessageTime = System.currentTimeMillis(),
        unreadCount = 2,
        isPinned = true,
        isVerified = true
      ),
      ChatEntity(
        id = "chat_2",
        contactId = "user_2",
        contactName = "VIBEZ Team",
        contactAvatar = "",
        lastMessage = "Welcome to VIBEZ Messaging Platform!",
        lastMessageTime = System.currentTimeMillis() - 3600000,
        unreadCount = 0,
        isGroup = true,
        isOfficial = true
      )
    )

    composeTestRule.setContent {
      WhatsAppTheme {
        ChatsListScreen(
          chats = sampleChats,
          searchQuery = "",
          onSearchQueryChange = {},
          onChatClick = {},
          onNewChatClick = {}
        )
      }
    }

    composeTestRule.waitForIdle()
    composeTestRule.onRoot().captureRoboImage("src/test/screenshots/chats_list_screen.png")
  }

  @Test
  fun testCallsListScreenRendering() {
    val sampleCalls = listOf(
      CallLogEntity(
        id = "call_1",
        contactId = "user_1",
        contactName = "Sarah Jenkins",
        callType = "VIDEO",
        isIncoming = true,
        isMissed = false,
        timestamp = System.currentTimeMillis()
      ),
      CallLogEntity(
        id = "call_2",
        contactId = "user_2",
        contactName = "David Miller",
        callType = "VOICE",
        isIncoming = false,
        isMissed = false,
        timestamp = System.currentTimeMillis() - 7200000
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
    composeTestRule.onRoot().captureRoboImage("src/test/screenshots/calls_list_screen.png")
  }

  @Test
  fun testStatusListScreenRendering() {
    val sampleStatuses = listOf(
      StatusEntity(
        id = "status_1",
        contactId = "user_1",
        contactName = "Sarah Jenkins",
        contactAvatar = "",
        mediaUrl = "",
        textCaption = "Beautiful sunset today!",
        timestamp = System.currentTimeMillis(),
        isViewed = false
      )
    )

    composeTestRule.setContent {
      WhatsAppTheme {
        StatusListScreen(
          statuses = sampleStatuses,
          onStatusClick = {},
          onCreateTextStatusClick = {},
          onCreatePhotoStatusClick = {}
        )
      }
    }

    composeTestRule.waitForIdle()
    composeTestRule.onRoot().captureRoboImage("src/test/screenshots/status_list_screen.png")
  }

  @Test
  fun testCommunitiesScreenRendering() {
    val sampleCommunities = listOf(
      CommunityEntity(
        id = "comm_1",
        name = "Android Developers Hub",
        description = "Official Android & Kotlin community",
        membersCount = 1420
      )
    )

    composeTestRule.setContent {
      WhatsAppTheme {
        CommunitiesScreen(
          communities = sampleCommunities,
          onCreateCommunityClick = {},
          onCommunityClick = {},
          onCommunityChatClick = {}
        )
      }
    }

    composeTestRule.waitForIdle()
    composeTestRule.onRoot().captureRoboImage("src/test/screenshots/communities_screen.png")
  }

  @Test
  fun testSettingsScreenRendering() {
    composeTestRule.setContent {
      WhatsAppTheme {
        SettingsScreen(
          isDarkMode = true,
          userName = "Alex Rivers",
          userPhone = "+1 555-0199",
          isVerified = true,
          onBackClick = {},
          onToggleDarkMode = {},
          onLogoutClick = {}
        )
      }
    }

    composeTestRule.waitForIdle()
    composeTestRule.onRoot().captureRoboImage("src/test/screenshots/settings_screen.png")
  }
}

