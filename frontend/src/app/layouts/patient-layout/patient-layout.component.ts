import { Component, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { ClinicIconComponent } from '../../shared/components/clinic-icon/clinic-icon.component';
import { NotificationCenterComponent } from '../../shared/components/notification-center/notification-center.component';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ClinicIconComponent, NotificationCenterComponent],
  template: `
    <div class="patient-app-wrapper">
      <!-- Luxury Top Navigation -->
      <header class="patient-header glass-header">
        <div class="header-inner">
          <a routerLink="/" class="brand-zone" style="text-decoration: none;" title="Về trang chủ phòng khám">
            <div class="brand-symbol">
              <app-clinic-icon name="medical-cross" [size]="20" color="#ECC880"></app-clinic-icon>
            </div>
            <div class="brand-titles">
              <span class="brand-name font-serif">SMART CLINIC</span>
              <span class="brand-portal">CỔNG BỆNH NHÂN</span>
            </div>
          </a>

          <!-- Main Top Menu -->
          <nav class="patient-nav">
            <a
              routerLink="/"
              class="nav-link"
              title="Trang chủ phòng khám"
            >
              <app-clinic-icon name="home" [size]="15"></app-clinic-icon>
              <span>Trang chủ</span>
            </a>
            <a
              routerLink="/patient/dashboard"
              routerLinkActive="active"
              class="nav-link"
            >
              Tiến trình khám
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
              <span>Số thứ tự</span>
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
              <span>Hóa đơn</span>
            </a>
          </nav>

          <!-- Right Controls -->
          <div class="patient-controls">
            <!-- Notification Center -->
            <app-notification-center></app-notification-center>

            <!-- Patient Avatar & Profile Button -->
            <div class="patient-profile-wrap">
              <a routerLink="/patient/profile" class="patient-profile-chip" title="Hồ sơ cá nhân & Cài đặt tài khoản">
                <div class="patient-avatar-circle font-serif">
                  {{ patientMonogram() }}
                </div>
                <div class="patient-name-block">
                  <span class="patient-user-name">{{ currentUser()?.fullName || 'Phạm Văn An' }}</span>
                  <span class="patient-vip-badge">
                    <app-clinic-icon name="sparkle" [size]="10" color="#B8955A"></app-clinic-icon>
                    <span>VIP Vàng</span>
                  </span>
                </div>
                <app-clinic-icon name="chevron-right" [size]="13" class="profile-arrow-icon"></app-clinic-icon>
              </a>

              <button (click)="logout()" class="patient-logout-btn" title="Đăng xuất tài khoản">
                <app-clinic-icon name="logout" [size]="15"></app-clinic-icon>
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
        border: 1px solid #ECC880;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ECC880;
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
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #7A571B;
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


      .patient-profile-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-left: 12px;
        border-left: 1.5px solid rgba(228, 222, 210, 0.8);
        flex-shrink: 0;

        .patient-profile-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
          background: #FFFFFF;
          border: 1px solid rgba(184, 149, 90, 0.4);
          border-radius: 999px;
          padding: 4px 12px 4px 5px;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 4px rgba(184, 149, 90, 0.08);

          &:hover {
            background-color: #FAF8F5;
            border-color: #B8955A;
            box-shadow: 0 3px 12px rgba(184, 149, 90, 0.16);
            transform: translateY(-1px);

            .patient-user-name {
              color: #0E4A55;
            }

            .profile-arrow-icon {
              transform: translateX(2px);
              color: #0E4A55;
            }
          }
        }

        .patient-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0E4A55 0%, #1A6472 100%);
          color: #ECC880;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(14, 74, 85, 0.2);
        }

        .patient-name-block {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          white-space: nowrap;
        }

        .patient-user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1C2733;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .patient-vip-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.68rem;
          color: #8C6F34;
          font-weight: 600;
          white-space: nowrap;
        }

        .profile-arrow-icon {
          color: #B8955A;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .patient-logout-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1px solid rgba(228, 222, 210, 0.9);
          color: #718096;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            color: #9B3D45;
            background: #FFF5F5;
            border-color: rgba(155, 61, 69, 0.3);
            transform: scale(1.05);
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

  patientMonogram = computed(() => {
    const user = this.currentUser();
    if (!user || !user.fullName) return 'BN';
    const name = user.fullName.trim();
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  });

  switchRole(role: UserRole): void {
    this.authService.switchRole(role);
  }

  logout(): void {
    this.authService.logout();
  }
}
