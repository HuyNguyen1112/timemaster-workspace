package com.vinhhuy.timemasterai.service.impl;

import com.vinhhuy.timemasterai.agent.AiMentorAgent;
import com.vinhhuy.timemasterai.dto.MentorResponse;
import com.vinhhuy.timemasterai.security.UserContext;
import com.vinhhuy.timemasterai.service.AiMentorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiMentorServiceImpl implements AiMentorService {

    private final AiMentorAgent aiMentorAgent;
    private final UserContext userContext;

    @Override
    public MentorResponse chat(String userMessage) {
        Long userId = userContext.getUserId();
        log.info("Orchestrating AI chat for UserID: {}", userId);

        try {
            // Isolation: Memory ID linked to User ID
            MentorResponse response = aiMentorAgent.chat(userId, userMessage);

            // Robust Validation
            validateResponse(response);

            return response;
        } catch (Exception e) {
            log.error("AI Orchestration failed for UserID: {}", userId, e);
            throw new RuntimeException("AI processing failed: " + e.getMessage());
        }
    }

    private void validateResponse(MentorResponse response) {
        if (response == null || response.message() == null || response.message().isBlank()) {
            throw new RuntimeException("AI agent returned an empty or null response");
        }
    }
}
