package com.vinhhuy.timemaster.mapper;

import com.vinhhuy.timemaster.dto.PomodoroResponse;
import com.vinhhuy.timemaster.entity.PomodoroSession;
import org.springframework.stereotype.Component;

@Component
public class PomodoroMapper {

    public PomodoroResponse toResponse(PomodoroSession entity) {
        if (entity == null)
            return null;

        Long taskId = entity.getTask() != null ? entity.getTask().getId() : null;
        String taskTitle = entity.getTask() != null ? entity.getTask().getTitle() : null;

        Long habitId = entity.getHabit() != null ? entity.getHabit().getId() : null;
        String habitName = entity.getHabit() != null ? entity.getHabit().getName() : null;

        if (taskTitle == null && habitName == null) {
            taskTitle = "Tự do (Không gắn công việc/thói quen)";
        }

        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : null;

        return new PomodoroResponse(
                entity.getId(),
                taskId,
                taskTitle,
                habitId,
                habitName,
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getDurationMinutes(),
                statusStr);
    }
}