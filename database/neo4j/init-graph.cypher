// =========================================================================
// SMART CLINIC EMR - Neo4j Graph Database
// Mạng lưới tri thức dược lý & Phát hiện cảnh báo tương tác thuốc (DDI)
// Nodes: (:Drug), (:ActiveIngredient), (:Disease)
// Relationships: (:Drug)-[:CONTAINS]->(:ActiveIngredient), 
//                (:ActiveIngredient)-[:INTERACTS_WITH]->(:ActiveIngredient)
// =========================================================================

// 1. Tạo Ràng buộc Unique & Index
CREATE CONSTRAINT unique_drug_code IF NOT EXISTS
FOR (d:Drug) REQUIRE d.code IS UNIQUE;

CREATE CONSTRAINT unique_ingredient_name IF NOT EXISTS
FOR (a:ActiveIngredient) REQUIRE a.name IS UNIQUE;

// 2. Tạo các nút Hoạt chất (Active Ingredients)
MERGE (a1:ActiveIngredient {name: 'Paracetamol', standardCode: 'ING-PARA'})
MERGE (a2:ActiveIngredient {name: 'Ibuprofen', standardCode: 'ING-IBUP'})
MERGE (a3:ActiveIngredient {name: 'Warfarin', standardCode: 'ING-WARF'})
MERGE (a4:ActiveIngredient {name: 'Aspirin', standardCode: 'ING-ASPI'})
MERGE (a5:ActiveIngredient {name: 'Amoxicillin', standardCode: 'ING-AMOX'})
MERGE (a6:ActiveIngredient {name: 'Clavulanic Acid', standardCode: 'ING-CLAV'})
MERGE (a7:ActiveIngredient {name: 'Methotrexate', standardCode: 'ING-MTX'});

// 3. Tạo các nút Thuốc thương mại (Drugs) và liên kết hoạt chất
MERGE (d1:Drug {code: 'THUOC-PARA-500', name: 'Paracetamol 500mg', form: 'Viên'})
MERGE (d2:Drug {code: 'THUOC-IBUP-400', name: 'Ibuprofen 400mg', form: 'Viên'})
MERGE (d3:Drug {code: 'THUOC-ASPI-81', name: 'Aspirin 81mg', form: 'Viên'})
MERGE (d4:Drug {code: 'THUOC-AUGM-625', name: 'Augmentin 625mg', form: 'Viên'})
MERGE (d5:Drug {code: 'THUOC-WARF-5', name: 'Warfarin 5mg', form: 'Viên'});

MERGE (d1)-[:CONTAINS]->(a1)
MERGE (d2)-[:CONTAINS]->(a2)
MERGE (d3)-[:CONTAINS]->(a4)
MERGE (d4)-[:CONTAINS]->(a5)
MERGE (d4)-[:CONTAINS]->(a6)
MERGE (d5)-[:CONTAINS]->(a3);

// 4. Tạo quan hệ tương tác thuốc đối kháng (Drug-Drug Interaction - DDI)
// Quan hệ đối kháng mức độ NGUY HIỂM CAO (BURGUNDY WARNING)
MERGE (a2)-[r1:INTERACTS_WITH {
    severity: 'HIGH',
    effect: 'Tăng nguy cơ xuất huyết tiêu hóa nghiêm trọng và giảm hiệu quả chống đông máu',
    recommendation: 'Tránh phối hợp. Cần đổi sang giảm đau Paracetamol.'
}]->(a3)

MERGE (a4)-[r2:INTERACTS_WITH {
    severity: 'HIGH',
    effect: 'Cạnh tranh gắn kết protein huyết tương, tăng nguy cơ xuất huyết ồ ạt',
    recommendation: 'Chống chỉ định dùng đồng thời với Warfarin.'
}]->(a3)

MERGE (a2)-[r3:INTERACTS_WITH {
    severity: 'MEDIUM',
    effect: 'Cùng nhóm NSAIDs, tăng nguy cơ loét dạ dày tá tràng và độc tính trên thận',
    recommendation: 'Không dùng đồng thời hai thuốc nhóm NSAIDs.'
}]->(a4);

// 5. Mẫu truy vấn Cypher phát hiện DDI khi Bác sĩ kê 2 hoặc nhiều loại thuốc:
// MATCH (d1:Drug {code: $drugCodeA})-[:CONTAINS]->(a1:ActiveIngredient)
// MATCH (d2:Drug {code: $drugCodeB})-[:CONTAINS]->(a2:ActiveIngredient)
// MATCH (a1)-[r:INTERACTS_WITH]-(a2)
// RETURN d1.name AS drugA, d2.name AS drugB, r.severity AS severity, r.effect AS effect, r.recommendation AS recommendation;
