package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.HabitCheckInRequest;
import com.vinhhuy.timemaster.dto.HabitRequest;
import com.vinhhuy.timemaster.dto.HabitResponse;
import com.vinhhuy.timemaster.service.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @PostMapping
    public ResponseEntity<HabitResponse> createHabit(@RequestHeader("userId") Long userId,
            @RequestBody HabitRequest request) {
        // Trong môi trường JWT thực tế, userId nên được lấy từ SecurityContextHolder
        // Tạm thời lấy qua Header giống thiết kế hiện tại hoặc interceptor
        return ResponseEntity.ok(habitService.createHabit(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getHabitsByUser(@RequestHeader("userId") Long userId) {
        return ResponseEntity.ok(habitService.getHabitsByUser(userId));
    }

    @PutMapping("/{habitId}")
    public ResponseEntity<HabitResponse> updateHabit(@PathVariable Long habitId,
            @RequestHeader("userId") Long userId,
            @RequestBody HabitRequest request) {
        return ResponseEntity.ok(habitService.updateHabit(habitId, userId, request));
    }

    @DeleteMapping("/{habitId}")
    public ResponseEntity<Void> deleteHabit(@PathVariable Long habitId,
            @RequestHeader("userId") Long userId) {
        habitService.deleteHabit(habitId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{habitId}/checkin")
    public ResponseEntity<HabitResponse> checkIn(@PathVariable Long habitId,
            @RequestHeader("userId") Long userId,
            @RequestBody HabitCheckInRequest request) {
        return ResponseEntity.ok(habitService.checkIn(habitId, userId, request));
    }
}
