package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientQueueTrackingDto {
    private String ticketId;
    private String ticketNumber;           // STT (vd: A-011)
    private String patientId;
    private String patientCode;
    private String patientName;
    private String roomName;               // Buồng khám (vd: Phòng Khám Nội 101)
    private String doctorName;             // Bác sĩ điều trị
    private String checkinTime;
    private String estimatedTime;          // Thời gian dự kiến vào khám
    private QueueStatus status;            // WAITING / IN_PROGRESS / COMPLETED
    private PriorityLevel priority;

    private String currentCallingNumber;   // Số STT hiện đang được gọi khám trong phòng
    private int peopleAhead;               // Số người còn lại phía trước trong cùng phòng
    private int stepperStep;               // 1: Chờ gọi số, 2: Đang khám, 3: Hoàn tất
}
