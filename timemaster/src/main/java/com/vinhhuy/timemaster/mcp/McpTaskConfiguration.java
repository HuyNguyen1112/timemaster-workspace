package com.vinhhuy.timemaster.mcp;

import com.vinhhuy.timemaster.dto.TaskRequest;
import com.vinhhuy.timemaster.service.TaskService;
import com.vinhhuy.timemaster.service.SchedulingService;
import com.vinhhuy.timemaster.service.EventService;
import com.vinhhuy.timemaster.service.ContextService;
import com.vinhhuy.timemaster.dto.ContextResponse;
import com.vinhhuy.timemaster.dto.TimeBlockResponse;
import com.vinhhuy.timemaster.repository.TimeBlockRepository;
import com.vinhhuy.timemaster.dto.EventRequest;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.stream.Collectors;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Configuration
@Slf4j
public class McpTaskConfiguration {

        public record McpCreateFlexibleTaskParams(
                        Long userId,
                        String title,
                        LocalDate targetDate,
                        Double estimatedDuration,
                        Long guessedContextId,
                        String guessedMatrixType) {
        }

        public record McpCreateFixedTaskParams(
                        Long userId,
                        String title,
                        LocalDate targetDate,
                        LocalTime startTime,
                        Double estimatedDuration,
                        Long guessedContextId,
                        String guessedMatrixType) {
        }

        public record McpCreateEventParams(
                        Long userId,
                        String title,
                        LocalDateTime startTime,
                        LocalDateTime endTime,
                        Long guessedContextId) {
        }

        public record EventIdUserParams(Long eventId, Long userId) {
        }

        public record McpUpdateEventParams(
                        Long eventId,
                        Long userId,
                        String title,
                        LocalDateTime startTime,
                        LocalDateTime endTime,
                        Long guessedContextId) {
        }

        public record RecalculateScheduleParams(
                        Long userId,
                        LocalDate date,
                        Long contextId) {
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
                        LocalDate targetDate,
                        Double estimatedDuration,
                        String matrixType,
                        Long contextId,
                        Boolean isFixed,
                        LocalTime startTime) {
        }

