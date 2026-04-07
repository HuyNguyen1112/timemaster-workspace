package com.vinhhuy.timemaster.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank(message = "Tên danh mục không được để trống")
        String name,

        // Màu sắc để hiển thị trên App (Ví dụ: #FF5733)
        String colorCode
) {}
