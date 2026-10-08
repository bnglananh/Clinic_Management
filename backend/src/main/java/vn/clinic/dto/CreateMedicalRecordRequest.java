package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
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
public class CreateMedicalRecordRequest {

    @NotBlank(message = "Mã lượt khám không được để trống")
    private String visitId;

    @NotBlank(message = "Mã bệnh nhân không được để trống")
    private String patientId;

    private String department;
    private String doctorName;
    private String doctorTitle;
    private String roomName;

    private String chiefComplaint;
    private String clinicalSymptoms;
    private VitalSigns vitals;
    private List<DiagnosisItem> diagnoses;
    private List<ClinicalServiceOrder> services;
    private List<PrescriptionItem> prescriptions;
    private String doctorAdvice;
    private Integer followUpDays;
}
