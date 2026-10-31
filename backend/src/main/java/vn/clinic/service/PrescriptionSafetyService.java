package vn.clinic.service;

import org.springframework.stereotype.Service;
import vn.clinic.dto.PrescriptionSafetyReport;
import vn.clinic.dto.PrescriptionSafetyReport.AllergyWarning;
import vn.clinic.dto.PrescriptionSafetyReport.ContraindicationWarning;
import vn.clinic.dto.PrescriptionSafetyReport.InteractionWarning;
import vn.clinic.dto.PrescriptionSafetyRequest;
import vn.clinic.model.DiagnosisItem;
import vn.clinic.model.MedicalRecord;
import vn.clinic.model.PatientProfile;
import vn.clinic.repository.MedicalRecordRepository;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.PharmacyDrugRepository;
import vn.clinic.model.DrugStatus;
import vn.clinic.store.DrugKnowledgeGraph;
import vn.clinic.store.DrugKnowledgeGraph.ResolvedDrug;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Kiểm tra an toàn đơn thuốc: kết hợp đồ thị dược lý (Neo4j) với hồ sơ bệnh nhân (MongoDB).
 * <ul>
 *   <li>Tương tác thuốc - thuốc giữa các hoạt chất trong đơn.</li>
 *   <li>Chống chỉ định với chẩn đoán hiện tại và bệnh nền đã ghi trong các bệnh án trước.</li>
 *   <li>Dị ứng: tên hoạt chất hoặc nhóm thuốc xuất hiện trong tiền sử dị ứng.</li>
 * </ul>
 */
@Service
public class PrescriptionSafetyService {

    private static final List<String> SEVERITY_ORDER = List.of("CRITICAL", "MAJOR", "MODERATE");

    private final DrugKnowledgeGraph graph;
    private final PatientProfileRepository patientProfileRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PharmacyDrugRepository pharmacyDrugRepository;

    public PrescriptionSafetyService(DrugKnowledgeGraph graph,
                                     PatientProfileRepository patientProfileRepository,
                                     MedicalRecordRepository medicalRecordRepository,
                                     PharmacyDrugRepository pharmacyDrugRepository) {
        this.graph = graph;
        this.patientProfileRepository = patientProfileRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.pharmacyDrugRepository = pharmacyDrugRepository;
    }

    public PrescriptionSafetyReport check(PrescriptionSafetyRequest request) {
        List<String> terms = request.getDrugs().stream().filter(Objects::nonNull).map(String::trim)
                .filter(s -> !s.isEmpty()).distinct().toList();
        List<ResolvedDrug> resolved = graph.resolve(terms);

        // hoạt chất -> tên thuốc trong đơn (để hiển thị "Aspirin pH8 ↔ Sintrom")
        Map<String, String> drugOfIngredient = new LinkedHashMap<>();
        for (ResolvedDrug r : resolved) {
            drugOfIngredient.putIfAbsent(r.ingredient(), r.term());
        }
        List<String> ingredients = new ArrayList<>(drugOfIngredient.keySet());
        Set<String> recognisedTerms = resolved.stream().map(ResolvedDrug::term).collect(Collectors.toSet());
        List<String> unknown = terms.stream().filter(t -> !recognisedTerms.contains(t)).toList();

        Optional<PatientProfile> patient = findPatient(request.getPatientId());

        List<InteractionWarning> interactions = interactions(ingredients, drugOfIngredient);
        List<ContraindicationWarning> contraindications = contraindications(ingredients, drugOfIngredient,
                collectIcdCodes(request, patient));
        List<AllergyWarning> allergies = allergies(resolved, collectAllergyNotes(request, patient));

        boolean blocking = !allergies.isEmpty()
                || interactions.stream().anyMatch(i -> "CRITICAL".equals(i.getSeverity()));

        return PrescriptionSafetyReport.builder()
                .blocking(blocking)
                .interactions(interactions)
                .contraindications(contraindications)
                .allergyAlerts(allergies)
                .unknownDrugs(unknown)
                .build();
    }

