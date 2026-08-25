package com.example.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun VerifiedBadge(
    modifier: Modifier = Modifier,
    size: Dp = 18.dp,
    tint: Color = Color(0xFF10B981) // Emerald Green
) {
    Icon(
        imageVector = Icons.Filled.CheckCircle,
        contentDescription = "Verified Badge",
        tint = tint,
        modifier = modifier
            .size(size)
            .padding(start = 2.dp)
    )
}
