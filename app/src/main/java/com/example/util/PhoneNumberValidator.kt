package com.example.util

data class CountryValidationRule(
    val name: String,
    val dialCode: String,
    val code: String,
    val flag: String,
    val minDigits: Int,
    val maxDigits: Int,
    val exampleFormat: String,
    val helperText: String,
    val pattern: Regex? = null
)

sealed class ValidationResult {
    data class Valid(
        val formattedE164: String,
        val formattedDisplay: String,
        val cleanDigits: String
    ) : ValidationResult()

    data class Invalid(
        val errorMessage: String,
        val cleanDigits: String,
        val requiredDigits: Int
    ) : ValidationResult()
}

object PhoneNumberValidator {

    val COUNTRIES: List<CountryValidationRule> = listOf(
        CountryValidationRule(
            name = "United States",
            dialCode = "+1",
            code = "US",
            flag = "🇺🇸",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "(555) 019-8321",
            helperText = "10 digits (Area code + 7 digits)",
            pattern = Regex("^[2-9]\\d{2}[2-9]\\d{6}$")
        ),
        CountryValidationRule(
            name = "United Kingdom",
            dialCode = "+44",
            code = "GB",
            flag = "🇬🇧",
            minDigits = 10,
            maxDigits = 11,
            exampleFormat = "7911 123456",
            helperText = "10 to 11 digits starting with 7",
            pattern = Regex("^7\\d{9,10}$")
        ),
        CountryValidationRule(
            name = "India",
            dialCode = "+91",
            code = "IN",
            flag = "🇮🇳",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "98765 43210",
            helperText = "10 digits starting with 6, 7, 8, or 9",
            pattern = Regex("^[6-9]\\d{9}$")
        ),
        CountryValidationRule(
            name = "Canada",
            dialCode = "+1",
            code = "CA",
            flag = "🇨🇦",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "(416) 555-0198",
            helperText = "10 digits (Area code + 7 digits)",
            pattern = Regex("^[2-9]\\d{2}[2-9]\\d{6}$")
        ),
        CountryValidationRule(
            name = "Germany",
            dialCode = "+49",
            code = "DE",
            flag = "🇩🇪",
            minDigits = 10,
            maxDigits = 11,
            exampleFormat = "151 23456789",
            helperText = "10 to 11 digits without leading zero",
            pattern = Regex("^[1-9]\\d{9,10}$")
        ),
        CountryValidationRule(
            name = "France",
            dialCode = "+33",
            code = "FR",
            flag = "🇫🇷",
            minDigits = 9,
            maxDigits = 9,
            exampleFormat = "6 12 34 56 78",
            helperText = "9 digits (starts with 6 or 7 for mobile)",
            pattern = Regex("^[67]\\d{8}$")
        ),
        CountryValidationRule(
            name = "Brazil",
            dialCode = "+55",
            code = "BR",
            flag = "🇧🇷",
            minDigits = 10,
            maxDigits = 11,
            exampleFormat = "11 98765-4321",
            helperText = "10 to 11 digits (DDD + number)",
            pattern = Regex("^[1-9]{2}9?\\d{8}$")
        ),
        CountryValidationRule(
            name = "Japan",
            dialCode = "+81",
            code = "JP",
            flag = "🇯🇵",
            minDigits = 10,
            maxDigits = 11,
            exampleFormat = "90 1234 5678",
            helperText = "10 to 11 digits (mobile starts with 70, 80, 90)",
            pattern = Regex("^[789]0\\d{8}$")
        ),
        CountryValidationRule(
            name = "Nigeria",
            dialCode = "+234",
            code = "NG",
            flag = "🇳🇬",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "803 123 4567",
            helperText = "10 digits without leading zero",
            pattern = Regex("^[789][01]\\d{8}$")
        ),
        CountryValidationRule(
            name = "Australia",
            dialCode = "+61",
            code = "AU",
            flag = "🇦🇺",
            minDigits = 9,
            maxDigits = 9,
            exampleFormat = "412 345 678",
            helperText = "9 digits (starts with 4 for mobile)",
            pattern = Regex("^4\\d{8}$")
        ),
        CountryValidationRule(
            name = "Indonesia",
            dialCode = "+62",
            code = "ID",
            flag = "🇮🇩",
            minDigits = 9,
            maxDigits = 12,
            exampleFormat = "812 3456 7890",
            helperText = "9 to 12 digits (mobile starts with 8)",
            pattern = Regex("^8\\d{8,11}$")
        ),
        CountryValidationRule(
            name = "Mexico",
            dialCode = "+52",
            code = "MX",
            flag = "🇲🇽",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "55 1234 5678",
            helperText = "10 digits (2-3 digit area code + number)",
            pattern = Regex("^[1-9]\\d{9}$")
        ),
        CountryValidationRule(
            name = "Spain",
            dialCode = "+34",
            code = "ES",
            flag = "🇪🇸",
            minDigits = 9,
            maxDigits = 9,
            exampleFormat = "612 345 678",
            helperText = "9 digits (mobile starts with 6 or 7)",
            pattern = Regex("^[67]\\d{8}$")
        ),
        CountryValidationRule(
            name = "Italy",
            dialCode = "+39",
            code = "IT",
            flag = "🇮🇹",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "340 1234567",
            helperText = "10 digits (mobile starts with 3)",
            pattern = Regex("^3\\d{9}$")
        ),
        CountryValidationRule(
            name = "Saudi Arabia",
            dialCode = "+966",
            code = "SA",
            flag = "🇸🇦",
            minDigits = 9,
            maxDigits = 9,
            exampleFormat = "50 123 4567",
            helperText = "9 digits (mobile starts with 5)",
            pattern = Regex("^5\\d{8}$")
        ),
        CountryValidationRule(
            name = "United Arab Emirates",
            dialCode = "+971",
            code = "AE",
            flag = "🇦🇪",
            minDigits = 9,
            maxDigits = 9,
            exampleFormat = "50 123 4567",
            helperText = "9 digits (mobile starts with 5)",
            pattern = Regex("^5\\d{8}$")
        ),
        CountryValidationRule(
            name = "Pakistan",
            dialCode = "+92",
            code = "PK",
            flag = "🇵🇰",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "300 1234567",
            helperText = "10 digits (mobile starts with 3)",
            pattern = Regex("^3\\d{9}$")
        ),
        CountryValidationRule(
            name = "Bangladesh",
            dialCode = "+880",
            code = "BD",
            flag = "🇧🇩",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "1712 345678",
            helperText = "10 digits (starts with 1)",
            pattern = Regex("^1[3-9]\\d{8}$")
        ),
        CountryValidationRule(
            name = "Philippines",
            dialCode = "+63",
            code = "PH",
            flag = "🇵🇭",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "917 123 4567",
            helperText = "10 digits (mobile starts with 9)",
            pattern = Regex("^9\\d{9}$")
        ),
        CountryValidationRule(
            name = "Egypt",
            dialCode = "+20",
            code = "EG",
            flag = "🇪🇬",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "100 123 4567",
            helperText = "10 digits (mobile starts with 10, 11, 12, 15)",
            pattern = Regex("^1[0125]\\d{8}$")
        ),
        CountryValidationRule(
            name = "South Africa",
            dialCode = "+27",
            code = "ZA",
            flag = "🇿🇦",
            minDigits = 9,
            maxDigits = 9,
            exampleFormat = "71 234 5678",
            helperText = "9 digits without leading zero",
            pattern = Regex("^[678]\\d{8}$")
        ),
        CountryValidationRule(
            name = "South Korea",
            dialCode = "+82",
            code = "KR",
            flag = "🇰🇷",
            minDigits = 9,
            maxDigits = 10,
            exampleFormat = "10 1234 5678",
            helperText = "9 to 10 digits without leading zero",
            pattern = Regex("^1[0-9]\\d{7,8}$")
        ),
        CountryValidationRule(
            name = "Turkey",
            dialCode = "+90",
            code = "TR",
            flag = "🇹🇷",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "532 123 4567",
            helperText = "10 digits (starts with 5)",
            pattern = Regex("^5\\d{9}$")
        ),
        CountryValidationRule(
            name = "Russia",
            dialCode = "+7",
            code = "RU",
            flag = "🇷🇺",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "912 345-67-89",
            helperText = "10 digits (starts with 9 for mobile)",
            pattern = Regex("^9\\d{9}$")
        ),
        CountryValidationRule(
            name = "Argentina",
            dialCode = "+54",
            code = "AR",
            flag = "🇦🇷",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "9 11 1234-5678",
            helperText = "10 digits",
            pattern = Regex("^[1-9]\\d{9}$")
        ),
        CountryValidationRule(
            name = "Colombia",
            dialCode = "+57",
            code = "CO",
            flag = "🇨🇴",
            minDigits = 10,
            maxDigits = 10,
            exampleFormat = "300 123 4567",
            helperText = "10 digits (mobile starts with 3)",
            pattern = Regex("^3\\d{9}$")
        ),
        CountryValidationRule(
            name = "Kenya",
            dialCode = "+254",
            code = "KE",
            flag = "🇰🇪",
            minDigits = 9,
            maxDigits = 9,
            exampleFormat = "712 345678",
            helperText = "9 digits (starts with 7 or 1)",
            pattern = Regex("^[17]\\d{8}$")
        ),
        CountryValidationRule(
            name = "Ghana",
            dialCode = "+233",
            code = "GH",
            flag = "🇬🇭",
            minDigits = 9,
            maxDigits = 9,
            exampleFormat = "24 123 4567",
            helperText = "9 digits without leading zero",
            pattern = Regex("^[25]\\d{8}$")
        )
    )

