// =========================================================================
// SMART CLINIC EMR – Truy vấn mẫu Neo4j (đồ thị dược lý)
// Chạy:  cypher-shell -u neo4j -p clinic12345 -f database/neo4j/queries.cypher
//        hoặc dán từng câu vào Neo4j Browser: http://localhost:7474
// =========================================================================

// 1. Tương tác thuốc - thuốc trong một đơn (→ POST /api/prescriptions/safety-check)
//    Đơn: Aspirin pH8 + Sintrom (Warfarin) + Plavix + Nexium
WITH ['ASP81', 'WAR02', 'PLA75', 'NEX40'] AS codes
MATCH (d1:Drug)-[:CONTAINS]->(a1:ActiveIngredient)-[r:INTERACTS_WITH]-(a2:ActiveIngredient)<-[:CONTAINS]-(d2:Drug)
WHERE d1.code IN codes AND d2.code IN codes AND d1.code < d2.code
RETURN d1.name AS thuocA, d2.name AS thuocB, r.severity AS mucDo, r.title AS canhBao
ORDER BY CASE r.severity WHEN 'CRITICAL' THEN 0 WHEN 'MAJOR' THEN 1 ELSE 2 END;

// 2. Chống chỉ định theo bệnh nền: bệnh nhân loét dạ dày (K25) và bệnh thận mạn (N18)
WITH ['K25', 'N18'] AS benhNen, ['IBU400', 'GLU850', 'PAR500'] AS codes
MATCH (d:Drug)-[:CONTAINS]->(a:ActiveIngredient)-[c:CONTRAINDICATED_IN]->(s:Disease)
WHERE d.code IN codes AND s.icdCode IN benhNen
RETURN d.name AS thuoc, s.icdCode AS icd, s.name AS benh, c.reason AS lyDo;

// 3. Dị ứng theo nhóm thuốc: bệnh nhân dị ứng Penicillin → những thuốc nào phải tránh?
MATCH (d:Drug)-[:CONTAINS]->(a:ActiveIngredient)-[:BELONGS_TO]->(c:DrugClass {name: 'Penicillin'})
RETURN d.code AS ma, d.name AS thuoc, a.name AS hoatChat;

// 4. Gợi ý thuốc thay thế (truy vấn nhiều bước):
//    thay Plavix bằng thuốc khác cùng điều trị bệnh, không tương tác với Esomeprazole (Nexium)
MATCH (d:Drug {code: 'PLA75'})-[:CONTAINS]->(a)-[:TREATS]->(s:Disease)<-[:TREATS]-(alt)<-[:CONTAINS]-(altDrug:Drug)
WHERE alt <> a
  AND NOT EXISTS { MATCH (alt)-[:INTERACTS_WITH]-(:ActiveIngredient {name: 'Esomeprazole'}) }
RETURN DISTINCT altDrug.name AS thuocThayThe, alt.name AS hoatChat, s.name AS cungDieuTri;

// 5. Đường đi ngắn nhất giữa hai thuốc qua các quan hệ (giải thích vì sao chúng liên quan)
MATCH p = shortestPath((x:Drug {code: 'AML05'})-[*..6]-(y:Drug {code: 'SIM20'}))
RETURN [n IN nodes(p) | coalesce(n.name, n.icdCode)] AS duongDi, [r IN relationships(p) | type(r)] AS quanHe;

// 6. Hoạt chất "nguy hiểm" nhất: nhiều tương tác nghiêm trọng nhất
MATCH (a:ActiveIngredient)-[r:INTERACTS_WITH]-()
RETURN a.name AS hoatChat, count(r) AS soTuongTac,
       sum(CASE WHEN r.severity IN ['CRITICAL', 'MAJOR'] THEN 1 ELSE 0 END) AS nghiemTrong
ORDER BY nghiemTrong DESC, soTuongTac DESC LIMIT 5;

// 7. Mỗi bệnh có bao nhiêu lựa chọn điều trị
MATCH (s:Disease)<-[:TREATS]-(a:ActiveIngredient)<-[:CONTAINS]-(d:Drug)
RETURN s.icdCode AS icd, s.name AS benh, count(DISTINCT a) AS soHoatChat, collect(DISTINCT d.name)[0..4] AS viDuThuoc
ORDER BY soHoatChat DESC;

// 8. Thêm một tương tác mới (CREATE quan hệ) rồi xóa đi
MATCH (a:ActiveIngredient {name: 'Ciprofloxacin'}), (b:ActiveIngredient {name: 'Warfarin'})
MERGE (a)-[r:INTERACTS_WITH]->(b)
SET r.severity = 'MAJOR', r.title = 'Ciprofloxacin làm tăng tác dụng chống đông của Warfarin (demo)'
RETURN a.name, type(r), b.name, r.severity;
MATCH (:ActiveIngredient {name: 'Ciprofloxacin'})-[r:INTERACTS_WITH]->(:ActiveIngredient {name: 'Warfarin'}) DELETE r;
