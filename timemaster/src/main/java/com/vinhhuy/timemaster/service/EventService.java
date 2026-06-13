package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.EventRequest;
import com.vinhhuy.timemaster.dto.EventResponse;

import java.time.LocalDate;
import java.util.List;

public interface EventService {
    List<EventResponse> getEventsByDate(Long userId, LocalDate date);
    EventResponse createEvent(Long userId, EventRequest request);
    EventResponse updateEvent(Long eventId, Long userId, EventRequest request);
    void deleteEvent(Long eventId, Long userId);
}
