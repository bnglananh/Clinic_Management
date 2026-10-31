package vn.clinic.store.memory;

import org.springframework.stereotype.Component;
import vn.clinic.config.StorageMode;
import vn.clinic.store.DrugKnowledgeGraph;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Bản thay thế Neo4j tối giản cho unit test / profile "memory": vài hoạt chất và tương tác tiêu biểu.
 * Dữ liệu đầy đủ nằm trong database/neo4j/init-graph.cypher.
 */
@Component
@StorageMode.Memory
public class InMemoryDrugKnowledgeGraph implements DrugKnowledgeGraph {

    private static final Map<String, List<String>> CLASSES = Map.of(
            "Aspirin", List.of("NSAID", "Antiplatelet"),
            "Warfarin", List.of("Anticoagulant"),
            "Clopidogrel", List.of("Antiplatelet"),
            "Omeprazole", List.of("Proton pump inhibitor"),
            "Amoxicillin", List.of("Penicillin"),
            "Amlodipine", List.of("Calcium channel blocker"),
            "Simvastatin", List.of("Statin"),
            "Paracetamol", List.of("Analgesic"));

    private static final List<Interaction> RULES = List.of(
            new Interaction("Aspirin", "Warfarin", "CRITICAL", "Nguy cơ xuất huyết nội tạng nghiêm trọng",
                    "Phối hợp kháng đông và kháng tiểu cầu.", "Xuất huyết tiêu hóa, nội sọ.", "Tránh dùng đồng thời."),
            new Interaction("Clopidogrel", "Omeprazole", "MAJOR", "Giảm tác dụng kháng tiểu cầu của Clopidogrel",
                    "Omeprazol ức chế CYP2C19.", "Tăng nguy cơ huyết khối.", "Thay bằng Pantoprazol."),
            new Interaction("Amlodipine", "Simvastatin", "MODERATE", "Tăng nồng độ Simvastatin",
                    "Ức chế CYP3A4.", "Đau cơ, tiêu cơ vân.", "Giới hạn Simvastatin 20mg/ngày."));

    @Override
    public List<ResolvedDrug> resolve(List<String> terms) {
        List<ResolvedDrug> result = new ArrayList<>();
        for (String term : terms) {
            for (Map.Entry<String, List<String>> e : CLASSES.entrySet()) {
                if (term.toLowerCase().contains(e.getKey().toLowerCase())) {
                    result.add(new ResolvedDrug(term, null, null, e.getKey(), e.getValue()));
                }
            }
        }
        return result;
    }

    @Override
    public List<Interaction> interactionsAmong(List<String> ingredientNames) {
        return RULES.stream()
                .filter(r -> ingredientNames.contains(r.ingredientA()) && ingredientNames.contains(r.ingredientB()))
                .toList();
    }

    @Override
    public List<Contraindication> contraindications(List<String> ingredientNames, List<String> icdCodes) {
        return List.of();
    }

    @Override
    public List<Alternative> alternatives(String drugTerm, List<String> avoidIngredients, int limit) {
        return List.of();
    }
}
