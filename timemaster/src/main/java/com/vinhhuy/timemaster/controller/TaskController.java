package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.security.SecurityUtils;
import com.vinhhuy.timemaster.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * API: Lấy danh sách công việc của người dùng hiện tại
     * GET /api/tasks
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<TaskResponse> tasks = taskService.getAllTasksByUser(userId);
        return ResponseEntity.ok(tasks);
    }

    /**
     * API: Lấy danh sách công việc theo ngày
     * GET /api/tasks/by-date?targetDate=2026-04-14
     */
    @GetMapping("/by-date")
    public ResponseEntity<List<TaskResponse>> getTasksByDate(
            @RequestParam LocalDate targetDate) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<TaskResponse> tasks = taskService.getTasksByDate(userId, targetDate);
        return ResponseEntity.ok(tasks);
    }

    /**
     * API: Tạo mới một công việc
     * POST /api/tasks
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody TaskRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        TaskResponse createdTask = taskService.createTask(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    /**
     * API: Cập nhật thông tin công việc
     * PUT /api/tasks/{taskId}
     */
    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        TaskResponse updatedTask = taskService.updateTask(taskId, userId, request);
        return ResponseEntity.ok(updatedTask);
    }

    /**
     * API: Đánh dấu hoàn thành công việc
     * PUT /api/tasks/{taskId}/complete
     */
    @PutMapping("/{taskId}/complete")
    public ResponseEntity<TaskResponse> completeTask(
            @PathVariable Long taskId) {
        Long userId = SecurityUtils.getCurrentUserId();
        TaskResponse completedTask = taskService.completeTask(taskId, userId);
        return ResponseEntity.ok(completedTask);
    }

    /**
     * API: Xóa công việc
     * DELETE /api/tasks/{taskId}
     */
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long taskId) {
        Long userId = SecurityUtils.getCurrentUserId();
        taskService.deleteTask(taskId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * API: Lấy danh sách công việc quá hạn
     * GET /api/tasks/overdue
     */
    @GetMapping("/overdue")
    public ResponseEntity<List<TaskResponse>> getOverdueTasks() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<TaskResponse> tasks = taskService.getOverdueTasks(userId);
        return ResponseEntity.ok(tasks);
    }

    /**
     * API: Hủy công việc
     * PUT /api/tasks/{taskId}/cancel
     */
    @PutMapping("/{taskId}/cancel")
    public ResponseEntity<TaskResponse> cancelTask(@PathVariable Long taskId) {
        Long userId = SecurityUtils.getCurrentUserId();
        TaskResponse cancelledTask = taskService.cancelTask(taskId, userId);
        return ResponseEntity.ok(cancelledTask);
    }
}