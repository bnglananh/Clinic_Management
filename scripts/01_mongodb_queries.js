/**
 * ==============================================================================================
 * DỰ ÁN SMART CLINIC EMR - TẬP LỆNH TRUY VẤN MONGODB THEO TÍNH NĂNG NGHIỆP VỤ
 * Database: clinic_db (Document Database)
 *
 * Cách chạy:
 *   1. Chạy trực tiếp với mongosh:
 *      mongosh mongodb://localhost:27017/clinic_db scripts/mongodb/queries_by_feature.js
 *   2. Chạy qua Docker Container:
 *      docker exec -i clinic-mongodb mongosh clinic_db < scripts/mongodb/queries_by_feature.js
 * ==============================================================================================
 */

db = db.getSiblingDB('clinic_db');

const printHeader = (featureCode, title) => {
  print('\n' + '='.repeat(85));
  print(`[${featureCode}] ${title}`);
  print('='.repeat(85));
};

const showResult = (label, cursorOrValue) => {
  print(`\n>>> Kết quả: ${label}`);
  if (!cursorOrValue) {
    print('null');
    return;
  }
  if (typeof cursorOrValue.toArray === 'function') {
    printjson(cursorOrValue.toArray());
  } else {
    printjson(cursorOrValue);
  }
};

// ==============================================================================================
// PHÂN HỆ 1: QUẢN LÝ TIẾP ĐÓN & HỒ SƠ BỆNH NHÂN (PATIENT MANAGEMENT - UC-01, UC-02)
// ==============================================================================================
printHeader('FEATURE 1', 'QUẢN LÝ TIẾP ĐÓN & HỒ SƠ BỆNH NHÂN (PATIENTS)');

// 1.1 Thêm mới hồ sơ bệnh nhân khi đến phòng khám
const newPatient = {
  _id: 'usr-pat-script-demo',
  patientCode: 'BN-2026-9999',
  fullName: 'Đặng Hoàng Long',
  dateOfBirth: '1992-08-15',
  gender: 'NAM',
  phone: '0912345678',
  email: 'hoanglong.dang@example.com',
  identityCardNumber: '079092008888',
  address: '45 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
  bloodType: 'B+',
  allergies: 'Dị ứng Aspirin, NSAIDs',
  underlyingDiseases: ['K25', 'I10'], // Loét dạ dày, Tăng huyết áp
  emergencyContact: {
    fullName: 'Đặng Hoàng Nam',
    phone: '0912345999',
    relationship: 'Anh trai'
  },
  insuranceNumber: 'DN4790123456789',
  role: 'PATIENT',
  totalVisits: 0,
  createdAt: new Date().toISOString()
};
db.patients.insertOne(newPatient);
print('[1.1 INSERT] Đã thêm thành công hồ sơ bệnh nhân demo: BN-2026-9999');

// 1.2 Tìm kiếm bệnh nhân đa tiêu chí (Họ tên, Mã bệnh nhân, SĐT, CCCD)
showResult('1.2 Tìm kiếm bệnh nhân theo từ khóa "Long" hoặc SĐT',
  db.patients.find(
    {
      $or: [
        { fullName: { $regex: 'Long', $options: 'i' } },
        { patientCode: { $regex: 'BN-2026-9999', $options: 'i' } },
        { phone: '0912345678' },
        { identityCardNumber: '079092008888' }
      ]
    },
    { patientCode: 1, fullName: 1, phone: 1, bloodType: 1, allergies: 1 }
  )
);

// 1.3 Tìm kiếm toàn văn bằng Text Index
showResult('1.3 Toàn văn Full-text search tìm "Nguyễn"',
  db.patients.find(
    { $text: { $search: 'Nguyễn' } },
    { score: { $meta: 'textScore' }, fullName: 1, patientCode: 1, phone: 1 }
  ).sort({ score: { $meta: 'textScore' } }).limit(3)
);

