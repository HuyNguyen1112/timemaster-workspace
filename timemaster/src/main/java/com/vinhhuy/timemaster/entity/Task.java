package com.vinhhuy.timemaster.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "tasks")
@Data @NoArgsConstructor @AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String title;

    private LocalTime startTime; // Giờ dự kiến bắt đầu

    private Double estimatedDuration; // Thời lượng dự kiến (giờ)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatrixType matrixType; // Q1, Q2, Q3, Q4

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum MatrixType {
        Q1, Q2, Q3, Q4
    }

    public enum TaskStatus {
        PENDING, IN_PROGRESS, COMPLETED
    }
}
