import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DoctorSchedule, WorkShift } from '../../../core/models/admin.model';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

export type ScheduleViewMode = 'MATRIX' | 'GRID';

export interface DayColumn {
  date: string; // YYYY-MM-DD
  dayLabel: string; // T2, T3...
  formattedDate: string; // 06/10
  isToday: boolean;
  shiftCount: number;
  hasLeave: boolean;
}

export interface WeekPeriod {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-admin-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ClinicIconComponent],
  template: `
    <app-page-header
      badgeText="PHÂN CA & LỊCH TRỰC BÁC SĨ (KẾ HOẠCH ĐA TUẦN)"
      title="Lập Lịch Trực & Phân Bổ Phòng Khám Bác Sĩ"
      subtitle="Quản lý kế hoạch phân ca trước 2 - 3 tuần, kiểm soát buồng khám chuyên khoa và phân bổ tải lượng bệnh nhân theo chuẩn bệnh viện."
    >
      <div actions class="header-action-group">
        <button class="btn-copy-week" (click)="copyCurrentWeekToNext()" title="Sao chép toàn bộ phân ca tuần này sang tuần tiếp theo">
          <app-clinic-icon name="clipboard" [size]="14"></app-clinic-icon>
          <span>Sao chép lịch sang tuần sau</span>
        </button>

        <button class="btn-gold" (click)="openAssignModal()">
          <app-clinic-icon name="calendar" [size]="14"></app-clinic-icon>
          <span>Phân ca trực mới</span>
        </button>
      </div>
    </app-page-header>

    <!-- Success Toast Alert -->
    @if (actionToast()) {
      <div class="toast-notification-banner">
        <app-clinic-icon name="check-circle" [size]="16" color="#0E4A55"></app-clinic-icon>
        <span>{{ actionToast() }}</span>
      </div>
    }

    <!-- 1. KPI Metrics Summary Bar for Real Clinic Planning -->
    <div class="kpi-metrics-row">
      <div class="kpi-metric-card">
        <div class="kpi-icon-box teal">
          <app-clinic-icon name="calendar" [size]="20"></app-clinic-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Tổng ca trực đã lập</span>
          <span class="kpi-value">{{ scheduleMetrics().totalShifts }} ca</span>
        </div>
      </div>

      <div class="kpi-metric-card">
        <div class="kpi-icon-box sage">
          <app-clinic-icon name="check-circle" [size]="20"></app-clinic-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Ca trực hoạt động</span>
          <span class="kpi-value text-sage">{{ scheduleMetrics().confirmedShifts }} ca</span>
        </div>
      </div>

      <div class="kpi-metric-card">
        <div class="kpi-icon-box gold">
          <app-clinic-icon name="activity" [size]="20"></app-clinic-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Lượt bệnh nhân đã hẹn</span>
          <span class="kpi-value font-mono">{{ scheduleMetrics().totalBooked }} / {{ scheduleMetrics().totalCapacity }} ca</span>
        </div>
      </div>

      <div class="kpi-metric-card">
        <div class="kpi-icon-box slate">
          <app-clinic-icon name="stethoscope" [size]="20"></app-clinic-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Bác sĩ tham gia trực</span>
          <span class="kpi-value">{{ scheduleMetrics().uniqueDoctors }} bác sĩ</span>
        </div>
      </div>
    </div>

    <!-- 2. Master Navigation & Week Range Toolbar -->
    <div class="clinic-card week-nav-card">
      <div class="week-selector-line">
        <div class="week-tabs-cluster">
          <span class="nav-eyebrow">CHỌN KỲ LẬP LỊCH:</span>
          @for (period of weekPeriods; track period.key) {
            <button
              type="button"
              class="week-tab-btn"
              [class.active]="selectedWeekKey() === period.key"
              (click)="selectWeekPeriod(period.key)"
            >
              {{ period.label }}
            </button>
          }
        </div>

        <!-- View Mode Switcher & Date Picker -->
        <div class="view-and-date-controls">
          <div class="date-jump-box">
            <span class="jump-label">Xem ngày cụ thể:</span>
            <input
              type="date"
              [(ngModel)]="customDateInput"
              (change)="onCustomDateSelect()"
              class="date-input-picker"
            />
          </div>

          <div class="view-mode-toggle">
            <button
              type="button"
              class="mode-btn"
              [class.active]="viewMode() === 'MATRIX'"
              (click)="viewMode.set('MATRIX')"
              title="Chế độ Ma trận tuần (Chuẩn bệnh viện)"
            >
              <app-clinic-icon name="activity" [size]="14"></app-clinic-icon>
              <span>Ma trận tuần</span>
            </button>
            <button
              type="button"
              class="mode-btn"
              [class.active]="viewMode() === 'GRID'"
              (click)="viewMode.set('GRID')"
              title="Chế độ Thẻ chi tiết"
            >
              <app-clinic-icon name="clipboard" [size]="14"></app-clinic-icon>
              <span>Danh sách thẻ</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Horizontal Multi-Day / 14-Day Calendar Strip -->
      <div class="day-strip-scrollable">
        <button
          type="button"
          class="day-strip-pill all-pill"
          [class.active]="selectedDayFilter() === 'ALL'"
          (click)="selectedDayFilter.set('ALL')"
        >
          <span class="d-weekday">TẤT CẢ</span>
          <span class="d-date">Xem toàn kỳ</span>
          <span class="d-badge">{{ periodTotalShifts() }} ca</span>
        </button>

        @for (day of visibleDays(); track day.date) {
          <button
            type="button"
            class="day-strip-pill"
            [class.active]="selectedDayFilter() === day.date"
            [class.today]="day.isToday"
            (click)="selectedDayFilter.set(day.date)"
          >
            <span class="d-weekday">{{ day.dayLabel }}</span>
            <span class="d-date">{{ day.formattedDate }}</span>
            <span class="d-badge" [class.has-leave]="day.hasLeave">{{ day.shiftCount }} ca</span>
          </button>
        }
      </div>

      <!-- Shift Filter Filter Sub-Row (Morning / Afternoon / Evening) -->
      <div class="shift-subfilters-row">
        <span class="shift-filter-label">Lọc ca trực:</span>
        <button
          type="button"
          class="shift-pill"
          [class.active]="selectedShiftFilter() === 'ALL'"
          (click)="selectedShiftFilter.set('ALL')"
        >
          Tất cả các ca
        </button>
        <button
          type="button"
          class="shift-pill"
          [class.active]="selectedShiftFilter() === 'MORNING'"
          (click)="selectedShiftFilter.set('MORNING')"
        >
          <app-clinic-icon name="clock" [size]="12"></app-clinic-icon>
          Ca Sáng (07:30 - 11:30)
        </button>
        <button
          type="button"
          class="shift-pill"
          [class.active]="selectedShiftFilter() === 'AFTERNOON'"
          (click)="selectedShiftFilter.set('AFTERNOON')"
        >
          <app-clinic-icon name="clock" [size]="12"></app-clinic-icon>
          Ca Chiều (13:30 - 17:00)
        </button>
        <button
          type="button"
          class="shift-pill"
          [class.active]="selectedShiftFilter() === 'EVENING'"
          (click)="selectedShiftFilter.set('EVENING')"
        >
          <app-clinic-icon name="clock" [size]="12"></app-clinic-icon>
          Ca Tối (17:30 - 20:30)
        </button>
      </div>
    </div>

    <!-- 4A. CHẾ ĐỘ MA TRẬN TUẦN (WEEKLY MATRIX TABLE VIEW) -->
    @if (viewMode() === 'MATRIX') {
      <div class="clinic-card matrix-table-container">
        <div class="matrix-table-wrap">
          <table class="schedule-matrix-table">
            <thead>
              <tr>
                <th class="shift-col-header">Ca / Ngày</th>
                @for (day of visibleDays(); track day.date) {
                  <th class="day-col-header" [class.active-col]="selectedDayFilter() === day.date" [class.today-col]="day.isToday">
                    <div class="day-header-top">{{ day.dayLabel }}</div>
                    <div class="day-header-bottom font-serif">{{ day.formattedDate }}</div>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              <!-- Row 1: Ca Sáng -->
              @if (selectedShiftFilter() === 'ALL' || selectedShiftFilter() === 'MORNING') {
                <tr>
                  <td class="shift-cell-label">
                    <div class="shift-name-tag morning">
                      <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
                      <span>CA SÁNG</span>
                    </div>
                    <span class="shift-hours">07:30 - 11:30</span>
                  </td>
                  @for (day of visibleDays(); track day.date) {
                    <td class="matrix-cell-content" [class.active-col]="selectedDayFilter() === day.date">
                      <div class="cell-shifts-stack">
                        @for (sch of getShiftsForCell(day.date, 'MORNING'); track sch.id) {
                          <div class="matrix-doctor-card" [class.leave-state]="sch.status === 'LEAVE'">
                            <div class="doc-card-top">
                              <span class="doc-card-name font-bold">{{ sch.doctorName }}</span>
                              <button
                                type="button"
                                class="status-toggle-btn"
                                (click)="toggleScheduleStatus(sch)"
                                [title]="sch.status === 'CONFIRMED' ? 'Chuyển sang báo nghỉ phép' : 'Khôi phục ca trực'"
                              >
                                {{ sch.status === 'CONFIRMED' ? 'Trực' : 'Nghỉ' }}
                              </button>
                            </div>
                            <div class="doc-card-meta">
                              <span class="doc-spec-text">{{ sch.specialty }}</span>
                              <span class="doc-room-text">{{ sch.roomName }}</span>
                            </div>
                            <div class="doc-card-load">
                              <span class="load-text">{{ sch.bookedPatients }} / {{ sch.maxPatients }} ca</span>
                              <div class="mini-bar-track">
                                <div class="mini-bar-fill" [style.width.%]="getCapacityPercent(sch)"></div>
                              </div>
                            </div>
                          </div>
                        }
                        <button
                          type="button"
                          class="btn-cell-add-shift"
                          (click)="openAssignModalForSlot(day.date, 'MORNING')"
                          title="Thêm ca trực sáng cho ngày này"
                        >
                          + Thêm BS
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              }

              <!-- Row 2: Ca Chiều -->
              @if (selectedShiftFilter() === 'ALL' || selectedShiftFilter() === 'AFTERNOON') {
                <tr>
                  <td class="shift-cell-label">
                    <div class="shift-name-tag afternoon">
                      <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
                      <span>CA CHIỀU</span>
                    </div>
                    <span class="shift-hours">13:30 - 17:00</span>
                  </td>
                  @for (day of visibleDays(); track day.date) {
                    <td class="matrix-cell-content" [class.active-col]="selectedDayFilter() === day.date">
                      <div class="cell-shifts-stack">
                        @for (sch of getShiftsForCell(day.date, 'AFTERNOON'); track sch.id) {
                          <div class="matrix-doctor-card" [class.leave-state]="sch.status === 'LEAVE'">
                            <div class="doc-card-top">
                              <span class="doc-card-name font-bold">{{ sch.doctorName }}</span>
                              <button
                                type="button"
                                class="status-toggle-btn"
                                (click)="toggleScheduleStatus(sch)"
                                [title]="sch.status === 'CONFIRMED' ? 'Chuyển sang báo nghỉ phép' : 'Khôi phục ca trực'"
                              >
                                {{ sch.status === 'CONFIRMED' ? 'Trực' : 'Nghỉ' }}
                              </button>
                            </div>
                            <div class="doc-card-meta">
                              <span class="doc-spec-text">{{ sch.specialty }}</span>
                              <span class="doc-room-text">{{ sch.roomName }}</span>
                            </div>
                            <div class="doc-card-load">
                              <span class="load-text">{{ sch.bookedPatients }} / {{ sch.maxPatients }} ca</span>
                              <div class="mini-bar-track">
                                <div class="mini-bar-fill" [style.width.%]="getCapacityPercent(sch)"></div>
                              </div>
                            </div>
                          </div>
                        }
                        <button
                          type="button"
                          class="btn-cell-add-shift"
                          (click)="openAssignModalForSlot(day.date, 'AFTERNOON')"
                          title="Thêm ca trực chiều cho ngày này"
                        >
                          + Thêm BS
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              }

              <!-- Row 3: Ca Tối -->
              @if (selectedShiftFilter() === 'ALL' || selectedShiftFilter() === 'EVENING') {
                <tr>
                  <td class="shift-cell-label">
                    <div class="shift-name-tag evening">
                      <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
                      <span>CA TỐI</span>
                    </div>
                    <span class="shift-hours">17:30 - 20:30</span>
                  </td>
                  @for (day of visibleDays(); track day.date) {
                    <td class="matrix-cell-content" [class.active-col]="selectedDayFilter() === day.date">
                      <div class="cell-shifts-stack">
                        @for (sch of getShiftsForCell(day.date, 'EVENING'); track sch.id) {
                          <div class="matrix-doctor-card" [class.leave-state]="sch.status === 'LEAVE'">
                            <div class="doc-card-top">
                              <span class="doc-card-name font-bold">{{ sch.doctorName }}</span>
                              <button
                                type="button"
                                class="status-toggle-btn"
                                (click)="toggleScheduleStatus(sch)"
                                [title]="sch.status === 'CONFIRMED' ? 'Chuyển sang báo nghỉ phép' : 'Khôi phục ca trực'"
                              >
                                {{ sch.status === 'CONFIRMED' ? 'Trực' : 'Nghỉ' }}
                              </button>
                            </div>
                            <div class="doc-card-meta">
                              <span class="doc-spec-text">{{ sch.specialty }}</span>
                              <span class="doc-room-text">{{ sch.roomName }}</span>
                            </div>
                            <div class="doc-card-load">
                              <span class="load-text">{{ sch.bookedPatients }} / {{ sch.maxPatients }} ca</span>
                              <div class="mini-bar-track">
                                <div class="mini-bar-fill" [style.width.%]="getCapacityPercent(sch)"></div>
                              </div>
                            </div>
                          </div>
                        }
                        <button
                          type="button"
                          class="btn-cell-add-shift"
                          (click)="openAssignModalForSlot(day.date, 'EVENING')"
                          title="Thêm ca trực tối cho ngày này"
                        >
                          + Thêm BS
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- 4B. CHẾ ĐỘ DANH SÁCH THẺ (CARD GRID VIEW) -->
    @if (viewMode() === 'GRID') {
      <div class="schedules-grid">
        @for (sch of filteredSchedules(); track sch.id) {
          <div class="clinic-card schedule-card" [class.leave-card]="sch.status === 'LEAVE'">
            <div class="sch-header">
              <span class="shift-badge" [class]="sch.shift.toLowerCase()">
                @switch (sch.shift) {
                  @case ('MORNING') { Sáng (07:30 - 11:30) }
                  @case ('AFTERNOON') { Chiều (13:30 - 17:00) }
                  @case ('EVENING') { Tối (17:30 - 20:30) }
                }
              </span>
              <span class="sch-date font-mono">{{ sch.date }}</span>
            </div>

            <div class="doctor-profile-box">
              <div class="doc-avatar">
                <app-clinic-icon name="stethoscope" [size]="18" color="#0E4A55"></app-clinic-icon>
              </div>
              <div class="doc-text">
                <h4 class="doc-name font-bold">{{ sch.doctorName }}</h4>
                <span class="doc-specialty">Chuyên khoa: {{ sch.specialty }}</span>
              </div>
            </div>

            <div class="room-assignment-box">
              <app-clinic-icon name="map-pin" [size]="13" class="room-icon"></app-clinic-icon>
              <span class="room-text font-bold">{{ sch.roomName }}</span>
            </div>

            <!-- Capacity and Bookings -->
            <div class="capacity-section">
              <div class="cap-header">
                <span class="cap-title">Tải lượng bệnh nhân</span>
                <span class="cap-numbers font-bold">
                  {{ sch.bookedPatients }} / {{ sch.maxPatients }} ca
                </span>
              </div>
              <div class="cap-bar-track">
                <div
                  class="cap-bar-fill"
                  [style.width.%]="getCapacityPercent(sch)"
                  [class.full]="sch.bookedPatients >= sch.maxPatients && sch.maxPatients > 0"
                ></div>
              </div>
            </div>

            <div class="sch-footer">
              <span
                class="sch-status-pill"
                [class.confirmed]="sch.status === 'CONFIRMED'"
                [class.leave]="sch.status === 'LEAVE'"
              >
                @if (sch.status === 'CONFIRMED') {
                  <app-clinic-icon name="check" [size]="11"></app-clinic-icon>
                  <span>Đang trực khám</span>
                } @else {
                  <app-clinic-icon name="close" [size]="11"></app-clinic-icon>
                  <span>Nghỉ phép</span>
                }
              </span>

              <button
                class="btn-toggle-leave"
                (click)="toggleScheduleStatus(sch)"
                [title]="sch.status === 'CONFIRMED' ? 'Chuyển sang báo nghỉ phép' : 'Khôi phục ca trực'"
              >
                {{ sch.status === 'CONFIRMED' ? 'Báo nghỉ' : 'Khôi phục' }}
              </button>
            </div>
          </div>
        } @empty {
          <div class="empty-box clinic-card full-width">
            <app-clinic-icon name="calendar" [size]="36" class="empty-icon"></app-clinic-icon>
            <h4 class="font-bold">Không tìm thấy ca trực phù hợp</h4>
            <p>Không có lịch trực nào được phân bổ trong ngày hoặc ca làm việc đã chọn trong khoảng thời gian này.</p>
            <button class="btn-gold" (click)="openAssignModal()">+ Phân ca trực cho ngày này</button>
          </div>
        }
      </div>
    }

    <!-- 5. Modal Phân Lịch Trực Cho Bác Sĩ -->
    @if (isAssignModalOpen()) {
      <div class="modal-backdrop" (click)="closeAssignModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-eyebrow">QUẢN TRỊ NHÂN LỰC Y TẾ</span>
              <h3 class="modal-title font-serif">Phân Lịch Trực Cho Bác Sĩ</h3>
            </div>
            <button class="modal-close" (click)="closeAssignModal()" aria-label="Đóng">
              <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
            </button>
          </div>

          <form (ngSubmit)="submitAssignShift()" class="modal-form">
            <div class="form-group">
              <label>Chọn Bác sĩ phụ trách <span class="required">*</span></label>
              <select [(ngModel)]="selectedDoctorId" name="doctorId" class="clinic-select" required>
                @for (doc of activeDoctors(); track doc.id) {
                  <option [value]="doc.id">{{ doc.fullName }} ({{ doc.department }})</option>
                }
              </select>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Ngày trực khám (YYYY-MM-DD) <span class="required">*</span></label>
                <input
                  type="date"
                  [(ngModel)]="shiftDate"
                  name="shiftDate"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Ca trực trong ngày <span class="required">*</span></label>
                <select [(ngModel)]="shiftSlot" name="shiftSlot" class="clinic-select">
                  <option value="MORNING">Buổi Sáng (07:30 - 11:30)</option>
                  <option value="AFTERNOON">Buổi Chiều (13:30 - 17:00)</option>
                  <option value="EVENING">Buổi Tối (17:30 - 20:30)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Buồng khám phân bổ <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="roomName"
                  name="roomName"
                  placeholder="vd: Phòng khám Nội 101"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Số bệnh nhân tối đa <span class="required">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="maxPatients"
                  name="maxPatients"
                  min="5"
                  max="60"
                  required
                  class="clinic-input"
                />
              </div>
            </div>

            @if (assignError()) {
              <div class="error-msg">
                <app-clinic-icon name="alert-triangle" [size]="14"></app-clinic-icon>
                <span>{{ assignError() }}</span>
              </div>
            }

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeAssignModal()">Hủy bỏ</button>
              <button type="submit" class="btn-submit">Xác nhận phân ca</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .header-action-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .btn-copy-week {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #F6F3EC;
        color: #0E4A55;
        border: 1.5px solid #0E4A55;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.84rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #0E4A55;
          color: #FFFFFF;
        }
      }

      .toast-notification-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #EDF7F5;
        border: 1px solid #B8E0D7;
        color: #0E4A55;
        padding: 10px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 0.88rem;
        font-weight: 600;
        animation: fadeIn 0.3s ease;
      }

      /* 1. KPI Metrics Row */
      .kpi-metrics-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;

        @media (max-width: 1024px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 640px) {
          grid-template-columns: 1fr;
        }
      }

      .kpi-metric-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

        .kpi-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;

          &.teal {
            background: rgba(14, 74, 85, 0.12);
            color: #0E4A55;
          }
          &.sage {
            background: rgba(94, 139, 126, 0.15);
            color: #5E8B7E;
          }
          &.gold {
            background: rgba(184, 149, 90, 0.16);
            color: #B8955A;
          }
          &.slate {
            background: rgba(28, 39, 51, 0.1);
            color: #1C2733;
          }
        }

        .kpi-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .kpi-label {
          font-size: 0.75rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .kpi-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1C2733;
        }
      }

      /* 2. Master Navigation & Week Range Toolbar */
      .week-nav-card {
        padding: 20px;
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .week-selector-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }

      .week-tabs-cluster {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .nav-eyebrow {
          font-size: 0.72rem;
          font-weight: 700;
          color: #7A571B;
          letter-spacing: 0.08em;
          margin-right: 4px;
        }
      }

      .week-tab-btn {
        background: #F6F3EC;
        border: 1px solid #E4DED2;
        padding: 7px 16px;
        border-radius: 999px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
        }

        &.active {
          background: #0E4A55;
          border-color: #0E4A55;
          color: #FFFFFF;
        }
      }

      .view-and-date-controls {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .date-jump-box {
        display: flex;
        align-items: center;
        gap: 8px;

        .jump-label {
          font-size: 0.78rem;
          color: #718096;
          font-weight: 600;
        }

        .date-input-picker {
          padding: 6px 10px;
          border: 1px solid #E4DED2;
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #1C2733;
          outline: none;
          background: #FAF8F5;

          &:focus {
            border-color: #0E4A55;
          }
        }
      }

      .view-mode-toggle {
        display: flex;
        background: #EAE6DE;
        padding: 3px;
        border-radius: 8px;

        .mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #5B6672;
          cursor: pointer;
          transition: all 0.2s ease;

          &.active {
            background: #FFFFFF;
            color: #0E4A55;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        }
      }

      /* 3. Horizontal Multi-Day / 14-Day Calendar Strip */
      .day-strip-scrollable {
        display: flex;
        align-items: center;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 6px;

        &::-webkit-scrollbar {
          height: 4px;
        }
        &::-webkit-scrollbar-thumb {
          background: #D8D2C4;
          border-radius: 999px;
        }
      }

      .day-strip-pill {
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        background: #FAF8F5;
        border: 1.5px solid #E4DED2;
        padding: 8px 16px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 90px;

        .d-weekday {
          font-size: 0.75rem;
          font-weight: 700;
          color: #5B6672;
          transition: color 0.15s ease;
        }

        .d-date {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1C2733;
          transition: color 0.15s ease;
        }

        .d-badge {
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(14, 74, 85, 0.12);
          color: #0E4A55;
          padding: 2px 8px;
          border-radius: 999px;
          transition: all 0.15s ease;

          &.has-leave {
            background: rgba(155, 61, 69, 0.14);
            color: #9B3D45;
          }
        }

        &.all-pill {
          min-width: 110px;
          background: #EAE6DE;
          border-color: #D4CEBF;

          .d-weekday {
            color: #0E4A55;
          }
          .d-date {
            color: #1C2733;
          }
        }

        &:hover:not(.active) {
          border-color: #0E4A55;
          background: #FFFFFF;
        }

        &.today:not(.active) {
          border-color: #B8955A;
          background: #FFFDF8;
          .d-weekday {
            color: #8C6D34;
          }
        }

        &.active {
          background: #0E4A55 !important;
          border-color: #0E4A55 !important;

          .d-weekday,
          .d-date {
            color: #FFFFFF !important;
          }

          .d-badge {
            background: rgba(255, 255, 255, 0.3) !important;
            color: #FFFFFF !important;
          }
        }
      }

      /* Shift Subfilters Row */
      .shift-subfilters-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        border-top: 1px dashed #E4DED2;
        padding-top: 12px;

        .shift-filter-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #718096;
          margin-right: 4px;
        }

        .shift-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F6F3EC;
          border: 1px solid #E4DED2;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #5B6672;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #0E4A55;
            color: #0E4A55;
          }

          &.active {
            background: #1C2733;
            border-color: #1C2733;
            color: #FFFFFF;
            font-weight: 600;
          }
        }
      }

      /* 4A. MATRIX TABLE VIEW */
      .matrix-table-container {
        padding: 0;
        overflow: hidden;
        margin-bottom: 30px;
      }

      .matrix-table-wrap {
        overflow-x: auto;
      }

      .schedule-matrix-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 1000px;

        th, td {
          border: 1px solid #EAE6DE;
          vertical-align: top;
        }

        thead th {
          background: #FAF8F5;
          padding: 12px 10px;
          text-align: center;

          &.shift-col-header {
            width: 150px;
            background: #F2EFE8;
            font-size: 0.78rem;
            font-weight: 700;
            color: #5B6672;
          }

          &.day-col-header {
            .day-header-top {
              font-size: 0.75rem;
              font-weight: 700;
              color: #718096;
            }
            .day-header-bottom {
              font-size: 1.05rem;
              color: #1C2733;
            }

            &.today-col {
              background: #FDF9EE;
              border-bottom: 2px solid #B8955A;
              .day-header-top {
                color: #B8955A;
              }
            }

            &.active-col {
              background: #EBF4F5;
            }
          }
        }

        .shift-cell-label {
          padding: 14px 10px;
          background: #FAF8F5;
          text-align: center;
          width: 150px;

          .shift-name-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 999px;
            margin-bottom: 4px;

            &.morning {
              background: rgba(184, 149, 90, 0.16);
              color: #8C6D34;
            }
            &.afternoon {
              background: rgba(14, 74, 85, 0.12);
              color: #0E4A55;
            }
            &.evening {
              background: rgba(28, 39, 51, 0.1);
              color: #1C2733;
            }
          }

          .shift-hours {
            display: block;
            font-size: 0.72rem;
            color: #718096;
            font-family: monospace;
          }
        }

        .matrix-cell-content {
          padding: 8px;
          background: #FFFFFF;

          &.active-col {
            background: #F9FDFD;
          }

          .cell-shifts-stack {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-height: 80px;
          }
        }
      }

      .matrix-doctor-card {
        background: #F9F8F5;
        border: 1px solid #E4DED2;
        border-radius: 6px;
        padding: 6px 8px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        transition: all 0.15s ease;

        &:hover {
          border-color: #0E4A55;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        &.leave-state {
          opacity: 0.6;
          background: #FDF4F4;
          border-color: #EAC9C9;
        }

        .doc-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 4px;

          .doc-card-name {
            font-size: 0.78rem;
            color: #1C2733;
            line-height: 1.2;
          }

          .status-toggle-btn {
            border: none;
            background: #E8E4DA;
            color: #5B6672;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 0.65rem;
            font-weight: 700;
            cursor: pointer;

            &:hover {
              background: #0E4A55;
              color: #FFFFFF;
            }
          }
        }

        .doc-card-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          color: #718096;
        }

        .doc-card-load {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 2px;

          .load-text {
            font-size: 0.65rem;
            color: #0E4A55;
            font-weight: 600;
          }

          .mini-bar-track {
            height: 3px;
            background: #E4DED2;
            border-radius: 999px;
            overflow: hidden;

            .mini-bar-fill {
              height: 100%;
              background: #0E4A55;
            }
          }
        }
      }

      .btn-cell-add-shift {
        border: 1px dashed #D4CEBF;
        background: transparent;
        color: #8C96A2;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 0.68rem;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        text-align: center;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
          background: rgba(14, 74, 85, 0.04);
        }
      }

      /* 4B. CARD GRID VIEW */
      .schedules-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 30px;

        @media (max-width: 1200px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .schedule-card {
        background: #FFFFFF;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(28, 39, 51, 0.08);
        }

        &.leave-card {
          opacity: 0.7;
          background: #FAF8F5;
        }
      }

      .sch-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .sch-date {
          font-size: 0.8125rem;
          color: #8C96A2;
          font-weight: 600;
        }
      }

      .shift-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 999px;

        &.morning {
          background: rgba(184, 149, 90, 0.15);
          color: #8C6D34;
        }

        &.afternoon {
          background: rgba(14, 74, 85, 0.12);
          color: #0E4A55;
        }

        &.evening {
          background: rgba(43, 61, 80, 0.12);
          color: #1C2733;
        }
      }

      .doctor-profile-box {
        display: flex;
        align-items: center;
        gap: 12px;

        .doc-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(14, 74, 85, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doc-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doc-name {
          font-size: 0.95rem;
          color: #1C2733;
          margin: 0;
        }

        .doc-specialty {
          font-size: 0.78rem;
          color: #5B6672;
        }
      }

      .room-assignment-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #F6F3EC;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.84rem;
        color: #0E4A55;
      }

      .capacity-section {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .cap-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
        }

        .cap-title {
          color: #5B6672;
        }

        .cap-numbers {
          color: #1C2733;
        }

        .cap-bar-track {
          width: 100%;
          height: 6px;
          background: #E4DED2;
          border-radius: 999px;
          overflow: hidden;
        }

        .cap-bar-fill {
          height: 100%;
          background: #0E4A55;
          border-radius: 999px;
          transition: width 0.3s ease;

          &.full {
            background: #B8955A;
          }
        }
      }

      .sch-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 8px;
        border-top: 1px solid #FAF8F5;
      }

      .sch-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 999px;

        &.confirmed {
          background: rgba(94, 139, 126, 0.15);
          color: #386055;
        }

        &.leave {
          background: rgba(155, 61, 69, 0.12);
          color: #9B3D45;
        }
      }

      .btn-toggle-leave {
        border: none;
        background: transparent;
        color: #8C96A2;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.15s ease;

        &:hover {
          background: #FAF8F5;
          color: #1C2733;
        }
      }

      .empty-box {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        gap: 12px;

        .empty-icon {
          color: #B8955A;
        }

        p {
          color: #718096;
          font-size: 0.88rem;
          max-width: 480px;
          margin-bottom: 8px;
        }
      }

      /* Modal Styling */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }

      .modal-card {
        background: #FFFFFF;
        width: 100%;
        max-width: 580px;
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.2);
        animation: modalScale 0.25s ease;
      }

      @keyframes modalScale {
        from {
          opacity: 0;
          transform: scale(0.96);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;

        .modal-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          color: #7A571B;
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 2px;
        }

        .modal-title {
          font-size: 1.35rem;
          color: #0E4A55;
          margin: 0;
        }

        .modal-close {
          border: none;
          background: #FAF8F5;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #5B6672;

          &:hover {
            background: #EAE6DE;
          }
        }
      }

      .modal-form {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;

          label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: #1C2733;

            .required {
              color: #9B3D45;
            }
          }

          .clinic-input,
          .clinic-select {
            padding: 9px 12px;
            border: 1.5px solid #E4DED2;
            border-radius: 8px;
            font-size: 0.875rem;
            outline: none;
            background: #FFFFFF;

            &:focus {
              border-color: #0E4A55;
            }
          }
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .error-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #FDF4F4;
          border: 1px solid #EAC9C9;
          border-radius: 6px;
          color: #9B3D45;
          font-size: 0.8125rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;

          .btn-cancel {
            background: #FAF8F5;
            border: 1px solid #E4DED2;
            color: #5B6672;
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }

          .btn-submit {
            background: #0E4A55;
            color: #FFFFFF;
            border: none;
            padding: 8px 22px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;

            &:hover {
              background: #145b68;
            }
          }
        }
      }
    `,
  ],
})
export class AdminSchedulesComponent {
  private adminService = inject(AdminService);

