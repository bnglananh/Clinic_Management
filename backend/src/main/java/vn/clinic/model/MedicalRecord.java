package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecord {
    private String id;               // REC-01
    private String visitCode;        // EMR-2026-0012
    private String visitId;          // vis-001
    private String patientId;        // p-001, p-004, usr-pat-01
    private String patientCode;      // BN-2026-0885
    private String patientName;
    private String patientGender;
    private String patientDob;

    private String department;       // Khoa Tim Mạch
    private String doctorName;       // Trần Minh Hoàng
    private String doctorTitle;      // TS.BS
    private String roomName;         // Phòng khám Nội 101

    private String visitDate;        // 2026-10-05
    private String chiefComplaint;   // Lý do khám
    private String clinicalSymptoms; // Triệu chứng lâm sàng

    @Builder.Default
    private List<String> allergies = new ArrayList<>();

    private VitalSigns vitals;

    @Builder.Default
    private List<DiagnosisItem> diagnoses = new ArrayList<>();

    @Builder.Default
    private List<ClinicalServiceOrder> services = new ArrayList<>();

    @Builder.Default
    private List<PrescriptionItem> prescriptions = new ArrayList<>();

    private String doctorAdvice;     // Lời dặn y bác sĩ
    private Integer followUpDays;    // Số ngày hẹn tái khám (vd: 30)
    private boolean isLocked;        // BR-23: true khi khám hoàn tất
    private int version;             // Phiên bản bệnh án (vd: 1)
    private String createdAt;
    private String updatedAt;
}
