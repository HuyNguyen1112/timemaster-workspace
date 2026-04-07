package com.vinhhuy.timemaster.controller;

import com.vinhhuy.timemaster.dto.CategoryRequest;
import com.vinhhuy.timemaster.dto.CategoryResponse;
import com.vinhhuy.timemaster.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            Principal principal, // Lấy thông tin user từ Token
            @Valid @RequestBody CategoryRequest request) {

        // principal.getName() sẽ trả về email của người dùng (Subject được lưu trong JWT)
        CategoryResponse response = categoryService.createCategory(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(Principal principal) {
        List<CategoryResponse> categories = categoryService.getCategoriesByUser(principal.getName());
        return ResponseEntity.ok(categories);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long categoryId,
            Principal principal,
            @Valid @RequestBody CategoryRequest request) {

        CategoryResponse response = categoryService.updateCategory(categoryId, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long categoryId,
            Principal principal) {

        categoryService.deleteCategory(categoryId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
