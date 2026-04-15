package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.TaskResponse;

public interface VectorSyncService {

    /**
     * Synchronizes a single task to the AI Vector Store.
     * @param task The task response object containing all data.
     * @param authToken The bearer token for authentication sharing.
     */
    void syncToAi(TaskResponse task, String authToken);

    /**
     * Notifies the AI module to remove a task from the Vector Store.
     * @param taskId The ID of the task to remove.
     * @param authToken The bearer token for authentication sharing.
     */
    void deleteFromAi(Long taskId, String authToken);
}

