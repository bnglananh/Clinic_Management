import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BillingService } from '../../../core/services/billing.service';
import { Bill } from '../../../core/models/billing.model';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-patient-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusTagComponent, VndCurrencyPipe, ClinicIconComponent],
  template: `
    <div class="patient-billing-page animate-fade-in-up">
      <!-- Header -->
      <div class="billing-header">
        <span class="header-badge font-serif">VIỆN PHÍ & DỊCH VỤ Y TẾ</span>
        <h1 class="page-title font-serif">Hóa Đơn & Thanh Toán Trực Tuyến</h1>
        <p class="page-subtitle">
          Minh bạch toàn bộ chi phí khám chữa bệnh, cận lâm sàng, thuốc và thanh toán nhanh chóng qua chuẩn VietQR.
        </p>
      </div>

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card clinic-card">
          <span class="sc-label">Tổng Viện Phí Đã Phát Sinh</span>
          <span class="sc-val font-serif text-teal">{{ totalSpent() | vndCurrency }}</span>
          <span class="sc-sub">Bao gồm khám, xét nghiệm & thuốc</span>
        </div>

        <div class="stat-card clinic-card">
          <span class="sc-label">Đã Thanh Toán</span>
          <span class="sc-val font-serif" style="color: #5E8B7E;">{{ totalPaid() | vndCurrency }}</span>
          <span class="sc-sub">{{ paidCount() }} hóa đơn đã tất toán</span>
        </div>

        <div class="stat-card clinic-card" [class.alert-due]="pendingAmount() > 0">
          <span class="sc-label">Cần Thanh Toán Hiện Tại</span>
          <span class="sc-val font-serif text-burgundy">{{ pendingAmount() | vndCurrency }}</span>
          <span class="sc-sub">{{ unpaidCount() }} hóa đơn chưa thanh toán</span>
        </div>
      </div>

      <!-- Bills List -->
      <div class="bills-container">
        <h2 class="sec-heading font-serif">Danh Sách Hóa Đơn Khám Chữa Bệnh</h2>

        <div class="bills-list">
          @for (bill of myBills(); track bill.id) {
            <div class="bill-card clinic-card" [class.unpaid-card]="bill.paymentStatus === 'UNPAID'">
              <div class="bill-top">
                <div class="b-info">
                  <span class="b-code font-mono">{{ bill.billCode }}</span>
                  <h3 class="b-patient">{{ bill.patientName }} ({{ bill.patientCode }})</h3>
                  <span class="b-date">Ngày lập: {{ bill.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>

                <div class="b-status">
                  <app-status-tag [status]="bill.paymentStatus"></app-status-tag>
                  <span class="b-total-amount font-serif">{{ bill.totalAmount | vndCurrency }}</span>
                </div>
              </div>

              <!-- Bill Items Table -->
              <div class="b-items-wrap">
                <table class="b-items-table">
                  <thead>
                    <tr>
                      <th>Hạng Mục</th>
                      <th>Loại</th>
                      <th>Số Lượng</th>
                      <th>Đơn Giá</th>
                      <th>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of bill.items; track item.id) {
                      <tr>
                        <td><strong>{{ item.name }}</strong></td>
                        <td><span class="item-cat-tag">{{ item.type }}</span></td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.unitPrice | vndCurrency }}</td>
                        <td><strong class="text-teal">{{ item.amount | vndCurrency }}</strong></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Bill Footer Actions -->
              <div class="bill-footer">
                <div class="b-insurance-info">
                  @if (bill.discountAmount > 0) {
                    <span>Miễn giảm / BHYT: <strong>{{ bill.discountAmount | vndCurrency }}</strong></span>
                  } @else {
                    <span class="text-muted">Không áp dụng giảm trừ</span>
                  }
                </div>

                <div class="b-actions">
                  <button class="btn-print" (click)="printBill(bill)">
                    <app-clinic-icon name="download" [size]="14"></app-clinic-icon>
                    <span>In Biên Lai</span>
                  </button>

                  @if (bill.paymentStatus === 'UNPAID') {
                    <button class="btn-pay-vietqr" (click)="openVietQrModal(bill)">
                      <app-clinic-icon name="credit-card" [size]="16"></app-clinic-icon>
                      <span>Quét Mã VietQR Thanh Toán Ngay</span>
                      <app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon>
                    </button>
                  } @else {
                    <span class="paid-check-badge">
                      <app-clinic-icon name="check" [size]="14"></app-clinic-icon>
                      <span>Đã thanh toán qua {{ bill.paymentMethod }}</span>
                    </span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- VietQR Payment Modal -->
      @if (activeQrBill(); as b) {
        <div class="modal-overlay" (click)="activeQrBill.set(null)">
          <div class="qr-modal-box" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="m-left">
                <span class="qr-brand-tag">VIETQR THANH TOÁN 24/7</span>
                <h3 class="m-title font-serif">Thanh Toán Viện Phí Qua QR Code</h3>
              </div>
              <button class="btn-close" (click)="activeQrBill.set(null)">
                <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
              </button>
            </div>

            <div class="modal-body">
              <div class="qr-display-zone">
                <img
                  [src]="billingService.generateVietQrUrl(b)"
                  alt="VietQR Code"
                  class="qr-image"
                />
                <div class="scan-hint">
                  <app-clinic-icon name="credit-card" [size]="15" class="cam-icon"></app-clinic-icon>
                  <span>Mở ứng dụng Ngân hàng (VCB, BIDV, Techcombank...) hoặc ví Momo để quét mã</span>
                </div>
              </div>

              <div class="transfer-info-box">
                <div class="t-row">
                  <span class="tl">Ngân hàng thụ hưởng:</span>
                  <strong>Vietcombank (Chi nhánh TP.HCM)</strong>
                </div>
                <div class="t-row">
                  <span class="tl">Tên tài khoản:</span>
                  <strong>PHÒNG KHÁM ĐA KHOA SMART CLINIC</strong>
                </div>
                <div class="t-row">
                  <span class="tl">Số tài khoản:</span>
                  <strong class="font-mono text-teal">0903 123 456</strong>
                </div>
                <div class="t-row highlight-row">
                  <span class="tl">Số tiền thanh toán:</span>
                  <strong class="font-serif price-text">{{ b.totalAmount | vndCurrency }}</strong>
                </div>
                <div class="t-row">
                  <span class="tl">Nội dung chuyển khoản:</span>
                  <strong class="font-mono text-gold">{{ b.billCode }} {{ b.patientCode }}</strong>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" (click)="activeQrBill.set(null)">Đóng</button>
              <button class="btn-confirm-paid" (click)="confirmPaid(b.id)">
                <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
                <span>Tôi Đã Hoàn Tất Chuyển Khoản</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .patient-billing-page {
        max-width: 1080px;
        margin: 0 auto;
        padding-bottom: 40px;
      }

      .billing-header {
        text-align: center;
        margin-bottom: 24px;

        .header-badge {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #B8955A;
          background: rgba(184, 149, 90, 0.15);
          padding: 4px 12px;
          border-radius: 999px;
          display: inline-block;
          margin-bottom: 8px;
        }

        .page-title {
          font-size: 2rem;
          color: #1C2733;
          margin: 0 0 8px 0;
        }

        .page-subtitle {
          font-size: 0.92rem;
          color: #5B6672;
          max-width: 620px;
          margin: 0 auto;
        }
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 32px;
      }

      @media (max-width: 800px) {
        .stats-row {
          grid-template-columns: 1fr;
        }
      }

      .stat-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 16px;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 6px;

        &.alert-due {
          border-color: rgba(155, 61, 69, 0.4);
          background: #FFFDFD;
        }

        .sc-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #5B6672;
        }

        .sc-val {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1C2733;
          line-height: 1.2;
        }

        .sc-sub {
          font-size: 0.74rem;
          color: #8C96A2;
        }
      }

      .sec-heading {
        font-size: 1.35rem;
        color: #1C2733;
        margin: 0 0 16px 0;
      }

      .bills-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .bill-card {
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 6px 20px rgba(28, 39, 51, 0.05);

        &.unpaid-card {
          border-color: rgba(184, 149, 90, 0.5);
          box-shadow: 0 8px 24px rgba(184, 149, 90, 0.12);
        }
      }

      .bill-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 12px;

        .b-code {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0E4A55;
          background: rgba(14, 74, 85, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .b-patient {
          margin: 4px 0 2px 0;
          font-size: 1.15rem;
          color: #1C2733;
        }

        .b-date {
          font-size: 0.78rem;
          color: #8C96A2;
        }

        .b-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;

          .b-total-amount {
            font-size: 1.45rem;
            font-weight: 700;
            color: #0E4A55;
          }
        }
      }

      .b-items-wrap {
        border: 1px solid #E4DED2;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 16px;
      }

      .b-items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;

        th {
          background: #F4EFEB;
          padding: 8px 12px;
          text-align: left;
          color: #5B6672;
          font-weight: 600;
          font-size: 0.78rem;
        }

        td {
          padding: 10px 12px;
          border-top: 1px solid #F0EAE1;
          color: #1C2733;
        }

        .item-cat-tag {
          font-size: 0.68rem;
          background: #FAF8F5;
          border: 1px solid #E4DED2;
          padding: 2px 6px;
          border-radius: 4px;
        }
      }

      .bill-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;

        .b-insurance-info {
          font-size: 0.82rem;
          color: #5B6672;
        }

        .b-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn-print {
          background: #FFFFFF;
          border: 1px solid #E2DCD0;
          color: #5B6672;
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;

          &:hover {
            background: #FAF8F5;
            color: #1C2733;
            border-color: #0E4A55;
          }
        }

        .btn-pay-vietqr {
          background: #B8955A;
          color: #FFFFFF;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(184, 149, 90, 0.25);
          transition: all 0.2s ease;

          &:hover {
            background: #a3824b;
            transform: translateY(-1px);
          }
        }

        .paid-check-badge {
          font-size: 0.78rem;
          color: #5E8B7E;
          font-weight: 700;
          background: rgba(94, 139, 126, 0.12);
          padding: 6px 12px;
          border-radius: 8px;
        }
      }

      /* Modal QR */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }

      .qr-modal-box {
        background: #FFFFFF;
        width: 100%;
        max-width: 500px;
        border-radius: 20px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
        border: 1.5px solid #B8955A;
        overflow: hidden;
      }

      .modal-header {
        background: #FAF8F5;
        border-bottom: 1px solid #E4DED2;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .qr-brand-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: #B8955A;
          letter-spacing: 0.08em;
        }

        .m-title {
          margin: 2px 0 0 0;
          font-size: 1.15rem;
          color: #1C2733;
        }

        .btn-close {
          border: none;
          background: transparent;
          font-size: 1.2rem;
          cursor: pointer;
        }
      }

      .modal-body {
        padding: 20px;
        text-align: center;
      }

      .qr-display-zone {
        margin-bottom: 16px;

        .qr-image {
          width: 240px;
          height: 240px;
          object-fit: contain;
          border-radius: 12px;
          border: 1px solid #E4DED2;
          padding: 8px;
          background: #FFFFFF;
          margin: 0 auto;
        }

        .scan-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.76rem;
          color: #5B6672;
          margin-top: 8px;
        }
      }

      .transfer-info-box {
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 14px;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 0.84rem;

        .t-row {
          display: flex;
          justify-content: space-between;

          .tl {
            color: #5B6672;
          }

          &.highlight-row {
            margin: 4px 0;
            padding: 6px 0;
            border-top: 1px dashed #D5CDBD;
            border-bottom: 1px dashed #D5CDBD;

            .price-text {
              font-size: 1.1rem;
              color: #0E4A55;
            }
          }
        }
      }

      .modal-footer {
        padding: 14px 20px;
        background: #FAF8F5;
        border-top: 1px solid #E4DED2;
        display: flex;
        justify-content: flex-end;
        gap: 10px;

        button {
          padding: 9px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .btn-cancel {
          background: #FFFFFF;
          border: 1px solid #D5CDBD;
          color: #1C2733;
        }

        .btn-confirm-paid {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
        }
      }
    `,
  ],
})
export class PatientBillingComponent {
  billingService = inject(BillingService);

  activeQrBill = signal<Bill | null>(null);

  myBills = this.billingService.bills;

  totalSpent = computed(() =>
    this.myBills().reduce((sum, b) => sum + b.totalAmount, 0)
  );

  totalPaid = computed(() =>
    this.myBills()
      .filter((b) => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + b.totalAmount, 0)
  );

  pendingAmount = computed(() =>
    this.myBills()
      .filter((b) => b.paymentStatus === 'UNPAID')
      .reduce((sum, b) => sum + b.totalAmount, 0)
  );

  paidCount = computed(
    () => this.myBills().filter((b) => b.paymentStatus === 'PAID').length
  );

  unpaidCount = computed(
    () => this.myBills().filter((b) => b.paymentStatus === 'UNPAID').length
  );

  openVietQrModal(bill: Bill): void {
    this.activeQrBill.set(bill);
  }

  confirmPaid(billId: string): void {
    this.billingService.processPayment({
      billId,
      paymentMethod: 'VIETQR',
      cashierName: 'Cổng Bệnh Nhân (VietQR Online)',
    });
    this.activeQrBill.set(null);
  }

  printBill(bill: Bill): void {
    window.print();
  }
}
