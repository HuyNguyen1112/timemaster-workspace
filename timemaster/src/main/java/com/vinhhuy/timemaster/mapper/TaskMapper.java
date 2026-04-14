package com.vinhhuy.timemaster.mapper;

import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.entity.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task entity) {
        if (entity == null) return null;

        // Xử lý các giá trị an toàn (tránh NullPointerException)
        String matrixTypeStr = entity.getMatrixType() != null ? entity.getMatrixType().name() : null;
        String statusStr = entity.getStatus() != null ? entity.getStatus().name() : null;
        String categoryName = entity.getCategory() != null ? entity.getCategory().getName() : null;

        // Trả về Record thông qua Constructor
        return new TaskResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getTargetDate(),
                entity.getStartTime(),
                entity.getEstimatedDuration(),
                matrixTypeStr,
                statusStr,
                categoryName,
                entity.getCreatedAt()
        );
    }
}
