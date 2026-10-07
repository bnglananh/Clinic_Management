import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-reception-home',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, StatCardComponent, StatusTagComponent, ClinicIconComponent],
  template: `
    <app-page-header
      badgeText="BÀN LỄ TÂN & ĐIỀU PHỐI"
      title="Tiếp Nhận & Điều Phối Hàng Đợi"
      subtitle="Quản lý tiếp nhận bệnh nhân, cấp phát số thứ tự khám, điều hướng buồng khám và thu ngân viện phí."
    >
      <div actions>
        <button class="action-btn-secondary">In danh sách chờ</button>
        <button class="action-btn-primary">+ Tiếp nhận bệnh nhân mới</button>
      </div>
    </app-page-header>

    <!-- Top Statistics Cards -->
    <div class="stats-grid">
      <app-stat-card
        title="Tổng bệnh nhân hôm nay"
        value="48"
        unit="người"
        subText="Tăng 12% so với hôm qua"
        trendText="12%"
        [trendPositive]="true"
        iconName="users"
        iconBg="rgba(14, 74, 85, 0.1)"
        iconColor="#0E4A55"
      ></app-stat-card>

      <app-stat-card
        title="Đang chờ khám (Waiting)"
        value="14"
        unit="ca"
        subText="Thời gian chờ TB: 18 phút"
        iconName="clock"
        iconBg="rgba(184, 149, 90, 0.15)"
        iconColor="#B8955A"
        [isHighlight]="true"
      ></app-stat-card>

      <app-stat-card
        title="Đang khám (In-Progress)"
        value="6"
        unit="phòng"
        subText="6/8 buồng khám đang hoạt động"
        iconName="stethoscope"
        iconBg="rgba(14, 74, 85, 0.15)"
        iconColor="#0E4A55"
      ></app-stat-card>

      <app-stat-card
        title="Đã hoàn tất khám"
        value="28"
        unit="lượt"
        subText="Tỷ lệ hài lòng 98%"
        trendText="4%"
        [trendPositive]="true"
        iconName="check"
        iconBg="rgba(94, 139, 126, 0.15)"
        iconColor="#5E8B7E"
      ></app-stat-card>
    </div>

    <!-- Active Queue Snapshot Table -->
    <div class="clinic-card queue-table-card">
      <div class="table-header-bar">
        <div>
          <h3 class="clinic-section-title">Hàng Đợi Khám Trong Ngày (Theo 3 Trạng Thái Chuẩn)</h3>
          <p class="section-sub">Dữ liệu thời gian thực được đồng bộ từ quầy tiếp đón và các phòng khám chuyên khoa.</p>
        </div>
        <div class="filter-pills">
          <span class="f-pill active">Tất cả (48)</span>
          <span class="f-pill">Chờ khám (14)</span>
          <span class="f-pill">Đang khám (6)</span>
          <span class="f-pill">Đã khám (28)</span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="clinic-data-table">
          <thead>
            <tr>
              <th>Số thứ tự</th>
              <th>Mã BN</th>
              <th>Họ và tên</th>
              <th>Giới tính / Năm sinh</th>
              <th>Phòng khám & Bác sĩ</th>
              <th>Thời gian tiếp nhận</th>
              <th>Mức ưu tiên</th>
              <th>Trạng thái hàng đợi</th>
              <th class="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (item of sampleQueue; track item.id) {
              <tr [class.row-highlight]="item.status === 'IN_PROGRESS'">
                <td>
                  <span class="ticket-badge font-serif" [class.pulse-gold]="item.status === 'IN_PROGRESS'">
                    {{ item.ticketNumber }}
                  </span>
                </td>
                <td class="text-secondary-slate font-medium">{{ item.patientCode }}</td>
                <td>
                  <div class="patient-name-cell">
                    <span class="p-fullname">{{ item.patientName }}</span>
                    <span class="p-phone">{{ item.phone }}</span>
                  </div>
                </td>
                <td>{{ item.gender === 'NAM' ? 'Nam' : 'Nữ' }} • {{ item.yearOfBirth }}</td>
                <td>
                  <div class="room-cell">
                    <span class="room-title">{{ item.roomName }}</span>
                    <span class="doctor-sub">{{ item.doctorName }}</span>
                  </div>
                </td>
                <td>{{ item.checkinTime }}</td>
                <td>
                  <app-status-tag [status]="item.priority"></app-status-tag>
                </td>
                <td>
                  <app-status-tag [status]="item.status"></app-status-tag>
                </td>
                <td class="text-right">
                  <div class="action-buttons-cell">
                    <button class="btn-table-action" title="Xem chi tiết">
                      <app-clinic-icon name="file-text" [size]="14"></app-clinic-icon>
                    </button>
                    <button class="btn-table-action" title="In phiếu K80">
                      <app-clinic-icon name="ticket" [size]="14"></app-clinic-icon>
                    </button>
                    @if (item.status === 'WAITING') {
                      <button class="btn-table-call" title="Gọi vào khám">Gọi số</button>
                    }
                  </div>
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
      .action-btn-primary {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(14, 74, 85, 0.25);
        &:hover {
          background: #135d6b;
        }
      }

      .action-btn-secondary {
        background: #FFFFFF;
        color: #1C2733;
        border: 1px solid #E4DED2;
        padding: 9px 16px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      @media (max-width: 1200px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .queue-table-card {
        padding: 24px;
        background: #FFFFFF;
      }

      .table-header-bar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 12px;
      }

      .section-sub {
        font-size: 0.84rem;
        color: #5B6672;
        margin: 4px 0 0 0;
      }

      .filter-pills {
        display: flex;
        gap: 6px;
        background: #FAF7F2;
        padding: 4px;
        border-radius: 999px;
        border: 1px solid #E4DED2;
      }

      .f-pill {
        padding: 4px 14px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        transition: all 0.2s ease;

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
        font-size: 0.875rem;

        th {
          background: #FAF7F2;
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
          color: #1C2733;
          vertical-align: middle;
        }

        tr:hover td {
          background-color: #FAF8F5;
        }

        tr.row-highlight td {
          background-color: rgba(14, 74, 85, 0.03);
        }
      }

      .ticket-badge {
        font-size: 1.05rem;
        font-weight: 700;
        color: #0E4A55;
        background: rgba(14, 74, 85, 0.08);
        border: 1px solid rgba(14, 74, 85, 0.2);
        padding: 4px 10px;
        border-radius: 8px;
        display: inline-block;
      }

      .patient-name-cell {
        display: flex;
        flex-direction: column;
      }

      .p-fullname {
        font-weight: 600;
        color: #1C2733;
      }

      .p-phone {
        font-size: 0.75rem;
        color: #8C96A2;
      }

      .room-cell {
        display: flex;
        flex-direction: column;
      }

      .room-title {
        font-weight: 500;
        color: #1C2733;
      }

      .doctor-sub {
        font-size: 0.75rem;
        color: #5B6672;
      }

      .action-buttons-cell {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-table-action {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid #E4DED2;
        background: #FFFFFF;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        color: #5B6672;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
        }
      }

      .btn-table-call {
        padding: 5px 12px;
        border-radius: 8px;
        border: 1px solid #B8955A;
        background: rgba(184, 149, 90, 0.12);
        color: #8C6C32;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #B8955A;
          color: #FFFFFF;
        }
      }

      .text-right {
        text-align: right;
      }
    `,
  ],
})
export class ReceptionHomeComponent {
  sampleQueue = [
    {
      id: 'q-01',
      ticketNumber: 'A-012',
      patientCode: 'BN-2026-0891',
      patientName: 'Nguyễn Văn Hùng',
      phone: '0903 881 234',
      gender: 'NAM',
      yearOfBirth: 1982,
      roomName: 'Phòng khám Nội 101',
      doctorName: 'TS.BS Trần Minh Hoàng',
      checkinTime: '08:15',
      priority: 'PRIORITY' as const,
      status: 'IN_PROGRESS' as const,
    },
    {
      id: 'q-02',
      ticketNumber: 'A-013',
      patientCode: 'BN-2026-0892',
      patientName: 'Lê Thị Thu Thảo',
      phone: '0918 334 556',
      gender: 'NU',
      yearOfBirth: 1995,
      roomName: 'Phòng khám Nội 101',
      doctorName: 'TS.BS Trần Minh Hoàng',
      checkinTime: '08:25',
      priority: 'NORMAL' as const,
      status: 'WAITING' as const,
    },
    {
      id: 'q-03',
      ticketNumber: 'B-005',
      patientCode: 'BN-2026-0888',
      patientName: 'Trần Đại Nghĩa',
      phone: '0988 122 345',
      gender: 'NAM',
      yearOfBirth: 1960,
      roomName: 'Phòng khám Tai Mũi Họng 104',
      doctorName: 'ThS.BS Vũ Hải Đăng',
      checkinTime: '08:05',
      priority: 'EMERGENCY' as const,
      status: 'WAITING' as const,
    },
    {
      id: 'q-04',
      ticketNumber: 'A-011',
      patientCode: 'BN-2026-0885',
      patientName: 'Đặng Kim Chi',
      phone: '0977 445 678',
      gender: 'NU',
      yearOfBirth: 1989,
      roomName: 'Phòng khám Nội 101',
      doctorName: 'TS.BS Trần Minh Hoàng',
      checkinTime: '07:55',
      priority: 'NORMAL' as const,
      status: 'COMPLETED' as const,
    },
  ];
}
