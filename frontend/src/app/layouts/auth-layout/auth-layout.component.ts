import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClinicIconComponent } from '../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ClinicIconComponent],
  template: `
    <div class="auth-layout-container">
      <!-- Left Visual Panel (50%) -->
      <div class="auth-visual-panel">
        <div class="visual-overlay"></div>
        <div class="visual-content">
          <div class="top-nav-row">
            <a routerLink="/" class="back-home-btn" title="Quay lại trang chủ phòng khám">
              <app-clinic-icon name="arrow-left" [size]="16"></app-clinic-icon>
              <span>Về trang chủ</span>
            </a>
            <div class="brand-badge">
              <app-clinic-icon name="medical-cross" [size]="16" color="#B8955A"></app-clinic-icon>
              <span>SMART CLINIC EMR</span>
            </div>
          </div>

          <div class="quote-section">
            <div class="verified-tag">
              <app-clinic-icon name="shield-check" [size]="14" color="#5E8B7E"></app-clinic-icon>
              <span>HỆ THỐNG Y TẾ SỐ ĐẠT CHUẨN ISO 27001 & HL7</span>
            </div>
            <h1 class="brand-slogan font-serif">
              Chuẩn mực y tế tinh tế, <br />
              trải nghiệm thăm khám an tâm.
            </h1>
            <p class="brand-description">
              Hệ thống quản lý phòng khám và bệnh án điện tử thông minh, chuẩn hóa quy trình từ tiếp nhận, khám chữa bệnh đến quản lý dược phẩm và thanh toán viện phí minh bạch.
            </p>
          </div>

          <div class="stats-pills-row">
            <div class="stat-card">
              <span class="stat-number">50,000+</span>
              <span class="stat-label">Hồ sơ bệnh nhân</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">99.8%</span>
              <span class="stat-label">Độ tin cậy & an toàn</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">24/7</span>
              <span class="stat-label">Truy cập hồ sơ số</span>
            </div>
          </div>

          <div class="visual-footer">
            <span>© 2026 Smart Clinic EMR. Chuẩn mực bảo mật y tế HIPAA & HL7 sẵn sàng.</span>
          </div>
        </div>
      </div>

      <!-- Right Form Panel (50%) -->
      <div class="auth-form-panel">
        <div class="mobile-top-nav">
          <a routerLink="/" class="mobile-back-btn">
            <app-clinic-icon name="arrow-left" [size]="14"></app-clinic-icon>
            <span>Trang chủ</span>
          </a>
          <span class="mobile-brand">SMART CLINIC EMR</span>
        </div>
        <div class="form-wrapper">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-layout-container {
        display: flex;
        min-height: 100vh;
        width: 100vw;
        background-color: #F6F3EC;
      }

      // Left Panel
      .auth-visual-panel {
        flex: 1.1;
        position: relative;
        background: linear-gradient(145deg, #1C2733 0%, #0E4A55 60%, #15333C 100%);
        color: #FFFFFF;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 48px 56px;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: -20%;
          right: -20%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(184, 149, 90, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        &::after {
          content: '';
          position: absolute;
          bottom: -15%;
          left: -15%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 74, 85, 0.3) 0%, transparent 70%);
          pointer-events: none;
        }
      }

      .visual-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: space-between;
      }

      .top-nav-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .back-home-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: rgba(246, 243, 236, 0.85);
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        padding: 8px 16px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(8px);
        transition: all 0.2s ease;

        &:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(184, 149, 90, 0.5);
          transform: translateX(-2px);
        }
      }

      .brand-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(184, 149, 90, 0.3);
        padding: 8px 18px;
        border-radius: 999px;
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        color: #B8955A;
        backdrop-filter: blur(8px);
      }

      .quote-section {
        max-width: 580px;
        margin: 40px 0;
      }

      .verified-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #A3C9BF;
        background: rgba(94, 139, 126, 0.2);
        border: 1px solid rgba(94, 139, 126, 0.35);
        padding: 4px 12px;
        border-radius: 999px;
        margin-bottom: 18px;
      }

      .brand-slogan {
        font-size: 2.5rem;
        line-height: 1.25;
        font-weight: 500;
        color: #F6F3EC;
        margin-bottom: 18px;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }

      .brand-description {
        font-size: 1rem;
        line-height: 1.6;
        color: rgba(246, 243, 236, 0.85);
        margin: 0;
      }

      .stats-pills-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 32px;
      }

      .stat-card {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 14px 18px;
        border-radius: 12px;
        backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        gap: 4px;

        .stat-number {
          font-size: 1.35rem;
          font-weight: 700;
          color: #B8955A;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-size: 0.75rem;
          color: rgba(246, 243, 236, 0.75);
          font-weight: 500;
        }
      }

      .visual-footer {
        font-size: 0.8125rem;
        color: rgba(246, 243, 236, 0.55);
      }

      // Right Panel
      .auth-form-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 36px 24px;
        background-color: #F6F3EC;
        position: relative;
        overflow-y: auto;
        max-height: 100vh;
      }

      .form-wrapper {
        width: 100%;
        max-width: 540px;
        margin: auto 0;
      }

      .mobile-top-nav {
        display: none;
        width: 100%;
        max-width: 520px;
        margin-bottom: 16px;
        justify-content: space-between;
        align-items: center;
      }

      .mobile-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #0E4A55;
        text-decoration: none;
        padding: 6px 12px;
        border-radius: 999px;
        background: #FFFFFF;
        border: 1px solid #E4DED2;
      }

      .mobile-brand {
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: #B8955A;
      }

      .form-wrapper {
        width: 100%;
        max-width: 520px;
        margin: auto;
      }

      @media (max-width: 1024px) {
        .auth-visual-panel {
          display: none;
        }
        .mobile-top-nav {
          display: flex;
        }
        .auth-form-panel {
          flex: 1;
          padding: 20px 16px;
          max-height: none;
          min-height: 100vh;
        }
      }
    `,
  ],
})
export class AuthLayoutComponent {}
