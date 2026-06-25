package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.entity.Task;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.mapper.TaskMapper;
import com.vinhhuy.timemaster.repository.ContextRepository;
import com.vinhhuy.timemaster.repository.EventRepository;
import com.vinhhuy.timemaster.repository.TaskRepository;
import com.vinhhuy.timemaster.repository.TimeBlockRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.SchedulingService;
import com.vinhhuy.timemaster.service.TaskService;
import com.vinhhuy.timemaster.service.VectorSyncService;
import com.vinhhuy.timemaster.entity.Event;
import com.vinhhuy.timemaster.entity.TimeBlock;
import com.vinhhuy.timemaster.entity.Context;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ContextRepository contextRepository;
    private final EventRepository eventRepository;
    private final TimeBlockRepository timeBlockRepository;
    private final TaskMapper taskMapper;
    private final VectorSyncService vectorSyncService;
    private final HttpServletRequest httpServletRequest;

    @Autowired @Lazy
    private SchedulingService schedulingService;

    @Override
    @Transactional
    public TaskResponse createTask(Long userId, TaskRequest request) {
        // 1. Kiểm tra xem User có tồn tại không
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        // 2. Validate cơ bản
        if (request.targetDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Ngày thực hiện không thể ở quá khứ.");
        }

        Task task = new Task();
        task.setUser(user);
        task.setTitle(request.title());
        task.setTargetDate(request.targetDate());
        task.setEstimatedDuration(request.estimatedDuration() != null ? request.estimatedDuration() : 1.0);
        task.setRemainingDuration(task.getEstimatedDuration() != null ? (int) (task.getEstimatedDuration() * 60) : 60);
        task.setDescription(request.description());
        
        task.setIsFixed(request.isFixed() != null ? request.isFixed() : false);
        task.setStartTime(request.startTime());

        // Chuyển từ String (Q1, Q2) sang Enum với giá trị mặc định là Q4
        String mType = (request.matrixType() != null && !request.matrixType().isBlank())
                ? request.matrixType().toUpperCase()
                : "Q4";
        try {
            task.setMatrixType(Task.MatrixType.valueOf(mType));
        } catch (IllegalArgumentException e) {
            task.setMatrixType(Task.MatrixType.Q4);
        }

        task.setStatus(Task.TaskStatus.PENDING); // Mặc định là đang chờ xử lý

        // Xử lý Context
        if (task.getIsFixed()) {
            // Fixed Task không cần context
            task.setContext(null);
            
            // Validate xem có startTime không
            if (task.getStartTime() == null) {
                throw new RuntimeException("Công việc cố định yêu cầu giờ bắt đầu (startTime).");
            }
            
            // Validate trùng Event, Fixed Task, Pinned TimeBlock
            LocalDateTime taskStart = LocalDateTime.of(task.getTargetDate(), task.getStartTime());
            LocalDateTime taskEnd = taskStart.plusMinutes(task.getRemainingDuration());
            
            validateFixedTimeOverlap(userId, taskStart, taskEnd, null);
        } else {
            // Flex Task bắt buộc có context
            if (request.contextId() != null) {
                Context context = contextRepository.findById(request.contextId())
                        .orElseThrow(() -> new RuntimeException(
                                "Không tìm thấy ngữ cảnh (Context) với ID: " + request.contextId()));
                task.setContext(context);
            } else {
                throw new RuntimeException("Context là bắt buộc cho công việc linh hoạt (Flex Task).");
            }
        }

        // 4. Lưu xuống Database và map sang Response
        Task savedTask = taskRepository.save(task);

        TaskResponse response = taskMapper.toResponse(savedTask);

        // 5. Đồng bộ sang AI Vector Store
        String authHeader = getAuthHeaderSafely();
        vectorSyncService.syncToAi(response, authHeader);

        // 6. Xử lý Auto-schedule
        if (savedTask.getIsFixed()) {
            // Fixed Task ko thuoc context nao nhưng chiếm slot, nên chạy auto-schedule lại
            schedulingService.triggerAutoSchedule(userId, null, savedTask.getTargetDate());
        } else {
            // Nếu là Flex Task -> Chạy auto-schedule cho context đó
            schedulingService.triggerAutoSchedule(userId, savedTask.getContext().getId(), savedTask.getTargetDate());
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasksByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        List<Task> tasks = taskRepository.findByUserId(userId);

        // Dùng Stream API để map toàn bộ danh sách Entity sang DTO
        return tasks.stream()
                .filter(task -> task.getStatus() != Task.TaskStatus.CANCELLED || (task.getTargetDate() != null && !task.getTargetDate().isAfter(LocalDate.now())))
                .filter(task -> {
                    boolean isOverdue = task.getTargetDate() != null
                            && task.getTargetDate().isBefore(LocalDate.now())
                            && task.getStatus() != Task.TaskStatus.COMPLETED;
                    return !isOverdue;
                })
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByDate(Long userId, LocalDate targetDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        List<Task> tasks = taskRepository.findByUserIdAndTargetDate(userId, targetDate);

        return tasks.stream()
                .filter(task -> task.getStatus() != Task.TaskStatus.CANCELLED || !targetDate.isAfter(LocalDate.now()))
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskResponse completeTask(Long taskId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        // Thiết kế cứng rắn: KHÔNG cho phép bấm nút hoàn thành bằng tay.
        // Bắt buộc phải chứng minh bằng thời gian thực tế qua Pomodoro.
        throw new RuntimeException("Tính năng hoàn thành thủ công đã bị vô hiệu hóa. Bạn bắt buộc phải dùng đồng hồ Pomodoro để chứng minh thời gian hoàn thành công việc!");
    }

    @Override
    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        log.info(">>> [CORE SERVICE] Request to delete Task ID: {} from User ID: {}", taskId, userId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc với ID: " + taskId));

        // Kiểm tra bảo mật trước khi xóa
        if (!task.getUser().getId().equals(userId)) {
            log.error(">>> [CORE SERVICE] SECURITY ALERT: User {} attempted to delete Task {} owned by {}",
                    userId, taskId, task.getUser().getId());
            throw new RuntimeException("Bạn không có quyền xóa công việc này.");
        }

        try {
            // Notify AI before deletion
            log.info(">>> [CORE SERVICE] Notifying AI to remove Task ID: {}", task.getId());
            String authHeader = getAuthHeaderSafely();
            vectorSyncService.deleteFromAi(task.getId(), authHeader);

            log.info(">>> [CORE SERVICE] Executing DB delete for Task ID: {}", taskId);
            Long contextId = task.getContext() != null ? task.getContext().getId() : null;
            taskRepository.delete(task);
            log.info(">>> [CORE SERVICE] DELETION SUCCESSFUL in DB for Task ID: {}", taskId);

            // Auto-schedule
            schedulingService.triggerAutoSchedule(userId, contextId, task.getTargetDate());
        } catch (Exception e) {
            log.error(">>> [CORE SERVICE] DELETION FAILED for Task ID: {}. Reason: {}", taskId, e.getMessage(), e);
            throw e; // Trigger Rollback
        }
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long taskId, Long userId, TaskRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc với ID: " + taskId));

        // Kiểm tra bảo mật
        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền sửa công việc này.");
        }

        // Kiểm tra thời gian thực hiện
        if (request.targetDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Ngày thực hiện không thể ở quá khứ.");
        }

        task.setTitle(request.title());
        task.setTargetDate(request.targetDate());
        
        Double oldEst = task.getEstimatedDuration() != null ? task.getEstimatedDuration() : 1.0;
        Double newEst = request.estimatedDuration() != null ? request.estimatedDuration() : 1.0;
        if (!oldEst.equals(newEst)) {
            task.setEstimatedDuration(newEst);
            int deltaMinutes = (int) Math.round((newEst - oldEst) * 60);
            int currentRemaining = task.getRemainingDuration() != null ? task.getRemainingDuration() : (int) Math.round(oldEst * 60);
            task.setRemainingDuration(Math.max(0, currentRemaining + deltaMinutes));
        }
        
        task.setDescription(request.description());

        // Kiểm tra loại công việc (Flex vs Fixed)
        Boolean reqIsFixed = request.isFixed();
        if (reqIsFixed != null && !reqIsFixed.equals(task.getIsFixed())) {
            throw new RuntimeException("Không thể chuyển đổi công việc từ linh hoạt (Flex) sang cố định (Fixed) hoặc ngược lại.");
        }
        
        if (task.getIsFixed()) {
            task.setStartTime(request.startTime());
        }

        String mType = (request.matrixType() != null && !request.matrixType().isBlank())
                ? request.matrixType().toUpperCase()
                : "Q4";
        try {
            task.setMatrixType(Task.MatrixType.valueOf(mType));
        } catch (IllegalArgumentException e) {
            task.setMatrixType(Task.MatrixType.Q4);
        }

        // Xử lý Context
        if (task.getIsFixed()) {
            task.setContext(null);
            if (task.getStartTime() == null) {
                throw new RuntimeException("Công việc cố định yêu cầu giờ bắt đầu (startTime).");
            }
            
            // Validate trùng lặp
            LocalDateTime taskStart = LocalDateTime.of(task.getTargetDate(), task.getStartTime());
            int remainingDuration = task.getEstimatedDuration() != null ? (int) (task.getEstimatedDuration() * 60) : 60;
            LocalDateTime taskEnd = taskStart.plusMinutes(remainingDuration);
            
            validateFixedTimeOverlap(userId, taskStart, taskEnd, taskId);
        } else {
            if (request.contextId() != null) {
                Context context = contextRepository.findById(request.contextId())
                        .orElseThrow(() -> new RuntimeException(
                                "Không tìm thấy ngữ cảnh (Context) với ID: " + request.contextId()));
                task.setContext(context);
            } else {
                throw new RuntimeException("Context là bắt buộc cho công việc linh hoạt (Flex Task).");
            }
        }


        Task updatedTask = taskRepository.save(task);

        TaskResponse response = taskMapper.toResponse(updatedTask);

        // Đồng bộ cập nhật sang AI Vector Store
        String authHeader = getAuthHeaderSafely();
        vectorSyncService.syncToAi(response, authHeader);

        // Xóa tất cả TimeBlocks cũ CỦA CÁC SLOT CHƯA KHÓA
        timeBlockRepository.deleteUnlockedByTaskId(updatedTask.getId());

        // 6. Auto-schedule
        if (updatedTask.getIsFixed()) {
            schedulingService.triggerAutoSchedule(userId, null, updatedTask.getTargetDate());
        } else {
            schedulingService.triggerAutoSchedule(userId, updatedTask.getContext().getId(), updatedTask.getTargetDate());
        }

        return response;
    }
    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getOverdueTasks(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        List<Task> overdueTasks = taskRepository.findOverdueTasks(userId, LocalDate.now());
        return overdueTasks.stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskResponse cancelTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Không có quyền hủy công việc này");
        }

        task.setStatus(Task.TaskStatus.CANCELLED);
        task = taskRepository.save(task);

        // Notify vector DB of change
        String authHeader = getAuthHeaderSafely();
        if (authHeader != null) {
            vectorSyncService.syncToAi(taskMapper.toResponse(task), authHeader);
        }

        // Xóa tất cả các TimeBlock trong tương lai để không hiện trên lịch nữa
        timeBlockRepository.deleteFutureByTaskId(task.getId(), LocalDateTime.now());

        // Chạy lại auto-schedule để dồn task khác lên lấp chỗ trống
        Long contextId = task.getContext() != null ? task.getContext().getId() : null;
        schedulingService.triggerAutoSchedule(userId, contextId, task.getTargetDate());

        return taskMapper.toResponse(task);
    }



    private String getAuthHeaderSafely() {
        try {
            return httpServletRequest.getHeader("Authorization");
        } catch (Exception e) {
            return null;
        }
    }

    private void validateFixedTimeOverlap(Long userId, LocalDateTime start, LocalDateTime end, Long excludeTaskId) {
        LocalDate date = start.toLocalDate();
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        // 1. Kiểm tra với các Event — CHẶN LUÔN
        List<Event> events = eventRepository.findByUserIdAndStartTimeBetween(userId, dayStart, dayEnd);
        for (Event e : events) {
            if (start.isBefore(e.getEndTime()) && end.isAfter(e.getStartTime())) {
                throw new RuntimeException("Công việc cố định bị trùng lặp thời gian với sự kiện: " + e.getTitle());
            }
        }

        // 2. Kiểm tra với Fixed Tasks khác — CHẶN LUÔN
        List<Task> fixedTasks = taskRepository.findByUserIdAndTargetDateAndIsFixedTrue(userId, date);
        for (Task ft : fixedTasks) {
            if (excludeTaskId != null && ft.getId().equals(excludeTaskId)) continue;
            LocalDateTime ftStart = LocalDateTime.of(date, ft.getStartTime());
            int duration = ft.getEstimatedDuration() != null ? (int) (ft.getEstimatedDuration() * 60) : 60;
            LocalDateTime ftEnd = ftStart.plusMinutes(duration);
            if (start.isBefore(ftEnd) && end.isAfter(ftStart)) {
                throw new RuntimeException("Công việc cố định bị trùng lặp thời gian với công việc cố định khác: " + ft.getTitle());
            }
        }

        // 3. Kiểm tra với Locked (Pinned) TimeBlocks — CHẶN LUÔN
        List<TimeBlock> lockedBlocks = timeBlockRepository.findLockedBlocksByUserIdAndDateRange(userId, dayStart, dayEnd);
        for (TimeBlock tb : lockedBlocks) {
            if (excludeTaskId != null && tb.getTask().getId().equals(excludeTaskId)) continue;
            if (start.isBefore(tb.getEndTime()) && end.isAfter(tb.getStartTime())) {
                throw new RuntimeException("Công việc cố định bị trùng lặp thời gian với một khối thời gian đã ghim của công việc: " + tb.getTask().getTitle());
            }
        }

        // 4. Kiểm tra với Unlocked TimeBlocks — CHO PHÉP, nhưng sẽ reschedule sau
        // (Không throw exception, auto-schedule sẽ tự dịch chuyển các block này đi chỗ khác)
    }
}
