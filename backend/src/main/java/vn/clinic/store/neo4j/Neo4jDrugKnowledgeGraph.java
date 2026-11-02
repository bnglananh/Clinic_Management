package vn.clinic.store.neo4j;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.springframework.stereotype.Component;
import vn.clinic.config.StorageMode;
import vn.clinic.store.DrugKnowledgeGraph;

import java.util.List;
import java.util.Map;

/** Truy vấn đồ thị dược lý bằng Cypher qua Neo4j Java Driver. */
@Component
@StorageMode.NoSql
public class Neo4jDrugKnowledgeGraph implements DrugKnowledgeGraph {

    /**
     * Mỗi term: ưu tiên khớp chính xác mã/tên biệt dược; nếu không có, tìm hoạt chất mà tên nằm trong term.
     * Trả về một dòng cho mỗi (term, hoạt chất) kèm danh sách nhóm dược lý.
     */
    private static final String RESOLVE = """
            UNWIND $terms AS term
            CALL (term) {
              OPTIONAL MATCH (d:Drug)
              WHERE toLower(d.code) = toLower(term) OR toLower(d.name) = toLower(term)
              WITH d LIMIT 1
              OPTIONAL MATCH (d)-[:CONTAINS]->(viaDrug:ActiveIngredient)
              WITH d, collect(viaDrug) AS viaDrug
              OPTIONAL MATCH (byName:ActiveIngredient)
              WHERE size(viaDrug) = 0 AND toLower(term) CONTAINS toLower(byName.name)
              WITH d, viaDrug, collect(byName) AS byName
              WITH d, viaDrug + byName AS ingredients
              UNWIND ingredients AS a
              OPTIONAL MATCH (a)-[:BELONGS_TO]->(c:DrugClass)
              RETURN d.code AS code, d.name AS drugName, a.name AS ingredient, collect(c.name) AS classes
            }
            RETURN term, code, drugName, ingredient, classes
            """;

    private static final String INTERACTIONS = """
            MATCH (a:ActiveIngredient)-[r:INTERACTS_WITH]-(b:ActiveIngredient)
            WHERE a.name IN $ingredients AND b.name IN $ingredients AND a.name < b.name
            RETURN a.name AS a, b.name AS b, r.severity AS severity, r.title AS title,
                   r.mechanism AS mechanism, r.clinicalEffect AS clinicalEffect, r.recommendation AS recommendation
            """;

    private static final String CONTRAINDICATIONS = """
            MATCH (a:ActiveIngredient)-[r:CONTRAINDICATED_IN]->(s:Disease)
            WHERE a.name IN $ingredients
              AND any(code IN $icdCodes WHERE code = s.icdCode OR code STARTS WITH s.icdCode + '.')
            RETURN a.name AS ingredient, s.icdCode AS icdCode, s.name AS diseaseName, r.reason AS reason
            """;

    private static final String ALTERNATIVES = """
            MATCH (d:Drug)-[:CONTAINS]->(a:ActiveIngredient)-[:TREATS]->(s:Disease)
                  <-[:TREATS]-(alt:ActiveIngredient)<-[:CONTAINS]-(altDrug:Drug)
            WHERE (toLower(d.code) = toLower($term) OR toLower(d.name) = toLower($term))
              AND alt <> a
              AND NOT (altDrug)-[:CONTAINS]->(a)
              AND NOT EXISTS { MATCH (alt)-[:INTERACTS_WITH]-(x:ActiveIngredient) WHERE x.name IN $avoid }
            RETURN DISTINCT altDrug.code AS code, altDrug.name AS drugName, alt.name AS ingredient,
                   s.icdCode AS icdCode, s.name AS diseaseName, altDrug.source AS source
            ORDER BY source DESC, drugName
            LIMIT $limit
            """;

    private final Driver driver;

    public Neo4jDrugKnowledgeGraph(Driver driver) {
        this.driver = driver;
    }

    @Override
    public List<ResolvedDrug> resolve(List<String> terms) {
        if (terms == null || terms.isEmpty()) return List.of();
        return query(RESOLVE, Map.of("terms", terms)).stream()
                .map(r -> new ResolvedDrug(r.get("term").asString(), nullable(r, "code"), nullable(r, "drugName"),
                        r.get("ingredient").asString(), r.get("classes").asList(v -> v.asString())))
                .toList();
    }

    @Override
    public List<Interaction> interactionsAmong(List<String> ingredientNames) {
        if (ingredientNames == null || ingredientNames.size() < 2) return List.of();
        return query(INTERACTIONS, Map.of("ingredients", ingredientNames)).stream()
                .map(r -> new Interaction(r.get("a").asString(), r.get("b").asString(), r.get("severity").asString(),
                        r.get("title").asString(), r.get("mechanism").asString(),
                        r.get("clinicalEffect").asString(), r.get("recommendation").asString()))
                .toList();
    }

    @Override
    public List<Contraindication> contraindications(List<String> ingredientNames, List<String> icdCodes) {
        if (ingredientNames == null || ingredientNames.isEmpty() || icdCodes == null || icdCodes.isEmpty()) {
            return List.of();
        }
        return query(CONTRAINDICATIONS, Map.of("ingredients", ingredientNames, "icdCodes", icdCodes)).stream()
                .map(r -> new Contraindication(r.get("ingredient").asString(), r.get("icdCode").asString(),
                        r.get("diseaseName").asString(), r.get("reason").asString()))
                .toList();
    }

    @Override
    public List<Alternative> alternatives(String drugTerm, List<String> avoidIngredients, int limit) {
        if (drugTerm == null || drugTerm.isBlank()) return List.of();
        return query(ALTERNATIVES, Map.of("term", drugTerm.trim(),
                "avoid", avoidIngredients == null ? List.of() : avoidIngredients, "limit", limit)).stream()
                .map(r -> new Alternative(r.get("code").asString(), r.get("drugName").asString(),
                        r.get("ingredient").asString(), r.get("icdCode").asString(), r.get("diseaseName").asString()))
                .toList();
    }

    private List<Record> query(String cypher, Map<String, Object> params) {
        return driver.executableQuery(cypher).withParameters(params).execute().records();
    }

    private static String nullable(Record r, String key) {
        return r.get(key).isNull() ? null : r.get(key).asString();
    }
}
