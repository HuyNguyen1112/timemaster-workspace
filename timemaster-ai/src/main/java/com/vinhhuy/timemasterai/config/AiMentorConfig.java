package com.vinhhuy.timemasterai.config;

import com.vinhhuy.timemasterai.agent.AiMentorAgent;
import com.vinhhuy.timemasterai.prompt.MentorPromptProvider;
import com.vinhhuy.timemasterai.security.UserContext;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.mcp.McpToolProvider;
import dev.langchain4j.mcp.client.McpClient;
import dev.langchain4j.mcp.client.DefaultMcpClient;
import dev.langchain4j.mcp.client.transport.http.HttpMcpTransport;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.tool.ToolProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

/**
 * AI Mentor Configuration.
 * Orchestrates the integration between Gemini, MCP Tools, and the isolated User Context.
 */
@Configuration
@RequiredArgsConstructor
public class AiMentorConfig {

    private final UserContext userContext;

    @Bean
    public ChatMemoryProvider chatMemoryProvider() {
        return memoryId -> MessageWindowChatMemory.withMaxMessages(10);
    }

    @Bean
    public ChatModel chatLanguageModel(
            @Value("${langchain4j.google-ai-gemini.chat-model.api-key}") String apiKey,
            @Value("${langchain4j.google-ai-gemini.chat-model.model-name}") String modelName) {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(0.1) // Force deterministic behavior
                .build();
    }

    @Bean(destroyMethod = "close")
    public McpClient mcpClient() {
        return new DefaultMcpClient.Builder()
                .transport(new HttpMcpTransport.Builder()
                        .sseUrl("http://localhost:8080/sse")
                        .timeout(Duration.ofSeconds(120))
                        .logRequests(true)
                        .logResponses(true)
                        .build())
                .build();
    }

    @Bean
    public ToolProvider mcpToolProvider(McpClient mcpClient) {
        return McpToolProvider.builder()
                .mcpClients(List.of(mcpClient))
                .build();
    }

    @Bean
    public AiMentorAgent aiMentorAgent(
            ChatModel chatModel,
            ToolProvider mcpToolProvider,
            ChatMemoryProvider chatMemoryProvider,
            MentorPromptProvider mentorPromptProvider) {

        return AiServices.builder(AiMentorAgent.class)
                .chatModel(chatModel)
                .toolProvider(mcpToolProvider)
                .chatMemoryProvider(chatMemoryProvider)
                .systemMessageProvider(chatMemoryId -> {
                    // Inject dynamic context from the RequestScope UserContext bean
                    // This is thread-safe and isolated per HTTP request
                    return mentorPromptProvider.getSystemPersona(userContext);
                })
                .build();
    }
}
