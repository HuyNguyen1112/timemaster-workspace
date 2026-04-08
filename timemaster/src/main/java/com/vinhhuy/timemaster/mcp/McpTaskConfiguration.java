package com.vinhhuy.timemaster.mcp;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.service.TaskService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;

import java.util.List;
import java.util.function.Function;

@Configuration
public class McpTaskConfiguration {

    public record McpCreateTaskParams(
            Long userId,
            String title,
            java.time.LocalDate targetDate,
            java.time.LocalTime startTime,
            Double estimatedDuration,
            String matrixType,
            Long categoryId,
            Boolean force
    ) {}

    public record UserIdParam(Long userId) {}
    public record TaskIdUserParams(Long taskId, Long userId) {}

    public record McpUpdateTaskParams(
            Long taskId,
            Long userId,
            String title,
            java.time.LocalDate targetDate,
            java.time.LocalTime startTime,
            Double estimatedDuration,
            String matrixType,
            Long categoryId,
            Boolean force
    ) {}

    @Bean
    public org.springframework.ai.tool.ToolCallback mcpCreateTaskTool(TaskService taskService) {
        return org.springframework.ai.tool.function.FunctionToolCallback
                .builder("mcpCreateTask", (McpCreateTaskParams params) -> {
                    TaskRequest request = new TaskRequest(
                            params.title(),
                            params.targetDate(),
                            params.startTime(),
                            params.estimatedDuration(),
                            params.matrixType(),
                            params.categoryId(),
                            params.force() != null && params.force()
                    );
                    return taskService.createTask(params.userId(), request);
                })
                .description("Tạo mới một công việc (Task). Các tham số: title, targetDate (ngày thực hiện), startTime (giờ bắt đầu), estimatedDuration (thời lượng dự kiến), matrixType (Q1, Q2, Q3, Q4), force (true nếu muốn lưu đè khi trùng lịch).")
                .inputType(McpCreateTaskParams.class)
                .build();
    }

    @Bean
    public org.springframework.ai.tool.ToolCallback mcpGetTasksTool(TaskService taskService) {
        return org.springframework.ai.tool.function.FunctionToolCallback
                .builder("mcpGetTasks", (UserIdParam params) -> taskService.getAllTasksByUser(params.userId()))
                .description("Lấy danh sách TẤT CẢ công việc (Tasks) của người dùng hiện tại dựa vào userId.")
                .inputType(UserIdParam.class)
                .build();
    }

    @Bean
    public org.springframework.ai.tool.ToolCallback mcpCompleteTaskTool(TaskService taskService) {
        return org.springframework.ai.tool.function.FunctionToolCallback
                .builder("mcpCompleteTask",
                        (TaskIdUserParams params) -> taskService.completeTask(params.taskId(), params.userId()))
                .description("Đánh dấu hoàn thành một công việc (Task) bằng taskId và userId hợp lệ.")
                .inputType(TaskIdUserParams.class)
                .build();
    }

    @Bean
    public org.springframework.ai.tool.ToolCallback mcpDeleteTaskTool(TaskService taskService) {
        return org.springframework.ai.tool.function.FunctionToolCallback
                .builder("mcpDeleteTask", (TaskIdUserParams params) -> {
                    taskService.deleteTask(params.taskId(), params.userId());
                    return "Đã xóa thành công Task ID: " + params.taskId();
                })
                .description("Xóa một công việc (Task) vĩnh viễn khỏi hệ thống bằng taskId và userId hợp lệ.")
                .inputType(TaskIdUserParams.class)
                .build();
    }

    @Bean
    public org.springframework.ai.tool.ToolCallback mcpUpdateTaskTool(TaskService taskService) {
        return org.springframework.ai.tool.function.FunctionToolCallback
                .builder("mcpUpdateTask", (McpUpdateTaskParams params) -> {
                    TaskRequest request = new TaskRequest(
                            params.title(),
                            params.targetDate(),
                            params.startTime(),
                            params.estimatedDuration(),
                            params.matrixType(),
                            params.categoryId(),
                            params.force() != null && params.force()
                    );
                    return taskService.updateTask(params.taskId(), params.userId(), request);
                })
                .description("Cập nhật lại thời gian, tiêu đề, hoặc phân loại của một công việc (Task) đã tồn tại. Dùng force=true nếu muốn lưu đè khi bị trùng lịch.")
                .inputType(McpUpdateTaskParams.class)
                .build();
    }
}

