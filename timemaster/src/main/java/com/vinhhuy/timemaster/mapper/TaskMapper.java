package com.vinhhuy.timemaster.mapper;

import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.entity.Task;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task entity) {
        if (entity == null) return null;

        String matrixTypeStr = entity.getMatrixType() != null ? entity.getMatrixType().name() : null;
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : null;

        Long userId = entity.getUser() != null ? entity.getUser().getId() : null;
        Long contextId = entity.getContext() != null ? entity.getContext().getId() : null;

        Boolean isOverdue = entity.getTargetDate() != null
                && entity.getTargetDate().isBefore(LocalDate.now())
                && entity.getStatus() != Task.TaskStatus.COMPLETED;

        return new TaskResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getTargetDate(),
                entity.getEstimatedDuration(),
                entity.getRemainingDuration(),
                matrixTypeStr,
                statusStr,
                userId,
                contextId,
                entity.getCreatedAt(),
                isOverdue,
                entity.getIsFixed(),
                entity.getStartTime(),
                entity.getIsOverloaded()
        );
    }
}
