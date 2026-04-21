package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.HabitCheckInRequest;
import com.vinhhuy.timemaster.dto.HabitDailyProgress;
import com.vinhhuy.timemaster.dto.HabitRequest;
import com.vinhhuy.timemaster.dto.HabitResponse;
import com.vinhhuy.timemaster.dto.HabitLogResponse;
import com.vinhhuy.timemaster.entity.Habit;
import com.vinhhuy.timemaster.entity.HabitLog;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.mapper.HabitMapper;
import com.vinhhuy.timemaster.repository.HabitLogRepository;
import com.vinhhuy.timemaster.repository.HabitRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HabitServiceImpl implements HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final UserRepository userRepository;
    private final HabitMapper habitMapper;

    @Override
    @Transactional
    public HabitResponse createHabit(Long userId, HabitRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Habit habit = new Habit();
        habit.setUser(user);
        habit.setName(request.getName());
        habit.setDescription(request.getDescription());
        habit.setIcon(request.getIcon());
        habit.setDailyGoal(request.getDailyGoal() != null ? request.getDailyGoal() : 1);
        habit.setUnit(request.getUnit());
        habit.setColorCode(request.getColorCode());

        try {
            if (request.getFrequency() != null) {
                habit.setFrequency(Habit.Frequency.valueOf(request.getFrequency().toUpperCase()));
            } else {
                habit.setFrequency(Habit.Frequency.DAILY);
            }
        } catch (Exception e) {
            habit.setFrequency(Habit.Frequency.DAILY);
        }

        Habit saved = habitRepository.save(habit);
        return populateStats(saved, false);
    }

    @Override
    @Transactional
    public List<HabitResponse> getHabitsByUser(Long userId) {
        List<Habit> habits = habitRepository.findByUserId(userId);
        
        // If no system habits found, initialize them
        boolean hasSystemHabits = habits.stream().anyMatch(h -> Boolean.TRUE.equals(h.isSystemHabit()));
        if (!hasSystemHabits) {
            initializeSystemHabits(userId);
            habits = habitRepository.findByUserId(userId); // Refresh list
        }

        return habits.stream()
                .map(habit -> populateStats(habit, false))
                .collect(Collectors.toList());
    }

    private void initializeSystemHabits(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Default Walking Habit
        Habit walking = new Habit();
        walking.setUser(user);
        walking.setName("Daily Walking");
        walking.setDescription("Keep moving every day to stay healthy.");
        walking.setIcon("Flame");
        walking.setDailyGoal(8000);
        walking.setUnit("steps");
        walking.setColorCode("#fb923c"); // Orange
        walking.setVerificationSource(Habit.VerificationSource.GOOGLE_FIT_STEPS);
        walking.setSystemHabit(true);
        habitRepository.save(walking);

        // Default Running Habit
        Habit running = new Habit();
        running.setUser(user);
        running.setName("Daily Running");
        running.setDescription("Build cardiovascular endurance.");
        running.setIcon("Flame");
        running.setDailyGoal(2);
        running.setUnit("km");
        running.setColorCode("#ef4444"); // Red
        running.setVerificationSource(Habit.VerificationSource.GOOGLE_FIT_DISTANCE);
        running.setSystemHabit(true);
        habitRepository.save(running);
    }

    @Override
    @Transactional(readOnly = true)
    public HabitResponse getHabitById(Long habitId, Long userId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));
        if (!habit.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized permission");
        }
        return populateStats(habit, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HabitDailyProgress> getHabitsByDate(Long userId, LocalDate date) {
        List<Habit> habits = habitRepository.findByUserId(userId);
        return habits.stream().map(h -> {
            HabitLog log = habitLogRepository.findByHabitIdAndLogDate(h.getId(), date).orElse(null);
            Integer progress = log != null ? log.getProgressValue() : 0;
            Boolean completed = log != null ? log.isCompleted() : false;

            return HabitDailyProgress.builder()
                    .habitId(h.getId())
                    .name(h.getName())
                    .icon(h.getIcon())
                    .dailyGoal(h.getDailyGoal())
                    .unit(h.getUnit())
                    .progressValue(progress)
                    .completed(completed)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HabitResponse updateHabit(Long habitId, Long userId, HabitRequest request) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));
        if (!habit.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized permission");
        }

        if (request.getName() != null)
            habit.setName(request.getName());
        if (request.getDescription() != null)
            habit.setDescription(request.getDescription());
        if (request.getIcon() != null)
            habit.setIcon(request.getIcon());
        if (request.getDailyGoal() != null)
            habit.setDailyGoal(request.getDailyGoal());
        if (request.getUnit() != null)
            habit.setUnit(request.getUnit());
        if (request.getColorCode() != null)
            habit.setColorCode(request.getColorCode());

        Habit updated = habitRepository.save(habit);
        return populateStats(updated, false);
    }

    @Override
    @Transactional
    public void deleteHabit(Long habitId, Long userId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));
        if (Boolean.TRUE.equals(habit.isSystemHabit())) {
            throw new RuntimeException("System habits cannot be deleted.");
        }
        if (!habit.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized permission");
        }

        List<HabitLog> logs = habitLogRepository.findByHabitId(habitId);
        habitLogRepository.deleteAll(logs);

        habitRepository.delete(habit);
    }

    @Override
    @Transactional
    public HabitResponse checkIn(Long habitId, Long userId, HabitCheckInRequest request) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));
        if (!habit.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized permission");
        }

        LocalDate logDate = request.getLogDate() != null ? request.getLogDate() : LocalDate.now();

        HabitLog log = habitLogRepository.findByHabitIdAndLogDate(habitId, logDate)
                .orElse(new HabitLog());

        log.setHabit(habit);
        log.setLogDate(logDate);

        int newProgressValue = request.getProgressValue() != null ? request.getProgressValue() : habit.getDailyGoal();
        
        if (Boolean.TRUE.equals(request.getIsIncrement())) {
            int currentProgress = log.getProgressValue() != null ? log.getProgressValue() : 0;
            log.setProgressValue(currentProgress + newProgressValue);
        } else {
            log.setProgressValue(newProgressValue);
        }

        if (request.getCompleted() != null) {
            log.setCompleted(request.getCompleted());
        } else {
            log.setCompleted(log.getProgressValue() >= habit.getDailyGoal());
        }

        habitLogRepository.save(log);

        return populateStats(habit, false);
    }

    private HabitResponse populateStats(Habit habit, boolean includeLogs) {
        HabitResponse response = habitMapper.toResponse(habit);
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
            List<com.vinhhuy.timemaster.dto.HabitLogResponse> recentLogs = logs.stream()
                    .filter(l -> !l.getLogDate().isBefore(startDate))
                    .map(l -> com.vinhhuy.timemaster.dto.HabitLogResponse.builder()
                            .id(l.getId())
                            .logDate(l.getLogDate())
                            .progressValue(l.getProgressValue())
                            .completed(l.isCompleted())
                            .build())
                    .collect(Collectors.toList());
            response.setRecentLogs(recentLogs);
        }

        return response;
    }
}
