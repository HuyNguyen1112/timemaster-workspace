package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.entity.Category;
import com.vinhhuy.timemaster.entity.Task;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.mapper.TaskMapper;
import com.vinhhuy.timemaster.repository.CategoryRepository;
import com.vinhhuy.timemaster.repository.TaskRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    // Nhờ @RequiredArgsConstructor của Lombok, Spring sẽ tự động Inject các Bean này
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TaskMapper taskMapper;

    @Override
    @Transactional
    public TaskResponse createTask(Long userId, TaskRequest request) {
        // 1. Kiểm tra xem User có tồn tại không
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        // 2. Khởi tạo Entity Task mới
        Task task = new Task();
        task.setUser(user);
        task.setTitle(request.title());
        task.setStartTime(request.startTime());
        task.setEstimatedDuration(request.estimatedDuration());

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
        return taskMapper.toResponse(savedTask);
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
    @Transactional
    public TaskResponse completeTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc với ID: " + taskId));

        // Kiểm tra bảo mật: Tránh việc User này đi sửa công việc của User khác
        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa công việc này.");
        }

        task.setStatus(Task.TaskStatus.COMPLETED);
        Task updatedTask = taskRepository.save(task);

        return taskMapper.toResponse(updatedTask);
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

        taskRepository.delete(task);
    }
}
