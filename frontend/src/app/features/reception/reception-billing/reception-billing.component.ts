import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { BillingService } from '../../../core/services/billing.service';
import { AuthService } from '../../../core/services/auth.service';
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
        <button class="btn-export-excel" (click)="exportCashierBook()" title="Xuất sổ theo dõi thu ngân viện phí & dược phẩm">
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

    <!-- Toast Notification for Export Cashier Book -->
    @if (exportSuccessMessage()) {
      <div class="success-toast export-toast animate-fade-in-up">
        <span class="toast-icon export-icon">
          <app-clinic-icon name="download" [size]="18"></app-clinic-icon>
        </span>
        <div class="toast-body">
          <span class="toast-title">Xuất sổ thu ngân thành công!</span>
          <span class="toast-detail">{{ exportSuccessMessage() }}</span>
        </div>
      </div>
    }

    <!-- Cashier Book Modal (Sổ Theo Dõi Thu Ngân Chuẩn A4 / In / Excel) -->
    @if (isCashierBookModalOpen()) {
      <div class="cashier-modal-backdrop" (click)="closeCashierBookModal()">
        <div class="cashier-modal-dialog" (click)="$event.stopPropagation()">
          <!-- Modal Top Bar -->
          <div class="modal-top-bar">
            <div class="modal-title-wrap">
              <div class="modal-tags">
                <span class="report-type-badge">SỔ THEO DÕI THU NGÂN VIỆN PHÍ & DƯỢC PHẨM CHUẨN A4</span>
                <span class="report-ref">Mã sổ: STN-{{ todayRef() }}</span>
              </div>
              <h2 class="modal-top-title font-serif">Sổ Nhật Ký Thu Ngân Viện Phí & Dược Phẩm Trong Ngày</h2>
            </div>
            <div class="modal-actions-wrap">
              <button class="modal-btn-download-excel" (click)="downloadCashierBookExcel()" title="Tải file Microsoft Excel (.xlsx)">
                <app-clinic-icon name="download" [size]="15"></app-clinic-icon>
                <span>Tải file Excel (.xlsx)</span>
              </button>
              <button class="modal-btn-print" (click)="printCashierBook()">
                <app-clinic-icon name="receipt" [size]="15"></app-clinic-icon>
                <span>In Sổ Thu Ngân</span>
              </button>
              <button class="modal-btn-close" (click)="closeCashierBookModal()">
                <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
              </button>
            </div>
          </div>

          <!-- Document Preview Canvas -->
          <div class="report-preview-scroll">
            <div class="report-a4-sheet" id="printable-cashier-book">
              <!-- Official Document Header -->
              <div class="sheet-header">
                <div class="sheet-clinic-info">
                  <div class="clinic-emblem">
                    <app-clinic-icon name="activity" [size]="24"></app-clinic-icon>
                  </div>
                  <div>
                    <h1 class="clinic-official-name">PHÒNG KHÁM ĐA KHOA QUỐC TẾ SMART CLINIC</h1>
                    <p class="clinic-address">341/13A Khuông Việt, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh</p>
                    <p class="clinic-sub-meta">Hotline: 1900 6868 • Email: thungan&#64;smartclinic.vn • Hệ thống Smart Clinic EMR</p>
                  </div>
                </div>
                <div class="sheet-audit-box">
                  <div class="audit-row"><span>MÃ SỔ THU NGÂN:</span> <strong>STN-{{ todayRef() }}</strong></div>
                  <div class="audit-row"><span>NGÀY TRÍCH XUẤT:</span> <strong>{{ exportDateTime() }}</strong></div>
                  <div class="audit-row"><span>THU NGÂN:</span> <strong>{{ currentCashierName() }}</strong></div>
                  <div class="audit-row"><span>TRẠNG THÁI SỔ:</span> <span class="status-approved">ĐÃ KHÓA SỔ CA</span></div>
                </div>
              </div>

              <!-- Sheet Title -->
              <div class="sheet-title-center">
                <h2 class="main-report-heading">SỔ THEO DÕI THU NGÂN VIỆN PHÍ & DƯỢC PHẨM</h2>
                <p class="main-report-sub">Bảng kê chi tiết thu tiền khám bệnh, dịch vụ kỹ thuật và thuốc theo từng lượt khám</p>
              </div>

              <!-- Section 1: KPI Summary -->
              <div class="sheet-section">
                <h3 class="sheet-sec-heading">I. TỔNG HỢP DOANH THU THỰC THU TRONG CA</h3>
                <div class="sheet-kpi-grid">
                  <div class="sheet-kpi-item">
                    <span class="kpi-title">Tổng doanh thu thực thu</span>
                    <span class="kpi-number text-teal">{{ paidTodayTotal() | vndCurrency }}</span>
                    <span class="kpi-desc">{{ paidCount() }} hóa đơn đã thanh toán</span>
                  </div>
                  <div class="sheet-kpi-item">
                    <span class="kpi-title">Thu qua VietQR động</span>
                    <span class="kpi-number text-teal">{{ vietQrPaidTotal() | vndCurrency }}</span>
                    <span class="kpi-desc">Chuyển khoản trực tiếp VCB</span>
                  </div>
                  <div class="sheet-kpi-item">
                    <span class="kpi-title">Thu Tiền mặt tại quầy</span>
                    <span class="kpi-number text-gold">{{ cashPaidTotal() | vndCurrency }}</span>
                    <span class="kpi-desc">Đã đối chiếu quỹ tiền mặt</span>
                  </div>
                  <div class="sheet-kpi-item">
                    <span class="kpi-title">Hóa đơn chờ thanh toán</span>
                    <span class="kpi-number text-burgundy">{{ unpaidTotal() | vndCurrency }}</span>
                    <span class="kpi-desc">{{ pendingCount() }} ca đang ở quầy</span>
                  </div>
                </div>
              </div>

              <!-- Section 2: Detail Table -->
              <div class="sheet-section">
                <h3 class="sheet-sec-heading">II. BẢNG KÊ CHI TIẾT HÓA ĐƠN VIỆN PHÍ & DƯỢC</h3>
                <table class="sheet-table">
                  <thead>
                    <tr>
                      <th class="text-center" style="width: 35px;">STT</th>
                      <th style="width: 95px;">Mã HĐ</th>
                      <th class="text-center" style="width: 55px;">STT khám</th>
                      <th>Bệnh nhân / Mã BN</th>
                      <th>Phòng khám & Bác sĩ</th>
                      <th class="text-right" style="width: 80px;">Tiền khám</th>
                      <th class="text-right" style="width: 85px;">Kỹ thuật</th>
                      <th class="text-right" style="width: 85px;">Tiền thuốc</th>
                      <th class="text-right" style="width: 95px;">Tổng cộng</th>
                      <th class="text-center" style="width: 75px;">Hình thức</th>
                      <th class="text-center" style="width: 85px;">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (b of filteredBills(); track b.id; let idx = $index) {
                      <tr>
                        <td class="text-center">{{ idx + 1 }}</td>
                        <td class="font-mono font-bold">{{ b.billCode }}</td>
                        <td class="text-center font-mono">{{ b.ticketNumber }}</td>
                        <td>
                          <strong>{{ b.patientName }}</strong>
                          <div style="font-size: 9.5px; color: #555;">{{ b.patientCode }} - {{ b.phone }}</div>
                        </td>
                        <td>
                          <div>{{ b.roomName }}</div>
                          <div style="font-size: 9.5px; color: #555;">{{ b.doctorName }}</div>
                        </td>
                        <td class="text-right">{{ b.consultationFee | vndCurrency }}</td>
                        <td class="text-right">{{ b.serviceFee | vndCurrency }}</td>
                        <td class="text-right">{{ b.medicineFee | vndCurrency }}</td>
                        <td class="text-right font-bold text-teal">{{ b.totalAmount | vndCurrency }}</td>
                        <td class="text-center">
                          {{ b.paymentMethod === 'VIETQR' ? 'VietQR' : b.paymentMethod === 'CASH' ? 'Tiền mặt' : '--' }}
                        </td>
                        <td class="text-center">
                          <span [class.table-tag-success]="b.paymentStatus === 'PAID'" [class.table-tag-warn]="b.paymentStatus === 'UNPAID'">
                            {{ b.paymentStatus === 'PAID' ? 'Đã thu' : 'Chờ thu' }}
                          </span>
                        </td>
                      </tr>
                    }
                    <!-- Total Row -->
                    <tr class="table-total-row">
                      <td colspan="5" class="font-bold text-center">TỔNG CỘNG DOANH THU ({{ filteredBills().length }} HÓA ĐƠN)</td>
                      <td class="text-right font-bold">{{ totalConsultationFee() | vndCurrency }}</td>
                      <td class="text-right font-bold">{{ totalServiceFee() | vndCurrency }}</td>
                      <td class="text-right font-bold">{{ totalMedicineFee() | vndCurrency }}</td>
                      <td class="text-right font-bold text-teal" style="font-size: 11.5px;">{{ totalGrandAmount() | vndCurrency }}</td>
                      <td colspan="2" class="text-center font-bold">Thực thu: {{ paidTodayTotal() | vndCurrency }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Signatures -->
              <div class="sheet-signatures">
                <div class="sig-column">
                  <span class="sig-title">NGƯỜI LẬP SỔ (THU NGÂN)</span>
                  <span class="sig-instruction">(Ký và ghi rõ họ tên)</span>
                  <div class="sig-placeholder">
                    <span class="stamp-box">ĐÃ ĐỐI CHIẾU</span>
                  </div>
                  <span class="sig-name">{{ currentCashierName() }}</span>
                </div>
                <div class="sig-column">
                  <span class="sig-title">THỦ QUỸ PHÒNG KHÁM</span>
                  <span class="sig-instruction">(Ký và xác nhận tiền mặt)</span>
                  <div class="sig-placeholder"></div>
                  <span class="sig-name">Võ Thị Kim Phượng</span>
                </div>
                <div class="sig-column">
                  <span class="sig-title">KẾ TOÁN TRƯỞNG DUYỆT</span>
                  <span class="sig-instruction">(Ký, đóng dấu duyệt sổ)</span>
                  <div class="sig-placeholder">
                    <span class="stamp-box" style="border-color: #9B3D45; color: #9B3D45;">ĐÃ KIỂM SOÁT</span>
                  </div>
                  <span class="sig-name">Nguyễn Hoàng Sơn</span>
                </div>
              </div>

              <!-- Sheet Footer -->
              <div class="sheet-footer">
                <span>Hệ thống phần mềm Quản lý Phòng khám Smart Clinic EMR • In ngày {{ exportDateTime() }}</span>
                <span>Trang 1 / 1 • Lưu trữ kế toán & kiểm toán viện phí NoSQL (Cassandra & MongoDB)</span>
              </div>
            </div>
          </div>
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

      .export-toast {
        border-left-color: #0E4A55;
      }

      .export-icon {
        background: #0E4A55;
      }

      // Cashier Book Modal Styles
      .cashier-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(14, 20, 28, 0.75);
        backdrop-filter: blur(5px);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .cashier-modal-dialog {
        background: #1C2733;
        border-radius: 16px;
        width: 100%;
        max-width: 1100px;
        max-height: 94vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      .modal-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 24px;
        background: #141D26;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .modal-title-wrap {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .modal-tags {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .report-type-badge {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        background: rgba(184, 149, 90, 0.2);
        color: #D4AF37;
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .report-ref {
        font-size: 0.75rem;
        color: #94A3B8;
        font-family: monospace;
      }

      .modal-top-title {
        color: #FFFFFF;
        font-size: 1.15rem;
        margin: 0;
        font-weight: 600;
      }

      .modal-actions-wrap {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .modal-btn-download-excel {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #0E4A55;
        color: #FFFFFF;
        border: 1px solid #145967;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #156271;
          transform: translateY(-1px);
        }
      }

      .modal-btn-print {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.1);
        color: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
      }

      .modal-btn-close {
        background: transparent;
        border: none;
        color: #94A3B8;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
        }
      }

      .report-preview-scroll {
        overflow-y: auto;
        padding: 24px;
        background: #0F1720;
        display: flex;
        justify-content: center;
      }

      .report-a4-sheet {
        background: #FFFFFF;
        width: 100%;
        max-width: 960px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        padding: 28px 32px;
        color: #111827;
        font-size: 0.82rem;
        line-height: 1.45;
      }

      .sheet-header {
        display: flex;
        justify-content: space-between;
        border-bottom: 2px solid #0E4A55;
        padding-bottom: 12px;
        margin-bottom: 12px;
      }

      .sheet-clinic-info {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .clinic-emblem {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: #0E4A55;
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .clinic-official-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #0E4A55;
        margin: 0 0 2px 0;
        text-transform: uppercase;
      }

      .clinic-address, .clinic-sub-meta {
        font-size: 0.73rem;
        color: #4B5563;
        margin: 1px 0;
      }

      .sheet-audit-box {
        font-size: 0.73rem;
        text-align: right;
      }

      .audit-row {
        margin-bottom: 2px;
      }

      .status-approved {
        background: #E0F2FE;
        color: #0369A1;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.68rem;
      }

      .sheet-title-center {
        text-align: center;
        margin: 16px 0 18px 0;
      }

      .main-report-heading {
        font-size: 1.15rem;
        font-weight: 700;
        color: #0E4A55;
        margin: 0 0 3px 0;
        text-transform: uppercase;
      }

      .main-report-sub {
        font-size: 0.77rem;
        color: #6B7280;
        font-style: italic;
        margin: 0;
      }

      .sheet-sec-heading {
        font-size: 0.82rem;
        font-weight: 700;
        color: #0E4A55;
        margin: 14px 0 8px 0;
        text-transform: uppercase;
        border-bottom: 1px solid #E5E7EB;
        padding-bottom: 4px;
      }

      .sheet-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 12px;
      }

      .sheet-kpi-item {
        border: 1px solid #E5E7EB;
        padding: 8px 10px;
        border-radius: 6px;
        background: #F9FAFB;
      }

      .kpi-title {
        font-size: 0.72rem;
        color: #6B7280;
        display: block;
        margin-bottom: 2px;
      }

      .kpi-number {
        font-size: 0.95rem;
        font-weight: 700;
        color: #111827;
        display: block;
      }

      .kpi-desc {
        font-size: 0.68rem;
        color: #9CA3AF;
        margin-top: 2px;
        display: block;
      }

      .text-teal { color: #0E4A55; }
      .text-gold { color: #B8955A; }
      .text-burgundy { color: #9B3D45; }

      table.sheet-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
        font-size: 0.76rem;
      }

      table.sheet-table th, table.sheet-table td {
        border: 1px solid #D1D5DB;
        padding: 5px 6px;
      }

      table.sheet-table th {
        background: #F3F4F6;
        color: #0E4A55;
        font-weight: 700;
      }

      .table-total-row {
        background: #EBF3F5;
        font-weight: 700;
      }

      .table-tag-success {
        color: #15803D;
        font-weight: 700;
      }

      .table-tag-warn {
        color: #B45309;
        font-weight: 700;
      }

      .sheet-signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
        page-break-inside: avoid;
      }

      .sig-column {
        width: 30%;
        text-align: center;
      }

      .sig-title {
        font-weight: 700;
        font-size: 0.75rem;
        display: block;
        text-transform: uppercase;
      }

      .sig-instruction {
        font-size: 0.68rem;
        font-style: italic;
        color: #6B7280;
        display: block;
        margin-top: 2px;
      }

      .sig-placeholder {
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stamp-box {
        border: 1.5px dashed #0E4A55;
        color: #0E4A55;
        padding: 3px 8px;
        font-size: 0.68rem;
        font-weight: 700;
        border-radius: 4px;
        transform: rotate(-3deg);
      }

      .sig-name {
        font-weight: 700;
        font-size: 0.78rem;
        display: block;
      }

      .sheet-footer {
        margin-top: 18px;
        border-top: 1px solid #E5E7EB;
        padding-top: 6px;
        display: flex;
        justify-content: space-between;
        font-size: 0.66rem;
        color: #9CA3AF;
      }

      .text-right {
        text-align: right;
      }
    `,
  ],
})
export class ReceptionBillingComponent {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);

  bills = this.billingService.bills;
  pendingCount = this.billingService.pendingCount;
  paidTodayTotal = this.billingService.paidTodayTotal;

  paidCount = computed(() => {
    return this.bills().filter((b) => b.paymentStatus === 'PAID').length;
  });

  statusFilter = signal<string>('ALL');
  selectedBillForPayment = signal<Bill | null>(null);
  paidSuccessMessage = signal<string | null>(null);

  isCashierBookModalOpen = signal<boolean>(false);
  exportSuccessMessage = signal<string | null>(null);

  currentCashierName = computed(() => {
    return this.authService.currentUser()?.fullName || 'Mai Thị Thu Ngân';
  });

  cashPaidTotal = computed(() => {
    return this.bills()
      .filter((b) => b.paymentStatus === 'PAID' && b.paymentMethod === 'CASH')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  });

  vietQrPaidTotal = computed(() => {
    return this.bills()
      .filter((b) => b.paymentStatus === 'PAID' && b.paymentMethod === 'VIETQR')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  });

  unpaidTotal = computed(() => {
    return this.bills()
      .filter((b) => b.paymentStatus === 'UNPAID')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  });

  filteredBills = computed(() => {
    const list = this.bills();
    const filter = this.statusFilter();
    if (filter === 'ALL') return list;
    return list.filter((b) => b.paymentStatus === filter);
  });

  totalConsultationFee = computed(() => {
    return this.filteredBills().reduce((sum, b) => sum + (b.consultationFee || 0), 0);
  });

  totalServiceFee = computed(() => {
    return this.filteredBills().reduce((sum, b) => sum + (b.serviceFee || 0), 0);
  });

  totalMedicineFee = computed(() => {
    return this.filteredBills().reduce((sum, b) => sum + (b.medicineFee || 0), 0);
  });

  totalGrandAmount = computed(() => {
    return this.filteredBills().reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  });

  todayRef(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  exportDateTime(): string {
    const d = new Date();
    const date = d.toLocaleDateString('vi-VN');
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }

  exportCashierBook(): void {
    // 1. Tải tệp Microsoft Excel (.xlsx) chuẩn
    this.downloadCashierBookExcel();

    // 2. Mở Modal xem trước & in sổ thu ngân A4
    this.isCashierBookModalOpen.set(true);

    // 3. Hiển thị Toast thông báo
    const totalVnd = new Intl.NumberFormat('vi-VN').format(this.paidTodayTotal());
    this.exportSuccessMessage.set(
      `Đã xuất sổ thu ngân thành công! Tệp Excel (.xlsx) đã được tải xuống (${this.filteredBills().length} hóa đơn, thực thu: ${totalVnd} ₫).`
    );
    setTimeout(() => {
      this.exportSuccessMessage.set(null);
    }, 5500);
  }

  openCashierBookModal(): void {
    this.isCashierBookModalOpen.set(true);
  }

  closeCashierBookModal(): void {
    this.isCashierBookModalOpen.set(false);
  }

  downloadCashierBookExcel(): void {
    const list = this.filteredBills();

    // Dữ liệu tiêu đề & header báo cáo
    const data: (string | number)[][] = [
      ['PHÒNG KHÁM ĐA KHOA QUỐC TẾ SMART CLINIC'],
      ['SỔ THEO DÕI THU NGÂN VIỆN PHÍ & DƯỢC PHẨM TRONG CA'],
      [`Ngày trích xuất: ${this.exportDateTime()}`],
      [`Thu ngân lập sổ: ${this.currentCashierName()}`],
      [`Tổng số hóa đơn: ${list.length} | Tổng thực thu: ${new Intl.NumberFormat('vi-VN').format(this.paidTodayTotal())} VNĐ`],
      [], // dòng trống phân cách
      [
        'STT',
        'Mã hóa đơn',
        'STT khám',
        'Mã bệnh nhân',
        'Họ và tên bệnh nhân',
        'Số điện thoại',
        'Phòng khám',
        'Bác sĩ chỉ định',
        'Tiền khám (VNĐ)',
        'Tiền kỹ thuật (VNĐ)',
        'Tiền thuốc (VNĐ)',
        'Tổng tiền (VNĐ)',
        'Hình thức thanh toán',
        'Trạng thái',
        'Thu ngân thực hiện',
        'Ngày giờ thanh toán'
      ]
    ];

    let totalConsultation = 0;
    let totalService = 0;
    let totalMedicine = 0;
    let grandTotal = 0;

    list.forEach((b, idx) => {
      const consult = b.consultationFee || 0;
      const service = b.serviceFee || 0;
      const medicine = b.medicineFee || 0;
      const total = b.totalAmount || 0;

      totalConsultation += consult;
      totalService += service;
      totalMedicine += medicine;
      grandTotal += total;

      const methodStr = b.paymentMethod === 'VIETQR' ? 'VietQR' : b.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chưa thu';
      const statusStr = b.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : b.paymentStatus === 'UNPAID' ? 'CHỜ THANH TOÁN' : 'ĐÃ HỦY';

      data.push([
        idx + 1,
        b.billCode,
        b.ticketNumber,
        b.patientCode,
        b.patientName,
        b.phone || '',
        b.roomName || '',
        b.doctorName || '',
        consult,
        service,
        medicine,
        total,
        methodStr,
        statusStr,
        b.cashierName || this.currentCashierName(),
        b.paidAt || b.createdAt || ''
      ]);
    });

    // Dòng tổng cộng
    data.push([
      'TỔNG CỘNG',
      `${list.length} hóa đơn`,
      '',
      '',
      '',
      '',
      '',
      '',
      totalConsultation,
      totalService,
      totalMedicine,
      grandTotal,
      '',
      '',
      '',
      ''
    ]);

    // Tạo Worksheet từ mảng dữ liệu (Array of Arrays)
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Thiết lập độ rộng cột trực quan trong Excel
    ws['!cols'] = [
      { wch: 6 },  // STT
      { wch: 16 }, // Mã HĐ
      { wch: 11 }, // STT khám
      { wch: 15 }, // Mã BN
      { wch: 26 }, // Họ tên BN
      { wch: 14 }, // Số điện thoại
      { wch: 22 }, // Phòng khám
      { wch: 22 }, // Bác sĩ chỉ định
      { wch: 16 }, // Tiền khám
      { wch: 16 }, // Tiền kỹ thuật
      { wch: 16 }, // Tiền thuốc
      { wch: 18 }, // Tổng tiền
      { wch: 18 }, // Hình thức
      { wch: 18 }, // Trạng thái
      { wch: 20 }, // Thu ngân
      { wch: 20 }  // Ngày giờ
    ];

    // Tạo Workbook và xuất trực tiếp file .xlsx
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SoThuNgan');

    XLSX.writeFile(wb, `So_Thu_Ngan_SmartClinic_${this.todayRef()}.xlsx`);
  }

  printCashierBook(): void {
    const printContent = document.getElementById('printable-cashier-book');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=1050,height=850');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sổ Thu Ngân Viện Phí - Smart Clinic</title>
            <meta charset="utf-8" />
            <style>
              @page { size: A4 landscape; margin: 10mm 12mm; }
              body { font-family: 'Times New Roman', Times, serif; color: #111; margin: 0; padding: 15px; font-size: 11.5px; line-height: 1.4; background: #fff; }
              .sheet-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0E4A55; padding-bottom: 10px; margin-bottom: 12px; }
              .sheet-clinic-info { display: flex; gap: 10px; align-items: center; }
              .clinic-emblem { width: 34px; height: 34px; border-radius: 6px; background: #0E4A55; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; }
              .clinic-official-name { font-size: 13.5px; font-weight: bold; color: #0E4A55; margin: 0 0 2px 0; text-transform: uppercase; }
              .clinic-address, .clinic-sub-meta { font-size: 10.5px; color: #444; margin: 1px 0; }
              .sheet-audit-box { font-size: 10.5px; text-align: right; }
              .audit-row { margin-bottom: 2px; }
              .status-approved { background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9.5px; }
              .sheet-title-center { text-align: center; margin: 14px 0 16px 0; }
              .main-report-heading { font-size: 16px; font-weight: bold; color: #0E4A55; margin: 0 0 4px 0; text-transform: uppercase; }
              .main-report-sub { font-size: 11px; color: #666; font-style: italic; margin: 0; }
              .sheet-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
              .sheet-kpi-item { border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; background: #fafafa; }
              .kpi-title { font-size: 10px; color: #555; display: block; margin-bottom: 2px; }
              .kpi-number { font-size: 13px; font-weight: bold; color: #111; display: block; }
              .text-teal { color: #0E4A55; }
              .text-gold { color: #B8955A; }
              .text-burgundy { color: #9B3D45; }
              table.sheet-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
              table.sheet-table th, table.sheet-table td { border: 1px solid #bbb; padding: 5px 6px; }
              table.sheet-table th { background: #f0f4f5; color: #0E4A55; font-weight: bold; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .font-mono { font-family: monospace; }
              .table-total-row { background: #e9f2f4; font-weight: bold; }
              .table-tag-success { color: #15803d; font-weight: bold; }
              .table-tag-warn { color: #b45309; font-weight: bold; }
              .sheet-signatures { display: flex; justify-content: space-between; margin-top: 24px; page-break-inside: avoid; }
              .sig-column { width: 30%; text-align: center; }
              .sig-title { font-weight: bold; font-size: 11px; display: block; text-transform: uppercase; }
              .sig-instruction { font-size: 9.5px; font-style: italic; color: #666; display: block; margin-top: 2px; }
              .sig-placeholder { height: 45px; display: flex; align-items: center; justify-content: center; }
              .stamp-box { border: 2px dashed #0E4A55; color: #0E4A55; padding: 3px 6px; font-size: 9px; font-weight: bold; border-radius: 4px; }
              .sig-name { font-weight: bold; font-size: 11px; display: block; }
              .sheet-footer { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 6px; display: flex; justify-content: space-between; font-size: 9px; color: #777; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

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
    const printWindow = window.open('', '_blank', 'width=460,height=680');
    if (printWindow) {
      const itemsHtml = (bill.items || [])
        .map(
          (item, index) => `
        <tr>
          <td>${index + 1}. ${item.name}</td>
          <td style="text-align: center;">${item.quantity} ${item.unit || ''}</td>
          <td style="text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.amount)} ₫</td>
        </tr>
      `
        )
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Biên Lai Viện Phí #${bill.billCode}</title>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #111; margin: 0; padding: 18px; line-height: 1.4; background: #fff; }
              .header { text-align: center; border-bottom: 1px dashed #444; padding-bottom: 10px; margin-bottom: 10px; }
              .clinic-name { font-weight: bold; font-size: 14px; text-transform: uppercase; color: #0E4A55; margin: 0 0 3px; }
              .clinic-info { font-size: 11px; color: #555; margin: 2px 0; }
              .title { font-size: 16px; font-weight: bold; text-align: center; margin: 12px 0 4px; text-transform: uppercase; color: #0E4A55; }
              .sub-title { font-size: 11px; text-align: center; font-style: italic; margin-bottom: 12px; }
              .meta-box { margin-bottom: 12px; font-size: 12px; background: #fafafa; padding: 8px 10px; border-radius: 4px; border: 1px solid #eee; }
              .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
              table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
              th, td { padding: 4px 2px; }
              th { border-bottom: 1px solid #444; text-align: left; }
              .total-box { border-top: 1px dashed #444; border-bottom: 1px dashed #444; padding: 8px 0; margin: 10px 0; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
              .grand-total { font-weight: bold; font-size: 14px; color: #0E4A55; margin-top: 4px; padding-top: 4px; border-top: 1px solid #ddd; }
              .footer { text-align: center; font-size: 11px; margin-top: 18px; color: #444; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="clinic-name">Phòng Khám Đa Khoa Quốc Tế Smart Clinic</div>
              <div class="clinic-info">341/13A Khuông Việt, P. Phú Trung, Q. Tân Phú, TP.HCM</div>
              <div class="clinic-info">Hotline: 1900 6868 • Website: smartclinic.vn</div>
            </div>
            <div class="title">BIÊN LAI THU TIỀN VIỆN PHÍ</div>
            <div class="sub-title">Số HĐ: <strong>${bill.billCode}</strong> • STT khám: <strong>${bill.ticketNumber}</strong></div>
            <div class="meta-box">
              <div class="meta-row"><span>Bệnh nhân:</span> <strong>${bill.patientName}</strong></div>
              <div class="meta-row"><span>Mã BN:</span> <span>${bill.patientCode}</span></div>
              <div class="meta-row"><span>Phòng khám:</span> <span>${bill.roomName || ''}</span></div>
              <div class="meta-row"><span>Bác sĩ chỉ định:</span> <span>${bill.doctorName || ''}</span></div>
              <div class="meta-row"><span>Hình thức thanh toán:</span> <strong>${bill.paymentMethod === 'VIETQR' ? 'VietQR động' : 'Tiền mặt'}</strong></div>
              <div class="meta-row"><span>Thu ngân tiếp nhận:</span> <span>${bill.cashierName || this.currentCashierName()}</span></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Khoản mục</th>
                  <th style="text-align: center;">SL</th>
                  <th style="text-align: right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="total-box">
              <div class="total-row"><span>Tiền khám bệnh:</span> <span>${new Intl.NumberFormat('vi-VN').format(bill.consultationFee || 0)} ₫</span></div>
              <div class="total-row"><span>Tiền dịch vụ kỹ thuật:</span> <span>${new Intl.NumberFormat('vi-VN').format(bill.serviceFee || 0)} ₫</span></div>
              <div class="total-row"><span>Tiền thuốc:</span> <span>${new Intl.NumberFormat('vi-VN').format(bill.medicineFee || 0)} ₫</span></div>
              <div class="total-row grand-total"><span>TỔNG THANH TOÁN:</span> <span>${new Intl.NumberFormat('vi-VN').format(bill.totalAmount || 0)} ₫</span></div>
            </div>
            <div class="footer">
              <p>Cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ tại Smart Clinic!</p>
              <p style="font-style: italic;">(Biên lai điện tử trích xuất từ Hệ thống Smart Clinic EMR)</p>
            </div>
            <script>
              window.onload = function() { window.print(); };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
}
