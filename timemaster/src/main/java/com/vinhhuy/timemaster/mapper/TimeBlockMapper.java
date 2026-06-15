package com.vinhhuy.timemaster.mapper;

import com.vinhhuy.timemaster.dto.TimeBlockResponse;
import com.vinhhuy.timemaster.entity.TimeBlock;
import org.springframework.stereotype.Component;

@Component
public class TimeBlockMapper {

    public TimeBlockResponse toResponse(TimeBlock tb) {
        if (tb == null) return null;
        return new TimeBlockResponse(
                tb.getId(),
                tb.getTask().getId(),
                tb.getTask().getTitle(),
                tb.getTask().getMatrixType() != null ? tb.getTask().getMatrixType().name() : null,
                tb.getTask().getContext() != null ? tb.getTask().getContext().getName() : null,
                tb.getStartTime(),
                tb.getEndTime(),
                tb.getTask().getEstimatedDuration(),
                tb.getTask().getRemainingDuration(),
                tb.getTask().getIsOverloaded(),
                tb.getIsLocked()
        );
    }
}
