package com.vinhhuy.timemaster.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record PomodoroRequest(
        // taskId có thể null vì người dùng có thể chạy Pomodoro tự do không gán với công việc nào
        Long taskId,

        @NotNull(message = "Thời gian bắt đầu không được để trống")
        LocalDateTime startTime,

        @NotNull(message = "Thời gian kết thúc không được để trống")
        LocalDateTime endTime,

        @NotNull(message = "Thời lượng không được để trống")
        @Min(value = 1, message = "Thời lượng phải lớn hơn 0")
        Integer durationMinutes,

        @NotBlank(message = "Trạng thái không được để trống (COMPLETED hoặc INTERRUPTED)")
        String status
) {}
