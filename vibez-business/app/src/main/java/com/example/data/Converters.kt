package com.example.data

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class Converters {
    @TypeConverter
    fun fromStatusViewerList(value: List<StatusViewer>): String {
        return Gson().toJson(value)
    }

    @TypeConverter
    fun toStatusViewerList(value: String): List<StatusViewer> {
        val listType = object : TypeToken<List<StatusViewer>>() {}.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromStringList(value: List<String>): String {
        return Gson().toJson(value)
    }

    @TypeConverter
    fun toStringList(value: String): List<String> {
        val listType = object : TypeToken<List<String>>() {}.type
        return Gson().fromJson(value, listType)
    }
}
