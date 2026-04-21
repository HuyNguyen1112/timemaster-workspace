package com.vinhhuy.timemaster.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitLogResponse {
    private Long id;
    private LocalDate logDate;
    private Integer progressValue;
    private boolean completed;
}
