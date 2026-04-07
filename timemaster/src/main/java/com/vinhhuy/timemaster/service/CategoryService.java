package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.CategoryRequest;
import com.vinhhuy.timemaster.dto.CategoryResponse;
import java.util.List;

public interface CategoryService {
    CategoryResponse createCategory(String email, CategoryRequest request);
    List<CategoryResponse> getCategoriesByUser(String email);
    CategoryResponse updateCategory(Long categoryId, String email, CategoryRequest request);
    void deleteCategory(Long categoryId, String email);
}