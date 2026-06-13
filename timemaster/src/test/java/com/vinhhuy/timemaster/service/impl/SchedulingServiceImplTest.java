package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.entity.*;
import com.vinhhuy.timemaster.repository.*;
import com.vinhhuy.timemaster.service.SchedulingService.FreeSlot;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SchedulingServiceImplTest {

    @Mock
    private ContextScheduleRepository contextScheduleRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TimeBlockRepository timeBlockRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ContextRepository contextRepository;

    @InjectMocks
    private SchedulingServiceImpl schedulingService;

    private Long userId = 1L;
    private Long contextId = 100L;
    private LocalDate testDate = LocalDate.of(2026, 6, 10);
    private LocalDateTime dayStart = testDate.atStartOfDay();
    private LocalDateTime dayEnd = testDate.plusDays(1).atStartOfDay();

    @BeforeEach
    void setUp() {
        // Mock base context schedule: 08:00 to 17:00 (540 minutes capacity)
        ContextSchedule schedule = new ContextSchedule();
        schedule.setStartTime(LocalTime.of(8, 0));
        schedule.setEndTime(LocalTime.of(17, 0));

        org.mockito.Mockito.lenient().when(contextScheduleRepository.findByContextIdAndDayOfWeek(eq(contextId), eq(testDate.getDayOfWeek().getValue())))
                .thenReturn(Collections.singletonList(schedule));
        
        // Default empty mocks for obstacles
        org.mockito.Mockito.lenient().when(eventRepository.findByUserIdAndStartTimeBetween(eq(userId), eq(dayStart), eq(dayEnd)))
                .thenReturn(new ArrayList<>());
        org.mockito.Mockito.lenient().when(timeBlockRepository.findLockedBlocksByUserIdAndDateRange(eq(userId), eq(dayStart), eq(dayEnd)))
                .thenReturn(new ArrayList<>());
        org.mockito.Mockito.lenient().when(taskRepository.findByUserIdAndTargetDateAndIsFixedTrue(eq(userId), eq(testDate)))
                .thenReturn(new ArrayList<>());
    }

    @Test
    void testSubtractObstacles_NoObstacles() {
        List<FreeSlot> slots = schedulingService.subtractObstacles(userId, contextId, testDate);

        assertEquals(1, slots.size(), "Should have exactly 1 continuous slot");
        assertEquals(LocalTime.of(8, 0), slots.get(0).getStartTime().toLocalTime());
        assertEquals(LocalTime.of(17, 0), slots.get(0).getEndTime().toLocalTime());
        assertEquals(540, slots.get(0).getCapacityInMinutes(), "8h to 17h is 540 minutes");
    }

    @Test
    void testSubtractObstacles_WithEventOverlap() {
        // Mock an event from 10:00 to 12:00
        Event event = new Event();
        event.setStartTime(LocalDateTime.of(testDate, LocalTime.of(10, 0)));
        event.setEndTime(LocalDateTime.of(testDate, LocalTime.of(12, 0)));
        
        when(eventRepository.findByUserIdAndStartTimeBetween(eq(userId), eq(dayStart), eq(dayEnd)))
                .thenReturn(Collections.singletonList(event));

        List<FreeSlot> slots = schedulingService.subtractObstacles(userId, contextId, testDate);

        // Expected slots: 08:00 - 10:00 (120 min), 12:00 - 17:00 (300 min)
        assertEquals(2, slots.size(), "Event should split the slot into 2");
        
        assertEquals(LocalTime.of(8, 0), slots.get(0).getStartTime().toLocalTime());
        assertEquals(LocalTime.of(10, 0), slots.get(0).getEndTime().toLocalTime());
        assertEquals(120, slots.get(0).getCapacityInMinutes());

        assertEquals(LocalTime.of(12, 0), slots.get(1).getStartTime().toLocalTime());
        assertEquals(LocalTime.of(17, 0), slots.get(1).getEndTime().toLocalTime());
        assertEquals(300, slots.get(1).getCapacityInMinutes());
    }

    @Test
    void testSubtractObstacles_WithFixedTaskOverlap() {
        // Mock a Fixed Task at 13:00 for 90 minutes (13:00 to 14:30)
        Task fixedTask = new Task();
        fixedTask.setIsFixed(true);
        fixedTask.setStartTime(LocalTime.of(13, 0));
        fixedTask.setEstimatedDuration(1.5); // 1.5 hours = 90 mins

        when(taskRepository.findByUserIdAndTargetDateAndIsFixedTrue(eq(userId), eq(testDate)))
                .thenReturn(Collections.singletonList(fixedTask));

        List<FreeSlot> slots = schedulingService.subtractObstacles(userId, contextId, testDate);

        // Expected slots: 08:00 - 13:00 (300 min), 14:30 - 17:00 (150 min)
        assertEquals(2, slots.size(), "Fixed Task should split the slot into 2");

        assertEquals(LocalTime.of(8, 0), slots.get(0).getStartTime().toLocalTime());
        assertEquals(LocalTime.of(13, 0), slots.get(0).getEndTime().toLocalTime());
        assertEquals(300, slots.get(0).getCapacityInMinutes());

        assertEquals(LocalTime.of(14, 30), slots.get(1).getStartTime().toLocalTime());
        assertEquals(LocalTime.of(17, 0), slots.get(1).getEndTime().toLocalTime());
        assertEquals(150, slots.get(1).getCapacityInMinutes());
    }

    @Test
    void testSubtractObstacles_WithLockedTimeBlock() {
        // Mock a Locked TimeBlock from 08:00 to 09:00 (Starts exactly at the beginning)
        TimeBlock lockedBlock = new TimeBlock();
        lockedBlock.setIsLocked(true);
        lockedBlock.setStartTime(LocalDateTime.of(testDate, LocalTime.of(8, 0)));
        lockedBlock.setEndTime(LocalDateTime.of(testDate, LocalTime.of(9, 0)));

        when(timeBlockRepository.findLockedBlocksByUserIdAndDateRange(eq(userId), eq(dayStart), eq(dayEnd)))
                .thenReturn(Collections.singletonList(lockedBlock));

        List<FreeSlot> slots = schedulingService.subtractObstacles(userId, contextId, testDate);

        // Expected slots: 09:00 - 17:00 (480 min)
        assertEquals(1, slots.size(), "Locked block at the start should trim the first slot");

        assertEquals(LocalTime.of(9, 0), slots.get(0).getStartTime().toLocalTime());
        assertEquals(LocalTime.of(17, 0), slots.get(0).getEndTime().toLocalTime());
        assertEquals(480, slots.get(0).getCapacityInMinutes());
    }
    @Test
    void testUpdateOverloadedStatus_IsOverloaded() {
        Task overloadedTask = new Task();
        overloadedTask.setId(99L);
        overloadedTask.setTargetDate(testDate);
        overloadedTask.setRemainingDuration(120); // Requires 120 minutes
        
        org.mockito.Mockito.lenient().when(taskRepository.findFlexPendingTasksWithDeadlineOnOrAfter(eq(userId), eq(testDate)))
                .thenReturn(Collections.singletonList(overloadedTask));
                
        // Mock that the system only managed to schedule 60 minutes
        org.mockito.Mockito.lenient().when(timeBlockRepository.sumDurationByTaskIdAndDateRange(
                eq(99L), 
                eq(dayStart), 
                eq(testDate.plusDays(1).atStartOfDay())))
                .thenReturn(60L);
                
        schedulingService.updateOverloadedStatus(userId, testDate, 14);
        
        // Assert that the task is overloaded and saved
        org.mockito.Mockito.verify(taskRepository).save(org.mockito.ArgumentMatchers.argThat(task -> task.getIsOverloaded()));
    }
}
