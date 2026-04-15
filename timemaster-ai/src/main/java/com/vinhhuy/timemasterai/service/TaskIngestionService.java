package com.vinhhuy.timemasterai.service;

import com.vinhhuy.timemasterai.dto.TaskResponse;

public interface TaskIngestionService {

    /**
     * Ingests all tasks for a specific user into the Vector Store.
     * @param userId The ID of the user.
     */
    void ingestUserTasks(Long userId);

    /**
     * Ingests a single task into the Vector Store from provided DTO data.
     */
    void ingestSingleTask(TaskResponse task, Long userId);


    /**
     * Removes a single task from the Vector Store by its ID.
     * @param taskId The ID of the task to remove.
     */
    void removeTaskFromVectorStore(Long taskId);
}
