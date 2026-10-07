export type UserRole = 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  phone: string;
  avatarUrl?: string;
  department?: string; // Ví dụ: Khoa Khám bệnh, Khoa Tim mạch
  title?: string;      // Ví dụ: Bác sĩ CKII, Thạc sĩ Y khoa, Cử nhân Điều dưỡng
}

export interface AuthResponse {
  token: string;
  user: User;
}
