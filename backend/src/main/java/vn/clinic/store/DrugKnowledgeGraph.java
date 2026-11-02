package vn.clinic.store;

import java.util.List;

/**
 * Đồ thị tri thức dược lý (Neo4j): thuốc – hoạt chất – nhóm thuốc – bệnh.
 */
public interface DrugKnowledgeGraph {

    /**
     * Nhận diện thuốc từ mã ("ASP81"), tên biệt dược ("Aspirin pH8") hoặc chuỗi có chứa tên hoạt chất
     * ("Amlor (Amlodipine)"). Thuốc không nhận diện được sẽ không có trong kết quả.
     */
    List<ResolvedDrug> resolve(List<String> terms);

    /** Các cặp hoạt chất tương tác với nhau trong danh sách (INTERACTS_WITH). */
    List<Interaction> interactionsAmong(List<String> ingredientNames);

    /** Hoạt chất chống chỉ định với bệnh nền (CONTRAINDICATED_IN), so khớp theo mã ICD-10 hoặc tiền tố. */
    List<Contraindication> contraindications(List<String> ingredientNames, List<String> icdCodes);

    /**
     * Thuốc thay thế: cùng điều trị một bệnh với thuốc ban đầu nhưng khác hoạt chất,
     * và không tương tác với các hoạt chất cần tránh (truy vấn nhiều bước trên đồ thị).
     */
    List<Alternative> alternatives(String drugTerm, List<String> avoidIngredients, int limit);

    record ResolvedDrug(String term, String code, String drugName, String ingredient, List<String> drugClasses) {
    }

    record Interaction(String ingredientA, String ingredientB, String severity, String title,
                       String mechanism, String clinicalEffect, String recommendation) {
    }

    record Contraindication(String ingredient, String icdCode, String diseaseName, String reason) {
    }

    record Alternative(String code, String drugName, String ingredient, String icdCode, String diseaseName) {
    }
}
