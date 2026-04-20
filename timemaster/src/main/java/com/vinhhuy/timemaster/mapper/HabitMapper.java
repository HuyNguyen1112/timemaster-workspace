package com.vinhhuy.timemaster.mapper;

import com.vinhhuy.timemaster.dto.HabitResponse;
import com.vinhhuy.timemaster.entity.Habit;
import org.springframework.stereotype.Component;

@Component
public class HabitMapper {

    public HabitResponse toResponse(Habit habit) {
        return HabitResponse.builder()
                .id(habit.getId())
                .userId(habit.getUser().getId())
                .name(habit.getName())
                .description(habit.getDescription())
                .icon(habit.getIcon())
                .dailyGoal(habit.getDailyGoal())
                .unit(habit.getUnit())
                .frequency(habit.getFrequency().name())
                .colorCode(habit.getColorCode())
                .createdAt(habit.getCreatedAt())
                .currentStreak(0)
                .completedToday(false)
                .build();
    }
}