// 1.4 Cập nhật thông tin hành chính & địa chỉ liên lạc
db.patients.updateOne(
  { _id: 'usr-pat-script-demo' },
  {
    $set: {
      address: '77 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      updatedAt: new Date().toISOString()
    }
  }
);
print('[1.4 UPDATE] Đã cập nhật địa chỉ liên hệ của bệnh nhân');

// 1.5 Tăng số lần khám nguyên tử ($inc) khi bệnh nhân hoàn thành khám
db.patients.updateOne(
  { _id: 'usr-pat-script-demo' },
  { $inc: { totalVisits: 1 } }
);
print('[1.5 ATOMIC INC] Đã tăng biến totalVisits lên 1');

// ==============================================================================================
// PHÂN HỆ 2: ĐẶT LỊCH HẸN & ĐIỀU PHỐI KHÁM (APPOINTMENTS - UC-03, UC-04, UC-05)
// ==============================================================================================
printHeader('FEATURE 2', 'ĐẶT LỊCH HẸN & ĐIỀU PHỐI KHÁM (APPOINTMENTS)');

// 2.1 Tạo phiếu đặt lịch hẹn khám trực tuyến
const newAppointment = {
  _id: 'APP-SCRIPT-DEMO',
  appointmentCode: 'LH-2026-9999',
  patientId: 'usr-pat-script-demo',
  patientName: 'Đặng Hoàng Long',
  doctorId: 'usr-doc-01',
  doctorName: 'TS.BS Trần Minh Hoàng',
  department: 'Tim Mạch',
  appointmentDate: '2026-12-20',
  timeSlot: '08:30-09:00',
  reason: 'Tái khám tăng huyết áp và đau ngực nhẹ',
  status: 'CONFIRMED',
  createdAt: new Date().toISOString()
};
db.appointments.insertOne(newAppointment);
print('[2.1 INSERT] Đã lưu lịch hẹn khám mới: LH-2026-9999');

// 2.2 Kiểm tra lịch hẹn của bác sĩ trong ngày để tránh xung đột giờ khám
showResult('2.2 Danh sách lịch hẹn đã xác nhận của bác sĩ usr-doc-01',
  db.appointments.find(
    {
      doctorId: 'usr-doc-01',
      appointmentDate: '2026-12-20',
      status: { $in: ['PENDING', 'CONFIRMED'] }
    },
    { appointmentCode: 1, patientName: 1, timeSlot: 1, status: 1 }
  ).sort({ timeSlot: 1 })
);

// 2.3 $lookup: Xem lịch hẹn kết hợp tiền sử dị ứng và nhóm máu từ collection patients
showResult('2.3 Chi tiết lịch hẹn JOIN với thông tin y tế bệnh nhân ($lookup)',
  db.appointments.aggregate([
    { $match: { appointmentCode: 'LH-2026-9999' } },
    {
      $lookup: {
        from: 'patients',
        localField: 'patientId',
        foreignField: '_id',
        as: 'patientDetails'
      }
    },
    { $unwind: '$patientDetails' },
    {
      $project: {
        appointmentCode: 1,
        patientName: 1,
        doctorName: 1,
        appointmentDate: 1,
        timeSlot: 1,
        bloodType: '$patientDetails.bloodType',
        allergies: '$patientDetails.allergies',
        phone: '$patientDetails.phone'
      }
    }
  ])
);

// ==============================================================================================
// PHÂN HỆ 3: CẤP SỐ THỨ TỰ & ĐIỀU PHỐI HÀNG ĐỢI (QUEUE TICKETS - UC-06, UC-07)
// ==============================================================================================
printHeader('FEATURE 3', 'QUẢN LÝ CẤP SỐ & HÀNG ĐỢI KHÁM (QUEUE TICKETS)');

// 3.1 Cấp số thứ tự khám hàng đợi
db.queue_tickets.insertOne({
  _id: 'QT-SCRIPT-DEMO',
  ticketNumber: 'A-108',
  queueDate: '2026-12-20',
  patientId: 'usr-pat-script-demo',
  patientName: 'Đặng Hoàng Long',
  roomNumber: 'PK-201',
  priority: 'NORMAL',
  sortOrder: 108,
  status: 'WAITING',
  estimatedTime: '08:45',
  createdAt: new Date().toISOString()
});
print('[3.1 INSERT] Đã cấp số thứ tự A-108 phòng PK-201');

