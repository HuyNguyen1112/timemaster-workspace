package com.vinhhuy.timemaster.dto;

public record ContextScheduleRequest(
        Integer dayOfWeek,   // Chọn 1 ngày (1=T2, 7=CN)
        Integer startDay,    // Batch: từ ngày (1=T2)
        Integer endDay,      // Batch: đến ngày (5=T6)
        String startTime,
        String endTime
) {}
