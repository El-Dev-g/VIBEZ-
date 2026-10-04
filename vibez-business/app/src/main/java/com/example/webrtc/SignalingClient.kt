package com.example.webrtc

import org.webrtc.IceCandidate
import org.webrtc.SessionDescription

interface SignalingClient {
    fun sendOffer(sdp: SessionDescription)
    fun sendAnswer(sdp: SessionDescription)
    fun sendIceCandidate(candidate: IceCandidate)
    
    interface Listener {
        fun onOfferReceived(sdp: SessionDescription)
        fun onAnswerReceived(sdp: SessionDescription)
        fun onIceCandidateReceived(candidate: IceCandidate)
    }
}
