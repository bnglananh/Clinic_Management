export interface Patient {
  id: string;
  patientCode: string;          // Ví dụ: BN-2026-0891
  cccd: string;                 // Căn cước công dân (12 số)
  fullName: string;
  dateOfBirth: string;          // YYYY-MM-DD
  gender: 'NAM' | 'NU' | 'KHAC';
  phone: string;
  email?: string;
  address: string;
  allergyHistory?: string;      // Tiền sử dị ứng (Penicillin, Aspirin, v.v.)
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  insuranceNumber?: string;     // Số thẻ BHYT (nếu có)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
  totalVisits: number;
}
