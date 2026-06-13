package com.vinhhuy.timemaster.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Tiện ích để lấy thông tin user hiện tại từ JWT token.
 * userId được JwtAuthenticationFilter lưu vào request attribute.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Lấy userId của người dùng hiện tại từ JWT token.
     * @return userId
     * @throws RuntimeException nếu chưa đăng nhập
     */
    public static Long getCurrentUserId() {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attrs == null) {
            throw new RuntimeException("Không thể xác định người dùng: không có HTTP request context.");
        }

        HttpServletRequest request = attrs.getRequest();
        Object userId = request.getAttribute("userId");

        if (userId == null) {
            throw new RuntimeException("Bạn chưa đăng nhập hoặc Token không hợp lệ.");
        }

        return (Long) userId;
    }
}
