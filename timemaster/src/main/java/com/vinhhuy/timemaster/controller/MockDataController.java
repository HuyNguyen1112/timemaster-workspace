package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.entity.*;
import com.vinhhuy.timemaster.repository.*;
import lombok.RequiredArgsConstructor;
import com.vinhhuy.timemaster.service.VectorSyncService;
import com.vinhhuy.timemaster.mapper.TaskMapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class MockDataController {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final HabitRepository habitRepository;
    private final PomodoroSessionRepository pomodoroSessionRepository;
    private final HabitLogRepository habitLogRepository;
    private final TimeBlockRepository timeBlockRepository;
    private final VectorSyncService vectorSyncService;
    private final TaskMapper taskMapper;

    @PostMapping("/mock-data/{userId}")
    @Transactional
    public String generateMockData(@PathVariable Long userId, @RequestParam(defaultValue = "7") int days) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Random random = new Random();

        // Lấy danh sách Habit hiện có để chấm điểm ngẫu nhiên
        List<Habit> habits = habitRepository.findByUserId(userId);

        for (int i = 1; i <= days; i++) {
            LocalDate targetDate = LocalDate.now().minusDays(i);

            // 1. Tạo 2 Task đã hoàn thành
            for (int j = 1; j <= 2; j++) {
                Task task = new Task();
                task.setUser(user);
                task.setTargetDate(targetDate);
                task.setEstimatedDuration(1.0); // 1 giờ
                task.setRemainingDuration(0); // hoàn thành
                task.setStatus(Task.TaskStatus.COMPLETED);

                if (j == 1) {
                    task.setTitle("Mock Fixed Task (" + targetDate + ")");
                    task.setIsFixed(true);
                    task.setMatrixType(Task.MatrixType.Q2); // Default matrix type to avoid DB null constraint
                    task.setStartTime(java.time.LocalTime.of(10, 0));
                } else {
                    task.setTitle("Mock Flex Task (" + targetDate + ")");
                    task.setIsFixed(false);
                    task.setMatrixType(Task.MatrixType.Q2); // Quan trọng, Không Khẩn cấp
                }
                
                Task savedTask = taskRepository.save(task);

                // Đồng bộ sang AI Vector Store
                vectorSyncService.syncToAi(taskMapper.toResponse(savedTask), null);

                // Tạo 1 phiên Pomodoro cho task
                PomodoroSession session = new PomodoroSession();
                session.setUser(user);
                session.setTask(savedTask);
                session.setStartTime(targetDate.atTime(10 + j, 0));
                session.setEndTime(targetDate.atTime(11 + j, 0));
                session.setDurationMinutes(60);
                session.setStatus(PomodoroSession.SessionStatus.COMPLETED);
                pomodoroSessionRepository.save(session);

                // Tạo TimeBlock giả cho task
                TimeBlock tb = new TimeBlock();
                tb.setTask(savedTask);
                tb.setStartTime(targetDate.atTime(10 + j, 0));
                tb.setEndTime(targetDate.atTime(11 + j, 0));
                timeBlockRepository.save(tb);
            }
            
            // 2. Chấm hoàn thành thói quen (Habit)
            for (Habit habit : habits) {
                // Kiểm tra xem đã có log chưa
                boolean hasLog = habitLogRepository.findByHabitIdAndLogDate(habit.getId(), targetDate).isPresent();
                if (!hasLog) {
                    HabitLog log = new HabitLog();
                    log.setHabit(habit);
                    log.setLogDate(targetDate);
                    log.setProgressValue(habit.getDailyGoal());
                    log.setCompleted(true);
                    habitLogRepository.save(log);

                    // Nếu habit đo bằng thời gian, tạo Pomodoro
                    if (habit.getUnit() != null && habit.getUnit().toLowerCase().startsWith("min")) {
                        PomodoroSession session = new PomodoroSession();
                        session.setUser(user);
                        session.setHabit(habit);
                        session.setStartTime(targetDate.atTime(20, 0));
                        session.setEndTime(targetDate.atTime(20, habit.getDailyGoal() >= 60 ? 59 : habit.getDailyGoal()));
                        session.setDurationMinutes(habit.getDailyGoal());
                        session.setStatus(PomodoroSession.SessionStatus.COMPLETED);
                        pomodoroSessionRepository.save(session);
                    }
                }
            }
        }
        return "Tạo dữ liệu giả thành công cho " + days + " ngày trước của user " + userId;
    }
}
