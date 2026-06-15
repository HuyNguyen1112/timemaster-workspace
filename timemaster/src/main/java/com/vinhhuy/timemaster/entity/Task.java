package com.vinhhuy.timemaster.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

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
    private LocalTime startTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "context_id", nullable = true)
    private Context context;

    @Column(name = "target_date")
    private LocalDate targetDate;

    private Double estimatedDuration;

    private Integer remainingDuration;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TimeBlock> timeBlocks;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PomodoroSession> pomodoroSessions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatrixType matrixType;

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
