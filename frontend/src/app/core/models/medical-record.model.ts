export interface VitalSigns {
  temperature: number; // °C (e.g. 37.0)
  bloodPressureSystolic: number; // mmHg (e.g. 120)
  bloodPressureDiastolic: number; // mmHg (e.g. 80)
  heartRate: number; // bpm (e.g. 75)
  respiratoryRate: number; // breaths/min (e.g. 18)
  weight: number; // kg (e.g. 68)
  height: number; // cm (e.g. 172)
  bmi: number; // kg/m2 (auto calculated)
  spo2?: number; // % (e.g. 98)
  measuredAt: string; // ISO string
}

export type VitalState = 'normal' | 'warning' | 'danger';

export interface VitalThresholdConfig {
  minNormal: number;
  maxNormal: number;
  minWarning: number;
  maxWarning: number;
}

export interface Icd10Item {
  code: string;
  nameVi: string;
  nameEn?: string;
  chapter?: string;
  isPrimary?: boolean;
}

export type ClinicalServiceCategory = 'XÉT NGHIỆM' | 'CHẨN ĐOÁN HÌNH ẢNH' | 'THỦ THUẬT' | 'CẬN LÂM SÀNG';
export type ClinicalServiceStatus = 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ClinicalServiceOrder {
  id: string;
  serviceCode: string;
  serviceName: string;
  category: ClinicalServiceCategory;
  price: number;
  status: ClinicalServiceStatus;
  resultSummary?: string;
  completedAt?: string;
  performedBy?: string;
}

export interface MedicineItem {
  id: string;
  code: string;
  name: string;
  activeIngredient: string;
  strength: string;
  unit: string;
  defaultDosage?: string;
  defaultUsage?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  activeIngredient: string;
  strength: string;
  unit: string;
  dosage: string; // e.g. "1 viên x 2 lần/ngày (sáng, tối sau ăn)"
  durationDays: number;
  totalQuantity: number;
  instructions: string;
}

export type DrugInteractionSeverity = 'CRITICAL' | 'MAJOR' | 'MODERATE';

export interface DrugInteractionWarning {
  id: string;
  drugA: string;
  drugB: string;
  severity: DrugInteractionSeverity;
  title: string;
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
}

export interface MedicalRecordAmendment {
  id: string;
  version: number;
  createdAt: string;
  doctorName: string;
  reason: string;
  addendumContent: string;
}

export interface MedicalRecord {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientGender: 'MALE' | 'FEMALE';
  patientCode: string;
  ticketNumber: string;
  doctorId: string;
  doctorName: string;
  department: string;
  roomName: string;
  visitDate: string;
  chiefComplaint: string; // Lý do khám
  clinicalSymptoms: string; // Bệnh sử & Triệu chứng lâm sàng
  allergies?: string[]; // Danh sách dị ứng
  vitals: VitalSigns;
  diagnoses: Icd10Item[];
  preliminaryDiagnosis?: string; // Chẩn đoán sơ bộ
  services: ClinicalServiceOrder[];
  prescriptions: PrescriptionItem[];
  doctorAdvice: string;
  followUpDays?: number;
  isLocked: boolean; // BR-23: true when COMPLETED
  status: 'IN_PROGRESS' | 'COMPLETED';
  version: number;
  amendments: MedicalRecordAmendment[];
  completedAt?: string;
}

export interface VitalHistoryPoint {
  date: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  bmi: number;
  weight: number;
}
