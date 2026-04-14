package com.vinhhuy.timemasterai.service;

public interface TaskIngestionService {

    /**
     * Ingests all tasks for a specific user into the Vector Store.
     * @param userId The ID of the user.
     */
    void ingestUserTasks(Long userId);

    /**
     * Ingests a single task into the Vector Store.
     * @param taskId The ID of the task.
     * @param userId The ID of the user.
     */
    void ingestSingleTask(Long taskId, Long userId);

    /**
     * Removes a single task from the Vector Store by its ID.
     * @param taskId The ID of the task to remove.
     */
    void removeTaskFromVectorStore(Long taskId);
}
