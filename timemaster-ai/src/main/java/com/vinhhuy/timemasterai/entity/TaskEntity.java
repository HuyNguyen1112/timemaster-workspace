package com.vinhhuy.timemasterai.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Mirror of the Task entity from the Core module.
 * Used for RAG ingestion to feed user history into the AI.
 */
@Entity
@Table(name = "tasks") // Pointing to the shared table
@Data
public class TaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    private String status;

    @Column(name = "user_id")
    private Long userId;
}
