import Foundation

/// Native Socket.IO v4 / Engine.IO v4 WebSocket client using URLSessionWebSocketTask.
/// Connects directly to `wss://vibez-n5h1.onrender.com/socket.io/?EIO=4&transport=websocket`
/// without requiring external C++ or CocoaPods dependencies.
final class SocketService: NSObject, URLSessionWebSocketDelegate {
    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession!
    private var pingTimer: Timer?
    private var isConnected = false
    private var currentUserId: String = ""
    private var currentToken: String = ""

    var onMessageReceived: ((MessageDto) -> Void)?
    var onTypingReceived: ((String, Bool) -> Void)?
    var onIncomingCall: ((String, String, String, Bool) -> Void)? // callerId, callerName, sdp, isVideo
    var onCallEnded: (() -> Void)?

    override init() {
        super.init()
        let config = URLSessionConfiguration.default
        self.session = URLSession(configuration: config, delegate: self, delegateQueue: .main)
    }

    func connect(userId: String, token: String) {
        disconnect()
        self.currentUserId = userId
        self.currentToken = token

        var components = URLComponents(string: "wss://vibez-n5h1.onrender.com/socket.io/")!
        components.queryItems = [
            URLQueryItem(name: "EIO", value: "4"),
            URLQueryItem(name: "transport", value: "websocket"),
            URLQueryItem(name: "userId", value: userId),
            URLQueryItem(name: "token", value: token)
        ]

        guard let url = components.url else { return }
        var request = URLRequest(url: url)
        if !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        webSocketTask = session.webSocketTask(with: request)
        webSocketTask?.resume()
        listenForFrames()
    }

    func disconnect() {
        isConnected = false
        pingTimer?.invalidate()
        pingTimer = nil
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
    }

    func joinChat(chatId: String) {
        emit(event: "join_chat", payload: chatId)
    }

    func sendMessage(
        id: String,
        chatId: String,
        senderId: String,
        receiverId: String?,
        content: String,
        type: String,
        mediaUrl: String?,
        duration: Int?
    ) {
        var dict: [String: Any] = [
            "id": id,
            "chatId": chatId,
            "senderId": senderId,
            "content": content,
            "type": type
        ]
        if let receiverId = receiverId, !receiverId.isEmpty { dict["receiverId"] = receiverId }
        if let mediaUrl = mediaUrl, !mediaUrl.isEmpty { dict["mediaUrl"] = mediaUrl }
        if let duration = duration, duration > 0 { dict["duration"] = duration }
        emit(event: "send_message", payload: dict)
    }

    func emitTyping(chatId: String, isTyping: Bool) {
        emit(event: "typing", payload: [
            "chatId": chatId,
            "userId": currentUserId,
            "isTyping": isTyping
        ])
    }

    func emitCallOffer(targetUserId: String, isVideo: Bool, sdp: String = "vibez-webrtc-sdp-offer") {
        emit(event: "call_offer", payload: [
            "targetUserId": targetUserId,
            "callerId": currentUserId,
            "sdp": sdp,
            "isVideo": isVideo
        ])
    }

    func emitCallAnswer(targetUserId: String, sdp: String = "vibez-webrtc-sdp-answer") {
        emit(event: "call_answer", payload: [
            "targetUserId": targetUserId,
            "sdp": sdp
        ])
    }

    func emitEndCall(targetUserId: String) {
        emit(event: "end_call", payload: [
            "targetUserId": targetUserId
        ])
    }

    // MARK: - Socket.IO v4 Frame Encoding / Decoding

    private func emit(event: String, payload: Any) {
        let array: [Any] = [event, payload]
        guard let data = try? JSONSerialization.data(withJSONObject: array),
              let jsonStr = String(data: data, encoding: .utf8) else { return }
        let frame = "42\(jsonStr)"
        webSocketTask?.send(.string(frame)) { _ in }
    }

    private func listenForFrames() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                if case .string(let text) = message {
                    self.handleFrame(text)
                }
                self.listenForFrames()
            case .failure:
                self.isConnected = false
            }
        }
    }

    private func handleFrame(_ text: String) {
        // Engine.IO Open packet ("0{...}") -> respond with Socket.IO Connect ("40{\"token\":...}")
        if text.hasPrefix("0") {
            let authPayload: [String: Any] = ["token": currentToken, "userId": currentUserId]
            if let data = try? JSONSerialization.data(withJSONObject: authPayload),
               let json = String(data: data, encoding: .utf8) {
                webSocketTask?.send(.string("40\(json)")) { _ in }
            } else {
                webSocketTask?.send(.string("40")) { _ in }
            }
            return
        }

        // Engine.IO Ping ("2") -> respond with Pong ("3")
        if text == "2" {
            webSocketTask?.send(.string("3")) { _ in }
            return
        }

        // Socket.IO Connected ("40...")
        if text.hasPrefix("40") {
            isConnected = true
            return
        }

        // Socket.IO Event ("42[\"event_name\", payload]")
        if text.hasPrefix("42") {
            let jsonPart = String(text.dropFirst(2))
            guard let data = jsonPart.data(using: .utf8),
                  let arr = try? JSONSerialization.jsonObject(with: data) as? [Any],
                  let eventName = arr.first as? String,
                  arr.count > 1 else { return }

            let payload = arr[1]
            handleEvent(name: eventName, payload: payload)
        }
    }

    private func handleEvent(name: String, payload: Any) {
        switch name {
        case "receive_message":
            if let dict = payload as? [String: Any],
               let data = try? JSONSerialization.data(withJSONObject: dict),
               let msg = try? JSONDecoder().decode(MessageDto.self, from: data) {
                DispatchQueue.main.async {
                    self.onMessageReceived?(msg)
                }
            }
        case "new_message_notification":
            if let wrapper = payload as? [String: Any],
               let msgDict = wrapper["message"] as? [String: Any],
               let data = try? JSONSerialization.data(withJSONObject: msgDict),
               let msg = try? JSONDecoder().decode(MessageDto.self, from: data) {
                DispatchQueue.main.async {
                    self.onMessageReceived?(msg)
                }
            }
        case "user_typing":
            if let dict = payload as? [String: Any],
               let chatId = dict["chatId"] as? String {
                let isTyping = (dict["isTyping"] as? Bool) ?? true
                DispatchQueue.main.async {
                    self.onTypingReceived?(chatId, isTyping)
                }
            }
        case "incoming_call":
            if let dict = payload as? [String: Any] {
                let callerId = (dict["callerId"] as? String) ?? ""
                let callerName = (dict["callerName"] as? String) ?? "Caller"
                let sdp = (dict["sdp"] as? String) ?? ""
                let isVideo = (dict["isVideo"] as? Bool) ?? false
                DispatchQueue.main.async {
                    self.onIncomingCall?(callerId, callerName, sdp, isVideo)
                }
            }
        case "call_ended", "call_rejected":
            DispatchQueue.main.async {
                self.onCallEnded?()
            }
        default:
            break
        }
    }
}
