package com.vinhhuy.timemaster.service;

public interface VectorSyncService {

    /**
     * Synchronizes a single task to the AI Vector Store.
     * @param taskId The ID of the task to sync.
     * @param authToken The bearer token for authentication sharing.
     */
    void syncToAi(Long taskId, String authToken);

    /**
     * Notifies the AI module to remove a task from the Vector Store.
     * @param taskId The ID of the task to remove.
     * @param authToken The bearer token for authentication sharing.
     */
    void deleteFromAi(Long taskId, String authToken);
}
