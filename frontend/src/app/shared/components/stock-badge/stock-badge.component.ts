import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stock-badge-container" [class]="statusClass">
      <div class="badge-top">
        <span class="stock-qty-text font-bold">{{ stockQuantity }}</span>
        <span class="stock-unit-text">{{ unit }}</span>
        <span class="status-pill">{{ statusText }}</span>
      </div>
      <div class="stock-bar-track">
        <div class="stock-bar-fill" [style.width.%]="progressPercent"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .stock-badge-container {
        display: inline-flex;
        flex-direction: column;
        gap: 4px;
        padding: 6px 10px;
        border-radius: 8px;
        min-width: 110px;
        border: 1px solid transparent;

        &.critical {
          background: rgba(155, 61, 69, 0.1);
          border-color: rgba(155, 61, 69, 0.35);

          .stock-qty-text {
            color: #9B3D45;
          }

          .status-pill {
            background: #9B3D45;
            color: #FFFFFF;
          }

          .stock-bar-fill {
            background: #9B3D45;
          }
        }

        &.low {
          background: rgba(184, 149, 90, 0.12);
          border-color: rgba(184, 149, 90, 0.35);

          .stock-qty-text {
            color: #8C6D34;
          }

          .status-pill {
            background: #B8955A;
            color: #FFFFFF;
          }

          .stock-bar-fill {
            background: #B8955A;
          }
        }

        &.good {
          background: rgba(94, 139, 126, 0.12);
          border-color: rgba(94, 139, 126, 0.3);

          .stock-qty-text {
            color: #2F5A4F;
          }

          .status-pill {
            background: #5E8B7E;
            color: #FFFFFF;
          }

          .stock-bar-fill {
            background: #5E8B7E;
          }
        }
      }

      .badge-top {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }

      .stock-qty-text {
        font-size: 1.15rem;
        line-height: 1;
      }

      .stock-unit-text {
        font-size: 0.72rem;
        color: #5B6672;
        flex: 1;
      }

      .status-pill {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
        letter-spacing: 0.04em;
      }

      .stock-bar-track {
        width: 100%;
        height: 4px;
        background: rgba(0, 0, 0, 0.08);
        border-radius: 999px;
        overflow: hidden;
      }

      .stock-bar-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
      }
    `,
  ],
})
export class StockBadgeComponent {
  @Input() stockQuantity = 0;
  @Input() unit = 'hộp';
  @Input() maxThreshold = 100;

  get statusClass(): 'critical' | 'low' | 'good' {
    if (this.stockQuantity <= 10) return 'critical';
    if (this.stockQuantity <= 30) return 'low';
    return 'good';
  }

  get statusText(): string {
    if (this.stockQuantity <= 10) return 'Nguy cấp ≤10';
    if (this.stockQuantity <= 30) return 'Sắp hết';
    return 'An toàn';
  }

  get progressPercent(): number {
    const p = (this.stockQuantity / this.maxThreshold) * 100;
    return Math.min(100, Math.max(8, p));
  }
}
