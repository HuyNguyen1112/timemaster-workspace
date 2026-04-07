package com.vinhhuy.timemaster.repository;

import com.vinhhuy.timemaster.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Lấy toàn bộ danh mục của một user cụ thể
    List<Category> findByUserId(Long userId);
}