// 3.2 Lấy danh sách bệnh nhân đang chờ theo thứ tự ưu tiên gọi số
showResult('3.2 Thứ tự gọi khám phòng PK-201 (Ưu tiên sortOrder)',
  db.queue_tickets.find(
    { roomNumber: 'PK-201', status: 'WAITING' },
    { ticketNumber: 1, patientName: 1, priority: 1, sortOrder: 1, estimatedTime: 1 }
  ).sort({ sortOrder: 1 }).limit(5)
);

// 3.3 Chuyển trạng thái khi bác sĩ nhấn nút gọi vào buồng khám
db.queue_tickets.updateOne(
  { _id: 'QT-SCRIPT-DEMO' },
  {
    $set: {
      status: 'IN_CONSULTATION',
      calledAt: new Date().toISOString()
    }
  }
);
print('[3.3 UPDATE] Cập nhật ticket sang IN_CONSULTATION (đang khám)');

// ==============================================================================================
// PHÂN HỆ 4: BỆNH ÁN ĐIỆN TỬ EMR & KÊ ĐƠN LÂM SÀNG (MEDICAL RECORDS - UC-08, UC-09, UC-10)
// ==============================================================================================
printHeader('FEATURE 4', 'BỆNH ÁN ĐIỆN TỬ EMR & KÊ ĐƠN THUỐC (MEDICAL RECORDS)');

// 4.1 Tạo bệnh án điện tử với cấu trúc lồng đa cấp (Diagnoses, Prescriptions, Services)
const newMedicalRecord = {
  _id: 'REC-SCRIPT-DEMO',
  visitCode: 'KB-2026-9999',
  patientId: 'usr-pat-script-demo',
  patientName: 'Đặng Hoàng Long',
  doctorId: 'usr-doc-01',
  doctorName: 'TS.BS Trần Minh Hoàng',
  department: 'Tim Mạch',
  visitDate: '2026-12-20',
  vitalSigns: {
    bloodPressureSystolic: 135,
    bloodPressureDiastolic: 85,
    heartRate: 78,
    temperature: 36.8,
    spo2: 98,
    weight: 68,
    height: 172,
    bmi: 23.0
  },
  symptoms: 'Hồi hộp, thỉnh thoảng đau thắt ngực nhẹ khi vận động',
  diagnoses: [
    { code: 'I10', nameVi: 'Bệnh tăng huyết áp vô căn (nguyên phát)', isPrimary: true },
    { code: 'E78.0', nameVi: 'Tăng cholesterol máu thuần túy', isPrimary: false }
  ],
  prescriptions: [
    { drugCode: 'AML05', name: 'Amlor 5mg', quantity: 30, unit: 'Viên', dosage: 'Uống 1 viên vào buổi sáng' },
    { drugCode: 'ATOR20', name: 'Atorvastatin 20mg', quantity: 30, unit: 'Viên', dosage: 'Uống 1 viên buổi tối' }
  ],
  serviceOrders: [
    { serviceCode: 'XN-MAU-01', name: 'Công thức máu 24 thông số', price: 120000, status: 'COMPLETED' },
    { serviceCode: 'CDHA-ECG', name: 'Điện tâm đồ 12 chuyển đạo', price: 80000, status: 'COMPLETED' }
  ],
  doctorNotes: 'Bệnh nhân đáp ứng tốt, hạn chế ăn mặn, tập thể dục nhẹ',
  status: 'COMPLETED',
  totalCost: 550000,
  createdAt: new Date().toISOString()
};
db.medical_records.insertOne(newMedicalRecord);
print('[4.1 INSERT] Đã lưu bệnh án điện tử đa cấu trúc: KB-2026-9999');

