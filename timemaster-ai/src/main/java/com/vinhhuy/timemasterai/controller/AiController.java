package com.vinhhuy.timemasterai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vinhhuy.timemasterai.service.AiMentorService;
import com.vinhhuy.timemasterai.service.HabitIngestionService;
import com.vinhhuy.timemasterai.service.TaskIngestionService;
import com.vinhhuy.timemasterai.dto.ChatRequest;
import com.vinhhuy.timemasterai.dto.HabitResponse;
import com.vinhhuy.timemasterai.dto.MentorResponse;
import com.vinhhuy.timemasterai.security.UserContext;

import dev.langchain4j.mcp.client.McpClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiMentorService aiMentorService; // Orchestrator
    private final TaskIngestionService taskIngestionService;
    private final HabitIngestionService habitIngestionService;
    private final UserContext userContext;
    private final McpClient mcpClient;

    @PostMapping("/chat")
    public ResponseEntity<MentorResponse> chat(
            @RequestBody ChatRequest request) {
        try {
            MentorResponse response = aiMentorService.chat(request.getMessage());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("AI Chat error", e);
            return ResponseEntity.status(500)
                    .body(new MentorResponse("LỖI HỆ THỐNG: " + e.getMessage(), "ERROR"));
        }
    }

    /**
     * Trigger manual RAG ingestion for the current user.
     */
    @PostMapping("/ingest")
    public ResponseEntity<String> ingest() {
        log.info("Starting ingestion via API for UserID: {}", userContext.getUserId());
        taskIngestionService.ingestUserTasks(userContext.getUserId());
        return ResponseEntity.ok("Ingestion complete for User ID: " + userContext.getUserId());
    }

    /**
     * Real-time sync endpoint for a single task (Ingest or Update).
     * Accepts the full task data as pushed from the Core service.
     */
    @PostMapping("/ingest-single")
    public ResponseEntity<String> ingestSingle(
            @RequestBody com.vinhhuy.timemasterai.dto.TaskResponse task,
            @RequestParam(required = false) Long userId) {

        Long effectiveUserId = userId;
        if (effectiveUserId == null) {
            effectiveUserId = userContext.getUserId();
        }
        if (effectiveUserId == null) {
            effectiveUserId = task.userId();
        }

        log.info("Triggering real-time sync for Task ID: {} (UserID: {})", task.id(), effectiveUserId);

        if (effectiveUserId == null) {
            return ResponseEntity.status(401).body("Missing User ID for ingestion");
        }

        taskIngestionService.ingestSingleTask(task, effectiveUserId);
        return ResponseEntity.ok("Sync complete for Task: " + task.id());
    }

    /**
     * Real-time removal endpoint for a single task.
     */
    @DeleteMapping("/ingest-single")
    public ResponseEntity<String> deleteSingle(@RequestParam Long taskId, @RequestParam(required = false) Long userId) {
        log.info("Triggering real-time removal for Task ID: {} (UserID: {})", taskId, userId);
        taskIngestionService.removeTaskFromVectorStore(taskId);
        return ResponseEntity.ok("Removal complete for Task: " + taskId);
    }

    /**
     * Real-time sync endpoint for a single habit (Ingest or Update).
     */
    @PostMapping("/ingest-habit")
    public ResponseEntity<String> ingestHabit(
            @RequestBody HabitResponse habit,
            @RequestParam(required = false) Long userId) {

        Long effectiveUserId = userId;
        if (effectiveUserId == null) {
            effectiveUserId = userContext.getUserId();
        }
        if (effectiveUserId == null) {
            effectiveUserId = habit.getUserId();
        }

        log.info("Triggering real-time sync for Habit ID: {} (UserID: {})", habit.getId(), effectiveUserId);

        if (effectiveUserId == null) {
            return ResponseEntity.status(401).body("Missing User ID for habit ingestion");
        }

        habitIngestionService.ingestSingleHabit(habit, effectiveUserId);
        return ResponseEntity.ok("Sync complete for Habit: " + habit.getId());
    }

    /**
     * Real-time removal endpoint for a single habit.
     */
    @DeleteMapping("/ingest-habit")
    public ResponseEntity<String> deleteHabit(@RequestParam Long habitId, @RequestParam(required = false) Long userId) {
        log.info("Triggering real-time removal for Habit ID: {} (UserID: {})", habitId, userId);
        habitIngestionService.removeHabitFromVectorStore(habitId);
        return ResponseEntity.ok("Removal complete for Habit: " + habitId);
    }

    @GetMapping("/testTools")
    public ResponseEntity<String> testTools() {
        try {
            var tools = mcpClient.listTools();
            if (tools == null || tools.isEmpty()) {
                return ResponseEntity.ok("0 tool found");
            }
            StringBuilder sb = new StringBuilder(tools.size() + "\n");
            tools.forEach(t -> sb.append(t.name()).append("\n"));
            return ResponseEntity.ok(sb.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}
