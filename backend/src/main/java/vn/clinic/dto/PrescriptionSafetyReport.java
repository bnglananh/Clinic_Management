package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Kết quả kiểm tra an toàn đơn thuốc dựa trên đồ thị dược lý Neo4j. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionSafetyReport {

    /** true nếu có ít nhất một cảnh báo mức CRITICAL hoặc dị ứng. */
    private boolean blocking;
    private List<InteractionWarning> interactions;
    private List<ContraindicationWarning> contraindications;
    private List<AllergyWarning> allergyAlerts;
    private List<String> unknownDrugs;

    /** Cùng cấu trúc với DrugInteractionWarning ở frontend. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InteractionWarning {
        private String id;
        private String drugA;
        private String drugB;
        private String ingredientA;
        private String ingredientB;
        private String severity; // CRITICAL | MAJOR | MODERATE
        private String title;
        private String mechanism;
        private String clinicalEffect;
        private String recommendation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContraindicationWarning {
        private String drug;
        private String ingredient;
        private String icdCode;
        private String diseaseName;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllergyWarning {
        private String drug;
        private String ingredient;
        private String matchedBy; // tên hoạt chất hoặc nhóm thuốc trùng với tiền sử dị ứng
        private String allergyNote;
    }
}
