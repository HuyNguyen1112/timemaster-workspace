package com.vinhhuy.timemaster.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitRequest {
    private String name;
    private String description;
    private String icon;
    private Integer dailyGoal;
    private String unit;
    private String frequency;
    private String colorCode;
}
