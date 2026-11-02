package vn.clinic.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.PrescriptionSafetyReport;
import vn.clinic.dto.PrescriptionSafetyRequest;
import vn.clinic.repository.InMemoryMedicalRecordRepository;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.store.memory.InMemoryDrugKnowledgeGraph;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PrescriptionSafetyServiceTest {

    private PrescriptionSafetyService service;

    @BeforeEach
    void setUp() {
        InMemoryPatientProfileRepository patients = new InMemoryPatientProfileRepository();
        patients.initMockData();
        InMemoryMedicalRecordRepository records = new InMemoryMedicalRecordRepository();
        records.init();
        service = new PrescriptionSafetyService(new InMemoryDrugKnowledgeGraph(), patients, records,
                new vn.clinic.repository.InMemoryPharmacyDrugRepository());
    }

    @Test
    @DisplayName("Aspirin + Warfarin → tương tác CRITICAL, đơn bị chặn")
    void criticalInteractionBlocks() {
        PrescriptionSafetyReport report = service.check(PrescriptionSafetyRequest.builder()
                .drugs(List.of("Aspirin pH8", "Sintrom (Warfarin)")).build());

        assertTrue(report.isBlocking());
        assertEquals(1, report.getInteractions().size());
        assertEquals("CRITICAL", report.getInteractions().get(0).getSeverity());
        assertEquals("Aspirin pH8", report.getInteractions().get(0).getDrugA());
    }

    @Test
    @DisplayName("Bệnh nhân dị ứng Penicillin được cảnh báo khi kê Amoxicillin")
    void penicillinAllergyDetectedFromPatientProfile() {
        PrescriptionSafetyReport report = service.check(PrescriptionSafetyRequest.builder()
                .drugs(List.of("Amoxicillin STELLA")).patientId("usr-pat-01").build());

        assertTrue(report.isBlocking());
        assertEquals(1, report.getAllergyAlerts().size());
        assertEquals("Penicillin", report.getAllergyAlerts().get(0).getMatchedBy());
    }

    @Test
    @DisplayName("Thuốc an toàn, không nhận diện được thì nằm trong unknownDrugs")
    void safePrescription() {
        PrescriptionSafetyReport report = service.check(PrescriptionSafetyRequest.builder()
                .drugs(List.of("Panadol (Paracetamol)", "Thuốc lạ XYZ")).build());

        assertFalse(report.isBlocking());
        assertTrue(report.getInteractions().isEmpty());
        assertEquals(List.of("Thuốc lạ XYZ"), report.getUnknownDrugs());
    }
}
