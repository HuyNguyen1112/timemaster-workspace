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
import java.util.ArrayList;
import java.util.stream.Collectors;
import com.vinhhuy.timemaster.mapper.ContextMapper;

@Service
@RequiredArgsConstructor
public class ContextServiceImpl implements ContextService {

    private final ContextRepository contextRepository;
    private final ContextScheduleRepository contextScheduleRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final ContextMapper contextMapper;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private SchedulingService schedulingService;

    @Override
    @Transactional(readOnly = true)
    public List<ContextResponse> getAll(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        List<Context> contexts = contextRepository.findByUserId(userId);

        return contexts.stream()
                .map(contextMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContextResponse createContext(Long userId, ContextRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        // Validate schedules before saving Context
        if (request.schedules() != null) {
            for (ContextScheduleRequest schReq : request.schedules()) {
                LocalTime newStart = LocalTime.parse(schReq.startTime());
                LocalTime newEnd = LocalTime.parse(schReq.endTime());
                validateNoOverlap(userId, schReq.dayOfWeek(), newStart, newEnd, schReq.startTime(), schReq.endTime(),
                        null);
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

        return contextMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ContextResponse updateContext(Long contextId, Long userId, ContextRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

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
                validateNoOverlap(userId, schReq.dayOfWeek(), newStart, newEnd, schReq.startTime(), schReq.endTime(),
                        contextId);
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

        return contextMapper.toResponse(contextRepository.findById(contextId).orElseThrow());
    }

    @Override
    @Transactional
    public void deleteContext(Long contextId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        Context context = contextRepository.findById(contextId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Context với ID: " + contextId));

        if (!context.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa Context này.");
        }

        if (taskRepository.countByContextId(contextId) > 0) {
            throw new RuntimeException(
                    "Không thể xóa danh mục này vì đang có công việc được phân bổ vào đây. Bạn hãy đổi danh mục của các công việc đó sang danh mục khác trước khi xóa.");
        }

        if (eventRepository.countByContextId(contextId) > 0) {
            throw new RuntimeException(
                    "Không thể xóa danh mục này vì đang có sự kiện (event) gắn liền với nó. Bạn hãy xóa hoặc đổi danh mục của sự kiện đó trước.");
        }

        contextRepository.delete(context);
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
}
