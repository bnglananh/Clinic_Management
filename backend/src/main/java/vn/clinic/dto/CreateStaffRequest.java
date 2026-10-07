package vn.clinic.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.UserRole;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequest {

    @NotBlank(message = "Họ và tên nhân viên không được để trống")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự")
    private String fullName;

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3 đến 50 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Tên đăng nhập chỉ chứa chữ cái, chữ số, dấu gạch dưới, gạch ngang và dấu chấm")
    private String username;

    private String password;

    @NotBlank(message = "Địa chỉ email không được để trống")
    @Email(message = "Địa chỉ email không đúng định dạng hợp lệ")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;

    @NotNull(message = "Vai trò (RBAC) không được để trống")
    private UserRole role;

    @NotBlank(message = "Khoa / Phòng ban không được để trống")
    private String department;

    private String title;

    private Set<String> permissions;
}
