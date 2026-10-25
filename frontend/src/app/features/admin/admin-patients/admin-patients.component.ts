import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PatientAccount, MembershipTier } from '../../../core/models/admin.model';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ClinicIconComponent],
  template: `
    <app-page-header
      badgeText="CỔNG DỊCH VỤ TRỰC TUYẾN (PATIENT PORTAL)"
      title="Quản Lý Tài Khoản Bệnh Nhân Đã Đăng Ký"
      subtitle="Quản lý danh sách tài khoản người bệnh đã đăng ký trên cổng dịch vụ trực tuyến Smart Clinic, theo dõi trạng thái bảo mật, hồ sơ định danh CCCD và hỗ trợ cấp lại mật khẩu."
    >
      <div actions>
        <button class="btn-gold" (click)="openCreateModal()">
          <app-clinic-icon name="user-plus" [size]="16"></app-clinic-icon>
          <span>Cấp tài khoản mới</span>
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

    <!-- 1. KPI Metrics Summary Cards -->
    <div class="kpi-metrics-row">
      <div class="kpi-metric-card">
        <div class="kpi-icon-box teal">
          <app-clinic-icon name="users" [size]="20"></app-clinic-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Tổng tài khoản đã đăng ký</span>
          <span class="kpi-value">{{ allPatientAccounts().length }} tài khoản</span>
        </div>
      </div>

      <div class="kpi-metric-card">
        <div class="kpi-icon-box sage">
          <app-clinic-icon name="check-circle" [size]="20"></app-clinic-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Đang hoạt động bình thường</span>
          <span class="kpi-value text-sage">{{ activeCount() }} tài khoản</span>
        </div>
      </div>

      <div class="kpi-metric-card">
        <div class="kpi-icon-box burgundy">
          <app-clinic-icon name="lock" [size]="20"></app-clinic-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Tạm khóa / Cảnh báo bảo mật</span>
          <span class="kpi-value text-burgundy">{{ lockedCount() }} tài khoản</span>
        </div>
      </div>

      <div class="kpi-metric-card">
        <div class="kpi-icon-box gold">
          <app-clinic-icon name="sparkle" [size]="20"></app-clinic-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Hội viên VIP & Hạng Vàng</span>
          <span class="kpi-value text-gold">{{ vipCount() }} bệnh nhân</span>
        </div>
      </div>
    </div>

    <!-- 2. Toolbar: Search Box & Status Filter Pills -->
    <div class="patients-toolbar clinic-card">
      <div class="search-box">
        <app-clinic-icon name="search" [size]="16" class="search-icon"></app-clinic-icon>
        <input
          type="text"
          placeholder="Tìm họ tên, mã BN (BN-2026-...), SĐT, CCCD, email..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          class="clinic-input search-input"
        />
      </div>

      <div class="filter-group">
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedFilter() === 'ALL'"
          (click)="selectedFilter.set('ALL')"
        >
          Tất cả ({{ allPatientAccounts().length }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedFilter() === 'ACTIVE'"
          (click)="selectedFilter.set('ACTIVE')"
        >
          <app-clinic-icon name="check" [size]="12"></app-clinic-icon>
          Đang hoạt động ({{ activeCount() }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedFilter() === 'LOCKED'"
          (click)="selectedFilter.set('LOCKED')"
        >
          <app-clinic-icon name="lock" [size]="12"></app-clinic-icon>
          Tạm khóa ({{ lockedCount() }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedFilter() === 'VIP_GOLD'"
          (click)="selectedFilter.set('VIP_GOLD')"
        >
          <app-clinic-icon name="sparkle" [size]="12"></app-clinic-icon>
          Hạng VIP & Vàng ({{ vipCount() }})
        </button>
      </div>
    </div>

    <!-- 3. Table of Registered Patient Accounts -->
    <div class="clinic-card table-card">
      <div class="table-responsive">
        <table class="clinic-table">
          <thead>
            <tr>
              <th>Mã Bệnh Nhân</th>
              <th>Họ và Tên</th>
              <th>Tài khoản đăng nhập (SĐT)</th>
              <th>Định danh CCCD</th>
              <th>Hạng Hội Viên</th>
              <th>Lần đăng nhập cuối</th>
              <th>Trạng thái</th>
              <th style="text-align: right;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (pat of filteredAccounts(); track pat.id) {
              <tr [class.locked-row]="pat.status === 'LOCKED'">
                <td>
                  <span class="patient-code-tag font-mono">{{ pat.patientCode }}</span>
                </td>
                <td>
                  <div class="patient-identity">
                    <div class="patient-name-block">
                      <span class="patient-name font-bold">{{ pat.fullName }}</span>
                      <span class="patient-submeta">
                        {{ pat.gender === 'NAM' ? 'Nam' : 'Nữ' }} • {{ pat.dateOfBirth }} • {{ pat.totalVisits }} lượt khám
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="login-id-block">
                    <span class="phone-num font-mono font-bold">{{ pat.phone }}</span>
                    <span class="email-sub">{{ pat.email }}</span>
                  </div>
                </td>
                <td>
                  <span class="cccd-text font-mono">{{ pat.cccd }}</span>
                </td>
                <td>
                  <span class="tier-pill" [class]="pat.membershipTier.toLowerCase()">
                    @switch (pat.membershipTier) {
                      @case ('VIP') { ★ Hạng VIP }
                      @case ('GOLD') { ◆ Hạng Vàng }
                      @case ('SILVER') { ● Hạng Bạc }
                      @default { Tiêu chuẩn }
                    }
                  </span>
                </td>
                <td>
                  <div class="activity-block">
                    <span class="login-time">{{ pat.lastLoginAt || 'Chưa đăng nhập' }}</span>
                    <span class="reg-date">Đăng ký: {{ pat.registeredAt }}</span>
                  </div>
                </td>
                <td>
                  <span
                    class="status-pill"
                    [class.active]="pat.status === 'ACTIVE'"
                    [class.locked]="pat.status === 'LOCKED'"
                  >
                    <span class="dot"></span>
                    {{ pat.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="action-btn-group">
                    <button
                      type="button"
                      class="btn-action-icon btn-detail"
                      (click)="viewPatientDetails(pat)"
                      title="Xem chi tiết hồ sơ & lịch sử tài khoản"
                    >
                      <app-clinic-icon name="eye" [size]="14"></app-clinic-icon>
                    </button>

                    <button
                      type="button"
                      class="btn-action-icon btn-reset-pass"
                      (click)="resetPassword(pat)"
                      title="Đặt lại mật khẩu mặc định cho người bệnh"
                    >
                      <app-clinic-icon name="key" [size]="14"></app-clinic-icon>
                    </button>

                    <button
                      type="button"
                      class="btn-status-toggle"
                      [class.btn-lock]="pat.status === 'ACTIVE'"
                      [class.btn-unlock]="pat.status === 'LOCKED'"
                      (click)="toggleStatus(pat)"
                      [title]="pat.status === 'ACTIVE' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'"
                    >
                      @if (pat.status === 'ACTIVE') {
                        <app-clinic-icon name="lock" [size]="12"></app-clinic-icon>
                        <span>Khóa</span>
                      } @else {
                        <app-clinic-icon name="unlock" [size]="12"></app-clinic-icon>
                        <span>Mở khóa</span>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-table-cell">
                  <div class="empty-content">
                    <app-clinic-icon name="users" [size]="32" color="#B8955A"></app-clinic-icon>
                    <p class="font-bold">Không tìm thấy tài khoản bệnh nhân nào</p>
                    <span class="text-muted">Thử tìm kiếm với số điện thoại, mã bệnh nhân hoặc họ tên khác.</span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. Modal: Cấp Tài Khoản Bệnh Nhân Mới -->
    @if (isCreateModalOpen()) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-eyebrow">CỔNG TRUY CẬP TRỰC TUYẾN</span>
              <h3 class="modal-title font-serif">Cấp Tài Khoản Bệnh Nhân Mới</h3>
            </div>
            <button class="modal-close" (click)="closeCreateModal()" aria-label="Đóng">
              <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
            </button>
          </div>

          <form (ngSubmit)="submitCreatePatient()" class="modal-form">
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Họ và Tên Bệnh Nhân <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newFullName"
                  name="fullName"
                  placeholder="vd: Nguyễn Văn Minh"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Số điện thoại (Tên đăng nhập) <span class="required">*</span></label>
                <input
                  type="tel"
                  [(ngModel)]="newPhone"
                  name="phone"
                  placeholder="vd: 0912 345 678"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Địa chỉ Email nhận kết quả <span class="required">*</span></label>
                <input
                  type="email"
                  [(ngModel)]="newEmail"
                  name="email"
                  placeholder="vd: minh.nguyen@gmail.com"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Số Căn cước công dân (12 số) <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newCccd"
                  name="cccd"
                  placeholder="vd: 079198004567"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Ngày sinh (YYYY-MM-DD) <span class="required">*</span></label>
                <input
                  type="date"
                  [(ngModel)]="newDob"
                  name="dob"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Giới tính <span class="required">*</span></label>
                <select [(ngModel)]="newGender" name="gender" class="clinic-select">
                  <option value="NAM">Nam</option>
                  <option value="NU">Nữ</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>

              <div class="form-group">
                <label>Hạng Hội Viên</label>
                <select [(ngModel)]="newTier" name="tier" class="clinic-select">
                  <option value="STANDARD">Tiêu chuẩn</option>
                  <option value="SILVER">Hạng Bạc</option>
                  <option value="GOLD">Hạng Vàng</option>
                  <option value="VIP">Hạng VIP</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>Địa chỉ thường trú</label>
                <input
                  type="text"
                  [(ngModel)]="newAddress"
                  name="address"
                  placeholder="vd: 341/13A Khuông Việt, Phường Phú Trung, Quận Tân Phú, TP.HCM"
                  class="clinic-input"
                />
              </div>
            </div>

            @if (createError()) {
              <div class="error-msg">
                <app-clinic-icon name="alert-triangle" [size]="14"></app-clinic-icon>
                <span>{{ createError() }}</span>
              </div>
            }

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeCreateModal()">
                <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
                <span>Hủy bỏ</span>
              </button>
              <button type="submit" class="btn-submit">
                <app-clinic-icon name="user-plus" [size]="14"></app-clinic-icon>
                <span>Kích hoạt tài khoản</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- 5. Modal: Chi Tiết Tài Khoản Bệnh Nhân -->
    @if (selectedDetailAccount()) {
      <div class="modal-backdrop" (click)="selectedDetailAccount.set(null)">
        <div class="modal-card detail-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="modal-eyebrow">HỒ SƠ TÀI KHOẢN ĐỊNH DANH</span>
              <h3 class="modal-title font-serif">{{ selectedDetailAccount()!.fullName }}</h3>
            </div>
            <button class="modal-close" (click)="selectedDetailAccount.set(null)" aria-label="Đóng">
              <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
            </button>
          </div>

          <div class="detail-body-grid">
            <div class="detail-item">
              <span class="detail-label">Mã bệnh nhân EMR:</span>
              <strong class="detail-val font-mono text-teal">{{ selectedDetailAccount()!.patientCode }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Số Căn cước công dân (CCCD):</span>
              <strong class="detail-val font-mono">{{ selectedDetailAccount()!.cccd }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Số điện thoại đăng nhập:</span>
              <strong class="detail-val font-mono">{{ selectedDetailAccount()!.phone }}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Địa chỉ Email:</span>
              <span class="detail-val">{{ selectedDetailAccount()!.email }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Ngày sinh & Giới tính:</span>
              <span class="detail-val">{{ selectedDetailAccount()!.dateOfBirth }} ({{ selectedDetailAccount()!.gender === 'NAM' ? 'Nam' : 'Nữ' }})</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Hạng Hội Viên:</span>
              <span class="tier-pill" [class]="selectedDetailAccount()!.membershipTier.toLowerCase()">
                {{ selectedDetailAccount()!.membershipTier }}
              </span>
            </div>

            <div class="detail-item">
              <span class="detail-label">Tổng số lượt khám tại viện:</span>
              <strong class="detail-val">{{ selectedDetailAccount()!.totalVisits }} lượt khám</strong>
            </div>

            <div class="detail-item">
              <span class="detail-label">Trạng thái tài khoản:</span>
              <span class="status-pill" [class.active]="selectedDetailAccount()!.status === 'ACTIVE'" [class.locked]="selectedDetailAccount()!.status === 'LOCKED'">
                {{ selectedDetailAccount()!.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa' }}
              </span>
            </div>

            <div class="detail-item full-width">
              <span class="detail-label">Địa chỉ liên hệ:</span>
              <span class="detail-val">{{ selectedDetailAccount()!.address }}</span>
            </div>

            <div class="detail-item full-width">
              <span class="detail-label">Lịch sử đăng nhập:</span>
              <span class="detail-val">Đăng ký ngày <strong>{{ selectedDetailAccount()!.registeredAt }}</strong> • Đăng nhập gần nhất: <strong>{{ selectedDetailAccount()!.lastLoginAt }}</strong></span>
            </div>
          </div>

          <div class="modal-actions detail-actions">
            <button type="button" class="btn-cancel" (click)="selectedDetailAccount.set(null)">
              <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
              <span>Đóng hồ sơ</span>
            </button>
            <button
              type="button"
              class="btn-submit btn-reset-password"
              (click)="resetPassword(selectedDetailAccount()!)"
            >
              <app-clinic-icon name="key" [size]="14"></app-clinic-icon>
              <span>Đặt lại mật khẩu</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .btn-gold {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #B8955A 0%, #A58046 50%, #8F6C34 100%);
        color: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.25);
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 650;
        font-size: 0.875rem;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 14px rgba(184, 149, 90, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);

        app-clinic-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        &:hover {
          background: linear-gradient(135deg, #C5A368 0%, #B08B51 50%, #99763B 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(184, 149, 90, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35);

          app-clinic-icon {
            transform: scale(1.12);
          }
        }

        &:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(184, 149, 90, 0.28);
        }
      }

      .toast-notification-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #EDF7F5;
        border: 1px solid #B8E0D7;
        color: #0E4A55;
        padding: 12px 18px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 0.88rem;
        font-weight: 600;
        animation: fadeIn 0.3s ease;
      }

      /* 1. KPI Metrics Summary Row */
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
          &.burgundy {
            background: rgba(155, 61, 69, 0.12);
            color: #9B3D45;
          }
          &.gold {
            background: rgba(184, 149, 90, 0.16);
            color: #B8955A;
          }
        }

        .kpi-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .kpi-label {
          font-size: 0.72rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .kpi-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1C2733;

          &.text-sage {
            color: #5E8B7E;
          }
          &.text-burgundy {
            color: #9B3D45;
          }
          &.text-gold {
            color: #B8955A;
          }
        }
      }

      /* 2. Toolbar */
      .patients-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 20px;
        margin-bottom: 24px;
        gap: 16px;
        flex-wrap: wrap;
      }

      .search-box {
        position: relative;
        flex: 1;
        min-width: 280px;

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8C96A2;
        }

        .search-input {
          width: 100%;
          padding-left: 38px;
        }
      }

      .filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .filter-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
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

      /* 3. Table of Accounts */
      .table-card {
        padding: 0;
        overflow: hidden;
      }

      .table-responsive {
        overflow-x: auto;
      }

      .clinic-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;

        th {
          background: #FAF8F5;
          color: #5B6672;
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 14px 18px;
          border-bottom: 1.5px solid #E4DED2;
          text-align: left;
        }

        td {
          padding: 14px 18px;
          border-bottom: 1px solid #FAF8F5;
          vertical-align: middle;
        }

        tbody tr {
          transition: background 0.15s ease;

          &:hover {
            background: #FAF8F5;
          }

          &.locked-row {
            background: #FDF9F9;
            opacity: 0.85;
          }
        }
      }

      .patient-code-tag {
        font-size: 0.82rem;
        font-weight: 700;
        color: #0E4A55;
        background: rgba(14, 74, 85, 0.08);
        padding: 3px 8px;
        border-radius: 6px;
      }

      .patient-identity {
        display: flex;
        align-items: center;
        gap: 12px;

        .patient-avatar-box {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #EAE6DE;
          color: #0E4A55;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #D8D2C4;
        }

        .patient-name-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .patient-name {
          color: #1C2733;
          font-size: 0.92rem;
        }

        .patient-submeta {
          font-size: 0.75rem;
          color: #718096;
        }
      }

      .login-id-block {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .phone-num {
          font-size: 0.86rem;
          color: #1C2733;
        }

        .email-sub {
          font-size: 0.75rem;
          color: #718096;
        }
      }

      .cccd-text {
        font-size: 0.84rem;
        color: #4A5568;
      }

      .tier-pill {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 999px;

        &.vip {
          background: rgba(184, 149, 90, 0.18);
          color: #8C6D34;
          border: 1px solid rgba(184, 149, 90, 0.35);
        }

        &.gold {
          background: rgba(236, 200, 128, 0.25);
          color: #947118;
          border: 1px solid #ECC880;
        }

        &.silver {
          background: #EDF2F7;
          color: #4A5568;
          border: 1px solid #CBD5E0;
        }

        &.standard {
          background: #F7FAFC;
          color: #718096;
          border: 1px solid #E2E8F0;
        }
      }

      .activity-block {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .login-time {
          font-size: 0.78rem;
          color: #1C2733;
          font-weight: 500;
        }

        .reg-date {
          font-size: 0.72rem;
          color: #8C96A2;
        }
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        &.active {
          background: rgba(94, 139, 126, 0.15);
          color: #5E8B7E;
          .dot {
            background: #5E8B7E;
          }
        }

        &.locked {
          background: rgba(155, 61, 69, 0.12);
          color: #9B3D45;
          .dot {
            background: #9B3D45;
          }
        }
      }

      .action-btn-group {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 6px;
      }

      .btn-action-icon {
        width: 30px;
        height: 30px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #E4DED2;
        background: #FFFFFF;
        cursor: pointer;
        color: #5B6672;
        transition: all 0.15s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
          background: #FAF8F5;
        }

        &.btn-reset-pass:hover {
          border-color: #B8955A;
          color: #B8955A;
        }
      }

      .btn-status-toggle {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: none;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;

        &.btn-lock {
          background: rgba(155, 61, 69, 0.1);
          color: #9B3D45;

          &:hover {
            background: #9B3D45;
            color: #FFFFFF;
          }
        }

        &.btn-unlock {
          background: rgba(94, 139, 126, 0.15);
          color: #5E8B7E;

          &:hover {
            background: #5E8B7E;
            color: #FFFFFF;
          }
        }
      }

      .empty-table-cell {
        padding: 48px 24px;
        text-align: center;

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          p {
            font-size: 1rem;
            color: #1C2733;
            margin: 0;
          }

          .text-muted {
            font-size: 0.8125rem;
            color: #718096;
          }
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
        max-width: 620px;
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.2);
        animation: modalScale 0.25s ease;

        &.detail-modal {
          max-width: 580px;
        }
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

          &.full-width {
            grid-column: 1 / -1;
          }

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
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid #EFEAE1;

        &.detail-actions {
          margin-top: 24px;
        }

        .btn-cancel {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FAF8F5;
          border: 1.5px solid #D8D0C3;
          color: #4A5568;
          padding: 10px 20px;
          border-radius: 9px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #EFEAE1;
            color: #1A202C;
            border-color: #B8955A;
            transform: translateY(-1px);
          }
        }

        .btn-submit {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0E4A55;
          color: #FFFFFF;
          border: 1px solid transparent;
          padding: 10px 24px;
          border-radius: 9px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(14, 74, 85, 0.25);

          &:hover {
            background: #155E6C;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(14, 74, 85, 0.35);
          }

          &.btn-reset-password {
            background: linear-gradient(135deg, #0E4A55 0%, #155E6C 100%);
            border-color: rgba(184, 149, 90, 0.35);

            &:hover {
              background: linear-gradient(135deg, #09373F 0%, #0E4A55 100%);
              border-color: #B8955A;
              box-shadow: 0 4px 14px rgba(14, 74, 85, 0.4);
            }
          }
        }
      }

      .detail-body-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #FAF8F5;
          border: 1px solid #ECE7DC;
          border-radius: 8px;
          padding: 10px 14px;

          &.full-width {
            grid-column: 1 / -1;
          }

          .detail-label {
            font-size: 0.72rem;
            color: #718096;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.04em;
          }

          .detail-val {
            font-size: 0.9rem;
            color: #1C2733;

            &.text-teal {
              color: #0E4A55;
            }
          }
        }
      }
    `,
  ],
})
export class AdminPatientsComponent {
  private adminService = inject(AdminService);

