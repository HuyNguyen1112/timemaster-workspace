package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.DailyPlanResponse;
import com.vinhhuy.timemaster.dto.HabitDailyProgress;
import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.service.HabitService;
import com.vinhhuy.timemaster.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily-plan")
@RequiredArgsConstructor
public class DailyPlanController {

    private final TaskService taskService;
    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<DailyPlanResponse> getDailyPlan(
            @RequestHeader("userId") Long userId,
            @RequestParam String date) {

        LocalDate targetDate = LocalDate.parse(date);

        List<TaskResponse> tasks = taskService.getTasksByDate(userId, targetDate);
        List<HabitDailyProgress> habits = habitService.getHabitsByDate(userId, targetDate);

        DailyPlanResponse response = DailyPlanResponse.builder()
                .date(targetDate)
                .tasks(tasks)
                .habits(habits)
                .build();

        return ResponseEntity.ok(response);
    }
}
