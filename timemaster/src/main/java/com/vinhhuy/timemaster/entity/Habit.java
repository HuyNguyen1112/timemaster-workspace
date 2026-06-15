package com.vinhhuy.timemaster.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "habits")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Habit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    private String description;

    private String icon;

    private String colorCode;

    @Column(name = "daily_goal")
    private Integer dailyGoal = 1;

    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Frequency frequency = Frequency.DAILY;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_source")
    private VerificationSource verificationSource = VerificationSource.NONE;

    @Column(name = "is_system_habit")
    private Boolean isSystemHabit = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "routine")
    private Routine routine = Routine.ALL_DAY;

    public Boolean isSystemHabit() {
        return isSystemHabit;
    }

    public void setSystemHabit(Boolean isSystemHabit) {
        this.isSystemHabit = isSystemHabit;
    }

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Frequency {
        DAILY, WEEKLY
    }

    public enum VerificationSource {
        NONE, GOOGLE_FIT_STEPS
    }

    public enum Routine {
        MORNING, AFTERNOON, EVENING, ALL_DAY
    }
}
