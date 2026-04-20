package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.TaskResponse;
import com.vinhhuy.timemaster.service.VectorSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class VectorSyncServiceImpl implements VectorSyncService {

    private final RestTemplate restTemplate;

    @Value("${vector-store.internal-secret}")
    private String internalSecret;

    private static final String AI_SERVICE_URL = "http://localhost:8082/api/ai/ingest-single";

    @Override
    @Async
    public void syncToAi(TaskResponse task, String authToken) {
        log.info("Async sync for Task ID: {} triggered.", task.id());
        
        try {
            HttpHeaders headers = new HttpHeaders();
            
            // Priority 1: User Token
            if (authToken != null && !authToken.isEmpty()) {
                headers.set("Authorization", authToken);
            } else {
                // Priority 2: Internal Secret (used during MCP/AI tool calls)
                headers.set("X-Internal-Secret", internalSecret);
                log.debug("Using internal secret for Task sync (ID: {})", task.id());
            }

            // Push full Task data to AI (Pure Microservice approach)
            HttpEntity<TaskResponse> entity = new HttpEntity<>(task, headers);
            
            restTemplate.postForObject(AI_SERVICE_URL, entity, String.class);
            log.info("Successfully pushed Task data to AI module for Task ID: {}", task.id());
        } catch (Exception e) {
            log.warn("Failed to sync Task ID: {} to AI. Error: {}", task.id(), e.getMessage());
        }
    }

    @Override
    @Async
    public void deleteFromAi(Long taskId, String authToken) {
        log.info("Async delete for Task ID: {} triggered.", taskId);
        
        try {
            HttpHeaders headers = new HttpHeaders();
            if (authToken != null && !authToken.isEmpty()) {
                headers.set("Authorization", authToken);
            } else {
                headers.set("X-Internal-Secret", internalSecret);
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            String url = AI_SERVICE_URL + "?taskId=" + taskId;
            
            restTemplate.exchange(url, org.springframework.http.HttpMethod.DELETE, entity, String.class);
            log.info("Successfully notified AI module to delete Task ID: {}", taskId);
        } catch (Exception e) {
            log.warn("Failed to remove Task ID: {} from AI. Error: {}", taskId, e.getMessage());
        }
    }
}

