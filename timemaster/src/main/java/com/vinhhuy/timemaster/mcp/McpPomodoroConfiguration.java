package com.vinhhuy.timemaster.mcp;

import com.vinhhuy.timemaster.dto.PomodoroRequest;
import com.vinhhuy.timemaster.service.PomodoroService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
@Slf4j
public class McpPomodoroConfiguration {

    public record UserIdParam(Long userId) {
    }

    @Bean
    public ToolCallback mcpGetPomodoroDashboardTool(PomodoroService pomodoroService) {
        return FunctionToolCallback
                .builder("mcpGetPomodoroDashboard", (UserIdParam params) -> {
                    log.info(">>> MCP TOOL [mcpGetPomodoroDashboard]: userId={}", params.userId());
                    return pomodoroService.getDashboardStats(params.userId());
                })
                .description("Lấy báo cáo/thống kê về thời gian tập trung (Focus/Pomodoro) của người dùng trong ngày, tuần, tháng. BẮT BUỘC cung cấp userId (từ USER_CONTEXT_JSON).")
                .inputType(UserIdParam.class)
                .build();
    }
}
