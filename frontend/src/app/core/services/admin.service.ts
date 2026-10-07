import { Injectable, signal, computed } from '@angular/core';
import {
  StaffAccount,
  PharmacyDrugItem,
  MedicalServiceItem,
  DoctorSchedule,
  AccountStatus,
  DrugStatus,
} from '../models/admin.model';
import {
  MOCK_STAFF_ACCOUNTS,
  MOCK_PHARMACY_DRUGS,
  MOCK_MEDICAL_SERVICES,
  MOCK_DOCTOR_SCHEDULES,
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

  // Read-only Signal accessors
  readonly staffAccounts = this.staffAccountsSignal.asReadonly();
  readonly pharmacyDrugs = this.pharmacyDrugsSignal.asReadonly();
  readonly medicalServices = this.medicalServicesSignal.asReadonly();
  readonly doctorSchedules = this.doctorSchedulesSignal.asReadonly();

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

  // --- UC019: User Accounts & RBAC Actions ---
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

  // --- UC020 & UC021: Pharmacy Drug Catalogue & Stock Actions ---
  // BR-21: Soft deletion / state change (no physical delete)
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

  // --- UC022: Medical Services & Pricing Actions ---
  // BR-21: Soft deletion / deactivate (no physical delete)
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

  // --- UC023: Doctor Shift Scheduling Actions ---
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
}
