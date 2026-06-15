package com.vinhhuy.timemaster.repository;

import com.vinhhuy.timemaster.entity.ContextSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface ContextScheduleRepository extends JpaRepository<ContextSchedule, Long> {
    List<ContextSchedule> findByContextId(Long contextId);
    List<ContextSchedule> findByContextIdAndDayOfWeek(Long contextId, Integer dayOfWeek);

    @Query(
        "SELECT DISTINCT cs.dayOfWeek FROM ContextSchedule cs WHERE cs.context.id = :contextId")
    List<Integer> findScheduledDaysOfWeek(
        @Param("contextId") Long contextId);

    @Query(
        "SELECT cs FROM ContextSchedule cs WHERE cs.context.user.id = :userId AND cs.dayOfWeek = :dayOfWeek")
    List<ContextSchedule> findByUserIdAndDayOfWeek(
        @Param("userId") Long userId,
        @Param("dayOfWeek") Integer dayOfWeek);
}
