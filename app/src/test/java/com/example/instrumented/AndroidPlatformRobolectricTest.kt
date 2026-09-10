package com.example.instrumented

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.ConnectivityManager
import android.os.Vibrator
import androidx.test.core.app.ApplicationProvider
import com.example.R
import com.example.util.AuthManager
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 2. Instrumented Testing (Robolectric JVM Simulation)
 * Focus: Android OS framework interactions, Context lifecycle, SharedPreferences persistence,
 * System services, and Intent contracts without requiring a physical emulator or ADB.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class AndroidPlatformRobolectricTest {

    private lateinit var context: Context
    private lateinit var authManager: AuthManager

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        authManager = AuthManager(context)
        authManager.logout()
    }

    @Test
    fun testAppContextAndStringResources() {
        val appName = context.getString(R.string.app_name)
        assertNotNull(appName)
        assertEquals("VIBEZ", appName)
    }

    @Test
    fun testSharedPreferencesAuthStorageAndRetrieval() {
        assertFalse(authManager.isLoggedIn())
        assertNull(authManager.getAuthToken())

        authManager.saveAuthData(
            token = "jwt_test_token_12345",
            userId = "usr_vibez_999",
            phoneNumber = "+14155550199",
            userName = "Jordan Lee",
            userAbout = "Testing VIBEZ locally",
            userAvatar = "https://example.com/avatar.jpg",
            googleEmail = null,
            authProvider = "PHONE",
            requiresProfileSetup = false
        )

        assertTrue(authManager.isLoggedIn())
        assertEquals("jwt_test_token_12345", authManager.getAuthToken())
        assertEquals("usr_vibez_999", authManager.getUserId())
        assertEquals("+14155550199", authManager.getPhoneNumber())
        assertEquals("Jordan Lee", authManager.getUserName())
        assertEquals("Testing VIBEZ locally", authManager.getUserAbout())
        assertFalse(authManager.getRequiresProfileSetup())
    }

    @Test
    fun testAuthManagerProfileUpdateAndLogout() {
        authManager.saveAuthData(
            token = "jwt_token_temp",
            userId = "usr_temp",
            phoneNumber = "+14155550100"
        )
        authManager.updateProfile(
            userName = "Jordan Updated",
            userAbout = "Updated status",
            userAvatar = "https://example.com/new.png"
        )
        assertEquals("Jordan Updated", authManager.getUserName())
        assertEquals("Updated status", authManager.getUserAbout())
        assertEquals("https://example.com/new.png", authManager.getUserAvatar())

        authManager.logout()
        assertFalse(authManager.isLoggedIn())
        assertNull(authManager.getAuthToken())

        // deleteLocalAccountData clears all preferences completely
        authManager.deleteLocalAccountData()
        assertNull(authManager.getUserId())
    }

    @Test
    fun testAuthManagerCustomSettingsPreferences() {
        authManager.setSettingBoolean("chat_wallpaper_dim", true)
        assertTrue(authManager.getSettingBoolean("chat_wallpaper_dim", false))

        authManager.setSettingString("custom_ringtone", "melody_vibez")
        assertEquals("melody_vibez", authManager.getSettingString("custom_ringtone"))

        authManager.setVerified(true)
        assertTrue(authManager.isVerified())
    }

    @Test
    fun testAndroidSystemServicesAvailability() {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        assertNotNull("ConnectivityManager should be present in Android environment", connectivityManager)

        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        assertNotNull("AudioManager should be present in Android environment", audioManager)

        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        assertNotNull("Vibrator service should be present", vibrator)
    }

    @Test
    fun testShareIntentConstruction() {
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "Check out VIBEZ secure messenger!")
        }
        assertEquals(Intent.ACTION_SEND, shareIntent.action)
        assertEquals("text/plain", shareIntent.type)
        assertEquals("Check out VIBEZ secure messenger!", shareIntent.getStringExtra(Intent.EXTRA_TEXT))
    }
}
