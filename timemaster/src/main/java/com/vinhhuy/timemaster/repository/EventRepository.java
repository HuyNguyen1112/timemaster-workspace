package com.vinhhuy.timemaster.repository;

import com.vinhhuy.timemaster.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByUserIdAndStartTimeBetween(Long userId, LocalDateTime start, LocalDateTime end);
    long countByContextId(Long contextId);
}
