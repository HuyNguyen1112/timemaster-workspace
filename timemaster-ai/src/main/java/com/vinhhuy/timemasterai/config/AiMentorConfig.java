package com.vinhhuy.timemasterai.config;

import com.vinhhuy.timemasterai.agent.AiMentorAgent;
import com.vinhhuy.timemasterai.agent.QueryRouterAgent;
import com.vinhhuy.timemasterai.prompt.MentorPromptProvider;
import com.vinhhuy.timemasterai.security.UserContext;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.mcp.McpToolProvider;
import dev.langchain4j.mcp.client.McpClient;
import dev.langchain4j.mcp.client.DefaultMcpClient;
import dev.langchain4j.mcp.client.transport.http.HttpMcpTransport;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.tool.ToolProvider;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

/**
 * AI Mentor Configuration (Enhanced for RAG - Level 19/10).
 * Orchestrates Gemini, MCP Tools, pgvector RAG, and isolated Context.
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
                .temperature(0.1)
                .build();
    }

    @Bean
    public EmbeddingModel embeddingModel(
            @Value("${langchain4j.google-ai-gemini.chat-model.api-key}") String apiKey) {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(apiKey)
                .modelName("gemini-embedding-001")
                .build();
    }

    @Bean
    public QueryRouterAgent queryRouterAgent(ChatModel chatModel) {
        return AiServices.create(QueryRouterAgent.class, chatModel);
    }

    @Bean
    public EmbeddingStore<dev.langchain4j.data.segment.TextSegment> embeddingStore(
            @Value("${spring.datasource.username}") String user,
            @Value("${spring.datasource.password}") String password,
            @Value("${vector-store.host:localhost}") String host,
            @Value("${vector-store.port:5432}") Integer port,
            @Value("${vector-store.database:timemaster}") String database) {

        return PgVectorEmbeddingStore.builder()
                .host(host)
                .port(port)
                .database(database)
                .user(user)
                .password(password)
                .table("ai_task_vectors")
                .dimension(768) // Match Gemini embedding-001
                .createTable(true)
                .build();
    }

    @Bean
    public ContentRetriever contentRetriever(
            EmbeddingStore<dev.langchain4j.data.segment.TextSegment> embeddingStore,
            EmbeddingModel embeddingModel,
            QueryRouterAgent queryRouterAgent) {

        return query -> {
            // Ask AI to classify the query before calling Embedding Model
            QueryRouterAgent.Intent intent = queryRouterAgent.classify(query.text());

            if (intent == QueryRouterAgent.Intent.GREETING || intent == QueryRouterAgent.Intent.ACTION) {
                // Skip RAG for greetings or direct tool actions to save quota and latency
                return java.util.Collections.emptyList();
            }

            // Only proceed to RAG for INQUIRY
            Long currentUserId = userContext.getUserId();
            Filter userFilter = metadataKey("userId").isEqualTo(String.valueOf(currentUserId));

            return EmbeddingStoreContentRetriever.builder()
                    .embeddingStore(embeddingStore)
                    .embeddingModel(embeddingModel)
                    .maxResults(3)
                    .minScore(0.6)
                    .filter(userFilter)
                    .build()
                    .retrieve(query);
        };
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
            ContentRetriever contentRetriever,
            MentorPromptProvider mentorPromptProvider) {

        return AiServices.builder(AiMentorAgent.class)
                .chatModel(chatModel)
                .toolProvider(mcpToolProvider)
                .chatMemoryProvider(chatMemoryProvider)
                .contentRetriever(contentRetriever)
                .systemMessageProvider(chatMemoryId -> {
                    return mentorPromptProvider.getSystemPersona(userContext);
                })
                .build();
    }
}
