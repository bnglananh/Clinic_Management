import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ClinicIconComponent],
  template: `
    <div class="register-card clinic-card">
      <!-- Auth Switcher Tabs -->
      <div class="auth-tabs-nav">
        <a routerLink="/auth/login" routerLinkActive="active" class="auth-tab">
          <app-clinic-icon name="login" [size]="15"></app-clinic-icon>
          <span>Đăng Nhập</span>
        </a>
        <a routerLink="/auth/register" routerLinkActive="active" class="auth-tab active">
          <app-clinic-icon name="user-plus" [size]="15"></app-clinic-icon>
          <span>Đăng Ký Hồ Sơ</span>
        </a>
      </div>

      <div class="register-header">
        <div class="header-emblem-row">
          <div class="auth-icon-badge">
            <app-clinic-icon name="user-plus" [size]="18" color="#0E4A55"></app-clinic-icon>
          </div>
          <span class="sub-badge">HỒ SƠ BỆNH ÁN ĐIỆN TỬ • MIỄN PHÍ</span>
        </div>
        <h2 class="register-title font-serif">Đăng Ký Tài Khoản Bệnh Nhân</h2>
        <p class="register-desc">
          Tạo hồ sơ để nhận mã số bệnh nhân điện tử, đặt lịch hẹn bác sĩ và theo dõi toa thuốc nhanh chóng.
        </p>

        <!-- Value proposition pills -->
        <div class="value-pills-row">
          <span class="value-pill">
            <app-clinic-icon name="sparkle" [size]="12" color="#B8955A"></app-clinic-icon>
            Cấp mã hồ sơ tức thì
          </span>
          <span class="value-pill">
            <app-clinic-icon name="shield-check" [size]="12" color="#0E4A55"></app-clinic-icon>
            Chuẩn bảo mật HL7/ISO
          </span>
          <span class="value-pill">
            <app-clinic-icon name="activity" [size]="12" color="#0E4A55"></app-clinic-icon>
            Theo dõi kết quả 24/7
          </span>
        </div>
      </div>

      <!-- Registration Form -->
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
        <!-- Full Name -->
        <div class="form-group">
          <label class="form-label" for="fullName">
            Họ và tên bệnh nhân <span class="req">*</span>
          </label>
          <div class="input-wrapper">
            <span class="input-icon">
              <app-clinic-icon name="user" [size]="16" color="#0E4A55"></app-clinic-icon>
            </span>
            <input
              id="fullName"
              type="text"
              formControlName="fullName"
              class="clinic-input"
              placeholder="Ví dụ: Nguyễn Văn An"
            />
          </div>
          @if (registerForm.get('fullName')?.touched && registerForm.get('fullName')?.invalid) {
            <span class="error-msg">Vui lòng nhập họ và tên bệnh nhân (tối thiểu 3 ký tự).</span>
          }
        </div>

        <!-- Phone & Email 2 Cols -->
        <div class="form-row-grid">
          <div class="form-group">
            <label class="form-label" for="phone">
              Số điện thoại <span class="req">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-clinic-icon name="phone" [size]="16" color="#0E4A55"></app-clinic-icon>
              </span>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                class="clinic-input"
                placeholder="0912 345 678"
              />
            </div>
            @if (registerForm.get('phone')?.touched && registerForm.get('phone')?.invalid) {
              <span class="error-msg">Số điện thoại không hợp lệ (10 số).</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="email">
              Địa chỉ Email <span class="req">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-clinic-icon name="mail" [size]="16" color="#0E4A55"></app-clinic-icon>
              </span>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="clinic-input"
                placeholder="nguyenvanan@gmail.com"
              />
            </div>
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
              <span class="error-msg">Email không hợp lệ.</span>
            }
          </div>
        </div>

        <!-- Date of birth & Gender 2 Cols -->
        <div class="form-row-grid">
          <div class="form-group">
            <label class="form-label" for="dob">Ngày tháng năm sinh</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-clinic-icon name="calendar" [size]="16" color="#0E4A55"></app-clinic-icon>
              </span>
              <input
                id="dob"
                type="date"
                formControlName="dateOfBirth"
                class="clinic-input date-picker"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Giới tính</label>
            <div class="gender-segmented-control">
              <button
                type="button"
                class="gender-segment"
                [class.active]="registerForm.get('gender')?.value === 'Nam'"
                (click)="setGender('Nam')"
              >
                Nam
              </button>
              <button
                type="button"
                class="gender-segment"
                [class.active]="registerForm.get('gender')?.value === 'Nữ'"
                (click)="setGender('Nữ')"
              >
                Nữ
              </button>
              <button
                type="button"
                class="gender-segment"
                [class.active]="registerForm.get('gender')?.value === 'Khác'"
                (click)="setGender('Khác')"
              >
                Khác
              </button>
            </div>
          </div>
        </div>

        <!-- Password & Confirm Password 2 Cols -->
        <div class="form-row-grid">
          <div class="form-group">
            <label class="form-label" for="password">
              Mật khẩu truy cập <span class="req">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-clinic-icon name="lock" [size]="16" color="#0E4A55"></app-clinic-icon>
              </span>
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                class="clinic-input"
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                (click)="toggleShowPassword()"
                class="eye-btn"
                tabindex="-1"
                title="Ẩn / hiện mật khẩu"
              >
                <app-clinic-icon
                  [name]="showPassword() ? 'unlock' : 'lock'"
                  [size]="16"
                  color="#5B6672"
                ></app-clinic-icon>
              </button>
            </div>
            @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
              <span class="error-msg">Mật khẩu cần tối thiểu 6 ký tự.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">
              Xác nhận mật khẩu <span class="req">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-clinic-icon name="lock" [size]="16" color="#0E4A55"></app-clinic-icon>
              </span>
              <input
                id="confirmPassword"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                class="clinic-input"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                (click)="toggleShowConfirmPassword()"
                class="eye-btn"
                tabindex="-1"
                title="Ẩn / hiện mật khẩu"
              >
                <app-clinic-icon
                  [name]="showConfirmPassword() ? 'unlock' : 'lock'"
                  [size]="16"
                  color="#5B6672"
                ></app-clinic-icon>
              </button>
            </div>
            @if (
              registerForm.hasError('passwordMismatch') &&
              registerForm.get('confirmPassword')?.touched
            ) {
              <span class="error-msg">Mật khẩu xác nhận không trùng khớp.</span>
            }
          </div>
        </div>

        <!-- Terms Agreement -->
        <div class="form-extras">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="agreeTerms" />
            <span>
              Tôi cam kết thông tin khai báo chính xác và đồng ý với
              <a href="javascript:void(0)" class="terms-link">Quy chế phòng khám</a> &
              <a href="javascript:void(0)" class="terms-link">Chính sách bảo mật y tế</a>.
            </span>
          </label>
          @if (registerForm.get('agreeTerms')?.touched && registerForm.get('agreeTerms')?.invalid) {
            <span class="error-msg">Vui lòng chấp thuận điều khoản để tạo hồ sơ khám bệnh.</span>
          }
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="submit-btn"
          [disabled]="isLoading()"
        >
          @if (isLoading()) {
            <span class="spinner"></span>
            <span>Đang khởi tạo hồ sơ bệnh án...</span>
          } @else {
            <span class="btn-inner-content">
              <app-clinic-icon name="user-plus" [size]="17" color="#FFFFFF"></app-clinic-icon>
              <span>Hoàn Tất Đăng Ký & Nhận Mã Bệnh Nhân</span>
            </span>
          }
        </button>
      </form>

      <!-- Already registered prompt -->
      <div class="login-prompt-box">
        <div class="prompt-text-group">
          <span class="prompt-title">Đã có tài khoản hoặc từng khám trước đó?</span>
          <span class="prompt-sub">Đăng nhập để vào cổng bệnh nhân hoặc xem hồ sơ cũ</span>
        </div>
        <a routerLink="/auth/login" class="login-action-btn">
          <span>Đăng nhập ngay</span>
          <app-clinic-icon name="arrow-right" [size]="13"></app-clinic-icon>
        </a>
      </div>

      <!-- Footer Hotlines -->
      <div class="register-footer">
        <span>Tổng đài tư vấn sức khỏe & đặt khám: <strong>1900 1234</strong> • Hỗ trợ tài khoản: <strong>028 3822 9999</strong></span>
      </div>
    </div>
  `,
  styles: [
    `
      .register-card {
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
        margin-bottom: 22px;
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

      .register-header {
        margin-bottom: 20px;
      }

      .header-emblem-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
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

      .register-title {
        font-size: 1.75rem;
        color: #1C2733;
        margin: 0 0 6px 0;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .register-desc {
        color: #384654;
        font-size: 0.85rem;
        margin: 0 0 12px 0;
        line-height: 1.5;
        font-weight: 450;
      }

      .value-pills-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .value-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #F7F5EF;
        border: 1px solid #E5E0D5;
        color: #2D3E4E;
        font-size: 0.73rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
      }

      // Form layout
      .register-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-top: 6px;
      }

      .form-row-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .form-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1C2733;

        .req {
          color: #9B3D45;
          margin-left: 2px;
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
        pointer-events: none;
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

      .gender-segmented-control {
        display: flex;
        height: 42px;
        background: #F4EFE6;
        border: 1.5px solid #E2DCD0;
        border-radius: 12px;
        padding: 3px;
        gap: 3px;
      }

      .gender-segment {
        flex: 1;
        background: transparent;
        border: none;
        border-radius: 9px;
        font-size: 0.82rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: #0E4A55;
        }

        &.active {
          background: #FFFFFF;
          color: #0E4A55;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          font-weight: 700;
        }
      }

      .date-picker {
        cursor: pointer;
        padding-right: 12px;
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
        font-size: 0.73rem;
        color: #9B3D45;
        font-weight: 500;
        line-height: 1.3;
      }

      .form-extras {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 2px;
      }

      .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 0.79rem;
        color: #4A5968;
        cursor: pointer;
        user-select: none;
        line-height: 1.45;

        input {
          accent-color: #0E4A55;
          width: 15px;
          height: 15px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .terms-link {
          color: #0E4A55;
          font-weight: 600;
          text-decoration: underline;
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
        margin-top: 4px;

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

      .login-prompt-box {
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

        .login-action-btn {
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

      .register-footer {
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

      @media (max-width: 640px) {
        .form-row-grid {
          grid-template-columns: 1fr;
          gap: 14px;
        }
        .register-card {
          padding: 24px 20px;
        }
      }
    `,
  ],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);

  registerForm = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['1995-05-15'],
      gender: ['Nam'],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [true, [Validators.requiredTrue]],
    },
    { validators: [passwordMatchValidator] }
  );

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  setGender(gender: string): void {
    this.registerForm.patchValue({ gender });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.registerForm.value;

    this.authService
      .registerPatient({
        fullName: formValue.fullName || '',
        phone: formValue.phone || '',
        email: formValue.email || '',
        dateOfBirth: formValue.dateOfBirth || '',
        gender: formValue.gender || '',
        password: formValue.password || '',
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          // authService.registerPatient automatically redirects to /patient
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }
}
