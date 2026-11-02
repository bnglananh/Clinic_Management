import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, of, catchError, map, switchMap, tap, throwError } from 'rxjs';
import { Bill, PaymentMethod, PaymentStatus } from '../models/billing.model';
import { ApiResponse, unwrap } from './api';
import { AuthService, apiErrorMessage } from './auth.service';

/** Hóa đơn viện phí (MongoDB collection bills); mỗi lần thu tiền được ghi audit log ở Cassandra. */
@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private billsSignal = signal<Bill[]>([]);
  public readonly bills = this.billsSignal.asReadonly();

  public readonly pendingCount = computed(
    () => this.billsSignal().filter((b) => b.paymentStatus === 'UNPAID').length
  );
  public readonly paidTodayTotal = computed(() =>
    this.billsSignal()
      .filter((b) => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + b.totalAmount, 0)
  );

  constructor() {
    effect(() => {
      this.auth.currentUser();
      this.getBills().subscribe();
    });
  }

  getBills(statusFilter?: PaymentStatus): Observable<Bill[]> {
    const user = this.auth.currentUser();
    if (!user || !this.auth.isAuthenticated()) {
      this.billsSignal.set([]);
      return of([]);
    }
    // Bệnh nhân chỉ xem hóa đơn của chính mình
    const url = user.role === 'PATIENT' ? `/api/billing/patient/${user.id}` : '/api/billing';
    return unwrap(this.http.get<ApiResponse<Bill[]>>(url)).pipe(
      tap((list) => this.billsSignal.set(list)),
      map((list) => (statusFilter ? list.filter((b) => b.paymentStatus === statusFilter) : list)),
      catchError(() => of(this.billsSignal()))
    );
  }

  getBillById(id: string): Observable<Bill | undefined> {
    return unwrap(this.http.get<ApiResponse<Bill>>(`/api/billing/${id}`)).pipe(
      map((b) => b ?? undefined),
      catchError(() => of(this.billsSignal().find((b) => b.id === id)))
    );
  }

  /**
   * Thu tiền mặt, hoặc thanh toán VietQR.
   * Nhân viên: tạo mã QR rồi xác nhận đã nhận tiền. Bệnh nhân: chỉ tạo mã QR,
   * hóa đơn chuyển sang PENDING_CONFIRMATION chờ thu ngân đối soát.
   */
  processPayment(params: {
    billId: string;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    cashChange?: number;
    cashierName?: string;
  }): Observable<Bill> {
    const cashierName = params.cashierName || this.auth.currentUser()?.fullName;
    const isPatient = this.auth.currentRole() === 'PATIENT';

    let request: Observable<Bill>;
    if (params.paymentMethod === 'CASH') {
      request = unwrap(
        this.http.post<ApiResponse<Bill>>(`/api/billing/${params.billId}/pay-cash`, {
          paymentMethod: 'CASH',
          cashReceived: params.cashReceived,
          cashierName,
        })
      );
    } else {
      const generate = this.http.post<ApiResponse<unknown>>(`/api/billing/${params.billId}/vietqr`, {});
      request = isPatient
        ? generate.pipe(switchMap(() => unwrap(this.http.get<ApiResponse<Bill>>(`/api/billing/${params.billId}`))))
        : generate.pipe(
            switchMap(() =>
              unwrap(
                this.http.post<ApiResponse<Bill>>(`/api/billing/${params.billId}/confirm-vietqr`, {
                  vietQrReference: `VCB-${Date.now().toString().slice(-8)}`,
                  cashierName,
                })
              )
            )
          );
    }

    const result = new ReplaySubject<Bill>(1);
    request
      .pipe(
        tap((bill) => this.billsSignal.update((list) => list.map((b) => (b.id === bill.id ? bill : b)))),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Thanh toán thất bại.'))))
      )
      .subscribe(result);
    return result.asObservable();
  }

  generateVietQrUrl(bill: Bill): string {
    // VietQR quick format using Vietcombank mock clinic account
    const bankCode = 'VCB';
    const accountNo = '1040394574';
    const amount = bill.totalAmount;
    const desc = encodeURIComponent(`${bill.billCode} ${bill.patientCode}`);
    return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${desc}&accountName=PHONG%20KHAM%20SMART%20CLINIC`;
  }
}
