package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotLockDto {
    private String doctorId;
    private String appointmentDate;
    private String timeSlot;
    private String ownerId;
    private long expiresInSeconds;
}
