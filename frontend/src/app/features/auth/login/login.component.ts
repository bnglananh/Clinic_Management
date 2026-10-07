import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ClinicIconComponent],
  template: `
    <div class="login-card clinic-card">
      <!-- Auth Switcher Tabs -->
      <div class="auth-tabs-nav">
        <a routerLink="/auth/login" routerLinkActive="active" class="auth-tab active">
          <app-clinic-icon name="login" [size]="15"></app-clinic-icon>
          <span>Đăng Nhập</span>
        </a>
        <a routerLink="/auth/register" routerLinkActive="active" class="auth-tab">
          <app-clinic-icon name="user-plus" [size]="15"></app-clinic-icon>
          <span>Đăng Ký Hồ Sơ</span>
        </a>
      </div>

      <div class="login-header">
        <div class="header-emblem-row">
          <div class="auth-icon-badge">
            <app-clinic-icon name="shield-check" [size]="18" color="#0E4A55"></app-clinic-icon>
          </div>
          <span class="sub-badge">CỔNG TRUY CẬP AN TOÀN • HL7 COMPLIANT</span>
        </div>
        <h2 class="login-title font-serif">Đăng Nhập Hệ Thống</h2>
        <p class="login-desc">
          Chọn vai trò đăng nhập nhanh hoặc điền thông tin tài khoản của bạn để truy cập.
        </p>
      </div>

      <!-- Quick Role Selector (One-click Demo) -->
      <div class="role-selector-zone">
        <div class="role-zone-header">
          <span class="role-zone-title">Đăng nhập nhanh theo vai trò:</span>
          <span class="role-zone-hint">1-click demo</span>
        </div>
        <div class="role-cards-grid">
          <div
            class="role-card"
            [class.selected]="selectedRole() === 'RECEPTIONIST'"
            (click)="selectRole('RECEPTIONIST')"
          >
            <div class="role-icon">
              <app-clinic-icon name="clipboard" [size]="18" color="#0E4A55"></app-clinic-icon>
            </div>
            <div class="role-text">
              <span class="role-title">Lễ Tân / Thu Ngân</span>
              <span class="role-sub">Tiếp nhận & viện phí</span>
            </div>
          </div>

          <div
            class="role-card"
            [class.selected]="selectedRole() === 'DOCTOR'"
            (click)="selectRole('DOCTOR')"
          >
            <div class="role-icon">
              <app-clinic-icon name="stethoscope" [size]="18" color="#0E4A55"></app-clinic-icon>
            </div>
            <div class="role-text">
              <span class="role-title">Bác Sĩ Khám Bệnh</span>
              <span class="role-sub">Khám & kê đơn thuốc</span>
            </div>
          </div>

          <div
            class="role-card"
            [class.selected]="selectedRole() === 'ADMIN'"
            (click)="selectRole('ADMIN')"
          >
            <div class="role-icon">
              <app-clinic-icon name="shield" [size]="18" color="#0E4A55"></app-clinic-icon>
            </div>
            <div class="role-text">
              <span class="role-title">Quản Trị Viên</span>
              <span class="role-sub">Quản trị EMR & RBAC</span>
            </div>
          </div>

          <div
            class="role-card"
            [class.selected]="selectedRole() === 'PATIENT'"
            (click)="selectRole('PATIENT')"
          >
            <div class="role-icon">
              <app-clinic-icon name="user" [size]="18" color="#0E4A55"></app-clinic-icon>
            </div>
            <div class="role-text">
              <span class="role-title">Bệnh Nhân</span>
              <span class="role-sub">Đặt lịch & theo dõi khám</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Login Form -->
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
        <div class="form-group">
          <label class="form-label" for="username">Tên đăng nhập / Số điện thoại</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <app-clinic-icon name="user" [size]="16" color="#0E4A55"></app-clinic-icon>
            </span>
            <input
              id="username"
              type="text"
              formControlName="username"
              class="clinic-input"
              placeholder="Nhập tên đăng nhập hoặc số điện thoại..."
            />
          </div>
          @if (loginForm.get('username')?.touched && loginForm.get('username')?.invalid) {
            <span class="error-msg">Vui lòng nhập tên đăng nhập.</span>
          }
        </div>

        <div class="form-group">
          <div class="label-row">
            <label class="form-label" for="password">Mật khẩu</label>
            <a href="javascript:void(0)" class="forgot-link">Quên mật khẩu?</a>
          </div>
          <div class="input-wrapper">
            <span class="input-icon">
              <app-clinic-icon name="lock" [size]="16" color="#0E4A55"></app-clinic-icon>
            </span>
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              class="clinic-input"
              placeholder="Nhập mật khẩu truy cập..."
            />
            <button
              type="button"
              (click)="toggleShowPassword()"
              class="eye-btn"
              tabindex="-1"
              title="Ẩn / hiện mật khẩu"
            >
              <app-clinic-icon [name]="showPassword() ? 'unlock' : 'lock'" [size]="16" color="#5B6672"></app-clinic-icon>
            </button>
          </div>
        </div>

        <div class="form-extras">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="rememberMe" />
            <span>Ghi nhớ phiên đăng nhập trên thiết bị này</span>
          </label>
        </div>

        <button
          type="submit"
          class="submit-btn"
          [disabled]="isLoading()"
        >
          @if (isLoading()) {
            <span class="spinner"></span>
            <span>Đang xác thực thông tin...</span>
          } @else {
            <span class="btn-inner-content">
              <app-clinic-icon name="login" [size]="17" color="#FFFFFF"></app-clinic-icon>
              <span>Vào hệ thống (Quyền {{ getRoleLabel(selectedRole()) }})</span>
            </span>
          }
        </button>
      </form>

      <!-- Register & Patient Booking Prompt -->
      <div class="register-prompt-box">
        <div class="prompt-text-group">
          <span class="prompt-title">Bệnh nhân lần đầu đến khám?</span>
          <span class="prompt-sub">Đăng ký hồ sơ để nhận mã bệnh nhân điện tử ngay</span>
        </div>
        <a routerLink="/auth/register" class="register-action-btn">
          <span>Đăng ký ngay</span>
          <app-clinic-icon name="arrow-right" [size]="13"></app-clinic-icon>
        </a>
      </div>

      <div class="login-footer">
        <span>Tổng đài hỗ trợ y tế & đặt khám: <strong>1900 1234</strong> • IT Support: <strong>028 3822 9999</strong></span>
      </div>
    </div>
  `,
  styles: [
    `
      .login-card {
        padding: 32px 36px;
        background: #FFFFFF;
        border-radius: 20px;
        box-shadow: 0 16px 40px rgba(28, 39, 51, 0.08);
        border: 1px solid #E8E2D5;
      }

      // Tabs switcher
      .auth-tabs-nav {
        display: flex;
        gap: 6px;
        background: #F4EFE6;
        padding: 5px;
        border-radius: 12px;
        margin-bottom: 24px;
        border: 1px solid #E5DFD3;
      }

      .auth-tab {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 9px 16px;
        border-radius: 9px;
        font-size: 0.84rem;
        font-weight: 600;
        color: #5B6672;
        text-decoration: none;
        transition: all 0.2s ease;

        &:hover {
          color: #0E4A55;
        }

        &.active {
          background: #FFFFFF;
          color: #0E4A55;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
      }

      .login-header {
        margin-bottom: 20px;
      }

      .header-emblem-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .auth-icon-badge {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(14, 74, 85, 0.08);
        border: 1px solid rgba(14, 74, 85, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sub-badge {
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #8C6D34;
        background: rgba(184, 149, 90, 0.15);
        border: 1px solid rgba(184, 149, 90, 0.3);
        padding: 3px 10px;
        border-radius: 999px;
        display: inline-block;
      }

      .login-title {
        font-size: 1.85rem;
        color: #1C2733;
        margin: 0 0 6px 0;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .login-desc {
        color: #384654;
        font-size: 0.875rem;
        margin: 0;
        line-height: 1.5;
        font-weight: 450;
      }

      // Role selector zone
      .role-selector-zone {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px dashed rgba(228, 222, 210, 0.9);
      }

      .role-zone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .role-zone-title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1C2733;
      }

      .role-zone-hint {
        font-size: 0.6875rem;
        font-weight: 600;
        color: #B8955A;
        background: rgba(184, 149, 90, 0.12);
        padding: 2px 8px;
        border-radius: 999px;
      }

      .role-cards-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .role-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border: 1.5px solid #E5DFD3;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #FAF8F4;

        &:hover {
          border-color: #0E4A55;
          background: #FFFFFF;
          transform: translateY(-1px);
        }

        &.selected {
          border-color: #0E4A55;
          background: rgba(14, 74, 85, 0.08);
          box-shadow: 0 2px 8px rgba(14, 74, 85, 0.15);

          .role-title {
            color: #0E4A55;
            font-weight: 700;
          }
        }
      }

      .role-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .role-text {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .role-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: #1C2733;
        white-space: nowrap;
      }

      .role-sub {
        font-size: 0.6875rem;
        color: #4A5968;
        font-weight: 500;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      // Form
      .login-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .form-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1C2733;
      }

      .forgot-link {
        font-size: 0.78rem;
        color: #0E4A55;
        text-decoration: none;
        font-weight: 600;
        &:hover {
          text-decoration: underline;
        }
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon {
        position: absolute;
        left: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .clinic-input {
        width: 100%;
        height: 42px;
        border: 1.5px solid #E2DCD0;
        border-radius: 12px;
        padding: 0 38px 0 38px;
        font-size: 0.875rem;
        color: #1C2733;
        outline: none;
        transition: all 0.2s ease;
        background: #FAFAFA;

        &:focus {
          border-color: #0E4A55;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.12);
        }

        &::placeholder {
          color: #8C96A2;
        }
      }

      .eye-btn {
        position: absolute;
        right: 10px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 6px;

        &:hover {
          background: rgba(0, 0, 0, 0.04);
        }
      }

      .error-msg {
        font-size: 0.75rem;
        color: #9B3D45;
        font-weight: 500;
      }

      .form-extras {
        display: flex;
        align-items: center;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        color: #4A5968;
        cursor: pointer;
        user-select: none;

        input {
          accent-color: #0E4A55;
          width: 15px;
          height: 15px;
        }
      }

      .submit-btn {
        height: 46px;
        background: linear-gradient(135deg, #0E4A55 0%, #155764 100%);
        border: none;
        color: #FFFFFF;
        font-size: 0.9rem;
        font-weight: 600;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(14, 74, 85, 0.25);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #125562 0%, #1b6a7a 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(14, 74, 85, 0.3);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #FFFFFF;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .btn-inner-content {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .register-prompt-box {
        margin-top: 18px;
        background: #F8F6F1;
        border: 1px solid #E6E0D4;
        border-radius: 12px;
        padding: 11px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;

        .prompt-text-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .prompt-title {
          font-size: 0.8rem;
          font-weight: 650;
          color: #1C2733;
        }

        .prompt-sub {
          font-size: 0.7rem;
          color: #5B6672;
        }

        .register-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          color: #0E4A55;
          border: 1px solid #0E4A55;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;

          &:hover {
            background: #0E4A55;
            color: #FFFFFF;
            transform: translateY(-1px);
          }
        }
      }

      .login-footer {
        margin-top: 20px;
        padding-top: 14px;
        border-top: 1px solid rgba(228, 222, 210, 0.7);
        text-align: center;
        font-size: 0.75rem;
        color: #5B6672;
        line-height: 1.4;

        strong {
          color: #1C2733;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  selectedRole = signal<UserRole>('RECEPTIONIST');
  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  loginForm = this.fb.group({
    username: ['letan', [Validators.required]],
    password: ['123456', [Validators.required]],
    rememberMe: [true],
  });

  selectRole(role: UserRole): void {
    this.selectedRole.set(role);
    // Autofill username corresponding to role for easy testing
    const defaultUsernames: Record<UserRole, string> = {
      RECEPTIONIST: 'letan',
      DOCTOR: 'bacsi',
      ADMIN: 'admin',
      PATIENT: 'benhnhan',
    };
    this.loginForm.patchValue({
      username: defaultUsernames[role],
    });
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      RECEPTIONIST: 'Lễ Tân',
      DOCTOR: 'Bác Sĩ',
      ADMIN: 'Quản Trị',
      PATIENT: 'Bệnh Nhân',
    };
    return labels[role];
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.login(this.selectedRole()).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
