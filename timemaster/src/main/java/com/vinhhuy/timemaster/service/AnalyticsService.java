package com.vinhhuy.timemaster.service;
import com.vinhhuy.timemaster.dto.AnalyticsResponse;

public interface AnalyticsService {
    AnalyticsResponse getDailyAnalytics(Long userId);
}