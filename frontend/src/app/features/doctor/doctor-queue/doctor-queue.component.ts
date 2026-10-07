import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { QueueService } from '../../../core/services/queue.service';
import { MedicalService } from '../../../core/services/medical.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-doctor-queue',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusTagComponent,
    ClinicIconComponent,
  ],
  template: `
    <div class="doctor-queue-page">
      <app-page-header
        badgeText="PHÒNG KHÁM NỘI 101"
        title="Quản Lý Hàng Đợi Bệnh Nhân"
        subtitle="TS.BS Trần Minh Hoàng • Ca sáng (07:30 - 11:30) • Hệ thống điều phối thời gian thực"
      >
        <div actions class="header-actions">
          <button class="btn-call-next pulse-gold" (click)="callNext()">
            <app-clinic-icon name="bell" [size]="16"></app-clinic-icon>
            <span>Gọi bệnh nhân kế tiếp</span>
          </button>
          <a routerLink="/doctor/workspace" class="btn-to-workspace">
            <app-clinic-icon name="activity" [size]="16"></app-clinic-icon>
            <span>Mở Clinical Workspace</span>
          </a>
        </div>
      </app-page-header>

      <!-- Stat Cards -->
      <div class="stats-row">
        <app-stat-card
          title="Đang chờ khám"
          [value]="waitingTickets().length"
          unit="bệnh nhân"
          iconName="clock"
          iconBg="rgba(184, 149, 90, 0.15)"
          iconColor="#B8955A"
          [isHighlight]="true"
        ></app-stat-card>

        <app-stat-card
          title="Đang trong phòng khám"
          [value]="inProgressTicket() ? 1 : 0"
          [unit]="inProgressTicket() ? inProgressTicket()!.ticketNumber : 'Không có'"
          [subText]="inProgressTicket() ? inProgressTicket()!.patientName : 'Phòng trống'"
          iconName="stethoscope"
          iconBg="rgba(14, 74, 85, 0.15)"
          iconColor="#0E4A55"
        ></app-stat-card>

        <app-stat-card
          title="Đã khám & Khóa EMR"
          [value]="completedTickets().length"
          unit="hồ sơ"
          iconName="lock"
          iconBg="rgba(94, 139, 126, 0.15)"
          iconColor="#5E8B7E"
          subText="Hồ sơ đã được lưu trữ an toàn"
        ></app-stat-card>
      </div>

      <!-- Filter bar -->
      <div class="filter-tab-bar">
        <button
          class="f-tab"
          [class.active]="statusFilter() === 'ALL'"
          (click)="statusFilter.set('ALL')"
        >
          Tất cả ({{ allTickets().length }})
        </button>
        <button
          class="f-tab"
          [class.active]="statusFilter() === 'WAITING'"
          (click)="statusFilter.set('WAITING')"
        >
          Chờ khám ({{ waitingTickets().length }})
        </button>
        <button
          class="f-tab"
          [class.active]="statusFilter() === 'IN_PROGRESS'"
          (click)="statusFilter.set('IN_PROGRESS')"
        >
          Đang khám ({{ inProgressTicket() ? 1 : 0 }})
        </button>
        <button
          class="f-tab"
          [class.active]="statusFilter() === 'COMPLETED'"
          (click)="statusFilter.set('COMPLETED')"
        >
          Đã khám xong ({{ completedTickets().length }})
        </button>
      </div>

      <!-- Queue Table -->
      <div class="queue-table-card">
        <table class="q-table">
          <thead>
            <tr>
              <th>Số Thứ Tự</th>
              <th>Họ Và Tên</th>
              <th>Mã Bệnh Nhân</th>
              <th>Dịch Vụ Khám</th>
              <th>Thời Gian Đến</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            @for (ticket of filteredTickets(); track ticket.id) {
              <tr [class.highlight-row]="ticket.status === 'IN_PROGRESS'">
                <td>
                  <span class="ticket-badge font-serif" [class.in-prog]="ticket.status === 'IN_PROGRESS'">
                    {{ ticket.ticketNumber }}
                  </span>
                </td>
                <td>
                  <strong>{{ ticket.patientName }}</strong>
                </td>
                <td><span class="text-muted">{{ ticket.patientId }}</span></td>
                <td>{{ ticket.roomName }}</td>
                <td>{{ ticket.checkinTime | date: 'HH:mm - dd/MM' }}</td>
                <td>
                  <app-status-tag [status]="ticket.status"></app-status-tag>
                </td>
                <td>
                  <div class="tbl-actions">
                    @if (ticket.status === 'WAITING') {
                      <button class="btn-call-item" (click)="callTicket(ticket)">
                        Gọi vào khám
                      </button>
                    }
                    <button class="btn-view-emr" (click)="openWorkspace(ticket)">
                      {{ ticket.status === 'COMPLETED' ? 'Xem bệnh án' : 'Khám bệnh' }} →
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                  Không có bệnh nhân nào trong danh sách lọc.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .doctor-queue-page {
        max-width: 1300px;
        margin: 0 auto;
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }

      .btn-call-next {
        background: #B8955A;
        color: #FFFFFF;
        border: none;
        padding: 10px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #a38249;
        }
      }

      .btn-to-workspace {
        background: #0E4A55;
        color: #FFFFFF;
        text-decoration: none;
        padding: 10px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;
        transition: background 0.2s;

        &:hover {
          background: #135d6b;
        }
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .filter-tab-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      .f-tab {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
        }

        &.active {
          background: #0E4A55;
          color: #FFFFFF;
          border-color: #0E4A55;
        }
      }

      .queue-table-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(28, 39, 51, 0.05);
      }

      .q-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;

        th {
          background: #F4EFEB;
          padding: 12px 18px;
          text-align: left;
          color: #5B6672;
          font-weight: 600;
          font-size: 0.82rem;
          border-bottom: 1px solid #E4DED2;
        }

        td {
          padding: 14px 18px;
          border-top: 1px solid #F0EAE1;
          color: #1C2733;
        }

        .highlight-row {
          background: rgba(184, 149, 90, 0.08);
        }

        .ticket-badge {
          font-size: 1.15rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(14, 74, 85, 0.08);
          color: #0E4A55;

          &.in-prog {
            background: #B8955A;
            color: #FFFFFF;
          }
        }

        .tbl-actions {
          display: flex;
          gap: 8px;
        }

        .btn-call-item {
          background: #B8955A;
          color: #FFFFFF;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-view-emr {
          background: #FFFFFF;
          border: 1px solid #D5CDBD;
          color: #0E4A55;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;

          &:hover {
            background: #FAF8F5;
          }
        }
      }
    `,
  ],
})
export class DoctorQueueComponent {
  private queueService = inject(QueueService);
  private medicalService = inject(MedicalService);
  private router = inject(Router);

