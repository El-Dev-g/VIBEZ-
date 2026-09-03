package com.example.ui.viewmodels

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import com.example.webrtc.SignalingClient
import com.example.webrtc.WebRTCClient
import com.example.data.network.SocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.webrtc.*

data class IncomingCallData(
    val callerId: String,
    val callerName: String,
    val sdp: SessionDescription,
    val isVideo: Boolean
)

class VideoCallViewModel(application: Application) : AndroidViewModel(application) {
    private val TAG = "VideoCallViewModel"

    private val _isCallPickedUp = MutableStateFlow(false)
    val isCallPickedUp = _isCallPickedUp.asStateFlow()

    private val _incomingCallOffer = MutableStateFlow<IncomingCallData?>(null)
    val incomingCallOffer = _incomingCallOffer.asStateFlow()

    private val _remoteTrack = MutableStateFlow<VideoTrack?>(null)
    val remoteTrack = _remoteTrack.asStateFlow()

    private var rtcClient: WebRTCClient? = null
    private var socketManager: SocketManager? = null
    var targetUserId: String? = null
        private set
    
    val eglContext: EglBase.Context? get() = rtcClient?.rootEglBase?.eglBaseContext
    
    fun setupSignaling(manager: SocketManager, targetId: String) {
        this.socketManager = manager
        this.targetUserId = targetId
        Log.d(TAG, "Signaling configured for target: $targetId")
    }

    val signalingClient = object : SignalingClient {
        override fun sendOffer(sdp: SessionDescription) {
            targetUserId?.let { 
                Log.d(TAG, "Emitting call_offer to $it")
                socketManager?.sendCallOffer(it, sdp.description) 
            }
        }

        override fun sendAnswer(sdp: SessionDescription) {
            targetUserId?.let { 
                Log.d(TAG, "Emitting call_answer to $it")
                socketManager?.sendCallAnswer(it, sdp.description) 
            }
        }

        override fun sendIceCandidate(candidate: IceCandidate) {
            targetUserId?.let { 
                socketManager?.sendIceCandidate(
                    it, 
                    candidate.sdpMid, 
                    candidate.sdpMLineIndex, 
                    candidate.sdp
                ) 
            }
        }
    }

    fun initWebRTC(observer: PeerConnection.Observer) {
        try {
            rtcClient?.close()
            rtcClient = WebRTCClient(getApplication(), observer)
            Log.d(TAG, "WebRTC initialized")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing WebRTC: ${e.message}", e)
        }
    }

    fun startLocalVideo(view: SurfaceViewRenderer) {
        try {
            rtcClient?.startLocalVideo(view)
        } catch (e: Exception) {
            Log.e(TAG, "Error starting local video: ${e.message}", e)
        }
    }

    fun createOffer(isVideo: Boolean = true) {
        Log.d(TAG, "Creating WebRTC Offer for target $targetUserId")
        rtcClient?.createOffer(object : SdpObserver {
            override fun onCreateSuccess(desc: SessionDescription?) {
                desc?.let { 
                    targetUserId?.let { target ->
                        socketManager?.sendCallOffer(target, it.description, isVideo)
                    }
                }
            }
            override fun onSetSuccess() {}
            override fun onCreateFailure(s: String?) {
                Log.e(TAG, "createOffer failed: $s")
            }
            override fun onSetFailure(s: String?) {
                Log.e(TAG, "setLocalDescription failed: $s")
            }
        })
    }

    fun onRemoteOfferReceived(sdp: SessionDescription) {
        Log.d(TAG, "Setting remote description from offer and creating answer")
        rtcClient?.setRemoteDescription(sdp, object : SdpObserver {
            override fun onSetSuccess() {
                rtcClient?.createAnswer(object : SdpObserver {
                    override fun onCreateSuccess(desc: SessionDescription?) {
                        desc?.let { signalingClient.sendAnswer(it) }
                    }
                    override fun onSetSuccess() {}
                    override fun onCreateFailure(s: String?) {
                        Log.e(TAG, "createAnswer failed: $s")
                    }
                    override fun onSetFailure(s: String?) {
                        Log.e(TAG, "setLocalDescription for answer failed: $s")
                    }
                })
            }
            override fun onCreateFailure(s: String?) {
                Log.e(TAG, "setRemoteDescription failed: $s")
            }
            override fun onSetFailure(s: String?) {
                Log.e(TAG, "setRemoteDescription failure: $s")
            }
            override fun onCreateSuccess(desc: SessionDescription?) {}
        })
    }

    fun onRemoteAnswerReceived(sdp: SessionDescription) {
        Log.d(TAG, "Setting remote description from answer")
        rtcClient?.setRemoteDescription(sdp, object : SdpObserver {
            override fun onSetSuccess() {
                _isCallPickedUp.value = true
            }
            override fun onCreateSuccess(desc: SessionDescription?) {}
            override fun onCreateFailure(s: String?) {
                Log.e(TAG, "setRemoteAnswer failed: $s")
            }
            override fun onSetFailure(s: String?) {
                Log.e(TAG, "setRemoteAnswer onSetFailure: $s")
            }
        })
    }

    fun onRemoteIceCandidateReceived(candidate: IceCandidate) {
        rtcClient?.addIceCandidate(candidate)
    }

    fun sendIceCandidate(candidate: IceCandidate) {
        signalingClient.sendIceCandidate(candidate)
    }

    fun switchCamera() {
        rtcClient?.switchCamera()
    }

    fun toggleVideo(enabled: Boolean) {
        rtcClient?.setVideoEnabled(enabled)
    }

    fun toggleAudio(enabled: Boolean) {
        rtcClient?.setAudioEnabled(enabled)
    }

    fun endCall() {
        targetUserId?.let { target ->
            socketManager?.endCall(target)
        }
        rtcClient?.close()
        _isCallPickedUp.value = false
        _remoteTrack.value = null
    }

    override fun onCleared() {
        super.onCleared()
        rtcClient?.close()
    }

    fun setRemoteTrack(track: VideoTrack) {
        _remoteTrack.value = track
    }

    fun setCallPickedUp(pickedUp: Boolean) {
        _isCallPickedUp.value = pickedUp
    }

    fun setIncomingCallOffer(data: IncomingCallData) {
        _incomingCallOffer.value = data
    }

    fun clearIncomingCall() {
        _incomingCallOffer.value = null
    }
}
