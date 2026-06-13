package com.vinhhuy.timemaster.dto;

import java.util.List;

public record ContextResponse(
        Long id,
        String name,
        String colorCode,
        Boolean isActive,
        Long userId,
        List<ScheduleItem> schedules
) {
    public record ScheduleItem(
            Long id,
            Integer dayOfWeek,
            String startTime,
            String endTime
    ) {}
}
