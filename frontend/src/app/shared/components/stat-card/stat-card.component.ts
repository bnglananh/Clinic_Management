import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClinicIconComponent, ClinicIconName } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, ClinicIconComponent],
  template: `
    <div class="clinic-card stat-card" [class.highlighted]="isHighlight">
      <div class="stat-top">
        <span class="stat-title">{{ title }}</span>
        @if (iconName) {
          <div class="stat-icon-wrapper" [style.background-color]="iconBg || 'rgba(14, 74, 85, 0.08)'">
            <app-clinic-icon
              [name]="getValidIcon(iconName)"
              [size]="18"
              [strokeWidth]="1.8"
              [color]="iconColor || '#0E4A55'"
            ></app-clinic-icon>
          </div>
        }
      </div>

      <div class="stat-value-container">
        <span class="stat-value tabular-nums">{{ value }}</span>
        @if (unit) {
          <span class="stat-unit">{{ unit }}</span>
        }
      </div>

      @if (subText || trendText) {
        <div class="stat-footer">
          @if (trendText) {
            <span class="stat-trend" [class.trend-up]="trendPositive" [class.trend-down]="!trendPositive">
              {{ trendPositive ? '↑' : '↓' }} {{ trendText }}
            </span>
          }
          @if (subText) {
            <span class="stat-subtext">{{ subText }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .stat-card {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
        background: #ffffff;
      }

      .stat-card.highlighted {
        border-color: rgba(184, 149, 90, 0.4);
        background: linear-gradient(180deg, #ffffff 0%, rgba(246, 243, 236, 0.4) 100%);
      }

      .stat-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .stat-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #5B6672;
      }

      .stat-icon-wrapper {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-value-container {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #1C2733;
        line-height: 1.1;
      }

      .stat-unit {
        font-size: 0.875rem;
        font-weight: 500;
        color: #8C96A2;
      }

      .stat-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8125rem;
        padding-top: 4px;
        border-top: 1px dashed rgba(228, 222, 210, 0.6);
      }

      .stat-trend {
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 2px;
      }

      .stat-trend.trend-up {
        color: #5E8B7E;
      }

      .stat-trend.trend-down {
        color: #9B3D45;
      }

      .stat-subtext {
        color: #8C96A2;
      }
    `,
  ],
})
export class StatCardComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) value: string | number = '';
  @Input() unit?: string;
  @Input() subText?: string;
  @Input() trendText?: string;
  @Input() trendPositive = true;
  @Input() iconName?: string;
  @Input() iconBg?: string;
  @Input() iconColor?: string;
  @Input() isHighlight = false;

  getValidIcon(icon?: string): ClinicIconName {
    if (!icon) return 'activity';
    switch (icon) {
      case '💰':
      case 'wallet':
        return 'wallet';
      case '👥':
      case 'users':
        return 'users';
      case '⚠️':
      case 'alert-triangle':
        return 'alert-triangle';
      case '🩺':
      case 'stethoscope':
        return 'stethoscope';
      case 'clock':
      case '⏱':
        return 'clock';
      case 'calendar':
      case '📅':
        return 'calendar';
      case 'pill':
      case '💊':
        return 'pill';
      case 'card':
      case 'credit-card':
      case '💳':
        return 'credit-card';
      case 'file-text':
      case '📋':
      case '📝':
        return 'file-text';
      default:
        return 'activity';
    }
  }
}
