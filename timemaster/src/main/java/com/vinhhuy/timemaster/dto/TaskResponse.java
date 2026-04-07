package com.vinhhuy.timemaster.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

public record TaskResponse(
        Long id,
        String title,
        LocalTime startTime,
        Double estimatedDuration,
        String matrixType,
        String status,
        String categoryName,
        LocalDateTime createdAt
) {}
