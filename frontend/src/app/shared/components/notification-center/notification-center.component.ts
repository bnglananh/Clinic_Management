import {
  Component,
  inject,
  ElementRef,
  HostListener,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification, NotificationType } from '../../../core/models/notification.model';
import { ClinicIconComponent, ClinicIconName } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, ClinicIconComponent],
  template: `
    <div class="notification-widget-container">
      <!-- Trigger Bell Button -->
      <button
        type="button"
        class="bell-trigger-btn"
        [class.active]="isPanelOpen()"
        (click)="toggleOpen($event)"
        title="Thông báo hệ thống"
      >
        <app-clinic-icon name="bell" [size]="19" [color]="isPanelOpen() ? '#0E4A55' : '#5B6672'"></app-clinic-icon>

        @if (unreadCount() > 0) {
          <span class="notification-badge-counter animate-pop-in">
            {{ unreadCount() > 9 ? '9+' : unreadCount() }}
          </span>
          <span class="pulse-ring"></span>
        }
      </button>

      <!-- Dropdown Popup Panel -->
      @if (isPanelOpen()) {
        <div class="notification-dropdown-panel animate-fade-in-up" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="notif-header">
            <div class="header-left">
              <span class="header-title font-serif">Thông Báo Hệ Thống</span>
              @if (unreadCount() > 0) {
                <span class="unread-pill">{{ unreadCount() }} chưa đọc</span>
              }
            </div>

            <div class="header-actions">
              @if (unreadCount() > 0) {
                <button
                  type="button"
                  class="btn-mark-all"
                  (click)="markAllAsRead()"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <app-clinic-icon name="check" [size]="13"></app-clinic-icon>
                  <span>Đã đọc tất cả</span>
                </button>
              }
              <button
                type="button"
                class="btn-close-panel"
                (click)="close()"
                title="Đóng thông báo"
              >
                <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
              </button>
            </div>
          </div>

          <!-- Filter Navigation Tabs -->
          <div class="filter-tabs-bar">
            <button
              type="button"
              class="filter-tab"
              [class.active]="activeFilter() === 'ALL'"
              (click)="setFilter('ALL')"
            >
              Tất cả ({{ totalCount() }})
            </button>
            <button
              type="button"
              class="filter-tab"
              [class.active]="activeFilter() === 'UNREAD'"
              (click)="setFilter('UNREAD')"
            >
              Chưa đọc ({{ unreadCount() }})
            </button>
            <button
              type="button"
              class="filter-tab"
              [class.active]="activeFilter() === 'APPOINTMENT'"
              (click)="setFilter('APPOINTMENT')"
            >
              Lịch hẹn
            </button>
            <button
              type="button"
              class="filter-tab"
              [class.active]="activeFilter() === 'MEDICAL_RECORD'"
              (click)="setFilter('MEDICAL_RECORD')"
            >
              Kết quả EMR
            </button>
            <button
              type="button"
              class="filter-tab"
              [class.active]="activeFilter() === 'BILLING'"
              (click)="setFilter('BILLING')"
            >
              Viện phí
            </button>
          </div>

          <!-- Notification Items List -->
          <div class="notif-body-list">
            @for (item of filteredList(); track item.id) {
              <div
                class="notif-card"
                [class.unread]="!item.isRead"
                (click)="onNotificationClick(item)"
              >
                <!-- Type Icon -->
                <div class="type-icon-box" [ngClass]="getTypeIconClass(item.type)">
                  <app-clinic-icon [name]="getTypeIconName(item.type)" [size]="16"></app-clinic-icon>
                </div>

                <!-- Text Info -->
                <div class="notif-content-box">
                  <div class="top-row">
                    <h5 class="notif-title">{{ item.title }}</h5>
                    @if (!item.isRead) {
                      <span class="unread-dot" title="Chưa đọc"></span>
                    }
                  </div>
                  <p class="notif-desc">{{ item.content }}</p>
                  <div class="meta-row">
                    <span class="notif-time">
                      <app-clinic-icon name="clock" [size]="11"></app-clinic-icon>
                      <span>{{ item.createdAt }}</span>
                    </span>
                    <span class="channel-tag">{{ item.channel }}</span>
                    @if (item.referenceId) {
                      <span class="ref-tag font-mono">{{ item.referenceId }}</span>
                    }
                  </div>
                </div>

                <!-- Quick actions on hover -->
                <div class="card-hover-actions" (click)="$event.stopPropagation()">
                  @if (!item.isRead) {
                    <button
                      type="button"
                      class="btn-quick-read"
                      (click)="markAsRead(item.id)"
                      title="Đánh dấu đã đọc"
                    >
                      <app-clinic-icon name="check" [size]="12"></app-clinic-icon>
                    </button>
                  }
                  <button
                    type="button"
                    class="btn-quick-del"
                    (click)="deleteNotification(item.id)"
                    title="Xóa thông báo"
                  >
                    <app-clinic-icon name="close" [size]="12"></app-clinic-icon>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-notif-box">
                <div class="empty-icon-circle">
                  <app-clinic-icon name="bell" [size]="28" color="#8C96A2"></app-clinic-icon>
                </div>
                <h4 class="empty-title">Không có thông báo nào</h4>
                <p class="empty-sub">
                  Bạn đã xem hết toàn bộ các cập nhật và thông báo y tế mới nhất.
                </p>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="notif-footer">
            <span class="sync-live-label">
              <span class="live-dot pulse-green"></span>
              Đồng bộ dữ liệu thời gian thực
            </span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .notification-widget-container {
        position: relative;
        display: inline-block;
      }

      /* Bell Button Trigger */
      .bell-trigger-btn {
        position: relative;
        background: transparent;
        border: none;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        color: #5B6672;

        &:hover,
        &.active {
          background: rgba(14, 74, 85, 0.08);
          color: #0E4A55;
          transform: translateY(-1px);
        }
      }

      .notification-badge-counter {
        position: absolute;
        top: 4px;
        right: 4px;
        background: linear-gradient(135deg, #B71C1C 0%, #D32F2F 100%);
        color: #FFFFFF;
        font-size: 0.65rem;
        font-weight: 700;
        height: 18px;
        min-width: 18px;
        padding: 0 4px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(183, 28, 28, 0.4);
        border: 1.5px solid #FFFFFF;
        z-index: 2;
        line-height: 1;
      }

      .pulse-ring {
        position: absolute;
        top: 3px;
        right: 3px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(211, 47, 47, 0.4);
        animation: pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        z-index: 1;
      }

      @keyframes pulseRing {
        0% {
          transform: scale(0.8);
          opacity: 0.8;
        }
        100% {
          transform: scale(1.6);
          opacity: 0;
        }
      }

      /* Dropdown Panel */
      .notification-dropdown-panel {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 420px;
        max-width: 92vw;
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 16px;
        box-shadow: 0 16px 40px rgba(28, 39, 51, 0.16), 0 4px 12px rgba(0, 0, 0, 0.06);
        z-index: 1050;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: panelFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes panelFadeIn {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Header */
      .notif-header {
        padding: 16px 18px;
        background: #FAF8F5;
        border-bottom: 1px solid #E4DED2;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .header-title {
            font-size: 1.05rem;
            color: #0E4A55;
            margin: 0;
            font-weight: 700;
          }

          .unread-pill {
            font-size: 0.72rem;
            font-weight: 700;
            background: rgba(183, 28, 28, 0.1);
            color: #B71C1C;
            border: 1px solid rgba(183, 28, 28, 0.25);
            padding: 2px 8px;
            border-radius: 12px;
          }
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;

          .btn-mark-all {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #FFFFFF;
            border: 1px solid #D5CDBD;
            color: #0E4A55;
            font-size: 0.76rem;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
              background: #0E4A55;
              color: #FFFFFF;
              border-color: #0E4A55;
            }
          }

          .btn-close-panel {
            background: transparent;
            border: none;
            color: #8C96A2;
            width: 26px;
            height: 26px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;

            &:hover {
              background: rgba(0, 0, 0, 0.06);
              color: #1C2733;
            }
          }
        }
      }

      /* Filter Bar */
      .filter-tabs-bar {
        display: flex;
        background: #FFFFFF;
        border-bottom: 1px solid #F0EAE1;
        padding: 6px 14px;
        gap: 6px;
        overflow-x: auto;

        .filter-tab {
          background: transparent;
          border: 1px solid transparent;
          color: #5B6672;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;

          &:hover {
            background: #FAF8F5;
            color: #0E4A55;
          }

          &.active {
            background: rgba(14, 74, 85, 0.1);
            color: #0E4A55;
            border-color: rgba(14, 74, 85, 0.3);
          }
        }
      }

      /* List */
      .notif-body-list {
        max-height: 380px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .notif-card {
        position: relative;
        padding: 14px 18px;
        display: flex;
        gap: 12px;
        border-bottom: 1px solid #F3EFEA;
        cursor: pointer;
        transition: background 0.15s ease;

        &:hover {
          background: #FAF8F5;

          .card-hover-actions {
            opacity: 1;
            pointer-events: auto;
          }
        }

        &.unread {
          background: rgba(14, 74, 85, 0.03);

          .notif-title {
            color: #0E4A55;
            font-weight: 700;
          }
        }

        .type-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.type-appointment {
            background: rgba(14, 74, 85, 0.12);
            color: #0E4A55;
          }

          &.type-medical {
            background: rgba(43, 90, 160, 0.12);
            color: #2B5AA0;
          }

          &.type-billing {
            background: rgba(184, 149, 90, 0.18);
            color: #926E2F;
          }

          &.type-queue {
            background: rgba(46, 125, 50, 0.12);
            color: #2E7D32;
          }

          &.type-system {
            background: rgba(108, 117, 125, 0.14);
            color: #495057;
          }
        }

        .notif-content-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;

          .top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;

            .notif-title {
              margin: 0;
              font-size: 0.86rem;
              font-weight: 600;
              color: #1C2733;
              line-height: 1.3;
            }

            .unread-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #0E4A55;
              flex-shrink: 0;
            }
          }

          .notif-desc {
            margin: 0;
            font-size: 0.78rem;
            color: #5B6672;
            line-height: 1.45;
          }

          .meta-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 4px;
            font-size: 0.72rem;

            .notif-time {
              color: #8C96A2;
              display: inline-flex;
              align-items: center;
              gap: 4px;
            }

            .channel-tag {
              background: #F0EAE1;
              color: #5B6672;
              padding: 1px 6px;
              border-radius: 4px;
              font-size: 0.68rem;
              font-weight: 600;
            }

            .ref-tag {
              color: #0E4A55;
              font-size: 0.7rem;
              font-weight: 600;
            }
          }
        }

        .card-hover-actions {
          position: absolute;
          top: 10px;
          right: 12px;
          display: flex;
          gap: 4px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;

          button {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #D5CDBD;
            background: #FFFFFF;
            cursor: pointer;
            color: #5B6672;

            &:hover {
              background: #FAF8F5;
              color: #0E4A55;
            }

            &.btn-quick-del:hover {
              color: #B71C1C;
              border-color: #B71C1C;
            }
          }
        }
      }

      /* Empty State */
      .empty-notif-box {
        padding: 40px 20px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;

        .empty-icon-circle {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #F6F3EC;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .empty-title {
          font-size: 0.95rem;
          color: #1C2733;
          margin: 0 0 6px 0;
          font-weight: 600;
        }

        .empty-sub {
          font-size: 0.8rem;
          color: #8C96A2;
          max-width: 260px;
          margin: 0;
          line-height: 1.4;
        }
      }

      /* Footer */
      .notif-footer {
        padding: 10px 16px;
        background: #FAF8F5;
        border-top: 1px solid #E4DED2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.72rem;
        color: #5B6672;

        .sync-live-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2E7D32;

          &.pulse-green {
            box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7);
            animation: pulseGreen 1.8s infinite;
          }
        }

        @keyframes pulseGreen {
          0% {
            box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.6);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(46, 125, 50, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(46, 125, 50, 0);
          }
        }
      }
    `,
  ],
})
export class NotificationCenterComponent {
  private notifService = inject(NotificationService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  readonly isPanelOpen = this.notifService.isPanelOpen;
  readonly unreadCount = this.notifService.unreadCount;
  readonly activeFilter = this.notifService.activeFilter;
  readonly filteredList = this.notifService.filteredNotifications;
  readonly totalCount = computed(() => this.notifService.notifications().length);

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    this.notifService.togglePanel();
  }

