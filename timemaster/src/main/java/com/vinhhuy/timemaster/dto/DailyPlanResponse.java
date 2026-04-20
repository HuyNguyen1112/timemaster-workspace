package com.vinhhuy.timemaster.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyPlanResponse {
    private LocalDate date;
    private List<TaskResponse> tasks;
    private List<HabitDailyProgress> habits;
}