  allSchedules = this.adminService.doctorSchedules;
  activeDoctors = this.adminService.activeDoctors;

  // View Mode: Ma Trận Tuần (Weekly Matrix) hoặc Danh Sách Thẻ (Grid)
  viewMode = signal<ScheduleViewMode>('MATRIX');

  // Navigation Preset Weeks (Tuần 1, Tuần 2, Tuần 3, Cả 2 Tuần, Toàn bộ)
  weekPeriods: WeekPeriod[] = [
    {
      key: 'WEEK_1',
      label: 'Tuần này (05/10 - 11/10)',
      startDate: '2026-10-05',
      endDate: '2026-10-11',
    },
    {
      key: 'WEEK_2',
      label: 'Tuần tới (12/10 - 18/10)',
      startDate: '2026-10-12',
      endDate: '2026-10-18',
    },
    {
      key: 'WEEK_3',
      label: 'Tuần sau nữa (19/10 - 25/10)',
      startDate: '2026-10-19',
      endDate: '2026-10-25',
    },
    {
      key: 'TWO_WEEKS',
      label: 'Kế hoạch 2 tuần tới (05/10 - 18/10)',
      startDate: '2026-10-05',
      endDate: '2026-10-18',
    },
    {
      key: 'ALL',
      label: 'Toàn bộ 3 tuần',
      startDate: '2026-10-05',
      endDate: '2026-10-25',
    },
  ];

