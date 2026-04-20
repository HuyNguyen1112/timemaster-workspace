package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.dto.TaskResponse;

import java.time.LocalDate;
import java.util.List;

public interface TaskService {

    // Thêm mới một công việc
    TaskResponse createTask(Long userId, TaskRequest request);

    // Lấy danh sách toàn bộ công việc của một người dùng
    List<TaskResponse> getAllTasksByUser(Long userId);

    // Lấy danh sách công việc của người dùng theo ngày
    List<TaskResponse> getTasksByDate(Long userId, LocalDate targetDate);

    // Đánh dấu hoàn thành công việc
    TaskResponse completeTask(Long taskId, Long userId);

    // Xóa công việc
    void deleteTask(Long taskId, Long userId);

    // Cập nhật công việc
    TaskResponse updateTask(Long taskId, Long userId, TaskRequest request);
}
