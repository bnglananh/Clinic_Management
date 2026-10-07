export type QueueStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';

export type PriorityLevel = 'NORMAL' | 'PRIORITY' | 'EMERGENCY';

export interface QueueTicket {
  id: string;
  ticketNumber: string;       // Ví dụ: A-012, B-005
  patientId: string;
  patientCode: string;       // Ví dụ: BN-2026-0891
  patientName: string;
  gender: 'NAM' | 'NU' | 'KHAC';
  yearOfBirth: number;
  phone: string;
  status: QueueStatus;
  priority: PriorityLevel;
  roomName: string;          // Ví dụ: Phòng khám Nội 101
  doctorId?: string;
  doctorName?: string;
  estimatedTime?: string;    // Ví dụ: 09:30
  checkinTime: string;       // ISO Date String
  notes?: string;
}
