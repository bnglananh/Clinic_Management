import { Component, computed, signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { ClinicIconComponent, ClinicIconName } from '../../shared/components/clinic-icon/clinic-icon.component';

interface MenuItem {
  title: string;
  path: string;
  icon: ClinicIconName;
  badge?: string;
}

@Component({
  selector: 'app-internal-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ClinicIconComponent],
  template: `
    <div class="internal-container" [class.sidebar-collapsed]="isCollapsed()">
      <!-- Sidebar -->
      <aside class="clinic-sidebar">
        <!-- Logo Header -->
        <div class="sidebar-brand">
          <div class="brand-symbol">
            <app-clinic-icon name="medical-cross" [size]="20" color="#B8955A"></app-clinic-icon>
          </div>
          @if (!isCollapsed()) {
            <div class="brand-text">
              <span class="brand-name font-serif">SMART CLINIC</span>
              <span class="brand-sub">HỆ THỐNG EMR Y TẾ</span>
            </div>
          }
        </div>

        <!-- Role Badge in Sidebar -->
        @if (!isCollapsed()) {
          <div class="sidebar-role-pill">
            <span class="role-dot"></span>
            <span class="role-name">{{ roleDisplayName() }}</span>
          </div>
        }

        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          @for (item of currentMenuItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
              class="nav-item"
              [title]="isCollapsed() ? item.title : ''"
            >
              <span class="nav-icon">
                <app-clinic-icon [name]="item.icon" [size]="18"></app-clinic-icon>
              </span>
              @if (!isCollapsed()) {
                <span class="nav-label">{{ item.title }}</span>
                @if (item.badge) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              }
            </a>
          }
        </nav>

        <!-- Sidebar Footer Collapse Toggle -->
        <div class="sidebar-footer">
          <button (click)="toggleCollapse()" class="collapse-btn" title="Thu gọn / Mở rộng">
            <span class="collapse-icon">
              <app-clinic-icon
                name="chevron-right"
                [size]="14"
                [style.transform]="isCollapsed() ? 'none' : 'rotate(180deg)'"
              ></app-clinic-icon>
            </span>
            @if (!isCollapsed()) {
              <span>Thu gọn menu</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Body -->
      <div class="main-wrapper">
        <!-- Glassmorphism Top Header -->
        <header class="clinic-header glass-header">
          <div class="header-left">
            <div class="quick-search">
              <app-clinic-icon name="search" [size]="16" color="#8C96A2"></app-clinic-icon>
              <input
                type="text"
                placeholder="Tìm hồ sơ bệnh nhân, SĐT, CCCD... (Ctrl + K)"
                class="search-input"
              />
              <span class="search-hotkey">⌘K</span>
            </div>
          </div>

          <div class="header-right">

            <!-- Notifications -->
            <button class="icon-action-btn" title="Thông báo hệ thống">
              <app-clinic-icon name="bell" [size]="18" color="#5B6672"></app-clinic-icon>
              <span class="badge-dot"></span>
            </button>

            <!-- User Profile Dropdown / Card -->
            <div class="user-profile-widget">
              <img
                [src]="currentUser()?.avatarUrl"
                [alt]="currentUser()?.fullName"
                class="user-avatar"
              />
              <div class="user-info-text">
                <span class="user-name">{{ currentUser()?.fullName }}</span>
                <span class="user-department">{{ currentUser()?.title || currentUser()?.department }}</span>
              </div>
              <button (click)="logout()" class="logout-btn" title="Đăng xuất">
                <app-clinic-icon name="logout" [size]="16"></app-clinic-icon>
              </button>
            </div>
          </div>
        </header>

        <!-- Page Content Canvas -->
        <main class="content-canvas">
          <div class="canvas-inner animate-fade-in-up">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .internal-container {
        display: flex;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background-color: #F6F3EC;
      }

      // Sidebar
      .clinic-sidebar {
        width: 260px;
        background-color: #1C2733;
        color: #FFFFFF;
        display: flex;
        flex-direction: column;
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 20;
        flex-shrink: 0;
        border-right: 1px solid rgba(255, 255, 255, 0.06);
      }

      .sidebar-collapsed .clinic-sidebar {
        width: 72px;
      }

      .sidebar-brand {
        height: 68px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .brand-symbol {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #0E4A55 0%, #15333C 100%);
        border: 1px solid #B8955A;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #B8955A;
        font-weight: 700;
        font-size: 1.125rem;
        flex-shrink: 0;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
      }

      .brand-name {
        font-size: 1.0625rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: #FFFFFF;
      }

      .brand-sub {
        font-size: 0.6875rem;
        letter-spacing: 0.1em;
        color: #B8955A;
        font-weight: 500;
      }

      .sidebar-role-pill {
        margin: 16px 16px 8px 16px;
        padding: 8px 14px;
        background: rgba(184, 149, 90, 0.12);
        border: 1px solid rgba(184, 149, 90, 0.25);
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;

        .role-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #B8955A;
        }

        .role-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #E6CE9F;
        }
      }

      .sidebar-nav {
        flex: 1;
        padding: 12px 10px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.75);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
        position: relative;

        &:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.06);
        }

        &.active {
          color: #FFFFFF;
          background: rgba(14, 74, 85, 0.45);
          font-weight: 600;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 20%;
            bottom: 20%;
            width: 3.5px;
            background: #B8955A;
            border-radius: 0 4px 4px 0;
          }

          .nav-icon {
            color: #B8955A;
          }
        }
      }

      .nav-icon {
        font-size: 1.125rem;
        width: 22px;
        text-align: center;
        flex-shrink: 0;
      }

      .nav-label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nav-badge {
        font-size: 0.75rem;
        padding: 2px 7px;
        border-radius: 999px;
        background: #0E4A55;
        color: #FFFFFF;
        font-weight: 600;
      }

      .sidebar-footer {
        padding: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .collapse-btn {
        width: 100%;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        padding: 8px 12px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 0.8125rem;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
        }
      }

      // Main Wrapper
      .main-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }

      // Glass Header
      .clinic-header {
        height: 68px;
        padding: 0 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 10;
        flex-shrink: 0;
      }

      .quick-search {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #FFFFFF;
        border: 1px solid #E2DCD0;
        padding: 8px 16px;
        border-radius: 14px;
        width: 360px;
        box-shadow: 0 2px 6px rgba(28, 39, 51, 0.03);
        transition: all 0.2s ease;

        &:hover {
          border-color: #C8BFB0;
        }

        &:focus-within {
          border-color: #0E4A55;
          box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.1);
        }

        .search-icon {
          font-size: 0.875rem;
          color: #8C96A2;
        }

        .search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.84rem;
          width: 100%;
          color: #1C2733;

          &::placeholder {
            color: #8C96A2;
          }
        }

        .search-hotkey {
          font-size: 0.6875rem;
          padding: 2px 6px;
          background: #F6F3EC;
          border: 1px solid #E4DED2;
          border-radius: 4px;
          color: #5B6672;
          font-weight: 600;
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .icon-action-btn {
        position: relative;
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
        }

        .badge-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #9B3D45;
          border: 1.5px solid #FFFFFF;
        }
      }

      .user-profile-widget {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-left: 12px;
        border-left: 1px solid rgba(228, 222, 210, 0.7);

        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          object-fit: cover;
          border: 1.5px solid #B8955A;
        }

        .user-info-text {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1C2733;
          line-height: 1.2;
        }

        .user-department {
          font-size: 0.75rem;
          color: #5B6672;
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: #8C96A2;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;

          &:hover {
            color: #9B3D45;
            background: rgba(155, 61, 69, 0.1);
          }
        }
      }

      // Content Canvas
      .content-canvas {
        flex: 1;
        overflow-y: auto;
        padding: 28px 32px;
      }

      .canvas-inner {
        max-width: 1600px;
        margin: 0 auto;
      }
    `,
  ],
})
export class InternalLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isCollapsed = signal<boolean>(false);
  currentUser = this.authService.currentUser;
  currentRole = this.authService.currentRole;

  roleDisplayName = computed(() => {
    const role = this.currentRole();
    switch (role) {
      case 'RECEPTIONIST':
        return 'Bàn Lễ Tân & Thu Ngân';
      case 'DOCTOR':
        return 'Phòng Khám Lâm Sàng';
      case 'ADMIN':
        return 'Quản Trị Hệ Thống';
      default:
        return 'Cổng Thông Tin';
    }
  });

  currentMenuItems = computed<MenuItem[]>(() => {
    const role = this.currentRole();
    if (role === 'RECEPTIONIST') {
      return [
        { title: 'Tiếp nhận & Check-in', path: '/reception/checkin', icon: 'file-text' },
        { title: 'Quản lý hàng đợi', path: '/reception/queue', icon: 'clock', badge: '14' },
        { title: 'Hồ sơ bệnh nhân', path: '/reception/patients', icon: 'users' },
        { title: 'Hóa đơn & Thu ngân', path: '/reception/billing', icon: 'credit-card' },
      ];
    }
    if (role === 'DOCTOR') {
      return [
        { title: 'Bệnh nhân chờ khám', path: '/doctor/queue', icon: 'stethoscope', badge: '6' },
        { title: 'Workspace khám bệnh', path: '/doctor/workspace', icon: 'clipboard' },
        { title: 'Lịch sử lượt khám', path: '/doctor/history', icon: 'file-text' },
      ];
    }
    if (role === 'ADMIN') {
      return [
        { title: 'Tổng quan & Báo cáo', path: '/admin/dashboard', icon: 'activity' },
        { title: 'Tài khoản & Phân quyền', path: '/admin/users', icon: 'shield' },
        { title: 'Danh mục & Tồn kho thuốc', path: '/admin/pharmacy', icon: 'pill', badge: 'Cảnh báo' },
        { title: 'Danh mục dịch vụ y tế', path: '/admin/services', icon: 'flask' },
        { title: 'Lịch làm việc bác sĩ', path: '/admin/schedules', icon: 'calendar' },
      ];
    }
    return [];
  });

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  switchRole(role: UserRole): void {
    this.authService.switchRole(role);
  }

  logout(): void {
    this.authService.logout();
  }
}