    fun findCountryByDialCode(dialCode: String): CountryValidationRule {
        return COUNTRIES.find { it.dialCode == dialCode } ?: COUNTRIES[0]
    }

    fun cleanDigits(input: String): String {
        return input.filter { it.isDigit() }
    }

    fun validate(country: CountryValidationRule, rawInput: String): ValidationResult {
        var digits = cleanDigits(rawInput)
        
        // Strip leading 0 if user mistakenly entered domestic trunk prefix
        if (digits.startsWith("0") && digits.length > country.minDigits) {
            digits = digits.drop(1)
        }

        if (digits.isEmpty()) {
            return ValidationResult.Invalid(
                errorMessage = "Phone number is required",
                cleanDigits = digits,
                requiredDigits = country.minDigits
            )
        }

        if (digits.length < country.minDigits) {
            val remaining = country.minDigits - digits.length
            return ValidationResult.Invalid(
                errorMessage = "Too short: Enter $remaining more digit${if (remaining > 1) "s" else ""} for ${country.name}",
                cleanDigits = digits,
                requiredDigits = country.minDigits
            )
        }

        if (digits.length > country.maxDigits) {
            return ValidationResult.Invalid(
                errorMessage = "Too long: Expected maximum ${country.maxDigits} digits for ${country.name}",
                cleanDigits = digits,
                requiredDigits = country.maxDigits
            )
        }

        // Check pattern if defined
        if (country.pattern != null && !country.pattern.matches(digits)) {
            // Check common prefix error for US
            if (country.code == "US" || country.code == "CA") {
                if (digits.startsWith("0") || digits.startsWith("1")) {
                    return ValidationResult.Invalid(
                        errorMessage = "US/Canada area code cannot begin with 0 or 1",
                        cleanDigits = digits,
                        requiredDigits = country.minDigits
                    )
                }
            }
            return ValidationResult.Invalid(
                errorMessage = "Invalid format for ${country.name}. Format: ${country.exampleFormat}",
                cleanDigits = digits,
                requiredDigits = country.minDigits
            )
        }

        // Format to E.164 and Display format
        val e164 = "${country.dialCode}$digits"
        val display = formatDisplayNumber(country, digits)

        return ValidationResult.Valid(
            formattedE164 = e164,
            formattedDisplay = display,
            cleanDigits = digits
        )
    }

