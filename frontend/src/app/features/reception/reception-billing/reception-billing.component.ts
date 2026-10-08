import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../../core/services/billing.service';
import { Bill, PaymentStatus } from '../../../core/models/billing.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { PaymentPanelComponent } from '../../../shared/components/payment-panel/payment-panel.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';
import { ViDatePipe } from '../../../shared/pipes/vi-date.pipe';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-reception-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusTagComponent,
    PaymentPanelComponent,
    VndCurrencyPipe,
    ClinicIconComponent,
  ],
  template: `
    <app-page-header
      badgeText="QUẢN LÝ VIỆN PHÍ & THU NGÂN"
      title="Lập Hóa Đơn & Thu Ngân Viện Phí"
      subtitle="Tổng hợp chi phí khám, dịch vụ kỹ thuật và thuốc. Hỗ trợ thanh toán Tiền mặt (tự tính tiền thừa) và VietQR động."
    >
      <div actions>
        <button class="btn-export-excel">
          <app-clinic-icon name="download" [size]="16"></app-clinic-icon>
          <span>Xuất sổ thu ngân</span>
        </button>
      </div>
    </app-page-header>

    <!-- Top KPI Cards -->
    <div class="billing-kpis-grid">
      <app-stat-card
        title="Doanh thu đã thu hôm nay"
        [value]="paidTodayTotal() | vndCurrency"
        subText="Bao gồm Tiền mặt & VietQR"
        trendText="8.5%"
        [trendPositive]="true"
        iconName="wallet"
        iconBg="rgba(94, 139, 126, 0.15)"
        iconColor="#5E8B7E"
      ></app-stat-card>

      <app-stat-card
        title="Hóa đơn chờ thanh toán"
        [value]="pendingCount()"
        unit="hóa đơn"
        subText="Bệnh nhân đang ở quầy thu ngân"
        iconName="clock"
        iconBg="rgba(184, 149, 90, 0.15)"
        iconColor="#B8955A"
        [isHighlight]="true"
      ></app-stat-card>

      <app-stat-card
        title="Hóa đơn đã hoàn tất"
        [value]="paidCount()"
        unit="hóa đơn"
        subText="Đã tự động trừ kho thuốc"
        iconName="check"
        iconBg="rgba(14, 74, 85, 0.15)"
        iconColor="#0E4A55"
      ></app-stat-card>

      <app-stat-card
        title="Thanh toán qua VietQR"
        value="65%"
        subText="Tỷ lệ thanh toán không tiền mặt"
        iconName="credit-card"
      ></app-stat-card>
    </div>

    <!-- Bills List Card -->
    <div class="clinic-card bills-table-card">
      <div class="filter-header-bar">
        <div>
          <h3 class="clinic-section-title">Danh Sách Hóa Đơn Viện Phí</h3>
          <p class="section-sub">Tự động kích hoạt trừ tồn kho thuốc khi hóa đơn chuyển sang trạng thái ĐÃ THANH TOÁN.</p>
        </div>

        <div class="filter-pills-bar">
          <button
            type="button"
            class="f-pill"
            [class.active]="statusFilter() === 'ALL'"
            (click)="statusFilter.set('ALL')"
          >
            Tất cả ({{ bills().length }})
          </button>
          <button
            type="button"
            class="f-pill"
            [class.active]="statusFilter() === 'UNPAID'"
            (click)="statusFilter.set('UNPAID')"
          >
            Chờ thanh toán ({{ pendingCount() }})
          </button>
          <button
            type="button"
            class="f-pill"
            [class.active]="statusFilter() === 'PAID'"
            (click)="statusFilter.set('PAID')"
          >
            Đã thanh toán ({{ paidCount() }})
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="clinic-data-table">
          <thead>
            <tr>
              <th class="col-code">Mã hóa đơn</th>
              <th class="col-stt text-center">STT khám</th>
              <th class="col-patient">Bệnh nhân</th>
              <th class="col-room">Phòng khám</th>
              <th class="col-fee text-right">Tiền khám</th>
              <th class="col-fee text-right">Tiền kỹ thuật</th>
              <th class="col-fee text-right">Tiền thuốc</th>
              <th class="col-total text-right">Tổng thanh toán</th>
              <th class="col-method text-center">Hình thức</th>
              <th class="col-status text-center">Trạng thái</th>
              <th class="col-actions text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (bill of filteredBills(); track bill.id) {
              <tr [class.unpaid-row]="bill.paymentStatus === 'UNPAID'">
                <td class="col-code">
                  <span class="bill-code-badge">{{ bill.billCode }}</span>
                </td>
                <td class="col-stt text-center">
                  <span class="stt-badge">{{ bill.ticketNumber }}</span>
                </td>
                <td class="col-patient">
                  <div class="patient-name-box">
                    <span class="p-name">{{ bill.patientName }}</span>
                    <span class="p-code">{{ bill.patientCode }}</span>
                  </div>
                </td>
                <td class="col-room">
                  <div class="room-box">
                    <span class="room-title">{{ bill.roomName }}</span>
                    @if (bill.doctorName) {
                      <span class="doc-name">{{ bill.doctorName }}</span>
                    }
                  </div>
                </td>
                <td class="col-fee text-right tabular-nums">{{ bill.consultationFee | vndCurrency }}</td>
                <td class="col-fee text-right tabular-nums">{{ bill.serviceFee | vndCurrency }}</td>
                <td class="col-fee text-right tabular-nums">{{ bill.medicineFee | vndCurrency }}</td>
                <td class="col-total text-right tabular-nums">
                  <span class="total-amount-val">{{ bill.totalAmount | vndCurrency }}</span>
                </td>
                <td class="col-method text-center">
                  @if (bill.paymentMethod === 'VIETQR') {
                    <span class="method-tag method-vietqr">
                      <app-clinic-icon name="credit-card" [size]="13"></app-clinic-icon>
                      <span>VietQR</span>
                    </span>
                  } @else if (bill.paymentMethod === 'CASH') {
                    <span class="method-tag method-cash">
                      <app-clinic-icon name="wallet" [size]="13"></app-clinic-icon>
                      <span>Tiền mặt</span>
                    </span>
                  } @else {
                    <span class="text-muted-slate font-medium">--</span>
                  }
                </td>
                <td class="col-status text-center">
                  <app-status-tag [status]="bill.paymentStatus"></app-status-tag>
                </td>
                <td class="col-actions text-center">
                  @if (bill.paymentStatus === 'UNPAID') {
                    <button
                      (click)="openPaymentPanel(bill)"
                      class="btn-pay-now"
                    >
                      <app-clinic-icon name="credit-card" [size]="14"></app-clinic-icon>
                      <span>Thu tiền</span>
                    </button>
                  } @else {
                    <button
                      (click)="printReceipt(bill)"
                      class="btn-print-receipt"
                      title="In biên lai điện tử"
                    >
                      <app-clinic-icon name="receipt" [size]="14"></app-clinic-icon>
                      <span>In biên lai</span>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="11" class="empty-cell text-center">
                  <div class="empty-state-box">
                    <app-clinic-icon name="receipt" [size]="32" color="#94A3B8"></app-clinic-icon>
                    <p class="empty-text">Không có hóa đơn viện phí nào trong danh mục này.</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Payment Panel Modal -->
    @if (selectedBillForPayment()) {
      <app-payment-panel
        [bill]="selectedBillForPayment()!"
        (paymentSuccess)="onPaymentSuccess($event)"
        (close)="selectedBillForPayment.set(null)"
      ></app-payment-panel>
    }

    <!-- Toast Notification for Paid Bill -->
    @if (paidSuccessMessage()) {
      <div class="success-toast animate-fade-in-up">
        <span class="toast-icon">
          <app-clinic-icon name="check" [size]="18"></app-clinic-icon>
        </span>
        <div class="toast-body">
          <span class="toast-title">Thanh toán viện phí thành công!</span>
          <span class="toast-detail">{{ paidSuccessMessage() }}</span>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .btn-export-excel {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #FFFFFF;
        color: #1C2733;
        border: 1px solid #E4DED2;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 0.88rem;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
        }
      }

      .billing-kpis-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      @media (max-width: 1200px) {
        .billing-kpis-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .bills-table-card {
        padding: 0;
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 4px 20px -2px rgba(28, 39, 51, 0.05);
        border: 1px solid #E8E2D8;
        overflow: hidden;
      }

      .filter-header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1.5px solid #E8E2D8;
        flex-wrap: wrap;
        gap: 16px;
        background: #FFFFFF;
      }

      .section-sub {
        font-size: 0.84rem;
        color: #5B6672;
        margin: 4px 0 0 0;
      }

      .filter-pills-bar {
        display: flex;
        gap: 6px;
        background: #FAF8F5;
        padding: 4px;
        border-radius: 999px;
        border: 1px solid #E4DED2;
      }

      .f-pill {
        background: transparent;
        border: none;
        padding: 6px 16px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          color: #0E4A55;
        }

        &.active {
          background: #0E4A55;
          color: #FFFFFF;
        }
      }

      .table-responsive {
        width: 100%;
        overflow-x: auto;
      }

      .clinic-data-table {
        width: 100%;
        min-width: 1240px;
        border-collapse: collapse;
        font-size: 0.86rem;

        th {
          background: #FAF8F5;
          color: #475569;
          font-weight: 700;
          font-size: 0.77rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          text-align: left;
          padding: 14px 16px;
          border-bottom: 1.5px solid #E4DED2;
          white-space: nowrap;

          &.text-center {
            text-align: center;
          }

          &.text-right {
            text-align: right;
          }
        }

        td {
          padding: 13px 16px;
          border-bottom: 1px solid #F1ECE3;
          vertical-align: middle;
          color: #1E293B;

          &.text-center {
            text-align: center;
          }

          &.text-right {
            text-align: right;
          }
        }

        tbody tr {
          transition: background-color 0.15s ease;

          &:hover {
            background-color: #FAF8F5;
          }

          &.unpaid-row {
            background-color: rgba(184, 149, 90, 0.04);
            &:hover {
              background-color: rgba(184, 149, 90, 0.08);
            }
          }

          &:last-child td {
            border-bottom: none;
          }
        }

        .col-code {
          width: 135px;
          white-space: nowrap;
        }

        .col-stt {
          width: 90px;
          white-space: nowrap;
        }

        .col-patient {
          min-width: 175px;
        }

        .col-room {
          min-width: 145px;
        }

        .col-fee {
          width: 110px;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          color: #334155;
        }

        .col-total {
          width: 135px;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .col-method {
          width: 115px;
          white-space: nowrap;
        }

        .col-status {
          width: 140px;
          white-space: nowrap;
        }

        .col-actions {
          width: 125px;
          white-space: nowrap;
        }
      }

      .bill-code-badge {
        display: inline-block;
        padding: 4px 9px;
        background: rgba(14, 74, 85, 0.08);
        color: #0E4A55;
        border: 1px solid rgba(14, 74, 85, 0.18);
        border-radius: 6px;
        font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
        font-weight: 700;
        font-size: 0.82rem;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }

      .stt-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
        font-size: 0.88rem;
        font-weight: 700;
        background: rgba(14, 74, 85, 0.07);
        color: #0E4A55;
        border: 1px solid rgba(14, 74, 85, 0.18);
        padding: 3px 10px;
        border-radius: 6px;
        white-space: nowrap;
        letter-spacing: 0.02em;
      }

      .patient-name-box {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .p-name {
        color: #1E293B;
        font-weight: 600;
        font-size: 0.88rem;
      }

      .p-code {
        font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
        font-size: 0.75rem;
        color: #64748B;
      }

      .room-box {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .room-title {
        font-weight: 600;
        color: #1E293B;
        font-size: 0.86rem;
      }

      .doc-name {
        font-size: 0.75rem;
        color: #64748B;
      }

      .total-amount-val {
        color: #0E4A55;
        font-weight: 700;
        font-size: 0.95rem;
      }

      .method-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 0.78rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        white-space: nowrap;
      }

      .method-vietqr {
        background: rgba(14, 74, 85, 0.09);
        color: #0E4A55;
        border: 1px solid rgba(14, 74, 85, 0.2);
      }

      .method-cash {
        background: rgba(94, 139, 126, 0.12);
        color: #2D6A5B;
        border: 1px solid rgba(94, 139, 126, 0.22);
      }

      .btn-pay-now {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(14, 74, 85, 0.2);

        &:hover {
          background: #135d6b;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(14, 74, 85, 0.28);
        }
      }

      .btn-print-receipt {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: #FFFFFF;
        border: 1px solid #D8D1C5;
        color: #475569;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 500;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
          background: #F8FAFC;
          transform: translateY(-1px);
        }
      }

      .empty-cell {
        padding: 48px 16px;
      }

      .empty-state-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .empty-text {
        color: #64748B;
        font-size: 0.9rem;
        margin: 0;
      }

      // Success Toast
      .success-toast {
        position: fixed;
        bottom: 28px;
        right: 28px;
        background: #1C2733;
        color: #FFFFFF;
        border-left: 4px solid #5E8B7E;
        border-radius: 12px;
        padding: 16px 22px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        z-index: 1100;
      }

      .toast-icon {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #5E8B7E;
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .toast-body {
        display: flex;
        flex-direction: column;
      }

      .toast-title {
        font-size: 0.88rem;
        font-weight: 600;
        color: #FFFFFF;
      }

      .toast-detail {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.7);
      }

      .text-right {
        text-align: right;
      }
    `,
  ],
})
export class ReceptionBillingComponent {
  private billingService = inject(BillingService);

