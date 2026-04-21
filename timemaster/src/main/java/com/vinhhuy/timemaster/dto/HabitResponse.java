package com.vinhhuy.timemaster.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitResponse {
    private Long id;
    private Long userId;
    private String name;
    private String description;
    private String icon;
    private Integer dailyGoal;
    private String unit;
    private String frequency;
    private String colorCode;
    private LocalDateTime createdAt;

    // Additional tracking stats for UI (Optional)
    private Integer currentStreak;
    private Boolean completedToday;
    private java.util.List<HabitLogResponse> recentLogs;
    private String verificationSource;
    private Boolean isSystemHabit;

    public Boolean isSystemHabit() {
        return isSystemHabit;
    }

    public void setSystemHabit(Boolean isSystemHabit) {
        this.isSystemHabit = isSystemHabit;
    }
    private Integer progressToday;
}
