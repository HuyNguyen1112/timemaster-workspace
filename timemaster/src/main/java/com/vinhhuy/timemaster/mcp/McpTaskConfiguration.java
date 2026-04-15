package com.vinhhuy.timemaster.mcp;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.service.TaskService;

import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpTaskConfiguration {

        public record McpCreateTaskParams(
                        Long userId,
                        String title,
                        String description,
                        java.time.LocalDate targetDate,
                        java.time.LocalTime startTime,
                        Double estimatedDuration,
                        String matrixType,
                        Long categoryId,
                        Boolean force) {
        }

        public record UserIdParam(Long userId) {
        }

        public record TaskIdUserParams(Long taskId, Long userId) {
        }

        public record UserDateParams(Long userId, java.time.LocalDate targetDate) {
        }

        public record McpUpdateTaskParams(
                        Long taskId,
                        Long userId,
                        String title,
                        String description,
                        java.time.LocalDate targetDate,
                        java.time.LocalTime startTime,
                        Double estimatedDuration,
                        String matrixType,
                        Long categoryId,
                        Boolean force) {
        }

        @Bean
        public ToolCallback mcpCreateTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpCreateTask", (McpCreateTaskParams params) -> {
                                        TaskRequest request = new TaskRequest(
                                                        params.title(),
                                                        params.description(),
                                                        params.targetDate(),
                                                        params.startTime(),
                                                        params.estimatedDuration(),
                                                        params.matrixType(),
                                                        params.categoryId(),
                                                        params.force() != null && params.force());
                                        return taskService.createTask(params.userId(), request);
                                })
                                .description("Tạo mới một công việc (Task). Các tham số: title, targetDate (ngày thực hiện), startTime (giờ bắt đầu), estimatedDuration (thời lượng dự kiến), matrixType (Q1, Q2, Q3, Q4), force (true nếu muốn lưu đè khi trùng lịch).")
                                .inputType(McpCreateTaskParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpGetTasksTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpGetTasks",
                                                (UserIdParam params) -> taskService.getAllTasksByUser(params.userId()))
                                .description("Lấy danh sách TẤT CẢ công việc (Tasks) của người dùng hiện tại dựa vào userId.")
                                .inputType(UserIdParam.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpGetTasksByDateTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpGetTasksByDate",
                                                (UserDateParams params) -> taskService.getTasksByDate(params.userId(), params.targetDate()))
                                .description("Lấy danh sách công việc (Tasks) của người dùng theo một ngày cụ thể (targetDate). Dùng tool này khi user hỏi về công việc của một ngày nhất định như 'hôm nay', 'ngày mai', hoặc một ngày cụ thể.")
                                .inputType(UserDateParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpCompleteTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpCompleteTask",
                                                (TaskIdUserParams params) -> taskService.completeTask(params.taskId(),
                                                                params.userId()))
                                .description("Đánh dấu hoàn thành một công việc (Task) bằng taskId và userId hợp lệ.")
                                .inputType(TaskIdUserParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpDeleteTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpDeleteTask", (TaskIdUserParams params) -> {
                                        taskService.deleteTask(params.taskId(), params.userId());
                                        return "Đã xóa thành công Task ID: " + params.taskId();
                                })
                                .description("Xóa một công việc (Task) vĩnh viễn khỏi hệ thống bằng taskId và userId hợp lệ.")
                                .inputType(TaskIdUserParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpUpdateTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpUpdateTask", (McpUpdateTaskParams params) -> {
                                        TaskRequest request = new TaskRequest(
                                                        params.title(),
                                                        params.description(),
                                                        params.targetDate(),
                                                        params.startTime(),
                                                        params.estimatedDuration(),
                                                        params.matrixType(),
                                                        params.categoryId(),
                                                        params.force() != null && params.force());
                                        return taskService.updateTask(params.taskId(), params.userId(), request);
                                })
                                .description("Cập nhật lại thời gian, tiêu đề, hoặc phân loại của một công việc (Task) đã tồn tại. Dùng force=true nếu muốn lưu đè khi bị trùng lịch.")
                                .inputType(McpUpdateTaskParams.class)
                                .build();
        }
}
