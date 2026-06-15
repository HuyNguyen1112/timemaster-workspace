package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.ContextRequest;
import com.vinhhuy.timemaster.dto.ContextResponse;
import com.vinhhuy.timemaster.dto.ContextScheduleRequest;
import com.vinhhuy.timemaster.security.SecurityUtils;
import com.vinhhuy.timemaster.service.ContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contexts")
@RequiredArgsConstructor
public class ContextController {

    private final ContextService contextService;

    @GetMapping
    public ResponseEntity<List<ContextResponse>> getAllContexts() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(contextService.getAll(userId));
    }

    @PostMapping
    public ResponseEntity<ContextResponse> createContext(
            @RequestBody ContextRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(contextService.createContext(userId, request));
    }

    @PutMapping("/{contextId}")
    public ResponseEntity<ContextResponse> updateContext(
            @PathVariable Long contextId,
            @RequestBody ContextRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(contextService.updateContext(contextId, userId, request));
    }

    @DeleteMapping("/{contextId}")
    public ResponseEntity<Void> deleteContext(
            @PathVariable Long contextId) {
        Long userId = SecurityUtils.getCurrentUserId();
        contextService.deleteContext(contextId, userId);
        return ResponseEntity.noContent().build();
    }

}
