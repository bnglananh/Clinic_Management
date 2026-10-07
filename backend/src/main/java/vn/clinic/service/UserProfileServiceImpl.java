package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.ChangePasswordRequest;
import vn.clinic.dto.UpdateProfileRequest;
import vn.clinic.dto.UserProfileDto;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.PatientProfile;
import vn.clinic.repository.PatientProfileRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final PatientProfileRepository patientProfileRepository;

    @Override
    public UserProfileDto getProfile(String userId) {
        // Default fallback to "usr-pat-01" if null or empty for development convenience
        String resolvedId = (userId == null || userId.isBlank()) ? "usr-pat-01" : userId;
        PatientProfile profile = patientProfileRepository.findById(resolvedId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cá nhân của người dùng: " + resolvedId));
        return UserProfileDto.fromEntity(profile);
    }

    @Override
    public UserProfileDto updateProfile(String userId, UpdateProfileRequest request) {
        String resolvedId = (userId == null || userId.isBlank()) ? "usr-pat-01" : userId;
        PatientProfile profile = patientProfileRepository.findById(resolvedId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cá nhân của người dùng: " + resolvedId));

        // Kiểm tra email không trùng với người khác (SRS BR 3.1)
        patientProfileRepository.findByEmail(request.getEmail().trim()).ifPresent(existing -> {
            if (!existing.getId().equals(resolvedId)) {
                throw new DuplicateResourceException("Địa chỉ email '" + request.getEmail() + "' đã được sử dụng bởi tài khoản khác.");
            }
        });

        // Kiểm tra số điện thoại không trùng với người khác (SRS BR 3.1)
        patientProfileRepository.findByPhone(request.getPhone().trim()).ifPresent(existing -> {
            if (!existing.getId().equals(resolvedId)) {
                throw new DuplicateResourceException("Số điện thoại '" + request.getPhone() + "' đã được sử dụng bởi tài khoản khác.");
            }
        });

        profile.setFullName(request.getFullName().trim());
        profile.setEmail(request.getEmail().trim().toLowerCase());
        profile.setPhone(request.getPhone().trim());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        profile.setIdentityCardNumber(request.getIdentityCardNumber());
        profile.setHealthInsuranceNumber(request.getHealthInsuranceNumber());
        profile.setBloodType(request.getBloodType());
        profile.setAllergies(request.getAllergies());
        profile.setMedicalNotes(request.getMedicalNotes());

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }

        profile.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        PatientProfile saved = patientProfileRepository.save(profile);
        log.info("Updated patient profile successfully: id={}", saved.getId());
        return UserProfileDto.fromEntity(saved);
    }

    @Override
    public void changePassword(String userId, ChangePasswordRequest request) {
        String resolvedId = (userId == null || userId.isBlank()) ? "usr-pat-01" : userId;
        PatientProfile profile = patientProfileRepository.findById(resolvedId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cá nhân của người dùng: " + resolvedId));

        // SRS UC01 BR 4.1: Nếu mật khẩu hiện tại không chính xác, hệ thống thông báo lỗi
        if (!request.getCurrentPassword().equals(profile.getPassword())) {
            log.warn("Password change failed: Incorrect current password for user: {}", resolvedId);
            throw new BusinessRuleException("Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại (SRS BR 4.1).");
        }

        // Kiểm tra mật khẩu xác nhận
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessRuleException("Mật khẩu mới và xác nhận mật khẩu không trùng khớp.");
        }

        // SRS UC01 BR 4.2: Nếu mật khẩu mới không đáp ứng yêu cầu bảo mật / trùng mật khẩu cũ
        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw new BusinessRuleException("Mật khẩu mới không được trùng với mật khẩu hiện tại (SRS BR 4.2).");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BusinessRuleException("Mật khẩu mới phải có tối thiểu 6 ký tự để đảm bảo an toàn (SRS BR 4.2).");
        }

        profile.setPassword(request.getNewPassword());
        profile.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        patientProfileRepository.save(profile);
        log.info("Password changed successfully for user: {}", resolvedId);
    }

    @Override
    public UserProfileDto updateAvatar(String userId, String avatarUrl) {
        String resolvedId = (userId == null || userId.isBlank()) ? "usr-pat-01" : userId;
        PatientProfile profile = patientProfileRepository.findById(resolvedId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cá nhân của người dùng: " + resolvedId));

        profile.setAvatarUrl(avatarUrl);
        profile.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        PatientProfile saved = patientProfileRepository.save(profile);
        return UserProfileDto.fromEntity(saved);
    }
}
