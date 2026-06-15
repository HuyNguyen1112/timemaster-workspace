package com.vinhhuy.timemaster.repository;

import com.vinhhuy.timemaster.entity.TimeBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TimeBlockRepository extends JpaRepository<TimeBlock, Long> {
    
    @Modifying
    @Query("DELETE FROM TimeBlock tb WHERE tb.task.id IN :taskIds AND tb.startTime >= :startOfDay AND tb.startTime < :endOfDay AND (tb.isLocked = false OR tb.isLocked IS NULL)")
    void deleteByTaskIdsAndDate(@Param("taskIds") List<Long> taskIds, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
    
    @Query("SELECT tb FROM TimeBlock tb JOIN tb.task t WHERE t.user.id = :userId AND tb.startTime >= :startOfDay AND tb.startTime < :endOfDay AND tb.isLocked = true")
    List<TimeBlock> findLockedBlocksByUserIdAndDateRange(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
    
    @Modifying
    @Query("DELETE FROM TimeBlock tb WHERE tb.task.id = :taskId AND (tb.isLocked = false OR tb.isLocked IS NULL)")
    void deleteUnlockedByTaskId(@Param("taskId") Long taskId);
    
    @Modifying
    @Query("DELETE FROM TimeBlock tb WHERE tb.task.id = :taskId AND tb.startTime > :now AND (tb.isLocked = false OR tb.isLocked IS NULL)")
    void deleteFutureUnlockedByTaskId(@Param("taskId") Long taskId, @Param("now") LocalDateTime now);
    
    @Query("SELECT tb FROM TimeBlock tb JOIN FETCH tb.task t LEFT JOIN FETCH t.context WHERE t.user.id = :userId AND tb.startTime >= :start AND tb.startTime < :end ORDER BY tb.startTime")
    List<TimeBlock> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = "SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/60), 0) FROM time_blocks WHERE task_id = :taskId AND start_time >= :start AND end_time <= :end", nativeQuery = true)
    Long sumDurationByTaskIdAndDateRange(@Param("taskId") Long taskId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
