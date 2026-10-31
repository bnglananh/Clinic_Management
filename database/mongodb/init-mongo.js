/**
 * SMART CLINIC EMR – MongoDB Initialization Script
 * Tạo database `clinic_db`, 12 collection (kèm JSON Schema validator) và index.
 *
 * Chạy tay:   mongosh mongodb://localhost:27017 database/mongodb/init-mongo.js
 * Docker:     tự chạy lần đầu qua /docker-entrypoint-initdb.d (xem docker-compose.yml)
 *
 * Tên trường khớp với model Java trong backend/src/main/java/vn/clinic/model.
 * Validator dùng validationAction 'warn' để ghi log thay vì từ chối ghi.
 */

db = db.getSiblingDB('clinic_db');
print('--> Khởi tạo MongoDB cho Smart Clinic EMR...');

function createWithSchema(name, required, properties) {
  if (db.getCollectionNames().includes(name)) {
    print('    - ' + name + ' đã tồn tại, bỏ qua');
    return;
  }
  db.createCollection(name, {
    validator: { $jsonSchema: { bsonType: 'object', required: required, properties: properties } },
    validationLevel: 'moderate',
    validationAction: 'warn',
  });
  print('    + ' + name);
}

const str = { bsonType: 'string' };

// 1. patients – Hồ sơ bệnh nhân (cũng là tài khoản đăng nhập vai trò PATIENT)
createWithSchema('patients', ['patientCode', 'fullName'], {
  patientCode: str, fullName: str, phone: str, email: str, identityCardNumber: str,
  gender: { enum: ['NAM', 'NỮ', 'NU', 'KHÁC', 'KHAC', null] },
});
db.patients.createIndex({ patientCode: 1 }, { unique: true });
db.patients.createIndex({ username: 1 }, { unique: true, sparse: true });
db.patients.createIndex({ identityCardNumber: 1 }, { unique: true, sparse: true });
db.patients.createIndex({ phone: 1 });
db.patients.createIndex({ email: 1 });
db.patients.createIndex({ fullName: 'text', patientCode: 'text' });

// 2. staff_accounts – Tài khoản nhân viên & quyền RBAC
createWithSchema('staff_accounts', ['username', 'fullName', 'role', 'status'], {
  username: str, fullName: str,
  role: { enum: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
  status: { enum: ['ACTIVE', 'LOCKED'] },
  permissions: { bsonType: 'array', items: str },
});
db.staff_accounts.createIndex({ username: 1 }, { unique: true });
db.staff_accounts.createIndex({ email: 1 }, { unique: true, sparse: true });
db.staff_accounts.createIndex({ role: 1, status: 1 });

// 3. appointments – Lịch hẹn khám
createWithSchema('appointments', ['patientId', 'doctorId', 'appointmentDate', 'timeSlot', 'status'], {
  appointmentDate: { bsonType: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  status: { enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'] },
});
db.appointments.createIndex({ appointmentCode: 1 }, { unique: true, sparse: true });
db.appointments.createIndex({ patientId: 1, appointmentDate: -1 });
db.appointments.createIndex({ doctorId: 1, appointmentDate: 1, timeSlot: 1 });
db.appointments.createIndex({ status: 1 });

// 4. queue_tickets – Phiếu số thứ tự & hàng đợi khám (sortOrder = vị trí gọi số)
createWithSchema('queue_tickets', ['ticketNumber', 'status', 'priority'], {
  status: { enum: ['WAITING', 'IN_PROGRESS', 'WAITING_RESULTS', 'RESULTS_READY', 'COMPLETED', 'SKIPPED'] },
  priority: { enum: ['NORMAL', 'PRIORITY', 'EMERGENCY'] },
});
db.queue_tickets.createIndex({ ticketNumber: 1 });
db.queue_tickets.createIndex({ status: 1, roomName: 1, sortOrder: 1 });
db.queue_tickets.createIndex({ patientId: 1 });

// 5. medical_records – Bệnh án điện tử EMR (document lồng: vitals, diagnoses, services, prescriptions)
createWithSchema('medical_records', ['patientId', 'visitDate'], {
  diagnoses: { bsonType: 'array' }, prescriptions: { bsonType: 'array' }, isLocked: { bsonType: 'bool' },
});
db.medical_records.createIndex({ visitCode: 1 }, { unique: true, sparse: true });
db.medical_records.createIndex({ patientId: 1, visitDate: -1 });
db.medical_records.createIndex({ 'diagnoses.code': 1 });
db.medical_records.createIndex({ department: 1, visitDate: -1 });

// 6. bills – Hóa đơn viện phí
createWithSchema('bills', ['billCode', 'patientId', 'paymentStatus'], {
  paymentStatus: { enum: ['UNPAID', 'PENDING_CONFIRMATION', 'PAID', 'CANCELLED'] },
  items: { bsonType: 'array' },
});
db.bills.createIndex({ billCode: 1 }, { unique: true });
db.bills.createIndex({ patientId: 1, createdAt: -1 });
db.bills.createIndex({ paymentStatus: 1, createdAt: -1 });

// 7. pharmacy_drugs – Danh mục thuốc & tồn kho
createWithSchema('pharmacy_drugs', ['code', 'name', 'stockQuantity', 'status'], {
  stockQuantity: { bsonType: ['int', 'long'], minimum: 0 },
  status: { enum: ['ACTIVE', 'DISCONTINUED'] },
});
db.pharmacy_drugs.createIndex({ code: 1 }, { unique: true });
db.pharmacy_drugs.createIndex({ status: 1, stockQuantity: 1 });
db.pharmacy_drugs.createIndex({ name: 'text', activeIngredient: 'text' });

// 8. stock_transactions – Lịch sử nhập/xuất kho
createWithSchema('stock_transactions', ['drugId', 'type', 'quantityChange'], {});
db.stock_transactions.createIndex({ drugId: 1, timestamp: -1 });

// 9. medical_services – Danh mục dịch vụ kỹ thuật & bảng giá
createWithSchema('medical_services', ['serviceCode', 'serviceName', 'category'], { active: { bsonType: 'bool' } });
db.medical_services.createIndex({ serviceCode: 1 }, { unique: true });
db.medical_services.createIndex({ category: 1, active: 1 });

// 10. doctor_schedules – Lịch trực bác sĩ theo ca
createWithSchema('doctor_schedules', ['doctorId', 'date', 'shift'], {
  shift: { enum: ['MORNING', 'AFTERNOON', 'EVENING'] },
});
db.doctor_schedules.createIndex({ doctorId: 1, date: 1, shift: 1 }, { unique: true });
db.doctor_schedules.createIndex({ roomName: 1, date: 1, shift: 1 });

// 11. notifications – Thông báo trong ứng dụng
createWithSchema('notifications', ['userId', 'title', 'type'], {
  type: { enum: ['APPOINTMENT', 'QUEUE', 'MEDICAL_RECORD', 'BILLING', 'SYSTEM'] },
});
db.notifications.createIndex({ userId: 1, isRead: 1 });

// 12. counters – Bộ đếm sinh mã tuần tự (findAndModify $inc)
if (!db.getCollectionNames().includes('counters')) db.createCollection('counters');

print('--> Hoàn tất khởi tạo MongoDB: ' + db.getCollectionNames().length + ' collection.');
