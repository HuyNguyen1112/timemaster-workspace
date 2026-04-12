package com.vinhhuy.timemasterai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vinhhuy.timemasterai.security.CurrentUserId;
import com.vinhhuy.timemasterai.service.AiMentorService;
import com.vinhhuy.timemasterai.dto.ChatRequest;
import com.vinhhuy.timemasterai.dto.MentorResponse;

import dev.langchain4j.mcp.client.McpClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AI Control Center.
 * Handles incoming chat requests and tool testing.
 * Leverages @CurrentUserId for clean security context resolution.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiMentorService aiMentorService; // Orchestrator
    private final McpClient mcpClient;

    @PostMapping("/chat")
    public ResponseEntity<MentorResponse> chat(
            @RequestBody ChatRequest request, 
            @CurrentUserId Long userId) {
        try {
            MentorResponse response = aiMentorService.chat(request.getMessage());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("AI Chat error", e);
            return ResponseEntity.status(500)
                    .body(new MentorResponse("LỖI HỆ THỐNG: " + e.getMessage(), "ERROR"));
        }
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
