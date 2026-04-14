package com.vinhhuy.timemasterai.service.impl;

import com.vinhhuy.timemasterai.entity.TaskEntity;
import com.vinhhuy.timemasterai.repository.TaskRepository;
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

    private final TaskRepository taskRepository;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;

    @Override
    public void ingestUserTasks(Long userId) {
        log.info("Starting hardened ingestion for User ID: {}", userId);
        
        List<TaskEntity> tasks = taskRepository.findByUserId(userId);
        if (tasks.isEmpty()) {
            log.warn("No tasks found for User ID: {}", userId);
            return;
        }

        for (TaskEntity task : tasks) {
            ingestTask(task, userId);
        }

        log.info("Successfully upserted {} tasks into Vector Store.", tasks.size());
    }

    @Override
    public void ingestSingleTask(Long taskId, Long userId) {
        log.info("Starting real-time ingestion for Task ID: {} (User ID: {})", taskId, userId);
        
        taskRepository.findById(taskId).ifPresentOrElse(task -> {
            if (!task.getUserId().equals(userId)) {
                log.error("Sync error: Task {} does not belong to User {}", taskId, userId);
                return;
            }
            ingestTask(task, userId);
            log.info("Successfully synced task {} to Vector Store.", taskId);
        }, () -> log.error("Sync error: Task {} not found in DB", taskId));
    }

    @Override
    public void removeTaskFromVectorStore(Long taskId) {
        String vectorId = "task_" + taskId;
        log.info("Removing Task ID {} from Vector Store", taskId);
        try {
            embeddingStore.removeAll(java.util.Collections.singletonList(vectorId));
        } catch (Exception e) {
            log.error("Failed to remove task from vector store: {}", e.getMessage());
        }
    }

    private void ingestTask(TaskEntity task, Long userId) {
        String content = String.format(
                "Task ID %d: %s. Description: %s. Status: %s. Scheduled on: %s %s.",
                task.getId(),
                task.getTitle(),
                task.getDescription() != null ? task.getDescription() : "No description",
                task.getStatus(),
                task.getTargetDate(),
                task.getStartTime() != null ? task.getStartTime() : "00:00"
        );

        Metadata metadata = Metadata.from("userId", String.valueOf(userId));
        TextSegment segment = TextSegment.from(content, metadata);
        String vectorId = "task_" + task.getId();
        
        try {
            embeddingStore.removeAll(java.util.Collections.singletonList(vectorId));
        } catch (Exception e) {
            log.warn("Could not clear previous vector for task {}: {}", task.getId(), e.getMessage());
        }

        embeddingStore.addAll(
            java.util.List.of(vectorId),
            java.util.List.of(embeddingModel.embed(segment).content()),
            java.util.List.of(segment)
        );
    }
}
