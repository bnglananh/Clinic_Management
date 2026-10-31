/**
 * SMART CLINIC EMR – Truy vấn mẫu MongoDB (CRUD, lọc, tìm kiếm, sắp xếp, thống kê)
 * Chạy:  mongosh mongodb://localhost:27017/clinic_db database/mongodb/queries.js
 *    hoặc docker exec -i clinic-mongodb mongosh clinic_db < database/mongodb/queries.js
 *
 * Mỗi truy vấn tương ứng với một chức năng thật của backend (ghi chú "→ API ...").
 */
db = db.getSiblingDB('clinic_db');
const show = (title, cursorOrValue) => {
  print('\n=== ' + title);
  printjson(typeof cursorOrValue.toArray === 'function' ? cursorOrValue.toArray() : cursorOrValue);
};

// -------------------------------------------------------------------------
// 1. CREATE
// -------------------------------------------------------------------------
db.patients.insertOne({
  _id: 'usr-pat-demo',
  patientCode: 'BN-2026-DEMO',
  fullName: 'Nguyễn Văn Demo',
  dateOfBirth: '1988-03-12',
  gender: 'NAM',
  phone: '0900000999',
  email: 'demo.patient@example.com',
  identityCardNumber: '079088009999',
  allergies: 'Dị ứng Penicillin',
  bloodType: 'A+',
  role: 'PATIENT',
  totalVisits: 0,
  createdAt: new Date().toISOString().slice(0, 10),
});
db.notifications.insertMany([
  { _id: 'NOTIF-DEMO-1', userId: 'usr-pat-demo', title: 'Chào mừng', content: 'Demo', type: 'SYSTEM', isRead: false },
  { _id: 'NOTIF-DEMO-2', userId: 'usr-pat-demo', title: 'Lịch hẹn', content: 'Demo', type: 'APPOINTMENT', isRead: false },
]);
print('\n[CREATE] Đã thêm bệnh nhân usr-pat-demo và 2 thông báo demo');

// -------------------------------------------------------------------------
// 2. READ – lọc, tìm kiếm, sắp xếp, phân trang
// -------------------------------------------------------------------------
// → GET /api/patients?q=lan  (tìm theo tên/mã/SĐT/CCCD, không phân biệt hoa thường)
show('Tìm bệnh nhân có "lan" trong tên, mã, SĐT hoặc CCCD',
  db.patients.find(
    { $or: [
      { fullName: { $regex: 'lan', $options: 'i' } },
      { patientCode: { $regex: 'lan', $options: 'i' } },
      { phone: { $regex: 'lan' } },
      { identityCardNumber: { $regex: 'lan' } },
    ] },
    { patientCode: 1, fullName: 1, phone: 1 }));

// Tìm kiếm toàn văn bằng text index (fullName, patientCode)
show('Text search "Phạm"', db.patients.find({ $text: { $search: 'Phạm' } }, { fullName: 1, patientCode: 1 }));

// → GET /api/appointments?date=...&status=CONFIRMED  (lọc + sắp xếp ngày giảm dần)
show('Lịch hẹn đã xác nhận, mới nhất trước',
  db.appointments.find({ status: 'CONFIRMED' }, { appointmentCode: 1, patientName: 1, appointmentDate: 1, timeSlot: 1 })
    .sort({ appointmentDate: -1, timeSlot: 1 }));

// → GET /api/admin/pharmacy/drugs/low-stock  (tồn kho ≤ 10, còn kinh doanh)
show('Thuốc sắp hết hàng',
  db.pharmacy_drugs.find({ status: 'ACTIVE', stockQuantity: { $lte: 10 } }, { code: 1, name: 1, stockQuantity: 1 })
    .sort({ stockQuantity: 1 }));

// → GET /api/records/patient/{id}?keyword=I10  (tìm trong mảng lồng diagnoses / prescriptions)
show('Bệnh án có chẩn đoán I10 hoặc kê Amlor',
  db.medical_records.find(
    { $or: [{ 'diagnoses.code': 'I10' }, { 'prescriptions.name': { $regex: 'Amlor', $options: 'i' } }] },
    { visitCode: 1, patientName: 1, visitDate: 1, 'diagnoses.code': 1 }));

