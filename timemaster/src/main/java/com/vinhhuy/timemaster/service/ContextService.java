package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.ContextRequest;
import com.vinhhuy.timemaster.dto.ContextResponse;
import com.vinhhuy.timemaster.dto.ContextScheduleRequest;

import java.util.List;

public interface ContextService {
    List<ContextResponse> getAll(Long userId);
    ContextResponse createContext(Long userId, ContextRequest request);
    ContextResponse updateContext(Long contextId, Long userId, ContextRequest request);
    void deleteContext(Long contextId, Long userId);
}
