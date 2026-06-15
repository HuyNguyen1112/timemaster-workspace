package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.TimeBlockResponse;
import com.vinhhuy.timemaster.entity.TimeBlock;
import com.vinhhuy.timemaster.repository.TimeBlockRepository;
import com.vinhhuy.timemaster.security.SecurityUtils;
import com.vinhhuy.timemaster.service.SchedulingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final SchedulingService schedulingService;
    private final TimeBlockRepository timeBlockRepository;

    /**
     * Lấy lịch trình của người dùng theo ngày.
     * GET /api/schedule?date=2026-05-18
     */
    @GetMapping
    public ResponseEntity<List<TimeBlockResponse>> getSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(schedulingService.getScheduleForDate(userId, date));
    }

    /**
     * Kích hoạt thuật toán Simplex để xếp lịch tự động.
     * POST /api/schedule/recalculate?date=2026-05-18&contextId=1
     */
    @PostMapping("/recalculate")
    public ResponseEntity<List<TimeBlockResponse>> recalculateSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long contextId) {

        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(schedulingService.recalculateAndGetSchedule(userId, date, contextId));
    }

    /**
     * Khóa (Ghim) hoặc Mở khóa một Time Block của Flex Task.
     * PUT /api/schedule/time-blocks/{blockId}/lock?locked=true
     */
    @PutMapping("/time-blocks/{blockId}/lock")
    public ResponseEntity<Void> lockTimeBlock(
            @PathVariable Long blockId,
            @RequestParam boolean locked) {

        Long userId = SecurityUtils.getCurrentUserId();
        TimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy TimeBlock"));

        if (!block.getTask().getUser().getId().equals(userId)) {
            throw new RuntimeException("Không có quyền thao tác trên TimeBlock này");
        }

        block.setIsLocked(locked);
        timeBlockRepository.save(block);

        return ResponseEntity.ok().build();
    }
}
