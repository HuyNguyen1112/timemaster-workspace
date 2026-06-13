package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.entity.Task;
import com.vinhhuy.timemaster.entity.TimeBlock;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface SchedulingService {

    @Data
    @AllArgsConstructor
    class FreeSlot {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private int capacityInMinutes;
    }

    @Data
    @AllArgsConstructor
    class TaskTarget {
        private Long taskId;
        private Task task;
        private int remainingDuration;
        private double priorityWeight;
    }

    List<TimeBlock> recalculateSchedule(Long userId, LocalDate date, Long contextId);

    List<FreeSlot> subtractObstacles(Long userId, Long contextId, LocalDate date);

    List<TimeBlock> optimizeSchedule(List<TaskTarget> tasks, List<FreeSlot> slots);

    double getPriorityWeight(Task.MatrixType type);

    void triggerAutoSchedule(Long userId, Long contextId, LocalDate targetDate);
}
