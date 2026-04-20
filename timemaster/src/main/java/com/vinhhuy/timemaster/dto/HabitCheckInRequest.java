package com.vinhhuy.timemaster.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitCheckInRequest {
    private LocalDate logDate;
    private Integer progressValue;
    private Boolean completed;
}
