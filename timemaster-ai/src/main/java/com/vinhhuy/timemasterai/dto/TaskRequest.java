package com.vinhhuy.timemasterai.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskRequest {
    private String title;
    private Double estimatedDuration;
    private String matrixType;
}
