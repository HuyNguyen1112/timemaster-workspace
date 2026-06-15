package com.vinhhuy.timemaster.dto;

public record ContextScheduleRequest(
                Integer dayOfWeek,
                Integer startDay,
                Integer endDay,
                String startTime,
                String endTime) {

}
