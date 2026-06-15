package com.vinhhuy.timemaster.mapper;

import com.vinhhuy.timemaster.dto.HabitLogResponse;
import com.vinhhuy.timemaster.dto.HabitResponse;
import com.vinhhuy.timemaster.entity.Habit;
import com.vinhhuy.timemaster.entity.HabitLog;
import com.vinhhuy.timemaster.repository.HabitLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class HabitMapper {

    private final HabitLogRepository habitLogRepository;

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
                .routine(habit.getRoutine() != null ? habit.getRoutine().name() : "ALL_DAY")
                .createdAt(habit.getCreatedAt())
                .currentStreak(0)
                .completedToday(false)
                .verificationSource(habit.getVerificationSource() != null ? habit.getVerificationSource().name() : "NONE")
                .isSystemHabit(habit.isSystemHabit())
                .progressToday(0)
                .build();
    }

    public HabitResponse toResponseWithStats(Habit habit, boolean includeLogs) {
        HabitResponse response = this.toResponse(habit);
        List<HabitLog> logs = habitLogRepository.findByHabitId(habit.getId());

        LocalDate today = LocalDate.now();

        boolean completedToday = logs.stream()
                .anyMatch(l -> l.getLogDate().equals(today) && Boolean.TRUE.equals(l.isCompleted()));
        response.setCompletedToday(completedToday);

        // Set progressToday from today's log if it exists
        logs.stream()
                .filter(l -> l.getLogDate().equals(today))
                .findFirst()
                .ifPresent(l -> response.setProgressToday(l.getProgressValue()));

        int streak = 0;
        LocalDate trackDate = today;

        while (true) {
            final LocalDate d = trackDate;
            boolean hasLog = logs.stream()
                    .anyMatch(l -> l.getLogDate().equals(d) && Boolean.TRUE.equals(l.isCompleted()));

            if (hasLog) {
                streak++;
                trackDate = trackDate.minusDays(1);
            } else if (d.equals(today)) {
                // Not completed today yet, check yesterday
                trackDate = trackDate.minusDays(1);
            } else {
                break;
            }
        }

        response.setCurrentStreak(streak);

        if (includeLogs) {
            // Get last 30 days of logs for heatmap
            LocalDate startDate = today.minusDays(29);
            List<HabitLogResponse> recentLogs = logs.stream()
                    .filter(l -> !l.getLogDate().isBefore(startDate))
                    .map(l -> HabitLogResponse.builder()
                            .id(l.getId())
                            .logDate(l.getLogDate())
                            .progressValue(l.getProgressValue())
                            .completed(l.isCompleted())
                            .updatedAt(l.getUpdatedAt())
                            .build())
                    .collect(Collectors.toList());
            response.setRecentLogs(recentLogs);
        }

        return response;
    }
}
