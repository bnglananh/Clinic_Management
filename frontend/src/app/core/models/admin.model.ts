import { UserRole } from './user.model';

export type AccountStatus = 'ACTIVE' | 'LOCKED';

export interface StaffAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  title: string;
  status: AccountStatus;
  lastLoginAt?: string;
  createdAt: string;
}

export type DrugStatus = 'ACTIVE' | 'DISCONTINUED';

export interface PharmacyDrugItem {
  id: string;
  code: string;
  name: string;
  activeIngredient: string;
  strength: string;
  unit: string; // Hộp, Vỉ, Viên, Chai
  importPrice: number;
  salePrice: number;
  stockQuantity: number;
  minAlertThreshold: number; // default 10 (BR-22)
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  manufacturer: string;
  status: DrugStatus; // BR-21: No physical delete
}

export interface MedicalServiceItem {
  id: string;
  serviceCode: string;
  serviceName: string;
  category: 'KHÁM BỆNH' | 'XÉT NGHIỆM' | 'CHẨN ĐOÁN HÌNH ẢNH' | 'CẬN LÂM SÀNG' | 'THỦ THUẬT';
  price: number;
  roomName: string;
  unit: string;
  estimatedDurationMinutes: number;
  isActive: boolean;
}

export type WorkShift = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  shift: WorkShift;
  status: 'CONFIRMED' | 'LEAVE';
  maxPatients: number;
  bookedPatients: number;
}
