package com.vinhhuy.timemaster.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record TaskRequest(
        @NotBlank(message = "Tiêu đề công việc không được để trống")
        String title,
        String description,

        @NotNull(message = "Ngày thực hiện không được để trống")
        LocalDate targetDate,

        Double estimatedDuration,

        String matrixType,

        Long contextId,

        Boolean isFixed,
        
        LocalTime startTime
) {}