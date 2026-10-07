import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { QueueService } from '../../../core/services/queue.service';
import { Patient } from '../../../core/models/patient.model';
import { Appointment } from '../../../core/models/appointment.model';
import { QueueTicket, PriorityLevel } from '../../../core/models/queue.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { QueueTicketComponent } from '../../../shared/components/queue-ticket/queue-ticket.component';
import { AllergyBannerComponent } from '../../../shared/components/allergy-banner/allergy-banner.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-reception-checkin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    QueueTicketComponent,
    AllergyBannerComponent,
    ClinicIconComponent,
  ],
  template: `
    <app-page-header
      badgeText="BÀN TIẾP ĐÓN"
      title="Tiếp Nhận & Check-in Bệnh Nhân"
      subtitle="Tra cứu hồ sơ theo CCCD/SĐT, tiếp nhận lịch hẹn hoặc khách vãng lai, cấp số thứ tự vào hàng đợi phòng khám."
    >
      <div actions>
        <button (click)="openNewPatientModal()" class="btn-create-patient">
          + Đăng ký bệnh nhân mới
        </button>
      </div>
    </app-page-header>

    <!-- Check-in Tabs -->
    <div class="checkin-container">
      <div class="tab-switch-bar">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'APPOINTMENTS'"
          (click)="activeTab.set('APPOINTMENTS')"
        >
          <app-clinic-icon name="calendar" [size]="15"></app-clinic-icon>
          Danh Sách Đặt Hẹn Hôm Nay ({{ appointments().length }})
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'WALKIN'"
          (click)="activeTab.set('WALKIN')"
        >
          <app-clinic-icon name="user" [size]="15"></app-clinic-icon>
          Tiếp Nhận Vãng Lai (Walk-in)
        </button>
      </div>

      <!-- Tab 1: Appointments Check-in -->
      @if (activeTab() === 'APPOINTMENTS') {
        <div class="clinic-card tab-content-card">
          <div class="search-and-filter-row">
            <div class="search-box">
              <app-clinic-icon name="search" [size]="15" class="s-icon"></app-clinic-icon>
              <input
                type="text"
                [(ngModel)]="aptSearchQuery"
                placeholder="Tìm theo tên bệnh nhân, SĐT hoặc mã lịch hẹn..."
                class="s-input"
              />
            </div>
            <div class="filter-count">
              <span>Hiển thị {{ filteredAppointments().length }} lịch hẹn</span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="clinic-data-table">
              <thead>
                <tr>
                  <th class="col-code">Mã hẹn</th>
                  <th class="col-patient">Họ và tên bệnh nhân</th>
                  <th class="col-phone">Số điện thoại</th>
                  <th class="col-dept">Chuyên khoa khám</th>
                  <th class="col-doctor">Bác sĩ chỉ định</th>
                  <th class="col-time text-center">Khung giờ hẹn</th>
                  <th class="col-status text-center">Trạng thái hẹn</th>
                  <th class="col-action text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                @for (apt of filteredAppointments(); track apt.id) {
                  <tr>
                    <td class="col-code">
                      <span class="appointment-code-badge font-bold">{{ apt.appointmentCode }}</span>
                    </td>
                    <td class="col-patient">
                      <div class="p-cell">
                        <span class="p-name font-bold">{{ apt.patientName }}</span>
                        <span class="p-code text-secondary-slate">{{ apt.patientCode }}</span>
                      </div>
                    </td>
                    <td class="col-phone">
                      <span class="phone-text">{{ apt.phone }}</span>
                    </td>
                    <td class="col-dept">
                      <span class="dept-text font-semibold">{{ apt.department }}</span>
                    </td>
                    <td class="col-doctor">
                      <span class="doctor-text">{{ apt.doctorName }}</span>
                    </td>
                    <td class="col-time text-center">
                      <span class="time-slot-badge">{{ apt.timeSlot }}</span>
                    </td>
                    <td class="col-status text-center">
                      @if (apt.status === 'CHECKED_IN') {
                        <span class="badge-checked-in">Đã Check-in</span>
                      } @else if (apt.status === 'CONFIRMED') {
                        <span class="badge-confirmed">Chờ đến khám</span>
                      } @else {
                        <span class="badge-pending">Chờ xác nhận</span>
                      }
                    </td>
                    <td class="col-action text-right">
                      @if (apt.status !== 'CHECKED_IN') {
                        <button
                          (click)="openCheckinDialog(apt)"
                          class="btn-checkin-action"
                        >
                          Check-in & Cấp số
                        </button>
                      } @else {
                        <span class="checked-in-indicator font-bold">
                          <app-clinic-icon name="check" [size]="14"></app-clinic-icon>
                          <span>Đã cấp số</span>
                        </span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Tab 2: Walk-in Check-in -->
      @if (activeTab() === 'WALKIN') {
        <div class="clinic-card tab-content-card">
          <div class="walkin-grid">
            <!-- Left: Search Existing Patient -->
            <div class="walkin-search-zone">
              <h3 class="zone-title">1. Tìm kiếm bệnh nhân theo CCCD hoặc SĐT</h3>
              <div class="search-box">
                <app-clinic-icon name="search" [size]="15" class="s-icon"></app-clinic-icon>
                <input
                  type="text"
                  [(ngModel)]="walkinSearchQuery"
                  (input)="onSearchWalkin()"
                  placeholder="Nhập 12 số CCCD, Số điện thoại hoặc Họ tên..."
                  class="s-input"
                />
              </div>

              <!-- Search Results Dropdown List -->
              <div class="search-results-list">
                @for (patient of foundPatients(); track patient.id) {
                  <div
                    class="patient-search-item"
                    [class.selected]="selectedWalkinPatient()?.id === patient.id"
                    (click)="selectWalkinPatient(patient)"
                  >
                    <div class="p-avatar-circle">
                      <app-clinic-icon name="user" [size]="15"></app-clinic-icon>
                    </div>
                    <div class="p-search-text">
                      <div class="p-top-line">
                        <span class="p-name font-bold">{{ patient.fullName }}</span>
                        <span class="p-badge-cccd">CCCD: {{ patient.cccd }}</span>
                      </div>
                      <div class="p-sub-line">
                        <span>{{ patient.patientCode }}</span>
                        <span>•</span>
                        <span>SĐT: {{ patient.phone }}</span>
                        <span>•</span>
                        <span>Năm sinh: {{ patient.dateOfBirth.slice(0, 4) }}</span>
                      </div>
                    </div>
                  </div>
                }
                @if (foundPatients().length === 0 && walkinSearchQuery) {
                  <div class="empty-search-alert">
                    <span>Không tìm thấy bệnh nhân. Bạn có thể bấm nút <strong>+ Đăng ký bệnh nhân mới</strong> bên trên.</span>
                  </div>
                }
              </div>
            </div>

            <!-- Right: Clinic Room & Priority Assign -->
            <div class="walkin-assign-zone">
              <h3 class="zone-title">2. Chọn Phòng Khám & Cấp Số Thứ Tự</h3>

              @if (selectedWalkinPatient(); as p) {
                <!-- Allergy warning if present -->
                <app-allergy-banner [allergyText]="p.allergyHistory"></app-allergy-banner>

                <div class="patient-selected-card">
                  <div class="p-card-top">
                    <div>
                      <h4 class="sel-name">{{ p.fullName }}</h4>
                      <span class="sel-meta">{{ p.patientCode }} • {{ p.phone }} • {{ p.address }}</span>
                    </div>
                    <span class="badge-walkin">Khách Vãng Lai</span>
                  </div>
                </div>

                <form [formGroup]="walkinForm" (ngSubmit)="submitWalkinCheckin()" class="walkin-form">
                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">Chọn Chuyên khoa / Buồng khám *</label>
                      <select formControlName="roomName" class="clinic-select">
                        <option value="Phòng Khám Nội 101">Phòng Khám Nội 101 (TS.BS Trần Minh Hoàng)</option>
                        <option value="Phòng Tai Mũi Họng 104">Phòng Tai Mũi Họng 104 (ThS.BS Vũ Hải Đăng)</option>
                        <option value="Phòng Khám Tiêu Hóa 202">Phòng Khám Tiêu Hóa 202 (BSCKII Nguyễn Hoàng Long)</option>
                        <option value="Phòng Khám Nhi 105">Phòng Khám Nhi 105 (BS. Nguyễn Mai Trang)</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Mức độ ưu tiên *</label>
                      <select formControlName="priority" class="clinic-select">
                        <option value="NORMAL">Thường (Xếp theo thứ tự đến)</option>
                        <option value="PRIORITY">Ưu tiên (VIP, Người cao tuổi, Trẻ em)</option>
                        <option value="EMERGENCY">Cấp cứu (Đưa ngay lên đầu hàng đợi)</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Ghi chú triệu chứng ban đầu</label>
                    <input
                      type="text"
                      formControlName="notes"
                      class="clinic-input-full"
                      placeholder="Ví dụ: Đau đầu, sốt nhẹ, chóng mặt..."
                    />
                  </div>

                  <button
                    type="submit"
                    class="btn-submit-walkin"
                    [disabled]="isSubmitting()"
                  >
                    @if (isSubmitting()) {
                      <span>Đang cấp số thứ tự...</span>
                    } @else {
                      <span class="btn-ticket-content">
                        <app-clinic-icon name="ticket" [size]="16"></app-clinic-icon>
                        Cấp Số Thứ Tự & In Phiếu K80 Ngay
                      </span>
                    }
                  </button>
                </form>
              } @else {
                <div class="no-patient-selected">
                  <app-clinic-icon name="user" [size]="32" class="no-p-icon"></app-clinic-icon>
                  <p>Vui lòng tìm và chọn một bệnh nhân ở cột bên trái để phân buồng khám.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Modal 1: Register New Patient Drawer / Modal -->
    @if (showNewPatientModal()) {
      <div class="modal-backdrop" (click)="closeNewPatientModal()">
        <div class="modal-card clinic-card animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title font-serif">Đăng Ký Hồ Sơ Bệnh Nhân Mới</h3>
            <button (click)="closeNewPatientModal()" class="close-btn" aria-label="Đóng">
              <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
            </button>
          </div>

          <form [formGroup]="patientForm" (ngSubmit)="submitNewPatient()" class="patient-modal-form">
            <!-- CCCD & Validation -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Căn cước công dân (12 số) *</label>
                <input
                  type="text"
                  formControlName="cccd"
                  class="clinic-input-full"
                  placeholder="079..."
                  maxlength="12"
                />
                @if (cccdDuplicateError()) {
                  <span class="error-msg">
                    <app-clinic-icon name="alert-triangle" [size]="14"></app-clinic-icon>
                    Cảnh báo: Số CCCD này đã tồn tại trong hệ thống!
                  </span>
                }
              </div>

              <div class="form-group">
                <label class="form-label">Họ và tên đầy đủ *</label>
                <input
                  type="text"
                  formControlName="fullName"
                  class="clinic-input-full"
                  placeholder="NGUYỄN VĂN A"
                />
              </div>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Ngày sinh *</label>
                <input type="date" formControlName="dateOfBirth" class="clinic-input-full" />
              </div>
              <div class="form-group">
                <label class="form-label">Giới tính *</label>
                <select formControlName="gender" class="clinic-select">
                  <option value="NAM">Nam</option>
                  <option value="NU">Nữ</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Số điện thoại *</label>
                <input
                  type="text"
                  formControlName="phone"
                  class="clinic-input-full"
                  placeholder="09..."
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Địa chỉ cư trú</label>
              <input
                type="text"
                formControlName="address"
                class="clinic-input-full"
                placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP..."
              />
            </div>

            <!-- Allergy Input -->
            <div class="form-group">
              <label class="form-label text-burgundy font-bold">
                <app-clinic-icon name="alert-triangle" [size]="14"></app-clinic-icon>
                Tiền sử dị ứng thuốc & thực phẩm (Quan trọng)
              </label>
              <textarea
                formControlName="allergyHistory"
                class="clinic-textarea"
                rows="2"
                placeholder="Ghi rõ tên thuốc dị ứng (ví dụ: Penicillin, Aspirin...) hoặc ghi 'Không có'"
              ></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeNewPatientModal()" class="btn-cancel">
                Hủy bỏ
              </button>
              <button
                type="submit"
                class="btn-save"
                [disabled]="patientForm.invalid || isSubmitting()"
              >
                Lưu Hồ Sơ & Tiếp Nhận
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal 2: Printable K80 Ticket Modal -->
    @if (currentIssuedTicket()) {
      <app-queue-ticket
        [ticket]="currentIssuedTicket()!"
        (close)="currentIssuedTicket.set(null)"
      ></app-queue-ticket>
    }
  `,
  styles: [
    `
      .btn-create-patient {
        background: #B8955A;
        color: #FFFFFF;
        border: none;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(184, 149, 90, 0.3);

        &:hover {
          background: #a38249;
        }
      }

      .checkin-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .tab-switch-bar {
        display: flex;
        gap: 12px;
        border-bottom: 2px solid #E4DED2;
        padding-bottom: 4px;
      }

      .tab-btn {
        background: transparent;
        border: none;
        padding: 10px 20px;
        font-size: 0.95rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;

        &:hover {
          color: #0E4A55;
        }

        &.active {
          color: #0E4A55;

          &::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 0;
            right: 0;
            height: 3px;
            background: #0E4A55;
            border-radius: 3px 3px 0 0;
          }
        }
      }

      .tab-content-card {
        padding: 24px;
        background: #FFFFFF;
      }

      .search-and-filter-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
      }

      .search-box {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        max-width: 440px;
      }

      .s-icon {
        position: absolute;
        left: 12px;
        color: #8C96A2;
      }

      .s-input {
        width: 100%;
        height: 40px;
        padding: 0 14px 0 36px;
        border: 1px solid #E4DED2;
        border-radius: 10px;
        font-size: 0.88rem;
        outline: none;

        &:focus {
          border-color: #0E4A55;
        }
      }

      .filter-count {
        font-size: 0.84rem;
        color: #8C96A2;
      }

      .table-responsive {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 12px;
        border: 1px solid #EBE5DA;
        background: #FFFFFF;
      }

      .clinic-data-table {
        width: 100%;
        min-width: 880px;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 0.85rem;

        thead {
          background: #FAF7F2;
        }

        th {
          background: #FAF7F2;
          color: #4A5868;
          font-weight: 700;
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          text-align: left;
          padding: 12px 10px;
          border-bottom: 2px solid #E2DCD0;
          white-space: nowrap;

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

          &:not(:last-child) td {
            border-bottom: 1px solid #F0ECE4;
          }
        }

        td {
          padding: 12px 10px;
          vertical-align: middle;
          color: #1C2733;

          &.text-center {
            text-align: center;
          }

          &.text-right {
            text-align: right;
          }
        }
      }

      /* Specific proportional column width allocation (Total: 100%) */
      .col-code {
        width: 11%;
        white-space: nowrap;
      }

      .appointment-code-badge {
        font-family: monospace;
        font-size: 0.8rem;
        color: #0E4A55;
        background: rgba(14, 74, 85, 0.08);
        padding: 3px 6px;
        border-radius: 6px;
        border: 1px solid rgba(14, 74, 85, 0.2);
        white-space: nowrap;
        display: inline-block;
      }

      .col-patient {
        width: 18%;
      }

      .p-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .p-name {
        color: #1C2733;
        font-size: 0.85rem;
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .p-code {
        font-size: 0.72rem;
        color: #718096;
        font-family: monospace;
      }

      .col-phone {
        width: 11%;
        white-space: nowrap;
      }

      .phone-text {
        color: #2D3748;
        font-weight: 500;
        font-size: 0.83rem;
        letter-spacing: 0.01em;
        white-space: nowrap;
      }

      .col-dept {
        width: 14%;
      }

      .dept-text {
        color: #1C2733;
        font-size: 0.83rem;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .col-doctor {
        width: 15%;
      }

      .doctor-text {
        color: #384654;
        font-size: 0.83rem;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .col-time {
        width: 10%;
        white-space: nowrap;
      }

      .time-slot-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #F4EFE6;
        color: #0E4A55;
        border: 1px solid #E5DFD3;
        font-weight: 700;
        padding: 3px 6px;
        border-radius: 6px;
        font-size: 0.75rem;
        white-space: nowrap;
      }

      .col-status {
        width: 9%;
        white-space: nowrap;
      }

      .badge-checked-in {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(94, 139, 126, 0.18);
        color: #2B574B;
        border: 1px solid rgba(94, 139, 126, 0.4);
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.73rem;
        white-space: nowrap;
      }

      .badge-confirmed {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(184, 149, 90, 0.18);
        color: #7D5E24;
        border: 1px solid rgba(184, 149, 90, 0.4);
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.73rem;
        white-space: nowrap;
      }

      .badge-pending {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #EDF2F7;
        color: #4A5568;
        border: 1px solid #CBD5E0;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.73rem;
        white-space: nowrap;
      }

      .col-action {
        width: 12%;
        white-space: nowrap;
      }

      .btn-checkin-action {
        background: linear-gradient(135deg, #0E4A55 0%, #155764 100%);
        color: #FFFFFF;
        border: none;
        padding: 6px 10px;
        border-radius: 7px;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(14, 74, 85, 0.2);

        &:hover {
          background: linear-gradient(135deg, #135d6b 0%, #1b6c7c 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(14, 74, 85, 0.3);
        }
      }

      .checked-in-indicator {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 5px;
        color: #2E6554;
        font-size: 0.78rem;
        white-space: nowrap;
      }

      // Walk-in layout
      .walkin-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
      }

      @media (max-width: 960px) {
        .walkin-grid {
          grid-template-columns: 1fr;
        }
      }

      .zone-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1C2733;
        margin: 0 0 14px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #E4DED2;
      }

      .search-results-list {
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 440px;
        overflow-y: auto;
      }

      .patient-search-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid #E4DED2;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #FFFFFF;

        &:hover {
          border-color: #0E4A55;
          background: #FAF8F5;
        }

        &.selected {
          border-color: #0E4A55;
          background: rgba(14, 74, 85, 0.08);
          box-shadow: 0 2px 8px rgba(14, 74, 85, 0.15);
        }
      }

      .p-avatar-circle {
        font-size: 1.6rem;
      }

      .p-search-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .p-top-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .p-badge-cccd {
        font-size: 0.72rem;
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        padding: 2px 6px;
        border-radius: 4px;
        color: #5B6672;
      }

      .p-sub-line {
        font-size: 0.76rem;
        color: #8C96A2;
        display: flex;
        gap: 6px;
      }

      .empty-search-alert {
        padding: 20px;
        background: #FAF8F5;
        border: 1px dashed #E4DED2;
        border-radius: 10px;
        font-size: 0.84rem;
        color: #5B6672;
        text-align: center;
      }

      // Assign Zone
      .patient-selected-card {
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 18px;
      }

      .p-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .sel-name {
        margin: 0 0 4px 0;
        font-size: 1.1rem;
        color: #0E4A55;
      }

      .sel-meta {
        font-size: 0.8rem;
        color: #5B6672;
      }

      .badge-walkin {
        font-size: 0.72rem;
        font-weight: 700;
        background: rgba(184, 149, 90, 0.15);
        color: #8C6C32;
        padding: 3px 8px;
        border-radius: 999px;
      }

      .walkin-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .form-row-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-label {
        font-size: 0.82rem;
        font-weight: 600;
        color: #1C2733;
      }

      .clinic-select, .clinic-input-full {
        height: 42px;
        border: 1px solid #E4DED2;
        border-radius: 10px;
        padding: 0 12px;
        font-size: 0.88rem;
        outline: none;
        background: #FFFFFF;

        &:focus {
          border-color: #0E4A55;
        }
      }

      .clinic-textarea {
        border: 1px solid #E4DED2;
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 0.88rem;
        outline: none;
        resize: vertical;

        &:focus {
          border-color: #9B3D45;
        }
      }

      .btn-submit-walkin {
        height: 48px;
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(14, 74, 85, 0.25);

        &:hover:not(:disabled) {
          background: #135d6b;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .no-patient-selected {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        border: 1.5px dashed #E4DED2;
        border-radius: 12px;
        color: #8C96A2;
        text-align: center;
        gap: 10px;

        .no-p-icon {
          font-size: 2.2rem;
        }
      }

      // Modal
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.65);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .modal-card {
        width: 100%;
        max-width: 680px;
        background: #FFFFFF;
        padding: 28px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #E4DED2;
      }

      .modal-title {
        font-size: 1.5rem;
        color: #0E4A55;
        margin: 0;
      }

      .close-btn {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        color: #8C96A2;
        cursor: pointer;
      }

      .patient-modal-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 10px;
      }

      .btn-cancel {
        background: transparent;
        border: 1px solid #E4DED2;
        color: #5B6672;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 500;
        cursor: pointer;
      }

      .btn-save {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 9px 22px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;

        &:hover:not(:disabled) {
          background: #135d6b;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .error-msg {
        font-size: 0.75rem;
        color: #9B3D45;
        font-weight: 600;
      }

      .text-right {
        text-align: right;
      }
    `,
  ],
})
export class ReceptionCheckinComponent {
  private patientService = inject(PatientService);
  private queueService = inject(QueueService);
  private fb = inject(FormBuilder);

