package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.HabitRequest;
import com.vinhhuy.timemaster.dto.HabitResponse;
import com.vinhhuy.timemaster.dto.HabitCheckInRequest;
import com.vinhhuy.timemaster.dto.HabitDailyProgress;
import java.time.LocalDate;
import java.util.List;

public interface HabitService {
    HabitResponse createHabit(Long userId, HabitRequest request);

    List<HabitResponse> getHabitsByUser(Long userId);

    List<HabitDailyProgress> getHabitsByDate(Long userId, LocalDate date);

    HabitResponse updateHabit(Long habitId, Long userId, HabitRequest request);

    void deleteHabit(Long habitId, Long userId);

    // Check-in logic
    HabitResponse checkIn(Long habitId, Long userId, HabitCheckInRequest request);
}
