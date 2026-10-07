import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QueueService } from '../../../core/services/queue.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-patient-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusTagComponent, ClinicIconComponent],
  template: `
    <div class="patient-queue-container animate-fade-in-up">
      <!-- Header -->
      <div class="queue-header">
        <span class="header-badge font-serif">TIẾN TRÌNH THỜI GIAN THỰC</span>
        <h1 class="page-title font-serif">Theo Dõi Lượt Khám & Số Thứ Tự</h1>
        <p class="page-subtitle">
          Thông tin hàng đợi trực tiếp tại phòng khám. Dữ liệu được đồng bộ liên tục theo thời gian thực.
        </p>
      </div>

      <!-- Main Live Ticket Big Card -->
      <div class="live-ticket-card clinic-card">
        <div class="card-status-bar">
          <div class="live-indicator">
            <span class="pulse-gold-dot"></span>
            <span class="live-text">ĐANG KẾT NỐI HỆ THỐNG ĐIỀU PHỐI PHÒNG KHÁM</span>
          </div>
          <app-status-tag [status]="myTicket().status"></app-status-tag>
        </div>

        <div class="ticket-visual-grid">
          <!-- Big Ticket Section -->
          <div class="ticket-badge-box">
            <span class="tb-label">SỐ THỨ TỰ CỦA QUÝ KHÁCH</span>
            <span class="tb-number font-serif pulse-gold">{{ myTicket().ticketNumber }}</span>
            <span class="tb-time">Giờ check-in: {{ myTicket().checkinTime | date: 'HH:mm' }}</span>
          </div>

          <!-- Queue Progress & Position -->
          <div class="queue-progress-zone">
            <div class="progress-stats">
              <div class="stat-box">
                <span class="st-label">Số đang được khám:</span>
                <span class="st-val text-teal font-serif">{{ currentCallingNumber() }}</span>
              </div>
              <div class="stat-box">
                <span class="st-label">Người còn lại phía trước:</span>
                <span class="st-val text-gold font-bold">{{ peopleAhead() }} người</span>
              </div>
              <div class="stat-box">
                <span class="st-label">Dự kiến vào khám lúc:</span>
                <span class="st-val font-bold">{{ myTicket().estimatedTime || '09:30' }}</span>
              </div>
            </div>

            <!-- Stepper 3 states: WAITING -> IN_PROGRESS -> COMPLETED -->
            <div class="queue-stepper-3">
              <div class="step-3-item" [class.active]="myTicket().status === 'WAITING'" [class.done]="myTicket().status === 'IN_PROGRESS' || myTicket().status === 'COMPLETED'">
                <div class="step-circle">
                  @if (myTicket().status !== 'WAITING') {
                    <app-clinic-icon name="check" [size]="14"></app-clinic-icon>
                  } @else {
                    1
                  }
                </div>
                <div class="step-info">
                  <strong>1. Chờ gọi số (WAITING)</strong>
                  <small>Ngồi tại sảnh chờ trước phòng khám</small>
                </div>
              </div>
              <div class="step-line" [class.filled]="myTicket().status === 'IN_PROGRESS' || myTicket().status === 'COMPLETED'"></div>

              <div class="step-3-item" [class.active]="myTicket().status === 'IN_PROGRESS'" [class.done]="myTicket().status === 'COMPLETED'">
                <div class="step-circle">
                  @if (myTicket().status === 'COMPLETED') {
                    <app-clinic-icon name="check" [size]="14"></app-clinic-icon>
                  } @else {
                    2
                  }
                </div>
                <div class="step-info">
                  <strong>2. Đang khám (IN_PROGRESS)</strong>
                  <small>Bác sĩ đang thăm khám lâm sàng</small>
                </div>
              </div>
              <div class="step-line" [class.filled]="myTicket().status === 'COMPLETED'"></div>

              <div class="step-3-item" [class.active]="myTicket().status === 'COMPLETED'" [class.done]="myTicket().status === 'COMPLETED'">
                <div class="step-circle">3</div>
                <div class="step-info">
                  <strong>3. Hoàn tất (COMPLETED)</strong>
                  <small>Nhận đơn thuốc & ra quầy viện phí</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Room & Doctor Info Bar -->
        <div class="doctor-room-bar">
          <div class="r-item">
            <span class="r-icon">
              <app-clinic-icon name="medical-cross" [size]="18" color="#0E4A55"></app-clinic-icon>
            </span>
            <div>
              <span class="r-sub">Phòng khám:</span>
              <strong>{{ myTicket().roomName }} (Tầng 1)</strong>
            </div>
          </div>
          <div class="r-item">
            <span class="r-icon">
              <app-clinic-icon name="stethoscope" [size]="18" color="#0E4A55"></app-clinic-icon>
            </span>
            <div>
              <span class="r-sub">Bác sĩ khám:</span>
              <strong>{{ myTicket().doctorName || 'TS.BS Trần Minh Hoàng' }}</strong>
            </div>
          </div>
          <div class="r-item">
            <span class="r-icon">
              <app-clinic-icon name="clipboard" [size]="18" color="#0E4A55"></app-clinic-icon>
            </span>
            <div>
              <span class="r-sub">Dịch vụ:</span>
              <strong>Khám Chuyên Khoa Tim Mạch</strong>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="ticket-action-row">
          <button class="btn-print-k80" (click)="printK80()">
            <app-clinic-icon name="download" [size]="14"></app-clinic-icon>
            <span>In Phiếu Khám (K80)</span>
          </button>
          @if (myTicket().status === 'WAITING') {
            <button class="btn-reschedule" (click)="showRescheduleModal.set(true)">
              Dời Lịch Hẹn
            </button>
            <button class="btn-cancel-ticket" (click)="cancelAppointment()">
              Hủy Hẹn Khám
            </button>
          }
        </div>
      </div>

      <!-- Upcoming Appointments Section (UC03) -->
      <div class="appointments-section mt-5">
        <div class="section-top">
          <h2 class="sec-title font-serif">Danh Sách Lịch Hẹn Đã Đăng Ký</h2>
          <a routerLink="/patient/booking" class="btn-book-new">
            <app-clinic-icon name="plus" [size]="14"></app-clinic-icon>
            <span>Đăng ký thêm lịch hẹn</span>
          </a>
        </div>

        <div class="appointments-list">
          @for (apt of myAppointments(); track apt.id) {
            <div class="apt-card clinic-card">
              <div class="apt-left">
                <span class="apt-code">{{ apt.appointmentCode }}</span>
                <h3 class="apt-dept">{{ apt.department }}</h3>
                <span class="apt-doc">Bác sĩ: <strong>{{ apt.doctorName }}</strong></span>
                <p class="apt-reason text-muted">{{ apt.reasonForVisit }}</p>
              </div>

              <div class="apt-center">
                <div class="time-pill">
                  <span class="tp-date">
                    <app-clinic-icon name="calendar" [size]="13"></app-clinic-icon>
                    <span>{{ apt.appointmentDate }}</span>
                  </span>
                  <span class="tp-slot">
                    <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
                    <span>{{ apt.timeSlot }}</span>
                  </span>
                </div>
              </div>

              <div class="apt-right">
                <app-status-tag [status]="apt.status === 'CONFIRMED' || apt.status === 'PENDING' ? 'WAITING' : apt.status === 'CHECKED_IN' ? 'IN_PROGRESS' : 'CANCELLED'"></app-status-tag>
                <div class="apt-btns mt-2">
                  @if (apt.status === 'CONFIRMED') {
                    <button class="btn-sm-cancel" (click)="cancelApt(apt.id)">Hủy</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Reschedule Modal -->
      @if (showRescheduleModal()) {
        <div class="modal-overlay" (click)="showRescheduleModal.set(false)">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="m-title font-serif">Dời Lịch Hẹn Khám</h3>
              <button class="btn-close" (click)="showRescheduleModal.set(false)">
                <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
              </button>
            </div>
            <div class="modal-body">
              <p class="m-desc">
                Quy định phòng khám: Quý khách được quyền dời lịch hẹn trước khung giờ khám khi chưa hoàn tất thủ tục check-in tại quầy.
              </p>
              <div class="form-group">
                <label class="f-label">Chọn ngày mới:</label>
                <select class="f-select" [(ngModel)]="newRescheduleDate">
                  <option value="07/10/2026">Ngày mai (07/10/2026)</option>
                  <option value="08/10/2026">Thứ Năm (08/10/2026)</option>
                  <option value="09/10/2026">Thứ Sáu (09/10/2026)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="f-label">Chọn khung giờ mới:</label>
                <select class="f-select" [(ngModel)]="newRescheduleSlot">
                  <option value="08:30 - 09:00">Ca sáng: 08:30 - 09:00</option>
                  <option value="10:00 - 10:30">Ca sáng: 10:00 - 10:30</option>
                  <option value="14:00 - 14:30">Ca chiều: 14:00 - 14:30</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showRescheduleModal.set(false)">Đóng</button>
              <button class="btn-confirm" (click)="submitReschedule()">Xác Nhận Dời Lịch</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .patient-queue-container {
        max-width: 1100px;
        margin: 0 auto;
        padding-bottom: 40px;
      }

      .queue-header {
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

      /* Live Ticket Big Card */
      .live-ticket-card {
        background: #FFFFFF;
        border: 2px solid #E4DED2;
        border-radius: 20px;
        padding: 32px;
        box-shadow: 0 12px 32px rgba(28, 39, 51, 0.07);
        position: relative;
        overflow: hidden;
      }

      .card-status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #F0EAE1;
      }

      .live-indicator {
        display: flex;
        align-items: center;
        gap: 8px;

        .pulse-gold-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #B8955A;
          box-shadow: 0 0 0 3px rgba(184, 149, 90, 0.3);
        }

        .live-text {
          font-size: 0.76rem;
          font-weight: 700;
          color: #0E4A55;
          letter-spacing: 0.05em;
        }
      }

      .ticket-visual-grid {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 32px;
        align-items: center;
        margin-bottom: 28px;
      }

      @media (max-width: 860px) {
        .ticket-visual-grid {
          grid-template-columns: 1fr;
        }
      }

      .ticket-badge-box {
        background: linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%);
        border: 2px solid #B8955A;
        border-radius: 18px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 8px 20px rgba(184, 149, 90, 0.15);

        .tb-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #8C6D34;
          letter-spacing: 0.06em;
        }

        .tb-number {
          font-size: 3.5rem;
          font-weight: 700;
          color: #0E4A55;
          line-height: 1.1;
          margin: 6px 0;
          display: block;
        }

        .tb-time {
          font-size: 0.8rem;
          color: #5B6672;
        }
      }

      .queue-progress-zone {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .progress-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        border-radius: 14px;
        padding: 16px;
      }

      .stat-box {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .st-label {
          font-size: 0.74rem;
          color: #8C96A2;
        }

        .st-val {
          font-size: 1.25rem;
          color: #1C2733;
        }
      }

      /* Stepper 3 states */
      .queue-stepper-3 {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .step-3-item {
        display: flex;
        align-items: center;
        gap: 10px;

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #EAE6DF;
          color: #5B6672;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-info {
          display: flex;
          flex-direction: column;

          strong {
            font-size: 0.82rem;
            color: #5B6672;
          }

          small {
            font-size: 0.7rem;
            color: #8C96A2;
          }
        }

        &.active {
          .step-circle {
            background: #B8955A;
            color: #FFFFFF;
            box-shadow: 0 0 0 4px rgba(184, 149, 90, 0.25);
          }
          .step-info strong {
            color: #8C6D34;
          }
        }

        &.done {
          .step-circle {
            background: #5E8B7E;
            color: #FFFFFF;
          }
          .step-info strong {
            color: #2F5A4F;
          }
        }
      }

      .step-line {
        flex: 1;
        height: 2px;
        background: #E4DED2;
        margin: 0 12px;

        &.filled {
          background: #5E8B7E;
        }
      }

      /* Room & Doctor bar */
      .doctor-room-bar {
        display: flex;
        justify-content: space-around;
        background: #FAF8F5;
        border: 1px solid #E2DCD0;
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 28px;
        flex-wrap: wrap;
        gap: 20px;

        .r-item {
          display: flex;
          align-items: center;
          gap: 14px;

          .r-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: rgba(14, 74, 85, 0.08);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .r-sub {
            font-size: 0.75rem;
            color: #8C96A2;
            display: block;
            margin-bottom: 2px;
          }

          strong {
            font-size: 0.95rem;
            color: #1C2733;
          }
        }
      }

      .ticket-action-row {
        display: flex;
        justify-content: flex-end;
        gap: 14px;

        button {
          padding: 11px 22px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-print-k80 {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #0E4A55;
          color: #FFFFFF;
          border: none;

          &:hover {
            background: #135d6b;
          }
        }

        .btn-reschedule {
          background: #FFFFFF;
          border: 1px solid #E2DCD0;
          color: #1C2733;

          &:hover {
            background: #FAF8F5;
            border-color: #0E4A55;
          }
        }

        .btn-cancel-ticket {
          background: transparent;
          border: 1px solid rgba(155, 61, 69, 0.4);
          color: #9B3D45;

          &:hover {
            background: rgba(155, 61, 69, 0.08);
          }
        }
      }

      /* Upcoming Appointments */
      .section-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        .sec-title {
          font-size: 1.45rem;
          color: #1C2733;
          margin: 0;
        }

        .btn-book-new {
          background: #0E4A55;
          color: #FFFFFF;
          padding: 10px 20px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.88rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(14, 74, 85, 0.2);
          transition: all 0.2s ease;

          &:hover {
            background: #135d6b;
            transform: translateY(-1px);
          }
        }
      }

      .appointments-list {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .apt-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 22px 28px;
        background: #FFFFFF;
        border: 1px solid #E2DCD0;
        border-radius: 16px;
        flex-wrap: wrap;
        gap: 24px;
        box-shadow: 0 4px 16px rgba(28, 39, 51, 0.04);
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
          box-shadow: 0 8px 24px rgba(28, 39, 51, 0.08);
          transform: translateY(-2px);
        }

        .apt-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 260px;

          .apt-code {
            font-family: monospace;
            font-size: 0.78rem;
            color: #8C96A2;
            font-weight: 700;
            letter-spacing: 0.05em;
          }

          .apt-dept {
            margin: 0;
            font-size: 1.18rem;
            color: #1C2733;
            font-weight: 700;
          }

          .apt-doc {
            font-size: 0.88rem;
            color: #5B6672;
          }

          .apt-reason {
            font-size: 0.84rem;
            color: #7A8694;
            margin: 2px 0 0 0;
            line-height: 1.45;
          }
        }

        .apt-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .time-pill {
          background: #FAF8F5;
          border: 1px solid #E2DCD0;
          padding: 12px 22px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 155px;
          box-shadow: 0 2px 6px rgba(28, 39, 51, 0.02);

          .tp-date {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            font-weight: 700;
            color: #0E4A55;

            app-clinic-icon {
              color: #0E4A55;
            }

            span {
              margin-left: 0 !important;
            }
          }

          .tp-slot {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.84rem;
            color: #8C6D34;
            font-weight: 600;

            app-clinic-icon {
              color: #8C6D34;
            }

            span {
              margin-left: 0 !important;
            }
          }
        }

        .apt-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          min-width: 120px;

          .apt-btns {
            margin-top: 0;
          }

          .btn-sm-cancel {
            background: #FFFFFF;
            border: 1px solid #E2DCD0;
            color: #9B3D45;
            padding: 6px 16px;
            border-radius: 10px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background: rgba(155, 61, 69, 0.08);
              border-color: #9B3D45;
            }
          }
        }
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.65);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }

      .modal-box {
        background: #FFFFFF;
        width: 100%;
        max-width: 480px;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
        border: 1px solid #E4DED2;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .m-title {
          margin: 0;
          font-size: 1.15rem;
          color: #1C2733;
        }

        .btn-close {
          background: transparent;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
        }
      }

      .modal-body {
        margin-bottom: 20px;

        .m-desc {
          font-size: 0.82rem;
          color: #5B6672;
          margin-bottom: 14px;
          line-height: 1.4;
        }

        .form-group {
          margin-bottom: 12px;

          .f-label {
            display: block;
            font-size: 0.82rem;
            font-weight: 600;
            color: #1C2733;
            margin-bottom: 4px;
          }

          .f-select {
            width: 100%;
            border: 1px solid #D5CDBD;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 0.88rem;
            outline: none;
            background: #FAF8F5;

            &:focus {
              border-color: #0E4A55;
              background: #FFFFFF;
            }
          }
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;

        button {
          padding: 8px 16px;
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

        .btn-confirm {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
        }
      }
    `,
  ],
})
export class PatientQueueComponent {
  private queueService = inject(QueueService);
  private authService = inject(AuthService);

