package com.vinhhuy.timemasterai.dto;

import lombok.Data;

/**
 * Lớp cấu trúc Request JSON để nhận dữ liệu từ UI/Client (Postman)
 * Thay vì lấy một String thuần, chúng ta đóng gói thành Model chuẩn chỉnh.
 */
@Data
public class ChatRequest {
    /**
     * Dòng chat của user
     */
    private String message;
    
    /**
     * Tùy chọn ID của User để lưu lịch sử hội thoại tách biệt
     */
    private String userId; 
}
