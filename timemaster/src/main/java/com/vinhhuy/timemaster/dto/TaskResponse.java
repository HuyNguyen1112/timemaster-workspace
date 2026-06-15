package com.vinhhuy.timemaster.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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
        Boolean isOverdue,
        Boolean isFixed,
        LocalTime startTime,
        Boolean isOverloaded
) {}
