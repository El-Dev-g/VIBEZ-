package com.example.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.FileProvider
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.data.network.NetworkClient
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class InAppUpdateWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        Log.d(TAG, "InAppUpdateWorker starting background update check...")
        try {
            val latestUpdate = NetworkClient.apiService.getLatestUpdate()
            val currentVersionCode = 1 // Hardcoded version code of current installed app

            if (latestUpdate.versionCode > currentVersionCode) {
                Log.d(TAG, "Newer version detected: v${latestUpdate.versionName} (${latestUpdate.versionCode})")
                
                val apkFile = File(context.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS), "vibez-update.apk")
                if (apkFile.exists()) {
                    apkFile.delete()
                }

                // Download the APK in the background
                val success = downloadApk(latestUpdate.downloadUrl, apkFile)
                if (success) {
                    Log.d(TAG, "APK downloaded successfully to ${apkFile.absolutePath}")
                    showUpdateNotification(latestUpdate.versionName, apkFile)
                    return Result.success()
                } else {
                    Log.e(TAG, "Failed to download APK from ${latestUpdate.downloadUrl}")
                    return Result.retry()
                }
            } else {
                Log.d(TAG, "App is up to date (current: $currentVersionCode, remote: ${latestUpdate.versionCode})")
            }
            return Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error checking or downloading update", e)
            return Result.retry()
        }
    }

    private fun downloadApk(downloadUrl: String, destinationFile: File): Boolean {
        var input: java.io.InputStream? = null
        var output: FileOutputStream? = null
        var connection: HttpURLConnection? = null
        try {
            val url = URL(downloadUrl)
            connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.connect()

            if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                Log.e(TAG, "Server returned HTTP ${connection.responseCode}")
                return false
            }

            input = connection.inputStream
            output = FileOutputStream(destinationFile)

            val data = ByteArray(4096)
            var count: Int
            while (input.read(data).also { count = it } != -1) {
                output.write(data, 0, count)
            }
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Download error", e)
            return false
        } finally {
            try {
                output?.close()
                input?.close()
            } catch (ignored: Exception) {}
            connection?.disconnect()
        }
    }

    private fun showUpdateNotification(versionName: String, apkFile: File) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "app_updates_channel"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "App Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for automatic background app updates"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val authority = "${context.packageName}.fileprovider"
        val apkUri = FileProvider.getUriForFile(context, authority, apkFile)

        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            installIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle("New Update Ready to Install")
            .setContentText("Version $versionName has been downloaded. Tap to install.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    companion object {
        private const val TAG = "InAppUpdateWorker"
        private const val NOTIFICATION_ID = 9999
    }
}
