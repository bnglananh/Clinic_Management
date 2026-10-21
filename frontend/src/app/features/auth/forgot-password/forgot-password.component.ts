import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ClinicIconComponent],
  template: `
    <div class="forgot-card clinic-card">
      <!-- Auth Switcher Tabs -->
      <div class="auth-tabs-nav">
        <a routerLink="/auth/login" class="auth-tab">
          <app-clinic-icon name="login" [size]="15"></app-clinic-icon>
          <span>Đăng Nhập</span>
        </a>
        <a routerLink="/auth/register" class="auth-tab">
          <app-clinic-icon name="user-plus" [size]="15"></app-clinic-icon>
          <span>Đăng Ký Hồ Sơ</span>
        </a>
        <a routerLink="/auth/forgot-password" class="auth-tab active">
          <app-clinic-icon name="key" [size]="15"></app-clinic-icon>
          <span>Quên Mật Khẩu</span>
        </a>
      </div>

      <!-- Header -->
      <div class="forgot-header">
        <div class="header-emblem-row">
          <div class="auth-icon-badge">
            <app-clinic-icon name="shield-check" [size]="18" color="#0E4A55"></app-clinic-icon>
          </div>
          <span class="sub-badge">XÁC THỰC BẢO MẬT • KHÔI PHỤC TÀI KHOẢN</span>
        </div>
        <h2 class="forgot-title font-serif">Khôi Phục Mật Khẩu</h2>
        <p class="forgot-desc">
          Xác thực danh tính qua mã OTP gửi về hòm thư điện tử để đặt lại mật khẩu an toàn.
        </p>
      </div>

      <!-- Step Progression Bar -->
      <div class="steps-progress-bar">
        <div class="step-item" [class.active]="currentStep() >= 1" [class.done]="currentStep() > 1">
          <div class="step-circle">
            <span *ngIf="currentStep() <= 1">1</span>
            <app-clinic-icon *ngIf="currentStep() > 1" name="check" [size]="14"></app-clinic-icon>
          </div>
          <span class="step-label">Nhập Email</span>
        </div>
        <div class="step-connector" [class.filled]="currentStep() >= 2"></div>

        <div class="step-item" [class.active]="currentStep() >= 2" [class.done]="currentStep() > 2">
          <div class="step-circle">
            <span *ngIf="currentStep() <= 2">2</span>
            <app-clinic-icon *ngIf="currentStep() > 2" name="check" [size]="14"></app-clinic-icon>
          </div>
          <span class="step-label">Nhập Mã OTP</span>
        </div>
        <div class="step-connector" [class.filled]="currentStep() >= 3"></div>

        <div class="step-item" [class.active]="currentStep() >= 3" [class.done]="currentStep() > 3">
          <div class="step-circle">
            <span *ngIf="currentStep() <= 3">3</span>
            <app-clinic-icon *ngIf="currentStep() > 3" name="check" [size]="14"></app-clinic-icon>
          </div>
          <span class="step-label">Mật Khẩu Mới</span>
        </div>
      </div>

      <!-- Global Error / Alert Notice -->
      @if (errorMessage()) {
        <div class="alert-banner alert-error">
          <app-clinic-icon name="alert-triangle" [size]="18" color="#DC2626"></app-clinic-icon>
          <div class="alert-text">{{ errorMessage() }}</div>
        </div>
      }

      @if (successMessage()) {
        <div class="alert-banner alert-success">
          <app-clinic-icon name="check-circle" [size]="18" color="#059669"></app-clinic-icon>
          <div class="alert-text">{{ successMessage() }}</div>
        </div>
      }

      <!-- ================= STEP 1: NHẬP EMAIL / TÊN ĐĂNG NHẬP ================= -->
      @if (currentStep() === 1) {
        <form [formGroup]="emailForm" (ngSubmit)="onSendOtp()" class="step-form">
          <div class="form-group">
            <label class="form-label" for="email">Email đã đăng ký hoặc Tên đăng nhập</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-clinic-icon name="mail" [size]="16" color="#0E4A55"></app-clinic-icon>
              </span>
              <input
                id="email"
                type="text"
                formControlName="email"
                class="clinic-input"
                placeholder="Ví dụ: an.pham@gmail.com hoặc hoang.tran..."
                autocomplete="email"
              />
            </div>
            @if (emailForm.get('email')?.touched && emailForm.get('email')?.invalid) {
              <span class="error-msg">Vui lòng nhập địa chỉ email hoặc tên đăng nhập.</span>
            }
          </div>

          <div class="quick-demo-tips">
            <span class="tips-title">Tài khoản thử nghiệm có sẵn:</span>
            <div class="tips-tags">
              <button type="button" class="tip-tag" (click)="fillQuickEmail('an.pham@gmail.com')">
                an.pham&#64;gmail.com (Bệnh nhân)
              </button>
              <button type="button" class="tip-tag" (click)="fillQuickEmail('hoang.tran@smartclinic.vn')">
                hoang.tran&#64;smartclinic.vn (Bác sĩ)
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="submit-btn"
            [disabled]="emailForm.invalid || isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              <span>Đang gửi mã OTP qua email...</span>
            } @else {
              <span>Gửi Mã Xác Thực OTP</span>
              <app-clinic-icon name="arrow-right" [size]="16"></app-clinic-icon>
            }
          </button>
        </form>
      }

      <!-- ================= STEP 2: NHẬP MÃ OTP 6 CHỮ SỐ ================= -->
      @if (currentStep() === 2) {
        <div class="step-form">
          <div class="otp-intro-box">
            <div class="otp-intro-icon">
              <app-clinic-icon name="mail-check" [size]="24" color="#0E4A55"></app-clinic-icon>
            </div>
            <div class="otp-intro-text">
              <p class="intro-title">Mã xác thực đã được gửi tới email:</p>
              <p class="intro-email">{{ targetEmail() }}</p>
              <p class="intro-sub">Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác/spam) và nhập 6 chữ số dưới đây.</p>
            </div>
          </div>

          @if (devOtp()) {
            <div class="dev-otp-badge" (click)="autoFillDevOtp()" title="Bấm để điền nhanh mã OTP">
              <span class="dev-pill">DEMO TEST</span>
              <span class="dev-text">Mã OTP vừa sinh: <strong>{{ devOtp() }}</strong></span>
              <span class="dev-action">(Bấm để điền nhanh)</span>
            </div>
          }

          <div class="otp-inputs-wrapper">
            @for (item of [0, 1, 2, 3, 4, 5]; track item; let i = $index) {
              <input
                #otpInput
                type="text"
                maxlength="1"
                class="otp-digit-box"
                [value]="otpDigits[i]"
                (input)="onDigitInput($event, i)"
                (keydown)="onDigitKeydown($event, i)"
                (paste)="onPasteOtp($event)"
                inputmode="numeric"
                pattern="[0-9]*"
              />
            }
          </div>

          <div class="timer-resend-row">
            @if (countdown() > 0) {
              <span class="timer-text">
                <app-clinic-icon name="clock" [size]="14"></app-clinic-icon>
                Mã có hiệu lực trong: <strong>{{ countdown() }}s</strong>
              </span>
            } @else {
              <span class="timer-expired">Mã đã hết hạn hiệu lực</span>
            }

            <button
              type="button"
              class="resend-btn"
              [disabled]="countdown() > 0 || isLoading()"
              (click)="onResendOtp()"
            >
              Gửi lại mã OTP
            </button>
          </div>

          <div class="buttons-row">
            <button type="button" class="back-btn" (click)="goToStep(1)">
              <app-clinic-icon name="arrow-left" [size]="15"></app-clinic-icon>
              <span>Quay lại</span>
            </button>
            <button
              type="button"
              class="submit-btn flex-1"
              [disabled]="getCombinedOtp().length !== 6 || isLoading()"
              (click)="onVerifyOtp()"
            >
              @if (isLoading()) {
                <span class="spinner"></span>
                <span>Đang kiểm tra OTP...</span>
              } @else {
                <span>Xác Thực OTP</span>
                <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
              }
            </button>
          </div>
        </div>
      }

      <!-- ================= STEP 3: THIẾT LẬP MẬT KHẨU MỚI ================= -->
      @if (currentStep() === 3) {
        <form [formGroup]="passwordForm" (ngSubmit)="onResetPassword()" class="step-form">
          <div class="form-group">
            <label class="form-label" for="newPassword">Mật khẩu mới</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-clinic-icon name="lock" [size]="16" color="#0E4A55"></app-clinic-icon>
              </span>
              <input
                id="newPassword"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="newPassword"
                class="clinic-input"
                placeholder="Tối thiểu 6 ký tự bảo mật..."
              />
              <button
                type="button"
                (click)="toggleShowPassword()"
                class="eye-btn"
                tabindex="-1"
              >
                <app-clinic-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="16"></app-clinic-icon>
              </button>
            </div>
            @if (passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.hasError('minlength')) {
              <span class="error-msg">Mật khẩu phải có tối thiểu 6 ký tự.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Xác nhận mật khẩu mới</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-clinic-icon name="shield" [size]="16" color="#0E4A55"></app-clinic-icon>
              </span>
              <input
                id="confirmPassword"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                class="clinic-input"
                placeholder="Nhập lại mật khẩu mới..."
              />
              <button
                type="button"
                (click)="toggleShowConfirmPassword()"
                class="eye-btn"
                tabindex="-1"
              >
                <app-clinic-icon [name]="showConfirmPassword() ? 'eye-off' : 'eye'" [size]="16"></app-clinic-icon>
              </button>
            </div>
            @if (passwordForm.touched && passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
              <span class="error-msg">Mật khẩu xác nhận không trùng khớp.</span>
            }
          </div>

          <!-- Password Requirement Indicators -->
          <div class="pw-criteria-box">
            <div class="criteria-item" [class.valid]="(passwordForm.get('newPassword')?.value || '').length >= 6">
              <app-clinic-icon
                [name]="(passwordForm.get('newPassword')?.value || '').length >= 6 ? 'check' : 'circle'"
                [size]="12"
              ></app-clinic-icon>
              <span>Độ dài từ 6 ký tự trở lên</span>
            </div>
            <div
              class="criteria-item"
              [class.valid]="
                passwordForm.get('newPassword')?.value &&
                passwordForm.get('newPassword')?.value === passwordForm.get('confirmPassword')?.value
              "
            >
              <app-clinic-icon
                [name]="
                  passwordForm.get('newPassword')?.value &&
                  passwordForm.get('newPassword')?.value === passwordForm.get('confirmPassword')?.value
                    ? 'check'
                    : 'circle'
                "
                [size]="12"
              ></app-clinic-icon>
              <span>Mật khẩu xác nhận khớp nhau</span>
            </div>
          </div>

          <button
            type="submit"
            class="submit-btn"
            [disabled]="passwordForm.invalid || passwordForm.value.newPassword !== passwordForm.value.confirmPassword || isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              <span>Đang cập nhật mật khẩu mới...</span>
            } @else {
              <span>Cập Nhật Mật Khẩu Mới</span>
              <app-clinic-icon name="shield-check" [size]="16"></app-clinic-icon>
            }
          </button>
        </form>
      }

      <!-- ================= STEP 4: HOÀN TẤT THÀNH CÔNG ================= -->
      @if (currentStep() === 4) {
        <div class="success-screen">
          <div class="success-icon-wrap">
            <app-clinic-icon name="check-circle" [size]="52" color="#0E4A55"></app-clinic-icon>
          </div>
          <h3 class="success-title">Đổi Mật Khẩu Thành Công!</h3>
          <p class="success-desc">
            Mật khẩu mới của bạn đã được cập nhật thành công vào hệ thống. Bạn có thể sử dụng mật khẩu mới này để đăng nhập ngay bây giờ.
          </p>

          <a routerLink="/auth/login" class="submit-btn full-link">
            <span>Đăng Nhập Ngay</span>
            <app-clinic-icon name="arrow-right" [size]="16"></app-clinic-icon>
          </a>
        </div>
      }

      <!-- Bottom Return Link -->
      <div class="forgot-footer">
        <a routerLink="/auth/login" class="back-link">
          <app-clinic-icon name="arrow-left" [size]="14"></app-clinic-icon>
          <span>Quay lại trang Đăng Nhập</span>
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .forgot-card {
        padding: 32px 36px;
        background: #FFFFFF;
        border-radius: 20px;
        box-shadow: 0 16px 40px rgba(28, 39, 51, 0.08);
        border: 1px solid #E8E2D5;
      }

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
        gap: 6px;
        padding: 9px 12px;
        border-radius: 9px;
        font-size: 0.82rem;
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

      .forgot-header {
        margin-bottom: 22px;
      }

      .header-emblem-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .auth-icon-badge {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #E8F3F4;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #CCE5E7;
      }

      .sub-badge {
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 1.2px;
        color: #0E4A55;
        background: #F0F7F7;
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid #D6ECEE;
      }

      .forgot-title {
        font-size: 1.45rem;
        color: #1A2530;
        margin-bottom: 6px;
      }

      .forgot-desc {
        font-size: 0.88rem;
        color: #606F7B;
        line-height: 1.5;
        margin: 0;
      }

      /* Step Progress Bar */
      .steps-progress-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding: 12px 16px;
        background: #F9F7F2;
        border-radius: 12px;
        border: 1px solid #EFEAE0;
      }

      .step-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .step-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #E2DDD3;
          color: #7B8A95;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
          transition: all 0.25s ease;
        }

        .step-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #7B8A95;
          transition: all 0.25s ease;
        }

        &.active {
          .step-circle {
            background: #0E4A55;
            color: #FFFFFF;
          }
          .step-label {
            color: #0E4A55;
          }
        }

        &.done {
          .step-circle {
            background: #059669;
            color: #FFFFFF;
          }
        }
      }

      .step-connector {
        flex: 1;
        height: 2px;
        background: #E2DDD3;
        margin: 0 10px;
        transition: background 0.3s ease;

        &.filled {
          background: #0E4A55;
        }
      }

      /* Alerts */
      .alert-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 0.85rem;
        margin-bottom: 20px;
        line-height: 1.45;

        &.alert-error {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
        }

        &.alert-success {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #065F46;
        }
      }

      /* Forms */
      .step-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-label {
        font-size: 0.84rem;
        font-weight: 600;
        color: #2D3748;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon {
        position: absolute;
        left: 14px;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .clinic-input {
        width: 100%;
        padding: 11px 40px 11px 42px;
        font-size: 0.9rem;
        border-radius: 10px;
        border: 1px solid #D8D2C4;
        background: #FDFBF8;
        color: #1A2530;
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          background: #FFFFFF;
          border-color: #0E4A55;
          box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.12);
        }
      }

      .eye-btn {
        position: absolute;
        right: 12px;
        background: transparent;
        border: none;
        cursor: pointer;
        color: #7B8A95;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: #0E4A55;
        }
      }

      .error-msg {
        font-size: 0.78rem;
        color: #DC2626;
        font-weight: 500;
      }

      /* Quick demo pills */
      .quick-demo-tips {
        background: #F7F5EF;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px dashed #D6CFBE;

        .tips-title {
          display: block;
          font-size: 0.74rem;
          font-weight: 700;
          color: #6C7A87;
          margin-bottom: 6px;
        }

        .tips-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tip-tag {
          background: #FFFFFF;
          border: 1px solid #D0C9BA;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.74rem;
          color: #0E4A55;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;

          &:hover {
            background: #0E4A55;
            color: #FFFFFF;
            border-color: #0E4A55;
          }
        }
      }

      /* OTP Box in Step 2 */
      .otp-intro-box {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        background: #F0F7F7;
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid #CCE5E7;

        .intro-title {
          font-size: 0.8rem;
          color: #4A5B68;
          margin: 0;
        }

        .intro-email {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0E4A55;
          margin: 2px 0 4px 0;
        }

        .intro-sub {
          font-size: 0.78rem;
          color: #6A7B88;
          margin: 0;
          line-height: 1.4;
        }
      }

      .dev-otp-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #FEF3C7;
        border: 1px solid #FCD34D;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.82rem;
        color: #92400E;
        transition: background 0.15s ease;

        &:hover {
          background: #FDE68A;
        }

        .dev-pill {
          background: #B45309;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .dev-text {
          flex: 1;
        }

        .dev-action {
          font-size: 0.76rem;
          text-decoration: underline;
        }
      }

      .otp-inputs-wrapper {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 10px 0;
      }

      .otp-digit-box {
        width: 46px;
        height: 56px;
        text-align: center;
        font-size: 1.5rem;
        font-weight: 800;
        font-family: monospace;
        border-radius: 10px;
        border: 1.5px solid #D0C9BA;
        background: #FDFBF8;
        color: #0E4A55;
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: #0E4A55;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.15);
        }
      }

      .timer-resend-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.82rem;

        .timer-text {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6C7A87;

          strong {
            color: #0E4A55;
          }
        }

        .timer-expired {
          color: #DC2626;
          font-weight: 600;
        }

        .resend-btn {
          background: transparent;
          border: none;
          color: #0E4A55;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;

          &:disabled {
            color: #A0AEC0;
            cursor: not-allowed;
            text-decoration: none;
          }
        }
      }

      .buttons-row {
        display: flex;
        gap: 12px;
        margin-top: 6px;
      }

      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 12px 18px;
        border-radius: 10px;
        border: 1px solid #D0C9BA;
        background: #F7F5EF;
        color: #4A5B68;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #EFEAE0;
          color: #1A2530;
        }
      }

      .flex-1 {
        flex: 1;
      }

      /* Step 3 Password Criteria */
      .pw-criteria-box {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: #F9F7F2;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #EAE4D8;

        .criteria-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #8C99A4;

          &.valid {
            color: #059669;
            font-weight: 600;
          }
        }
      }

      /* Step 4 Success */
      .success-screen {
        text-align: center;
        padding: 16px 8px;

        .success-icon-wrap {
          margin-bottom: 16px;
        }

        .success-title {
          font-size: 1.35rem;
          color: #1A2530;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .success-desc {
          font-size: 0.88rem;
          color: #606F7B;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .full-link {
          text-decoration: none;
          justify-content: center;
        }
      }

      /* Buttons & Footer */
      .submit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 13px 20px;
        background: linear-gradient(135deg, #0E4A55 0%, #156270 100%);
        color: #FFFFFF;
        border: none;
        border-radius: 10px;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(14, 74, 85, 0.22);
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(14, 74, 85, 0.32);
        }

        &:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #FFFFFF;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .forgot-footer {
        margin-top: 24px;
        padding-top: 18px;
        border-top: 1px solid #EFEAE0;
        text-align: center;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #0E4A55;
        font-size: 0.84rem;
        font-weight: 600;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    `,
  ],
})
export class ForgotPasswordComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public readonly currentStep = signal<1 | 2 | 3 | 4>(1);
  public readonly targetEmail = signal<string>('');
  public readonly devOtp = signal<string>('');
  public readonly countdown = signal<number>(60);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);
  public readonly showPassword = signal<boolean>(false);
  public readonly showConfirmPassword = signal<boolean>(false);

  public otpDigits: string[] = ['', '', '', '', '', ''];
  private timerInterval: any = null;

  public emailForm = this.fb.group({
    email: ['', [Validators.required]],
  });

  public passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnDestroy(): void {
    this.clearTimer();
  }

  public fillQuickEmail(email: string): void {
    this.emailForm.patchValue({ email });
    this.errorMessage.set(null);
  }

  public goToStep(step: 1 | 2 | 3 | 4): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.currentStep.set(step);
  }

  public toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  public toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  public onSendOtp(): void {
    if (this.emailForm.invalid) return;
    const emailVal = this.emailForm.value.email || '';

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.requestForgotPasswordOtp(emailVal).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.targetEmail.set(res.email);
        this.devOtp.set(res.devOtp || '');
        this.successMessage.set(res.message);
        this.otpDigits = ['', '', '', '', '', ''];
        this.currentStep.set(2);
        this.startTimer(60);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || 'Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại.');
      },
    });
  }

  public onResendOtp(): void {
    if (this.countdown() > 0) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.requestForgotPasswordOtp(this.targetEmail()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.devOtp.set(res.devOtp || '');
        this.successMessage.set('Đã gửi lại mã OTP mới qua email. Vui lòng kiểm tra hộp thư.');
        this.otpDigits = ['', '', '', '', '', ''];
        this.startTimer(60);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
      },
    });
  }

  public onVerifyOtp(): void {
    const combinedOtp = this.getCombinedOtp();
    if (combinedOtp.length !== 6) {
      this.errorMessage.set('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.verifyOtp(this.targetEmail(), combinedOtp).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.clearTimer();
        this.currentStep.set(3);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      },
    });
  }

  public onResetPassword(): void {
    if (this.passwordForm.invalid) return;
    const { newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .resetPasswordWithOtp(
        this.targetEmail(),
        this.getCombinedOtp(),
        newPassword!,
        confirmPassword!
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.currentStep.set(4);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu mới.');
        },
      });
  }

  public autoFillDevOtp(): void {
    const code = this.devOtp();
    if (code && code.length === 6) {
      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = code[i];
      }
      this.errorMessage.set(null);
    }
  }

  public getCombinedOtp(): string {
    return this.otpDigits.join('');
  }

  public onDigitInput(event: any, index: number): void {
    const val = event.target.value.replace(/[^0-9]/g, '');
    this.otpDigits[index] = val ? val[val.length - 1] : '';
    event.target.value = this.otpDigits[index];

    if (this.otpDigits[index] && index < 5) {
      const nextInput = event.target.nextElementSibling;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  public onDigitKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = (event.target as HTMLElement).previousElementSibling as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  public onPasteOtp(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/[^0-9]/g, '').slice(0, 6);
    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = digits[i] || '';
    }
  }

  private startTimer(seconds: number): void {
    this.clearTimer();
    this.countdown.set(seconds);
    this.timerInterval = setInterval(() => {
      this.countdown.update((c) => {
        if (c <= 1) {
          this.clearTimer();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
