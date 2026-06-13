package com.vinhhuy.timemaster.repository;

import com.vinhhuy.timemaster.entity.Context;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContextRepository extends JpaRepository<Context, Long> {
    List<Context> findByUserId(Long userId);
}
