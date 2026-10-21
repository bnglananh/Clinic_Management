import { Injectable, signal, computed } from '@angular/core';
import {
  StaffAccount,
  PharmacyDrugItem,
  MedicalServiceItem,
  DoctorSchedule,
  PatientAccount,
  AccountStatus,
  DrugStatus,
} from '../models/admin.model';
import {
  MOCK_STAFF_ACCOUNTS,
  MOCK_PHARMACY_DRUGS,
  MOCK_MEDICAL_SERVICES,
  MOCK_DOCTOR_SCHEDULES,
  MOCK_PATIENT_ACCOUNTS,
} from '../mock-data/admin-mock-data';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  // Signals for state management
  private staffAccountsSignal = signal<StaffAccount[]>(MOCK_STAFF_ACCOUNTS);
  private pharmacyDrugsSignal = signal<PharmacyDrugItem[]>(MOCK_PHARMACY_DRUGS);
  private medicalServicesSignal = signal<MedicalServiceItem[]>(MOCK_MEDICAL_SERVICES);
  private doctorSchedulesSignal = signal<DoctorSchedule[]>(MOCK_DOCTOR_SCHEDULES);
  private patientAccountsSignal = signal<PatientAccount[]>(MOCK_PATIENT_ACCOUNTS);

  // Read-only Signal accessors
  readonly staffAccounts = this.staffAccountsSignal.asReadonly();
  readonly pharmacyDrugs = this.pharmacyDrugsSignal.asReadonly();
  readonly medicalServices = this.medicalServicesSignal.asReadonly();
  readonly doctorSchedules = this.doctorSchedulesSignal.asReadonly();
  readonly patientAccounts = this.patientAccountsSignal.asReadonly();

  // Computed state
  readonly criticalStockDrugs = computed(() =>
    this.pharmacyDrugsSignal().filter(
      (d) => d.status === 'ACTIVE' && d.stockQuantity <= d.minAlertThreshold
    )
  );

  readonly lowStockDrugs = computed(() =>
    this.pharmacyDrugsSignal().filter(
      (d) => d.status === 'ACTIVE' && d.stockQuantity > d.minAlertThreshold && d.stockQuantity <= 30
    )
  );

  readonly totalStaffCount = computed(() => this.staffAccountsSignal().length);

  readonly activeDoctors = computed(() =>
    this.staffAccountsSignal().filter((s) => s.role === 'DOCTOR' && s.status === 'ACTIVE')
  );

  // --- User Accounts & RBAC Actions ---
  toggleAccountStatus(id: string): void {
    this.staffAccountsSignal.update((list) =>
      list.map((acc) => {
        if (acc.id === id) {
          const newStatus: AccountStatus = acc.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
          return { ...acc, status: newStatus };
        }
        return acc;
      })
    );
  }

  createStaffAccount(accountData: Omit<StaffAccount, 'id' | 'createdAt'>): StaffAccount {
    const newId = `STAFF-${String(this.staffAccountsSignal().length + 1).padStart(2, '0')}`;
    const newAccount: StaffAccount = {
      ...accountData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.staffAccountsSignal.update((list) => [newAccount, ...list]);
    return newAccount;
  }

  // --- Pharmacy Drug Catalogue & Stock Actions ---
  // Soft deletion / state change (no physical delete)
  toggleDrugStatus(id: string): void {
    this.pharmacyDrugsSignal.update((list) =>
      list.map((drug) => {
        if (drug.id === id) {
          const newStatus: DrugStatus = drug.status === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE';
          return { ...drug, status: newStatus };
        }
        return drug;
      })
    );
  }

  restockDrug(id: string, additionalQty: number, batchNumber?: string, expiryDate?: string): void {
    this.pharmacyDrugsSignal.update((list) =>
      list.map((drug) => {
        if (drug.id === id) {
          return {
            ...drug,
            stockQuantity: drug.stockQuantity + additionalQty,
            batchNumber: batchNumber || drug.batchNumber,
            expiryDate: expiryDate || drug.expiryDate,
          };
        }
        return drug;
      })
    );
  }

  createDrug(drugData: Omit<PharmacyDrugItem, 'id'>): PharmacyDrugItem {
    const newId = `DRUG-${String(this.pharmacyDrugsSignal().length + 1).padStart(2, '0')}`;
    const newDrug: PharmacyDrugItem = {
      ...drugData,
      id: newId,
    };
    this.pharmacyDrugsSignal.update((list) => [newDrug, ...list]);
    return newDrug;
  }

  updateDrugPrice(id: string, importPrice: number, salePrice: number): void {
    this.pharmacyDrugsSignal.update((list) =>
      list.map((d) => (d.id === id ? { ...d, importPrice, salePrice } : d))
    );
  }

  // --- Medical Services & Pricing Actions ---
  // Soft deletion / deactivate (no physical delete)
  toggleServiceStatus(id: string): void {
    this.medicalServicesSignal.update((list) =>
      list.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  }

  updateServicePrice(id: string, newPrice: number): void {
    this.medicalServicesSignal.update((list) =>
      list.map((s) => (s.id === id ? { ...s, price: newPrice } : s))
    );
  }

  createMedicalService(serviceData: Omit<MedicalServiceItem, 'id'>): MedicalServiceItem {
    const newId = `MS-${String(this.medicalServicesSignal().length + 1).padStart(2, '0')}`;
    const newService: MedicalServiceItem = {
      ...serviceData,
      id: newId,
    };
    this.medicalServicesSignal.update((list) => [newService, ...list]);
    return newService;
  }

  // --- Doctor Shift Scheduling Actions ---
  assignDoctorShift(scheduleData: Omit<DoctorSchedule, 'id'>): DoctorSchedule {
    const newId = `SCH-${String(this.doctorSchedulesSignal().length + 1).padStart(2, '0')}`;
    const newSchedule: DoctorSchedule = {
      ...scheduleData,
      id: newId,
    };
    this.doctorSchedulesSignal.update((list) => [newSchedule, ...list]);
    return newSchedule;
  }

  toggleScheduleStatus(id: string): void {
    this.doctorSchedulesSignal.update((list) =>
      list.map((sch) => {
        if (sch.id === id) {
          const newStatus = sch.status === 'CONFIRMED' ? 'LEAVE' : 'CONFIRMED';
          return { ...sch, status: newStatus };
        }
        return sch;
      })
    );
  }

  deleteSchedule(id: string): void {
    this.doctorSchedulesSignal.update((list) => list.filter((s) => s.id !== id));
  }

  copyWeekSchedule(sourceDates: string[], targetDates: string[]): number {
    const current = this.doctorSchedulesSignal();
    const newItems: DoctorSchedule[] = [];
    let count = 0;

    sourceDates.forEach((srcDate, idx) => {
      const tgtDate = targetDates[idx];
      if (!tgtDate) return;
      const srcShifts = current.filter((s) => s.date === srcDate && s.status === 'CONFIRMED');
      srcShifts.forEach((s) => {
        const exists = current.some(
          (c) => c.doctorId === s.doctorId && c.date === tgtDate && c.shift === s.shift
        );
        if (!exists) {
          count++;
          newItems.push({
            ...s,
            id: `SCH-${String(current.length + newItems.length + 1).padStart(2, '0')}`,
            date: tgtDate,
            bookedPatients: 0,
            status: 'CONFIRMED',
          });
        }
      });
    });

    if (newItems.length > 0) {
      this.doctorSchedulesSignal.update((list) => [...newItems, ...list]);
    }
    return count;
  }

  // --- Patient Account Management Actions ---
  togglePatientAccountStatus(id: string): void {
    this.patientAccountsSignal.update((list) =>
      list.map((p) => {
        if (p.id === id) {
          const newStatus: AccountStatus = p.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  }

  resetPatientPassword(id: string): string {
    const tempPass = 'SmartClinic@' + Math.floor(1000 + Math.random() * 9000);
    // In realistic system, would call API to hash and email to patient
    return tempPass;
  }

  createPatientAccount(data: {
    fullName: string;
    phone: string;
    email: string;
    cccd: string;
    gender: 'NAM' | 'NU' | 'KHAC';
    dateOfBirth: string;
    address?: string;
    membershipTier?: 'STANDARD' | 'SILVER' | 'GOLD' | 'VIP';
  }): PatientAccount {
    const nextNum = this.patientAccountsSignal().length + 1;
    const newAccount: PatientAccount = {
      id: `PA-${String(nextNum).padStart(2, '0')}`,
      patientCode: `BN-2026-${String(890 + nextNum).padStart(4, '0')}`,
      username: data.phone.replace(/\s+/g, ''),
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      cccd: data.cccd.trim(),
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      address: data.address || 'TP. Hồ Chí Minh',
      status: 'ACTIVE',
      membershipTier: data.membershipTier || 'STANDARD',
      totalVisits: 0,
      registeredAt: new Date().toISOString().split('T')[0],
      lastLoginAt: 'Chưa đăng nhập',
    };

    this.patientAccountsSignal.update((list) => [newAccount, ...list]);
    return newAccount;
  }
}

