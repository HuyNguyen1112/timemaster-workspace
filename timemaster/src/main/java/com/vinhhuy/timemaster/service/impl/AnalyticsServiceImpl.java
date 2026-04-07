package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.AnalyticsResponse;
import com.vinhhuy.timemaster.entity.Task;
import com.vinhhuy.timemaster.repository.PomodoroSessionRepository;
import com.vinhhuy.timemaster.repository.TaskRepository;
import com.vinhhuy.timemaster.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final TaskRepository taskRepository;
    private final PomodoroSessionRepository pomodoroRepository;

    @Override
    @Transactional(readOnly = true)
    public AnalyticsResponse getDailyAnalytics(Long userId) {
        // Lấy thời điểm 00:00:00 và 23:59:59 của ngày hôm nay
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        // 1. Tính tổng số phút tập trung trong ngày
        Integer totalFocusMinutes = pomodoroRepository.getTotalFocusTime(userId, startOfDay, endOfDay);
        if (totalFocusMinutes == null) totalFocusMinutes = 0;

        // 2. Tính số lượng task hoàn thành theo từng ô Eisenhower
        Map<String, Long> matrixStats = new HashMap<>();
        long totalCompleted = 0;

        for (Task.MatrixType type : Task.MatrixType.values()) {
            long count = taskRepository.countCompletedTasksByMatrixAndDate(userId, type, startOfDay, endOfDay);
            matrixStats.put(type.name(), count);
            totalCompleted += count;
        }

        // 3. Đóng gói và trả về
        return new AnalyticsResponse(totalFocusMinutes, (int) totalCompleted, matrixStats);
    }
}
