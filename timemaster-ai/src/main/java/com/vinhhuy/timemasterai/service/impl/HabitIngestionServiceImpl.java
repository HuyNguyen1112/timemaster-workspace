package com.vinhhuy.timemasterai.service.impl;

import com.vinhhuy.timemasterai.dto.HabitResponse;
import com.vinhhuy.timemasterai.service.HabitIngestionService;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HabitIngestionServiceImpl implements HabitIngestionService {

    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;

    @Override
    public void ingestSingleHabit(HabitResponse habit, Long userId) {
        log.info("Starting real-time ingestion for Habit ID: {} (User ID: {})", habit.getId(), userId);

        if (!habit.getUserId().equals(userId)) {
            log.error("Sync error: Habit {} does not belong to User {}", habit.getId(), userId);
            return;
        }

        ingestHabit(habit, userId);
        log.info("Successfully synced habit {} to Vector Store.", habit.getId());
    }

    @Override
    public void removeHabitFromVectorStore(Long habitId) {
        String vectorId = getVectorId(habitId);
        log.info("Removing Habit ID {} (Vector ID {}) from Vector Store", habitId, vectorId);
        try {
            embeddingStore.removeAll(Collections.singletonList(vectorId));
        } catch (Exception e) {
            log.error("Failed to remove habit from vector store: {}", e.getMessage());
        }
    }

    private void ingestHabit(HabitResponse habit, Long userId) {
        String content = String.format(
                "Habit ID %d: %s. Description: %s. Goal: %d %s. Current Streak: %d days. Progress Today: %d/%d (%s).",
                habit.getId(),
                habit.getName(),
                habit.getDescription() != null ? habit.getDescription() : "No description",
                habit.getDailyGoal(),
                habit.getUnit(),
                habit.getCurrentStreak(),
                habit.getProgressToday() != null ? habit.getProgressToday() : 0,
                habit.getDailyGoal(),
                Boolean.TRUE.equals(habit.getCompletedToday()) ? "Completed" : "In Progress"
        );

        Metadata metadata = Metadata.from("userId", String.valueOf(userId));
        TextSegment segment = TextSegment.from(content, metadata);
        String vectorId = getVectorId(habit.getId());

        try {
            embeddingStore.removeAll(Collections.singletonList(vectorId));
        } catch (Exception e) {
            log.warn("Could not clear previous vector for habit {}: {}", habit.getId(), e.getMessage());
        }

        embeddingStore.addAll(
                List.of(vectorId),
                List.of(embeddingModel.embed(segment).content()),
                List.of(segment)
        );
    }

    private String getVectorId(Long habitId) {
        return UUID.nameUUIDFromBytes(("habit_" + habitId).getBytes()).toString();
    }
}
