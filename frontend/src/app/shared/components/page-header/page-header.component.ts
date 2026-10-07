import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header-container">
      <div class="page-header-main">
        @if (badgeText) {
          <span class="header-badge">{{ badgeText }}</span>
        }
        <h1 class="clinic-title with-gold-accent">{{ title }}</h1>
        @if (subtitle) {
          <p class="header-subtitle">{{ subtitle }}</p>
        }
      </div>

      <div class="page-header-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .page-header-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding-bottom: 20px;
        margin-bottom: 24px;
        border-bottom: 1px solid rgba(228, 222, 210, 0.7);
        flex-wrap: wrap;
        gap: 16px;
      }

      .page-header-main {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .header-badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #B8955A;
        background: rgba(184, 149, 90, 0.12);
        padding: 2px 10px;
        border-radius: 999px;
        margin-bottom: 6px;
      }

      .header-subtitle {
        color: #5B6672;
        font-size: 0.9375rem;
        margin: 6px 0 0 0;
        max-width: 650px;
      }

      .page-header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle?: string;
  @Input() badgeText?: string;
}
