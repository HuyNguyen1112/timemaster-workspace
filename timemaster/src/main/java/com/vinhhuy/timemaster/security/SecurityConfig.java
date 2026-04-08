package com.vinhhuy.timemaster.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // Tiêm (Inject) Bác bảo vệ mà chúng ta đã tạo vào đây
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Cấu hình công cụ băm mật khẩu (Hash Password)
     * BCrypt là thuật toán chuẩn công nghiệp, rất an toàn để lưu vào Database.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Cung cấp AuthenticationManager để phục vụ cho việc gọi hàm Đăng nhập ở AuthService
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * Trái tim của Security: Cấu hình luồng bảo mật (Filter Chain)
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tắt CSRF vì hệ thống của chúng ta là REST API gọi từ Mobile App, không dùng Form HTML
                .csrf(AbstractHttpConfigurer::disable)

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            // Tự tay set mã lỗi 401
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            // Ép kiểu trả về là JSON và hỗ trợ tiếng Việt (UTF-8)
                            response.setContentType("application/json;charset=UTF-8");
                            // Viết trực tiếp cục JSON ra màn hình
                            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Bạn chưa đăng nhập hoặc Token không hợp lệ!\"}");
                        })
                )
                // 2. Không sử dụng Session lưu trên Server, chuyển sang hoàn toàn phi trạng thái (Stateless) với JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 3. Phân quyền các đường dẫn API
                .authorizeHttpRequests(auth -> auth
                        // Mở cửa hoàn toàn cho các API liên quan đến Đăng ký, Đăng nhập
                        .requestMatchers("/api/auth/**").permitAll()
                        // Cho phép đường truyền máy quét nội bộ MCP đi qua không cần JWT
                        .requestMatchers("/mcp/**", "/sse", "/error").permitAll()
                        // TẤT CẢ các API còn lại (Task, Pomodoro...) ĐỀU PHẢI có thẻ JWT (đã đăng nhập)
                        .anyRequest().authenticated()
                )

                // 4. Đặt Bác bảo vệ (JwtFilter) đứng ngay trước cửa (UsernamePasswordAuthenticationFilter)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}