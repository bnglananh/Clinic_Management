import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { AllergyBannerComponent } from '../../../shared/components/allergy-banner/allergy-banner.component';
import { ViDatePipe } from '../../../shared/pipes/vi-date.pipe';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-reception-patients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    AllergyBannerComponent,
    ViDatePipe,
    ClinicIconComponent,
  ],
  template: `
    <app-page-header
      badgeText="HỒ SƠ BỆNH ÁN HÀNH CHÍNH"
      title="Quản Lý Hồ Sơ Bệnh Nhân"
      subtitle="Tra cứu danh bạ bệnh nhân, kiểm tra trùng lặp CCCD/SĐT, tiền sử dị ứng thuốc và tiền sử lượt khám."
    >
      <div actions>
        <button (click)="openCreateModal()" class="btn-primary-action">
          + Thêm hồ sơ mới
        </button>
      </div>
    </app-page-header>

    <!-- Search & Filter Controls -->
    <div class="clinic-card search-card">
      <div class="search-flex-row">
        <div class="search-input-box">
          <span class="search-icon">
            <app-clinic-icon name="search" [size]="16" color="#8C96A2"></app-clinic-icon>
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Tìm theo Mã bệnh nhân, Họ tên, CCCD (12 số) hoặc Số điện thoại..."
            class="input-search"
          />
        </div>

        <div class="search-stats">
          <span class="stats-text">
            Tìm thấy <strong>{{ filteredPatients().length }}</strong> hồ sơ
          </span>
        </div>
      </div>
    </div>

    <!-- Patients Data Table -->
    <div class="clinic-card table-card">
      <div class="table-responsive">
        <table class="clinic-data-table">
          <thead>
            <tr>
              <th class="col-code">Mã bệnh nhân</th>
              <th class="col-name">Họ và tên</th>
              <th class="col-cccd">CCCD (Định danh)</th>
              <th class="col-demographic">Giới tính / Ngày sinh</th>
              <th class="col-phone">Số điện thoại</th>
              <th class="col-allergy">Tiền sử dị ứng</th>
              <th class="col-blood text-center">Nhóm máu</th>
              <th class="col-visits text-center">Số lượt khám</th>
              <th class="col-actions text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filteredPatients(); track p.id) {
              <tr>
                <td class="col-code">
                  <span class="patient-code-badge font-mono">{{ p.patientCode }}</span>
                </td>
                <td class="col-name">
                  <div class="patient-name-wrap">
                    <span class="p-fullname font-bold">{{ p.fullName }}</span>
                    <span class="p-address-sub" [title]="p.address">{{ p.address }}</span>
                  </div>
                </td>
                <td class="col-cccd tabular-nums font-mono">{{ p.cccd }}</td>
                <td class="col-demographic">
                  <span class="demo-gender font-medium">{{ p.gender === 'NAM' ? 'Nam' : 'Nữ' }}</span>
                  <span class="demo-separator">•</span>
                  <span class="demo-dob">{{ p.dateOfBirth | viDate }}</span>
                </td>
                <td class="col-phone tabular-nums font-bold text-teal">{{ p.phone }}</td>
                <td class="col-allergy">
                  @if (p.allergyHistory && p.allergyHistory !== 'Không có tiền sử dị ứng' && !p.allergyHistory.toLowerCase().includes('không')) {
                    <span class="badge-allergy-alert" [title]="p.allergyHistory">
                      <app-clinic-icon name="alert-triangle" [size]="13" color="#9B3D45"></app-clinic-icon>
                      <span>Có dị ứng</span>
                    </span>
                  } @else {
                    <span class="badge-no-allergy">Bình thường</span>
                  }
                </td>
                <td class="col-blood text-center">
                  <span class="blood-type-badge">{{ p.bloodType || 'Chưa XN' }}</span>
                </td>
                <td class="col-visits text-center">
                  <span class="visit-count-badge tabular-nums">{{ p.totalVisits }} lượt</span>
                </td>
                <td class="col-actions text-right">
                  <div class="actions-cell">
                    <button
                      (click)="viewPatientDetails(p)"
                      class="btn-action-view"
                      title="Xem chi tiết hồ sơ"
                    >
                      Chi tiết
                    </button>
                    <button
                      (click)="openEditModal(p)"
                      class="btn-action-edit"
                      title="Chỉnh sửa thông tin"
                    >
                      <app-clinic-icon name="edit" [size]="14"></app-clinic-icon>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: View Patient Profile Details -->
    @if (selectedPatientForView()) {
      <div class="modal-backdrop" (click)="selectedPatientForView.set(null)">
        <div class="detail-modal-card clinic-card animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="sub-badge">HỒ SƠ BỆNH NHÂN #{{ selectedPatientForView()?.patientCode }}</span>
              <h3 class="modal-title font-serif">{{ selectedPatientForView()?.fullName }}</h3>
            </div>
            <button (click)="selectedPatientForView.set(null)" class="close-btn">
              <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
            </button>
          </div>

          <!-- Allergy Warning Banner -->
          <app-allergy-banner [allergyText]="selectedPatientForView()?.allergyHistory"></app-allergy-banner>

          <div class="profile-details-grid">
            <div class="profile-section">
              <h4 class="sec-title">Thông Tin Hành Chính</h4>
              <div class="info-row">
                <span class="lbl">CCCD (12 số):</span>
                <span class="val font-bold">{{ selectedPatientForView()?.cccd }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">Giới tính:</span>
                <span class="val">{{ selectedPatientForView()?.gender === 'NAM' ? 'Nam' : 'Nữ' }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">Ngày sinh:</span>
                <span class="val">{{ selectedPatientForView()?.dateOfBirth | viDate }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">Số điện thoại:</span>
                <span class="val font-bold text-teal">{{ selectedPatientForView()?.phone }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">Email:</span>
                <span class="val">{{ selectedPatientForView()?.email || 'Chưa cung cấp' }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">Địa chỉ:</span>
                <span class="val">{{ selectedPatientForView()?.address }}</span>
              </div>
            </div>

            <div class="profile-section">
              <h4 class="sec-title">Thông Tin Y Tế & Liên Hệ Khẩn Cấp</h4>
              <div class="info-row">
                <span class="lbl">Nhóm máu:</span>
                <span class="val font-bold text-teal">{{ selectedPatientForView()?.bloodType || 'Chưa xác định' }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">Tổng số lượt khám:</span>
                <span class="val font-bold text-sage">{{ selectedPatientForView()?.totalVisits }} lần</span>
              </div>
              <div class="info-row">
                <span class="lbl">Ngày đăng ký hồ sơ:</span>
                <span class="val">{{ selectedPatientForView()?.createdAt | viDate : 'datetime' }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">Người liên hệ khẩn:</span>
                <span class="val">{{ selectedPatientForView()?.emergencyContactName || 'Chưa thiết lập' }}</span>
              </div>
              <div class="info-row">
                <span class="lbl">SĐT liên hệ khẩn:</span>
                <span class="val font-bold">{{ selectedPatientForView()?.emergencyContactPhone || '--' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-modal-footer">
            <button (click)="openEditModal(selectedPatientForView()!)" class="btn-edit-from-view">
              Chỉnh sửa thông tin hồ sơ
            </button>
            <button (click)="selectedPatientForView.set(null)" class="btn-close-view">
              Đóng
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal: Add or Edit Patient -->
    @if (showFormModal()) {
      <div class="modal-backdrop" (click)="closeFormModal()">
        <div class="form-modal-card clinic-card animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title font-serif">
              {{ editingPatientId() ? 'Chỉnh Sửa Hồ Sơ Bệnh Nhân' : 'Tạo Hồ Sơ Bệnh Nhân Mới' }}
            </h3>
            <button (click)="closeFormModal()" class="close-btn">
              <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
            </button>
          </div>

          <form [formGroup]="patientForm" (ngSubmit)="savePatient()" class="modal-form">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Căn cước công dân (12 số) *</label>
                <input
                  type="text"
                  formControlName="cccd"
                  class="clinic-input"
                  placeholder="079..."
                  maxlength="12"
                />
                @if (cccdError()) {
                  <span class="error-msg">
                    <app-clinic-icon name="alert-triangle" [size]="13" color="#DC2626"></app-clinic-icon>
                    <span>Số CCCD này đã tồn tại trong hệ thống!</span>
                  </span>
                }
              </div>

              <div class="form-group">
                <label class="form-label">Họ và tên đầy đủ *</label>
                <input
                  type="text"
                  formControlName="fullName"
                  class="clinic-input"
                  placeholder="NGUYỄN VĂN A"
                />
              </div>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Ngày sinh *</label>
                <input type="date" formControlName="dateOfBirth" class="clinic-input" />
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
                <input type="text" formControlName="phone" class="clinic-input" placeholder="09..." />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Địa chỉ cư trú *</label>
                <input type="text" formControlName="address" class="clinic-input" placeholder="Số nhà, đường, quận/huyện..." />
              </div>
              <div class="form-group">
                <label class="form-label">Nhóm máu</label>
                <select formControlName="bloodType" class="clinic-select">
                  <option value="">Chưa xác định</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <!-- Allergy Section -->
            <div class="form-group">
              <label class="form-label text-burgundy font-bold" style="display: inline-flex; align-items: center; gap: 6px;">
                <app-clinic-icon name="alert-triangle" [size]="14" color="#9B3D45"></app-clinic-icon>
                <span>Tiền sử dị ứng thuốc & thực phẩm</span>
              </label>
              <textarea
                formControlName="allergyHistory"
                class="clinic-textarea"
                rows="2"
                placeholder="Ghi rõ các loại thuốc gây dị ứng, phản ứng quá mẫn..."
              ></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeFormModal()" class="btn-cancel">Hủy</button>
              <button
                type="submit"
                class="btn-save"
                [disabled]="patientForm.invalid || isSubmitting()"
              >
                {{ editingPatientId() ? 'Cập Nhật Thay Đổi' : 'Lưu Hồ Sơ Bệnh Nhân' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .btn-primary-action {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(14, 74, 85, 0.25);

        &:hover {
          background: #135d6b;
        }
      }

      .search-card {
        padding: 18px 24px;
        margin-bottom: 20px;
        background: #FFFFFF;
      }

      .search-flex-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .search-input-box {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1;
        max-width: 600px;
      }

      .search-icon {
        position: absolute;
        left: 14px;
        color: #8C96A2;
      }

      .input-search {
        width: 100%;
        height: 44px;
        padding: 0 16px 0 40px;
        border: 1.5px solid #E4DED2;
        border-radius: 10px;
        font-size: 0.9rem;
        outline: none;

        &:focus {
          border-color: #0E4A55;
        }
      }

      .search-stats {
        font-size: 0.85rem;
        color: #5B6672;
      }

      .table-card {
        padding: 0;
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 4px 20px -2px rgba(28, 39, 51, 0.05);
        border: 1px solid #E8E2D8;
        overflow: hidden;
      }

      .table-responsive {
        width: 100%;
        overflow-x: auto;
      }

      .clinic-data-table {
        width: 100%;
        min-width: 1140px;
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

          &:last-child td {
            border-bottom: none;
          }
        }

        .col-code {
          width: 140px;
          white-space: nowrap;
        }

        .col-name {
          min-width: 210px;
        }

        .col-cccd {
          width: 140px;
          white-space: nowrap;
          letter-spacing: 0.02em;
          color: #334155;
        }

        .col-demographic {
          width: 165px;
          white-space: nowrap;
        }

        .col-phone {
          width: 130px;
          white-space: nowrap;
        }

        .col-allergy {
          width: 140px;
          white-space: nowrap;
        }

        .col-blood {
          width: 95px;
          white-space: nowrap;
        }

        .col-visits {
          width: 115px;
          white-space: nowrap;
        }

        .col-actions {
          width: 130px;
          white-space: nowrap;
        }
      }

      .patient-code-badge {
        display: inline-block;
        padding: 3px 8px;
        background: rgba(14, 74, 85, 0.08);
        color: #0E4A55;
        border: 1px solid rgba(14, 74, 85, 0.18);
        border-radius: 6px;
        font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
        font-size: 0.82rem;
        font-weight: 700;
        white-space: nowrap;
        letter-spacing: 0.02em;
      }

      .patient-name-wrap {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .p-fullname {
          color: #0F172A;
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.35;
        }

        .p-address-sub {
          font-size: 0.76rem;
          color: #64748B;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
        }
      }

      .demo-gender {
        font-weight: 600;
        color: #334155;
      }

      .demo-separator {
        color: #CBD5E1;
        margin: 0 4px;
      }

      .demo-dob {
        color: #475569;
      }

      .badge-allergy-alert {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(155, 61, 69, 0.1);
        color: #9B3D45;
        border: 1px solid rgba(155, 61, 69, 0.28);
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
        line-height: 1.2;

        span {
          white-space: nowrap;
        }
      }

      .badge-no-allergy {
        color: #64748B;
        font-size: 0.78rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .blood-type-badge {
        display: inline-block;
        background: rgba(14, 74, 85, 0.08);
        color: #0E4A55;
        border: 1px solid rgba(14, 74, 85, 0.2);
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 0.78rem;
        white-space: nowrap;
      }

      .visit-count-badge {
        display: inline-block;
        background: #F1F5F9;
        color: #334155;
        font-weight: 650;
        padding: 3px 9px;
        border-radius: 6px;
        font-size: 0.78rem;
        white-space: nowrap;
        border: 1px solid #E2E8F0;
      }

      .actions-cell {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        white-space: nowrap;

        .btn-action-view {
          display: inline-flex;
          align-items: center;
          background: rgba(14, 74, 85, 0.08);
          border: 1px solid rgba(14, 74, 85, 0.25);
          color: #0E4A55;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;

          &:hover {
            background: #0E4A55;
            color: #FFFFFF;
            border-color: #0E4A55;
          }
        }

        .btn-action-edit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #FFFFFF;
          border: 1px solid #E2DCD0;
          color: #475569;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #0E4A55;
            color: #0E4A55;
            background: rgba(14, 74, 85, 0.05);
          }
        }
      }

      // Modals
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

      .detail-modal-card {
        width: 100%;
        max-width: 760px;
        background: #FFFFFF;
        padding: 28px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .form-modal-card {
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
        align-items: flex-start;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #E4DED2;
      }

      .sub-badge {
        font-size: 0.72rem;
        font-weight: 700;
        color: #B8955A;
      }

      .modal-title {
        font-size: 1.6rem;
        color: #0E4A55;
        margin: 2px 0 0 0;
      }

      .close-btn {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        color: #8C96A2;
        cursor: pointer;
      }

      .profile-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 20px;
      }

      @media (max-width: 700px) {
        .profile-details-grid {
          grid-template-columns: 1fr;
        }
      }

      .profile-section {
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .sec-title {
        font-size: 0.92rem;
        font-weight: 700;
        color: #1C2733;
        margin: 0 0 4px 0;
        padding-bottom: 6px;
        border-bottom: 1px dashed #E4DED2;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.83rem;
      }

      .lbl {
        color: #5B6672;
      }

      .val {
        color: #1C2733;
        text-align: right;
      }

      .detail-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 14px;
        border-top: 1px solid #E4DED2;
      }

      .btn-edit-from-view {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-close-view {
        background: transparent;
        border: 1px solid #E4DED2;
        padding: 9px 16px;
        border-radius: 10px;
        cursor: pointer;
      }

      // Form inside modal
      .modal-form {
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

      .clinic-input, .clinic-select {
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
      .text-center {
        text-align: center;
      }
    `,
  ],
})
export class ReceptionPatientsComponent {
  private patientService = inject(PatientService);
  private fb = inject(FormBuilder);

