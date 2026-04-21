package com.vinhhuy.timemasterai.service.impl;

import com.vinhhuy.timemasterai.agent.AiMentorAgent;
import com.vinhhuy.timemasterai.dto.MentorResponse;
import com.vinhhuy.timemasterai.security.UserContext;
import com.vinhhuy.timemasterai.service.AiMentorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiMentorServiceImpl implements AiMentorService {

    private final AiMentorAgent aiMentorAgent;
    private final UserContext userContext;
    private final ContentRetriever contentRetriever;

    @Override
    public MentorResponse chat(String userMessage) {
        Long userId = userContext.getUserId();
        log.info(">>> AI ORCHESTRATION: UserID [{}] is asking: \"{}\"", userId, userMessage);

        try {
            // Manual RAG Augmentation: Retrieve context and merge into UserMessage
            // This prevents Gemini "message sequence" errors (400 Bad Request)
            List<Content> contents = contentRetriever.retrieve(dev.langchain4j.rag.query.Query.from(userMessage));
            String augmentedMessage = userMessage;

            if (contents != null && !contents.isEmpty()) {
                String context = contents.stream()
                        .map(c -> c.textSegment().text())
                        .collect(Collectors.joining("\n---\n"));
                
                log.info(">>> RAG: Found {} relevant context segments. Context content: \n{}", contents.size(), context);
                
                augmentedMessage = String.format(
                    "Dưới đây là một số thông tin từ lịch sử công việc của người dùng:\n" +
                    "----------------------\n" +
                    "%s\n" +
                    "----------------------\n" +
                    "Dựa trên thông tin trên, hãy trả lời câu hỏi sau:\n%s", 
                    context, userMessage
                );
            }

            // Isolation: Memory ID linked to User ID
            MentorResponse response = aiMentorAgent.chat(userId, augmentedMessage);
            
            log.info("<<< AI RESPONSE for UserID [{}]: Message: [{}], Action taken: [{}]", 
                    userId, response.message(), response.actionTaken());

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
