package com.example.data.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class UserDto(
    val id: String,
    val phoneNumber: String,
    val name: String?,
    val avatarUrl: String?,
    val about: String?,
    val lastSeen: String,
    val isVerified: Boolean = false,
    val verifiedAt: String? = null
)

@JsonClass(generateAdapter = true)
data class ChatDto(
    val id: String,
    val isGroup: Boolean,
    val name: String?,
    val avatarUrl: String?,
    val members: List<ChatMemberDto>,
    val messages: List<MessageDto>,
    val isMuted: Boolean = false,
    val wallpaper: String? = null,
    val isOfficial: Boolean = false,
    val isVerified: Boolean = false,
    val allowComments: Boolean = true
)

@JsonClass(generateAdapter = true)
data class ChatMemberDto(
    val id: String,
    val userId: String,
    val user: UserDto
)

@JsonClass(generateAdapter = true)
data class MessageDto(
    val id: String,
    val content: String,
    val type: String,
    val status: String,
    val mediaUrl: String?,
    val duration: Int?,
    val senderId: String,
    val receiverId: String?,
    val chatId: String,
    val createdAt: String,
    val sender: UserDto?,
    val isStarred: Boolean = false,
    val isPinned: Boolean = false
)

@JsonClass(generateAdapter = true)
data class GoogleAuthRequest(
    val idToken: String? = null,
    val email: String? = null,
    val name: String? = null,
    val avatarUrl: String? = null,
    val phoneNumber: String? = null
)

@JsonClass(generateAdapter = true)
data class PhoneAuthRequest(
    val phoneNumber: String,
    val name: String? = null,
    val about: String? = null,
    val avatarUrl: String? = null,
    val firebaseIdToken: String? = null
)

@JsonClass(generateAdapter = true)
data class SyncContactsRequest(
    val phoneNumbers: List<String>
)

@JsonClass(generateAdapter = true)
data class RequestPhoneChangeRequest(
    val currentPhone: String,
    val newPhone: String
)

@JsonClass(generateAdapter = true)
data class RequestPhoneChangeResponse(
    val success: Boolean,
    val requestId: String,
    val newPhone: String,
    val message: String,
    val verificationCode: String? = null,
    val expiresInSeconds: Long = 600
)

@JsonClass(generateAdapter = true)
data class VerifyPhoneChangeRequest(
    val requestId: String,
    val verificationCode: String
)

@JsonClass(generateAdapter = true)
data class VerifyPhoneChangeResponse(
    val success: Boolean,
    val user: UserDto,
    val token: String,
    val message: String
)

@JsonClass(generateAdapter = true)
data class LoginResponse(
    val user: UserDto,
    val token: String,
    val isNewUser: Boolean? = null,
    val requiresProfileSetup: Boolean? = null
)

@JsonClass(generateAdapter = true)
data class UploadUrlResponse(
    val uploadUrl: String,
    val fileKey: String,
    val publicUrl: String
)

@JsonClass(generateAdapter = true)
data class PrivateChatRequest(
    val targetUserId: String
)

@JsonClass(generateAdapter = true)
data class CommunityDto(
    val id: String,
    val name: String,
    val description: String?,
    val avatarUrl: String?,
    val ownerId: String? = null,
    val membersCount: Int,
    val createdAt: String,
    val isOfficial: Boolean = false,
    val allowComments: Boolean = true,
    val allowReactions: Boolean = true
)

