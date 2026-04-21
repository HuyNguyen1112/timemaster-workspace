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

    // Biểu tượng hiển thị trên UI (ví dụ: "💧", "📚")
    private String icon;

    private String colorCode;

    // Mục tiêu hàng ngày (VD: 2 lít nước, 15 phút). Mặc định là 1 (lần)
    @Column(name = "daily_goal")
    private Integer dailyGoal = 1;

    // Đơn vị (VD: "lít", "phút", "lần")
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Frequency frequency = Frequency.DAILY;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_source")
    private VerificationSource verificationSource = VerificationSource.NONE;

    @Column(name = "is_system_habit")
    private Boolean isSystemHabit = false;

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
        NONE, GOOGLE_FIT_STEPS, GOOGLE_FIT_DISTANCE
    }
}
