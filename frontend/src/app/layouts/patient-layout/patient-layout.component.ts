import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { ClinicIconComponent } from '../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ClinicIconComponent],
  template: `
    <div class="patient-app-wrapper">
      <!-- Luxury Top Navigation -->
      <header class="patient-header glass-header">
        <div class="header-inner">
          <div class="brand-zone">
            <div class="brand-symbol">
              <app-clinic-icon name="medical-cross" [size]="20" color="#B8955A"></app-clinic-icon>
            </div>
            <div class="brand-titles">
              <span class="brand-name font-serif">SMART CLINIC</span>
              <span class="brand-portal">CỔNG BỆNH NHÂN</span>
            </div>
          </div>

          <!-- Main Top Menu -->
          <nav class="patient-nav">
            <a
              routerLink="/patient/dashboard"
              routerLinkActive="active"
              class="nav-link"
            >
              Trang chủ
            </a>
            <a
              routerLink="/patient/booking"
              routerLinkActive="active"
              class="nav-link highlight-booking"
            >
              <app-clinic-icon name="calendar" [size]="15"></app-clinic-icon>
              <span>Đặt lịch khám</span>
            </a>
            <a
              routerLink="/patient/queue"
              routerLinkActive="active"
              class="nav-link"
            >
              <app-clinic-icon name="clock" [size]="15"></app-clinic-icon>
              <span>Số thứ tự hôm nay</span>
            </a>
            <a
              routerLink="/patient/records"
              routerLinkActive="active"
              class="nav-link"
            >
              <app-clinic-icon name="clipboard" [size]="15"></app-clinic-icon>
              <span>Hồ sơ sức khỏe</span>
            </a>
            <a
              routerLink="/patient/billing"
              routerLinkActive="active"
              class="nav-link"
            >
              <app-clinic-icon name="credit-card" [size]="15"></app-clinic-icon>
              <span>Hóa đơn viện phí</span>
            </a>
            <a
              routerLink="/patient/profile"
              routerLinkActive="active"
              class="nav-link"
            >
              <app-clinic-icon name="user" [size]="15"></app-clinic-icon>
              <span>Hồ sơ cá nhân</span>
            </a>
          </nav>

          <!-- Right Controls -->
          <div class="patient-controls">

            <!-- Patient Avatar & Info -->
            <div class="patient-profile">
              <a routerLink="/patient/profile" class="patient-profile-link" title="Quản lý hồ sơ & thông tin cá nhân">
                <img
                  [src]="currentUser()?.avatarUrl"
                  [alt]="currentUser()?.fullName"
                  class="patient-avatar"
                />
                <div class="patient-name-box">
                  <span class="p-name">{{ currentUser()?.fullName }}</span>
                  <span class="p-type">Hạng Vàng VIP</span>
                </div>
              </a>
              <button (click)="logout()" class="logout-link" title="Đăng xuất">
                <app-clinic-icon name="logout" [size]="16"></app-clinic-icon>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Canvas -->
      <main class="patient-content animate-fade-in-up">
        <div class="patient-container">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Footer -->
      <footer class="patient-footer">
        <div class="footer-inner">
          <div class="footer-left">
            <span class="f-brand">Smart Clinic EMR</span>
            <span class="f-text">• Hotline Cấp Cứu 24/7: <strong>1900 6868</strong> • Địa chỉ: 120 Hai Bà Trưng, Q.1, TP.HCM</span>
          </div>
          <div class="footer-right">
            <span>© 2026 Smart Clinic Healthcare System</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .patient-app-wrapper {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background-color: #F6F3EC;
      }

      .patient-header {
        height: 72px;
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        border-bottom: 1px solid rgba(228, 222, 210, 0.7);
      }

      .header-inner {
        width: 100%;
        max-width: 1320px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .brand-zone {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .brand-symbol {
        width: 38px;
        height: 38px;
        background: #0E4A55;
        border: 1px solid #B8955A;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #B8955A;
        font-weight: 700;
        font-size: 1.15rem;
      }

      .brand-titles {
        display: flex;
        flex-direction: column;
      }

      .brand-name {
        font-size: 1.15rem;
        font-weight: 700;
        color: #1C2733;
        letter-spacing: 0.02em;
      }

      .brand-portal {
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        color: #B8955A;
      }

      .patient-nav {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .nav-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #5B6672;
        text-decoration: none;
        transition: all 0.2s ease;

        &:hover {
          color: #0E4A55;
          background: rgba(14, 74, 85, 0.06);
        }

        &.active {
          color: #0E4A55;
          background: rgba(14, 74, 85, 0.12);
          font-weight: 600;
        }

        &.highlight-booking {
          background: #0E4A55;
          color: #FFFFFF;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(14, 74, 85, 0.25);

          &:hover {
            background: #135d6b;
          }
        }
      }

      .patient-controls {
        display: flex;
        align-items: center;
        gap: 16px;
      }


      .patient-profile {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-left: 12px;
        border-left: 1px solid rgba(228, 222, 210, 0.7);

        .patient-profile-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
          border-radius: 8px;
          padding: 3px 6px;
          transition: background-color 0.15s ease;

          &:hover {
            background-color: rgba(14, 74, 85, 0.06);
            .p-name {
              color: #0E4A55;
            }
          }
        }

        .patient-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #B8955A;
        }

        .patient-name-box {
          display: flex;
          flex-direction: column;
        }

        .p-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1C2733;
          transition: color 0.15s ease;
        }

        .p-type {
          font-size: 0.7rem;
          color: #B8955A;
          font-weight: 600;
        }

        .logout-link {
          background: transparent;
          border: none;
          color: #8C96A2;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;

          &:hover {
            color: #9B3D45;
          }
        }
      }

      .patient-content {
        flex: 1;
        padding: 32px 24px;
      }

      .patient-container {
        max-width: 1320px;
        margin: 0 auto;
      }

      .patient-footer {
        background: #1C2733;
        color: rgba(246, 243, 236, 0.7);
        padding: 24px;
        font-size: 0.8125rem;
        margin-top: auto;
      }

      .footer-inner {
        max-width: 1320px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .f-brand {
        color: #B8955A;
        font-weight: 600;
      }

      @media (max-width: 900px) {
        .patient-nav {
          display: none;
        }
      }
    `,
  ],
})
export class PatientLayoutComponent {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  switchRole(role: UserRole): void {
    this.authService.switchRole(role);
  }

  logout(): void {
    this.authService.logout();
  }
}
