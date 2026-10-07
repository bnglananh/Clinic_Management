import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Bill, PaymentMethod } from '../../../core/models/billing.model';
import { BillingService } from '../../../core/services/billing.service';
import { VndCurrencyPipe } from '../../pipes/vnd-currency.pipe';
import { ViDatePipe } from '../../pipes/vi-date.pipe';
import { ClinicIconComponent } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-payment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, VndCurrencyPipe, ClinicIconComponent],
  template: `
    <div class="payment-modal-backdrop" (click)="close.emit()">
      <div class="payment-modal-card clinic-card animate-fade-in-up" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="panel-header">
          <div class="header-main">
            <span class="sub-badge">QUẦY THU NGÂN VIỆN PHÍ</span>
            <h2 class="panel-title font-serif">Thanh Toán Hóa Đơn #{{ bill.billCode }}</h2>
            <div class="patient-quick-info">
              <span class="p-name font-bold">{{ bill.patientName }}</span>
              <span class="dot">•</span>
              <span>{{ bill.patientCode }}</span>
              <span class="dot">•</span>
              <span>{{ bill.roomName }} ({{ bill.doctorName }})</span>
            </div>
          </div>
          <button (click)="close.emit()" class="close-panel-btn">
            <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
          </button>
        </div>

        <div class="panel-body-grid">
          <!-- Left: Items breakdown -->
          <div class="items-breakdown-col">
            <h3 class="col-title">Chi Tiết Dịch Vụ & Thuốc Trong Lượt Khám</h3>

            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Khoản mục</th>
                    <th>ĐVT</th>
                    <th>SL</th>
                    <th class="text-right">Đơn giá</th>
                    <th class="text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of bill.items; track item.id) {
                    <tr>
                      <td>
                        <div class="item-name-cell">
                          <span
                            class="type-pill"
                            [class.type-consult]="item.type === 'CONSULTATION'"
                            [class.type-service]="item.type === 'SERVICE'"
                            [class.type-medicine]="item.type === 'MEDICINE'"
                          >
                            {{ getItemTypeLabel(item.type) }}
                          </span>
                          <span class="name-text">{{ item.name }}</span>
                        </div>
                      </td>
                      <td>{{ item.unit }}</td>
                      <td>{{ item.quantity }}</td>
                      <td class="text-right tabular-nums">{{ item.unitPrice | vndCurrency }}</td>
                      <td class="text-right tabular-nums font-bold">{{ item.amount | vndCurrency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Cost Summary Block -->
            <div class="cost-summary-box">
              <div class="summary-line">
                <span>Tiền khám lâm sàng:</span>
                <span class="tabular-nums">{{ bill.consultationFee | vndCurrency }}</span>
              </div>
              <div class="summary-line">
                <span>Tiền dịch vụ kỹ thuật / cận lâm sàng:</span>
                <span class="tabular-nums">{{ bill.serviceFee | vndCurrency }}</span>
              </div>
              <div class="summary-line">
                <span>Tiền thuốc:</span>
                <span class="tabular-nums">{{ bill.medicineFee | vndCurrency }}</span>
              </div>
              @if (bill.discountAmount > 0) {
                <div class="summary-line text-sage">
                  <span>Ưu đãi / Giảm trừ thành viên:</span>
                  <span class="tabular-nums">-{{ bill.discountAmount | vndCurrency }}</span>
                </div>
              }
              <div class="summary-total-line">
                <span class="total-label">TỔNG TIỀN PHẢI THU:</span>
                <span class="total-amount tabular-nums font-serif">{{ bill.totalAmount | vndCurrency }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Payment Method & Actions -->
          <div class="payment-action-col">
            <h3 class="col-title">Phương Thức Thanh Toán</h3>

            <!-- Method Switcher Pills -->
            <div class="method-selector">
              <button
                type="button"
                class="method-btn"
                [class.active]="selectedMethod() === 'CASH'"
                (click)="selectedMethod.set('CASH')"
              >
                <span class="m-icon">
                  <app-clinic-icon name="wallet" [size]="20" color="#0E4A55"></app-clinic-icon>
                </span>
                <div class="m-text">
                  <span class="m-title">Tiền Mặt</span>
                  <span class="m-sub">Thu tại quầy</span>
                </div>
              </button>

              <button
                type="button"
                class="method-btn"
                [class.active]="selectedMethod() === 'VIETQR'"
                (click)="selectedMethod.set('VIETQR')"
              >
                <span class="m-icon">
                  <app-clinic-icon name="credit-card" [size]="20" color="#0E4A55"></app-clinic-icon>
                </span>
                <div class="m-text">
                  <span class="m-title">VietQR Động</span>
                  <span class="m-sub">Chuyển khoản 24/7</span>
                </div>
              </button>
            </div>

            <!-- Cash Flow Panel -->
            @if (selectedMethod() === 'CASH') {
              <div class="cash-flow-container">
                <label class="flow-label">Số tiền khách đưa:</label>
                <div class="cash-input-wrap">
                  <input
                    type="number"
                    [(ngModel)]="cashReceived"
                    class="cash-input tabular-nums"
                    placeholder="Nhập số tiền..."
                  />
                  <span class="currency-tag">₫</span>
                </div>

                <!-- Quick money suggestions -->
                <div class="quick-cash-pills">
                  <button type="button" class="quick-pill" (click)="setCash(bill.totalAmount)">
                    Vừa đủ ({{ bill.totalAmount | vndCurrency }})
                  </button>
                  <button type="button" class="quick-pill" (click)="addCash(50000)">+50k</button>
                  <button type="button" class="quick-pill" (click)="addCash(100000)">+100k</button>
                  <button type="button" class="quick-pill" (click)="addCash(200000)">+200k</button>
                  <button type="button" class="quick-pill" (click)="addCash(500000)">+500k</button>
                </div>

                <!-- Calculation Result -->
                <div class="cash-change-card" [class.shortage]="cashChange() < 0">
                  @if (cashChange() >= 0) {
                    <span class="change-label">Tiền thối lại cho khách:</span>
                    <span class="change-val tabular-nums text-sage font-bold">{{ cashChange() | vndCurrency }}</span>
                  } @else {
                    <span class="change-label text-burgundy">Còn thiếu của khách:</span>
                    <span class="change-val tabular-nums text-burgundy font-bold">{{ -cashChange() | vndCurrency }}</span>
                  }
                </div>
              </div>
            }

            <!-- VietQR Flow Panel -->
            @if (selectedMethod() === 'VIETQR') {
              <div class="qr-flow-container">
                <div class="qr-box">
                  <img
                    [src]="qrImageUrl()"
                    alt="VietQR Smart Clinic"
                    class="qr-image"
                  />
                  <div class="qr-desc">
                    <p class="qr-bank font-bold">Ngân hàng TMCP Ngoại Thương (Vietcombank)</p>
                    <p class="qr-acc">STK: <strong>0903 123 456</strong></p>
                    <p class="qr-name">Chủ TK: <strong>PHÒNG KHÁM SMART CLINIC</strong></p>
                    <p class="qr-syntax">Nội dung CK: <strong>{{ bill.billCode }} {{ bill.patientCode }}</strong></p>
                  </div>
                </div>
                <div class="qr-notice">
                  <app-clinic-icon name="alert-triangle" [size]="14" color="#B8955A"></app-clinic-icon>
                  <span>Thu ngân kiểm tra thông báo biến động số dư trước khi xác nhận.</span>
                </div>
              </div>
            }

            <!-- Bottom Action Submit -->
            <div class="panel-action-footer">
              <button
                type="button"
                class="confirm-pay-btn"
                [disabled]="isProcessing() || (selectedMethod() === 'CASH' && cashChange() < 0)"
                (click)="onConfirmPayment()"
              >
                @if (isProcessing()) {
                  <span>Đang xử lý & Trừ kho thuốc...</span>
                } @else if (selectedMethod() === 'CASH') {
                  <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
                  <span>Xác nhận đã thu đủ tiền mặt ({{ bill.totalAmount | vndCurrency }})</span>
                } @else {
                  <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
                  <span>Thu ngân xác nhận tiền VietQR đã về TK</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .payment-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.7);
        backdrop-filter: blur(5px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .payment-modal-card {
        width: 100%;
        max-width: 1080px;
        max-height: 90vh;
        background: #FFFFFF;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .panel-header {
        padding: 20px 28px;
        background: #FAF8F5;
        border-bottom: 1.5px solid #E4DED2;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .sub-badge {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #B8955A;
        background: rgba(184, 149, 90, 0.15);
        padding: 2px 10px;
        border-radius: 999px;
        display: inline-block;
        margin-bottom: 4px;
      }

      .panel-title {
        font-size: 1.7rem;
        color: #0E4A55;
        margin: 0 0 6px 0;
      }

      .patient-quick-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.84rem;
        color: #5B6672;

        .dot {
          color: #B8955A;
        }
      }

      .close-panel-btn {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        color: #8C96A2;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;

        &:hover {
          color: #9B3D45;
          background: rgba(155, 61, 69, 0.1);
        }
      }

      .panel-body-grid {
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        flex: 1;
        overflow-y: auto;
      }

      @media (max-width: 900px) {
        .panel-body-grid {
          grid-template-columns: 1fr;
        }
      }

      .items-breakdown-col {
        padding: 24px 28px;
        border-right: 1px solid #E4DED2;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .payment-action-col {
        padding: 24px 28px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: #FAF8F5;
      }

      .col-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1C2733;
        margin: 0 0 12px 0;
      }

      .items-table-wrapper {
        flex: 1;
        max-height: 280px;
        overflow-y: auto;
        border: 1px solid #E4DED2;
        border-radius: 10px;
        background: #FFFFFF;
      }

      .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;

        th {
          background: #FAF8F5;
          padding: 8px 12px;
          color: #5B6672;
          font-weight: 600;
          border-bottom: 1px solid #E4DED2;
          position: sticky;
          top: 0;
        }

        td {
          padding: 10px 12px;
          border-bottom: 1px solid #F0EAE1;
          color: #1C2733;
        }
      }

      .item-name-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .type-pill {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .type-consult {
        background: rgba(184, 149, 90, 0.15);
        color: #8C6C32;
      }

      .type-service {
        background: rgba(14, 74, 85, 0.12);
        color: #0E4A55;
      }

      .type-medicine {
        background: rgba(94, 139, 126, 0.15);
        color: #3A6357;
      }

      .cost-summary-box {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 14px 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .summary-line {
        display: flex;
        justify-content: space-between;
        font-size: 0.84rem;
        color: #5B6672;
      }

      .summary-total-line {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding-top: 10px;
        margin-top: 6px;
        border-top: 1.5px dashed #E4DED2;
      }

      .total-label {
        font-weight: 700;
        font-size: 0.95rem;
        color: #1C2733;
      }

      .total-amount {
        font-size: 1.8rem;
        font-weight: 700;
        color: #0E4A55;
      }

      // Method Selector
      .method-selector {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;
      }

      .method-btn {
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
        }

        &.active {
          border-color: #0E4A55;
          background: rgba(14, 74, 85, 0.08);
          box-shadow: 0 2px 8px rgba(14, 74, 85, 0.15);

          .m-title {
            color: #0E4A55;
            font-weight: 700;
          }
        }
      }

      .m-icon {
        font-size: 1.5rem;
      }

      .m-text {
        display: flex;
        flex-direction: column;
        text-align: left;
      }

      .m-title {
        font-size: 0.88rem;
        font-weight: 600;
        color: #1C2733;
      }

      .m-sub {
        font-size: 0.72rem;
        color: #8C96A2;
      }

      // Cash Flow
      .cash-flow-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .flow-label {
        font-size: 0.82rem;
        font-weight: 600;
        color: #1C2733;
      }

      .cash-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .cash-input {
        width: 100%;
        height: 48px;
        padding: 0 40px 0 16px;
        border: 1px solid #E2DCD0;
        border-radius: 12px;
        font-size: 1.25rem;
        font-weight: 700;
        color: #0E4A55;
        outline: none;
        background: #FFFFFF;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:hover {
          border-color: #C8BFB0;
        }

        &:focus {
          border-color: #0E4A55;
          box-shadow: 0 0 0 3.5px rgba(14, 74, 85, 0.12);
        }
      }

      .currency-tag {
        position: absolute;
        right: 14px;
        font-size: 1.1rem;
        font-weight: 600;
        color: #8C96A2;
      }

      .quick-cash-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .quick-pill {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 6px;
        padding: 5px 10px;
        font-size: 0.76rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
        }
      }

      .cash-change-card {
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 10px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 6px;

        &.shortage {
          border-color: rgba(155, 61, 69, 0.4);
          background: rgba(155, 61, 69, 0.05);
        }

        .change-label {
          font-size: 0.84rem;
          font-weight: 600;
        }

        .change-val {
          font-size: 1.25rem;
        }
      }

      // QR Flow
      .qr-flow-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .qr-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 12px;
        padding: 14px;
        text-align: center;
        width: 100%;
      }

      .qr-image {
        width: 170px;
        height: 170px;
        object-fit: contain;
        border-radius: 8px;
        margin-bottom: 8px;
      }

      .qr-desc {
        font-size: 0.74rem;
        color: #5B6672;
        line-height: 1.4;

        p {
          margin: 2px 0;
        }
      }

      .qr-syntax {
        color: #0E4A55;
        background: rgba(14, 74, 85, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .qr-notice {
        font-size: 0.75rem;
        color: #8C6C32;
        background: rgba(184, 149, 90, 0.12);
        padding: 6px 12px;
        border-radius: 6px;
        text-align: center;
        width: 100%;
      }

      .panel-action-footer {
        margin-top: 24px;
      }

      .confirm-pay-btn {
        width: 100%;
        height: 50px;
        background: #0E4A55;
        border: none;
        color: #FFFFFF;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(14, 74, 85, 0.3);

        &:hover:not(:disabled) {
          background: #135d6b;
          transform: translateY(-1px);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .text-right {
        text-align: right;
      }
    `,
  ],
})
export class PaymentPanelComponent {
  private billingService = inject(BillingService);

