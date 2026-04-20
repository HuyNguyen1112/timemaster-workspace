package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.entity.Category;
import com.vinhhuy.timemaster.entity.Task;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.mapper.TaskMapper;
import com.vinhhuy.timemaster.exception.ConflictException;
import com.vinhhuy.timemaster.repository.CategoryRepository;
import com.vinhhuy.timemaster.repository.TaskRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.TaskService;
import com.vinhhuy.timemaster.service.VectorSyncService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TaskMapper taskMapper;
    private final VectorSyncService vectorSyncService;
    private final HttpServletRequest httpServletRequest;

    @Override
    @Transactional
    public TaskResponse createTask(Long userId, TaskRequest request) {
        // 1. Kiểm tra xem User có tồn tại không
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        // 2. Kiểm tra thời gian thực hiện (không cho phép quá khứ)
        LocalDateTime startDateTime = LocalDateTime.of(request.targetDate(), request.startTime());
        if (startDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Thời gian thực hiện không thể ở quá khứ.");
        }

        // Kiểm tra trùng lịch (Overlap)
        validateTimeOverlap(userId, request.targetDate(), request.startTime(), request.estimatedDuration(), null,
                request.force());

        // 3. Khởi tạo Entity Task mới
        Task task = new Task();
        task.setUser(user);
        task.setTitle(request.title());
        task.setTargetDate(request.targetDate());
        task.setStartTime(request.startTime());
        task.setEstimatedDuration(request.estimatedDuration());
        task.setDescription(request.description());

        // Chuyển từ String (Q1, Q2) sang Enum
        try {
            task.setMatrixType(Task.MatrixType.valueOf(request.matrixType().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Loại ma trận không hợp lệ. Vui lòng chọn Q1, Q2, Q3 hoặc Q4.");
        }

        task.setStatus(Task.TaskStatus.PENDING); // Mặc định là đang chờ xử lý

        // 3. Xử lý Category nếu người dùng có truyền lên
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + request.categoryId()));
            task.setCategory(category);
        }

        // 4. Lưu xuống Database và map sang Response
        Task savedTask = taskRepository.save(task);
        TaskResponse response = taskMapper.toResponse(savedTask);

        // 5. Đồng bộ sang AI Vector Store (Async)
        // Luôn gọi đồng bộ, VectorSyncServiceImpl sẽ tự dùng Secret nếu authHeader null
        String authHeader = getAuthHeaderSafely();
        vectorSyncService.syncToAi(response, authHeader);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasksByUser(Long userId) {
        List<Task> tasks = taskRepository.findByUserId(userId);

        // Dùng Stream API để map toàn bộ danh sách Entity sang DTO
        return tasks.stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByDate(Long userId, LocalDate targetDate) {
        List<Task> tasks = taskRepository.findByUserIdAndTargetDate(userId, targetDate);

        return tasks.stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskResponse completeTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc với ID: " + taskId));

        // Kiểm tra bảo mật
        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa công việc này.");
        }

        // Đảo trạng thái (Toggle)
        if (task.getStatus() == Task.TaskStatus.COMPLETED) {
            task.setStatus(Task.TaskStatus.PENDING);
        } else {
            task.setStatus(Task.TaskStatus.COMPLETED);
        }

        Task updatedTask = taskRepository.save(task);
        TaskResponse response = taskMapper.toResponse(updatedTask);

        // Notify AI of status change
        String authHeader = getAuthHeaderSafely();
        vectorSyncService.syncToAi(response, authHeader);

        return response;
    }

    @Override
    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc với ID: " + taskId));

        // Kiểm tra bảo mật trước khi xóa
        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa công việc này.");
        }

        // Notify AI before deletion (always sync, VectorSyncService handles null auth
        // via internal secret)
        String authHeader = getAuthHeaderSafely();
        vectorSyncService.deleteFromAi(task.getId(), authHeader);

        taskRepository.delete(task);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long taskId, Long userId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc với ID: " + taskId));

        // Kiểm tra bảo mật
        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền sửa công việc này.");
        }

        // Kiểm tra thời gian thực hiện
        LocalDateTime startDateTime = LocalDateTime.of(request.targetDate(), request.startTime());
        if (startDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Thời gian thực hiện không thể ở quá khứ.");
        }

        // Kiểm tra trùng lịch (Overlap)
        validateTimeOverlap(userId, request.targetDate(), request.startTime(), request.estimatedDuration(), taskId,
                request.force());

        task.setTitle(request.title());
        task.setTargetDate(request.targetDate());
        task.setStartTime(request.startTime());
        task.setEstimatedDuration(request.estimatedDuration());
        task.setDescription(request.description());

        try {
            task.setMatrixType(Task.MatrixType.valueOf(request.matrixType().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Loại ma trận không hợp lệ.");
        }

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + request.categoryId()));
            task.setCategory(category);
        } else {
            task.setCategory(null);
        }

        Task updatedTask = taskRepository.save(task);
        TaskResponse response = taskMapper.toResponse(updatedTask);

        // Đồng bộ cập nhật sang AI Vector Store (Async)
        String authHeader = getAuthHeaderSafely();
        vectorSyncService.syncToAi(response, authHeader);

        return response;
    }

    private void validateTimeOverlap(Long userId, LocalDate targetDate, LocalTime startTime, Double duration,
            Long excludeTaskId, boolean force) {
        if (force)
            return;

        List<Task> existingTasks = taskRepository.findByUserIdAndTargetDate(userId, targetDate);
        LocalTime newStart = startTime;
        LocalTime newEnd = startTime.plusMinutes((long) (duration * 60));

        List<String> conflicts = existingTasks.stream()
                .filter(t -> !t.getId().equals(excludeTaskId))
                .filter(t -> {
                    LocalTime exStart = t.getStartTime();
                    LocalTime exEnd = exStart.plusMinutes((long) (t.getEstimatedDuration() * 60));
                    // Công thức giao thoa: (newStart < exEnd) && (exStart < newEnd)
                    return newStart.isBefore(exEnd) && exStart.isBefore(newEnd);
                })
                .map(t -> {
                    LocalTime exStart = t.getStartTime();
                    long totalMinutes = (long) (t.getEstimatedDuration() * 60);

                    String timeInfo;
                    if (newStart.isAfter(exStart) || newStart.equals(exStart)) {
                        // Tính thời gian còn lại của việc cũ tại thời điểm bắt đầu việc mới
                        long elapsedMinutes = java.time.Duration.between(exStart, newStart).toMinutes();
                        long remainingMinutes = totalMinutes - elapsedMinutes;
                        timeInfo = String.format("đang làm, còn khoảng %d phút mới xong", remainingMinutes);
                    } else {
                        // Việc cũ sảy ra sau việc mới
                        timeInfo = String.format("bắt đầu lúc %s", exStart);
                    }
                    return String.format("%s (%s)", t.getTitle(), timeInfo);
                })
                .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            throw new ConflictException("CONFLICT: Trùng lịch với các công việc khác.", conflicts);
        }
    }

    /**
     * Lấy token an toàn từ Request.
     * Tránh lỗi "No thread-bound request found" khi gọi từ MCP.
     */
    private String getAuthHeaderSafely() {
        try {
            return httpServletRequest.getHeader("Authorization");
        } catch (Exception e) {
            return null;
        }
    }
}
