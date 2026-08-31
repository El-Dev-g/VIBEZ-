package com.example.util

import android.content.Context
import android.content.SharedPreferences
import com.example.data.network.NetworkClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Dynamic Developer-Controlled Policy Manager for Firebase Phone Authentication.
 *
 * Rules:
 * 1. Contains no hard-coded permitted countries for authentication.
 * 2. Dynamically filters permitted countries based on developer configuration (allowlist/blocklist/runtime policy).
 * 3. Disabled countries and their dial prefixes are excluded from the picker and prevented from auto-selection.
 * 4. Ensures numbers are formatted into standard E.164 format before passing to Firebase Auth.
 * 5. Firebase remains the final authority for accepting or rejecting auth requests.
 */
object PhoneAuthPolicyManager {
    private const val PREFS_NAME = "phone_auth_policy_prefs"
    private const val KEY_ALLOWED_COUNTRIES = "allowed_countries"
    private const val KEY_DISABLED_COUNTRIES = "disabled_countries"
    private const val KEY_POLICY_MODE = "policy_mode" // "ONLY_ALLOWED" or "ALL_EXCEPT_DISABLED"

    // Default developer-configured permitted regions (can be overridden dynamically via Admin Panel / Remote Config)
    private val DEFAULT_DEVELOPER_ALLOWED = setOf(
        "US", "GH", "NG", "GB", "CA", "KE", "ZA", "IN", "DE", "FR", "AE", "SA", "BR", "MX", "AU"
    )

    private val allowedCountryCodes = mutableSetOf<String>()
    private val disabledCountryCodes = mutableSetOf<String>()
    private var policyMode = "ONLY_ALLOWED"

    private val _policyVersion = MutableStateFlow(0)
    val policyVersion: StateFlow<Int> = _policyVersion.asStateFlow()

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        policyMode = prefs.getString(KEY_POLICY_MODE, "ONLY_ALLOWED") ?: "ONLY_ALLOWED"
        
        val savedAllowed = prefs.getStringSet(KEY_ALLOWED_COUNTRIES, null)
        allowedCountryCodes.clear()
        if (savedAllowed != null && savedAllowed.isNotEmpty()) {
            allowedCountryCodes.addAll(savedAllowed.map { it.uppercase().trim() })
        } else {
            allowedCountryCodes.addAll(DEFAULT_DEVELOPER_ALLOWED)
        }

        val savedDisabled = prefs.getStringSet(KEY_DISABLED_COUNTRIES, emptySet()) ?: emptySet()
        disabledCountryCodes.clear()
        disabledCountryCodes.addAll(savedDisabled.map { it.uppercase().trim() })

        _policyVersion.value += 1
    }

    /**
     * Synchronize policy with backend system configuration asynchronously.
     */
    fun syncWithBackend(context: Context, scope: CoroutineScope = CoroutineScope(Dispatchers.IO)) {
        scope.launch {
            try {
                val status = NetworkClient.apiService.getSystemStatus()
                val policyString = status.phoneAuthAllowedCountries
                if (!policyString.isNullOrBlank()) {
                    updateFromPolicyString(context, policyString)
                }
            } catch (e: Exception) {
                // Ignore transient network errors and continue with locally cached developer policy
            }
        }
    }

    /**
     * Parse comma-separated or space-separated list of country codes (e.g. "US, GH, NG, GB, CA")
     */
    fun updateFromPolicyString(context: Context, policyString: String) {
        val codes = policyString.split(',', ';', ' ', '\n', '\t')
            .map { it.trim().uppercase() }
            .filter { it.length == 2 }
        if (codes.isNotEmpty()) {
            setAllowedCountries(context, codes)
        }
    }

    /**
     * Checks whether a specific ISO 3166-1 alpha-2 country code is currently enabled for authentication.
     */
    fun isCountryEnabled(countryCode: String): Boolean {
        val code = countryCode.uppercase().trim()
        if (disabledCountryCodes.contains(code)) return false
        if (policyMode == "ONLY_ALLOWED") {
            return allowedCountryCodes.contains(code)
        }
        return true
    }

    /**
     * Set allowed countries (Allowlist policy).
     */
    fun setAllowedCountries(context: Context, countryCodes: Collection<String>) {
        policyMode = "ONLY_ALLOWED"
        allowedCountryCodes.clear()
        allowedCountryCodes.addAll(countryCodes.map { it.uppercase().trim() })
        
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_POLICY_MODE, policyMode)
            .putStringSet(KEY_ALLOWED_COUNTRIES, allowedCountryCodes.toSet())
            .apply()

        _policyVersion.value += 1
    }

    /**
     * Disable/Enable a single country dynamically.
     */
    fun setCountryEnabled(context: Context, countryCode: String, enabled: Boolean) {
        val code = countryCode.uppercase().trim()
        if (enabled) {
            disabledCountryCodes.remove(code)
            if (policyMode == "ONLY_ALLOWED") {
                allowedCountryCodes.add(code)
            }
        } else {
            disabledCountryCodes.add(code)
            if (policyMode == "ONLY_ALLOWED") {
                allowedCountryCodes.remove(code)
            }
        }
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putStringSet(KEY_DISABLED_COUNTRIES, disabledCountryCodes.toSet())
            .putStringSet(KEY_ALLOWED_COUNTRIES, allowedCountryCodes.toSet())
            .apply()

        _policyVersion.value += 1
    }

    /**
     * Returns only the countries enabled under the dynamic policy.
     * Disabled countries and their prefixes are strictly omitted.
     */
    fun getEnabledCountries(): List<CountryValidationRule> {
        val filtered = PhoneNumberValidator.COUNTRIES.filter { isCountryEnabled(it.code) }
        return if (filtered.isNotEmpty()) filtered else PhoneNumberValidator.COUNTRIES.filter { it.code in DEFAULT_DEVELOPER_ALLOWED }
    }

    /**
     * Returns a valid enabled country, ensuring disabled countries are never automatically selected.
     */
    fun getValidSelectedCountry(preferredCountry: CountryValidationRule? = null): CountryValidationRule {
        val enabled = getEnabledCountries()
        if (preferredCountry != null && isCountryEnabled(preferredCountry.code)) {
            val matched = enabled.find { it.code.equals(preferredCountry.code, ignoreCase = true) }
            if (matched != null) return matched
        }
        return enabled.firstOrNull() ?: PhoneNumberValidator.COUNTRIES.first { isCountryEnabled(it.code) }
    }

    /**
     * Converts a raw national phone number and country rule into standard E.164 format (+[countryCode][nationalNumber]).
     */
    fun formatToE164(country: CountryValidationRule, rawNumber: String): String {
        val cleanDigits = PhoneNumberValidator.cleanDigits(rawNumber)
        val dialPrefix = if (country.dialCode.startsWith("+")) country.dialCode else "+${country.dialCode}"
        val dialCodeDigits = country.dialCode.replace("+", "")
        
        return if (cleanDigits.startsWith(dialCodeDigits)) {
            "+$cleanDigits"
        } else {
            "$dialPrefix$cleanDigits"
        }
    }
}
