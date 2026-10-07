import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueueService } from '../../../core/services/queue.service';
import { QueueTicket, QueueStatus } from '../../../core/models/queue.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { QueueTicketComponent } from '../../../shared/components/queue-ticket/queue-ticket.component';
import { ViDatePipe } from '../../../shared/pipes/vi-date.pipe';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-reception-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusTagComponent,
    QueueTicketComponent,
    ViDatePipe,
    ClinicIconComponent,
  ],
  template: `
    <app-page-header
      badgeText="ĐIỀU PHỐI HÀNG ĐỢI REALTIME"
      title="Bảng Điều Phối Hàng Đợi Khám Bệnh"
      subtitle="Theo dõi luồng 3 trạng thái chuẩn: Chờ khám → Đang khám → Đã khám. Điều phối ca ưu tiên cấp cứu lên đầu hàng đợi."
    >
      <div actions>
        <button (click)="openTicketPrint(selectedTicket() || queueTickets()[0])" class="btn-print-k80">
          <app-clinic-icon name="receipt" [size]="16"></app-clinic-icon>
          <span>In lại phiếu K80</span>
        </button>
      </div>
    </app-page-header>

    <!-- Top Realtime KPI Cards -->
    <div class="kpi-grid">
      <app-stat-card
        title="Tổng lượt đăng ký hôm nay"
        [value]="totalTickets()"
        unit="ca"
        subText="Thời gian thực cập nhật"
        iconName="users"
      ></app-stat-card>

      <app-stat-card
        title="Đang chờ khám (WAITING)"
        [value]="waitingCount()"
        unit="người"
        subText="Thời gian chờ TB: 18 phút"
        iconName="clock"
        iconBg="rgba(184, 149, 90, 0.15)"
        iconColor="#B8955A"
        [isHighlight]="true"
      ></app-stat-card>

      <app-stat-card
        title="Đang trong phòng khám (IN_PROGRESS)"
        [value]="inProgressCount()"
        unit="phòng"
        subText="Có tín hiệu pulse realtime"
        iconName="stethoscope"
        iconBg="rgba(14, 74, 85, 0.15)"
        iconColor="#0E4A55"
      ></app-stat-card>

      <app-stat-card
        title="Đã hoàn tất khám (COMPLETED)"
        [value]="completedCount()"
        unit="ca"
        subText="Hồ sơ đã được lưu trữ"
        iconName="check"
        iconBg="rgba(94, 139, 126, 0.15)"
        iconColor="#5E8B7E"
      ></app-stat-card>
    </div>

    <!-- Big Calling Board (Màn hình gọi số lớn tại sảnh chờ) -->
    <div class="clinic-card calling-board-card">
      <div class="board-header">
        <div class="live-status-pill">
          <span class="live-dot pulse-gold"></span>
          <span>BẢNG HIỂN THỊ SỐ THỨ TỰ ĐANG GỌI TẠI SẢNH CHỜ (REALTIME)</span>
        </div>
        <span class="sync-time">Đồng bộ STOMP WebSocket: <strong>Hoạt động</strong></span>
      </div>

      <div class="rooms-call-grid">
        @for (item of currentCallingTickets(); track item.id) {
          <div class="room-call-box">
            <span class="rc-room-title">{{ item.roomName }}</span>
            <div class="rc-ticket-wrap pulse-gold">
              <span class="rc-number font-serif">{{ item.ticketNumber }}</span>
            </div>
            <span class="rc-patient-name">{{ item.patientName }}</span>
            <span class="rc-doctor">{{ item.doctorName }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Queue Management Table -->
    <div class="clinic-card queue-table-container">
      <div class="filter-header-row">
        <div>
          <h3 class="clinic-section-title">Danh Sách Bệnh Nhân Trong Hàng Đợi</h3>
          <p class="section-sub">Đúng 3 trạng thái nghiệp vụ chuẩn: Chờ khám → Đang khám → Đã khám.</p>
        </div>

        <div class="filter-pills-bar">
          <button
            type="button"
            class="f-pill"
            [class.active]="statusFilter() === 'ALL'"
            (click)="statusFilter.set('ALL')"
          >
            Tất cả ({{ totalTickets() }})
          </button>
          <button
            type="button"
            class="f-pill"
            [class.active]="statusFilter() === 'WAITING'"
            (click)="statusFilter.set('WAITING')"
          >
            Chờ khám ({{ waitingCount() }})
          </button>
          <button
            type="button"
            class="f-pill"
            [class.active]="statusFilter() === 'IN_PROGRESS'"
            (click)="statusFilter.set('IN_PROGRESS')"
          >
            Đang khám ({{ inProgressCount() }})
          </button>
          <button
            type="button"
            class="f-pill"
            [class.active]="statusFilter() === 'COMPLETED'"
            (click)="statusFilter.set('COMPLETED')"
          >
            Đã khám ({{ completedCount() }})
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="clinic-data-table">
          <thead>
            <tr>
              <th>Số thứ tự</th>
              <th>Mã bệnh nhân</th>
              <th>Họ và tên</th>
              <th>Giới tính / Tuổi</th>
              <th>Phòng khám & Bác sĩ</th>
              <th>Thời gian tiếp nhận</th>
              <th>Dự kiến gọi</th>
              <th>Mức ưu tiên</th>
              <th>Trạng thái</th>
              <th class="text-right">Điều phối hàng đợi</th>
            </tr>
          </thead>
          <tbody>
            @for (ticket of filteredTickets(); track ticket.id) {
              <tr [class.calling-row]="ticket.status === 'IN_PROGRESS'">
                <td>
                  <span
                    class="stt-badge font-serif"
                    [class.pulse-gold]="ticket.status === 'IN_PROGRESS'"
                    [class.stt-waiting]="ticket.status === 'WAITING'"
                  >
                    {{ ticket.ticketNumber }}
                  </span>
                </td>
                <td class="font-bold text-secondary-slate">{{ ticket.patientCode }}</td>
                <td>
                  <div class="p-info-cell">
                    <span class="p-name font-bold">{{ ticket.patientName }}</span>
                    <span class="p-phone">{{ ticket.phone }}</span>
                  </div>
                </td>
                <td>
                  {{ ticket.gender === 'NAM' ? 'Nam' : 'Nữ' }} • {{ 2026 - ticket.yearOfBirth }} tuổi
                </td>
                <td>
                  <div class="room-info-cell">
                    <span class="room-name">{{ ticket.roomName }}</span>
                    <span class="doc-name">{{ ticket.doctorName }}</span>
                  </div>
                </td>
                <td>{{ ticket.checkinTime | viDate : 'time' }}</td>
                <td class="tabular-nums font-bold">{{ ticket.estimatedTime || '--' }}</td>
                <td>
                  <app-status-tag [status]="ticket.priority"></app-status-tag>
                </td>
                <td>
                  <app-status-tag [status]="ticket.status"></app-status-tag>
                </td>
                <td class="text-right">
                  <div class="action-buttons-wrap">
                    <!-- Promote priority button (Only for WAITING) -->
                    @if (ticket.status === 'WAITING' && ticket.priority !== 'EMERGENCY') {
                      <button
                        (click)="promoteToTop(ticket)"
                        class="btn-promote"
                        title="Đưa ca ưu tiên lên đầu hàng đợi"
                      >
                        Ưu tiên hàng đầu
                      </button>
                    }

                    <!-- Transition to In-Progress button -->
                    @if (ticket.status === 'WAITING') {
                      <button
                        (click)="callTicket(ticket)"
                        class="btn-call"
                        title="Gọi vào phòng khám"
                      >
                        Gọi vào khám
                      </button>
                    }

                    <!-- Print K80 -->
                    <button
                      (click)="openTicketPrint(ticket)"
                      class="btn-print-mini"
                      title="In phiếu K80"
                    >
                      <app-clinic-icon name="download" [size]="14"></app-clinic-icon>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ticket print modal -->
    @if (selectedTicket()) {
      <app-queue-ticket
        [ticket]="selectedTicket()!"
        (close)="selectedTicket.set(null)"
      ></app-queue-ticket>
    }
  `,
  styles: [
    `
      .btn-print-k80 {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 9px 18px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(14, 74, 85, 0.25);

        &:hover {
          background: #135d6b;
        }
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      @media (max-width: 1200px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      // Calling Board
      .calling-board-card {
        padding: 24px 28px;
        background: linear-gradient(135deg, #1C2733 0%, #15333C 100%);
        color: #FFFFFF;
        margin-bottom: 24px;
      }

      .board-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-wrap: wrap;
        gap: 10px;
      }

      .live-status-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #B8955A;

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #B8955A;
        }
      }

      .sync-time {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.6);
        strong {
          color: #5E8B7E;
        }
      }

      .rooms-call-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 20px;
      }

      .room-call-box {
        background: rgba(255, 255, 255, 0.06);
        border: 1.5px solid rgba(184, 149, 90, 0.35);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        backdrop-filter: blur(8px);
      }

      .rc-room-title {
        font-size: 0.88rem;
        color: #B8955A;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .rc-ticket-wrap {
        background: #0E4A55;
        border: 2px solid #B8955A;
        border-radius: 14px;
        padding: 8px 24px;
        margin-bottom: 12px;
      }

      .rc-number {
        font-size: 2.8rem;
        font-weight: 800;
        color: #FFFFFF;
        line-height: 1.1;
      }

      .rc-patient-name {
        font-size: 1.05rem;
        font-weight: 600;
        color: #FFFFFF;
        margin-bottom: 4px;
      }

      .rc-doctor {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.65);
      }

      // Queue Table
      .queue-table-container {
        padding: 24px;
        background: #FFFFFF;
      }

      .filter-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 16px;
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
        overflow-x: auto;
      }

      .clinic-data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.86rem;

        th {
          background: #FAF8F5;
          color: #5B6672;
          font-weight: 600;
          text-align: left;
          padding: 12px 14px;
          border-bottom: 1.5px solid #E4DED2;
          white-space: nowrap;
        }

        td {
          padding: 14px 14px;
          border-bottom: 1px solid #F0EAE1;
          vertical-align: middle;
        }

        tr.calling-row td {
          background: rgba(14, 74, 85, 0.04);
        }
      }

      .stt-badge {
        font-size: 1.15rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 8px;
        display: inline-block;
        background: rgba(14, 74, 85, 0.1);
        color: #0E4A55;
        border: 1px solid rgba(14, 74, 85, 0.25);

        &.stt-waiting {
          background: rgba(184, 149, 90, 0.12);
          color: #8C6C32;
          border-color: rgba(184, 149, 90, 0.3);
        }
      }

      .p-info-cell, .room-info-cell {
        display: flex;
        flex-direction: column;
      }

      .p-name {
        color: #1C2733;
      }

      .p-phone, .doc-name {
        font-size: 0.74rem;
        color: #8C96A2;
      }

      .room-name {
        font-weight: 500;
        color: #1C2733;
      }

      .action-buttons-wrap {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-promote {
        background: rgba(184, 149, 90, 0.15);
        color: #8C6C32;
        border: 1px solid #B8955A;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #B8955A;
          color: #FFFFFF;
        }
      }

      .btn-call {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #135d6b;
        }
      }

      .btn-print-mini {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        padding: 5px 8px;
        border-radius: 8px;
        cursor: pointer;

        &:hover {
          border-color: #0E4A55;
        }
      }

      .text-right {
        text-align: right;
      }
    `,
  ],
})
export class ReceptionQueueComponent {
  private queueService = inject(QueueService);

  queueTickets = this.queueService.queueTickets;
  totalTickets = this.queueService.totalTickets;
  waitingCount = this.queueService.waitingCount;
  inProgressCount = this.queueService.inProgressCount;
  completedCount = this.queueService.completedCount;
  currentCallingTickets = this.queueService.currentCallingTickets;

  statusFilter = signal<string>('ALL');
  selectedTicket = signal<QueueTicket | null>(null);

  filteredTickets = computed(() => {
    const list = this.queueTickets();
    const filter = this.statusFilter();
    if (filter === 'ALL') return list;
    return list.filter((t) => t.status === filter);
  });

  promoteToTop(ticket: QueueTicket): void {
    this.queueService.promoteToTop(ticket.id).subscribe();
  }

  callTicket(ticket: QueueTicket): void {
    this.queueService.updateTicketStatus(ticket.id, 'IN_PROGRESS').subscribe();
  }

  openTicketPrint(ticket: QueueTicket): void {
    this.selectedTicket.set(ticket);
  }
}
