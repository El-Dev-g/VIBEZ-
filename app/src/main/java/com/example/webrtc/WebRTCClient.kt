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

    fun startLocalVideo(view: SurfaceViewRenderer? = null) {
        if (localVideoTrack == null) {
            try {
                val helper = SurfaceTextureHelper.create("CaptureThread", rootEglBase.eglBaseContext)
                surfaceTextureHelper = helper

                videoCapturer = createVideoCapturer(context)
                localVideoSource = peerConnectionFactory?.createVideoSource(false)
                videoCapturer?.initialize(helper, context, localVideoSource?.capturerObserver)
                try {
                    videoCapturer?.startCapture(1280, 720, 30)
                } catch (e: Exception) {
                    android.util.Log.w("WebRTCClient", "1280x720 capture failed, trying 640x480: ${e.message}")
                    try {
                        videoCapturer?.startCapture(640, 480, 30)
                    } catch (e2: Exception) {
                        android.util.Log.e("WebRTCClient", "Fallback capture also failed: ${e2.message}", e2)
                    }
                }

                localVideoTrack = peerConnectionFactory?.createVideoTrack("video_track", localVideoSource)
                localVideoTrack?.let { peerConnection?.addTrack(it, listOf("local_stream")) }
            } catch (e: Exception) {
                android.util.Log.e("WebRTCClient", "Error setting up local video: ${e.message}", e)
            }
        }

        if (localAudioTrack == null) {
            try {
                localAudioSource = peerConnectionFactory?.createAudioSource(MediaConstraints())
                localAudioTrack = peerConnectionFactory?.createAudioTrack("audio_track", localAudioSource)
                localAudioTrack?.let { peerConnection?.addTrack(it, listOf("local_stream")) }
            } catch (e: Exception) {
                android.util.Log.e("WebRTCClient", "Error setting up local audio: ${e.message}", e)
            }
        }

        if (view != null && localVideoTrack != null) {
            try {
                localVideoTrack?.addSink(view)
            } catch (e: Exception) {
                android.util.Log.e("WebRTCClient", "Error adding sink to local video track: ${e.message}", e)
            }
        }
    }

    fun getLocalVideoTrack(): VideoTrack? = localVideoTrack

    private fun createVideoCapturer(context: Context): VideoCapturer? {
        // Try Camera2 first if supported
        if (Camera2Enumerator.isSupported(context)) {
            try {
                val enumerator = Camera2Enumerator(context)
                val capturer = findCapturerInEnumerator(enumerator)
                if (capturer != null) {
                    android.util.Log.d("WebRTCClient", "Created Camera2 capturer successfully")
                    return capturer
                }
            } catch (e: Exception) {
                android.util.Log.w("WebRTCClient", "Camera2Enumerator failed: ${e.message}")
            }
        }

        // Fallback to Camera1 (crucial for emulators and older devices)
        try {
            val enumerator = Camera1Enumerator(true)
            val capturer = findCapturerInEnumerator(enumerator)
            if (capturer != null) {
                android.util.Log.d("WebRTCClient", "Created Camera1 capturer successfully")
                return capturer
            }
        } catch (e: Exception) {
            android.util.Log.w("WebRTCClient", "Camera1Enumerator failed: ${e.message}")
        }

        return null
    }

    private fun findCapturerInEnumerator(enumerator: CameraEnumerator): VideoCapturer? {
        val deviceNames = enumerator.deviceNames ?: return null
        if (deviceNames.isEmpty()) return null

        // 1. Try Front-Facing camera
        for (deviceName in deviceNames) {
            if (enumerator.isFrontFacing(deviceName)) {
                try {
                    val capturer = enumerator.createCapturer(deviceName, null)
                    if (capturer != null) return capturer
                } catch (e: Exception) {
                    android.util.Log.w("WebRTCClient", "Failed to create front capturer for $deviceName: ${e.message}")
                }
            }
        }

        // 2. Try Back-Facing camera
        for (deviceName in deviceNames) {
            if (!enumerator.isFrontFacing(deviceName)) {
                try {
                    val capturer = enumerator.createCapturer(deviceName, null)
                    if (capturer != null) return capturer
                } catch (e: Exception) {
                    android.util.Log.w("WebRTCClient", "Failed to create back capturer for $deviceName: ${e.message}")
                }
            }
        }

        // 3. Fallback to any available device name
        for (deviceName in deviceNames) {
            try {
                val capturer = enumerator.createCapturer(deviceName, null)
                if (capturer != null) return capturer
            } catch (e: Exception) {
                android.util.Log.w("WebRTCClient", "Failed to create capturer for $deviceName: ${e.message}")
            }
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
