package com.example

import android.app.Application
import androidx.work.Configuration
import com.google.firebase.FirebaseApp
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory
import com.example.util.PhoneAuthPolicyManager

class VibezApplication : Application(), Configuration.Provider {

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(android.util.Log.INFO)
            .build()

    override fun onCreate() {
        super.onCreate()
        try {
            FirebaseApp.initializeApp(this)
        } catch (e: Exception) {
            android.util.Log.w("VibezApplication", "FirebaseApp init: ${e.message}")
        }

        try {
            PhoneAuthPolicyManager.init(this)
        } catch (e: Exception) {
            android.util.Log.w("VibezApplication", "PhoneAuthPolicyManager init: ${e.message}")
        }

        try {
            com.example.service.InAppUpdateService.schedulePeriodicCheck(this)
        } catch (e: Exception) {
            android.util.Log.w("VibezApplication", "InAppUpdateService init: ${e.message}")
        }
        
        try {
            val firebaseAppCheck = FirebaseAppCheck.getInstance()
            if (BuildConfig.DEBUG) {
                try {
                    firebaseAppCheck.installAppCheckProviderFactory(
                        DebugAppCheckProviderFactory.getInstance()
                    )
                } catch (e: Exception) {
                    android.util.Log.w("VibezApplication", "DebugAppCheckProviderFactory init: ${e.message}")
                }
            } else {
                try {
                    firebaseAppCheck.installAppCheckProviderFactory(
                        PlayIntegrityAppCheckProviderFactory.getInstance()
                    )
                } catch (e: Exception) {
                    android.util.Log.w("VibezApplication", "PlayIntegrityAppCheckProviderFactory init: ${e.message}")
                }
            }
        } catch (e: Exception) {
            android.util.Log.w("VibezApplication", "FirebaseAppCheck init: ${e.message}")
        }
    }
}