// 4.2 Truy vấn tìm bệnh án có mã chẩn đoán ICD-10 'I10' trong mảng lồng
showResult('4.2 Lọc bệnh án có chẩn đoán I10 (Tăng huyết áp)',
  db.medical_records.find(
    { 'diagnoses.code': 'I10' },
    { visitCode: 1, patientName: 1, doctorName: 1, visitDate: 1, 'diagnoses.nameVi': 1 }
  ).sort({ visitDate: -1 }).limit(3)
);

// 4.3 Khóa bệnh án điện tử sau khi hoàn tất đợt khám (BR-09: Chống sửa bệnh án đã khóa)
db.medical_records.updateOne(
  { _id: 'REC-SCRIPT-DEMO' },
  {
    $set: {
      status: 'LOCKED',
      lockedAt: new Date().toISOString(),
      lockedBy: 'usr-doc-01'
    }
  }
);
print('[4.3 LOCK RECORD] Bệnh án đã được khóa (status: LOCKED)');

// ==============================================================================================
// PHÂN HỆ 5: HÓA ĐƠN VIỆN PHÍ & THU NGÂN (BILLS & BILLING - UC-11, UC-12)
// ==============================================================================================
printHeader('FEATURE 5', 'QUẢN LÝ VIỆN PHÍ & SỔ THU NGÂN (BILLS)');

// 5.1 Tạo hóa đơn thanh toán viện phí
const newBill = {
  _id: 'BILL-SCRIPT-DEMO',
  billCode: 'HD-2026-9999',
  medicalRecordId: 'REC-SCRIPT-DEMO',
  patientId: 'usr-pat-script-demo',
  patientName: 'Đặng Hoàng Long',
  totalAmount: 550000,
  insuranceCoverage: 110000, // BHYT chi trả 20%
  patientPayment: 440000,
  paymentStatus: 'PAID',
  paymentMethod: 'VNPAY',
  cashierId: 'usr-rec-01',
  cashierName: 'Lê Thu Hà',
  paidAt: new Date().toISOString(),
  items: [
    { itemType: 'SERVICE', name: 'Công thức máu 24 thông số', amount: 120000 },
    { itemType: 'SERVICE', name: 'Điện tâm đồ 12 chuyển đạo', amount: 80000 },
    { itemType: 'DRUG', name: 'Amlor 5mg (30 viên)', amount: 150000 },
    { itemType: 'DRUG', name: 'Atorvastatin 20mg (30 viên)', amount: 200000 }
  ]
};
db.bills.insertOne(newBill);
print('[5.1 INSERT] Đã tạo hóa đơn viện phí: HD-2026-9999');

// 5.2 Truy vấn sổ thu ngân theo ngày phục vụ xuất báo cáo Excel
showResult('5.2 Sổ thu ngân danh sách hóa đơn đã thu tiền hôm nay',
  db.bills.find(
    { paymentStatus: 'PAID' },
    { billCode: 1, patientName: 1, patientPayment: 1, paymentMethod: 1, paidAt: 1 }
  ).sort({ paidAt: -1 }).limit(5)
);

// 5.3 Thống kê doanh thu theo trạng thái thanh toán (PAID vs UNPAID)
showResult('5.3 Tổng doanh thu phân theo trạng thái thanh toán ($group)',
  db.bills.aggregate([
    {
      $group: {
        _id: '$paymentStatus',
        tongSoHoaDon: { $sum: 1 },
        tongDoanhThu: { $sum: '$patientPayment' }
      }
    },
    { $sort: { tongDoanhThu: -1 } }
  ])
);

// ==============================================================================================
// PHÂN HỆ 6: KHO DƯỢC & CẢNH BÁO TỒN KHO (PHARMACY INVENTORY - UC-14, UC-15)
// ==============================================================================================
printHeader('FEATURE 6', 'QUẢN LÝ KHO DƯỢC & CẢNH BÁO TỒN KHO (PHARMACY)');