  bills = this.billingService.bills;
  pendingCount = this.billingService.pendingCount;
  paidTodayTotal = this.billingService.paidTodayTotal;

  paidCount = computed(() => {
    return this.bills().filter((b) => b.paymentStatus === 'PAID').length;
  });

  statusFilter = signal<string>('ALL');
  selectedBillForPayment = signal<Bill | null>(null);
  paidSuccessMessage = signal<string | null>(null);

  filteredBills = computed(() => {
    const list = this.bills();
    const filter = this.statusFilter();
    if (filter === 'ALL') return list;
    return list.filter((b) => b.paymentStatus === filter);
  });

  openPaymentPanel(bill: Bill): void {
    this.selectedBillForPayment.set(bill);
  }

  onPaymentSuccess(updatedBill: Bill): void {
    this.selectedBillForPayment.set(null);
    this.paidSuccessMessage.set(
      `Đã thu ${new Intl.NumberFormat('vi-VN').format(updatedBill.totalAmount)} ₫ cho hóa đơn ${updatedBill.billCode} (${updatedBill.patientName}). Tồn kho thuốc đã được cập nhật!`
    );
    setTimeout(() => {
      this.paidSuccessMessage.set(null);
    }, 4500);
  }

  printReceipt(bill: Bill): void {
    window.print();
  }
}
