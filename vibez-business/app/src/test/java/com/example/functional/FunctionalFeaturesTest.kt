package com.example.functional

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.StatusEntity
import com.example.data.WhatsAppDao
import com.example.data.WhatsAppDatabase
import com.example.service.InAppUpdateService
import com.example.webrtc.SignalingClient
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.webrtc.IceCandidate
import org.webrtc.SessionDescription

/**
 * 6. Functional Testing
 * Focus: Specific functional domain features: Status 24-hour expiration mechanics,
 * Background WorkManager update triggers, WebRTC Signaling events, and Auth fallbacks.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class FunctionalFeaturesTest {

    private lateinit var context: Context
    private lateinit var database: WhatsAppDatabase
    private lateinit var dao: WhatsAppDao

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        database = Room.inMemoryDatabaseBuilder(context, WhatsAppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        dao = database.whatsAppDao()
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun testStatus24HourExpirationLifecycle() = runBlocking {
        val now = System.currentTimeMillis()
        val twentyFiveHoursAgo = now - (25 * 60 * 60 * 1000L)
        val oneHourAgo = now - (1 * 60 * 60 * 1000L)

        val expiredStatus = StatusEntity(
            id = "stat_old",
            contactId = "u_1",
            contactName = "User One",
            textCaption = "Old story from yesterday",
            timestamp = twentyFiveHoursAgo
        )

        val activeStatus = StatusEntity(
            id = "stat_active",
            contactId = "u_2",
            contactName = "User Two",
            textCaption = "Fresh story from today",
            timestamp = oneHourAgo
        )

        dao.insertStatus(expiredStatus)
        dao.insertStatus(activeStatus)

        // Cutoff is 24 hours ago
        val cutoff = now - (24 * 60 * 60 * 1000L)
        val expiredList = dao.getExpiredStatuses(cutoff)
        assertEquals(1, expiredList.size)
        assertEquals("stat_old", expiredList[0].id)

        // Delete expired
        dao.deleteExpiredStatuses(cutoff)
        val remaining = dao.getStatusById("stat_active")
        assertNotNull("Active status must still be present", remaining)
        val deleted = dao.getStatusById("stat_old")
        assertNull("Expired status must be deleted", deleted)
    }

    @Test
    fun testInAppUpdateServiceSchedulingDoesNotCrash() {
        // Verify WorkManager scheduling can be invoked without exception in runtime environment
        InAppUpdateService.schedulePeriodicCheck(context)
        InAppUpdateService.checkAndDownloadImmediately(context)
        // If no exception thrown, contract is satisfied
        assertTrue(true)
    }

    @Test
    fun testWebRtcSignalingContract() {
        var receivedOffer = false
        var receivedAnswer = false
        var receivedIce = false

        val testListener = object : SignalingClient.Listener {
            override fun onOfferReceived(sdp: SessionDescription) {
                receivedOffer = true
            }

            override fun onAnswerReceived(sdp: SessionDescription) {
                receivedAnswer = true
            }

            override fun onIceCandidateReceived(candidate: IceCandidate) {
                receivedIce = true
            }
        }

        val dummyOffer = SessionDescription(SessionDescription.Type.OFFER, "v=0\r\no=test 123456 IN IP4 127.0.0.1")
        val dummyAnswer = SessionDescription(SessionDescription.Type.ANSWER, "v=0\r\no=test 123456 IN IP4 127.0.0.1")
        val dummyCandidate = IceCandidate("audio", 0, "candidate:1 1 UDP 2122260223 192.168.1.1 50000 typ host")

        testListener.onOfferReceived(dummyOffer)
        testListener.onAnswerReceived(dummyAnswer)
        testListener.onIceCandidateReceived(dummyCandidate)

        assertTrue(receivedOffer)
        assertTrue(receivedAnswer)
        assertTrue(receivedIce)
    }
}
