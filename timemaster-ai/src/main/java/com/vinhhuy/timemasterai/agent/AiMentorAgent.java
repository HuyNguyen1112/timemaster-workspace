package com.vinhhuy.timemasterai.agent;

import com.vinhhuy.timemasterai.dto.MentorResponse;
import dev.langchain4j.service.MemoryId;
import dev.langchain4j.service.UserMessage;

/**
 * Isolated AI Agent.
 * Uses @MemoryId for strict user-level chat history segregation.
 */
public interface AiMentorAgent {

    MentorResponse chat(@MemoryId Object memoryId, @UserMessage String userMessage);
}