  close(): void {
    this.notifService.closePanel();
  }

  setFilter(filter: 'ALL' | 'UNREAD' | NotificationType): void {
    this.notifService.setFilter(filter);
  }

  markAsRead(id: string): void {
    this.notifService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead();
  }

  deleteNotification(id: string): void {
    this.notifService.deleteNotification(id);
  }

  onNotificationClick(notif: AppNotification): void {
    if (!notif.isRead) {
      this.notifService.markAsRead(notif.id);
    }

    // Smart routing based on notification type
    this.close();
    switch (notif.type) {
      case 'APPOINTMENT':
        if (this.router.url.startsWith('/patient')) {
          this.router.navigate(['/patient/appointments']);
        } else {
          this.router.navigate(['/reception/checkin']);
        }
        break;

      case 'BILLING':
        if (this.router.url.startsWith('/patient')) {
          this.router.navigate(['/patient/billing']);
        } else {
          this.router.navigate(['/reception/billing']);
        }
        break;

      case 'MEDICAL_RECORD':
        if (this.router.url.startsWith('/patient')) {
          this.router.navigate(['/patient/history']);
        } else {
          this.router.navigate(['/doctor/history']);
        }
        break;

      case 'QUEUE':
        if (this.router.url.startsWith('/patient')) {
          this.router.navigate(['/patient/appointments']);
        } else {
          this.router.navigate(['/doctor/workspace']);
        }
        break;

      default:
        break;
    }
  }

  getTypeIconName(type: NotificationType): ClinicIconName {
    switch (type) {
      case 'APPOINTMENT':
        return 'calendar';
      case 'MEDICAL_RECORD':
        return 'file-text';
      case 'BILLING':
        return 'receipt';
      case 'QUEUE':
        return 'ticket';
      case 'SYSTEM':
      default:
        return 'bell';
    }
  }

  getTypeIconClass(type: NotificationType): string {
    switch (type) {
      case 'APPOINTMENT':
        return 'type-appointment';
      case 'MEDICAL_RECORD':
        return 'type-medical';
      case 'BILLING':
        return 'type-billing';
      case 'QUEUE':
        return 'type-queue';
      case 'SYSTEM':
      default:
        return 'type-system';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.isPanelOpen() &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.close();
    }
  }
}
