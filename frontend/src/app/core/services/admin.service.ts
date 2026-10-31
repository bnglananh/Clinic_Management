import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import {
  StaffAccount,
  PharmacyDrugItem,
  MedicalServiceItem,
  DoctorSchedule,
  PatientAccount,
  AccountStatus,
  DrugStatus,
} from '../models/admin.model';
import { MOCK_PATIENT_ACCOUNTS } from '../mock-data/admin-mock-data';
import { ApiResponse, unwrap } from './api';
import { AuthService, apiErrorMessage } from './auth.service';

/** Backend dùng "active", giao diện dùng "isActive". */
type MedicalServiceDto = Omit<MedicalServiceItem, 'isActive'> & { active: boolean };

const toService = (dto: MedicalServiceDto): MedicalServiceItem => {
  const { active, ...rest } = dto;
  return { ...rest, isActive: active };
};

/**
 * Dữ liệu quản trị lấy từ backend (MongoDB): tài khoản nhân viên, kho thuốc, dịch vụ kỹ thuật, lịch trực.
 * Các hàm giữ kiểu đồng bộ như bản cũ: cập nhật giao diện ngay, gọi API ở nền rồi đồng bộ lại theo kết quả server
 * (lỗi thì hoàn tác bằng cách tải lại danh sách và hiện thông báo qua lastError).
 */
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private staffAccountsSignal = signal<StaffAccount[]>([]);
  private pharmacyDrugsSignal = signal<PharmacyDrugItem[]>([]);
  private medicalServicesSignal = signal<MedicalServiceItem[]>([]);
  private doctorSchedulesSignal = signal<DoctorSchedule[]>([]);
  // Backend chưa có API quản lý tài khoản bệnh nhân riêng → giữ dữ liệu mẫu trên giao diện
  private patientAccountsSignal = signal<PatientAccount[]>(MOCK_PATIENT_ACCOUNTS);

  readonly staffAccounts = this.staffAccountsSignal.asReadonly();
  readonly pharmacyDrugs = this.pharmacyDrugsSignal.asReadonly();
  readonly medicalServices = this.medicalServicesSignal.asReadonly();
  readonly doctorSchedules = this.doctorSchedulesSignal.asReadonly();
  readonly patientAccounts = this.patientAccountsSignal.asReadonly();
  readonly lastError = signal<string>('');

  readonly criticalStockDrugs = computed(() =>
    this.pharmacyDrugsSignal().filter((d) => d.status === 'ACTIVE' && d.stockQuantity <= d.minAlertThreshold)
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

  constructor() {
    effect(() => {
      const role = this.auth.currentRole();
      this.loadServices(); // bảng giá dịch vụ & lịch trực là dữ liệu công khai
      this.loadSchedules();
      if (role === 'ADMIN' || role === 'DOCTOR') this.loadDrugs();
      if (role === 'ADMIN') this.loadStaff();
    });
  }

  // --- Tài khoản nhân viên & RBAC ---
  toggleAccountStatus(id: string): void {
    this.staffAccountsSignal.update((list) =>
      list.map((acc) =>
        acc.id === id ? { ...acc, status: (acc.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE') as AccountStatus } : acc
      )
    );
    this.send(this.http.patch<ApiResponse<StaffAccount>>(`/api/admin/users/${id}/toggle-status`, {}), () =>
      this.loadStaff()
    );
  }

  createStaffAccount(accountData: Omit<StaffAccount, 'id' | 'createdAt'>): StaffAccount {
    const temp: StaffAccount = { ...accountData, id: `tmp-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    this.staffAccountsSignal.update((list) => [temp, ...list]);
    // Mật khẩu ban đầu do backend đặt (BCrypt, mặc định 123456 nếu không nhập)
    this.send(this.http.post<ApiResponse<StaffAccount>>('/api/admin/users', accountData), () => this.loadStaff());
    return temp;
  }

  // --- Kho thuốc ---
  toggleDrugStatus(id: string): void {
    this.pharmacyDrugsSignal.update((list) =>
      list.map((d) =>
        d.id === id ? { ...d, status: (d.status === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE') as DrugStatus } : d
      )
    );
    this.send(this.http.patch(`/api/admin/pharmacy/drugs/${id}/toggle-status`, {}), () => this.loadDrugs());
  }

  restockDrug(id: string, additionalQty: number, batchNumber?: string, expiryDate?: string): void {
    this.pharmacyDrugsSignal.update((list) =>
      list.map((d) =>
        d.id === id
          ? {
              ...d,
              stockQuantity: d.stockQuantity + additionalQty,
              batchNumber: batchNumber || d.batchNumber,
              expiryDate: expiryDate || d.expiryDate,
            }
          : d
      )
    );
    this.send(
      this.http.post(`/api/admin/pharmacy/drugs/${id}/stock`, {
        type: 'IMPORT',
        quantity: additionalQty,
        reason: 'Nhập kho bổ sung',
        batchNumber,
        expiryDate,
        performedBy: this.auth.currentUser()?.username,
      }),
      () => this.loadDrugs()
    );
  }

  createDrug(drugData: Omit<PharmacyDrugItem, 'id'>): PharmacyDrugItem {
    const temp: PharmacyDrugItem = { ...drugData, id: `tmp-${Date.now()}` };
    this.pharmacyDrugsSignal.update((list) => [temp, ...list]);
    this.send(this.http.post('/api/admin/pharmacy/drugs', drugData), () => this.loadDrugs());
    return temp;
  }

  updateDrugPrice(id: string, importPrice: number, salePrice: number): void {
    this.pharmacyDrugsSignal.update((list) => list.map((d) => (d.id === id ? { ...d, importPrice, salePrice } : d)));
    this.send(this.http.patch(`/api/admin/pharmacy/drugs/${id}/price`, { importPrice, salePrice }), () =>
      this.loadDrugs()
    );
  }

  // --- Dịch vụ kỹ thuật & bảng giá ---
  toggleServiceStatus(id: string): void {
    this.medicalServicesSignal.update((list) => list.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)));
    this.send(this.http.patch(`/api/admin/services/${id}/toggle-status`, {}), () => this.loadServices());
  }

  updateServicePrice(id: string, newPrice: number): void {
    this.medicalServicesSignal.update((list) => list.map((s) => (s.id === id ? { ...s, price: newPrice } : s)));
    this.send(this.http.patch(`/api/admin/services/${id}/price`, { price: newPrice }), () => this.loadServices());
  }

  createMedicalService(serviceData: Omit<MedicalServiceItem, 'id'>): MedicalServiceItem {
    const temp: MedicalServiceItem = { ...serviceData, id: `tmp-${Date.now()}` };
    this.medicalServicesSignal.update((list) => [temp, ...list]);
    const { isActive, ...rest } = serviceData;
    this.send(this.http.post('/api/admin/services', { ...rest, active: isActive }), () => this.loadServices());
    return temp;
  }

  // --- Lịch trực bác sĩ ---
  assignDoctorShift(scheduleData: Omit<DoctorSchedule, 'id'>): DoctorSchedule {
    const temp: DoctorSchedule = { ...scheduleData, id: `tmp-${Date.now()}` };
    this.doctorSchedulesSignal.update((list) => [temp, ...list]);
    this.send(this.http.post('/api/admin/schedules', scheduleData), () => this.loadSchedules());
    return temp;
  }

  toggleScheduleStatus(id: string): void {
    this.doctorSchedulesSignal.update((list) =>
      list.map((s) => (s.id === id ? { ...s, status: s.status === 'CONFIRMED' ? 'LEAVE' : 'CONFIRMED' } : s))
    );
    this.send(this.http.patch(`/api/admin/schedules/${id}/toggle-status`, {}), () => this.loadSchedules());
  }

  deleteSchedule(id: string): void {
    this.doctorSchedulesSignal.update((list) => list.filter((s) => s.id !== id));
    this.send(this.http.delete(`/api/admin/schedules/${id}`), () => this.loadSchedules());
  }

  /** Sao chép lịch trực sang tuần khác: tạo từng ca mới qua API (backend kiểm tra trùng ca). */
  copyWeekSchedule(sourceDates: string[], targetDates: string[]): number {
    const current = this.doctorSchedulesSignal();
    let count = 0;
    sourceDates.forEach((srcDate, idx) => {
      const tgtDate = targetDates[idx];
      if (!tgtDate) return;
      current
        .filter((s) => s.date === srcDate && s.status === 'CONFIRMED')
        .filter((s) => !current.some((c) => c.doctorId === s.doctorId && c.date === tgtDate && c.shift === s.shift))
        .forEach((s) => {
          count++;
          const { id, ...rest } = s;
          this.assignDoctorShift({ ...rest, date: tgtDate, bookedPatients: 0, status: 'CONFIRMED' });
        });
    });
    return count;
  }

  // --- Tài khoản bệnh nhân (chưa có API riêng, thao tác trên giao diện) ---
  togglePatientAccountStatus(id: string): void {
    this.patientAccountsSignal.update((list) =>
      list.map((p) =>
        p.id === id ? { ...p, status: (p.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE') as AccountStatus } : p
      )
    );
  }

  resetPatientPassword(id: string): string {
    return 'SmartClinic@' + Math.floor(1000 + Math.random() * 9000);
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

  // ---------------------------------------------------------------------

  private loadStaff(): void {
    this.load(this.http.get<ApiResponse<StaffAccount[]>>('/api/admin/users'), (l) => this.staffAccountsSignal.set(l));
  }

  private loadDrugs(): void {
    this.load(this.http.get<ApiResponse<PharmacyDrugItem[]>>('/api/admin/pharmacy/drugs'), (l) =>
      this.pharmacyDrugsSignal.set(l)
    );
  }

  private loadServices(): void {
    this.load(this.http.get<ApiResponse<MedicalServiceDto[]>>('/api/admin/services'), (l) =>
      this.medicalServicesSignal.set(l.map(toService))
    );
  }

  private loadSchedules(): void {
    this.load(this.http.get<ApiResponse<DoctorSchedule[]>>('/api/admin/schedules'), (l) =>
      this.doctorSchedulesSignal.set(l)
    );
  }

  private load<T>(request: Observable<ApiResponse<T>>, apply: (data: T) => void): void {
    unwrap(request)
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        if (data) apply(data);
      });
  }

  /** Gửi thay đổi lên server; xong (thành công hay lỗi) thì tải lại danh sách để đồng bộ. */
  private send(request: Observable<unknown>, reload: () => void): void {
    request.subscribe({
      next: () => {
        this.lastError.set('');
        reload();
      },
      error: (err) => {
        this.lastError.set(apiErrorMessage(err));
        reload();
      },
    });
  }
}
