import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';
import { QueueService } from '../../../core/services/queue.service';
import { MedicalService } from '../../../core/services/medical.service';

@Component({
  selector: 'app-doctor-home',
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
    <app-page-header
      badgeText="PHÒNG KHÁM NỘI 101"
      title="Bàn Làm Việc Bác Sĩ Lâm Sàng"
      subtitle="TS.BS Trần Minh Hoàng • Chuyên khoa: Nội tổng quát • Ca làm việc: Sáng (07:30 - 11:30)"
    >
      <div actions class="header-actions">
        <button class="call-next-btn pulse-gold" (click)="onCallNext()">
          <app-clinic-icon name="bell" [size]="16"></app-clinic-icon>
          <span>Gọi bệnh nhân kế tiếp</span>
        </button>
        <a routerLink="/doctor/workspace" class="workspace-btn">
          <app-clinic-icon name="activity" [size]="16"></app-clinic-icon>
          <span>Vào Clinical Workspace</span>
        </a>
      </div>
    </app-page-header>

    <div class="doctor-stats-row">
      <app-stat-card
        title="Tổng bệnh nhân phân bổ"
        [value]="allTickets().length"
        unit="người"
        iconName="clipboard"
      ></app-stat-card>

      <app-stat-card
        title="Đang trong phòng khám"
        [value]="inProgressTicket() ? 1 : 0"
        [unit]="inProgressTicket() ? inProgressTicket()!.ticketNumber : 'Trống'"
        [subText]="inProgressTicket() ? inProgressTicket()!.patientName : 'Sẵn sàng tiếp nhận'"
        iconName="stethoscope"
        iconBg="rgba(14, 74, 85, 0.15)"
        iconColor="#0E4A55"
        [isHighlight]="true"
      ></app-stat-card>

      <app-stat-card
        title="Đang chờ trước cửa"
        [value]="waitingTickets().length"
        unit="người"
        iconName="clock"
        iconBg="rgba(184, 149, 90, 0.15)"
        iconColor="#B8955A"
      ></app-stat-card>

      <app-stat-card
        title="Đã khám & Đã khóa EMR"
        [value]="completedTickets().length"
        unit="hồ sơ"
        subText="Tuân thủ chuẩn bất biến BR-23"
        iconName="lock"
        iconBg="rgba(94, 139, 126, 0.15)"
        iconColor="#5E8B7E"
      ></app-stat-card>
    </div>

    <!-- Active Doctor Workspace Preview Card -->
    <div class="clinic-card current-patient-card">
      <div class="card-inner-split">
        <div class="patient-brief">
          <div class="calling-indicator">
            <span class="live-dot pulse-gold"></span>
            <span>BỆNH NHÂN ĐANG KHÁM HIỆN TẠI</span>
            <app-status-tag status="IN_PROGRESS"></app-status-tag>
          </div>
          <div class="p-header-main">
            <span class="ticket-big font-serif">{{ record().ticketNumber }}</span>
            <div>
              <h2 class="patient-name">{{ record().patientName }}</h2>
              <span class="patient-meta">
                {{ record().patientGender === 'MALE' ? 'Nam' : 'Nữ' }} • Mã hồ sơ: {{ record().patientCode }} • Sinh: {{ record().patientDob }}
              </span>
            </div>
          </div>

          <!-- Allergy Warning Banner -->
          <div class="allergy-alert">
            <app-clinic-icon name="alert-triangle" [size]="16" class="alert-icon"></app-clinic-icon>
            <div>
              <strong>TIỀN SỬ DỊ ỨNG THUỐC:</strong>
              <span>
                {{ record().allergies && record().allergies!.length > 0 ? record().allergies!.join(', ') : 'Chưa ghi nhận dị ứng thuốc.' }}
              </span>
            </div>
          </div>
        </div>

        <div class="quick-vitals">
          <div class="vital-item">
            <span class="v-label">Huyết áp</span>
            <span class="v-val text-burgundy font-bold">
              {{ record().vitals.bloodPressureSystolic }}/{{ record().vitals.bloodPressureDiastolic }}
            </span>
            <span class="v-unit">mmHg</span>
          </div>
          <div class="vital-item">
            <span class="v-label">Nhịp tim</span>
            <span class="v-val text-teal">{{ record().vitals.heartRate }}</span>
            <span class="v-unit">lần/phút</span>
          </div>
          <div class="vital-item">
            <span class="v-label">Nhiệt độ</span>
            <span class="v-val text-teal">{{ record().vitals.temperature }}</span>
            <span class="v-unit">°C</span>
          </div>
          <div class="vital-item">
            <span class="v-label">BMI</span>
            <span class="v-val text-teal">{{ record().vitals.bmi }}</span>
            <span class="v-unit">kg/m²</span>
          </div>
        </div>

        <div class="action-zone">
          <button class="enter-workspace-btn" (click)="openWorkspace()">
            <span>Mở Clinical Workspace Khám Bệnh Chi Tiết</span>
            <app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Navigation Hub -->
    <div class="quick-nav-row mt-4">
      <div class="nav-hub-card" (click)="openWorkspace()">
        <app-clinic-icon name="stethoscope" [size]="24" class="hub-icon"></app-clinic-icon>
        <div class="hub-content">
          <h4>Clinical Workspace 3 Cột</h4>
          <p>Màn hình khám tập trung: Sinh hiệu, ICD-10, Cận lâm sàng, Kê đơn & DDI Neo4j</p>
        </div>
        <span class="hub-arrow"><app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon></span>
      </div>

      <div class="nav-hub-card" routerLink="/doctor/queue">
        <app-clinic-icon name="clipboard" [size]="24" class="hub-icon"></app-clinic-icon>
        <div class="hub-content">
          <h4>Hàng Đợi Phòng Khám</h4>
          <p>Danh sách bệnh nhân chờ khám, thứ tự gọi số và điều phối phòng khám</p>
        </div>
        <span class="hub-arrow"><app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon></span>
      </div>

      <div class="nav-hub-card" routerLink="/doctor/history">
        <app-clinic-icon name="lock" [size]="24" class="hub-icon"></app-clinic-icon>
        <div class="hub-content">
          <h4>Lịch Sử Bệnh Án Đã Khóa</h4>
          <p>Kho hồ sơ EMR lưu trữ bất biến (BR-23), tra cứu và thêm phụ lục bổ sung</p>
        </div>
        <span class="hub-arrow"><app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon></span>
      </div>
    </div>
  `,
  styles: [
    `
      .header-actions {
        display: flex;
        gap: 12px;
      }

      .call-next-btn {
        background: #B8955A;
        color: #FFFFFF;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(184, 149, 90, 0.35);
        transition: all 0.2s ease;

        &:hover {
          background: #a38249;
        }
      }

      .workspace-btn {
        background: #0E4A55;
        color: #FFFFFF;
        text-decoration: none;
        padding: 10px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;

        &:hover {
          background: #135d6b;
        }
      }

      .doctor-stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      @media (max-width: 1200px) {
        .doctor-stats-row {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .current-patient-card {
        padding: 28px;
        border: 1.5px solid rgba(14, 74, 85, 0.25);
        background: linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%);
        border-radius: 16px;
        box-shadow: 0 4px 14px rgba(28, 39, 51, 0.05);
      }

      .card-inner-split {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 32px;
        flex-wrap: wrap;
      }

      .patient-brief {
        flex: 1.2;
        min-width: 320px;
      }

      .calling-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #0E4A55;
        margin-bottom: 10px;

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #B8955A;
        }
      }

      .p-header-main {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-bottom: 16px;
      }

      .ticket-big {
        font-size: 2.2rem;
        font-weight: 700;
        color: #0E4A55;
        background: rgba(14, 74, 85, 0.08);
        border: 1.5px solid rgba(14, 74, 85, 0.25);
        padding: 6px 16px;
        border-radius: 12px;
      }

      .patient-name {
        margin: 0;
        font-size: 1.5rem;
        color: #1C2733;
        font-weight: 600;
      }

      .patient-meta {
        font-size: 0.85rem;
        color: #5B6672;
      }

      .allergy-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(155, 61, 69, 0.1);
        border: 1px solid rgba(155, 61, 69, 0.3);
        border-radius: 10px;
        padding: 10px 14px;
        color: #9B3D45;
        font-size: 0.84rem;

        .alert-icon {
          font-size: 1.1rem;
        }
      }

      .quick-vitals {
        display: flex;
        gap: 16px;
        background: #FFFFFF;
        padding: 16px 20px;
        border-radius: 12px;
        border: 1px solid #E4DED2;
      }

      .vital-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 10px;

        &:not(:last-child) {
          border-right: 1px solid #F0EAE1;
        }

        .v-label {
          font-size: 0.75rem;
          color: #8C96A2;
          font-weight: 500;
        }

        .v-val {
          font-size: 1.35rem;
          font-weight: 700;
          color: #1C2733;
          margin: 4px 0 2px 0;
        }

        .v-unit {
          font-size: 0.72rem;
          color: #5B6672;
        }
      }

      .action-zone {
        display: flex;
        flex-direction: column;
      }

      .enter-workspace-btn {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 14px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(14, 74, 85, 0.25);

        &:hover {
          background: #135d6b;
          transform: translateY(-2px);
        }
      }

      .quick-nav-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: 24px;
      }

      @media (max-width: 900px) {
        .quick-nav-row {
          grid-template-columns: 1fr;
        }
      }

      .nav-hub-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 14px;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(14, 74, 85, 0.1);
        }

        .hub-icon {
          font-size: 2rem;
          background: rgba(14, 74, 85, 0.08);
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .hub-content {
          flex: 1;

          h4 {
            margin: 0 0 4px 0;
            font-size: 0.98rem;
            color: #1C2733;
            font-weight: 600;
          }

          p {
            margin: 0;
            font-size: 0.78rem;
            color: #5B6672;
            line-height: 1.4;
          }
        }

        .hub-arrow {
          font-size: 1.2rem;
          color: #B8955A;
          font-weight: bold;
        }
      }
    `,
  ],
})
export class DoctorHomeComponent {
  private queueService = inject(QueueService);
  private medicalService = inject(MedicalService);
  private router = inject(Router);

  record = this.medicalService.activeRecord;
  allTickets = this.queueService.queueTickets;
  waitingTickets = () => this.allTickets().filter((t) => t.status === 'WAITING');
  inProgressTicket = () => this.allTickets().find((t) => t.status === 'IN_PROGRESS');
  completedTickets = () => this.allTickets().filter((t) => t.status === 'COMPLETED');

  onCallNext(): void {
    const next = this.queueService.callNextPatient();
    if (next) {
      this.medicalService.loadRecordForTicket(next.ticketNumber, next.patientName, next.patientId);
      this.router.navigate(['/doctor/workspace']);
    }
  }

  openWorkspace(): void {
    this.router.navigate(['/doctor/workspace']);
  }
}
