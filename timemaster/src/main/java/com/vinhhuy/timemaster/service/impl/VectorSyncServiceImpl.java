package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.service.VectorSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private static final String AI_SERVICE_URL = "http://localhost:8081/api/ai/ingest-single";

    @Override
    @Async
    public void syncToAi(Long taskId, String authToken) {
        log.info("Async sync for Task ID: {} triggered.", taskId);
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String url = AI_SERVICE_URL + "?taskId=" + taskId;
            
            restTemplate.postForObject(url, entity, String.class);
            log.info("Successfully notified AI module to ingest/update Task ID: {}", taskId);
        } catch (Exception e) {
            log.warn("Failed to sync Task ID: {} to AI Vector Store. Error: {}", taskId, e.getMessage());
        }
    }

    @Override
    @Async
    public void deleteFromAi(Long taskId, String authToken) {
        log.info("Async delete for Task ID: {} triggered.", taskId);
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String url = AI_SERVICE_URL + "?taskId=" + taskId;
            
            restTemplate.exchange(url, org.springframework.http.HttpMethod.DELETE, entity, String.class);
            log.info("Successfully notified AI module to delete Task ID: {}", taskId);
        } catch (Exception e) {
            log.warn("Failed to remove Task ID: {} from AI Vector Store. Error: {}", taskId, e.getMessage());
        }
    }
}
