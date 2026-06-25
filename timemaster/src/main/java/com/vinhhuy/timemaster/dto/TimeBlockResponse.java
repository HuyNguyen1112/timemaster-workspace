package com.vinhhuy.timemaster.dto;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin một khối thời gian trên Lịch.
 * Frontend sẽ dùng DTO này để vẽ lịch kiểu Google Calendar.
 */
public record TimeBlockResponse(
    Long id,
    Long taskId,
    String taskTitle,
    String matrixType,
    String contextName,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Double estimatedDuration,
    Integer remainingDuration,
    Boolean isOverloaded,
    Boolean isLocked,
    String taskStatus
) {}
