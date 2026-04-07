package com.vinhhuy.timemaster.dto;

import java.util.Map;

public record AnalyticsResponse(
        Integer totalFocusMinutesToday, // Tổng số phút tập trung hôm nay (VD: 150 phút)
        Integer totalTasksCompletedToday, // Tổng số công việc đã xong hôm nay
        Map<String, Long> completedTasksByMatrix // Chi tiết: Q1 xong mấy việc, Q2 xong mấy việc...
) {}