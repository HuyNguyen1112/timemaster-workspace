package com.vinhhuy.timemasterai.service;

import com.vinhhuy.timemasterai.agent.AiMentorAgent;
import com.vinhhuy.timemasterai.dto.MentorResponse;
import com.vinhhuy.timemasterai.security.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiMentorService {

    private final AiMentorAgent aiMentorAgent;
    private final UserContext userContext;

    /**
     * Orchestrates the chat flow with automated retry logic (Point 5).
     */
    public MentorResponse chat(String userMessage) {
        return chatWithRetry(userMessage, 1); // Retry once on failure
    }

    private MentorResponse chatWithRetry(String userMessage, int retryCount) {
        Long userId = userContext.getUserId();
        log.info("Orchestrating AI chat for UserID: {}", userId); // Safe logging (Point 6)

        try {
            // Isolation: Memory ID linked to User ID
            MentorResponse response = aiMentorAgent.chat(userId, userMessage);
            
            // Robust Validation
            validateResponse(response);
            
            return response;
        } catch (Exception e) {
            if (retryCount > 0) {
                log.warn("AI interaction failed for UserID: {}, retrying once... Error: {}", userId, e.getMessage());
                return chatWithRetry(userMessage, retryCount - 1);
            }
            log.error("AI Orchestration failed after retries for UserID: {}", userId, e);
            throw new RuntimeException("AI processing failed. Please try again later.");
        }
    }

    private void validateResponse(MentorResponse response) {
        if (response == null || response.message() == null || response.message().isBlank()) {
            throw new RuntimeException("AI agent returned an empty or null response");
        }
        // Additional strict JSON schema validation can be added here if needed
    }
}
