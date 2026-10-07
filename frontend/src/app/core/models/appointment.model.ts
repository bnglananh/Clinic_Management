export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';

export interface Appointment {
  id: string;
  appointmentCode: string;      // Ví dụ: LH-2026-0158
  patientId: string;
  patientCode: string;
  patientName: string;
  phone: string;
  department: string;           // Khoa Khám bệnh, Khoa Tim Mạch, v.v.
  doctorId: string;
  doctorName: string;
  appointmentDate: string;      // YYYY-MM-DD
  timeSlot: string;             // Ví dụ: 08:30 - 09:00
  reasonForVisit: string;
  status: AppointmentStatus;
  createdAt: string;
  notes?: string;
}
