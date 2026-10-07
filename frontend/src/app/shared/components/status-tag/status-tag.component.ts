import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SupportedStatus =
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAID'
  | 'UNPAID'
  | 'CANCELLED'
  | 'NORMAL'
  | 'PRIORITY'
  | 'EMERGENCY'
  | 'LOCKED';

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor?: string;
  hasPulse?: boolean;
}

const STATUS_MAP: Record<SupportedStatus, StatusConfig> = {
  WAITING: {
    label: 'Chờ khám',
    bgColor: 'rgba(184, 149, 90, 0.12)',
    textColor: '#8C6C32',
    borderColor: 'rgba(184, 149, 90, 0.35)',
    dotColor: '#B8955A',
  },
  IN_PROGRESS: {
    label: 'Đang khám',
    bgColor: 'rgba(14, 74, 85, 0.12)',
    textColor: '#0E4A55',
    borderColor: 'rgba(14, 74, 85, 0.35)',
    dotColor: '#0E4A55',
    hasPulse: true,
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    bgColor: 'rgba(94, 139, 126, 0.14)',
    textColor: '#3A6357',
    borderColor: 'rgba(94, 139, 126, 0.4)',
    dotColor: '#5E8B7E',
  },
  PAID: {
    label: 'Đã thanh toán',
    bgColor: 'rgba(94, 139, 126, 0.14)',
    textColor: '#3A6357',
    borderColor: 'rgba(94, 139, 126, 0.4)',
    dotColor: '#5E8B7E',
  },
  UNPAID: {
    label: 'Chưa thanh toán',
    bgColor: 'rgba(184, 149, 90, 0.12)',
    textColor: '#8C6C32',
    borderColor: 'rgba(184, 149, 90, 0.35)',
    dotColor: '#B8955A',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bgColor: 'rgba(155, 61, 69, 0.12)',
    textColor: '#9B3D45',
    borderColor: 'rgba(155, 61, 69, 0.35)',
    dotColor: '#9B3D45',
  },
  NORMAL: {
    label: 'Thường',
    bgColor: 'rgba(28, 39, 51, 0.06)',
    textColor: '#5B6672',
    borderColor: 'rgba(28, 39, 51, 0.15)',
    dotColor: '#5B6672',
  },
  PRIORITY: {
    label: 'Ưu tiên VIP',
    bgColor: 'rgba(184, 149, 90, 0.18)',
    textColor: '#8C6C32',
    borderColor: '#B8955A',
    dotColor: '#B8955A',
  },
  EMERGENCY: {
    label: 'Cấp cứu khẩn',
    bgColor: 'rgba(155, 61, 69, 0.18)',
    textColor: '#9B3D45',
    borderColor: '#9B3D45',
    dotColor: '#9B3D45',
    hasPulse: true,
  },
  LOCKED: {
    label: 'Đã khóa',
    bgColor: 'rgba(28, 39, 51, 0.08)',
    textColor: '#1C2733',
    borderColor: 'rgba(28, 39, 51, 0.25)',
    dotColor: '#1C2733',
  },
};

@Component({
  selector: 'app-status-tag',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="clinic-status-badge"
      [style.background-color]="config.bgColor"
      [style.color]="config.textColor"
      [style.border-color]="config.borderColor"
    >
      <span
        class="status-dot"
        [class.dot-pulse]="config.hasPulse"
        [style.background-color]="config.dotColor"
      ></span>
      <span class="status-text">{{ customLabel || config.label }}</span>
    </span>
  `,
  styles: [
    `
      .clinic-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 14px;
        border-radius: 999px;
        font-size: 0.8125rem;
        font-weight: 600;
        border: 1px solid;
        line-height: 1.4;
        white-space: nowrap;
        user-select: none;
        transition: all 0.2s ease;
      }

      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        display: inline-block;
        flex-shrink: 0;
      }

      .dot-pulse {
        box-shadow: 0 0 0 0 rgba(14, 74, 85, 0.5);
        animation: pulse 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
      }

      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(14, 74, 85, 0.6);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(14, 74, 85, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(14, 74, 85, 0);
        }
      }
    `,
  ],
})
export class StatusTagComponent {
  @Input({ required: true }) status: SupportedStatus = 'WAITING';
  @Input() customLabel?: string;

  get config(): StatusConfig {
    return (
      STATUS_MAP[this.status] || {
        label: this.status,
        bgColor: 'rgba(28, 39, 51, 0.06)',
        textColor: '#1C2733',
        borderColor: 'rgba(28, 39, 51, 0.15)',
      }
    );
  }
}
