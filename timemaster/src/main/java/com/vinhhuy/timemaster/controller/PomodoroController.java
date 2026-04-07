package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.PomodoroRequest;
import com.vinhhuy.timemaster.dto.PomodoroResponse;
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
     * POST /api/pomodoros?userId=1
     */
    @PostMapping
    public ResponseEntity<PomodoroResponse> saveSession(
            @RequestParam Long userId,
            @Valid @RequestBody PomodoroRequest request) {

        PomodoroResponse savedSession = pomodoroService.saveSession(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSession);
    }

    /**
     * API: Lấy lịch sử toàn bộ các phiên Pomodoro của người dùng
     * GET /api/pomodoros?userId=1
     */
    @GetMapping
    public ResponseEntity<List<PomodoroResponse>> getSessionsByUser(@RequestParam Long userId) {
        List<PomodoroResponse> sessions = pomodoroService.getSessionsByUser(userId);
        return ResponseEntity.ok(sessions);
    }
}
