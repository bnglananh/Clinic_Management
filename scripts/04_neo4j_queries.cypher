// ==============================================================================================
// DỰ ÁN SMART CLINIC EMR - TẬP LỆNH TRUY VẤN NEO4J GRAPH THEO TÍNH NĂNG DƯỢC LÝ & AN TOÀN KÊ ĐƠN
// Database: Neo4j Graph Database v5.26 (Bolt port 7687, HTTP 7474)
//
// Cách chạy:
//   1. Chạy với cypher-shell:
//      cypher-shell -u neo4j -p clinic12345 -f scripts/neo4j/queries_by_feature.cypher
//   2. Chạy qua Docker Container:
//      docker exec -i clinic-neo4j cypher-shell -u neo4j -p clinic12345 < scripts/neo4j/queries_by_feature.cypher
//   3. Trực quan hóa tương tác đồ thị: 
//      Truy cập Neo4j Browser tại http://localhost:7474
// ==============================================================================================

// ==============================================================================================
// TÍNH NĂNG 1: KIỂM TRA TƯƠNG TÁC THUỐC - THUỐC TRONG ĐƠN (DDI SAFETY CHECK - UC-09, BR-10, BR-11)
// Bóc tách biệt dược -> Hoạt chất -> Quan hệ [:INTERACTS_WITH] giữa các hoạt chất.
// Giả định đơn thuốc bác sĩ chọn gồm: Aspirin 81mg (ASP81), Sintrom 2mg (WAR02), Plavix 75mg (PLA75), Nexium 40mg (NEX40)
// API tương ứng: POST /api/prescriptions/safety-check
// ==============================================================================================
WITH ['ASP81', 'WAR02', 'PLA75', 'NEX40'] AS danhSachMaThuoc
MATCH (d1:Drug)-[:CONTAINS]->(a1:ActiveIngredient)-[r:INTERACTS_WITH]-(a2:ActiveIngredient)<-[:CONTAINS]-(d2:Drug)
WHERE d1.code IN danhSachMaThuoc 
  AND d2.code IN danhSachMaThuoc 
  AND d1.code < d2.code
RETURN d1.name AS thuoc_A, 
       d2.name AS thuoc_B, 
       r.severity AS muc_do_nguy_hiem, 
       r.title AS canh_bao_tuong_tac
ORDER BY CASE r.severity 
           WHEN 'CRITICAL' THEN 0 
           WHEN 'MAJOR' THEN 1 
           ELSE 2 
         END;


// ==============================================================================================
// TÍNH NĂNG 2: KIỂM TRA CHỐNG CHỈ ĐỊNH THEO BỆNH NỀN ICD-10 (CONTRAINDICATION - UC-09, BR-12)
// Phát hiện thuốc kê có hoạt chất chống chỉ định với tiền sử bệnh lý của bệnh nhân.
// Giả định: Bệnh nhân có tiền sử Loét dạ dày (K25) và Suy thận mạn (N18), bác sĩ định kê Ibuprofen, Glucophage, Paracetamol.
// ==============================================================================================
WITH ['K25', 'N18'] AS maBenhIcd, ['IBU400', 'GLU850', 'PAR500'] AS maThuocDuKien
MATCH (d:Drug)-[:CONTAINS]->(a:ActiveIngredient)-[c:CONTRAINDICATED_IN]->(s:Disease)
WHERE d.code IN maThuocDuKien 
  AND s.icdCode IN maBenhIcd
RETURN d.name AS thuoc_vi_pham, 
       s.icdCode AS ma_icd_benh, 
       s.name AS ten_benh_chong_chi_dinh, 
       c.reason AS ly_do_y_khoa;


// ==============================================================================================
// TÍNH NĂNG 3: CẢNH BÁO DỊ ỨNG THEO NHÓM DƯỢC LÝ (DRUG CLASS ALLERGY - BR-13)
// Khi bệnh nhân có tiền sử dị ứng với một nhóm thuốc (ví dụ nhóm Penicillin),
// hệ thống tìm ra toàn bộ các biệt dược và hoạt chất thuộc nhóm đó để ngăn chặn kê đơn chéo.
// ==============================================================================================
MATCH (d:Drug)-[:CONTAINS]->(a:ActiveIngredient)-[:BELONGS_TO]->(c:DrugClass {name: 'Penicillin'})
RETURN d.code AS ma_biet_duoc, 
       d.name AS ten_biet_duoc, 
       a.name AS hoat_chat, 
       c.name AS nhom_duoc_ly;


