package com.vinhhuy.timemaster.dto;

import java.time.LocalDateTime;

public record EventResponse(
        Long id,
        String title,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Long userId,
        Long contextId,
        String contextName
) {}
