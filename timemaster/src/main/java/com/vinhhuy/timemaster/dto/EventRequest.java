package com.vinhhuy.timemaster.dto;

import java.time.LocalDateTime;

public record EventRequest(
        String title,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Long contextId
) {}
