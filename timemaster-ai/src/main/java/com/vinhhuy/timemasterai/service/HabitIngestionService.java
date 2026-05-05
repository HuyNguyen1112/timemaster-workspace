package com.vinhhuy.timemasterai.service;

import com.vinhhuy.timemasterai.dto.HabitResponse;

public interface HabitIngestionService {
    void ingestSingleHabit(HabitResponse habit, Long userId);
    void removeHabitFromVectorStore(Long habitId);
}
