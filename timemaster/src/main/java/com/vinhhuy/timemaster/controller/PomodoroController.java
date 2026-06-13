package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.PomodoroRequest;
import com.vinhhuy.timemaster.dto.PomodoroResponse;
import com.vinhhuy.timemaster.security.SecurityUtils;
import com.vinhhuy.timemaster.service.PomodoroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pomodoros")
@RequiredArgsConstructor
public class PomodoroController {

    private final PomodoroService pomodoroService;

    /**
     * API: Lưu kết quả của một phiên Pomodoro
     * POST /api/pomodoros
     */
    @PostMapping
    public ResponseEntity<PomodoroResponse> saveSession(
            @Valid @RequestBody PomodoroRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        PomodoroResponse savedSession = pomodoroService.saveSession(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSession);
    }

    /**
     * API: Lấy lịch sử toàn bộ các phiên Pomodoro của người dùng
     * GET /api/pomodoros
     */
    @GetMapping
    public ResponseEntity<List<PomodoroResponse>> getSessionsByUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<PomodoroResponse> sessions = pomodoroService.getSessionsByUser(userId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * API: Lấy thống kê Dashboard của Pomodoro
     * GET /api/pomodoros/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<com.vinhhuy.timemaster.dto.PomodoroDashboardResponse> getDashboardStats() {
        Long userId = SecurityUtils.getCurrentUserId();
        com.vinhhuy.timemaster.dto.PomodoroDashboardResponse dashboard = pomodoroService.getDashboardStats(userId);
        return ResponseEntity.ok(dashboard);
    }
}
