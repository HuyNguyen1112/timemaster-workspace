package com.vinhhuy.timemaster.mcp;

import com.vinhhuy.timemaster.dto.HabitCheckInRequest;
import com.vinhhuy.timemaster.dto.HabitRequest;
import com.vinhhuy.timemaster.service.HabitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

@Configuration
@Slf4j
public class McpHabitConfiguration {

    public record UserIdParam(Long userId) {
    }

    public record HabitIdUserParams(Long habitId, Long userId) {
    }

    public record UserDateParams(Long userId, LocalDate date) {
    }

    public record McpCheckInParams(
            Long habitId,
            Long userId,
            Integer progressValue,
            Boolean isIncrement,
            LocalDate logDate) {
    }

    public record McpCreateHabitParams(
            Long userId,
            String name,
            String description,
            String icon,
            Integer dailyGoal,
            String unit,
            String frequency,
            String colorCode,
            String routine) {
    }

    public record McpUpdateHabitParams(
            Long habitId,
            Long userId,
            String name,
            String description,
            String icon,
            Integer dailyGoal,
            String unit,
            String frequency,
            String colorCode,
            String routine) {
    }

    @Bean
    public ToolCallback mcpGetHabitsTool(HabitService habitService) {
        return FunctionToolCallback
                .builder("mcpGetHabits", (UserIdParam params) -> {
                    log.info(">>> MCP TOOL [mcpGetHabits]: userId={}", params.userId());
                    return habitService.getHabitsByUser(params.userId());
                })
                .description("Lấy danh sách thói quen của người dùng cùng với tiến độ hiện tại. BẮT BUỘC cung cấp userId (lấy từ USER_CONTEXT_JSON).")
                .inputType(UserIdParam.class)
                .build();
    }

    @Bean
    public ToolCallback mcpGetHabitsByDateTool(HabitService habitService) {
        return FunctionToolCallback
                .builder("mcpGetHabitsByDate", (UserDateParams params) -> {
                    log.info(">>> MCP TOOL [mcpGetHabitsByDate]: userId={}, date={}", params.userId(), params.date());
                    return habitService.getHabitsByDate(params.userId(), params.date());
                })
                .description("Lấy danh sách thói quen và tiến độ của người dùng vào một ngày cụ thể. BẮT BUỘC cung cấp userId và date.")
                .inputType(UserDateParams.class)
                .build();
    }

    @Bean
    public ToolCallback mcpCheckInHabitTool(HabitService habitService) {
        return FunctionToolCallback
                .builder("mcpCheckInHabit", (McpCheckInParams params) -> {
                    log.info(">>> MCP TOOL [mcpCheckInHabit]: habitId={}, userId={}", params.habitId(), params.userId());
                    LocalDate date = params.logDate() != null ? params.logDate() : LocalDate.now();
                    HabitCheckInRequest request = new HabitCheckInRequest(
                            date,
                            params.progressValue(),
                            null, // completed will be calculated by service
                            params.isIncrement() != null && params.isIncrement()
                    );
                    return habitService.checkIn(params.habitId(), params.userId(), request);
                })
                .description("Điểm danh hoặc cập nhật tiến độ thói quen cho người dùng. BẮT BUỘC cung cấp habitId và userId. Các tham số khác: progressValue (giá trị thực hiện được), isIncrement (true nếu muốn cộng dồn thêm vào giá trị cũ), logDate (ngày điểm danh, mặc định là hôm nay).")
                .inputType(McpCheckInParams.class)
                .build();
    }

    @Bean
    public ToolCallback mcpCreateHabitTool(HabitService habitService) {
        return FunctionToolCallback
                .builder("mcpCreateHabit", (McpCreateHabitParams params) -> {
                    log.info(">>> MCP TOOL [mcpCreateHabit]: userId={}, name={}", params.userId(), params.name());
                    HabitRequest request = new HabitRequest(
                            params.name(),
                            params.description(),
                            params.icon() != null ? params.icon() : "Target",
                            params.dailyGoal() != null ? params.dailyGoal() : 1,
                            params.unit() != null ? params.unit() : "times",
                            params.frequency() != null ? params.frequency() : "DAILY",
                            params.colorCode() != null ? params.colorCode() : "#8b5cf6",
                            params.routine() != null ? params.routine() : "ALL_DAY"
                    );
                    return habitService.createHabit(params.userId(), request);
                })
                .description("Tạo một Thói quen (Habit) mới. BẮT BUỘC cung cấp userId và name. Tham số quan trọng: routine (MORNING, AFTERNOON, EVENING, ALL_DAY).")
                .inputType(McpCreateHabitParams.class)
                .build();
    }

    @Bean
    public ToolCallback mcpUpdateHabitTool(HabitService habitService) {
        return FunctionToolCallback
                .builder("mcpUpdateHabit", (McpUpdateHabitParams params) -> {
                    log.info(">>> MCP TOOL [mcpUpdateHabit]: habitId={}, userId={}", params.habitId(), params.userId());
                    HabitRequest request = new HabitRequest(
                            params.name(),
                            params.description(),
                            params.icon(),
                            params.dailyGoal(),
                            params.unit(),
                            params.frequency(),
                            params.colorCode(),
                            params.routine()
                    );
                    return habitService.updateHabit(params.habitId(), params.userId(), request);
                })
                .description("Cập nhật lại thói quen đã tồn tại. BẮT BUỘC cung cấp habitId và userId (lấy từ USER_CONTEXT_JSON).")
                .inputType(McpUpdateHabitParams.class)
                .build();
    }
}
