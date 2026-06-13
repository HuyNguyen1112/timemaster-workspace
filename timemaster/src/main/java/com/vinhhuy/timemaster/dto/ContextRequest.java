package com.vinhhuy.timemaster.dto;

public record ContextRequest(
        String name,
        String colorCode,
        Boolean isActive,
        java.util.List<ContextScheduleRequest> schedules
) {}
