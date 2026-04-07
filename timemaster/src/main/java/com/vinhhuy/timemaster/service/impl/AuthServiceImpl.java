package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.AuthResponse;
import com.vinhhuy.timemaster.dto.LoginRequest;
import com.vinhhuy.timemaster.dto.RegisterRequest;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.security.JwtTokenProvider;
import com.vinhhuy.timemaster.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Override
    public AuthResponse login(LoginRequest request) {
        // 1. Dùng cỗ máy AuthenticationManager để kiểm tra email và password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        // 2. Nếu không báo lỗi tức là mật khẩu đúng, lưu trạng thái vào SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Tạo JWT Token
        String jwt = tokenProvider.generateToken(request.email());

        // 4. Lấy thêm thông tin User để trả về cho Mobile App hiển thị
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return new AuthResponse(jwt, user.getId(), user.getEmail(), user.getFullName());
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email này đã được sử dụng. Vui lòng chọn email khác!");
        }

        // 2. Tạo User mới và BĂM MẬT KHẨU
        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password())); // Không bao giờ lưu raw password

        userRepository.save(user);

        // 3. Đăng nhập luôn cho user sau khi đăng ký thành công
        String jwt = tokenProvider.generateToken(user.getEmail());

        return new AuthResponse(jwt, user.getId(), user.getEmail(), user.getFullName());
    }
}