        @Bean
        public ToolCallback mcpGetContextsTool(ContextService contextService) {
                return FunctionToolCallback
                                .builder("mcpGetContexts", (UserIdParam params) -> {
                                        log.info(">>> MCP TOOL [mcpGetContexts]: userId={}", params.userId());
                                        return contextService.getAll(params.userId());
                                })
                                .description("Lấy danh sách các Ngữ cảnh (Context) của người dùng. Dùng công cụ này TRƯỚC KHI tạo Task/Event để BIẾT CÁC ID NGỮ CẢNH (contextId), từ đó AI TỰ ĐOÁN contextId thay vì hỏi người dùng.")
                                .inputType(UserIdParam.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpCreateFlexibleTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpCreateFlexibleTask", (McpCreateFlexibleTaskParams params) -> {
                                        log.info(">>> MCP TOOL [mcpCreateFlexibleTask]: userId={}, title={}", params.userId(), params.title());
                                        TaskRequest request = new TaskRequest(
                                                        params.title(),
                                                        "",
                                                        params.targetDate(),
                                                        params.estimatedDuration(),
                                                        params.guessedMatrixType() != null ? params.guessedMatrixType() : "Q2",
                                                        params.guessedContextId(),
                                                        false,
                                                        null);
                                        return taskService.createTask(params.userId(), request);
                                })
                                .description("DÙNG CHO CÔNG VIỆC LINH HOẠT (Chỉ có Hạn chót/Deadline, KHÔNG có giờ bắt đầu). Hệ thống sẽ Tự Động Xếp Lịch. BẮT BUỘC: title, targetDate (hạn chót), estimatedDuration (SỐ GIỜ, vd: 30 phút là 0.5). AI TỰ ĐOÁN guessedContextId và guessedMatrixType dựa trên Tiêu đề (không cần hỏi user).")
                                .inputType(McpCreateFlexibleTaskParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpCreateFixedTaskTool(TaskService taskService) {
                return FunctionToolCallback
                                .builder("mcpCreateFixedTask", (McpCreateFixedTaskParams params) -> {
                                        log.info(">>> MCP TOOL [mcpCreateFixedTask]: userId={}, title={}", params.userId(), params.title());
                                        TaskRequest request = new TaskRequest(
                                                        params.title(),
                                                        "",
                                                        params.targetDate(),
                                                        params.estimatedDuration(),
                                                        params.guessedMatrixType() != null ? params.guessedMatrixType() : "Q1",
                                                        params.guessedContextId(),
                                                        true,
                                                        params.startTime());
                                        return taskService.createTask(params.userId(), request);
                                })
                                .description("DÙNG CHO CÔNG VIỆC CỐ ĐỊNH (Bắt buộc phải làm vào 1 KHUNG GIỜ CỤ THỂ). BẮT BUỘC: title, targetDate, startTime, estimatedDuration (SỐ GIỜ, vd: 1.5). AI TỰ ĐOÁN guessedContextId và guessedMatrixType.")
                                .inputType(McpCreateFixedTaskParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpCreateEventTool(EventService eventService) {
                return FunctionToolCallback
                                .builder("mcpCreateEvent", (McpCreateEventParams params) -> {
                                        log.info(">>> MCP TOOL [mcpCreateEvent]: userId={}, title={}", params.userId(), params.title());
                                        EventRequest request = new EventRequest(
                                                params.title(),
                                                params.startTime(),
                                                params.endTime() != null ? params.endTime() : params.startTime().plusHours(1),
                                                params.guessedContextId()
                                        );
                                        return eventService.createEvent(params.userId(), request);
                                })
                                .description("DÙNG CHO SỰ KIỆN / CUỘC HẸN (Đi chơi, họp, khám bệnh, dự tiệc...). BẮT BUỘC: title, startTime, endTime. AI TỰ ĐOÁN guessedContextId.")
                                .inputType(McpCreateEventParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpGetEventsByDateTool(EventService eventService) {
                return FunctionToolCallback
                                .builder("mcpGetEventsByDate", (UserDateParams params) -> {
                                        log.info(">>> MCP TOOL [mcpGetEventsByDate]: userId={}, date={}", params.userId(), params.targetDate());
                                        return eventService.getEventsByDate(params.userId(), params.targetDate());
                                })
                                .description("Lấy danh sách Sự kiện / Cuộc hẹn của người dùng trong một ngày cụ thể. BẮT BUỘC cung cấp userId và targetDate.")
                                .inputType(UserDateParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpUpdateEventTool(EventService eventService) {
                return FunctionToolCallback
                                .builder("mcpUpdateEvent", (McpUpdateEventParams params) -> {
                                        log.info(">>> MCP TOOL [mcpUpdateEvent]: eventId={}, userId={}", params.eventId(), params.userId());
                                        EventRequest request = new EventRequest(
                                                params.title(),
                                                params.startTime(),
                                                params.endTime() != null ? params.endTime() : params.startTime().plusHours(1),
                                                params.guessedContextId()
                                        );
                                        return eventService.updateEvent(params.eventId(), params.userId(), request);
                                })
                                .description("Cập nhật lại Sự kiện đã tồn tại. BẮT BUỘC cung cấp eventId và userId (lấy từ USER_CONTEXT_JSON).")
                                .inputType(McpUpdateEventParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpDeleteEventTool(EventService eventService) {
                return FunctionToolCallback
                                .builder("mcpDeleteEvent", (EventIdUserParams params) -> {
                                        log.info(">>> MCP TOOL [mcpDeleteEvent]: eventId={}, userId={}", params.eventId(), params.userId());
                                        eventService.deleteEvent(params.eventId(), params.userId());
                                        return "Đã xóa thành công Sự kiện ID: " + params.eventId();
                                })
                                .description("Hủy/Xóa một Sự kiện vĩnh viễn. BẮT BUỘC cung cấp eventId và userId (lấy từ USER_CONTEXT_JSON).")
                                .inputType(EventIdUserParams.class)
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
                                                        params.estimatedDuration(),
                                                        params.matrixType(),
                                                        params.contextId(),
                                                        params.isFixed(),
                                                        params.startTime());
                                        return taskService.updateTask(params.taskId(), params.userId(), request);
                                })
                                .description("Cập nhật lại công việc đã tồn tại. BẮT BUỘC cung cấp taskId và userId (lấy từ USER_CONTEXT_JSON). Lưu ý: estimatedDuration TÍNH BẰNG GIỜ (VD: 30 phút -> 0.5).")
                                .inputType(McpUpdateTaskParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpRecalculateScheduleTool(SchedulingService schedulingService) {
                return FunctionToolCallback
                                .builder("recalculate_schedule", (RecalculateScheduleParams params) -> {
                                        log.info(">>> MCP TOOL [recalculate_schedule]: userId={}, date={}, contextId={}", 
                                            params.userId(), params.date(), params.contextId());
                                        schedulingService.recalculateSchedule(params.userId(), params.date(), params.contextId());
                                        return "Đã tính toán và sắp xếp lại lịch tự động thành công.";
                                })
                                .description("Triggers the Simplex algorithm to auto-assign all pending tasks into the calendar. You MUST call this tool immediately after creating a new task, or when the user asks to optimize their day.")
                                .inputType(RecalculateScheduleParams.class)
                                .build();
        }

        @Bean
        public ToolCallback mcpGetScheduleTool(TimeBlockRepository timeBlockRepository) {
                return FunctionToolCallback
                                .builder("mcpGetSchedule", (UserDateParams params) -> {
                                        log.info(">>> MCP TOOL [mcpGetSchedule]: userId={}, date={}", params.userId(), params.targetDate());
                                        LocalDateTime dayStart = params.targetDate().atStartOfDay();
                                        LocalDateTime dayEnd = params.targetDate().plusDays(1).atStartOfDay();
                                        var blocks = timeBlockRepository.findByUserIdAndDateRange(params.userId(), dayStart, dayEnd);
                                        return blocks.stream()
                                                .map(tb -> new TimeBlockResponse(
                                                        tb.getId(),
                                                        tb.getTask().getId(),
                                                        tb.getTask().getTitle(),
                                                        tb.getTask().getMatrixType() != null ? tb.getTask().getMatrixType().name() : null,
                                                        tb.getTask().getContext() != null ? tb.getTask().getContext().getName() : null,
                                                        tb.getStartTime(),
                                                        tb.getEndTime(),
                                                        tb.getTask().getEstimatedDuration(),
                                                        tb.getTask().getRemainingDuration(),
                                                        tb.getTask().getIsOverloaded(),
                                                        tb.getIsLocked(),
                                                        tb.getTask().getStatus() != null ? tb.getTask().getStatus().name() : null
                                                ))
                                                .collect(Collectors.toList());
                                })
                                .description("Xem lịch trình (danh sách TimeBlock) của người dùng theo ngày. Dùng khi user hỏi 'hôm nay tôi có gì?', 'lịch ngày mai ra sao?'. BẮT BUỘC cung cấp userId và targetDate.")
                                .inputType(UserDateParams.class)
                                .build();
        }
}
