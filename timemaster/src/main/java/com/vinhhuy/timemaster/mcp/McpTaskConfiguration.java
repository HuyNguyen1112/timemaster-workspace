package com.vinhhuy.timemaster.mcp;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.service.TaskService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalTime;

@Configuration
@Slf4j
public class McpTaskConfiguration {

        public record McpCreateTaskParams(
                        Long userId,
                        String title,
                        String description,
                        LocalDate targetDate,
                        LocalTime startTime,
                        Double estimatedDuration,
                        String matrixType,
                        Long categoryId,
                        Boolean force) {
        }

        public record UserIdParam(Long userId) {
        }

        public record TaskIdUserParams(Long taskId, Long userId) {
        }

        public record UserDateParams(Long userId, LocalDate targetDate) {
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
                                        log.info(">>> MCP TOOL [mcpCreateTask]: userId={}, title={}", params.userId(), params.title());
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
                                .description("Tạo mới một công việc (Task). BẮT BUỘC cung cấp userId (lấy từ USER_CONTEXT_JSON). Các tham số khác: title, targetDate (ngày thực hiện), startTime (giờ bắt đầu), estimatedDuration (thời lượng dự kiến), matrixType (Q1, Q2, Q3, Q4), force (true nếu muốn lưu đè khi trùng lịch). LƯU Ý: estimatedDuration và matrixType là TÙY CHỌN, AI tự dự đoán dựa trên tính chất công việc.")
                                .inputType(McpCreateTaskParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpGetTasksTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpGetTasks", (UserIdParam params) -> {
                                        log.info(">>> MCP TOOL [mcpGetTasks]: userId={}", params.userId());
                                        return taskService.getAllTasksByUser(params.userId());
                                })
                                .description("Lấy danh sách TẤT CẢ công việc của người dùng hiện tại. BẮT BUỘC cung cấp userId (lấy từ USER_CONTEXT_JSON).")
                                .inputType(UserIdParam.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpGetTasksByDateTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpGetTasksByDate", (UserDateParams params) -> {
                                        log.info(">>> MCP TOOL [mcpGetTasksByDate]: userId={}, date={}", params.userId(), params.targetDate());
                                        return taskService.getTasksByDate(params.userId(), params.targetDate());
                                })
                                .description("Lấy danh sách công việc của người dùng theo một ngày cụ thể (targetDate). BẮT BUỘC cung cấp userId (lấy từ USER_CONTEXT_JSON).")
                                .inputType(UserDateParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpCompleteTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpCompleteTask", (TaskIdUserParams params) -> {
                                        log.info(">>> MCP TOOL [mcpCompleteTask]: taskId={}, userId={}", params.taskId(), params.userId());
                                        return taskService.completeTask(params.taskId(), params.userId());
                                })
                                .description("Đánh dấu hoàn thành một công việc. BẮT BUỘC cung cấp taskId và userId (lấy từ USER_CONTEXT_JSON).")
                                .inputType(TaskIdUserParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpDeleteTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpDeleteTask", (TaskIdUserParams params) -> {
                                        log.info(">>> MCP TOOL [mcpDeleteTask]: taskId={}, userId={}", params.taskId(), params.userId());
                                        taskService.deleteTask(params.taskId(), params.userId());
                                        return "Đã xóa thành công Task ID: " + params.taskId();
                                })
                                .description("Xóa một công việc vĩnh viễn. BẮT BUỘC cung cấp taskId và userId (lấy từ USER_CONTEXT_JSON).")
                                .inputType(TaskIdUserParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpUpdateTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpUpdateTask", (McpUpdateTaskParams params) -> {
                                        log.info(">>> MCP TOOL [mcpUpdateTask]: taskId={}, userId={}", params.taskId(), params.userId());
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
                                .description("Cập nhật lại công việc đã tồn tại. BẮT BUỘC cung cấp taskId và userId (lấy từ USER_CONTEXT_JSON).")
                                .inputType(McpUpdateTaskParams.class)
                                .build();
        }
}
