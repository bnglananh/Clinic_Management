import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClinicIconComponent, ClinicIconName } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ClinicIconComponent],
  template: `
    <div class="clinic-empty-container">
      <div class="empty-icon-box">
        <app-clinic-icon [name]="getCleanIcon()" [size]="28" color="#B8955A"></app-clinic-icon>
      </div>
      <h4 class="empty-title">{{ title }}</h4>
      @if (description) {
        <p class="empty-desc">{{ description }}</p>
      }
      <div class="empty-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .clinic-empty-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
      }

      .empty-icon-box {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(184, 149, 90, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }

      .empty-title {
        font-size: 1.0625rem;
        font-weight: 600;
        color: #1C2733;
        margin-bottom: 6px;
      }

      .empty-desc {
        font-size: 0.875rem;
        color: #5B6672;
        max-width: 400px;
        margin: 0 0 16px 0;
        line-height: 1.5;
      }

      .empty-actions {
        display: flex;
        gap: 12px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon: ClinicIconName | string = 'clipboard';
  @Input({ required: true }) title = 'Không có dữ liệu';
  @Input() description?: string;

  getCleanIcon(): ClinicIconName {
    if (!this.icon) return 'clipboard';
    switch (this.icon) {
      case '📋':
      case '📝':
        return 'clipboard';
      case '🩺':
        return 'stethoscope';
      case '💊':
        return 'pill';
      case '🔍':
        return 'search';
      case '👥':
        return 'users';
      case '📅':
        return 'calendar';
      case '⏱':
      case '🕒':
        return 'clock';
      case '🔒':
        return 'lock';
      case '⚠️':
        return 'alert-triangle';
      default:
        return (this.icon as ClinicIconName) || 'clipboard';
    }
  }
}
