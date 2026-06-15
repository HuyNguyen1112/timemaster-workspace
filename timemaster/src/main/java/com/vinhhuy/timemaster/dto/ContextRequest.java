package com.vinhhuy.timemaster.dto;

import java.util.List;

public record ContextRequest(
        String name,
        String colorCode,
        Boolean isActive,
        List<ContextScheduleRequest> schedules
) {}
