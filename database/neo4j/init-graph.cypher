// =========================================================================
// SMART CLINIC EMR – Neo4j: đồ thị tri thức dược lý & cảnh báo an toàn kê đơn
// Chạy:  cypher-shell -u neo4j -p clinic12345 -f database/neo4j/init-graph.cypher
//        (Docker tự chạy qua container neo4j-init)
//
// 4 loại node:
//   (:Drug {code, name, strength, source})     – biệt dược (mã khớp pharmacy_drugs.code ở MongoDB)
//   (:ActiveIngredient {name, nameVi})         – hoạt chất
//   (:DrugClass {name, nameVi})                – nhóm dược lý (dùng để đối chiếu dị ứng)
//   (:Disease {icdCode, name})                 – bệnh theo mã ICD-10
//
// 5 loại quan hệ:
//   (:Drug)-[:CONTAINS]->(:ActiveIngredient)
//   (:ActiveIngredient)-[:BELONGS_TO]->(:DrugClass)
//   (:ActiveIngredient)-[:INTERACTS_WITH {severity, title, mechanism, clinicalEffect, recommendation}]->(:ActiveIngredient)
//   (:ActiveIngredient)-[:TREATS]->(:Disease)
//   (:ActiveIngredient)-[:CONTRAINDICATED_IN {reason}]->(:Disease)
//
// Script dùng MERGE nên chạy lại nhiều lần không bị nhân đôi dữ liệu.
// Mỗi khối được viết trọn trong một câu lệnh (biến Cypher không tồn tại qua dấu ';').
// =========================================================================

// ---------- 1. Ràng buộc duy nhất ----------
CREATE CONSTRAINT drug_code IF NOT EXISTS FOR (d:Drug) REQUIRE d.code IS UNIQUE;
CREATE CONSTRAINT ingredient_name IF NOT EXISTS FOR (a:ActiveIngredient) REQUIRE a.name IS UNIQUE;
CREATE CONSTRAINT drug_class_name IF NOT EXISTS FOR (c:DrugClass) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT disease_icd IF NOT EXISTS FOR (s:Disease) REQUIRE s.icdCode IS UNIQUE;
CREATE INDEX drug_name IF NOT EXISTS FOR (d:Drug) ON (d.name);

// ---------- 2. Nhóm dược lý ----------
UNWIND [
  {name: 'Penicillin',           nameVi: 'Kháng sinh nhóm Penicillin (Beta-lactam)'},
  {name: 'Beta-lactamase inhibitor', nameVi: 'Chất ức chế Beta-lactamase'},
  {name: 'Fluoroquinolone',      nameVi: 'Kháng sinh nhóm Quinolon'},
  {name: 'NSAID',                nameVi: 'Thuốc kháng viêm không steroid'},
  {name: 'Antiplatelet',         nameVi: 'Thuốc chống kết tập tiểu cầu'},
  {name: 'Anticoagulant',        nameVi: 'Thuốc chống đông kháng vitamin K'},
  {name: 'Analgesic',            nameVi: 'Giảm đau hạ sốt'},
  {name: 'Stimulant',            nameVi: 'Chất kích thích thần kinh trung ương'},
  {name: 'Proton pump inhibitor', nameVi: 'Ức chế bơm proton'},
  {name: 'Calcium channel blocker', nameVi: 'Chẹn kênh canxi'},
  {name: 'Angiotensin receptor blocker', nameVi: 'Chẹn thụ thể Angiotensin II'},
  {name: 'Statin',               nameVi: 'Hạ mỡ máu nhóm Statin'},
  {name: 'Biguanide',            nameVi: 'Hạ đường huyết nhóm Biguanid'},
  {name: 'Xanthine',             nameVi: 'Giãn phế quản nhóm Xanthin'}
] AS row
MERGE (c:DrugClass {name: row.name}) SET c.nameVi = row.nameVi;

