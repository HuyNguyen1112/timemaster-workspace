package com.vinhhuy.timemaster.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean isFixed = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean isOverloaded = false;

    @Column(name = "start_time")
    private java.time.LocalTime startTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "context_id", nullable = true) // Context is optional for fixed tasks
    private Context context;

    @Column(name = "target_date")
    private LocalDate targetDate;

    private Double estimatedDuration; // Thời lượng dự kiến (giờ)

    private Integer remainingDuration; // Thời lượng còn lại (phút)

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<TimeBlock> timeBlocks;

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
