package com.vinhhuy.timemaster.dto;

public record AuthResponse(
        String token,
        Long userId,
        String email,
        String fullName
) {}