// ---------- 3. Hoạt chất + nhóm dược lý ----------
UNWIND [
  {name: 'Amoxicillin',     nameVi: 'Amoxicilin',      classes: ['Penicillin']},
  {name: 'Clavulanic Acid', nameVi: 'Acid clavulanic', classes: ['Beta-lactamase inhibitor']},
  {name: 'Ciprofloxacin',   nameVi: 'Ciprofloxacin',   classes: ['Fluoroquinolone']},
  {name: 'Paracetamol',     nameVi: 'Paracetamol',     classes: ['Analgesic']},
  {name: 'Caffeine',        nameVi: 'Cafein',          classes: ['Stimulant']},
  {name: 'Ibuprofen',       nameVi: 'Ibuprofen',       classes: ['NSAID']},
  {name: 'Aspirin',         nameVi: 'Aspirin',         classes: ['NSAID', 'Antiplatelet']},
  {name: 'Clopidogrel',     nameVi: 'Clopidogrel',     classes: ['Antiplatelet']},
  {name: 'Warfarin',        nameVi: 'Warfarin',        classes: ['Anticoagulant']},
  {name: 'Omeprazole',      nameVi: 'Omeprazol',       classes: ['Proton pump inhibitor']},
  {name: 'Esomeprazole',    nameVi: 'Esomeprazol',     classes: ['Proton pump inhibitor']},
  {name: 'Amlodipine',      nameVi: 'Amlodipin',       classes: ['Calcium channel blocker']},
  {name: 'Losartan',        nameVi: 'Losartan',        classes: ['Angiotensin receptor blocker']},
  {name: 'Simvastatin',     nameVi: 'Simvastatin',     classes: ['Statin']},
  {name: 'Metformin',       nameVi: 'Metformin',       classes: ['Biguanide']},
  {name: 'Theophylline',    nameVi: 'Theophylin',      classes: ['Xanthine']}
] AS row
MERGE (a:ActiveIngredient {name: row.name}) SET a.nameVi = row.nameVi
WITH a, row
UNWIND row.classes AS className
MATCH (c:DrugClass {name: className})
MERGE (a)-[:BELONGS_TO]->(c);

// ---------- 4. Biệt dược (kho thuốc MongoDB + danh mục kê đơn) và hoạt chất ----------
UNWIND [
  // Kho thuốc (collection pharmacy_drugs)
  {code: 'AUG1G',  name: 'Augmentin 1g',            strength: '875mg/125mg', source: 'PHARMACY', ingredients: ['Amoxicillin', 'Clavulanic Acid']},
  {code: 'PAN500', name: 'Panadol Extra',           strength: '500mg/65mg',  source: 'PHARMACY', ingredients: ['Paracetamol', 'Caffeine']},
  {code: 'NEX40',  name: 'Nexium 40mg',             strength: '40mg',        source: 'PHARMACY', ingredients: ['Esomeprazole']},
  {code: 'AML05',  name: 'Amlor 5mg',               strength: '5mg',         source: 'PHARMACY', ingredients: ['Amlodipine']},
  {code: 'GLU850', name: 'Glucophage 850mg',        strength: '850mg',       source: 'PHARMACY', ingredients: ['Metformin']},
  {code: 'PLA75',  name: 'Plavix 75mg',             strength: '75mg',        source: 'PHARMACY', ingredients: ['Clopidogrel']},
  {code: 'ASP81',  name: 'Aspirin pH8',             strength: '100mg',       source: 'PHARMACY', ingredients: ['Aspirin']},
  {code: 'SIM10',  name: 'Zocor 10mg',              strength: '10mg',        source: 'PHARMACY', ingredients: ['Simvastatin']},
  // Danh mục kê đơn ở bàn làm việc bác sĩ
  {code: 'ASP100', name: 'Aspirin pH8 100mg',       strength: '100mg',       source: 'CATALOG',  ingredients: ['Aspirin']},
  {code: 'WAR02',  name: 'Sintrom (Warfarin)',      strength: '2mg',         source: 'CATALOG',  ingredients: ['Warfarin']},
  {code: 'CLO75',  name: 'Plavix (Clopidogrel)',    strength: '75mg',        source: 'CATALOG',  ingredients: ['Clopidogrel']},
  {code: 'OME20',  name: 'Nexium (Omeprazole)',     strength: '20mg',        source: 'CATALOG',  ingredients: ['Omeprazole']},
  {code: 'CIP500', name: 'Cifran (Ciprofloxacin)',  strength: '500mg',       source: 'CATALOG',  ingredients: ['Ciprofloxacin']},
  {code: 'THE100', name: 'Theostat (Theophylline)', strength: '100mg',       source: 'CATALOG',  ingredients: ['Theophylline']},
  {code: 'SIM20',  name: 'Zocor (Simvastatin)',     strength: '20mg',        source: 'CATALOG',  ingredients: ['Simvastatin']},
  {code: 'PAR500', name: 'Panadol 500mg',           strength: '500mg',       source: 'CATALOG',  ingredients: ['Paracetamol']},
  {code: 'AMX500', name: 'Amoxicillin STELLA',      strength: '500mg',       source: 'CATALOG',  ingredients: ['Amoxicillin']},
  {code: 'MET850', name: 'Glucophage (Metformin)',  strength: '850mg',       source: 'CATALOG',  ingredients: ['Metformin']},
  {code: 'LOS50',  name: 'Cozaar (Losartan)',       strength: '50mg',        source: 'CATALOG',  ingredients: ['Losartan']},
  {code: 'IBU400', name: 'Brufen 400mg',            strength: '400mg',       source: 'CATALOG',  ingredients: ['Ibuprofen']}
] AS row
MERGE (d:Drug {code: row.code}) SET d.name = row.name, d.strength = row.strength, d.source = row.source
WITH d, row
UNWIND row.ingredients AS ingredientName
MATCH (a:ActiveIngredient {name: ingredientName})
MERGE (d)-[:CONTAINS]->(a);

