package vn.clinic.store;

import vn.clinic.model.VitalSigns;

import java.time.Instant;
import java.util.List;

/** Chuỗi thời gian sinh hiệu bệnh nhân (Cassandra: bảng patient_vital_signs). */
public interface VitalSignsHistoryStore {

    void record(VitalSignsPoint point);

    /** Các lần đo gần nhất, mới nhất trước. */
    List<VitalSignsPoint> latest(String patientId, int limit);

    record VitalSignsPoint(
            String patientId,
            Instant recordedAt,
            String visitId,
            String recordId,
            String doctorName,
            VitalSigns vitals) {
    }
}
