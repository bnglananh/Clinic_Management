package vn.clinic.service;

import vn.clinic.dto.CreatePatientRequest;
import vn.clinic.dto.PatientDto;
import vn.clinic.dto.PatientHistorySummaryDto;
import vn.clinic.dto.UpdatePatientRequest;

import java.util.List;

public interface PatientService {
    List<PatientDto> searchPatients(String query);
    PatientDto getPatientById(String id);
    PatientDto getPatientByCode(String patientCode);
    PatientDto createPatient(CreatePatientRequest request);
    PatientDto updatePatient(String id, UpdatePatientRequest request);
    PatientHistorySummaryDto getPatientHistory(String id);
}
