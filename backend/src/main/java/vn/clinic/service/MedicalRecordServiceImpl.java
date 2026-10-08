package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.CreateMedicalRecordRequest;
import vn.clinic.dto.MedicalRecordDto;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.MedicalRecord;
import vn.clinic.model.PatientProfile;
import vn.clinic.repository.MedicalRecordRepository;
import vn.clinic.repository.PatientProfileRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientProfileRepository patientProfileRepository;

    @Override
    public List<MedicalRecordDto> getPatientRecords(String patientId, String keyword, String department, Integer year) {
        List<MedicalRecord> list = medicalRecordRepository.search(patientId, keyword, department, year);
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public MedicalRecordDto getRecordById(String id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh án với mã: " + id));
        return mapToDto(record);
    }

    @Override
    public MedicalRecordDto getRecordByVisitCode(String visitCode) {
        MedicalRecord record = medicalRecordRepository.findByVisitCode(visitCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh án với mã lượt khám: " + visitCode));
        return mapToDto(record);
    }

    @Override
    public MedicalRecordDto getRecordByVisitId(String visitId) {
        MedicalRecord record = medicalRecordRepository.findByVisitId(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh án của lượt khám ID: " + visitId));
        return mapToDto(record);
    }

    @Override
    public MedicalRecordDto createRecord(CreateMedicalRecordRequest request) {
        String patientCode = "BN-2026-0001";
        String patientName = "Bệnh nhân";
        String patientGender = "NAM";
        String patientDob = "1990-01-01";
        List<String> allergies = Collections.emptyList();

        if (request.getPatientId() != null) {
            Optional<PatientProfile> pOpt = patientProfileRepository.findById(request.getPatientId());
            if (pOpt.isEmpty()) {
                pOpt = patientProfileRepository.findByPatientCode(request.getPatientId());
            }
            if (pOpt.isPresent()) {
                PatientProfile p = pOpt.get();
                patientCode = p.getPatientCode();
                patientName = p.getFullName();
                patientGender = p.getGender();
                patientDob = p.getDateOfBirth();
                if (p.getAllergies() != null && !p.getAllergies().isBlank()) {
                    allergies = List.of(p.getAllergies().split(", "));
                }
            }
        }

        long nextIndex = medicalRecordRepository.findAll().size() + 1;
        String visitCode = String.format("EMR-2026-%04d", nextIndex);
        String today = LocalDate.now().toString();
        String nowIso = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        MedicalRecord record = MedicalRecord.builder()
                .id("REC-" + UUID.randomUUID().toString().substring(0, 8))
                .visitCode(visitCode)
                .visitId(request.getVisitId())
                .patientId(request.getPatientId())
                .patientCode(patientCode)
                .patientName(patientName)
                .patientGender(patientGender)
                .patientDob(patientDob)
                .department(request.getDepartment() != null ? request.getDepartment() : "Khoa Khám Bệnh")
                .doctorName(request.getDoctorName() != null ? request.getDoctorName() : "Bác sĩ khám")
                .doctorTitle(request.getDoctorTitle() != null ? request.getDoctorTitle() : "BS")
                .roomName(request.getRoomName() != null ? request.getRoomName() : "Phòng Khám Nội")
                .visitDate(today)
                .chiefComplaint(request.getChiefComplaint())
                .clinicalSymptoms(request.getClinicalSymptoms())
                .allergies(allergies)
                .vitals(request.getVitals())
                .diagnoses(request.getDiagnoses() != null ? request.getDiagnoses() : Collections.emptyList())
                .services(request.getServices() != null ? request.getServices() : Collections.emptyList())
                .prescriptions(request.getPrescriptions() != null ? request.getPrescriptions() : Collections.emptyList())
                .doctorAdvice(request.getDoctorAdvice())
                .followUpDays(request.getFollowUpDays())
                .isLocked(false)
                .version(1)
                .createdAt(nowIso)
                .updatedAt(nowIso)
                .build();

        MedicalRecord saved = medicalRecordRepository.save(record);
        log.info("Created medical record: visitCode={}, patient={}", saved.getVisitCode(), saved.getPatientName());
        return mapToDto(saved);
    }

    @Override
    public MedicalRecordDto lockRecord(String id) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh án ID: " + id));

        record.setLocked(true);
        record.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        MedicalRecord saved = medicalRecordRepository.save(record);
        log.info("Locked medical record: id={}, visitCode={} (BR-23)", saved.getId(), saved.getVisitCode());
        return mapToDto(saved);
    }

    private MedicalRecordDto mapToDto(MedicalRecord r) {
        return MedicalRecordDto.builder()
                .id(r.getId())
                .visitCode(r.getVisitCode())
                .visitId(r.getVisitId())
                .patientId(r.getPatientId())
                .patientCode(r.getPatientCode())
                .patientName(r.getPatientName())
                .patientGender(r.getPatientGender())
                .patientDob(r.getPatientDob())
                .department(r.getDepartment())
                .doctorName(r.getDoctorName())
                .doctorTitle(r.getDoctorTitle())
                .roomName(r.getRoomName())
                .visitDate(r.getVisitDate())
                .chiefComplaint(r.getChiefComplaint())
                .clinicalSymptoms(r.getClinicalSymptoms())
                .allergies(r.getAllergies())
                .vitals(r.getVitals())
                .diagnoses(r.getDiagnoses())
                .services(r.getServices())
                .prescriptions(r.getPrescriptions())
                .doctorAdvice(r.getDoctorAdvice())
                .followUpDays(r.getFollowUpDays())
                .isLocked(r.isLocked())
                .version(r.getVersion())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