// ==============================================================================================
// TÍNH NĂNG 4: GỢI Ý THUỐC THAY THẾ AN TOÀN (SAFE DRUG SUBSTITUTION - UC-09, BR-11)
// Bác sĩ cần đổi thuốc Plavix (PLA75) bằng một loại thuốc khác cùng có tác dụng điều trị (TREATS)
// bệnh lý đó, nhưng KHÔNG ĐƯỢC tương tác với Esomeprazole (thuốc dạ dày bệnh nhân đang dùng).
// ==============================================================================================
MATCH (d:Drug {code: 'PLA75'})-[:CONTAINS]->(a:ActiveIngredient)-[:TREATS]->(s:Disease)<-[:TREATS]-(alt:ActiveIngredient)<-[:CONTAINS]-(altDrug:Drug)
WHERE alt <> a
  AND NOT EXISTS { 
      MATCH (alt)-[:INTERACTS_WITH]-(:ActiveIngredient {name: 'Esomeprazole'}) 
  }
RETURN DISTINCT altDrug.code AS ma_thuoc_thay_the, 
                altDrug.name AS ten_thuoc_thay_the, 
                alt.name AS hoat_chat_thay_the, 
                s.name AS cung_dieu_tri_benh;


// ==============================================================================================
// TÍNH NĂNG 5: TRUY VẾT ĐƯỜNG ĐI NGẮN NHẤT GIỮA HAI THUỐC (SHORTEST PATH EXPLANATION - UC-09)
// Tìm đường đi bắc cầu giải thích cơ chế tương quan giữa Amlor (AML05) và Simvastatin (SIM20) qua tối đa 6 bước.
// ==============================================================================================
MATCH p = shortestPath((x:Drug {code: 'AML05'})-[*..6]-(y:Drug {code: 'SIM20'}))
RETURN [n IN nodes(p) | coalesce(n.name, n.icdCode)] AS cac_nut_tren_duong_di, 
       [r IN relationships(p) | type(r)] AS cac_quan_he_ket_noi;


// ==============================================================================================
// TÍNH NĂNG 6: BÓC TÁCH HOẠT CHẤT & NHÓM DƯỢC LÝ CỦA BIỆT DƯỢC (DRUG DECOMPOSITION)
// Tra cứu cấu trúc thành phần của biệt dược Augmentin 625mg (AUG625) gồm những hoạt chất và nhóm nào.
// ==============================================================================================
MATCH (d:Drug {code: 'AUG625'})-[:CONTAINS]->(a:ActiveIngredient)-[:BELONGS_TO]->(c:DrugClass)
RETURN d.name AS ten_biet_duoc, 
       d.dosageForm AS dang_bao_che, 
       a.name AS hoat_chat, 
       c.name AS phan_loai_duoc_ly;


// ==============================================================================================
// TÍNH NĂNG 7: PHÂN TÍCH ĐỒ THỊ - TOP HOẠT CHẤT RỦI RO CAO NHẤT (GRAPH ANALYTICS & PROFILING)
// Thống kê các hoạt chất có số lượng tương tác CRITICAL / MAJOR nhiều nhất trong danh mục dược của phòng khám.
// ==============================================================================================
MATCH (a:ActiveIngredient)-[r:INTERACTS_WITH]-()
RETURN a.name AS ten_hoat_chat, 
       count(r) AS tong_so_tuong_tac, 
       sum(CASE WHEN r.severity IN ['CRITICAL', 'MAJOR'] THEN 1 ELSE 0 END) AS so_tuong_tac_nghiem_trong
ORDER BY so_tuong_tac_nghiem_trong DESC, tong_so_tuong_tac DESC 
LIMIT 5;


// ==============================================================================================
// TÍNH NĂNG 8: ĐỘ PHỦ ĐIỀU TRỊ BỆNH LÝ CỦA DANH MỤC THUỐC (DISEASE TREATMENT COVERAGE)
// Thống kê mỗi bệnh lý ICD-10 trong đồ thị đang có bao nhiêu lựa chọn hoạt chất và biệt dược điều trị.
// ==============================================================================================
MATCH (s:Disease)<-[:TREATS]-(a:ActiveIngredient)<-[:CONTAINS]-(d:Drug)
RETURN s.icdCode AS ma_icd, 
       s.name AS ten_benh, 
       count(DISTINCT a) AS so_luong_hoat_chat_dieu_tri, 
       collect(DISTINCT d.name)[0..3] AS cac_biet_duoc_tieu_bieu
ORDER BY so_luong_hoat_chat_dieu_tri DESC;