  activeTab = signal<'APPOINTMENTS' | 'WALKIN'>('APPOINTMENTS');
  appointments = this.queueService.appointments;

  aptSearchQuery = '';
  walkinSearchQuery = '';
  foundPatients = signal<Patient[]>([]);
  selectedWalkinPatient = signal<Patient | null>(null);

  isSubmitting = signal<boolean>(false);
  showNewPatientModal = signal<boolean>(false);
  cccdDuplicateError = signal<boolean>(false);

  currentIssuedTicket = signal<QueueTicket | null>(null);

  walkinForm = this.fb.group({
    roomName: ['Phòng Khám Nội 101', [Validators.required]],
    priority: ['NORMAL' as PriorityLevel, [Validators.required]],
    notes: [''],
  });

  patientForm = this.fb.group({
    cccd: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(12)]],
    fullName: ['', [Validators.required]],
    dateOfBirth: ['1990-01-01', [Validators.required]],
    gender: ['NAM' as 'NAM' | 'NU' | 'KHAC', [Validators.required]],
    phone: ['', [Validators.required]],
    address: ['TP. Hồ Chí Minh', [Validators.required]],
    allergyHistory: ['Không có tiền sử dị ứng'],
  });

  filteredAppointments = computed(() => {
    const list = this.appointments();
    if (!this.aptSearchQuery.trim()) return list;
    const q = this.aptSearchQuery.toLowerCase().trim();
    return list.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.appointmentCode.toLowerCase().includes(q)
    );
  });

  onSearchWalkin(): void {
    if (!this.walkinSearchQuery.trim()) {
      this.foundPatients.set([]);
      return;
    }
    this.patientService.getPatients(this.walkinSearchQuery).subscribe((results) => {
      this.foundPatients.set(results);
    });
  }

  selectWalkinPatient(p: Patient): void {
    this.selectedWalkinPatient.set(p);
  }

  openCheckinDialog(apt: Appointment): void {
    this.isSubmitting.set(true);
    this.queueService
      .issueTicket({
        patientId: apt.patientId,
        patientCode: apt.patientCode,
        patientName: apt.patientName,
        gender: 'NAM',
        yearOfBirth: 1985,
        phone: apt.phone,
        roomName: 'Phòng Khám Nội 101',
        doctorName: apt.doctorName,
        priority: 'NORMAL',
        appointmentId: apt.id,
        notes: apt.reasonForVisit,
      })
      .subscribe((ticket) => {
        this.isSubmitting.set(false);
        this.currentIssuedTicket.set(ticket);
      });
  }

  submitWalkinCheckin(): void {
    const p = this.selectedWalkinPatient();
    if (!p) return;

    this.isSubmitting.set(true);
    const formVal = this.walkinForm.value;

    this.queueService
      .issueTicket({
        patientId: p.id,
        patientCode: p.patientCode,
        patientName: p.fullName,
        gender: p.gender,
        yearOfBirth: parseInt(p.dateOfBirth.slice(0, 4), 10) || 1990,
        phone: p.phone,
        roomName: formVal.roomName || 'Phòng Khám Nội 101',
        priority: formVal.priority || 'NORMAL',
        notes: formVal.notes || undefined,
      })
      .subscribe((ticket) => {
        this.isSubmitting.set(false);
        this.currentIssuedTicket.set(ticket);
        this.selectedWalkinPatient.set(null);
        this.walkinSearchQuery = '';
        this.foundPatients.set([]);
      });
  }

  openNewPatientModal(): void {
    this.cccdDuplicateError.set(false);
    this.showNewPatientModal.set(true);
  }

  closeNewPatientModal(): void {
    this.showNewPatientModal.set(false);
  }

  submitNewPatient(): void {
    if (this.patientForm.invalid) return;

    const val = this.patientForm.value;
    const cccd = (val.cccd || '').trim();

    // Check duplicate CCCD
    if (this.patientService.checkDuplicateCccd(cccd)) {
      this.cccdDuplicateError.set(true);
      return;
    }

    this.isSubmitting.set(true);
    this.patientService
      .createPatient({
        cccd,
        fullName: val.fullName || '',
        dateOfBirth: val.dateOfBirth || '',
        gender: (val.gender as 'NAM' | 'NU' | 'KHAC') || 'NAM',
        phone: val.phone || '',
        address: val.address || '',
        allergyHistory: val.allergyHistory || undefined,
      })
      .subscribe((newP) => {
        this.isSubmitting.set(false);
        this.closeNewPatientModal();
        this.patientForm.reset({
          gender: 'NAM',
          address: 'TP. Hồ Chí Minh',
          allergyHistory: 'Không có tiền sử dị ứng',
        });
        // Auto select newly created patient in walkin tab
        this.activeTab.set('WALKIN');
        this.selectedWalkinPatient.set(newP);
      });
  }
}
