package com.vinhhuy.timemaster.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record TaskRequest(
        @NotBlank(message = "Tiêu đề công việc không được để trống")
        String title,

        @NotNull(message = "Ngày thực hiện không được để trống")
        LocalDate targetDate,

        @NotNull(message = "Giờ bắt đầu không được để trống")
        LocalTime startTime,

        @NotNull(message = "Thời lượng dự kiến không được để trống")
        Double estimatedDuration,

        @NotBlank(message = "Vui lòng chọn phân loại Eisenhower (Q1, Q2, Q3, Q4)")
        String matrixType,

        Long categoryId,

        boolean force // Cờ cho phép lưu đè khi trùng lịch
) {}