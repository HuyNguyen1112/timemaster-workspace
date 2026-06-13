package com.vinhhuy.timemasterai.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
    Long id,
    String title,
    String description,
    LocalDate targetDate,
    Double estimatedDuration,
    Integer remainingDuration,
    String matrixType,
    String status,
    Long userId,
    Long contextId,
    LocalDateTime createdAt,
    Boolean isOverdue
) {
}
