package vn.clinic.service;

import vn.clinic.dto.CreateMedicalRecordRequest;
import vn.clinic.dto.MedicalRecordDto;

import java.util.List;

public interface MedicalRecordService {

    List<MedicalRecordDto> getPatientRecords(String patientId, String keyword, String department, Integer year);

    MedicalRecordDto getRecordById(String id);

    MedicalRecordDto getRecordByVisitCode(String visitCode);

    MedicalRecordDto getRecordByVisitId(String visitId);

    MedicalRecordDto createRecord(CreateMedicalRecordRequest request);

    MedicalRecordDto lockRecord(String id);
}
