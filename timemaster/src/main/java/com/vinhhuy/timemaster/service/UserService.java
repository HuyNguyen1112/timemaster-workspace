package com.vinhhuy.timemaster.service;

import com.vinhhuy.timemaster.dto.UpdateUserRequest;
import com.vinhhuy.timemaster.dto.UserResponse;

public interface UserService {
    UserResponse getCurrentUser();
    UserResponse updateProfile(UpdateUserRequest request);
    void changePassword(com.vinhhuy.timemaster.dto.ChangePasswordRequest request);
}
