package com.example.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.webrtc.SignalingClient
import com.example.webrtc.WebRTCClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.webrtc.*

class VideoCallViewModel(application: Application) : AndroidViewModel(application) {
    private val _isCallPickedUp = MutableStateFlow(false)
    val isCallPickedUp = _isCallPickedUp.asStateFlow()

    private val _incomingCallOffer = MutableStateFlow<Pair<String, SessionDescription>?>(null)
    val incomingCallOffer = _incomingCallOffer.asStateFlow()

    private val _remoteTrack = MutableStateFlow<VideoTrack?>(null)
    val remoteTrack = _remoteTrack.asStateFlow()

    private var rtcClient: WebRTCClient? = null
    
    val eglContext: EglBase.Context? get() = rtcClient?.rootEglBase?.eglBaseContext
    
    // Mock signaling client for demonstration
    private val signalingClient = object : SignalingClient {
        override fun sendOffer(sdp: SessionDescription) {
            // In a real app, send this to your backend via WebSocket/Retrofit
        }

        override fun sendAnswer(sdp: SessionDescription) {
            // In a real app, send this to your backend
        }

        override fun sendIceCandidate(candidate: IceCandidate) {
            // In a real app, send this to your backend
        }
    }

    fun initWebRTC(observer: PeerConnection.Observer) {
        rtcClient = WebRTCClient(getApplication(), observer)
    }

    fun startLocalVideo(view: SurfaceViewRenderer) {
        rtcClient?.startLocalVideo(view)
    }

    fun createOffer() {
        rtcClient?.createOffer(object : SdpObserver {
            override fun onCreateSuccess(desc: SessionDescription?) {
                desc?.let { signalingClient.sendOffer(it) }
            }
            override fun onSetSuccess() {}
            override fun onCreateFailure(s: String?) {}
            override fun onSetFailure(s: String?) {}
        })
    }

    fun onRemoteOfferReceived(sdp: SessionDescription) {
        rtcClient?.setRemoteDescription(sdp, object : SdpObserver {
            override fun onSetSuccess() {
                rtcClient?.createAnswer(object : SdpObserver {
                    override fun onCreateSuccess(desc: SessionDescription?) {
                        desc?.let { signalingClient.sendAnswer(it) }
                    }
                    override fun onSetSuccess() {}
                    override fun onCreateFailure(s: String?) {}
                    override fun onSetFailure(s: String?) {}
                })
            }
            override fun onCreateFailure(s: String?) {}
            override fun onSetFailure(s: String?) {}
            override fun onCreateSuccess(desc: SessionDescription?) {}
        })
    }

    fun onRemoteIceCandidateReceived(candidate: IceCandidate) {
        rtcClient?.addIceCandidate(candidate)
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
        rtcClient?.close()
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

    fun setIncomingCallOffer(callerName: String, offer: SessionDescription) {
        _incomingCallOffer.value = callerName to offer
    }

    fun clearIncomingCall() {
        _incomingCallOffer.value = null
    }
}
