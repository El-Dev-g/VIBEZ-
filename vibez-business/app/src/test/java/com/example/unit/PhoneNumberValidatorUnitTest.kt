package com.example.unit

import com.example.util.PhoneNumberValidator
import com.example.util.ValidationResult
import org.junit.Assert.*
import org.junit.Test

/**
 * 1. Unit Testing
 * Focus: Pure isolated logic, validation algorithms, formatting contracts, and boundary conditions.
 */
class PhoneNumberValidatorUnitTest {

    @Test
    fun testValidUSPhoneNumberFormatting() {
        val usCountry = PhoneNumberValidator.COUNTRIES.first { it.code == "US" }
        val result = PhoneNumberValidator.validate(usCountry, "4155550198")
        assertTrue("Expected valid result for US number", result is ValidationResult.Valid)
        val valid = result as ValidationResult.Valid
        assertEquals("+14155550198", valid.formattedE164)
        assertEquals("4155550198", valid.cleanDigits)
    }

    @Test
    fun testValidUKPhoneNumberFormatting() {
        val ukCountry = PhoneNumberValidator.COUNTRIES.first { it.code == "GB" }
        val result = PhoneNumberValidator.validate(ukCountry, "7911123456")
        assertTrue("Expected valid result for UK number", result is ValidationResult.Valid)
        val valid = result as ValidationResult.Valid
        assertEquals("+447911123456", valid.formattedE164)
    }

    @Test
    fun testValidIndiaPhoneNumberFormatting() {
        val inCountry = PhoneNumberValidator.COUNTRIES.first { it.code == "IN" }
        val result = PhoneNumberValidator.validate(inCountry, "9876543210")
        assertTrue("Expected valid result for India number", result is ValidationResult.Valid)
        val valid = result as ValidationResult.Valid
        assertEquals("+919876543210", valid.formattedE164)
    }

    @Test
    fun testInvalidTooShortPhoneNumber() {
        val usCountry = PhoneNumberValidator.COUNTRIES.first { it.code == "US" }
        val result = PhoneNumberValidator.validate(usCountry, "123")
        assertTrue("Too short number must be Invalid", result is ValidationResult.Invalid)
        val invalid = result as ValidationResult.Invalid
        assertTrue(invalid.errorMessage.isNotBlank())
    }

    @Test
    fun testInvalidTooLongPhoneNumber() {
        val usCountry = PhoneNumberValidator.COUNTRIES.first { it.code == "US" }
        val result = PhoneNumberValidator.validate(usCountry, "12345678901234567")
        assertTrue("Excessively long number must be Invalid", result is ValidationResult.Invalid)
    }

    @Test
    fun testCleanDigitsUtility() {
        assertEquals("15550198123", PhoneNumberValidator.cleanDigits("+1 (555) 019-8123"))
        assertEquals("447911123456", PhoneNumberValidator.cleanDigits("+44 7911 123 456"))
        assertEquals("12345", PhoneNumberValidator.cleanDigits("abc1-2-3--45xyz"))
        assertEquals("", PhoneNumberValidator.cleanDigits(""))
    }

    @Test
    fun testCountryListCompleteness() {
        val countries = PhoneNumberValidator.COUNTRIES
        assertTrue("Country list should contain multiple regions", countries.size >= 10)
        assertNotNull(countries.find { it.code == "US" })
        assertNotNull(countries.find { it.code == "GB" })
        assertNotNull(countries.find { it.code == "IN" })
        assertNotNull(countries.find { it.code == "KE" })
        assertNotNull(countries.find { it.code == "NG" })
    }
}
