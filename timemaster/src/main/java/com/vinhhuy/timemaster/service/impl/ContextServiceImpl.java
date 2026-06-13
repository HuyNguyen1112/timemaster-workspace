package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.ContextRequest;
import com.vinhhuy.timemaster.dto.ContextResponse;
import com.vinhhuy.timemaster.dto.ContextScheduleRequest;
import com.vinhhuy.timemaster.entity.Context;
import com.vinhhuy.timemaster.entity.ContextSchedule;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.repository.ContextRepository;
import com.vinhhuy.timemaster.repository.ContextScheduleRepository;
import com.vinhhuy.timemaster.repository.EventRepository;
import com.vinhhuy.timemaster.repository.TaskRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.ContextService;
import com.vinhhuy.timemaster.service.SchedulingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContextServiceImpl implements ContextService {

    private final ContextRepository contextRepository;
    private final ContextScheduleRepository contextScheduleRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private SchedulingService schedulingService;

    @Override
    @Transactional(readOnly = true)
    public List<ContextResponse> getAllContextsByUser(Long userId) {
        List<Context> contexts = contextRepository.findAll().stream()
                .filter(c -> c.getUser().getId().equals(userId))
                .collect(Collectors.toList());

        return contexts.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContextResponse createContext(Long userId, ContextRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        System.out.println("==== CREATE CONTEXT REQUEST ====");
        System.out.println("Name: " + request.name());
        System.out.println("Schedules: " + request.schedules());
        System.out.println("================================");

        // Validate schedules before saving Context
        if (request.schedules() != null) {
            for (ContextScheduleRequest schReq : request.schedules()) {
                LocalTime newStart = LocalTime.parse(schReq.startTime());
                LocalTime newEnd = LocalTime.parse(schReq.endTime());
                validateNoOverlap(userId, schReq.dayOfWeek(), newStart, newEnd, schReq.startTime(), schReq.endTime(), null);
            }
        }

        Context context = new Context();
        context.setUser(user);
        context.setName(request.name());
        context.setColorCode(request.colorCode());
        context.setIsActive(request.isActive() != null ? request.isActive() : true);

        Context saved = contextRepository.save(context);

        if (request.schedules() != null) {
            for (ContextScheduleRequest schReq : request.schedules()) {
                ContextSchedule schedule = new ContextSchedule();
                schedule.setContext(saved);
                schedule.setDayOfWeek(schReq.dayOfWeek());
                schedule.setStartTime(LocalTime.parse(schReq.startTime()));
                schedule.setEndTime(LocalTime.parse(schReq.endTime()));
                contextScheduleRepository.save(schedule);
            }
        }

        schedulingService.triggerAutoSchedule(userId, saved.getId(), java.time.LocalDate.now());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public ContextResponse updateContext(Long contextId, Long userId, ContextRequest request) {
        Context context = contextRepository.findById(contextId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Context với ID: " + contextId));

        if (!context.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền sửa Context này.");
        }

        // Validate schedules
        if (request.schedules() != null) {
            for (ContextScheduleRequest schReq : request.schedules()) {
                LocalTime newStart = LocalTime.parse(schReq.startTime());
                LocalTime newEnd = LocalTime.parse(schReq.endTime());
                validateNoOverlap(userId, schReq.dayOfWeek(), newStart, newEnd, schReq.startTime(), schReq.endTime(), contextId);
            }
        }

        context.setName(request.name());
        context.setColorCode(request.colorCode());
        if (request.isActive() != null) {
            context.setIsActive(request.isActive());
        }

        Context saved = contextRepository.save(context);

        if (request.schedules() != null) {
            // Remove old schedules
            List<ContextSchedule> oldSchedules = contextScheduleRepository.findByContextId(contextId);
            contextScheduleRepository.deleteAll(oldSchedules);

            // Add new schedules
            for (ContextScheduleRequest schReq : request.schedules()) {
                ContextSchedule schedule = new ContextSchedule();
                schedule.setContext(saved);
                schedule.setDayOfWeek(schReq.dayOfWeek());
                schedule.setStartTime(LocalTime.parse(schReq.startTime()));
                schedule.setEndTime(LocalTime.parse(schReq.endTime()));
                contextScheduleRepository.save(schedule);
            }
        }

        schedulingService.triggerAutoSchedule(userId, contextId, java.time.LocalDate.now());

        return toResponse(contextRepository.findById(contextId).orElseThrow());
    }

    @Override
    @Transactional
    public void deleteContext(Long contextId, Long userId) {
        Context context = contextRepository.findById(contextId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Context với ID: " + contextId));

        if (!context.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa Context này.");
        }

        if (taskRepository.countByContextId(contextId) > 0) {
            throw new RuntimeException("Không thể xóa danh mục này vì đang có công việc được phân bổ vào đây. Bạn hãy đổi danh mục của các công việc đó sang danh mục khác trước khi xóa.");
        }

        if (eventRepository.countByContextId(contextId) > 0) {
            throw new RuntimeException("Không thể xóa danh mục này vì đang có sự kiện (event) gắn liền với nó. Bạn hãy xóa hoặc đổi danh mục của sự kiện đó trước.");
        }

        contextRepository.delete(context);
    }

    @Override
    @Transactional
    public ContextResponse addSchedule(Long contextId, ContextScheduleRequest request) {
        Context context = contextRepository.findById(contextId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Context với ID: " + contextId));

        LocalTime newStart = LocalTime.parse(request.startTime());
        LocalTime newEnd = LocalTime.parse(request.endTime());
        Long userId = context.getUser().getId();

        // Xác định danh sách ngày cần tạo
        List<Integer> days = new java.util.ArrayList<>();
        if (request.startDay() != null && request.endDay() != null) {
            // Batch: từ startDay đến endDay
            for (int d = request.startDay(); d <= request.endDay(); d++) {
                days.add(d);
            }
        } else if (request.dayOfWeek() != null) {
            // Chọn 1 ngày
            days.add(request.dayOfWeek());
        } else {
            throw new RuntimeException("Phải chọn dayOfWeek hoặc startDay + endDay.");
        }

        // Validate overlap + tạo schedule cho từng ngày
        for (Integer day : days) {
            validateNoOverlap(userId, day, newStart, newEnd, request.startTime(), request.endTime(), contextId);

            ContextSchedule schedule = new ContextSchedule();
            schedule.setContext(context);
            schedule.setDayOfWeek(day);
            schedule.setStartTime(newStart);
            schedule.setEndTime(newEnd);
            contextScheduleRepository.save(schedule);
        }

        // Reload để có danh sách schedules mới nhất
        Context reloaded = contextRepository.findById(contextId).orElseThrow();
        
        // Kích hoạt auto-schedule do khung giờ thay đổi
        schedulingService.triggerAutoSchedule(userId, contextId, java.time.LocalDate.now());
        
        return toResponse(reloaded);
    }

    private void validateNoOverlap(Long userId, Integer dayOfWeek,
                                   LocalTime newStart, LocalTime newEnd,
                                   String startStr, String endStr, Long excludeContextId) {
        List<ContextSchedule> existing = contextScheduleRepository.findByUserIdAndDayOfWeek(userId, dayOfWeek);
        for (ContextSchedule s : existing) {
            if (excludeContextId != null && s.getContext().getId().equals(excludeContextId)) {
                continue;
            }
            boolean overlap = newStart.isBefore(s.getEndTime()) && newEnd.isAfter(s.getStartTime());
            if (overlap) {
                String ctxName = s.getContext().getName();
                throw new RuntimeException(
                    String.format("Ngày %d: Khung giờ %s-%s bị trùng với Context \"%s\" (%s-%s).",
                        dayOfWeek, startStr, endStr, ctxName, s.getStartTime(), s.getEndTime()));
            }
        }
    }

    @Override
    @Transactional
    public void removeSchedule(Long contextId, Long scheduleId) {
        Context context = contextRepository.findById(contextId).orElseThrow();
        Long userId = context.getUser().getId();
        contextScheduleRepository.deleteById(scheduleId);
        
        // Kích hoạt auto-schedule do khung giờ thay đổi
        schedulingService.triggerAutoSchedule(userId, contextId, java.time.LocalDate.now());
    }

    private ContextResponse toResponse(Context context) {
        List<ContextResponse.ScheduleItem> scheduleItems = Collections.emptyList();
        if (context.getSchedules() != null) {
            scheduleItems = context.getSchedules().stream()
                    .map(s -> new ContextResponse.ScheduleItem(
                            s.getId(),
                            s.getDayOfWeek(),
                            s.getStartTime().toString(),
                            s.getEndTime().toString()
                    ))
                    .collect(Collectors.toList());
        }

        return new ContextResponse(
                context.getId(),
                context.getName(),
                context.getColorCode(),
                context.getIsActive(),
                context.getUser().getId(),
                scheduleItems
        );
    }
}
