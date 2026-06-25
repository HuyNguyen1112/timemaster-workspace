package com.vinhhuy.timemaster.service.impl;

import com.vinhhuy.timemaster.dto.UpdateUserRequest;
import com.vinhhuy.timemaster.dto.UserResponse;
import com.vinhhuy.timemaster.entity.User;
import com.vinhhuy.timemaster.repository.UserRepository;
import com.vinhhuy.timemaster.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();
    }

    @Override
    public UserResponse getCurrentUser() {
        User user = getAuthenticatedUser();
        return mapToResponse(user);
    }

    @Override
    public UserResponse updateProfile(UpdateUserRequest request) {
        User user = getAuthenticatedUser();
        
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        
        userRepository.save(user);
        
        return mapToResponse(user);
    }

    @Override
    public void changePassword(com.vinhhuy.timemaster.dto.ChangePasswordRequest request) {
        User user = getAuthenticatedUser();
        
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
