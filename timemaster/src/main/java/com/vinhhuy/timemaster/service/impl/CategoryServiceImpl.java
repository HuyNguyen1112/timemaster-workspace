package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.CategoryRequest;
import com.vinhhuy.timemaster.dto.CategoryResponse;
import com.vinhhuy.timemaster.entity.Category;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.repository.CategoryRepository;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    // Hàm tiện ích dùng chung để lấy User từ Email
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(String email, CategoryRequest request) {
        User user = getUserByEmail(email);

        Category category = new Category();
        category.setName(request.name());
        category.setColorCode(request.colorCode());
        category.setUser(user);

        Category savedCategory = categoryRepository.save(category);
        return new CategoryResponse(savedCategory.getId(), savedCategory.getName(), savedCategory.getColorCode());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoriesByUser(String email) {
        User user = getUserByEmail(email);

        return categoryRepository.findByUserId(user.getId())
                .stream()
                .map(cat -> new CategoryResponse(cat.getId(), cat.getName(), cat.getColorCode()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long categoryId, String email, CategoryRequest request) {
        User user = getUserByEmail(email);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        // Kiểm tra bảo mật: Tránh trường hợp user này sửa category của user khác
        if (!category.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("403 Forbidden: Bạn không có quyền thao tác trên dữ liệu của người khác!");
        }

        category.setName(request.name());
        category.setColorCode(request.colorCode());

        Category updatedCategory = categoryRepository.save(category);
        return new CategoryResponse(updatedCategory.getId(), updatedCategory.getName(), updatedCategory.getColorCode());
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId, String email) {
        User user = getUserByEmail(email);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        if (!category.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("403 Forbidden: Bạn không có quyền thao tác trên dữ liệu của người khác!");
        }

        categoryRepository.delete(category);
    }
}