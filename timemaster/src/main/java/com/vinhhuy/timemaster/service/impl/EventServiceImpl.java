package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.EventRequest;
import com.vinhhuy.timemaster.dto.EventResponse;
import com.vinhhuy.timemaster.entity.Context;
import com.vinhhuy.timemaster.entity.Event;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.repository.ContextRepository;
import com.vinhhuy.timemaster.repository.EventRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.repository.TaskRepository;
import com.vinhhuy.timemaster.repository.TimeBlockRepository;
import com.vinhhuy.timemaster.entity.Task;
import com.vinhhuy.timemaster.entity.TimeBlock;
import com.vinhhuy.timemaster.service.EventService;
import com.vinhhuy.timemaster.service.SchedulingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final ContextRepository contextRepository;
    private final TaskRepository taskRepository;
    private final TimeBlockRepository timeBlockRepository;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private SchedulingService schedulingService;

    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getEventsByDate(Long userId, LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        List<Event> events = eventRepository.findByUserIdAndStartTimeBetween(userId, dayStart, dayEnd);

        return events.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EventResponse createEvent(Long userId, EventRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        Event event = new Event();
        event.setUser(user);
        event.setTitle(request.title());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());

        validateOverlap(userId, event.getStartTime(), event.getEndTime(), null);

        if (request.contextId() != null) {
            Context context = contextRepository.findById(request.contextId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Context với ID: " + request.contextId()));
            event.setContext(context);
        }

        Event saved = eventRepository.save(event);
        
        // Trigger auto-schedule to push flex tasks out of the way
        schedulingService.triggerAutoSchedule(userId, null, saved.getStartTime().toLocalDate());
        
        return toResponse(saved);
    }

    @Override
    @Transactional
    public EventResponse updateEvent(Long eventId, Long userId, EventRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Event với ID: " + eventId));

        if (!event.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền sửa Event này.");
        }

        event.setTitle(request.title());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());

        validateOverlap(userId, event.getStartTime(), event.getEndTime(), eventId);

        if (request.contextId() != null) {
            Context context = contextRepository.findById(request.contextId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Context với ID: " + request.contextId()));
            event.setContext(context);
        } else {
            event.setContext(null);
        }

        Event saved = eventRepository.save(event);
        
        // Trigger auto-schedule to push flex tasks out of the way
        schedulingService.triggerAutoSchedule(userId, null, saved.getStartTime().toLocalDate());
        
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteEvent(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Event với ID: " + eventId));

        if (!event.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa Event này.");
        }

        eventRepository.delete(event);
        
        // Trigger auto-schedule to pull flex tasks into the freed slot
        schedulingService.triggerAutoSchedule(userId, null, event.getStartTime().toLocalDate());
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getStartTime(),
                event.getEndTime(),
                event.getUser().getId(),
                event.getContext() != null ? event.getContext().getId() : null,
                event.getContext() != null ? event.getContext().getName() : null
        );
    }

    private void validateOverlap(Long userId, LocalDateTime start, LocalDateTime end, Long excludeEventId) {
        LocalDate date = start.toLocalDate();
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        // 1. Kiểm tra với các Event khác
        List<Event> events = eventRepository.findByUserIdAndStartTimeBetween(userId, dayStart, dayEnd);
        for (Event e : events) {
            if (excludeEventId != null && e.getId().equals(excludeEventId)) continue;
            if (start.isBefore(e.getEndTime()) && end.isAfter(e.getStartTime())) {
                throw new RuntimeException("Sự kiện bị trùng lặp thời gian với sự kiện khác: " + e.getTitle());
            }
        }

        // 2. Kiểm tra với Fixed Tasks
        List<Task> fixedTasks = taskRepository.findByUserIdAndTargetDateAndIsFixedTrue(userId, date);
        for (Task ft : fixedTasks) {
            LocalDateTime ftStart = LocalDateTime.of(date, ft.getStartTime());
            int duration = ft.getEstimatedDuration() != null ? (int) (ft.getEstimatedDuration() * 60) : 60;
            LocalDateTime ftEnd = ftStart.plusMinutes(duration);
            if (start.isBefore(ftEnd) && end.isAfter(ftStart)) {
                throw new RuntimeException("Sự kiện bị trùng lặp thời gian với công việc cố định: " + ft.getTitle());
            }
        }

        // 3. Kiểm tra với Pinned TimeBlocks
        List<TimeBlock> lockedBlocks = timeBlockRepository.findLockedBlocksByUserIdAndDateRange(userId, dayStart, dayEnd);
        for (TimeBlock tb : lockedBlocks) {
            if (start.isBefore(tb.getEndTime()) && end.isAfter(tb.getStartTime())) {
                throw new RuntimeException("Sự kiện bị trùng lặp thời gian với một khối thời gian đã ghim của công việc: " + tb.getTask().getTitle());
            }
        }
    }
}