// ---------- 5. Bệnh (ICD-10) ----------
UNWIND [
  {icdCode: 'I10',   name: 'Tăng huyết áp vô căn (nguyên phát)'},
  {icdCode: 'I25',   name: 'Bệnh tim thiếu máu cục bộ mạn'},
  {icdCode: 'I48',   name: 'Rung nhĩ'},
  {icdCode: 'E78.2', name: 'Tăng lipid máu hỗn hợp'},
  {icdCode: 'E11',   name: 'Đái tháo đường type 2'},
  {icdCode: 'K21.0', name: 'Trào ngược dạ dày - thực quản có viêm thực quản'},
  {icdCode: 'K25',   name: 'Loét dạ dày'},
  {icdCode: 'N18',   name: 'Bệnh thận mạn'},
  {icdCode: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên cấp tính'},
  {icdCode: 'J45',   name: 'Hen phế quản'},
  {icdCode: 'R50.9', name: 'Sốt không rõ nguyên nhân'}
] AS row
MERGE (s:Disease {icdCode: row.icdCode}) SET s.name = row.name;

// ---------- 6. Hoạt chất điều trị bệnh (TREATS) ----------
UNWIND [
  ['Amlodipine', 'I10'], ['Losartan', 'I10'],
  ['Aspirin', 'I25'], ['Clopidogrel', 'I25'], ['Simvastatin', 'I25'],
  ['Warfarin', 'I48'],
  ['Simvastatin', 'E78.2'],
  ['Metformin', 'E11'],
  ['Omeprazole', 'K21.0'], ['Esomeprazole', 'K21.0'], ['Omeprazole', 'K25'], ['Esomeprazole', 'K25'],
  ['Amoxicillin', 'J06.9'], ['Ciprofloxacin', 'J06.9'],
  ['Theophylline', 'J45'],
  ['Paracetamol', 'R50.9'], ['Ibuprofen', 'R50.9']
] AS pair
MATCH (a:ActiveIngredient {name: pair[0]}), (s:Disease {icdCode: pair[1]})
MERGE (a)-[:TREATS]->(s);

// ---------- 7. Chống chỉ định theo bệnh nền (CONTRAINDICATED_IN) ----------
UNWIND [
  {ingredient: 'Aspirin',   icd: 'K25', reason: 'Tăng nguy cơ xuất huyết và thủng ổ loét dạ dày'},
  {ingredient: 'Ibuprofen', icd: 'K25', reason: 'NSAID làm nặng thêm tổn thương niêm mạc dạ dày'},
  {ingredient: 'Ibuprofen', icd: 'N18', reason: 'NSAID làm giảm tưới máu thận, nguy cơ suy thận cấp'},
  {ingredient: 'Metformin', icd: 'N18', reason: 'Nguy cơ nhiễm toan lactic khi suy giảm chức năng thận'},
  {ingredient: 'Ibuprofen', icd: 'J45', reason: 'NSAID có thể khởi phát cơn hen ở người nhạy cảm'},
  {ingredient: 'Warfarin',  icd: 'K25', reason: 'Nguy cơ xuất huyết tiêu hóa ồ ạt'}
] AS row
MATCH (a:ActiveIngredient {name: row.ingredient}), (s:Disease {icdCode: row.icd})
MERGE (a)-[r:CONTRAINDICATED_IN]->(s) SET r.reason = row.reason;

// ---------- 8. Tương tác thuốc - thuốc (INTERACTS_WITH, coi như vô hướng khi truy vấn) ----------
UNWIND [
  {a: 'Aspirin', b: 'Warfarin', severity: 'CRITICAL',
   title: 'Nguy cơ xuất huyết nội tạng nghiêm trọng',
   mechanism: 'Cả hai thuốc đều làm suy giảm đông máu qua các cơ chế phối hợp (kháng đông + ức chế kết tập tiểu cầu).',
   clinicalEffect: 'Tăng thời gian chảy máu, xuất huyết tiêu hóa, chảy máu nội sọ đe dọa tính mạng.',
   recommendation: 'Tránh dùng đồng thời trừ khi có chỉ định tim mạch đặc biệt. Theo dõi INR nghiêm ngặt.'},
  {a: 'Ibuprofen', b: 'Warfarin', severity: 'CRITICAL',
   title: 'Tăng nguy cơ xuất huyết khi phối hợp NSAID với thuốc chống đông',
   mechanism: 'NSAID ức chế tiểu cầu và gây tổn thương niêm mạc dạ dày, cộng hưởng với tác dụng chống đông.',
   clinicalEffect: 'Xuất huyết tiêu hóa, bầm tím, chảy máu kéo dài.',
   recommendation: 'Tránh phối hợp. Ưu tiên Paracetamol để giảm đau.'},
  {a: 'Clopidogrel', b: 'Omeprazole', severity: 'MAJOR',
   title: 'Giảm tác dụng kháng tiểu cầu của Clopidogrel',
   mechanism: 'Omeprazol ức chế CYP2C19, làm giảm chuyển hóa Clopidogrel thành dạng có hoạt tính.',
   clinicalEffect: 'Tăng nguy cơ huyết khối, tái nhồi máu cơ tim.',
   recommendation: 'Thay bằng PPI ít ảnh hưởng CYP2C19 như Pantoprazol.'},
  {a: 'Clopidogrel', b: 'Esomeprazole', severity: 'MAJOR',
   title: 'Giảm tác dụng kháng tiểu cầu của Clopidogrel',
   mechanism: 'Esomeprazol ức chế CYP2C19 tương tự Omeprazol.',
   clinicalEffect: 'Giảm hiệu quả phòng ngừa huyết khối.',
   recommendation: 'Cân nhắc Pantoprazol hoặc tách giờ uống và theo dõi.'},
  {a: 'Ciprofloxacin', b: 'Theophylline', severity: 'MAJOR',
   title: 'Độc tính Theophylline do tăng nồng độ máu',
   mechanism: 'Ciprofloxacin ức chế CYP1A2, giảm thanh thải Theophylin.',
   clinicalEffect: 'Buồn nôn, loạn nhịp tim, co giật.',
   recommendation: 'Giảm liều Theophylin 30-50% hoặc chọn kháng sinh khác; theo dõi nồng độ thuốc.'},
  {a: 'Amlodipine', b: 'Simvastatin', severity: 'MODERATE',
   title: 'Tăng nồng độ Simvastatin và nguy cơ tiêu cơ vân',
   mechanism: 'Amlodipin ức chế nhẹ CYP3A4, làm tăng nồng độ Simvastatin.',
   clinicalEffect: 'Đau cơ, tăng CK, hiếm gặp tiêu cơ vân.',
   recommendation: 'Không dùng Simvastatin quá 20mg/ngày khi phối hợp với Amlodipin.'},
  {a: 'Aspirin', b: 'Ibuprofen', severity: 'MODERATE',
   title: 'Ibuprofen làm giảm tác dụng bảo vệ tim của Aspirin',
   mechanism: 'Ibuprofen cạnh tranh vị trí gắn COX-1 trên tiểu cầu.',
   clinicalEffect: 'Giảm hiệu quả phòng ngừa biến cố tim mạch, tăng nguy cơ loét dạ dày.',
   recommendation: 'Uống Aspirin trước Ibuprofen ít nhất 30 phút hoặc dùng Paracetamol thay thế.'},
  {a: 'Aspirin', b: 'Clopidogrel', severity: 'MODERATE',
   title: 'Tăng nguy cơ chảy máu khi phối hợp hai thuốc kháng tiểu cầu',
   mechanism: 'Ức chế kết tập tiểu cầu qua hai cơ chế khác nhau.',
   clinicalEffect: 'Tăng nguy cơ xuất huyết, cần cân nhắc lợi ích sau can thiệp mạch vành.',
   recommendation: 'Chỉ phối hợp khi có chỉ định (sau đặt stent); kèm thuốc bảo vệ dạ dày phù hợp.'}
] AS row
MATCH (a:ActiveIngredient {name: row.a}), (b:ActiveIngredient {name: row.b})
MERGE (a)-[r:INTERACTS_WITH]->(b)
SET r.severity = row.severity, r.title = row.title, r.mechanism = row.mechanism,
    r.clinicalEffect = row.clinicalEffect, r.recommendation = row.recommendation;

// ---------- 9. Kiểm tra nhanh ----------
MATCH (n) RETURN labels(n)[0] AS loaiNode, count(*) AS soLuong ORDER BY loaiNode;
MATCH ()-[r]->() RETURN type(r) AS loaiQuanHe, count(*) AS soLuong ORDER BY loaiQuanHe;