  statusFilter = signal<'ALL' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  allTickets = this.queueService.queueTickets;
  waitingTickets = () => this.allTickets().filter((t) => t.status === 'WAITING');
  inProgressTicket = () => this.allTickets().find((t) => t.status === 'IN_PROGRESS');
  completedTickets = () => this.allTickets().filter((t) => t.status === 'COMPLETED');

  filteredTickets = () => {
    const f = this.statusFilter();
    if (f === 'ALL') return this.allTickets();
    return this.allTickets().filter((t) => t.status === f);
  };

  callNext(): void {
    const next = this.queueService.callNextPatient();
    if (next) {
      this.medicalService.loadRecordForTicket(next.ticketNumber, next.patientName, next.patientId);
      this.router.navigate(['/doctor/workspace']);
    }
  }

  callTicket(ticket: any): void {
    this.queueService.updateTicketStatus(ticket.id, 'IN_PROGRESS');
    this.medicalService.loadRecordForTicket(ticket.ticketNumber, ticket.patientName, ticket.patientId);
    this.router.navigate(['/doctor/workspace']);
  }

  openWorkspace(ticket: any): void {
    this.medicalService.loadRecordForTicket(ticket.ticketNumber, ticket.patientName, ticket.patientId);
    this.router.navigate(['/doctor/workspace']);
  }
}
