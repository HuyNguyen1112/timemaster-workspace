package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.EventRequest;
import com.vinhhuy.timemaster.dto.EventResponse;
import com.vinhhuy.timemaster.security.SecurityUtils;
import com.vinhhuy.timemaster.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    /**
     * GET /api/events?date=2026-05-20
     */
    @GetMapping
    public ResponseEntity<List<EventResponse>> getEventsByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(eventService.getEventsByDate(userId, date));
    }

    /**
     * POST /api/events
     */
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @RequestBody EventRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(userId, request));
    }

    /**
     * PUT /api/events/{eventId}
     */
    @PutMapping("/{eventId}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long eventId,
            @RequestBody EventRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(eventService.updateEvent(eventId, userId, request));
    }

    /**
     * DELETE /api/events/{eventId}
     */
    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long eventId) {
        Long userId = SecurityUtils.getCurrentUserId();
        eventService.deleteEvent(eventId, userId);
        return ResponseEntity.noContent().build();
    }
}
