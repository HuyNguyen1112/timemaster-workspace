package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.PomodoroRequest;
import com.vinhhuy.timemaster.dto.PomodoroResponse;
import com.vinhhuy.timemaster.entity.PomodoroSession;
import com.vinhhuy.timemaster.entity.Task;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.entity.Habit;
import com.vinhhuy.timemaster.mapper.PomodoroMapper;
import com.vinhhuy.timemaster.repository.PomodoroSessionRepository;
import com.vinhhuy.timemaster.repository.TaskRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.repository.HabitRepository;
import com.vinhhuy.timemaster.service.PomodoroService;
import com.vinhhuy.timemaster.service.HabitService;
import com.vinhhuy.timemaster.dto.HabitCheckInRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.vinhhuy.timemaster.dto.PomodoroDashboardResponse;
import com.vinhhuy.timemaster.dto.DailyFocusTime;

@Service
@RequiredArgsConstructor
public class PomodoroServiceImpl implements PomodoroService {

    private final PomodoroSessionRepository pomodoroRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final PomodoroMapper pomodoroMapper;
    private final HabitRepository habitRepository;
    private final HabitService habitService;

    @Override
    @Transactional
    public PomodoroResponse saveSession(Long userId, PomodoroRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        PomodoroSession session = new PomodoroSession();
        session.setUser(user);
        session.setStartTime(request.startTime());
        session.setEndTime(request.endTime());
        session.setDurationMinutes(request.durationMinutes());

        try {
            session.setStatus(PomodoroSession.SessionStatus.valueOf(request.status().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái Pomodoro không hợp lệ. Chỉ chấp nhận COMPLETED hoặc INTERRUPTED.");
        }

        // Xử lý nếu người dùng có gán Pomodoro này cho một công việc cụ thể
        if (request.taskId() != null) {
            Task task = taskRepository.findById(request.taskId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc với ID: " + request.taskId()));

            // Bảo mật: Đảm bảo công việc này thuộc về đúng user đang chạy Pomodoro
            if (!task.getUser().getId().equals(userId)) {
                throw new RuntimeException("Bạn không có quyền thao tác với công việc này.");
            }
            session.setTask(task);
        }

        // Xử lý nếu gán cho Habit
        if (request.habitId() != null) {
            Habit habit = habitRepository.findById(request.habitId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thói quen với ID: " + request.habitId()));

            if (!habit.getUser().getId().equals(userId)) {
                throw new RuntimeException("Bạn không có quyền thao tác với thói quen này.");
            }
            session.setHabit(habit);
        }

        PomodoroSession savedSession = pomodoroRepository.save(session);

        // AUTO-SYNC HOOK: Tự động check-in Habit nếu Pomodoro hoàn thành
        if (request.habitId() != null && savedSession.getStatus() == PomodoroSession.SessionStatus.COMPLETED) {
            HabitCheckInRequest checkInReq = new HabitCheckInRequest(
                    savedSession.getStartTime().toLocalDate(),
                    savedSession.getDurationMinutes(),
                    null);
            habitService.checkIn(request.habitId(), userId, checkInReq);
        }

        return pomodoroMapper.toResponse(savedSession);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PomodoroResponse> getSessionsByUser(Long userId) {
        return pomodoroRepository.findByUserId(userId)
                .stream()
                .map(pomodoroMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PomodoroDashboardResponse getDashboardStats(Long userId) {
        List<PomodoroSession> sessions = pomodoroRepository.findByUserId(userId);
        LocalDate today = LocalDate.now();

        // 1. Overview
        long totalSessionsCompleted = sessions.stream()
                .filter(s -> s.getStatus() == PomodoroSession.SessionStatus.COMPLETED)
                .count();

        long totalFocusTimeMinutes = sessions.stream()
                .filter(s -> s.getStatus() == PomodoroSession.SessionStatus.COMPLETED)
                .mapToLong(PomodoroSession::getDurationMinutes)
                .sum();

        long todayFocusTimeMinutes = sessions.stream()
                .filter(s -> s.getStatus() == PomodoroSession.SessionStatus.COMPLETED)
                .filter(s -> s.getStartTime().toLocalDate().equals(today))
                .mapToLong(PomodoroSession::getDurationMinutes)
                .sum();

        long abandonedSessions = sessions.stream()
                .filter(s -> s.getStatus() == PomodoroSession.SessionStatus.INTERRUPTED)
                .count();

        // 2. Trends (Last 7 Days)
        List<DailyFocusTime> focusTimeLast7Days = new ArrayList<>();
        long currentWeekFocus = 0;
        long lastWeekFocus = 0;

        for (int i = 6; i >= 0; i--) {
            final LocalDate d = today.minusDays(i);
            long dailyMinutes = sessions.stream()
                    .filter(s -> s.getStatus() == PomodoroSession.SessionStatus.COMPLETED)
                    .filter(s -> s.getStartTime().toLocalDate().equals(d))
                    .mapToLong(PomodoroSession::getDurationMinutes)
                    .sum();
            focusTimeLast7Days.add(new DailyFocusTime(d, dailyMinutes));
            currentWeekFocus += dailyMinutes;
        }

        for (int i = 13; i >= 7; i--) {
            final LocalDate d = today.minusDays(i);
            lastWeekFocus += sessions.stream()
                    .filter(s -> s.getStatus() == PomodoroSession.SessionStatus.COMPLETED)
                    .filter(s -> s.getStartTime().toLocalDate().equals(d))
                    .mapToLong(PomodoroSession::getDurationMinutes)
                    .sum();
        }

        String comparisonWithLastWeek = "0%";
        if (lastWeekFocus > 0) {
            long diff = currentWeekFocus - lastWeekFocus;
            long percentage = (diff * 100) / lastWeekFocus;
            comparisonWithLastWeek = (percentage > 0 ? "+" : "") + percentage + "% Focus Time";
        } else if (currentWeekFocus > 0) {
            comparisonWithLastWeek = "+100% Focus Time";
        }

        // 3. Deep Analytics (By Category)
        Map<String, Long> focusTimeByCategory = sessions.stream()
                .filter(s -> s.getStatus() == PomodoroSession.SessionStatus.COMPLETED)
                .filter(s -> s.getTask() != null && s.getTask().getCategory() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getTask().getCategory().getName(),
                        Collectors.summingLong(PomodoroSession::getDurationMinutes)));

        // 4. Habits
        int currentStreak = 0;
        LocalDate trackDate = today;

        while (true) {
            final LocalDate d = trackDate;
            boolean hasPomodoro = sessions.stream()
                    .anyMatch(s -> s.getStatus() == PomodoroSession.SessionStatus.COMPLETED &&
                            s.getStartTime().toLocalDate().equals(d));

            if (hasPomodoro) {
                currentStreak++;
                trackDate = trackDate.minusDays(1);
            } else if (d.equals(today)) {
                // If no pomodoro today, don't break the streak yet, check yesterday
                trackDate = trackDate.minusDays(1);
            } else {
                break;
            }
        }

        // Most Productive Time Of Day
        Map<String, Long> timeOfDayGroups = sessions.stream()
                .filter(s -> s.getStatus() == PomodoroSession.SessionStatus.COMPLETED)
                .collect(Collectors.groupingBy(
                        s -> {
                            int hour = s.getStartTime().getHour();
                            if (hour >= 5 && hour < 12)
                                return "Sáng";
                            if (hour >= 12 && hour < 18)
                                return "Chiều";
                            return "Tối muộn"; // 18h - 5h
                        },
                        Collectors.summingLong(PomodoroSession::getDurationMinutes)));

        String mostProductiveTimeOfDay = timeOfDayGroups.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Chưa đủ dữ liệu");

        return PomodoroDashboardResponse.builder()
                .totalSessionsCompleted(totalSessionsCompleted)
                .totalFocusTimeMinutes(totalFocusTimeMinutes)
                .todayFocusTimeMinutes(todayFocusTimeMinutes)
                .abandonedSessions(abandonedSessions)
                .focusTimeLast7Days(focusTimeLast7Days)
                .comparisonWithLastWeek(comparisonWithLastWeek)
                .focusTimeByCategory(focusTimeByCategory)
                .currentStreak(currentStreak)
                .mostProductiveTimeOfDay(mostProductiveTimeOfDay)
                .build();
    }
}
