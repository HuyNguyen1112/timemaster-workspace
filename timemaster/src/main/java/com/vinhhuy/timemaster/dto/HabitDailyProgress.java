package com.vinhhuy.timemaster.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitDailyProgress {
    private Long habitId;
    private String name;
    private String icon;
    private Integer dailyGoal;
    private String unit;
    private Integer progressValue;
    private Boolean completed;
}
