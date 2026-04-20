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
        return populateStats(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HabitResponse> getHabitsByUser(Long userId) {
        return habitRepository.findByUserId(userId).stream()
                .map(this::populateStats)
                .collect(Collectors.toList());
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
        return populateStats(updated);
    }

    @Override
    @Transactional
    public void deleteHabit(Long habitId, Long userId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new RuntimeException("Habit not found"));
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
        log.setProgressValue(request.getProgressValue() != null ? request.getProgressValue() : habit.getDailyGoal());

        if (request.getCompleted() != null) {
            log.setCompleted(request.getCompleted());
        } else {
            log.setCompleted(log.getProgressValue() >= habit.getDailyGoal());
        }

        habitLogRepository.save(log);

        return populateStats(habit);
    }

    private HabitResponse populateStats(Habit habit) {
        HabitResponse response = habitMapper.toResponse(habit);
        List<HabitLog> logs = habitLogRepository.findByHabitId(habit.getId());

        LocalDate today = LocalDate.now();

        boolean completedToday = logs.stream()
                .anyMatch(l -> l.getLogDate().equals(today) && l.isCompleted());
        response.setCompletedToday(completedToday);

        int streak = 0;
        LocalDate trackDate = today;

        while (true) {
            final LocalDate d = trackDate;
            boolean hasLog = logs.stream()
                    .anyMatch(l -> l.getLogDate().equals(d) && l.isCompleted());

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
        return response;
    }
}
