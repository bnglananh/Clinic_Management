package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfile {
    private String id;                     // Mã người dùng (vd: "usr-pat-01")
    private String patientCode;            // Mã bệnh nhân (vd: "BN-2026-001")
    private String username;               // Tên đăng nhập
    private String password;               // Mật khẩu (mã hóa / mock hash)
    private String fullName;               // Họ và tên
    private String dateOfBirth;            // Ngày sinh (YYYY-MM-DD)
    private String gender;                 // Giới tính: "NAM", "NỮ", "KHÁC"
    private String phone;                  // Số điện thoại
    private String email;                  // Email
    private String address;                // Địa chỉ cư trú
    private String identityCardNumber;     // CCCD / Định danh cá nhân
    private String healthInsuranceNumber;  // Số thẻ BHYT
    private String bloodType;              // Nhóm máu (vd: "O+", "A+", "B+", "AB+")
    private String allergies;              // Dị ứng (thuốc, thức ăn)
    private String medicalNotes;           // Ghi chú tiền sử y khoa
    private String avatarUrl;              // Ảnh đại diện
    private UserRole role;                 // Vai trò (PATIENT)
    private String membershipTier;         // Hạng thành viên (Vàng, Bạc, Tiêu chuẩn)
    private String emergencyContactName;   // Tên người thân liên hệ khẩn cấp
    private String emergencyContactPhone;  // SĐT người thân liên hệ khẩn cấp
    private Integer totalVisits;           // Tổng số lượt khám tại phòng khám
    private String createdAt;              // Ngày tạo tài khoản
    private String updatedAt;              // Ngày cập nhật gần nhất
}