  selectedWeekKey = signal<string>('WEEK_1');
  selectedDayFilter = signal<string>('ALL'); // 'ALL' or specific YYYY-MM-DD
  selectedShiftFilter = signal<string>('ALL'); // 'ALL', 'MORNING', 'AFTERNOON', 'EVENING'
  customDateInput = '2026-10-06';
  actionToast = signal<string>('');

  // 14-Day Calendar Day Strip definition
  visibleDays = computed<DayColumn[]>(() => {
    const period = this.weekPeriods.find((p) => p.key === this.selectedWeekKey()) || this.weekPeriods[0];
    const days: DayColumn[] = [];

    const start = new Date(period.startDate);
    const end = new Date(period.endDate);

    const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const shiftsForDay = this.allSchedules().filter((s) => s.date === dateStr);
      const hasLeave = shiftsForDay.some((s) => s.status === 'LEAVE');

      days.push({
        date: dateStr,
        dayLabel: weekdayLabels[d.getDay()],
        formattedDate: `${dd}/${mm}`,
        isToday: dateStr === '2026-10-06',
        shiftCount: shiftsForDay.length,
        hasLeave,
      });
    }

    return days;
  });

  periodTotalShifts = computed(() => {
    const period = this.weekPeriods.find((p) => p.key === this.selectedWeekKey()) || this.weekPeriods[0];
    return this.allSchedules().filter(
      (s) => s.date >= period.startDate && s.date <= period.endDate
    ).length;
  });

  // Filtered schedules for Card Grid View
  filteredSchedules = computed(() => {
    let list = this.allSchedules();
    const period = this.weekPeriods.find((p) => p.key === this.selectedWeekKey()) || this.weekPeriods[0];

    // Filter by period date range
    list = list.filter((s) => s.date >= period.startDate && s.date <= period.endDate);

    // Filter by specific day if selected
    const day = this.selectedDayFilter();
    if (day !== 'ALL') {
      list = list.filter((s) => s.date === day);
    }

    // Filter by shift
    const shift = this.selectedShiftFilter();
    if (shift !== 'ALL') {
      list = list.filter((s) => s.shift === shift);
    }

    return list.sort((a, b) => a.date.localeCompare(b.date));
  });

  // KPI Metrics calculation
  scheduleMetrics = computed(() => {
    const list = this.filteredSchedules();
    const totalShifts = list.length;
    const confirmedShifts = list.filter((s) => s.status === 'CONFIRMED').length;
    const totalCapacity = list.reduce((acc, cur) => acc + cur.maxPatients, 0);
    const totalBooked = list.reduce((acc, cur) => acc + cur.bookedPatients, 0);
    const uniqueDoctors = new Set(list.map((s) => s.doctorId)).size;

    return {
      totalShifts,
      confirmedShifts,
      totalCapacity,
      totalBooked,
      uniqueDoctors,
    };
  });

  selectWeekPeriod(key: string): void {
    this.selectedWeekKey.set(key);
    this.selectedDayFilter.set('ALL');
  }

  onCustomDateSelect(): void {
    if (!this.customDateInput) return;
    this.selectedWeekKey.set('ALL');
    this.selectedDayFilter.set(this.customDateInput);
  }

  getCapacityPercent(sch: DoctorSchedule): number {
    if (sch.maxPatients <= 0) return 0;
    return Math.min(100, Math.round((sch.bookedPatients / sch.maxPatients) * 100));
  }

  getShiftsForCell(date: string, shift: WorkShift): DoctorSchedule[] {
    return this.allSchedules().filter((s) => s.date === date && s.shift === shift);
  }

  toggleScheduleStatus(sch: DoctorSchedule): void {
    this.adminService.toggleScheduleStatus(sch.id);
    const newStatus = sch.status === 'CONFIRMED' ? 'Nghỉ phép' : 'Đang trực';
    this.showToast(`Đã chuyển trạng thái ca của ${sch.doctorName} sang: ${newStatus}`);
  }

  copyCurrentWeekToNext(): void {
    const week1Dates = [
      '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'
    ];
    const week2Dates = [
      '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'
    ];

    const copiedCount = this.adminService.copyWeekSchedule(week1Dates, week2Dates);
    this.selectedWeekKey.set('WEEK_2');
    this.selectedDayFilter.set('ALL');
    this.showToast(`Đã sao chép thành công ${copiedCount} ca trực sang Tuần tới (12/10 - 18/10)!`);
  }

  showToast(msg: string): void {
    this.actionToast.set(msg);
    setTimeout(() => {
      this.actionToast.set('');
    }, 4500);
  }

  // Modal State
  isAssignModalOpen = signal<boolean>(false);
  assignError = signal<string>('');

  selectedDoctorId = '';
  shiftDate = '2026-10-06';
  shiftSlot: WorkShift = 'MORNING';
  roomName = 'Phòng khám Nội 101';
  maxPatients = 25;

  openAssignModal(): void {
    this.assignError.set('');
    const doctors = this.activeDoctors();
    this.selectedDoctorId = doctors.length > 0 ? doctors[0].id : '';
    this.shiftDate = this.selectedDayFilter() !== 'ALL' ? this.selectedDayFilter() : '2026-10-06';
    this.shiftSlot = 'MORNING';
    this.roomName = 'Phòng khám Nội 101';
    this.maxPatients = 25;
    this.isAssignModalOpen.set(true);
  }

  openAssignModalForSlot(date: string, shift: WorkShift): void {
    this.assignError.set('');
    const doctors = this.activeDoctors();
    this.selectedDoctorId = doctors.length > 0 ? doctors[0].id : '';
    this.shiftDate = date;
    this.shiftSlot = shift;
    this.roomName = 'Phòng khám Nội 101';
    this.maxPatients = 25;
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
  }

  submitAssignShift(): void {
    const doc = this.activeDoctors().find((d) => d.id === this.selectedDoctorId);
    if (!doc) {
      this.assignError.set('Vui lòng chọn bác sĩ phụ trách ca.');
      return;
    }

    if (!this.shiftDate || !this.roomName.trim()) {
      this.assignError.set('Vui lòng điền đầy đủ ngày trực và buồng khám.');
      return;
    }

    // Schedule conflict check
    const conflict = this.allSchedules().find(
      (s) =>
        s.doctorId === doc.id &&
        s.date === this.shiftDate &&
        s.shift === this.shiftSlot &&
        s.status === 'CONFIRMED'
    );

    if (conflict) {
      this.assignError.set(
        `Xung đột lịch trực: Bác sĩ ${doc.fullName} đã có ca trực vào ngày ${this.shiftDate}, ca ${this.shiftSlot} tại ${conflict.roomName}!`
      );
      return;
    }

    this.adminService.assignDoctorShift({
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialty: doc.department.replace('Khoa ', ''),
      roomName: this.roomName.trim(),
      date: this.shiftDate,
      shift: this.shiftSlot,
      status: 'CONFIRMED',
      maxPatients: Number(this.maxPatients),
      bookedPatients: 0,
    });

    this.showToast(`Đã phân ca trực thành công cho ${doc.fullName} vào ngày ${this.shiftDate}!`);
    this.closeAssignModal();
  }
}
