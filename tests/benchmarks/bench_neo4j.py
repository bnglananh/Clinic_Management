import time
import statistics
from neo4j import GraphDatabase


def _stats(name: str, latencies_ms: list[float]) -> dict:
    s = sorted(latencies_ms)
    n = len(s)
    mean_ms = statistics.mean(s)
    return {
        "database": "Neo4j 5.26",
        "operation": name,
        "iterations": n,
        "mean_ms": round(mean_ms, 3),
        "p50_ms": round(s[int(0.50 * (n - 1))], 3),
        "p95_ms": round(s[int(0.95 * (n - 1))], 3),
        "p99_ms": round(s[int(0.99 * (n - 1))], 3),
        "ops_sec": round(1000.0 / mean_ms if mean_ms > 0 else 0.0, 1),
    }


def run_neo4j_benchmarks(uri: str = "bolt://localhost:7687", user: str = "neo4j", password: str = "clinic12345", n_iter: int = 200) -> list[dict]:
    driver = GraphDatabase.driver(uri, auth=(user, password))
    driver.verify_connectivity()
    results = []

    q_ddi = """
    MATCH (a:ActiveIngredient)-[r:INTERACTS_WITH]-(b:ActiveIngredient)
    WHERE a.name IN $ingredients AND b.name IN $ingredients AND a.name < b.name
    RETURN a.name AS a, b.name AS b, r.severity AS severity, r.title AS title
    """
    q_contra = """
    MATCH (a:ActiveIngredient)-[r:CONTRAINDICATED_IN]->(s:Disease)
    WHERE a.name IN $ingredients
      AND any(code IN $icdCodes WHERE code = s.icdCode OR code STARTS WITH s.icdCode + '.')
    RETURN a.name AS ingredient, s.icdCode AS icdCode, r.reason AS reason
    """
    q_alt = """
    MATCH (d:Drug)-[:CONTAINS]->(a:ActiveIngredient)-[:TREATS]->(s:Disease)
          <-[:TREATS]-(alt:ActiveIngredient)<-[:CONTAINS]-(altDrug:Drug)
    WHERE (toLower(d.code) = toLower($term) OR toLower(d.name) = toLower($term))
      AND alt <> a
      AND NOT (altDrug)-[:CONTAINS]->(a)
      AND NOT EXISTS { MATCH (alt)-[:INTERACTS_WITH]-(x:ActiveIngredient) WHERE x.name IN $avoid }
    RETURN DISTINCT altDrug.code AS code, altDrug.name AS name, alt.name AS ingredient
    LIMIT 5
    """

    ingredients = ["Aspirin", "Clopidogrel", "Warfarin", "Ibuprofen", "Amoxicillin"]
    icd_codes = ["I10", "K25.9", "I25"]

    with driver.session() as session:
        # Warm-up
        session.run(q_ddi, ingredients=ingredients).consume()

        # 1. Quét tương tác thuốc đối kháng (DDI)
        lat_ddi = []
        for _ in range(n_iter):
            t0 = time.perf_counter()
            list(session.run(q_ddi, ingredients=ingredients))
            lat_ddi.append((time.perf_counter() - t0) * 1000.0)
        results.append(_stats("Cypher Quét DDI (5 hoạt chất)", lat_ddi))

        # 2. Kiểm tra chống chỉ định ICD-10
        lat_contra = []
        for _ in range(n_iter):
            t0 = time.perf_counter()
            list(session.run(q_contra, ingredients=ingredients, icdCodes=icd_codes))
            lat_contra.append((time.perf_counter() - t0) * 1000.0)
        results.append(_stats("Cypher Chống chỉ định ICD-10", lat_contra))

        # 3. Gợi ý thuốc thay thế an toàn
        lat_alt = []
        for _ in range(n_iter):
            t0 = time.perf_counter()
            list(session.run(q_alt, term="ASP81", avoid=["Warfarin", "Clopidogrel"]))
            lat_alt.append((time.perf_counter() - t0) * 1000.0)
        results.append(_stats("Cypher Gợi ý thuốc thay thế", lat_alt))

    driver.close()
    return results
