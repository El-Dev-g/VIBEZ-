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
    val verifiedAt: String? = null,
    val accountType: String? = "CONSUMER"
)

@JsonClass(generateAdapter = true)
data class ChatDto(
    val id: String,
    val isGroup: Boolean,
    val name: String?,
    val avatarUrl: String?,
    val members: List<ChatMemberDto> = emptyList(),
    val messages: List<MessageDto> = emptyList(),
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
    val user: UserDto? = null,
    val viewers: List<StatusViewerDto> = emptyList(),
    val views: List<StatusViewerDto> = emptyList()
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
    val name: String? = null,
    val avatarUrl: String? = null,
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

@JsonClass(generateAdapter = true)
data class AiChatHistoryItem(
    val sender: String,
    val text: String
)

@JsonClass(generateAdapter = true)
data class AiChatRequest(
    val prompt: String,
    val chatHistory: List<AiChatHistoryItem> = emptyList(),
    val chatId: String = "vibez_ai_chat"
)

@JsonClass(generateAdapter = true)
data class AiChatResponse(
    val success: Boolean = true,
    val reply: String = "",
    val error: String? = null
)

@JsonClass(generateAdapter = true)
data class AiTranscribeRequest(
    val audioBase64: String,
    val mimeType: String = "audio/mp4"
)

@JsonClass(generateAdapter = true)
data class AiTranscribeResponse(
    val success: Boolean = true,
    val transcript: String = "",
    val error: String? = null
)

// ==============================
// VIBEZ BUSINESS DTOs
// ==============================

@JsonClass(generateAdapter = true)
data class BusinessProfileDto(
    val id: String = "",
    val userId: String = "",
    val businessName: String = "",
    val category: String = "Shopping & Retail",
    val description: String? = null,
    val coverImageUrl: String? = null,
    val address: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val businessHours: String? = null,
    val website: String? = null,
    val email: String? = null,
    val isVerified: Boolean = false,
    val catalogItems: List<CatalogItemDto> = emptyList(),
    val user: UserDto? = null
)

@JsonClass(generateAdapter = true)
data class UpdateBusinessProfileRequest(
    val businessName: String,
    val category: String,
    val description: String? = null,
    val coverImageUrl: String? = null,
    val address: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val businessHours: String? = null,
    val website: String? = null,
    val email: String? = null
)

@JsonClass(generateAdapter = true)
data class MigrateAccountRequest(
    val targetType: String = "BUSINESS",
    val businessName: String? = null,
    val category: String? = null,
    val description: String? = null,
    val coverImageUrl: String? = null,
    val address: String? = null,
    val businessHours: String? = null,
    val website: String? = null,
    val email: String? = null
)

@JsonClass(generateAdapter = true)
data class MigrateAccountResponse(
    val success: Boolean = true,
    val accountType: String = "BUSINESS",
    val profile: BusinessProfileDto? = null,
    val user: UserDto? = null
)

@JsonClass(generateAdapter = true)
data class CatalogItemDto(
    val id: String = "",
    val businessId: String = "",
    val title: String = "",
    val description: String? = null,
    val price: Double = 0.0,
    val currency: String = "USD",
    val imageUrl: String? = null,
    val link: String? = null,
    val isAvailable: Boolean = true
)

@JsonClass(generateAdapter = true)
data class AddCatalogItemRequest(
    val title: String,
    val description: String? = null,
    val price: Double = 0.0,
    val currency: String = "USD",
    val imageUrl: String? = null,
    val link: String? = null
)

@JsonClass(generateAdapter = true)
data class QuickReplyDto(
    val id: String = "",
    val userId: String = "",
    val shortcut: String = "",
    val message: String = ""
)

@JsonClass(generateAdapter = true)
data class AddQuickReplyRequest(
    val shortcut: String,
    val message: String
)

@JsonClass(generateAdapter = true)
data class AutomatedMessageDto(
    val id: String = "",
    val userId: String = "",
    val type: String = "GREETING",
    val content: String = "",
    val isEnabled: Boolean = true,
    val schedule: String? = "ALWAYS"
)

@JsonClass(generateAdapter = true)
data class UpdateAutomatedMessageRequest(
    val type: String,
    val content: String,
    val isEnabled: Boolean = true,
    val schedule: String? = "ALWAYS"
)

@JsonClass(generateAdapter = true)
data class ChatLabelDto(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val colorHex: String = "#25D366",
    val chatIds: List<String> = emptyList()
)

@JsonClass(generateAdapter = true)
data class AddChatLabelRequest(
    val name: String,
    val colorHex: String = "#25D366"
)

@JsonClass(generateAdapter = true)
data class ToggleChatLabelRequest(
    val labelId: String,
    val chatId: String
)



