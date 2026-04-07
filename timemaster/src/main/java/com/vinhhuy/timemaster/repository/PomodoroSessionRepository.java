package com.vinhhuy.timemaster.repository;

import com.vinhhuy.timemaster.entity.PomodoroSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PomodoroSessionRepository extends JpaRepository<PomodoroSession, Long> {

    List<PomodoroSession> findByUserId(Long userId);

    // Lấy lịch sử Pomodoro của một công việc cụ thể
    List<PomodoroSession> findByTaskId(Long taskId);

    // SQL tính Tổng số phút đã tập trung thành công của 1 User trong khoảng thời gian nhất định (Dùng làm Báo cáo)
    @Query("SELECT SUM(p.durationMinutes) FROM PomodoroSession p WHERE p.user.id = :userId AND p.status = 'COMPLETED' AND p.startTime >= :startDate AND p.endTime <= :endDate")
    Integer getTotalFocusTime(@Param("userId") Long userId,
                              @Param("startDate") LocalDateTime startDate,
                              @Param("endDate") LocalDateTime endDate);
}