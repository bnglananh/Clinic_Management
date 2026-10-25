# PHÂN HỆ NEO4J (GRAPH DATABASE)

> **Hệ CSDL**: Neo4j v5.0+  
> **Mô hình**: Labeled Property Graph (LPG)  
> **Ngôn ngữ truy vấn**: Cypher Query Language (CQL)

---

## 1. VAI TRÒ TRONG HỆ THỐNG
Neo4j đảm nhiệm việc mô hình hóa mạng lưới tri thức y tế và dược lý:
- Liên kết giữa **Thuốc thương mại (`Drug`)** $\longrightarrow$ **Hoạt chất hóa học (`ActiveIngredient`)**.
- Xác định các quan hệ tương tác bất lợi **`INTERACTS_WITH`** giữa các hoạt chất với các thuộc tính:
  - Mức độ nghiêm trọng: `HIGH` (Đỏ Burgundy), `MEDIUM`, `LOW`.
  - Hậu quả lâm sàng (`effect`).
  - Khuyến cáo y khoa (`recommendation`).
- Hỗ trợ bác sĩ quét ngay lập tức các xung đột đối kháng thuốc (DDI) ngay trên bàn làm việc lâm sàng (`doctor/workspace`) trước khi lưu toa thuốc (BR-12).

---

## 2. HƯỚNG DẪN KHỞI TẠO
Chạy file script `init-graph.cypher` qua công cụ `cypher-shell` hoặc giao diện Neo4j Browser:

```bash
# Thực thi qua cypher-shell:
cypher-shell -u neo4j -p yourpassword -f init-graph.cypher

# Hoặc qua container Docker:
docker exec -i clinic-neo4j cypher-shell -u neo4j -p yourpassword < init-graph.cypher
```
