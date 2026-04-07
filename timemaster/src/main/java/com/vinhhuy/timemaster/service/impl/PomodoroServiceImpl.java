package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.PomodoroRequest;
import com.vinhhuy.timemaster.dto.PomodoroResponse;
import com.vinhhuy.timemaster.entity.PomodoroSession;
import com.vinhhuy.timemaster.entity.Task;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.mapper.PomodoroMapper;
import com.vinhhuy.timemaster.repository.PomodoroSessionRepository;
import com.vinhhuy.timemaster.repository.TaskRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.PomodoroService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PomodoroServiceImpl implements PomodoroService {

    private final PomodoroSessionRepository pomodoroRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final PomodoroMapper pomodoroMapper;

    @Override
    @Transactional
    public PomodoroResponse saveSession(Long userId, PomodoroRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        PomodoroSession session = new PomodoroSession();
        session.setUser(user);
        session.setStartTime(request.startTime());
        session.setEndTime(request.endTime());
        session.setDurationMinutes(request.durationMinutes());

        try {
            session.setStatus(PomodoroSession.SessionStatus.valueOf(request.status().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái Pomodoro không hợp lệ. Chỉ chấp nhận COMPLETED hoặc INTERRUPTED.");
        }

        // Xử lý nếu người dùng có gán Pomodoro này cho một công việc cụ thể
        if (request.taskId() != null) {
            Task task = taskRepository.findById(request.taskId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc với ID: " + request.taskId()));

            // Bảo mật: Đảm bảo công việc này thuộc về đúng user đang chạy Pomodoro
            if (!task.getUser().getId().equals(userId)) {
                throw new RuntimeException("Bạn không có quyền thao tác với công việc này.");
            }
            session.setTask(task);
        }

        PomodoroSession savedSession = pomodoroRepository.save(session);
        return pomodoroMapper.toResponse(savedSession);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PomodoroResponse> getSessionsByUser(Long userId) {
        return pomodoroRepository.findByUserId(userId)
                .stream()
                .map(pomodoroMapper::toResponse)
                .collect(Collectors.toList());
    }
}