@JsonClass(generateAdapter = true)
data class CreateCommunityRequest(
    val name: String,
    val description: String? = null,
    val avatarUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class StatusDto(
    val id: String,
    val userId: String,
    val content: String?,
    val type: String, // "TEXT" or "IMAGE"
    val mediaUrl: String?,
    val backgroundColor: String?,
    val textStyle: String?,
    val createdAt: String,
    val user: UserDto?,
    val viewers: List<StatusViewerDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class StatusViewerDto(
    val id: String,
    val userId: String,
    val statusId: String,
    val viewedAt: String,
    val user: UserDto?
)

@JsonClass(generateAdapter = true)
data class CreateStatusRequest(
    val content: String? = null,
    val type: String,
    val mediaUrl: String? = null,
    val backgroundColor: String? = null,
    val textStyle: String? = null
)

@JsonClass(generateAdapter = true)
data class CallDto(
    val id: String,
    val callerId: String,
    val receiverId: String,
    val type: String, // "VOICE", "VIDEO"
    val status: String, // "MISSED", "COMPLETED", "REJECTED"
    val duration: Int?,
    val createdAt: String,
    val caller: UserDto?,
    val receiver: UserDto?
)

@JsonClass(generateAdapter = true)
data class CreateCallRequest(
    val receiverId: String,
    val type: String,
    val status: String,
    val duration: Int? = null
)

@JsonClass(generateAdapter = true)
data class StatusPrivacyRequest(
    val mode: String, // "MY_CONTACTS", "EXCEPT", "ONLY_SHARE"
    val excludedUserIds: List<String> = emptyList(),
    val includedUserIds: List<String> = emptyList()
)

@JsonClass(generateAdapter = true)
data class UserSettingsDto(
    val statusPrivacyMode: String,
    val lastSeenPrivacy: String, // "EVERYONE", "MY_CONTACTS", "NOBODY"
    val profilePhotoPrivacy: String,
    val aboutPrivacy: String,
    val readReceipts: Boolean,
    val notificationsEnabled: Boolean,
    val hdMedia: Boolean = true,
    val biometricLock: Boolean = false
)

@JsonClass(generateAdapter = true)
data class ProcessBadgePaymentRequest(
    val paymentProvider: String = "IN_APP_PAYMENT",
    val transactionId: String? = null,
    val rawReceipt: String? = null
)

@JsonClass(generateAdapter = true)
data class BadgePaymentDto(
    val id: String,
    val userId: String,
    val amount: Double,
    val currency: String,
    val status: String,
    val paymentProvider: String,
    val transactionId: String,
    val rawReceipt: String?,
    val createdAt: String
)

@JsonClass(generateAdapter = true)
data class BadgePaymentResponse(
    val success: Boolean,
    val message: String,
    val payment: BadgePaymentDto?,
    val user: UserDto?
)

@JsonClass(generateAdapter = true)
data class BadgeStatusResponse(
    val isVerified: Boolean,
    val verifiedAt: String?,
    val badgeType: String = "Green Verification Badge",
    val badgePrice: Double = 3.0,
    val price: String = "$3.00 USD",
    val payments: List<BadgePaymentDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class SystemStatusResponse(
    val status: String = "online",
    val maintenanceMode: Boolean = false,
    val allowNewRegistrations: Boolean = true,
    val badgePrice: Double = 3.0,
    val phoneAuthAllowedCountries: String? = null
)

@JsonClass(generateAdapter = true)
data class PaymentProviderDto(
    val id: String,
    val name: String
)

@JsonClass(generateAdapter = true)
data class CreatePaymentRequest(
    val provider: String,
    val amount: Double,
    val currency: String = "USD",
    val metadata: Map<String, String>? = null
)

@JsonClass(generateAdapter = true)
data class CreatePaymentResponse(
    val success: Boolean,
    val transactionId: String,
    val providerRef: String,
    val message: String
)

@JsonClass(generateAdapter = true)
data class ReportUserRequest(
    val reportedUserId: String,
    val reason: String
)

@JsonClass(generateAdapter = true)
data class UpdateChatRequest(
    val isMuted: Boolean? = null,
    val wallpaper: String? = null
)

@JsonClass(generateAdapter = true)
data class CreateGroupRequest(
    val name: String,
    val memberIds: List<String>,
    val avatarUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class UpdateMessageRequest(
    val isStarred: Boolean? = null,
    val isPinned: Boolean? = null
)

@JsonClass(generateAdapter = true)
data class ReportUserResponse(
    val success: Boolean,
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class AppUpdateDto(
    val id: String? = null,
    val versionCode: Int = 1,
    val versionName: String = "1.0",
    val releaseNotes: String = "Bug fixes and performance improvements.",
    val downloadUrl: String = "",
    val isCritical: Boolean = false,
    val createdAt: String? = null
)

@JsonClass(generateAdapter = true)
data class PublicAppConfigDto(
    val appName: String? = "VIBEZ",
    val appVersion: String? = "1.0.0",
    val appDownloadUrl: String? = null,
    val inviteUrl: String? = "https://vibez.chat/join",
    val contactEmail: String? = "support@vibez.chat",
    val privacyPolicyUrl: String? = "https://vibez.chat/privacy",
    val termsOfServiceUrl: String? = "https://vibez.chat/terms",
    val helpCenterUrl: String? = "https://support.vibez.chat",
    val faqUrl: String? = "https://vibez.chat/faq"
)

