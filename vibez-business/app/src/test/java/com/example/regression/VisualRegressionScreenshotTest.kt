package com.example.regression

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.example.data.CallLogEntity
import com.example.data.ChatEntity
import com.example.data.StatusEntity
import com.example.ui.screens.CallsListScreen
import com.example.ui.screens.ChatsListScreen
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

/**
 * 7. Regression Testing
 * Focus: High-fidelity visual regression & UI consistency testing across theme variations (Dark/Light).
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = RobolectricDeviceQualifiers.Pixel8, sdk = [36])
class VisualRegressionScreenshotTest {

    companion object {
        private const val FIXED_TIMESTAMP = 1700000000000L
    }

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testChatsListScreenDarkModeRegression() {
        val sampleChats = listOf(
            ChatEntity(
                id = "c_dark_1",
                contactId = "u_1",
                contactName = "Sarah Jenkins",
                contactAvatar = "",
                lastMessage = "Hey! Did you check out the new design?",
                lastMessageTime = FIXED_TIMESTAMP,
                unreadCount = 2,
                isPinned = true,
                isVerified = true
            )
        )

        composeTestRule.setContent {
            WhatsAppTheme(darkTheme = true) {
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
        composeTestRule.onRoot().captureRoboImage("src/test/screenshots/regression_chats_dark.png")
    }

    @Test
    fun testStatusListScreenRegression() {
        val sampleStatuses = listOf(
            StatusEntity(
                id = "status_reg_1",
                contactId = "u_2",
                contactName = "Alex Rivers",
                contactAvatar = "",
                mediaUrl = "",
                textCaption = "Sunset at Golden Gate Bridge",
                timestamp = FIXED_TIMESTAMP,
                isViewed = false
            )
        )

        composeTestRule.setContent {
            WhatsAppTheme(darkTheme = false) {
                StatusListScreen(
                    statuses = sampleStatuses,
                    onStatusClick = {},
                    onCreateTextStatusClick = {},
                    onCreatePhotoStatusClick = {}
                )
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onRoot().captureRoboImage("src/test/screenshots/regression_status_light.png")
    }

    @Test
    fun testSettingsScreenDarkModeRegression() {
        composeTestRule.setContent {
            WhatsAppTheme(darkTheme = true) {
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
        composeTestRule.onRoot().captureRoboImage("src/test/screenshots/regression_settings_dark.png")
    }
}
