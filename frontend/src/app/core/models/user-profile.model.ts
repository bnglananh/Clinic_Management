import { UserRole } from './user.model';

export interface UserProfile {
  id: string;
  patientCode: string;
  username: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'NAM' | 'NU' | 'KHAC';
  phone: string;
  email: string;
  address: string;
  identityCardNumber: string;
  healthInsuranceNumber: string;
  bloodType: string;
  allergies: string;
  medicalNotes: string;
  avatarUrl: string;
  role: UserRole;
  membershipTier: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  totalVisits: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  dateOfBirth: string;
  gender: 'NAM' | 'NU' | 'KHAC';
  phone: string;
  email: string;
  address: string;
  identityCardNumber: string;
  healthInsuranceNumber: string;
  bloodType: string;
  allergies: string;
  medicalNotes: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