  @Input({ required: true }) bill!: Bill;
  @Output() paymentSuccess = new EventEmitter<Bill>();
  @Output() close = new EventEmitter<void>();

  selectedMethod = signal<PaymentMethod>('CASH');
  cashReceived = 0;
  isProcessing = signal<boolean>(false);

  ngOnInit(): void {
    this.cashReceived = this.bill.totalAmount;
  }

  cashChange = computed(() => {
    return (this.cashReceived || 0) - this.bill.totalAmount;
  });

  qrImageUrl = computed(() => {
    return this.billingService.generateVietQrUrl(this.bill);
  });

  getItemTypeLabel(type: string): string {
    switch (type) {
      case 'CONSULTATION':
        return 'Khám';
      case 'SERVICE':
        return 'Kỹ thuật';
      case 'MEDICINE':
        return 'Thuốc';
      default:
        return 'Mục';
    }
  }

  setCash(amount: number): void {
    this.cashReceived = amount;
  }

  addCash(amount: number): void {
    this.cashReceived = (this.cashReceived || 0) + amount;
  }

  onConfirmPayment(): void {
    this.isProcessing.set(true);

    this.billingService
      .processPayment({
        billId: this.bill.id,
        paymentMethod: this.selectedMethod(),
        cashReceived: this.selectedMethod() === 'CASH' ? this.cashReceived : undefined,
        cashChange: this.selectedMethod() === 'CASH' ? this.cashChange() : undefined,
      })
      .subscribe({
        next: (updated) => {
          this.isProcessing.set(false);
          this.paymentSuccess.emit(updated);
        },
        error: () => {
          this.isProcessing.set(false);
        },
      });
  }
}
