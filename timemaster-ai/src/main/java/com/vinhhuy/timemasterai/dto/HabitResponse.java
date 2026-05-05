package com.vinhhuy.timemasterai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitResponse {
    private Long id;
    private Long userId;
    private String name;
    private String description;
    private Integer dailyGoal;
    private String unit;
    private String frequency;
    private Integer currentStreak;
    private Boolean completedToday;
    private Integer progressToday;
    private String verificationSource;
}
