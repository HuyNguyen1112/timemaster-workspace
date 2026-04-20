package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.PomodoroRequest;
import com.vinhhuy.timemaster.dto.PomodoroResponse;
import com.vinhhuy.timemaster.dto.PomodoroDashboardResponse;
import java.util.List;

public interface PomodoroService {
    PomodoroResponse saveSession(Long userId, PomodoroRequest request);

    List<PomodoroResponse> getSessionsByUser(Long userId);

    PomodoroDashboardResponse getDashboardStats(Long userId);
}
