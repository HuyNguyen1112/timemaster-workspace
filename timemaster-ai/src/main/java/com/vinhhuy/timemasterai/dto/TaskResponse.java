package com.vinhhuy.timemasterai.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Mirror DTO of the Core TaskResponse.
 * Used for receiving pushed task data.
 */
public record TaskResponse(
    Long id,
    String title,
    String description,
    LocalDate targetDate,
    LocalTime startTime,
    Double estimatedDuration,
    String matrixType,
    String status,
    String categoryName,
    Long userId,
    Long categoryId,
    LocalDateTime createdAt
) {
}

