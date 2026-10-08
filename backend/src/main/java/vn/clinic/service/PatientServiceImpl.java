package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.*;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.PatientProfile;
import vn.clinic.model.UserRole;
import vn.clinic.repository.AppointmentRepository;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.QueueTicketRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final QueueTicketRepository queueTicketRepository;

    @Override
    public List<PatientDto> searchPatients(String query) {
        return patientProfileRepository.search(query).stream()
                .map(PatientDto::fromEntity)
                .toList();
    }

    @Override
    public PatientDto getPatientById(String id) {
        PatientProfile patient = findOrThrow(id);
        return PatientDto.fromEntity(patient);
    }

    @Override
    public PatientDto getPatientByCode(String patientCode) {
        PatientProfile patient = patientProfileRepository.findByPatientCode(patientCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh nhân với mã: " + patientCode));
        return PatientDto.fromEntity(patient);
    }

    @Override
    public PatientDto createPatient(CreatePatientRequest request) {
        // BR-03: Kiểm tra tính duy nhất (trùng CCCD hoặc SĐT) trước khi tạo mới hồ sơ
        if (patientProfileRepository.existsByIdentityCardNumber(request.getCccd().trim())) {
            throw new DuplicateResourceException("Số CCCD/Định danh cá nhân đã tồn tại trong hệ thống: " + request.getCccd() + " (SRS BR-03 & UC012)");
        }
        if (patientProfileRepository.existsByPhone(request.getPhone().trim())) {
            throw new DuplicateResourceException("Số điện thoại đã được đăng ký cho bệnh nhân khác: " + request.getPhone() + " (SRS BR-03 & UC012)");
        }

        long count = patientProfileRepository.findAll().size();
        String patientCode = String.format("BN-2026-%04d", count + 910);
        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);

        PatientProfile newPatient = PatientProfile.builder()
                .id("p-" + System.currentTimeMillis())
                .patientCode(patientCode)
                .identityCardNumber(request.getCccd().trim())
                .fullName(request.getFullName().trim())
                .dateOfBirth(request.getDateOfBirth().trim())
                .gender(request.getGender().trim().toUpperCase())
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .address(request.getAddress().trim())
                .allergies(request.getAllergyHistory() != null ? request.getAllergyHistory().trim() : "Không ghi nhận tiền sử dị ứng")
                .bloodType(request.getBloodType() != null ? request.getBloodType().trim().toUpperCase() : null)
                .healthInsuranceNumber(request.getInsuranceNumber() != null ? request.getInsuranceNumber().trim() : null)
                .emergencyContactName(request.getEmergencyContactName() != null ? request.getEmergencyContactName().trim() : null)
                .emergencyContactPhone(request.getEmergencyContactPhone() != null ? request.getEmergencyContactPhone().trim() : null)
                .medicalNotes(request.getMedicalNotes() != null ? request.getMedicalNotes().trim() : null)
                .totalVisits(1)
                .role(UserRole.PATIENT)
                .createdAt(today)
                .updatedAt(today)
                .build();

        PatientProfile saved = patientProfileRepository.save(newPatient);
        log.info("Created new patient record: code={}, cccd={}, name={}, phone={}",
                saved.getPatientCode(), saved.getIdentityCardNumber(), saved.getFullName(), saved.getPhone());
        return PatientDto.fromEntity(saved);
    }

    @Override
    public PatientDto updatePatient(String id, UpdatePatientRequest request) {
        PatientProfile patient = findOrThrow(id);

        // BR-03: Kiểm tra trùng CCCD hoặc SĐT với bệnh nhân khác
        if (patientProfileRepository.existsByIdentityCardNumberAndIdNot(request.getCccd().trim(), id)) {
            throw new DuplicateResourceException("Số CCCD đã thuộc về bệnh nhân khác trong hệ thống: " + request.getCccd() + " (SRS BR-03)");
        }
        if (patientProfileRepository.existsByPhoneAndIdNot(request.getPhone().trim(), id)) {
            throw new DuplicateResourceException("Số điện thoại đã thuộc về bệnh nhân khác trong hệ thống: " + request.getPhone() + " (SRS BR-03)");
        }

        patient.setIdentityCardNumber(request.getCccd().trim());
        patient.setFullName(request.getFullName().trim());
        patient.setDateOfBirth(request.getDateOfBirth().trim());
        patient.setGender(request.getGender().trim().toUpperCase());
        patient.setPhone(request.getPhone().trim());
        if (request.getEmail() != null) {
            patient.setEmail(request.getEmail().trim());
        }
        patient.setAddress(request.getAddress().trim());
        if (request.getAllergyHistory() != null) {
            patient.setAllergies(request.getAllergyHistory().trim());
        }
        if (request.getBloodType() != null) {
            patient.setBloodType(request.getBloodType().trim().toUpperCase());
        }
        if (request.getInsuranceNumber() != null) {
            patient.setHealthInsuranceNumber(request.getInsuranceNumber().trim());
        }
        if (request.getEmergencyContactName() != null) {
            patient.setEmergencyContactName(request.getEmergencyContactName().trim());
        }
        if (request.getEmergencyContactPhone() != null) {
            patient.setEmergencyContactPhone(request.getEmergencyContactPhone().trim());
        }
        if (request.getMedicalNotes() != null) {
            patient.setMedicalNotes(request.getMedicalNotes().trim());
        }
        patient.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));

        PatientProfile updated = patientProfileRepository.save(patient);
        log.info("Updated patient record {}: name={}, phone={}", updated.getPatientCode(), updated.getFullName(), updated.getPhone());
        return PatientDto.fromEntity(updated);
    }

    @Override
    public PatientHistorySummaryDto getPatientHistory(String id) {
        PatientProfile patient = findOrThrow(id);
        PatientDto patientDto = PatientDto.fromEntity(patient);

        List<AppointmentDto> appointments = appointmentRepository.findByPatientId(id).stream()
                .map(AppointmentDto::fromEntity)
                .toList();

        List<QueueTicketDto> tickets = queueTicketRepository.findByPatientId(id).stream()
                .map(QueueTicketDto::fromEntity)
                .toList();

        return PatientHistorySummaryDto.builder()
                .patient(patientDto)
                .appointments(appointments)
                .queueTickets(tickets)
                .build();
    }

    private PatientProfile findOrThrow(String id) {
        return patientProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh nhân với ID: " + id));
    }
}
