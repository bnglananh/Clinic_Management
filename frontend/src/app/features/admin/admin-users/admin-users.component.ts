import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UserRole } from '../../../core/models/user.model';
import { StaffAccount } from '../../../core/models/admin.model';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ClinicIconComponent],
  template: `
    <app-page-header
      badgeText="PHÂN HỆ QUẢN TRỊ VIÊN • UC019"
      title="Quản Lý Tài Khoản Nhân Viên & Phân Quyền (RBAC)"
      subtitle="Thiết lập tài khoản người dùng nội bộ, cấp quyền truy cập theo vai trò và kiểm soát trạng thái hoạt động."
    >
      <div actions>
        <button class="btn-gold" (click)="openCreateModal()">
          <app-clinic-icon name="user" [size]="14"></app-clinic-icon>
          <span>Thêm nhân viên mới</span>
        </button>
      </div>
    </app-page-header>

    <!-- Toolbar Filters -->
    <div class="users-toolbar clinic-card">
      <div class="search-box">
        <app-clinic-icon name="search" [size]="16" class="search-icon"></app-clinic-icon>
        <input
          type="text"
          placeholder="Tìm họ tên, tài khoản, email, SĐT..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          class="clinic-input search-input"
        />
      </div>

      <div class="role-filter-group">
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedRoleFilter() === 'ALL'"
          (click)="selectedRoleFilter.set('ALL')"
        >
          Tất cả ({{ allAccounts().length }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedRoleFilter() === 'DOCTOR'"
          (click)="selectedRoleFilter.set('DOCTOR')"
        >
          <app-clinic-icon name="stethoscope" [size]="13"></app-clinic-icon>
          Bác sĩ ({{ doctorCount() }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedRoleFilter() === 'RECEPTIONIST'"
          (click)="selectedRoleFilter.set('RECEPTIONIST')"
        >
          <app-clinic-icon name="clipboard" [size]="13"></app-clinic-icon>
          Lễ tân / Thu ngân ({{ receptionistCount() }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="selectedRoleFilter() === 'ADMIN'"
          (click)="selectedRoleFilter.set('ADMIN')"
        >
          <app-clinic-icon name="shield" [size]="13"></app-clinic-icon>
          Quản trị viên ({{ adminCount() }})
        </button>
      </div>
    </div>

    <!-- Table of Accounts -->
    <div class="clinic-card table-card">
      <div class="table-responsive">
        <table class="clinic-table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ và Tên</th>
              <th>Tài khoản</th>
              <th>Vai trò (RBAC)</th>
              <th>Khoa / Phòng ban</th>
              <th>Liên hệ</th>
              <th>Trạng thái</th>
              <th style="text-align: right;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (acc of filteredAccounts(); track acc.id) {
              <tr [class.locked-row]="acc.status === 'LOCKED'">
                <td>
                  <span class="staff-code">{{ acc.id }}</span>
                </td>
                <td>
                  <div class="staff-identity">
                    <span class="staff-name font-bold">{{ acc.fullName }}</span>
                    <span class="staff-title">{{ acc.title }}</span>
                  </div>
                </td>
                <td>
                  <span class="staff-username">@{{ acc.username }}</span>
                </td>
                <td>
                  <span class="role-badge" [class]="acc.role.toLowerCase()">
                    @switch (acc.role) {
                      @case ('DOCTOR') { Bác sĩ }
                      @case ('RECEPTIONIST') { Tiếp đón }
                      @case ('ADMIN') { Quản trị }
                      @default { {{ acc.role }} }
                    }
                  </span>
                </td>
                <td>
                  <span class="dept-text">{{ acc.department }}</span>
                </td>
                <td>
                  <div class="contact-box">
                    <span class="phone-text">
                      <app-clinic-icon name="phone" [size]="11"></app-clinic-icon>
                      {{ acc.phone }}
                    </span>
                    <span class="email-text">
                      <app-clinic-icon name="mail" [size]="11"></app-clinic-icon>
                      {{ acc.email }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="status-pill" [class.active]="acc.status === 'ACTIVE'" [class.locked]="acc.status === 'LOCKED'">
                    <span class="dot"></span>
                    {{ acc.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button
                    class="action-btn"
                    [class.btn-lock]="acc.status === 'ACTIVE'"
                    [class.btn-unlock]="acc.status === 'LOCKED'"
                    (click)="toggleStatus(acc)"
                    [title]="acc.status === 'ACTIVE' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'"
                  >
                    <app-clinic-icon [name]="acc.status === 'ACTIVE' ? 'lock' : 'unlock'" [size]="12"></app-clinic-icon>
                    <span>{{ acc.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa' }}</span>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-state">
                  <app-clinic-icon name="users" [size]="32" class="empty-icon"></app-clinic-icon>
                  <p>Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Staff Modal -->
    @if (isModalOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title font-serif">
              <app-clinic-icon name="plus" [size]="18"></app-clinic-icon>
              <span>Thêm Mới Tài Khoản Nhân Viên</span>
            </h3>
            <button class="modal-close" (click)="closeModal()">
              <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
            </button>
          </div>

          <form (ngSubmit)="submitCreateStaff()" class="modal-form">
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Họ và tên nhân viên <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newFullName"
                  name="fullName"
                  placeholder="Ví dụ: BS.CKI Vũ Đình Duy"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Tên đăng nhập <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newUsername"
                  name="username"
                  placeholder="vd: duy.vu"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Vai trò hệ thống (RBAC) <span class="required">*</span></label>
                <select [(ngModel)]="newRole" name="role" class="clinic-select">
                  <option value="DOCTOR">Bác sĩ khám bệnh (DOCTOR)</option>
                  <option value="RECEPTIONIST">Lễ tân & Thu ngân (RECEPTIONIST)</option>
                  <option value="ADMIN">Quản trị viên hệ thống (ADMIN)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Số điện thoại <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newPhone"
                  name="phone"
                  placeholder="0912 345 678"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Địa chỉ Email <span class="required">*</span></label>
                <input
                  type="email"
                  [(ngModel)]="newEmail"
                  name="email"
                  placeholder="duy.vu@smartclinic.vn"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Khoa / Phòng ban <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newDepartment"
                  name="department"
                  placeholder="vd: Khoa Tim Mạch"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Chức danh chuyên môn</label>
                <input
                  type="text"
                  [(ngModel)]="newTitle"
                  name="title"
                  placeholder="vd: Bác sĩ Nội Tim Mạch"
                  class="clinic-input"
                />
              </div>
            </div>

            @if (formError()) {
              <div class="error-msg">
                <app-clinic-icon name="alert-triangle" [size]="14"></app-clinic-icon>
                <span>{{ formError() }}</span>
              </div>
            }

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModal()">Hủy bỏ</button>
              <button type="submit" class="btn-submit">Tạo tài khoản</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .users-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 20px;
        margin-bottom: 20px;
        gap: 16px;
        flex-wrap: wrap;
      }

      .search-box {
        display: flex;
        align-items: center;
        position: relative;
        flex: 1;
        max-width: 420px;

        .search-icon {
          position: absolute;
          left: 12px;
          color: #8C96A2;
          font-size: 0.9rem;
        }

        .search-input {
          padding-left: 36px;
          width: 100%;
        }
      }

      .role-filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .filter-pill {
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

      .table-card {
        padding: 0;
        overflow: hidden;
      }

      .clinic-table {
        width: 100%;
        border-collapse: collapse;

        th {
          background: #F8F6F0;
          color: #5B6672;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 12px 18px;
          border-bottom: 1px solid #E4DED2;
          text-align: left;
        }

        td {
          padding: 14px 18px;
          border-bottom: 1px solid #F0ECE1;
          font-size: 0.875rem;
          color: #1C2733;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: rgba(14, 74, 85, 0.02);
        }

        .locked-row {
          background: rgba(155, 61, 69, 0.03);
          opacity: 0.85;
        }
      }

      .staff-code {
        font-family: monospace;
        font-size: 0.8rem;
        font-weight: 700;
        background: rgba(28, 39, 51, 0.06);
        padding: 2px 6px;
        border-radius: 4px;
        color: #1C2733;
      }

      .staff-identity {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .staff-name {
        font-size: 0.92rem;
        color: #1C2733;
      }

      .staff-title {
        font-size: 0.75rem;
        color: #5B6672;
      }

      .staff-username {
        font-size: 0.82rem;
        color: #0E4A55;
        font-weight: 600;
      }

      .role-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;

        &.doctor {
          background: rgba(94, 139, 126, 0.15);
          color: #2F5A4F;
          border: 1px solid rgba(94, 139, 126, 0.3);
        }

        &.receptionist {
          background: rgba(184, 149, 90, 0.15);
          color: #8C6D34;
          border: 1px solid rgba(184, 149, 90, 0.35);
        }

        &.admin {
          background: rgba(14, 74, 85, 0.15);
          color: #0E4A55;
          border: 1px solid rgba(14, 74, 85, 0.35);
        }
      }

      .dept-text {
        font-size: 0.84rem;
        color: #1C2733;
      }

      .contact-box {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 0.78rem;
        color: #5B6672;
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
          color: #2F5A4F;
          .dot {
            background: #5E8B7E;
          }
        }

        &.locked {
          background: rgba(155, 61, 69, 0.15);
          color: #9B3D45;
          .dot {
            background: #9B3D45;
          }
        }
      }

      .action-btn {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;

        &.btn-lock {
          background: rgba(155, 61, 69, 0.1);
          color: #9B3D45;
          border-color: rgba(155, 61, 69, 0.3);
          &:hover {
            background: #9B3D45;
            color: #FFFFFF;
          }
        }

        &.btn-unlock {
          background: rgba(94, 139, 126, 0.12);
          color: #2F5A4F;
          border-color: rgba(94, 139, 126, 0.35);
          &:hover {
            background: #5E8B7E;
            color: #FFFFFF;
          }
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

      .empty-state {
        text-align: center;
        padding: 48px 16px;
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
        max-width: 620px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        border: 1px solid #E4DED2;
        animation: modalScale 0.2s ease;
      }

      @keyframes modalScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .modal-header {
        padding: 18px 24px;
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
          &:hover {
            color: #1C2733;
          }
        }
      }

      .modal-form {
        padding: 24px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        .full-width {
          grid-column: span 2;
        }
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
        margin-top: 14px;
        background: rgba(155, 61, 69, 0.1);
        border: 1px solid rgba(155, 61, 69, 0.3);
        padding: 8px 12px;
        border-radius: 8px;
        color: #9B3D45;
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
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
export class AdminUsersComponent {
  private adminService = inject(AdminService);

  allAccounts = this.adminService.staffAccounts;
  searchQuery = signal<string>('');
  selectedRoleFilter = signal<string>('ALL');

  doctorCount = computed(
    () => this.allAccounts().filter((a) => a.role === 'DOCTOR').length
  );
  receptionistCount = computed(
    () => this.allAccounts().filter((a) => a.role === 'RECEPTIONIST').length
  );
  adminCount = computed(
    () => this.allAccounts().filter((a) => a.role === 'ADMIN').length
  );

  filteredAccounts = computed(() => {
    let list = this.allAccounts();
    const role = this.selectedRoleFilter();
    if (role !== 'ALL') {
      list = list.filter((a) => a.role === role);
    }
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.fullName.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
      );
    }
    return list;
  });

  // Modal State
  isModalOpen = signal<boolean>(false);
  formError = signal<string>('');

  newFullName = '';
  newUsername = '';
  newRole: UserRole = 'DOCTOR';
  newPhone = '';
  newEmail = '';
  newDepartment = '';
  newTitle = '';

  openCreateModal(): void {
    this.formError.set('');
    this.newFullName = '';
    this.newUsername = '';
    this.newRole = 'DOCTOR';
    this.newPhone = '';
    this.newEmail = '';
    this.newDepartment = '';
    this.newTitle = '';
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  toggleStatus(account: StaffAccount): void {
    this.adminService.toggleAccountStatus(account.id);
  }

  submitCreateStaff(): void {
    if (!this.newFullName.trim() || !this.newUsername.trim() || !this.newPhone.trim() || !this.newEmail.trim()) {
      this.formError.set('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }

    this.adminService.createStaffAccount({
      username: this.newUsername.trim(),
      fullName: this.newFullName.trim(),
      email: this.newEmail.trim(),
      phone: this.newPhone.trim(),
      role: this.newRole,
      department: this.newDepartment.trim() || 'Khoa Khám Bệnh',
      title: this.newTitle.trim() || 'Bác sĩ chuyên khoa',
      status: 'ACTIVE',
    });

    this.closeModal();
  }
}
