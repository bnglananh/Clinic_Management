import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueTicket } from '../../../core/models/queue.model';
import { ViDatePipe } from '../../pipes/vi-date.pipe';
import { ClinicIconComponent } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-queue-ticket',
  standalone: true,
  imports: [CommonModule, ViDatePipe, ClinicIconComponent],
  template: `
    <div class="ticket-modal-backdrop" (click)="close.emit()">
      <div class="ticket-wrapper" (click)="$event.stopPropagation()">
        <!-- Action bar on top (hidden when printing) -->
        <div class="ticket-actions no-print">
          <button (click)="printTicket()" class="print-btn">
            <app-clinic-icon name="download" [size]="14"></app-clinic-icon>
            <span>In Phiếu Khám (K80)</span>
          </button>
          <button (click)="close.emit()" class="close-btn">
            <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
            <span>Đóng</span>
          </button>
        </div>

        <!-- The K80 Thermal Receipt Paper Card -->
        <div class="k80-receipt" id="printable-k80-ticket">
          <!-- Receipt Header -->
          <div class="receipt-header">
            <div class="clinic-logo-mark">
              <app-clinic-icon name="medical-cross" [size]="20" color="#B8955A"></app-clinic-icon>
            </div>
            <h2 class="receipt-brand font-serif">SMART CLINIC EMR</h2>
            <p class="receipt-addr">120 Hai Bà Trưng, P. Bến Nghé, Quận 1, TP.HCM</p>
            <p class="receipt-hotline">Hotline: 1900 6868</p>
            <div class="receipt-divider"></div>
            <h3 class="receipt-title">PHIẾU SỐ THỨ TỰ KHÁM BỆNH</h3>
          </div>

          <!-- Big Ticket Number Box -->
          <div class="number-box">
            <span class="number-label">SỐ THỨ TỰ</span>
            <span class="big-number font-serif">{{ ticket.ticketNumber }}</span>
            @if (ticket.priority === 'EMERGENCY') {
              <span class="badge-priority badge-emergency">ƯU TIÊN CẤP CỨU</span>
            } @else if (ticket.priority === 'PRIORITY') {
              <span class="badge-priority badge-vip">ƯU TIÊN VIP</span>
            }
          </div>

          <!-- Info Details Table -->
          <div class="receipt-body">
            <div class="r-row">
              <span class="r-label">Họ và tên:</span>
              <span class="r-val font-bold">{{ ticket.patientName }}</span>
            </div>
            <div class="r-row">
              <span class="r-label">Mã bệnh nhân:</span>
              <span class="r-val">{{ ticket.patientCode }}</span>
            </div>
            <div class="r-row">
              <span class="r-label">Phòng khám:</span>
              <span class="r-val font-bold text-teal">{{ ticket.roomName }}</span>
            </div>
            @if (ticket.doctorName) {
              <div class="r-row">
                <span class="r-label">Bác sĩ phụ trách:</span>
                <span class="r-val">{{ ticket.doctorName }}</span>
              </div>
            }
            <div class="r-row">
              <span class="r-label">Tiếp nhận lúc:</span>
              <span class="r-val">{{ ticket.checkinTime | viDate : 'datetime' }}</span>
            </div>
            <div class="r-row">
              <span class="r-label">Dự kiến gọi số:</span>
              <span class="r-val font-bold">{{ ticket.estimatedTime || 'Đang cập nhật' }}</span>
            </div>
          </div>

          <!-- Barcode / QR Simulation -->
          <div class="receipt-footer">
            <div class="barcode-mock">
              <div class="bars"></div>
              <span class="barcode-num">{{ ticket.patientCode }} • {{ ticket.ticketNumber }}</span>
            </div>
            <p class="receipt-notice">
              Quý khách vui lòng ngồi chờ tại sảnh và theo dõi màn hình hiển thị số thứ tự.
            </p>
            <p class="receipt-thank font-serif">Kính chúc Quý khách an khang!</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ticket-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.65);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease;
      }

      .ticket-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        max-height: 90vh;
      }

      .ticket-actions {
        display: flex;
        gap: 12px;
      }

      .print-btn {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 10px 22px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(14, 74, 85, 0.3);
        transition: all 0.2s ease;

        &:hover {
          background: #135d6b;
        }
      }

      .close-btn {
        background: #FFFFFF;
        color: #5B6672;
        border: 1px solid #E4DED2;
        padding: 10px 18px;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;

        &:hover {
          border-color: #9B3D45;
          color: #9B3D45;
        }
      }

      // K80 Receipt Paper Simulation
      .k80-receipt {
        width: 320px;
        background: #FFFFFF;
        color: #1C2733;
        padding: 24px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 0.82rem;
        line-height: 1.4;
        position: relative;

        // Jagged edges paper simulation
        &::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          right: 0;
          height: 6px;
          background: radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%);
          background-size: 12px 12px;
        }
      }

      .receipt-header {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .clinic-logo-mark {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: #0E4A55;
        color: #B8955A;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 6px;
      }

      .receipt-brand {
        font-size: 1.15rem;
        font-weight: 700;
        color: #0E4A55;
        margin: 0;
        letter-spacing: 0.05em;
      }

      .receipt-addr, .receipt-hotline {
        font-size: 0.68rem;
        color: #5B6672;
        margin: 2px 0;
      }

      .receipt-divider {
        width: 100%;
        border-top: 1px dashed #A0AEC0;
        margin: 12px 0;
      }

      .receipt-title {
        font-size: 0.85rem;
        font-weight: 700;
        margin: 0 0 10px 0;
        color: #1C2733;
        letter-spacing: 0.04em;
      }

      .number-box {
        background: #FAF8F5;
        border: 2px dashed #0E4A55;
        border-radius: 10px;
        padding: 12px;
        text-align: center;
        margin-bottom: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .number-label {
        font-size: 0.68rem;
        font-weight: 700;
        color: #5B6672;
        letter-spacing: 0.08em;
      }

      .big-number {
        font-size: 2.8rem;
        font-weight: 800;
        color: #0E4A55;
        line-height: 1.1;
        margin: 2px 0;
      }

      .badge-priority {
        display: inline-block;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 999px;
        margin-top: 4px;
      }

      .badge-emergency {
        background: #9B3D45;
        color: #FFFFFF;
      }

      .badge-vip {
        background: #B8955A;
        color: #FFFFFF;
      }

      .receipt-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }

      .r-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .r-label {
        color: #5B6672;
        font-size: 0.78rem;
      }

      .r-val {
        color: #1C2733;
        text-align: right;
        max-width: 170px;
      }

      .font-bold {
        font-weight: 600;
      }

      .receipt-footer {
        text-align: center;
        border-top: 1px dashed #A0AEC0;
        padding-top: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .barcode-mock {
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .bars {
        width: 180px;
        height: 28px;
        background: repeating-linear-gradient(
          90deg,
          #000000 0px,
          #000000 2px,
          transparent 2px,
          transparent 4px,
          #000000 4px,
          #000000 5px,
          transparent 5px,
          transparent 8px
        );
      }

      .barcode-num {
        font-size: 0.65rem;
        color: #5B6672;
        font-family: monospace;
        letter-spacing: 0.08em;
      }

      .receipt-notice {
        font-size: 0.68rem;
        color: #718096;
        margin: 4px 0;
      }

      .receipt-thank {
        font-size: 0.85rem;
        font-style: italic;
        color: #0E4A55;
        margin: 4px 0 0 0;
      }

      // Print stylesheet
      @media print {
        body * {
          visibility: hidden;
        }
        .no-print {
          display: none !important;
        }
        .ticket-modal-backdrop {
          position: absolute;
          inset: 0;
          background: transparent !important;
          padding: 0;
        }
        #printable-k80-ticket, #printable-k80-ticket * {
          visibility: visible;
        }
        #printable-k80-ticket {
          position: absolute;
          left: 0;
          top: 0;
          width: 80mm;
          margin: 0;
          padding: 5mm;
          box-shadow: none;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class QueueTicketComponent {
  @Input({ required: true }) ticket!: QueueTicket;
  @Output() close = new EventEmitter<void>();

  printTicket(): void {
    window.print();
  }
}
