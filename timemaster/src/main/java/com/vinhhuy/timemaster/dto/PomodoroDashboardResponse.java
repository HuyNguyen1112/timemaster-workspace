package com.vinhhuy.timemaster.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PomodoroDashboardResponse {
    // 1. Overview
    private long totalSessionsCompleted;
    private long totalFocusTimeMinutes;
    private long todayFocusTimeMinutes;
    private long abandonedSessions;

    // 2. Trends
    private List<DailyFocusTime> focusTimeLast7Days;
    private String comparisonWithLastWeek;

    // 3. Deep Analytics
    private Map<String, Long> focusTimeByCategory;

    // 4. Habits
    private int currentStreak;
    private String mostProductiveTimeOfDay;
}
