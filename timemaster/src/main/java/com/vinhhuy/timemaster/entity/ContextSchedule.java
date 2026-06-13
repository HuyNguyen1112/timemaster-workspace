package com.vinhhuy.timemaster.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "context_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContextSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "context_id", nullable = false)
    private Context context;

    @Column(nullable = false)
    private Integer dayOfWeek; // 1-7 (Monday-Sunday)

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;
}