// Phân trang hàng đợi theo thứ tự gọi số
show('Hàng đợi đang chờ – trang 1 (3 vé)',
  db.queue_tickets.find({ status: 'WAITING' }, { ticketNumber: 1, patientName: 1, priority: 1, sortOrder: 1 })
    .sort({ sortOrder: 1 }).skip(0).limit(3));

// -------------------------------------------------------------------------
// 3. UPDATE
// -------------------------------------------------------------------------
// → PUT /api/patients/{id}
db.patients.updateOne({ _id: 'usr-pat-demo' },
  { $set: { address: '1 Lê Duẩn, Quận 1, TP.HCM', updatedAt: new Date().toISOString().slice(0, 10) } });
// → PATCH /api/notifications/mark-all-read  (cập nhật nhiều document)
const marked = db.notifications.updateMany({ userId: 'usr-pat-demo', isRead: false },
  { $set: { isRead: true, readAt: new Date().toISOString() } });
print('\n[UPDATE] Đánh dấu đã đọc: ' + marked.modifiedCount + ' thông báo');
// → POST /api/admin/pharmacy/drugs/{id}/stock  (tăng/giảm nguyên tử bằng $inc)
db.pharmacy_drugs.updateOne({ code: 'PAN500' }, { $inc: { stockQuantity: 50 } });
// Sinh mã tuần tự nguyên tử – cách backend cấp id mới (collection counters)
show('Bộ đếm sau khi tăng',
  db.counters.findOneAndUpdate({ _id: 'demo_seq' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' }));

// -------------------------------------------------------------------------
// 4. DELETE
// -------------------------------------------------------------------------
db.patients.deleteOne({ _id: 'usr-pat-demo' });
db.notifications.deleteMany({ userId: 'usr-pat-demo' });
db.pharmacy_drugs.updateOne({ code: 'PAN500' }, { $inc: { stockQuantity: -50 } }); // hoàn tác ví dụ $inc
db.counters.deleteOne({ _id: 'demo_seq' });
print('\n[DELETE] Đã xóa dữ liệu demo');

// -------------------------------------------------------------------------
// 5. THỐNG KÊ (Aggregation Pipeline)
// -------------------------------------------------------------------------
// → GET /api/billing/summary : doanh thu theo trạng thái thanh toán
show('Doanh thu theo trạng thái thanh toán',
  db.bills.aggregate([
    { $group: { _id: '$paymentStatus', soHoaDon: { $sum: 1 }, tongTien: { $sum: '$totalAmount' } } },
    { $sort: { tongTien: -1 } },
  ]));

// → GET /api/reports/departments : lượt khám theo chuyên khoa
show('Lượt khám theo chuyên khoa',
  db.medical_records.aggregate([
    { $group: { _id: '$department', luotKham: { $sum: 1 } } },
    { $sort: { luotKham: -1 } },
  ]));

// Top chẩn đoán ICD-10 ($unwind mảng lồng)
show('Top chẩn đoán ICD-10',
  db.medical_records.aggregate([
    { $unwind: '$diagnoses' },
    { $group: { _id: { code: '$diagnoses.code', ten: '$diagnoses.nameVi' }, soLan: { $sum: 1 } } },
    { $sort: { soLan: -1 } },
    { $limit: 5 },
  ]));

// Giá trị tồn kho theo nhà sản xuất (Decimal128 × số lượng)
show('Giá trị tồn kho theo nhà sản xuất',
  db.pharmacy_drugs.aggregate([
    { $match: { status: 'ACTIVE' } },
    { $group: { _id: '$manufacturer',
                soThuoc: { $sum: 1 },
                giaTriTon: { $sum: { $multiply: ['$importPrice', '$stockQuantity'] } } } },
    { $sort: { giaTriTon: -1 } },
  ]));

// Lịch hẹn kèm hồ sơ bệnh nhân ($lookup – join giữa hai collection)
show('Lịch hẹn kèm nhóm máu & dị ứng của bệnh nhân',
  db.appointments.aggregate([
    { $lookup: { from: 'patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, appointmentCode: 1, patientName: 1, appointmentDate: 1,
                  bloodType: '$patient.bloodType', allergies: '$patient.allergies' } },
    { $limit: 5 },
  ]));
