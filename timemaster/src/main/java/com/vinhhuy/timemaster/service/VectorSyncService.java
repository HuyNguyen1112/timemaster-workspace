package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.dto.HabitResponse;

public interface VectorSyncService {

    /**
     * Synchronizes a single task to the AI Vector Store.
     * @param task The task response object containing all data.
     * @param authToken The bearer token for authentication sharing.
     */
    void syncToAi(TaskResponse task, String authToken);
    void deleteFromAi(Long taskId, String authToken);

    /**
     * Synchronizes a single habit to the AI Vector Store.
     */
    void syncHabitToAi(HabitResponse habit, String authToken);

    /**
     * Notifies the AI module to remove a habit from the Vector Store.
     */
    void deleteHabitFromAi(Long habitId, String authToken);
}

