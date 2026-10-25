/**
 * SMART CLINIC EMR - MongoDB Initialization Script
 * Tạo cơ sở dữ liệu `clinic_db`, các collections và indexes chính
 */

const dbName = 'clinic_db';
db = db.getSiblingDB(dbName);

print('--> Bắt đầu khởi tạo MongoDB cho hệ thống Smart Clinic EMR...');

// 1. Collection: users (Tài khoản người dùng & RBAC)
db.createCollection('users');
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// 2. Collection: patients (Hồ sơ bệnh nhân)
db.createCollection('patients');
db.patients.createIndex({ patientCode: 1 }, { unique: true });
db.patients.createIndex({ identityNumber: 1 }, { unique: true, sparse: true });
db.patients.createIndex({ phoneNumber: 1 });
db.patients.createIndex({ fullName: 'text' });

// 3. Collection: appointments (Lịch hẹn khám)
db.createCollection('appointments');
db.appointments.createIndex({ appointmentCode: 1 }, { unique: true });
db.appointments.createIndex({ patientId: 1, appointmentDate: 1 });
db.appointments.createIndex({ doctorId: 1, appointmentDate: 1 });
db.appointments.createIndex({ status: 1 });

// 4. Collection: medical_records (Hồ sơ bệnh án điện tử EMR)
db.createCollection('medical_records');
db.medical_records.createIndex({ visitCode: 1 }, { unique: true });
db.medical_records.createIndex({ patientId: 1, examDate: -1 });
db.medical_records.createIndex({ doctorId: 1 });
db.medical_records.createIndex({ isLocked: 1 });

// 5. Collection: bills (Hóa đơn viện phí)
db.createCollection('bills');
db.bills.createIndex({ billCode: 1 }, { unique: true });
db.bills.createIndex({ patientId: 1 });
db.bills.createIndex({ status: 1 });
db.bills.createIndex({ createdAt: -1 });

// 6. Collection: medicines (Danh mục kho dược)
db.createCollection('medicines');
db.medicines.createIndex({ drugCode: 1 }, { unique: true });
db.medicines.createIndex({ drugName: 1 });
db.medicines.createIndex({ status: 1 });
db.medicines.createIndex({ stockQuantity: 1 });

// 7. Collection: services (Danh mục dịch vụ kỹ thuật)
db.createCollection('services');
db.services.createIndex({ serviceCode: 1 }, { unique: true });
db.services.createIndex({ isActive: 1 });

// Dữ liệu mẫu ban đầu cho danh mục thuốc
db.medicines.insertMany([
  {
    drugCode: 'THUOC-PARA-500',
    drugName: 'Paracetamol 500mg',
    activeIngredient: 'Paracetamol',
    unit: 'Viên',
    importPrice: 500,
    salePrice: 1500,
    stockQuantity: 250,
    status: 'ACTIVE',
    createdAt: new Date()
  },
  {
    drugCode: 'THUOC-AMOX-500',
    drugName: 'Amoxicillin 500mg',
    activeIngredient: 'Amoxicillin',
    unit: 'Viên',
    importPrice: 1200,
    salePrice: 3000,
    stockQuantity: 180,
    status: 'ACTIVE',
    createdAt: new Date()
  },
  {
    drugCode: 'THUOC-IBUP-400',
    drugName: 'Ibuprofen 400mg',
    activeIngredient: 'Ibuprofen',
    unit: 'Viên',
    importPrice: 800,
    salePrice: 2000,
    stockQuantity: 8, // Tồn kho nguy cấp <= 10
    status: 'ACTIVE',
    createdAt: new Date()
  }
]);

print('--> Khởi tạo MongoDB thành công!');