  showRescheduleModal = signal(false);
  newRescheduleDate = '07/10/2026';
  newRescheduleSlot = '08:30 - 09:00';

  // Active patient ticket (A-015 for demo user Phạm Văn An)
  myTicket = signal<any>({
    id: 'q-patient-active',
    ticketNumber: 'A-015',
    patientName: 'Phạm Văn An',
    patientCode: 'BN-2026-0891',
    status: 'WAITING',
    priority: 'NORMAL',
    roomName: 'Phòng khám Nội 101',
    doctorName: 'TS.BS Trần Minh Hoàng',
    checkinTime: new Date().toISOString(),
    estimatedTime: '09:30',
  });

  // Current calling ticket in the room
  currentCallingNumber = signal('A-012');
  peopleAhead = signal(2);

  // All appointments of current patient
  myAppointments = computed(() => {
    const list = this.queueService.appointments();
    return list.slice(0, 4);
  });

  printK80(): void {
    window.print();
  }

  cancelAppointment(): void {
    if (confirm('Quý khách có chắc chắn muốn hủy lượt khám này không?')) {
      this.myTicket.update((t) => ({ ...t, status: 'CANCELLED' }));
    }
  }

  cancelApt(id: string): void {
    if (confirm('Quý khách có chắc chắn muốn hủy lịch hẹn này?')) {
      this.queueService.cancelAppointment(id);
    }
  }

  submitReschedule(): void {
    this.myTicket.update((t) => ({
      ...t,
      estimatedTime: this.newRescheduleSlot.split(' - ')[0],
    }));
    this.showRescheduleModal.set(false);
    alert(`Đã dời lịch hẹn thành công sang ngày ${this.newRescheduleDate} (${this.newRescheduleSlot}).`);
  }
}
