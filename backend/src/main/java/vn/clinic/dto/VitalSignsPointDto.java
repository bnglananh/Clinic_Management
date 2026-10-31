package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.VitalSigns;
import vn.clinic.store.VitalSignsHistoryStore;

import java.time.Instant;

/** Một lần đo sinh hiệu trong chuỗi thời gian. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VitalSignsPointDto {
    private Instant recordedAt;
    private String visitId;
    private String recordId;
    private String doctorName;
    private VitalSigns vitals;

    public static VitalSignsPointDto from(VitalSignsHistoryStore.VitalSignsPoint p) {
        return VitalSignsPointDto.builder()
                .recordedAt(p.recordedAt())
                .visitId(p.visitId())
                .recordId(p.recordId())
                .doctorName(p.doctorName())
                .vitals(p.vitals())
                .build();
    }
}
