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
        <div class="mesh-pattern-overlay"></div>
        <div class="ambient-glow glow-top"></div>
        <div class="ambient-glow glow-bottom"></div>

        <div class="visual-content">
          <!-- Top Nav Row -->
          <div class="top-nav-row">
            <a routerLink="/" class="back-home-btn" title="Quay lại trang chủ phòng khám">
              <span class="btn-icon-wrap">
                <app-clinic-icon name="arrow-left" [size]="15"></app-clinic-icon>
              </span>
              <span>Về trang chủ</span>
            </a>

            <div class="brand-badge">
              <div class="brand-emblem">
                <app-clinic-icon name="medical-cross" [size]="14" color="#ECC880"></app-clinic-icon>
              </div>
              <span class="brand-name">SMART CLINIC EMR</span>
              <span class="status-live-dot" title="Hệ thống trực tuyến 24/7"></span>
            </div>
          </div>

          <!-- Hero Quote Section -->
          <div class="quote-section">
            <div class="verified-tag">
              <span class="tag-icon-box">
                <app-clinic-icon name="shield-check" [size]="15" color="#5EEAD4"></app-clinic-icon>
              </span>
              <span>HỆ THỐNG Y TẾ SỐ ĐẠT CHUẨN ISO 27001 & HL7</span>
            </div>

            <h1 class="brand-slogan font-serif">
              Chuẩn mực y tế tinh tế, <br />
              <span class="gradient-gold-text">trải nghiệm thăm khám an tâm.</span>
            </h1>

            <p class="brand-description">
              Hệ thống quản lý phòng khám và bệnh án điện tử thông minh, chuẩn hóa quy trình từ tiếp nhận, khám chữa bệnh đến quản lý dược phẩm và thanh toán viện phí minh bạch.
            </p>

            <div class="feature-bullets-row">
              <div class="feature-bullet-item">
                <span class="bullet-check">
                  <app-clinic-icon name="check" [size]="12" color="#5EEAD4"></app-clinic-icon>
                </span>
                <span>Hồ sơ EMR Time-series</span>
              </div>
              <div class="feature-bullet-item">
                <span class="bullet-check">
                  <app-clinic-icon name="check" [size]="12" color="#5EEAD4"></app-clinic-icon>
                </span>
                <span>Cảnh báo tương tác thuốc DDI</span>
              </div>
              <div class="feature-bullet-item">
                <span class="bullet-check">
                  <app-clinic-icon name="check" [size]="12" color="#5EEAD4"></app-clinic-icon>
                </span>
                <span>Thanh toán viện phí QR chuẩn hóa</span>
              </div>
            </div>
          </div>

          <!-- Stat Cards Row -->
          <div class="stats-pills-row">
            <div class="stat-card">
              <div class="stat-card-top">
                <div class="stat-icon-circle teal-circle">
                  <app-clinic-icon name="users" [size]="18" color="#5EEAD4"></app-clinic-icon>
                </div>
                <span class="stat-mini-pill">Toàn diện</span>
              </div>
              <span class="stat-number">50,000+</span>
              <span class="stat-label">Hồ sơ bệnh nhân</span>
            </div>

            <div class="stat-card gold-border">
              <div class="stat-card-top">
                <div class="stat-icon-circle gold-circle">
                  <app-clinic-icon name="activity" [size]="18" color="#ECC880"></app-clinic-icon>
                </div>
                <span class="stat-mini-pill gold-pill">Chuẩn y khoa</span>
              </div>
              <span class="stat-number">99.8%</span>
              <span class="stat-label">Độ tin cậy & an toàn</span>
            </div>

            <div class="stat-card">
              <div class="stat-card-top">
                <div class="stat-icon-circle cyan-circle">
                  <app-clinic-icon name="clock" [size]="18" color="#67E8F9"></app-clinic-icon>
                </div>
                <span class="stat-mini-pill">Realtime</span>
              </div>
              <span class="stat-number">24/7</span>
              <span class="stat-label">Truy cập hồ sơ số</span>
            </div>
          </div>

          <!-- Footer Badges -->
          <div class="visual-footer">
            <div class="cert-badges-row">
              <span class="cert-badge">HIPAA COMPLIANT</span>
              <span class="cert-badge">HL7 FHIR v4</span>
              <span class="cert-badge">ISO 27001:2022</span>
            </div>
            <span class="footer-copy">© 2026 Smart Clinic EMR. Chuẩn mực bảo mật y tế HIPAA & HL7 sẵn sàng.</span>
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
        flex: 1.15;
        position: relative;
        background: radial-gradient(circle at 18% 22%, rgba(20, 85, 96, 0.5) 0%, transparent 48%),
                    radial-gradient(circle at 82% 80%, rgba(12, 48, 56, 0.6) 0%, transparent 52%),
                    linear-gradient(155deg, #051A20 0%, #082A34 45%, #051D24 100%);
        color: #FFFFFF;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 52px 60px;
        overflow: hidden;

        .mesh-pattern-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(rgba(236, 200, 128, 0.08) 1px, transparent 0),
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 32px 32px, 64px 64px, 64px 64px;
          pointer-events: none;
          opacity: 0.7;
        }

        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;

          &.glow-top {
            top: -12%;
            right: -10%;
            width: 420px;
            height: 420px;
            background: radial-gradient(circle, rgba(236, 200, 128, 0.22) 0%, transparent 70%);
            animation: pulseGlow 8s ease-in-out infinite alternate;
          }

          &.glow-bottom {
            bottom: -15%;
            left: -12%;
            width: 480px;
            height: 480px;
            background: radial-gradient(circle, rgba(94, 234, 212, 0.16) 0%, transparent 70%);
            animation: pulseGlow 10s ease-in-out infinite alternate-reverse;
          }
        }
      }

      @keyframes pulseGlow {
        0% { transform: scale(1) translate(0, 0); opacity: 0.8; }
        100% { transform: scale(1.15) translate(15px, -15px); opacity: 1; }
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
        gap: 10px;
        color: #F6F3EC;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        padding: 9px 18px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.18);
        backdrop-filter: blur(16px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        .btn-icon-wrap {
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
        }

        &:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(236, 200, 128, 0.5);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          transform: translateY(-1px);

          .btn-icon-wrap {
            transform: translateX(-3px);
          }
        }
      }

      .brand-badge {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        background: rgba(236, 200, 128, 0.10);
        border: 1px solid rgba(236, 200, 128, 0.35);
        padding: 8px 18px;
        border-radius: 999px;
        backdrop-filter: blur(14px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);

        .brand-emblem {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-name {
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #ECC880;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .status-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5EEAD4;
          box-shadow: 0 0 8px #5EEAD4;
          display: inline-block;
          animation: blinkDot 2s infinite ease-in-out;
        }
      }

      @keyframes blinkDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }

      .quote-section {
        max-width: 600px;
        margin: 32px 0;
      }

      .verified-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #BBECE2;
        background: rgba(94, 234, 212, 0.14);
        border: 1px solid rgba(94, 234, 212, 0.35);
        padding: 6px 16px;
        border-radius: 999px;
        margin-bottom: 20px;
        backdrop-filter: blur(8px);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);

        .tag-icon-box {
          display: flex;
          align-items: center;
        }
      }

      .brand-slogan {
        font-size: 2.65rem;
        line-height: 1.25;
        font-weight: 600;
        color: #FFFFFF;
        margin-bottom: 20px;
        letter-spacing: -0.01em;
        text-shadow: 0 2px 14px rgba(0, 0, 0, 0.3);

        .gradient-gold-text {
          background: linear-gradient(135deg, #FFFFFF 0%, #FDE68A 45%, #ECC880 80%, #D4A359 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
      }

      .brand-description {
        font-size: 1.025rem;
        line-height: 1.7;
        color: rgba(246, 243, 236, 0.92);
        margin: 0 0 22px 0;
        font-weight: 400;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      }

      .feature-bullets-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 18px;

        .feature-bullet-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);

          .bullet-check {
            display: flex;
            align-items: center;
          }
        }
      }

      .stats-pills-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 30px;
      }

      .stat-card {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        padding: 16px 18px;
        border-radius: 16px;
        backdrop-filter: blur(14px);
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
        transition: all 0.25s ease;

        &:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255, 255, 255, 0.26);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
        }

        &.gold-border {
          border-color: rgba(236, 200, 128, 0.35);
          background: rgba(236, 200, 128, 0.06);

          &:hover {
            border-color: rgba(236, 200, 128, 0.65);
            background: rgba(236, 200, 128, 0.10);
          }
        }

        .stat-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .stat-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;

          &.teal-circle {
            background: rgba(94, 234, 212, 0.16);
            border: 1px solid rgba(94, 234, 212, 0.3);
          }

          &.gold-circle {
            background: rgba(236, 200, 128, 0.18);
            border: 1px solid rgba(236, 200, 128, 0.38);
          }

          &.cyan-circle {
            background: rgba(103, 232, 249, 0.16);
            border: 1px solid rgba(103, 232, 249, 0.3);
          }
        }

        .stat-mini-pill {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(246, 243, 236, 0.7);
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 7px;
          border-radius: 999px;

          &.gold-pill {
            color: #ECC880;
            background: rgba(236, 200, 128, 0.18);
          }
        }

        .stat-number {
          font-size: 1.55rem;
          font-weight: 750;
          color: #ECC880;
          letter-spacing: -0.02em;
          line-height: 1.15;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }

        .stat-label {
          font-size: 0.78rem;
          color: rgba(246, 243, 236, 0.88);
          font-weight: 500;
        }
      }

      .visual-footer {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .cert-badges-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;

          .cert-badge {
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: rgba(246, 243, 236, 0.75);
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.14);
            padding: 3px 10px;
            border-radius: 6px;
            backdrop-filter: blur(6px);
          }
        }

        .footer-copy {
          font-size: 0.8rem;
          color: rgba(246, 243, 236, 0.78);
          letter-spacing: 0.01em;
          line-height: 1.4;
        }
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
