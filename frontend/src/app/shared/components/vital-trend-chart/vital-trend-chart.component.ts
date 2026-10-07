import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VitalHistoryPoint } from '../../../core/models/medical-record.model';

@Component({
  selector: 'app-vital-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trend-chart-wrapper">
      <div class="chart-header">
        <div class="chart-title-block">
          <span class="chart-title font-serif">Diễn Tiến Huyết Áp & Nhịp Tim</span>
          <span class="db-source-tag">Cassandra Time-Series EMR</span>
        </div>
        <div class="legend-row">
          <span class="legend-item"><span class="dot systolic-dot"></span> HA Tâm thu</span>
          <span class="legend-item"><span class="dot diastolic-dot"></span> HA Tâm trương</span>
          <span class="legend-item"><span class="dot hr-dot"></span> Nhịp tim</span>
        </div>
      </div>

      @if (data && data.length > 1) {
        <div class="svg-container">
          <svg viewBox="0 0 540 180" class="chart-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#9B3D45" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#9B3D45" stop-opacity="0.0" />
              </linearGradient>
              <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0E4A55" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#0E4A55" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Horizontal Grid lines -->
            <line x1="30" y1="30" x2="520" y2="30" stroke="#F0EAE1" stroke-dasharray="3,3" />
            <line x1="30" y1="75" x2="520" y2="75" stroke="#F0EAE1" stroke-dasharray="3,3" />
            <line x1="30" y1="120" x2="520" y2="120" stroke="#F0EAE1" stroke-dasharray="3,3" />
            <line x1="30" y1="155" x2="520" y2="155" stroke="#E4DED2" />

            <!-- Y Axis Labels -->
            <text x="5" y="34" class="axis-text">160</text>
            <text x="5" y="79" class="axis-text">120</text>
            <text x="5" y="124" class="axis-text">80</text>

            <!-- Filled Areas -->
            <path [attr.d]="systolicAreaPath()" fill="url(#systolicGradient)" />
            <path [attr.d]="diastolicAreaPath()" fill="url(#diastolicGradient)" />

            <!-- Trend Lines -->
            <path [attr.d]="systolicLinePath()" fill="none" stroke="#9B3D45" stroke-width="2.5" />
            <path [attr.d]="diastolicLinePath()" fill="none" stroke="#0E4A55" stroke-width="2" />
            <path [attr.d]="hrLinePath()" fill="none" stroke="#B8955A" stroke-width="1.8" stroke-dasharray="4,2" />

            <!-- Data Points -->
            @for (p of chartPoints(); track $index) {
              <!-- Systolic circle -->
              <circle
                [attr.cx]="p.x"
                [attr.cy]="p.ySys"
                r="4.5"
                class="pt-circle sys-circle"
                (mouseenter)="hoveredPoint.set(p)"
                (mouseleave)="hoveredPoint.set(null)"
              />
              <!-- Diastolic circle -->
              <circle
                [attr.cx]="p.x"
                [attr.cy]="p.yDia"
                r="4"
                class="pt-circle dia-circle"
                (mouseenter)="hoveredPoint.set(p)"
                (mouseleave)="hoveredPoint.set(null)"
              />
              <!-- HR circle -->
              <circle
                [attr.cx]="p.x"
                [attr.cy]="p.yHr"
                r="3.5"
                class="pt-circle hr-circle"
                (mouseenter)="hoveredPoint.set(p)"
                (mouseleave)="hoveredPoint.set(null)"
              />

              <!-- X Axis Date Label -->
              <text [attr.x]="p.x" y="172" text-anchor="middle" class="axis-date-text">
                {{ p.raw.date }}
              </text>
            }
          </svg>

          <!-- Interactive Tooltip Pill -->
          @if (hoveredPoint(); as hp) {
            <div
              class="trend-tooltip"
              [style.left.px]="hp.pixelLeft"
              [style.top.px]="hp.pixelTop"
            >
              <div class="tt-date">{{ hp.raw.date }}</div>
              <div class="tt-metric"><strong style="color: #9B3D45;">Huyết áp:</strong> {{ hp.raw.systolic }}/{{ hp.raw.diastolic }} mmHg</div>
              <div class="tt-metric"><strong style="color: #B8955A;">Mạch:</strong> {{ hp.raw.heartRate }} bpm</div>
              <div class="tt-metric"><strong>BMI:</strong> {{ hp.raw.bmi }} ({{ hp.raw.weight }} kg)</div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-chart">
          <span>Chưa có đủ dữ liệu lịch sử đo sinh hiệu để vẽ biểu đồ diễn tiến.</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .trend-chart-wrapper {
        background: #FFFFFF;
        border-radius: 12px;
        padding: 16px 20px;
        border: 1px solid #E4DED2;
        margin-top: 14px;
        position: relative;
      }

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chart-title-block {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .chart-title {
        font-size: 1.05rem;
        font-weight: 600;
        color: #1C2733;
      }

      .db-source-tag {
        font-size: 0.7rem;
        background: rgba(14, 74, 85, 0.08);
        color: #0E4A55;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }

      .legend-row {
        display: flex;
        gap: 12px;
        font-size: 0.78rem;
        color: #5B6672;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .systolic-dot {
          background: #9B3D45;
        }

        .diastolic-dot {
          background: #0E4A55;
        }

        .hr-dot {
          background: #B8955A;
        }
      }

      .svg-container {
        position: relative;
        width: 100%;
        height: 180px;
      }

      .chart-svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      .axis-text {
        font-size: 10px;
        fill: #8C96A2;
        font-family: inherit;
      }

      .axis-date-text {
        font-size: 10px;
        fill: #5B6672;
        font-weight: 500;
      }

      .pt-circle {
        cursor: pointer;
        transition: transform 0.15s ease, r 0.15s ease;

        &:hover {
          r: 6.5;
        }

        &.sys-circle {
          fill: #9B3D45;
          stroke: #FFFFFF;
          stroke-width: 1.5;
        }

        &.dia-circle {
          fill: #0E4A55;
          stroke: #FFFFFF;
          stroke-width: 1.5;
        }

        &.hr-circle {
          fill: #B8955A;
          stroke: #FFFFFF;
          stroke-width: 1;
        }
      }

      .trend-tooltip {
        position: absolute;
        background: #1C2733;
        color: #FFFFFF;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.78rem;
        pointer-events: none;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        z-index: 10;
        white-space: nowrap;
        transform: translate(-50%, -115%);

        .tt-date {
          font-weight: 700;
          color: #B8955A;
          margin-bottom: 3px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          padding-bottom: 2px;
        }

        .tt-metric {
          line-height: 1.4;
        }
      }

      .empty-chart {
        padding: 30px;
        text-align: center;
        color: #8C96A2;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class VitalTrendChartComponent {
  @Input() data: VitalHistoryPoint[] = [];

  hoveredPoint = signal<any | null>(null);

  // SVG dimensions
  private readonly width = 540;
  private readonly height = 180;
  private readonly paddingLeft = 45;
  private readonly paddingRight = 30;
  private readonly paddingTop = 25;
  private readonly paddingBottom = 35;

  // Min and max scales
  private readonly minY = 50;
  private readonly maxY = 180;

  private scaleY(val: number): number {
    const range = this.maxY - this.minY;
    const plotHeight = this.height - this.paddingTop - this.paddingBottom;
    const norm = (val - this.minY) / range;
    return this.height - this.paddingBottom - norm * plotHeight;
  }

  chartPoints = computed(() => {
    if (!this.data || this.data.length === 0) return [];
    const n = this.data.length;
    const plotWidth = this.width - this.paddingLeft - this.paddingRight;
    const step = n > 1 ? plotWidth / (n - 1) : plotWidth;

    return this.data.map((item, idx) => {
      const x = this.paddingLeft + idx * step;
      const ySys = this.scaleY(item.systolic);
      const yDia = this.scaleY(item.diastolic);
      const yHr = this.scaleY(item.heartRate);

      // Estimated pixel position for tooltips
      const pixelLeft = (x / this.width) * 100 + '%';
      const pixelTop = ySys;

      return {
        x,
        ySys,
        yDia,
        yHr,
        pixelLeft: x,
        pixelTop: ySys,
        raw: item,
      };
    });
  });

  systolicLinePath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.ySys}`).join(' ');
  });

  systolicAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    const bottomY = this.height - this.paddingBottom;
    const line = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.ySys}`).join(' ');
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  });

  diastolicLinePath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yDia}`).join(' ');
  });

  diastolicAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    const bottomY = this.height - this.paddingBottom;
    const line = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yDia}`).join(' ');
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  });

  hrLinePath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yHr}`).join(' ');
  });
}
