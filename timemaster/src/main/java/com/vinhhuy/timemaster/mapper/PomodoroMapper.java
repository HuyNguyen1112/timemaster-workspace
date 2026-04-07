package com.vinhhuy.timemaster.mapper;

import com.vinhhuy.timemaster.dto.PomodoroResponse;
import com.vinhhuy.timemaster.entity.PomodoroSession;
import org.springframework.stereotype.Component;

@Component
public class PomodoroMapper {

    public PomodoroResponse toResponse(PomodoroSession entity) {
        if (entity == null) return null;

        Long taskId = entity.getTask() != null ? entity.getTask().getId() : null;
        String taskTitle = entity.getTask() != null ? entity.getTask().getTitle() : "Tự do (Không gắn công việc)";
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : null;

        return new PomodoroResponse(
                entity.getId(),
                taskId,
                taskTitle,
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getDurationMinutes(),
                statusStr
        );
    }
}