package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.PriorityLevel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintTicketDto {
    private String clinicName;
    private String clinicAddress;
    private String clinicHotline;
    private String ticketNumber;
    private String roomName;
    private String doctorName;
    private String patientName;
    private String patientCode;
    private String checkinTime;
    private String estimatedTime;
    private PriorityLevel priority;
    private String notes;
}
