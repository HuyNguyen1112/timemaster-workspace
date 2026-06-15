package com.vinhhuy.timemaster.mapper;

import com.vinhhuy.timemaster.dto.ContextResponse;
import com.vinhhuy.timemaster.entity.Context;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ContextMapper {

    public ContextResponse toResponse(Context context) {
        if (context == null) return null;

        List<ContextResponse.ScheduleItem> scheduleItems = Collections.emptyList();
        if (context.getSchedules() != null) {
            scheduleItems = context.getSchedules().stream()
                    .map(s -> new ContextResponse.ScheduleItem(
                            s.getId(),
                            s.getDayOfWeek(),
                            s.getStartTime().toString(),
                            s.getEndTime().toString()))
                    .collect(Collectors.toList());
        }

        return new ContextResponse(
                context.getId(),
                context.getName(),
                context.getColorCode(),
                context.getIsActive(),
                context.getUser() != null ? context.getUser().getId() : null,
                scheduleItems);
    }
}
