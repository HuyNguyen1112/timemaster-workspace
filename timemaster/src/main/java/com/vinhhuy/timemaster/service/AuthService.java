package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.AuthResponse;
import com.vinhhuy.timemaster.dto.LoginRequest;
import com.vinhhuy.timemaster.dto.RegisterRequest;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
}