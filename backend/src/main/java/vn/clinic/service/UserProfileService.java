package vn.clinic.service;

import vn.clinic.dto.ChangePasswordRequest;
import vn.clinic.dto.UpdateProfileRequest;
import vn.clinic.dto.UserProfileDto;

public interface UserProfileService {

    UserProfileDto getProfile(String userId);

    UserProfileDto updateProfile(String userId, UpdateProfileRequest request);

    void changePassword(String userId, ChangePasswordRequest request);

    UserProfileDto updateAvatar(String userId, String avatarUrl);
}
