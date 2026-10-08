package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {
    private String patientId;
    private String patientCode;

    @NotBlank(message = "Họ tên bệnh nhân không được để trống (BR-04)")
    private String patientName;

    @NotBlank(message = "Số điện thoại không được để trống (BR-04)")
    private String phone;

    @NotBlank(message = "Chuyên khoa khám không được để trống (BR-04)")
    private String department;

    @NotBlank(message = "Mã bác sĩ không được để trống (BR-04)")
    private String doctorId;

    private String doctorName;

    @NotBlank(message = "Ngày khám không được để trống (BR-04)")
    private String appointmentDate;

    @NotBlank(message = "Khung giờ khám không được để trống (BR-04)")
    private String timeSlot;

    @NotBlank(message = "Lý do khám không được để trống (BR-04)")
    private String reasonForVisit;

    private String notes;
}
