export type BillItemType = 'CONSULTATION' | 'SERVICE' | 'MEDICINE';

export interface BillItem {
  id: string;
  type: BillItemType;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type PaymentMethod = 'CASH' | 'VIETQR';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'CANCELLED';

export interface Bill {
  id: string;
  billCode: string;             // Ví dụ: HD-2026-0042
  visitId: string;
  ticketNumber: string;         // Ví dụ: A-012
  patientId: string;
  patientCode: string;
  patientName: string;
  phone: string;
  roomName: string;
  doctorName: string;
  items: BillItem[];
  consultationFee: number;
  serviceFee: number;
  medicineFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashReceived?: number;
  cashChange?: number;
  vietQrReference?: string;
  paidAt?: string;
  cashierName?: string;
  notes?: string;
  createdAt: string;
}
