package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * API: Lấy danh sách công việc của một người dùng
     * GET /api/tasks?userId=1
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks(@RequestParam Long userId) {
        List<TaskResponse> tasks = taskService.getAllTasksByUser(userId);
        return ResponseEntity.ok(tasks);
    }

    /**
     * API: Tạo mới một công việc
     * POST /api/tasks?userId=1
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @RequestParam Long userId,
            @Valid @RequestBody TaskRequest request) {

        TaskResponse createdTask = taskService.createTask(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    /**
     * API: Đánh dấu hoàn thành công việc
     * PUT /api/tasks/{taskId}/complete?userId=1
     */
    @PutMapping("/{taskId}/complete")
    public ResponseEntity<TaskResponse> completeTask(
            @PathVariable Long taskId,
            @RequestParam Long userId) {

        TaskResponse completedTask = taskService.completeTask(taskId, userId);
        return ResponseEntity.ok(completedTask);
    }

    /**
     * API: Xóa công việc
     * DELETE /api/tasks/{taskId}?userId=1
     */
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long taskId,
            @RequestParam Long userId) {

        taskService.deleteTask(taskId, userId);
        return ResponseEntity.noContent().build();
    }
}