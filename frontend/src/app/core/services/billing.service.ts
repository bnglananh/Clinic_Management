import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Bill, PaymentMethod, PaymentStatus } from '../models/billing.model';
import { MOCK_BILLS } from '../mock-data/reception-mock-data';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private billsSignal = signal<Bill[]>(MOCK_BILLS);
  public readonly bills = this.billsSignal.asReadonly();

  public readonly pendingCount = computed(
    () => this.billsSignal().filter((b) => b.paymentStatus === 'UNPAID').length
  );
  public readonly paidTodayTotal = computed(() =>
    this.billsSignal()
      .filter((b) => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + b.totalAmount, 0)
  );

  getBills(statusFilter?: PaymentStatus): Observable<Bill[]> {
    let list = this.billsSignal();
    if (statusFilter) {
      list = list.filter((b) => b.paymentStatus === statusFilter);
    }
    return of(list).pipe(delay(200));
  }

  getBillById(id: string): Observable<Bill | undefined> {
    const found = this.billsSignal().find((b) => b.id === id);
    return of(found).pipe(delay(150));
  }

  processPayment(params: {
    billId: string;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    cashChange?: number;
    cashierName?: string;
  }): Observable<Bill> {
    let updatedBill: Bill | null = null;

    this.billsSignal.update((current) =>
      current.map((bill) => {
        if (bill.id === params.billId) {
          updatedBill = {
            ...bill,
            paymentStatus: 'PAID',
            paymentMethod: params.paymentMethod,
            cashReceived: params.cashReceived,
            cashChange: params.cashChange,
            paidAt: new Date().toISOString(),
            cashierName: params.cashierName || 'Nguyễn Thị Mai',
            vietQrReference:
              params.paymentMethod === 'VIETQR'
                ? `VCB-${Date.now().toString().slice(-8)}`
                : undefined,
          };
          return updatedBill;
        }
        return bill;
      })
    );

    return of(updatedBill!).pipe(delay(350));
  }

  generateVietQrUrl(bill: Bill): string {
    // VietQR quick format using Vietcombank mock clinic account
    const bankCode = 'VCB'; // Vietcombank
    const accountNo = '0903123456';
    const amount = bill.totalAmount;
    const desc = encodeURIComponent(`${bill.billCode} ${bill.patientCode}`);
    return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${desc}&accountName=PHONG%20KHAM%20SMART%20CLINIC`;
  }
}
