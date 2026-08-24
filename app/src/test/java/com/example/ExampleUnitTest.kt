package com.example

import com.example.util.PhoneNumberValidator
import com.example.util.ValidationResult
import org.junit.Assert.*
import org.junit.Test

class ExampleUnitTest {
  @Test
  fun addition_isCorrect() {
    assertEquals(4, 2 + 2)
  }

  @Test
  fun testPhoneNumberValidator_validUSNumber() {
    val usCountry = PhoneNumberValidator.COUNTRIES.first { it.code == "US" }
    val result = PhoneNumberValidator.validate(usCountry, "4155550198")
    assertTrue(result is ValidationResult.Valid)
    val valid = result as ValidationResult.Valid
    assertTrue(valid.formattedE164.startsWith("+1"))
    assertEquals("+14155550198", valid.formattedE164)
  }

  @Test
  fun testPhoneNumberValidator_tooShortNumber() {
    val usCountry = PhoneNumberValidator.COUNTRIES.first { it.code == "US" }
    val result = PhoneNumberValidator.validate(usCountry, "123")
    assertTrue(result is ValidationResult.Invalid)
  }

  @Test
  fun testPhoneNumberValidator_cleanDigits() {
    val cleaned = PhoneNumberValidator.cleanDigits("+1 (555) 019-8123")
    assertEquals("15550198123", cleaned)
  }
}

