package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.ClinicalServiceOrder;
import vn.clinic.model.DiagnosisItem;
import vn.clinic.model.PrescriptionItem;
import vn.clinic.model.VitalSigns;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordDto {
    private String id;
    private String visitCode;
    private String visitId;
    private String patientId;
    private String patientCode;
    private String patientName;
    private String patientGender;
    private String patientDob;

    private String department;
    private String doctorName;
    private String doctorTitle;
    private String roomName;

    private String visitDate;
    private String chiefComplaint;
    private String clinicalSymptoms;

    private List<String> allergies;
    private VitalSigns vitals;
    private List<DiagnosisItem> diagnoses;
    private List<ClinicalServiceOrder> services;
    private List<PrescriptionItem> prescriptions;

    private String doctorAdvice;
    private Integer followUpDays;
    private boolean isLocked;
    private int version;
    private String createdAt;
}