  patients = this.patientService.patients;
  searchQuery = '';
  searchResults = signal<Patient[] | null>(null);

  selectedPatientForView = signal<Patient | null>(null);
  showFormModal = signal<boolean>(false);
  editingPatientId = signal<string | null>(null);
  cccdError = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  patientForm = this.fb.group({
    cccd: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(12)]],
    fullName: ['', [Validators.required]],
    dateOfBirth: ['1990-01-01', [Validators.required]],
    gender: ['NAM' as 'NAM' | 'NU' | 'KHAC', [Validators.required]],
    phone: ['', [Validators.required]],
    address: ['TP. Hồ Chí Minh', [Validators.required]],
    bloodType: ['O+'],
    allergyHistory: ['Không có tiền sử dị ứng'],
  });

  filteredPatients = computed(() => {
    return this.searchResults() || this.patients();
  });

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults.set(null);
      return;
    }
    this.patientService.getPatients(this.searchQuery).subscribe((results) => {
      this.searchResults.set(results);
    });
  }

  viewPatientDetails(p: Patient): void {
    this.selectedPatientForView.set(p);
  }

  openCreateModal(): void {
    this.editingPatientId.set(null);
    this.cccdError.set(false);
    this.patientForm.reset({
      gender: 'NAM',
      address: 'TP. Hồ Chí Minh',
      bloodType: 'O+',
      allergyHistory: 'Không có tiền sử dị ứng',
    });
    this.showFormModal.set(true);
  }

  openEditModal(p: Patient): void {
    this.editingPatientId.set(p.id);
    this.cccdError.set(false);
    this.patientForm.patchValue({
      cccd: p.cccd,
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      phone: p.phone,
      address: p.address,
      bloodType: p.bloodType || '',
      allergyHistory: p.allergyHistory || 'Không có tiền sử dị ứng',
    });
    if (this.selectedPatientForView()) {
      this.selectedPatientForView.set(null);
    }
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
  }

  savePatient(): void {
    if (this.patientForm.invalid) return;

    const val = this.patientForm.value;
    const cccd = (val.cccd || '').trim();
    const editId = this.editingPatientId();

    if (this.patientService.checkDuplicateCccd(cccd, editId || undefined)) {
      this.cccdError.set(true);
      return;
    }

    this.isSubmitting.set(true);

    if (editId) {
      this.patientService
        .updatePatient(editId, {
          cccd,
          fullName: val.fullName || '',
          dateOfBirth: val.dateOfBirth || '',
          gender: (val.gender as 'NAM' | 'NU' | 'KHAC') || 'NAM',
          phone: val.phone || '',
          address: val.address || '',
          bloodType: (val.bloodType as any) || undefined,
          allergyHistory: val.allergyHistory || undefined,
        })
        .subscribe(() => {
          this.isSubmitting.set(false);
          this.closeFormModal();
        });
    } else {
      this.patientService
        .createPatient({
          cccd,
          fullName: val.fullName || '',
          dateOfBirth: val.dateOfBirth || '',
          gender: (val.gender as 'NAM' | 'NU' | 'KHAC') || 'NAM',
          phone: val.phone || '',
          address: val.address || '',
          bloodType: (val.bloodType as any) || undefined,
          allergyHistory: val.allergyHistory || undefined,
        })
        .subscribe(() => {
          this.isSubmitting.set(false);
          this.closeFormModal();
        });
    }
  }
}
