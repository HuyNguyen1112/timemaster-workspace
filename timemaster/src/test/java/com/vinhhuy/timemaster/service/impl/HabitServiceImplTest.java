package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.HabitCheckInRequest;
import com.vinhhuy.timemaster.dto.HabitRequest;
import com.vinhhuy.timemaster.dto.HabitResponse;
import com.vinhhuy.timemaster.entity.Habit;
import com.vinhhuy.timemaster.entity.HabitLog;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.mapper.HabitMapper;
import com.vinhhuy.timemaster.repository.HabitLogRepository;
import com.vinhhuy.timemaster.repository.HabitRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.VectorSyncService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class HabitServiceImplTest {

    @Mock
    private HabitRepository habitRepository;
    @Mock
    private HabitLogRepository habitLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private HabitMapper habitMapper;
    @Mock
    private VectorSyncService vectorSyncService;
    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private HabitServiceImpl habitService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCheckIn_CooldownThrowsException() {
        Long userId = 1L;
        Long habitId = 1L;

        User user = new User();
        user.setId(userId);

        Habit habit = new Habit();
        habit.setId(habitId);
        habit.setUser(user);
        habit.setUnit("lần");
        habit.setDailyGoal(5);

        HabitLog log = new HabitLog();
        log.setId(100L); // simulate existing log
        log.setHabit(habit);
        log.setUpdatedAt(LocalDateTime.now().minusMinutes(2)); // Checked in 2 minutes ago

        when(habitRepository.findById(habitId)).thenReturn(Optional.of(habit));
        when(habitLogRepository.findByHabitIdAndLogDate(eq(habitId), any(LocalDate.class)))
                .thenReturn(Optional.of(log));

        HabitCheckInRequest request = new HabitCheckInRequest();
        request.setProgressValue(1);
        request.setIsIncrement(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            habitService.checkIn(habitId, userId, request);
        });

        assertEquals("Vui lòng đợi 5 phút giữa các lần check-in để tránh spam.", exception.getMessage());
        verify(habitLogRepository, never()).save(any());
    }

    @Test
    void testCheckIn_CooldownPassed() {
        Long userId = 1L;
        Long habitId = 1L;

        User user = new User();
        user.setId(userId);

        Habit habit = new Habit();
        habit.setId(habitId);
        habit.setUser(user);
        habit.setUnit("times");
        habit.setDailyGoal(5);

        HabitLog log = new HabitLog();
        log.setId(100L); // simulate existing log
        log.setHabit(habit);
        log.setUpdatedAt(LocalDateTime.now().minusMinutes(6)); // Checked in 6 minutes ago
        log.setLogDate(LocalDate.now());
        log.setProgressValue(1);

        when(habitRepository.findById(habitId)).thenReturn(Optional.of(habit));
        when(habitLogRepository.findByHabitIdAndLogDate(eq(habitId), any(LocalDate.class)))
                .thenReturn(Optional.of(log));
        when(habitLogRepository.findByHabitId(habitId)).thenReturn(Collections.singletonList(log));
        when(habitMapper.toResponse(any())).thenReturn(new HabitResponse());

        HabitCheckInRequest request = new HabitCheckInRequest();
        request.setProgressValue(1);
        request.setIsIncrement(true);

        assertDoesNotThrow(() -> {
            habitService.checkIn(habitId, userId, request);
        });

        verify(habitLogRepository, times(1)).save(log);
        assertEquals(2, log.getProgressValue());
    }
}
