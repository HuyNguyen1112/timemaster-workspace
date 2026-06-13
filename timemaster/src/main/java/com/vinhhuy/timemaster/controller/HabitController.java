package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.HabitCheckInRequest;
import com.vinhhuy.timemaster.dto.HabitRequest;
import com.vinhhuy.timemaster.dto.HabitResponse;
import com.vinhhuy.timemaster.security.SecurityUtils;
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
    public ResponseEntity<HabitResponse> createHabit(@RequestBody HabitRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(habitService.createHabit(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getHabitsByUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(habitService.getHabitsByUser(userId));
    }

    @GetMapping("/{habitId}")
    public ResponseEntity<HabitResponse> getHabitById(@PathVariable Long habitId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(habitService.getHabitById(habitId, userId));
    }

    @PutMapping("/{habitId}")
    public ResponseEntity<HabitResponse> updateHabit(@PathVariable Long habitId,
            @RequestBody HabitRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(habitService.updateHabit(habitId, userId, request));
    }

    @DeleteMapping("/{habitId}")
    public ResponseEntity<Void> deleteHabit(@PathVariable Long habitId) {
        Long userId = SecurityUtils.getCurrentUserId();
        habitService.deleteHabit(habitId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{habitId}/checkin")
    public ResponseEntity<HabitResponse> checkIn(@PathVariable Long habitId,
            @RequestBody HabitCheckInRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(habitService.checkIn(habitId, userId, request));
    }
}
