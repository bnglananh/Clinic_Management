package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;
import vn.clinic.model.QueueTicket;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueTicketDto {
    private String id;
    private String ticketNumber;
    private String patientId;
    private String patientCode;
    private String patientName;
    private String gender;
    private Integer yearOfBirth;
    private String phone;
    private QueueStatus status;
    private PriorityLevel priority;
    private String roomName;
    private String doctorId;
    private String doctorName;
    private String estimatedTime;
    private String checkinTime;
    private String notes;
    private String appointmentId;

    public static QueueTicketDto fromEntity(QueueTicket t) {
        if (t == null) return null;
        return QueueTicketDto.builder()
                .id(t.getId())
                .ticketNumber(t.getTicketNumber())
                .patientId(t.getPatientId())
                .patientCode(t.getPatientCode())
                .patientName(t.getPatientName())
                .gender(t.getGender())
                .yearOfBirth(t.getYearOfBirth())
                .phone(t.getPhone())
                .status(t.getStatus())
                .priority(t.getPriority())
                .roomName(t.getRoomName())
                .doctorId(t.getDoctorId())
                .doctorName(t.getDoctorName())
                .estimatedTime(t.getEstimatedTime())
                .checkinTime(t.getCheckinTime())
                .notes(t.getNotes())
                .appointmentId(t.getAppointmentId())
                .build();
    }
}