// 6.1 Lọc danh sách thuốc sắp hết hàng (tồn kho dưới mức cảnh báo minStockAlert)
showResult('6.1 Cảnh báo thuốc tồn kho thấp (stockQuantity <= 20)',
  db.pharmacy_drugs.find(
    { status: 'ACTIVE', stockQuantity: { $lte: 20 } },
    { code: 1, name: 1, stockQuantity: 1, unit: 1, manufacturer: 1 }
  ).sort({ stockQuantity: 1 })
);

// 6.2 Cập nhật xuất kho thuốc nguyên tử ($inc âm) khi duyệt phát thuốc cho bệnh nhân
db.pharmacy_drugs.updateOne(
  { code: 'AML05', stockQuantity: { $gte: 30 } }, // Chống bán âm tồn kho
  { $inc: { stockQuantity: -30 } }
);
print('[6.2 ATOMIC DECREMENT] Đã trừ 30 viên Amlor 5mg trong kho');

// 6.3 Thống kê giá trị tồn kho theo từng hãng dược phẩm ($multiply, $group)
showResult('6.3 Thống kê giá trị tồn kho theo nhà sản xuất',
  db.pharmacy_drugs.aggregate([
    { $match: { status: 'ACTIVE' } },
    {
      $group: {
        _id: '$manufacturer',
        soMatHang: { $sum: 1 },
        tongSoLuongTon: { $sum: '$stockQuantity' },
        tongGiaTriTonKho: { $sum: { $multiply: ['$importPrice', '$stockQuantity'] } }
      }
    },
    { $sort: { tongGiaTriTonKho: -1 } }
  ])
);

// ==============================================================================================
// PHÂN HỆ 7: BÁO CÁO THỐNG KÊ ĐIỀU HÀNH PHÒNG KHÁM (ANALYTICS & BI - UC-16)
// ==============================================================================================
printHeader('FEATURE 7', 'BÁO CÁO THỐNG KÊ ĐIỀU HÀNH PHÒNG KHÁM (AGGREGATION PIPELINES)');

// 7.1 Thống kê số lượt khám bệnh theo từng chuyên khoa
showResult('7.1 Lượt khám phân bố theo chuyên khoa',
  db.medical_records.aggregate([
    {
      $group: {
        _id: '$department',
        soLuotKham: { $sum: 1 },
        doanhThuKham: { $sum: '$totalCost' }
      }
    },
    { $sort: { soLuotKham: -1 } }
  ])
);

// 7.2 Top 5 bệnh lý ICD-10 được chẩn đoán nhiều nhất phòng khám ($unwind)
showResult('7.2 Top 5 mã bệnh ICD-10 phổ biến nhất',
  db.medical_records.aggregate([
    { $unwind: '$diagnoses' },
    {
      $group: {
        _id: { code: '$diagnoses.code', tenBenh: '$diagnoses.nameVi' },
        soCaMac: { $sum: 1 }
      }
    },
    { $sort: { soCaMac: -1 } },
    { $limit: 5 }
  ])
);

// ----------------------------------------------------------------------------------------------
// DỌN DẸP DỮ LIỆU DEMO CỦA SCRIPT
// ----------------------------------------------------------------------------------------------
printHeader('CLEANUP', 'DỌN DẸP DỮ LIỆU DEMO SAU KHI CHẠY THỬ NGHIỆM');
db.patients.deleteOne({ _id: 'usr-pat-script-demo' });
db.appointments.deleteOne({ _id: 'APP-SCRIPT-DEMO' });
db.queue_tickets.deleteOne({ _id: 'QT-SCRIPT-DEMO' });
db.medical_records.deleteOne({ _id: 'REC-SCRIPT-DEMO' });
db.bills.deleteOne({ _id: 'BILL-SCRIPT-DEMO' });
db.pharmacy_drugs.updateOne({ code: 'AML05' }, { $inc: { stockQuantity: 30 } }); // Hoàn lại tồn kho
print('[CLEANUP] Đã xóa toàn bộ bản ghi demo và hoàn trả tồn kho thuốc thành công!');