    public List<DrugKnowledgeGraph.Alternative> alternatives(String drug, List<String> avoidDrugs, int limit) {
        List<String> avoidIngredients = avoidDrugs == null || avoidDrugs.isEmpty() ? List.of()
                : graph.resolve(avoidDrugs).stream().map(ResolvedDrug::ingredient).distinct().toList();
        int safeLimit = Math.max(1, Math.min(limit, 20));
        // Đồ thị (Neo4j) gợi ý theo tri thức dược lý; kho thuốc (MongoDB) loại bỏ thuốc đã ngừng kinh doanh
        return graph.alternatives(drug, avoidIngredients, safeLimit * 2).stream()
                .filter(a -> pharmacyDrugRepository.findByCode(a.code())
                        .map(d -> d.getStatus() != DrugStatus.DISCONTINUED).orElse(true))
                .limit(safeLimit)
                .toList();
    }

    // ---------------------------------------------------------------------

    private List<InteractionWarning> interactions(List<String> ingredients, Map<String, String> drugOf) {
        List<InteractionWarning> result = new ArrayList<>();
        int i = 1;
        for (DrugKnowledgeGraph.Interaction it : graph.interactionsAmong(ingredients)) {
            result.add(InteractionWarning.builder()
                    .id(String.format("DDI-%02d", i++))
                    .drugA(drugOf.get(it.ingredientA()))
                    .drugB(drugOf.get(it.ingredientB()))
                    .ingredientA(it.ingredientA())
                    .ingredientB(it.ingredientB())
                    .severity(it.severity())
                    .title(it.title())
                    .mechanism(it.mechanism())
                    .clinicalEffect(it.clinicalEffect())
                    .recommendation(it.recommendation())
                    .build());
        }
        result.sort(Comparator.comparingInt(w -> {
            int idx = SEVERITY_ORDER.indexOf(w.getSeverity());
            return idx < 0 ? SEVERITY_ORDER.size() : idx;
        }));
        return result;
    }

    private List<ContraindicationWarning> contraindications(List<String> ingredients, Map<String, String> drugOf,
                                                            List<String> icdCodes) {
        return graph.contraindications(ingredients, icdCodes).stream()
                .map(c -> ContraindicationWarning.builder()
                        .drug(drugOf.get(c.ingredient()))
                        .ingredient(c.ingredient())
                        .icdCode(c.icdCode())
                        .diseaseName(c.diseaseName())
                        .reason(c.reason())
                        .build())
                .toList();
    }

    private static List<AllergyWarning> allergies(List<ResolvedDrug> resolved, List<String> allergyNotes) {
        List<AllergyWarning> result = new ArrayList<>();
        if (allergyNotes.isEmpty()) return result;
        Set<String> seen = new HashSet<>();
        for (ResolvedDrug r : resolved) {
            List<String> candidates = new ArrayList<>();
            candidates.add(r.ingredient());
            candidates.addAll(r.drugClasses());
            for (String candidate : candidates) {
                for (String note : allergyNotes) {
                    if (note.toLowerCase().contains(candidate.toLowerCase()) && seen.add(r.term() + "|" + candidate)) {
                        result.add(AllergyWarning.builder()
                                .drug(r.term()).ingredient(r.ingredient()).matchedBy(candidate).allergyNote(note)
                                .build());
                    }
                }
            }
        }
        return result;
    }

    private Optional<PatientProfile> findPatient(String patientId) {
        if (patientId == null || patientId.isBlank()) return Optional.empty();
        return patientProfileRepository.findById(patientId)
                .or(() -> patientProfileRepository.findByPatientCode(patientId));
    }

    private List<String> collectIcdCodes(PrescriptionSafetyRequest request, Optional<PatientProfile> patient) {
        Set<String> codes = new LinkedHashSet<>();
        if (request.getIcdCodes() != null) codes.addAll(request.getIcdCodes());
        patient.ifPresent(p -> {
            for (MedicalRecord rec : medicalRecordRepository.findByPatientId(p.getId())) {
                if (rec.getDiagnoses() != null) {
                    rec.getDiagnoses().stream().map(DiagnosisItem::getCode).filter(Objects::nonNull).forEach(codes::add);
                }
            }
        });
        return new ArrayList<>(codes);
    }

    private static List<String> collectAllergyNotes(PrescriptionSafetyRequest request, Optional<PatientProfile> patient) {
        List<String> notes = new ArrayList<>();
        if (request.getAllergies() != null) notes.addAll(request.getAllergies());
        patient.map(PatientProfile::getAllergies).filter(a -> !a.isBlank()).ifPresent(notes::add);
        return notes;
    }
}
