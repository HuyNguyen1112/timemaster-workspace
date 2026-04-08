package com.vinhhuy.timemasterai.config;

import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
public class AiMentorConfig {

    @Bean
    public dev.langchain4j.memory.chat.ChatMemoryProvider chatMemoryProvider() {
        return memoryId -> dev.langchain4j.memory.chat.MessageWindowChatMemory.withMaxMessages(10);
    }

    @Bean
    public org.springframework.web.client.RestTemplate restTemplate() {
        return new org.springframework.web.client.RestTemplate();
    }

    @Bean
    public ChatModel chatLanguageModel(
            @Value("${langchain4j.google-ai-gemini.chat-model.api-key}") String apiKey,
            @Value("${langchain4j.google-ai-gemini.chat-model.model-name}") String modelName,
            @Value("${langchain4j.google-ai-gemini.chat-model.temperature}") Double temperature) {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(temperature)
                .build();
    }

    @Bean(destroyMethod = "close")
    public dev.langchain4j.mcp.client.McpClient mcpClient() {
        return new dev.langchain4j.mcp.client.DefaultMcpClient.Builder()
                .transport(new dev.langchain4j.mcp.client.transport.http.HttpMcpTransport.Builder()
                        .sseUrl("http://localhost:8080/sse")
                        .timeout(java.time.Duration.ofSeconds(120))
                        .logRequests(true)
                        .logResponses(true)
                        .build())
                .build();
    }

    @Bean
    public dev.langchain4j.service.tool.ToolProvider mcpToolProvider(dev.langchain4j.mcp.client.McpClient mcpClient) {
        return dev.langchain4j.mcp.McpToolProvider.builder()
                .mcpClients(java.util.List.of(mcpClient))
                .build();
    }

    @Bean
    public com.vinhhuy.timemasterai.agent.AiMentorService aiMentorService(
            dev.langchain4j.model.chat.ChatModel chatModel,
            dev.langchain4j.service.tool.ToolProvider mcpToolProvider,
            dev.langchain4j.memory.chat.ChatMemoryProvider chatMemoryProvider) {
        return dev.langchain4j.service.AiServices.builder(com.vinhhuy.timemasterai.agent.AiMentorService.class)
                .chatModel(chatModel)
                .toolProvider(mcpToolProvider)
                .chatMemoryProvider(chatMemoryProvider)
                .build();
    }
}
