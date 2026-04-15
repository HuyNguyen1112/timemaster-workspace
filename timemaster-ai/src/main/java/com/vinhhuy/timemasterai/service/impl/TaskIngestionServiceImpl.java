package com.vinhhuy.timemasterai.service.impl;

import com.vinhhuy.timemasterai.dto.TaskResponse;
import com.vinhhuy.timemasterai.service.TaskIngestionService;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskIngestionServiceImpl implements TaskIngestionService {

    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;

    @Override
    public void ingestUserTasks(Long userId) {
        // Pure Microservice: Batch ingestion should now PULL from Core Service API instead of reading DB.
        // Implementation postponed or handled via manual trigger in Core.
        log.warn("Batch ingestion via direct DB access for User ID: {} is disabled. Use real-time sync or Implement Pull API.", userId);
    }

    @Override
    public void ingestSingleTask(TaskResponse task, Long userId) {
        log.info("Starting real-time ingestion for Task ID: {} (User ID: {})", task.id(), userId);
        
        if (!task.userId().equals(userId)) {
            log.error("Sync error: Task {} does not belong to User {}", task.id(), userId);
            return;
        }

        ingestTask(task, userId);
        log.info("Successfully synced task {} to Vector Store via Data Push.", task.id());
    }

    @Override
    public void removeTaskFromVectorStore(Long taskId) {
        String vectorId = getVectorId(taskId);
        log.info("Removing Task ID {} (Vector ID {}) from Vector Store", taskId, vectorId);
        try {
            embeddingStore.removeAll(java.util.Collections.singletonList(vectorId));
        } catch (Exception e) {
            log.error("Failed to remove task from vector store: {}", e.getMessage());
        }
    }

    private void ingestTask(TaskResponse task, Long userId) {
        String content = String.format(
                "Task ID %d: %s. Description: %s. Status: %s. Scheduled on: %s %s.",
                task.id(),
                task.title(),
                task.description() != null ? task.description() : "No description",
                task.status(),
                task.targetDate(),
                task.startTime() != null ? task.startTime() : "00:00"
        );

        Metadata metadata = Metadata.from("userId", String.valueOf(userId));
        TextSegment segment = TextSegment.from(content, metadata);
        String vectorId = getVectorId(task.id());
        
        try {
            embeddingStore.removeAll(java.util.Collections.singletonList(vectorId));
        } catch (Exception e) {
            log.warn("Could not clear previous vector for task {}: {}", task.id(), e.getMessage());
        }

        embeddingStore.addAll(
            java.util.List.of(vectorId),
            java.util.List.of(embeddingModel.embed(segment).content()),
            java.util.List.of(segment)
        );
    }

    /**
     * Generates a stable UUID string for a given Task ID.
     * Required by PgVectorEmbeddingStore which enforces UUID format for IDs.
     */
    private String getVectorId(Long taskId) {
        return java.util.UUID.nameUUIDFromBytes(("task_" + taskId).getBytes()).toString();
    }
}


