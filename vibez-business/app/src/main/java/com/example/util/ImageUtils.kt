package com.example.util

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import kotlin.math.max
import kotlin.math.roundToInt

object ImageUtils {

    /**
     * Resolves any avatarUrl or mediaUrl string into a model supported by Coil's AsyncImage:
     * - "data:image/...;base64,..." -> ByteArray
     * - "/data/..." local path -> File (if exists)
     * - "http://", "https://", "content://", "file://" -> String (if valid)
     */
    fun resolveImageModel(urlOrPath: String?): Any? {
        val raw = urlOrPath?.trim() ?: return null
        if (raw.isEmpty() || raw.startsWith("undefined/") || raw.startsWith("null/")) {
            return null
        }

        if (raw.startsWith("data:image", ignoreCase = true)) {
            val commaIndex = raw.indexOf(',')
            if (commaIndex != -1 && commaIndex + 1 < raw.length) {
                val base64Part = raw.substring(commaIndex + 1)
                return try {
                    Base64.decode(base64Part, Base64.DEFAULT)
                } catch (e: Exception) {
                    null
                }
            }
            return null
        }

        if (raw.startsWith("/")) {
            val file = File(raw)
            return if (file.exists()) file else null
        }

        return raw
    }

    /**
     * Compresses image bytes/URI on client-side to optimal dimensions (maxDimension)
     * and JPEG quality, returning compressed ByteArray for network upload.
     */
    fun compressImageBytes(
        contentResolver: ContentResolver,
        uriOrPath: String,
        maxDimension: Int = 1080,
        quality: Int = 80
    ): ByteArray? {
        if (uriOrPath.isBlank()) return null
        return try {
            val inputStream: InputStream? = when {
                uriOrPath.startsWith("/") -> {
                    val file = File(uriOrPath)
                    if (file.exists()) FileInputStream(file) else null
                }
                else -> {
                    contentResolver.openInputStream(Uri.parse(uriOrPath))
                }
            }

            val bytes = inputStream?.use { it.readBytes() } ?: return null
            if (bytes.isEmpty()) return null

            val originalBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return null
            val width = originalBitmap.width
            val height = originalBitmap.height
            val maxSide = max(width, height)

            val scaledBitmap = if (maxSide > maxDimension && maxSide > 0) {
                val ratio = maxDimension.toFloat() / maxSide.toFloat()
                val targetWidth = (width * ratio).roundToInt().coerceAtLeast(1)
                val targetHeight = (height * ratio).roundToInt().coerceAtLeast(1)
                Bitmap.createScaledBitmap(originalBitmap, targetWidth, targetHeight, true)
            } else {
                originalBitmap
            }

            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            outputStream.toByteArray()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Converts a local content:// URI, file:// URI, or absolute file path into a compact,
     * compressed JPEG Base64 data URI ("data:image/jpeg;base64,...") so it can be stored
     * and synced across devices even when external object storage is unavailable.
     */
    fun encodeToDataUri(
        contentResolver: ContentResolver,
        uriOrPath: String,
        maxDimension: Int = 960,
        quality: Int = 80
    ): String? {
        if (uriOrPath.isBlank()) return null
        if (uriOrPath.startsWith("data:image", ignoreCase = true) ||
            uriOrPath.startsWith("http://", ignoreCase = true) ||
            uriOrPath.startsWith("https://", ignoreCase = true)
        ) {
            return uriOrPath
        }

        val compressedBytes = compressImageBytes(contentResolver, uriOrPath, maxDimension, quality) ?: return uriOrPath
        val base64String = Base64.encodeToString(compressedBytes, Base64.NO_WRAP)
        return "data:image/jpeg;base64,$base64String"
    }
}
