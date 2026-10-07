import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DoctorSchedule, WorkShift } from '../../../core/models/admin.model';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-admin-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ClinicIconComponent],
  template: `
    <app-page-header
      badgeText="PHÂN CA & LỊCH TRỰC BÁC SĨ • UC023"
      title="Lập Lịch Trực & Phân Bổ Phòng Khám Bác Sĩ"
      subtitle="Quản lý ca khám bệnh sáng/chiều/tối, phân bổ buồng khám chuyên khoa và kiểm soát giới hạn lượt bệnh nhân."
    >
      <div actions>
        <button class="btn-gold" (click)="openAssignModal()">
          <app-clinic-icon name="calendar" [size]="14"></app-clinic-icon>
          <span>Phân ca trực mới</span>
        </button>
      </div>
    </app-page-header>

    <!-- Toolbar Filters -->
    <div class="clinic-card toolbar-card">
      <div class="date-filter-group">
        <button
          type="button"
          class="date-pill"
          [class.active]="selectedDateFilter() === 'ALL'"
          (click)="selectedDateFilter.set('ALL')"
        >
          Tất cả ngày
        </button>
        <button
          type="button"
          class="date-pill"
          [class.active]="selectedDateFilter() === '2026-10-06'"
          (click)="selectedDateFilter.set('2026-10-06')"
        >
          Hôm nay (06/10/2026)
        </button>
        <button
          type="button"
          class="date-pill"
          [class.active]="selectedDateFilter() === '2026-10-07'"
          (click)="selectedDateFilter.set('2026-10-07')"
        >
          Ngày mai (07/10/2026)
        </button>
      </div>

      <div class="shift-filter-group">
        <button
          type="button"
          class="shift-pill"
          [class.active]="selectedShiftFilter() === 'ALL'"
          (click)="selectedShiftFilter.set('ALL')"
        >
          Tất cả ca
        </button>
        <button
          type="button"
          class="shift-pill"
          [class.active]="selectedShiftFilter() === 'MORNING'"
          (click)="selectedShiftFilter.set('MORNING')"
        >
          <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
          Ca Sáng (07:30 - 11:30)
        </button>
        <button
          type="button"
          class="shift-pill"
          [class.active]="selectedShiftFilter() === 'AFTERNOON'"
          (click)="selectedShiftFilter.set('AFTERNOON')"
        >
          <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
          Ca Chiều (13:30 - 17:00)
        </button>
        <button
          type="button"
          class="shift-pill"
          [class.active]="selectedShiftFilter() === 'EVENING'"
          (click)="selectedShiftFilter.set('EVENING')"
        >
          <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
          Ca Tối (17:30 - 20:30)
        </button>
      </div>
    </div>

    <!-- Schedule Grid / Cards -->
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
            <span class="sch-date">{{ sch.date }}</span>
          </div>

          <div class="doctor-profile-box">
            <div class="doc-avatar">
              <app-clinic-icon name="stethoscope" [size]="16"></app-clinic-icon>
            </div>
            <div class="doc-text">
              <h4 class="doc-name font-bold">{{ sch.doctorName }}</h4>
              <span class="doc-specialty">Chuyên khoa: {{ sch.specialty }}</span>
            </div>
          </div>

          <div class="room-assignment-box">
            <app-clinic-icon name="map-pin" [size]="12" class="room-icon"></app-clinic-icon>
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
          <app-clinic-icon name="calendar" [size]="32" class="empty-icon"></app-clinic-icon>
          <p>Không có lịch trực nào được phân bổ trong ngày hoặc ca làm việc đã chọn.</p>
        </div>
      }
    </div>

    <!-- Assign Doctor Shift Modal -->
    @if (isAssignModalOpen()) {
      <div class="modal-backdrop" (click)="closeAssignModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title font-serif">Phân Lịch Trực Cho Bác Sĩ (UC023)</h3>
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
                <label>Ngày trực <span class="required">*</span></label>
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
      .toolbar-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 20px;
        margin-bottom: 24px;
        gap: 16px;
        flex-wrap: wrap;
      }

      .date-filter-group,
      .shift-filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .date-pill,
      .shift-pill {
        background: #F6F3EC;
        border: 1px solid #E4DED2;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 0.8125rem;
        font-weight: 500;
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
          font-weight: 600;
        }
      }

      .schedules-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }

      @media (max-width: 1200px) {
        .schedules-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .schedules-grid {
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
          background: rgba(94, 139, 126, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
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
            background: #9B3D45;
          }
        }
      }

      .sch-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid #F0ECE1;
      }

      .sch-status-pill {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 6px;

        &.confirmed {
          background: rgba(94, 139, 126, 0.15);
          color: #2F5A4F;
        }

        &.leave {
          background: rgba(155, 61, 69, 0.15);
          color: #9B3D45;
        }
      }

      .btn-toggle-leave {
        background: transparent;
        border: 1px solid #E4DED2;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #F6F3EC;
          color: #1C2733;
        }
      }

      .btn-gold {
        background: #B8955A;
        color: #FFFFFF;
        border: none;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background: #a3824b;
        }
      }

      .empty-box {
        grid-column: 1 / -1;
        text-align: center;
        padding: 48px;
        color: #8C96A2;

        .empty-icon {
          font-size: 2.2rem;
          display: block;
          margin-bottom: 8px;
        }
      }

      // Modal Styles
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-card {
        background: #FFFFFF;
        border-radius: 16px;
        width: 100%;
        max-width: 540px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        border: 1px solid #E4DED2;
      }

      .modal-header {
        padding: 16px 22px;
        background: #F8F6F0;
        border-bottom: 1px solid #E4DED2;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .modal-title {
          font-size: 1.15rem;
          color: #0E4A55;
          margin: 0;
        }

        .modal-close {
          background: transparent;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: #8C96A2;
        }
      }

      .modal-form {
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1C2733;
        }

        .required {
          color: #9B3D45;
        }
      }

      .error-msg {
        background: rgba(155, 61, 69, 0.1);
        border: 1px solid rgba(155, 61, 69, 0.3);
        padding: 8px 12px;
        border-radius: 8px;
        color: #9B3D45;
        font-size: 0.8125rem;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 10px;
        padding-top: 16px;
        border-top: 1px solid #F0ECE1;

        .btn-cancel {
          background: #F6F3EC;
          border: 1px solid #E4DED2;
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
    `,
  ],
})
export class AdminSchedulesComponent {
  private adminService = inject(AdminService);

  allSchedules = this.adminService.doctorSchedules;
  activeDoctors = this.adminService.activeDoctors;

  selectedDateFilter = signal<string>('2026-10-06');
  selectedShiftFilter = signal<string>('ALL');

  filteredSchedules = computed(() => {
    let list = this.allSchedules();
    const date = this.selectedDateFilter();
    if (date !== 'ALL') {
      list = list.filter((s) => s.date === date);
    }
    const shift = this.selectedShiftFilter();
    if (shift !== 'ALL') {
      list = list.filter((s) => s.shift === shift);
    }
    return list;
  });

  getCapacityPercent(sch: DoctorSchedule): number {
    if (sch.maxPatients <= 0) return 0;
    return Math.min(100, Math.round((sch.bookedPatients / sch.maxPatients) * 100));
  }

  toggleScheduleStatus(sch: DoctorSchedule): void {
    this.adminService.toggleScheduleStatus(sch.id);
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
    this.shiftDate = '2026-10-06';
    this.shiftSlot = 'MORNING';
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

    // Schedule conflict check (same doctor, same date, same shift)
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

    this.closeAssignModal();
  }
}