  allPatientAccounts = this.adminService.patientAccounts;

  searchQuery = signal<string>('');
  selectedFilter = signal<string>('ALL'); // ALL, ACTIVE, LOCKED, VIP_GOLD
  actionToast = signal<string>('');

  // Counts for KPIs and Filter Pills
  activeCount = computed(
    () => this.allPatientAccounts().filter((p) => p.status === 'ACTIVE').length
  );
  lockedCount = computed(
    () => this.allPatientAccounts().filter((p) => p.status === 'LOCKED').length
  );
  vipCount = computed(
    () =>
      this.allPatientAccounts().filter(
        (p) => p.membershipTier === 'VIP' || p.membershipTier === 'GOLD'
      ).length
  );

  // Filtered List
  filteredAccounts = computed(() => {
    let list = this.allPatientAccounts();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();

    if (query) {
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(query) ||
          p.patientCode.toLowerCase().includes(query) ||
          p.phone.includes(query) ||
          p.cccd.includes(query) ||
          p.email.toLowerCase().includes(query)
      );
    }

    if (filter === 'ACTIVE') {
      list = list.filter((p) => p.status === 'ACTIVE');
    } else if (filter === 'LOCKED') {
      list = list.filter((p) => p.status === 'LOCKED');
    } else if (filter === 'VIP_GOLD') {
      list = list.filter((p) => p.membershipTier === 'VIP' || p.membershipTier === 'GOLD');
    }

    return list;
  });

  getMonogram(name: string): string {
    if (!name) return 'BN';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].substring(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  toggleStatus(pat: PatientAccount): void {
    this.adminService.togglePatientAccountStatus(pat.id);
    const newStatus = pat.status === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt lại';
    this.showToast(`Đã ${newStatus} tài khoản của bệnh nhân ${pat.fullName} (${pat.patientCode}).`);
  }

  resetPassword(pat: PatientAccount): void {
    const tempPass = this.adminService.resetPatientPassword(pat.id);
    this.showToast(
      `Đã tạo lại mật khẩu mới cho ${pat.fullName}! Mật khẩu tạm: ${tempPass} (Đã gửi SMS tới ${pat.phone}).`
    );
  }

  // Details Modal
  selectedDetailAccount = signal<PatientAccount | null>(null);

  viewPatientDetails(pat: PatientAccount): void {
    this.selectedDetailAccount.set(pat);
  }

  // Create Modal State
  isCreateModalOpen = signal<boolean>(false);
  createError = signal<string>('');

  newFullName = '';
  newPhone = '';
  newEmail = '';
  newCccd = '';
  newDob = '1990-01-01';
  newGender: 'NAM' | 'NU' | 'KHAC' = 'NAM';
  newTier: MembershipTier = 'STANDARD';
  newAddress = '';

  openCreateModal(): void {
    this.createError.set('');
    this.newFullName = '';
    this.newPhone = '';
    this.newEmail = '';
    this.newCccd = '';
    this.newDob = '1990-01-01';
    this.newGender = 'NAM';
    this.newTier = 'STANDARD';
    this.newAddress = '';
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreatePatient(): void {
    if (!this.newFullName.trim() || !this.newPhone.trim() || !this.newCccd.trim() || !this.newEmail.trim()) {
      this.createError.set('Vui lòng điền đầy đủ Họ tên, Số điện thoại, Email và CCCD.');
      return;
    }

    // Check duplicate phone
    const cleanPhone = this.newPhone.replace(/\s+/g, '');
    const exists = this.allPatientAccounts().some((p) => p.username === cleanPhone || p.phone.replace(/\s+/g, '') === cleanPhone);
    if (exists) {
      this.createError.set(`Số điện thoại ${this.newPhone} đã được đăng ký tài khoản trên hệ thống.`);
      return;
    }

    const created = this.adminService.createPatientAccount({
      fullName: this.newFullName,
      phone: this.newPhone,
      email: this.newEmail,
      cccd: this.newCccd,
      gender: this.newGender,
      dateOfBirth: this.newDob,
      address: this.newAddress,
      membershipTier: this.newTier,
    });

    this.showToast(`Đã cấp tài khoản thành công cho ${created.fullName} (Mã BN: ${created.patientCode})!`);
    this.closeCreateModal();
  }

  showToast(msg: string): void {
    this.actionToast.set(msg);
    setTimeout(() => {
      this.actionToast.set('');
    }, 5500);
  }
}
