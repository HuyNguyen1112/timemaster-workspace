package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.AnalyticsResponse;
import com.vinhhuy.timemaster.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * API: Lấy báo cáo thống kê trong ngày của người dùng
     * GET /api/analytics/daily?userId=1
     */
    @GetMapping("/daily")
    public ResponseEntity<AnalyticsResponse> getDailyAnalytics(@RequestParam Long userId) {
        AnalyticsResponse response = analyticsService.getDailyAnalytics(userId);
        return ResponseEntity.ok(response);
    }
}
