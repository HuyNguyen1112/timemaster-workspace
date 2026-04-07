package com.vinhhuy.timemaster.dto;

import java.time.LocalDateTime;

public record PomodoroResponse(
        Long id,
        Long taskId,
        String taskTitle, // Trả về tên công việc để UI dễ hiển thị
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer durationMinutes,
        String status
) {}
