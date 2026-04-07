package com.vinhhuy.timemaster.repository;

import com.vinhhuy.timemaster.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Lấy tất cả công việc của một User
    List<Task> findByUserId(Long userId);

    // Lấy công việc của User theo Trạng thái (Ví dụ: Lấy các việc CHƯA HOÀN THÀNH)
    List<Task> findByUserIdAndStatus(Long userId, Task.TaskStatus status);

    // Lấy công việc của User theo ô Ma trận (Q1, Q2...)
    List<Task> findByUserIdAndMatrixType(Long userId, Task.MatrixType matrixType);

    // Lấy các công việc trong 1 khoảng thời gian (Dùng để hiển thị trên Lịch / Dashboard ngày hôm nay)
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.createdAt >= :startOfDay AND t.createdAt <= :endOfDay")
    List<Task> findTasksForToday(@Param("userId") Long userId,
                                 @Param("startOfDay") LocalDateTime startOfDay,
                                 @Param("endOfDay") LocalDateTime endOfDay);

    // Đếm số công việc đã hoàn thành trong ngày theo từng ô Ma trận (Q1, Q2...)
    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.status = 'COMPLETED' AND t.matrixType = :matrixType AND t.createdAt >= :startOfDay AND t.createdAt <= :endOfDay")
    long countCompletedTasksByMatrixAndDate(@Param("userId") Long userId,
                                            @Param("matrixType") Task.MatrixType matrixType,
                                            @Param("startOfDay") LocalDateTime startOfDay,
                                            @Param("endOfDay") LocalDateTime endOfDay);
}
