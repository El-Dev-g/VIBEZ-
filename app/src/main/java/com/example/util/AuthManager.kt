package com.example.util

import android.content.Context
import android.content.SharedPreferences

class AuthManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("vibez_auth", Context.MODE_PRIVATE)

    fun saveAuthData(
        token: String,
        userId: String,
        phoneNumber: String,
        userName: String? = null,
        userAbout: String? = null,
        userAvatar: String? = null,
        googleEmail: String? = null,
        authProvider: String = "PHONE"
    ) {
        prefs.edit().apply {
            putString("token", token)
            putString("user_id", userId)
            putString("phone_number", phoneNumber)
            if (userName != null) putString("user_name", userName)
            if (userAbout != null) putString("user_about", userAbout)
            if (userAvatar != null) putString("user_avatar", userAvatar)
            if (googleEmail != null) putString("google_email", googleEmail)
            putString("auth_provider", authProvider)
            apply()
        }
    }

    fun updateProfile(userName: String, userAbout: String, userAvatar: String? = null) {
        prefs.edit().apply {
            putString("user_name", userName)
            putString("user_about", userAbout)
            if (userAvatar != null) putString("user_avatar", userAvatar)
            apply()
        }
    }

    fun getAuthToken(): String? = prefs.getString("token", null)
    fun getUserId(): String? = prefs.getString("user_id", null)
    fun getPhoneNumber(): String? = prefs.getString("phone_number", null)
    fun getUserName(): String? = prefs.getString("user_name", null)
    fun getUserAbout(): String? = prefs.getString("user_about", null)
    fun getUserAvatar(): String? = prefs.getString("user_avatar", null)
    fun getGoogleEmail(): String? = prefs.getString("google_email", null)
    fun getAuthProvider(): String = prefs.getString("auth_provider", "PHONE") ?: "PHONE"

    fun setSettingBoolean(key: String, value: Boolean) {
        prefs.edit().putBoolean("setting_$key", value).apply()
    }

    fun getSettingBoolean(key: String, defaultValue: Boolean = false): Boolean {
        return prefs.getBoolean("setting_$key", defaultValue)
    }

    fun isLoggedIn(): Boolean = getAuthToken() != null

    fun logout() {
        prefs.edit().clear().apply()
    }
}
