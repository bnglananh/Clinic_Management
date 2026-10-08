package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.Appointment;
import vn.clinic.model.AppointmentStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private String id;
    private String appointmentCode;
    private String patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private String department;
    private String doctorId;
    private String doctorName;
    private String appointmentDate;
    private String timeSlot;
    private String reasonForVisit;
    private AppointmentStatus status;
    private String createdAt;
    private String notes;
    private String cancelReason;

    public static AppointmentDto fromEntity(Appointment a) {
        if (a == null) return null;
        return AppointmentDto.builder()
                .id(a.getId())
                .appointmentCode(a.getAppointmentCode())
                .patientId(a.getPatientId())
                .patientCode(a.getPatientCode())
                .patientName(a.getPatientName())
                .phone(a.getPhone())
                .department(a.getDepartment())
                .doctorId(a.getDoctorId())
                .doctorName(a.getDoctorName())
                .appointmentDate(a.getAppointmentDate())
                .timeSlot(a.getTimeSlot())
                .reasonForVisit(a.getReasonForVisit())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .notes(a.getNotes())
                .cancelReason(a.getCancelReason())
                .build();
    }
}
