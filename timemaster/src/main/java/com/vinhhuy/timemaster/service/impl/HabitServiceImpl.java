package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.HabitCheckInRequest;
import com.vinhhuy.timemaster.dto.HabitDailyProgress;
import com.vinhhuy.timemaster.dto.HabitRequest;
import com.vinhhuy.timemaster.dto.HabitResponse;
import com.vinhhuy.timemaster.entity.Habit;
import com.vinhhuy.timemaster.entity.HabitLog;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.mapper.HabitMapper;
import com.vinhhuy.timemaster.repository.HabitLogRepository;
import com.vinhhuy.timemaster.repository.HabitRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.HabitService;
import com.vinhhuy.timemaster.service.VectorSyncService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HabitServiceImpl implements HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final UserRepository userRepository;
    private final HabitMapper habitMapper;
    private final VectorSyncService vectorSyncService;
    private final HttpServletRequest httpServletRequest;

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
        if (request.getUnit() != null) {
            String u = request.getUnit().toLowerCase();
            if (!u.equals("times") && !u.equals("minutes") && !u.equals("steps")) {
                throw new RuntimeException("Unit chỉ được phép là 'times' hoặc 'minutes'");
            }
            habit.setUnit(u);
        } else {
            habit.setUnit("times");
        }
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

        if (request.getRoutine() != null) {
            try {
                habit.setRoutine(Habit.Routine.valueOf(request.getRoutine().toUpperCase()));
            } catch (Exception e) {
                habit.setRoutine(Habit.Routine.ALL_DAY);
            }
        }

        Habit saved = habitRepository.save(habit);
        HabitResponse response = habitMapper.toResponseWithStats(saved, false);

        // Sync to AI
        vectorSyncService.syncHabitToAi(response, getAuthHeaderSafely());

        return response;
    }

    @Override
    @Transactional
    public List<HabitResponse> getHabitsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        List<Habit> habits = habitRepository.findByUserId(userId);

        // If no system habits found, initialize them
        boolean hasSystemHabits = habits.stream().anyMatch(h -> Boolean.TRUE.equals(h.isSystemHabit()));
        if (!hasSystemHabits) {
            initializeSystemHabits(userId);
            habits = habitRepository.findByUserId(userId); // Refresh list
        }

        return habits.stream()
                .map(habit -> habitMapper.toResponseWithStats(habit, false))
                .collect(Collectors.toList());
    }

    private void initializeSystemHabits(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Default Activity Habit (Steps + calculated distance)
        Habit activity = new Habit();
        activity.setUser(user);
        activity.setName("Daily Activity");
        activity.setDescription("Track your daily steps and stay active.");
        activity.setIcon("Flame");
        activity.setDailyGoal(8000);
        activity.setUnit("steps");
        activity.setColorCode("#fb923c"); // Orange
        activity.setVerificationSource(Habit.VerificationSource.GOOGLE_FIT_STEPS);
        activity.setSystemHabit(true);
        habitRepository.save(activity);
    }

    @Override
    @Transactional(readOnly = true)
    public HabitResponse getHabitById(Long habitId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));
        if (!habit.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized permission");
        }
        return habitMapper.toResponseWithStats(habit, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HabitDailyProgress> getHabitsByDate(Long userId, LocalDate date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

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
        if (request.getUnit() != null) {
            String u = request.getUnit().toLowerCase();
            if (!u.equals("times") && !u.equals("minutes") && !u.equals("steps")) {
                throw new RuntimeException("Unit chỉ được phép là 'times' hoặc 'minutes'");
            }
            habit.setUnit(u);
        }
        if (request.getColorCode() != null)
            habit.setColorCode(request.getColorCode());
        if (request.getRoutine() != null) {
            try {
                habit.setRoutine(Habit.Routine.valueOf(request.getRoutine().toUpperCase()));
            } catch (Exception e) {}
        }

        Habit updated = habitRepository.save(habit);
        HabitResponse response = habitMapper.toResponseWithStats(updated, false);

        // Sync to AI
        vectorSyncService.syncHabitToAi(response, getAuthHeaderSafely());

        return response;
    }

    @Override
    @Transactional
    public void deleteHabit(Long habitId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

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

        // Notify AI before deletion
        vectorSyncService.deleteHabitFromAi(habitId, getAuthHeaderSafely());

        habitRepository.delete(habit);
    }

    @Override
    @Transactional
    public HabitResponse checkIn(Long habitId, Long userId, HabitCheckInRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

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

        // Đã gỡ bỏ tính năng Cooldown 5 phút để cho phép ấn +1 liên tục

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

        HabitResponse response = habitMapper.toResponseWithStats(habit, false);

        // Sync progress update to AI
        vectorSyncService.syncHabitToAi(response, getAuthHeaderSafely());

        return response;
    }



    private String getAuthHeaderSafely() {
        try {
            return httpServletRequest.getHeader("Authorization");
        } catch (Exception e) {
            return null;
        }
    }
}
