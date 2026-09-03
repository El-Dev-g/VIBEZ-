package com.example.webrtc

import android.content.Context
import org.webrtc.*

class WebRTCClient(
    private val context: Context,
    private val observer: PeerConnection.Observer
) {
    val rootEglBase: EglBase = EglBase.create()
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var localVideoSource: VideoSource? = null
    private var localVideoTrack: VideoTrack? = null
    private var localAudioSource: AudioSource? = null
    private var localAudioTrack: AudioTrack? = null
    private var videoCapturer: VideoCapturer? = null
    private var surfaceTextureHelper: SurfaceTextureHelper? = null

    init {
        initPeerConnectionFactory(context)
        peerConnectionFactory = createPeerConnectionFactory()
        peerConnection = createPeerConnection(observer)
    }

    private fun initPeerConnectionFactory(context: Context) {
        val options = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .setFieldTrials("WebRTC-H264HighProfile/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(options)
    }

    private fun createPeerConnectionFactory(): PeerConnectionFactory {
        val videoEncoderFactory = DefaultVideoEncoderFactory(rootEglBase.eglBaseContext, true, true)
        val videoDecoderFactory = DefaultVideoDecoderFactory(rootEglBase.eglBaseContext)

        return PeerConnectionFactory.builder()
            .setVideoEncoderFactory(videoEncoderFactory)
            .setVideoDecoderFactory(videoDecoderFactory)
            .setOptions(PeerConnectionFactory.Options())
            .createPeerConnectionFactory()
    }

    private fun createPeerConnection(observer: PeerConnection.Observer): PeerConnection? {
        val iceServers = listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer()
        )
        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
        }
        return peerConnectionFactory?.createPeerConnection(rtcConfig, observer)
    }

    fun initVideoSurfaceView(view: SurfaceViewRenderer) {
        view.init(rootEglBase.eglBaseContext, null)
        view.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FILL)
        view.setEnableHardwareScaler(true)
    }

    fun startLocalVideo(view: SurfaceViewRenderer) {
        val helper = SurfaceTextureHelper.create("CaptureThread", rootEglBase.eglBaseContext)
        surfaceTextureHelper = helper

        videoCapturer = createVideoCapturer(context)
        localVideoSource = peerConnectionFactory?.createVideoSource(false)
        videoCapturer?.initialize(helper, context, localVideoSource?.capturerObserver)
        videoCapturer?.startCapture(1280, 720, 30)

        localVideoTrack = peerConnectionFactory?.createVideoTrack("video_track", localVideoSource)
        localVideoTrack?.addSink(view)

        localAudioSource = peerConnectionFactory?.createAudioSource(MediaConstraints())
        localAudioTrack = peerConnectionFactory?.createAudioTrack("audio_track", localAudioSource)

        // Use addTrack instead of addStream for Unified Plan
        localVideoTrack?.let { peerConnection?.addTrack(it, listOf("local_stream")) }
        localAudioTrack?.let { peerConnection?.addTrack(it, listOf("local_stream")) }
    }

    private fun createVideoCapturer(context: Context): VideoCapturer? {
        val enumerator = if (Camera2Enumerator.isSupported(context)) {
            Camera2Enumerator(context)
        } else {
            Camera1Enumerator(true)
        }
        val deviceNames = enumerator.deviceNames

        // 1. Try Front-Facing camera
        for (deviceName in deviceNames) {
            if (enumerator.isFrontFacing(deviceName)) {
                return enumerator.createCapturer(deviceName, null)
            }
        }

        // 2. Try Rear/Back-Facing camera (ensuring physical or real camera gets used if front is missing)
        for (deviceName in deviceNames) {
            if (!enumerator.isFrontFacing(deviceName)) {
                return enumerator.createCapturer(deviceName, null)
            }
        }

        // 3. Fallback to any camera name available
        if (deviceNames.isNotEmpty()) {
            return enumerator.createCapturer(deviceNames[0], null)
        }

        return null
    }

    fun startScreenShare(permissionIntent: android.content.Intent) {
        try {
            videoCapturer?.stopCapture()
            videoCapturer?.dispose()

            val screenCapturer = ScreenCapturerAndroid(permissionIntent, object : android.media.projection.MediaProjection.Callback() {
                override fun onStop() {
                    android.util.Log.d("WebRTCClient", "Screen capture stopped by system")
                }
            })

            videoCapturer = screenCapturer
            surfaceTextureHelper?.let { helper ->
                screenCapturer.initialize(helper, context, localVideoSource?.capturerObserver)
                screenCapturer.startCapture(1280, 720, 30)
            }
            android.util.Log.d("WebRTCClient", "Screen sharing started successfully")
        } catch (e: Exception) {
            android.util.Log.e("WebRTCClient", "Failed to start screen share: ${e.message}", e)
        }
    }

    fun stopScreenShare() {
        try {
            videoCapturer?.stopCapture()
            videoCapturer?.dispose()

            val cameraCapturer = createVideoCapturer(context)
            videoCapturer = cameraCapturer

            surfaceTextureHelper?.let { helper ->
                cameraCapturer?.initialize(helper, context, localVideoSource?.capturerObserver)
                cameraCapturer?.startCapture(1280, 720, 30)
            }
            android.util.Log.d("WebRTCClient", "Switched back to camera successfully")
        } catch (e: Exception) {
            android.util.Log.e("WebRTCClient", "Failed to stop screen share and restart camera: ${e.message}", e)
        }
    }

    fun createOffer(sdpObserver: SdpObserver) {
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
        }
        peerConnection?.createOffer(object : SdpObserver by sdpObserver {
            override fun onCreateSuccess(desc: SessionDescription?) {
                peerConnection?.setLocalDescription(sdpObserver, desc)
                sdpObserver.onCreateSuccess(desc)
            }
        }, constraints)
    }

    fun createAnswer(sdpObserver: SdpObserver) {
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
        }
        peerConnection?.createAnswer(object : SdpObserver by sdpObserver {
            override fun onCreateSuccess(desc: SessionDescription?) {
                peerConnection?.setLocalDescription(sdpObserver, desc)
                sdpObserver.onCreateSuccess(desc)
            }
        }, constraints)
    }

    fun setRemoteDescription(desc: SessionDescription, sdpObserver: SdpObserver) {
        peerConnection?.setRemoteDescription(sdpObserver, desc)
    }

    fun addIceCandidate(candidate: IceCandidate) {
        peerConnection?.addIceCandidate(candidate)
    }

    fun switchCamera() {
        (videoCapturer as? CameraVideoCapturer)?.switchCamera(null)
    }

    fun setVideoEnabled(enabled: Boolean) {
        localVideoTrack?.setEnabled(enabled)
    }

    fun setAudioEnabled(enabled: Boolean) {
        localAudioTrack?.setEnabled(enabled)
    }

    fun close() {
        peerConnection?.close()
        peerConnectionFactory?.dispose()
        videoCapturer?.stopCapture()
        videoCapturer?.dispose()
        rootEglBase.release()
    }
}
