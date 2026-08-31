package com.example.data.network

import retrofit2.http.*

interface ApiService {
    @POST("api/auth/google")
    suspend fun loginWithGoogle(@Body request: GoogleAuthRequest): LoginResponse

    @POST("api/auth/phone")
    suspend fun loginWithPhone(@Body request: PhoneAuthRequest): LoginResponse

    @GET("api/auth/profile")
    suspend fun getProfile(@Header("Authorization") token: String): UserDto

    @GET("api/chats")
    suspend fun getChats(@Header("Authorization") token: String): List<ChatDto>

    @GET("api/chats/{chatId}/messages")
    suspend fun getMessages(
        @Header("Authorization") token: String,
        @Path("chatId") chatId: String
    ): List<MessageDto>

    @POST("api/chats/private")
    suspend fun createOrGetPrivateChat(
        @Header("Authorization") token: String,
        @Body request: PrivateChatRequest
    ): ChatDto

    @POST("api/media/upload-url")
    suspend fun getUploadUrl(
        @Header("Authorization") token: String,
        @Body request: Map<String, String>
    ): UploadUrlResponse

    @GET("api/users/search")
    suspend fun searchUsers(
        @Header("Authorization") token: String,
        @Query("query") query: String
    ): List<UserDto>

    @POST("api/users/sync-contacts")
    suspend fun syncContacts(
        @Header("Authorization") token: String,
        @Body request: SyncContactsRequest
    ): List<UserDto>

    @PUT("api/users/profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body profile: Map<String, String>
    ): UserDto

    @POST("api/users/change-phone/request")
    suspend fun requestPhoneChange(
        @Header("Authorization") token: String,
        @Body request: RequestPhoneChangeRequest
    ): RequestPhoneChangeResponse

    @POST("api/users/change-phone/verify")
    suspend fun verifyPhoneChange(
        @Header("Authorization") token: String,
        @Body request: VerifyPhoneChangeRequest
    ): VerifyPhoneChangeResponse

    @GET("api/communities")
    suspend fun getCommunities(@Header("Authorization") token: String): List<CommunityDto>

    @POST("api/communities")
    suspend fun createCommunity(
        @Header("Authorization") token: String,
        @Body request: CreateCommunityRequest
    ): CommunityDto

    @GET("api/communities/{communityId}")
    suspend fun getCommunityDetails(
        @Header("Authorization") token: String,
        @Path("communityId") communityId: String
    ): CommunityDto

    @GET("api/communities/{communityId}/chats")
    suspend fun getCommunityChats(
        @Header("Authorization") token: String,
        @Path("communityId") communityId: String
    ): List<ChatDto>
    
    @GET("api/statuses")
    suspend fun getStatuses(@Header("Authorization") token: String): List<StatusDto>
    
    @POST("api/statuses")
    suspend fun createStatus(
        @Header("Authorization") token: String,
        @Body request: CreateStatusRequest
    ): StatusDto
    
    @DELETE("api/statuses/{statusId}")
    suspend fun deleteStatus(
        @Header("Authorization") token: String,
        @Path("statusId") statusId: String
    )
    
    @POST("api/statuses/{statusId}/view")
    suspend fun viewStatus(
        @Header("Authorization") token: String,
        @Path("statusId") statusId: String
    )

    @GET("api/calls")
    suspend fun getCallLogs(@Header("Authorization") token: String): List<CallDto>

    @POST("api/calls")
    suspend fun createCallLog(
        @Header("Authorization") token: String,
        @Body request: CreateCallRequest
    ): CallDto

    @DELETE("api/calls/{callId}")
    suspend fun deleteCallLog(
        @Header("Authorization") token: String,
        @Path("callId") callId: String
    )

    @DELETE("api/calls")
    suspend fun clearCallLogs(@Header("Authorization") token: String)

    @GET("api/statuses/privacy")
    suspend fun getStatusPrivacy(@Header("Authorization") token: String): StatusPrivacyRequest

    @PUT("api/statuses/privacy")
    suspend fun updateStatusPrivacy(
        @Header("Authorization") token: String,
        @Body request: StatusPrivacyRequest
    )

    @GET("api/users/settings")
    suspend fun getSettings(@Header("Authorization") token: String): UserSettingsDto

    @PUT("api/users/settings")
    suspend fun updateSettings(
        @Header("Authorization") token: String,
        @Body settings: UserSettingsDto
    ): UserSettingsDto

    @POST("api/payments/verification/process")
    suspend fun processVerificationPayment(
        @Header("Authorization") token: String,
        @Body request: ProcessBadgePaymentRequest
    ): BadgePaymentResponse

    @GET("api/payments/verification/status")
    suspend fun getBadgeStatus(
        @Header("Authorization") token: String
    ): BadgeStatusResponse

    @GET("api/system/status")
    suspend fun getSystemStatus(): SystemStatusResponse

    @GET("api/payments/providers")
    suspend fun getAvailablePaymentProviders(
        @Header("Authorization") token: String
    ): List<PaymentProviderDto>

    @POST("api/payments/create")
    suspend fun createPayment(
        @Header("Authorization") token: String,
        @Body request: CreatePaymentRequest
    ): CreatePaymentResponse

    @DELETE("api/communities/{communityId}")
    suspend fun deleteCommunity(
        @Header("Authorization") token: String,
        @Path("communityId") communityId: String
    )
    
    @POST("api/chats/group")
    suspend fun createGroupChat(
        @Header("Authorization") token: String,
        @Body request: CreateGroupRequest
    ): ChatDto

    @DELETE("api/chats/{chatId}")
    suspend fun deleteChat(
        @Header("Authorization") token: String,
        @Path("chatId") chatId: String
    )

    @PATCH("api/chats/{chatId}")
    suspend fun updateChat(
        @Header("Authorization") token: String,
        @Path("chatId") chatId: String,
        @Body request: UpdateChatRequest
    ): ChatDto

    @DELETE("api/chats/{chatId}/messages")
    suspend fun clearChatMessages(
        @Header("Authorization") token: String,
        @Path("chatId") chatId: String
    )

    @DELETE("api/messages/{messageId}")
    suspend fun deleteMessage(
        @Header("Authorization") token: String,
        @Path("messageId") messageId: String
    )

    @PATCH("api/messages/{messageId}")
    suspend fun updateMessage(
        @Header("Authorization") token: String,
        @Path("messageId") messageId: String,
        @Body request: UpdateMessageRequest
    ): MessageDto

    @POST("api/users/report")
    suspend fun reportUser(
        @Header("Authorization") token: String,
        @Body request: ReportUserRequest
    ): ReportUserResponse

    @GET("api/app/updates/latest")
    suspend fun getLatestUpdate(): AppUpdateDto
}