    fun formatDisplayNumber(country: CountryValidationRule, digits: String): String {
        return when (country.code) {
            "US", "CA" -> {
                when {
                    digits.length <= 3 -> digits
                    digits.length <= 6 -> "(${digits.take(3)}) ${digits.drop(3)}"
                    else -> "(${digits.take(3)}) ${digits.substring(3, 6)}-${digits.drop(6)}"
                }
            }
            "GB" -> {
                when {
                    digits.length <= 4 -> digits
                    digits.length <= 7 -> "${digits.take(4)} ${digits.drop(4)}"
                    else -> "${digits.take(4)} ${digits.substring(4, 7)} ${digits.drop(7)}"
                }
            }
            "IN" -> {
                if (digits.length <= 5) digits
                else "${digits.take(5)} ${digits.drop(5)}"
            }
            "BR" -> {
                if (digits.length <= 2) digits
                else if (digits.length <= 7) "${digits.take(2)} ${digits.drop(2)}"
                else "${digits.take(2)} ${digits.substring(2, 7)}-${digits.drop(7)}"
            }
            else -> {
                if (digits.length <= 3) digits
                else if (digits.length <= 6) "${digits.take(3)} ${digits.drop(3)}"
                else "${digits.take(3)} ${digits.substring(3, 6)} ${digits.drop(6)}"
            }
        }
    }
}
