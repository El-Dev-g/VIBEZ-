package com.example.service

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

object InAppUpdateService {

    private const val PERIODIC_WORK_NAME = "periodic_in_app_update_check"
    private const val ONE_TIME_WORK_NAME = "one_time_in_app_update_check"

    /**
     * Schedules a periodic background check for app updates using WorkManager.
     * Runs every 12 hours under metered/unmetered network constraints.
     */
    fun schedulePeriodicCheck(context: Context) {
        try {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val periodicWorkRequest = PeriodicWorkRequestBuilder<InAppUpdateWorker>(12, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                periodicWorkRequest
            )
        } catch (e: Exception) {
            android.util.Log.w("InAppUpdateService", "WorkManager could not be initialized or scheduled: ${e.message}")
        }
    }

    /**
     * Triggers an immediate one-time background update check and download.
     */
    fun checkAndDownloadImmediately(context: Context) {
        try {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val oneTimeWorkRequest = OneTimeWorkRequestBuilder<InAppUpdateWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                ONE_TIME_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                oneTimeWorkRequest
            )
        } catch (e: Exception) {
            android.util.Log.w("InAppUpdateService", "WorkManager could not enqueue immediate work: ${e.message}")
        }
    }

    /**
     * Cancels scheduled background update tasks.
     */
    fun cancelAllChecks(context: Context) {
        try {
            val workManager = WorkManager.getInstance(context)
            workManager.cancelUniqueWork(PERIODIC_WORK_NAME)
            workManager.cancelUniqueWork(ONE_TIME_WORK_NAME)
        } catch (e: Exception) {
            android.util.Log.w("InAppUpdateService", "WorkManager cancel failed: ${e.message}")
        }
    }
}
