import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicIconComponent, ClinicIconName } from '../clinic-icon/clinic-icon.component';

export type VitalType = 'bp' | 'heartRate' | 'temperature' | 'bmi' | 'spo2';

@Component({
  selector: 'app-vital-sign-card',
  standalone: true,
  imports: [CommonModule, FormsModule, ClinicIconComponent],
  template: `
    <div
      class="vital-card"
      [class.status-normal]="status === 'normal'"
      [class.status-warning]="status === 'warning'"
      [class.status-danger]="status === 'danger'"
      [class.is-editable]="isEditable"
    >
      <div class="card-header">
        <div class="title-wrap">
          <span class="vital-icon">
            <app-clinic-icon [name]="getCleanIcon()" [size]="18" color="#0E4A55"></app-clinic-icon>
          </span>
          <span class="vital-label">{{ label }}</span>
        </div>
        <span class="status-badge" [class]="'badge-' + status">
          {{ statusText }}
        </span>
      </div>

      <div class="card-body">
        @if (vitalType === 'bp') {
          <div class="value-row">
            @if (isEditable) {
              <div class="bp-inputs">
                <input
                  type="number"
                  class="vital-input"
                  [ngModel]="systolic"
                  (ngModelChange)="onSystolicChange($event)"
                  placeholder="120"
                />
                <span class="slash">/</span>
                <input
                  type="number"
                  class="vital-input"
                  [ngModel]="diastolic"
                  (ngModelChange)="onDiastolicChange($event)"
                  placeholder="80"
                />
              </div>
            } @else {
              <span class="value-text">{{ systolic || '--' }}/{{ diastolic || '--' }}</span>
            }
            <span class="unit-text">mmHg</span>
          </div>
        } @else if (vitalType === 'bmi') {
          <div class="value-row">
            <span class="value-text">{{ value ? (value | number: '1.1-2') : '--' }}</span>
            <span class="unit-text">kg/m²</span>
          </div>
          @if (isEditable) {
            <div class="bmi-sub-inputs">
              <label class="sub-input-label">
                <span>Cân:</span>
                <input
                  type="number"
                  class="sub-input"
                  [ngModel]="weight"
                  (ngModelChange)="onWeightChange($event)"
                  placeholder="65"
                />
                <span class="sub-unit">kg</span>
              </label>
              <label class="sub-input-label">
                <span>Cao:</span>
                <input
                  type="number"
                  class="sub-input"
                  [ngModel]="height"
                  (ngModelChange)="onHeightChange($event)"
                  placeholder="170"
                />
                <span class="sub-unit">cm</span>
              </label>
            </div>
          } @else {
            <div class="bmi-sub-text">
              <span>{{ weight || '--' }} kg</span> • <span>{{ height || '--' }} cm</span>
            </div>
          }
        } @else {
          <div class="value-row">
            @if (isEditable) {
              <input
                type="number"
                step="0.1"
                class="vital-input single-input"
                [ngModel]="value"
                (ngModelChange)="onValueChange($event)"
                [placeholder]="unit"
              />
            } @else {
              <span class="value-text">{{ value || '--' }}</span>
            }
            <span class="unit-text">{{ unit }}</span>
          </div>
        }
      </div>

      <div class="card-footer">
        <span class="ref-range">Chuẩn: {{ normalRangeText }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .vital-card {
        background: #FFFFFF;
        border-radius: 12px;
        padding: 14px 16px;
        border: 1px solid #E4DED2;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #5E8B7E;
        }

        &.status-normal {
          &::before {
            background: #0E4A55;
          }
        }

        &.status-warning {
          border-color: rgba(184, 149, 90, 0.4);
          background: linear-gradient(180deg, #FFFFFF 0%, #FDFBF7 100%);
          &::before {
            background: #B8955A;
          }
          .value-text {
            color: #8C6D34;
          }
        }

        &.status-danger {
          border-color: rgba(155, 61, 69, 0.4);
          background: linear-gradient(180deg, #FFFFFF 0%, #FDF6F6 100%);
          &::before {
            background: #9B3D45;
          }
          .value-text {
            color: #9B3D45;
          }
        }
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .title-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .vital-icon {
        font-size: 1.1rem;
      }

      .vital-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #5B6672;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .status-badge {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 6px;

        &.badge-normal {
          background: rgba(14, 74, 85, 0.1);
          color: #0E4A55;
        }

        &.badge-warning {
          background: rgba(184, 149, 90, 0.15);
          color: #8C6D34;
        }

        &.badge-danger {
          background: rgba(155, 61, 69, 0.15);
          color: #9B3D45;
          font-weight: 700;
        }
      }

      .card-body {
        margin-bottom: 8px;
      }

      .value-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }

      .value-text {
        font-size: 1.65rem;
        font-weight: 700;
        color: #1C2733;
        font-family: inherit;
        letter-spacing: -0.02em;
      }

      .unit-text {
        font-size: 0.78rem;
        color: #8C96A2;
        font-weight: 500;
      }

      .bp-inputs {
        display: flex;
        align-items: center;
        gap: 4px;

        .slash {
          font-size: 1.3rem;
          color: #8C96A2;
          font-weight: 600;
        }
      }

      .vital-input {
        width: 62px;
        font-size: 1.35rem;
        font-weight: 700;
        color: #1C2733;
        padding: 4px 8px;
        border: 1px solid #E2DCD0;
        border-radius: 10px;
        background: #FFFFFF;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:hover {
          border-color: #C8BFB0;
        }

        &:focus {
          border-color: #0E4A55;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.12);
        }

        &.single-input {
          width: 80px;
        }
      }

      .bmi-sub-inputs {
        display: flex;
        gap: 10px;
        margin-top: 6px;

        .sub-input-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #5B6672;

          .sub-input {
            width: 52px;
            font-size: 0.85rem;
            font-weight: 600;
            padding: 3px 6px;
            border: 1px solid #E2DCD0;
            border-radius: 8px;
            background: #FFFFFF;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;

            &:hover {
              border-color: #C8BFB0;
            }

            &:focus {
              border-color: #0E4A55;
              outline: none;
              box-shadow: 0 0 0 2.5px rgba(14, 74, 85, 0.12);
            }
          }

          .sub-unit {
            color: #8C96A2;
          }
        }
      }

      .bmi-sub-text {
        font-size: 0.75rem;
        color: #5B6672;
        margin-top: 2px;
      }

      .card-footer {
        padding-top: 6px;
        border-top: 1px dashed #F0EAE1;
      }

      .ref-range {
        font-size: 0.72rem;
        color: #8C96A2;
      }
    `,
  ],
})
export class VitalSignCardComponent {
  @Input() vitalType: VitalType = 'bp';
  @Input() label = '';
  @Input() icon: ClinicIconName | string = 'stethoscope';
  @Input() unit = '';
  @Input() value?: number;
  @Input() systolic?: number;
  @Input() diastolic?: number;
  @Input() weight?: number;
  @Input() height?: number;
  @Input() isEditable = false;

  getCleanIcon(): ClinicIconName {
    if (this.vitalType === 'bp') return 'heart-pulse';
    if (this.vitalType === 'heartRate') return 'activity';
    if (this.vitalType === 'temperature') return 'activity';
    if (this.vitalType === 'bmi') return 'user';
    if (this.vitalType === 'spo2') return 'flask';
    return 'stethoscope';
  }

  @Output() valueChange = new EventEmitter<number>();
  @Output() systolicChange = new EventEmitter<number>();
  @Output() diastolicChange = new EventEmitter<number>();
  @Output() weightChange = new EventEmitter<number>();
  @Output() heightChange = new EventEmitter<number>();

  get status(): 'normal' | 'warning' | 'danger' {
    if (this.vitalType === 'bp') {
      const s = this.systolic || 0;
      const d = this.diastolic || 0;
      if (s >= 140 || d >= 90) return 'danger';
      if (s >= 120 || d >= 80) return 'warning';
      return 'normal';
    }

    if (this.vitalType === 'heartRate') {
      const val = this.value || 0;
      if (val < 50 || val > 100) return 'danger';
      if (val > 90 || val < 60) return 'warning';
      return 'normal';
    }

    if (this.vitalType === 'temperature') {
      const val = this.value || 0;
      if (val >= 38.5 || val < 35.5) return 'danger';
      if (val > 37.5 || val < 36.0) return 'warning';
      return 'normal';
    }

    if (this.vitalType === 'spo2') {
      const val = this.value || 0;
      if (val < 94) return 'danger';
      if (val < 96) return 'warning';
      return 'normal';
    }

    if (this.vitalType === 'bmi') {
      const val = this.value || 0;
      if (val >= 25.0) return 'danger';
      if (val >= 23.0 || (val > 0 && val < 18.5)) return 'warning';
      return 'normal';
    }

    return 'normal';
  }

  get statusText(): string {
    switch (this.status) {
      case 'danger':
        return 'Nguy cơ';
      case 'warning':
        return 'Cận ngưỡng';
      default:
        return 'Bình thường';
    }
  }

  get normalRangeText(): string {
    switch (this.vitalType) {
      case 'bp':
        return '< 120 / < 80';
      case 'heartRate':
        return '60 - 90 bpm';
      case 'temperature':
        return '36.5 - 37.5 °C';
      case 'spo2':
        return '≥ 96%';
      case 'bmi':
        return '18.5 - 22.9';
      default:
        return '';
    }
  }

  onValueChange(val: number): void {
    this.valueChange.emit(val);
  }

  onSystolicChange(val: number): void {
    this.systolicChange.emit(val);
  }

  onDiastolicChange(val: number): void {
    this.diastolicChange.emit(val);
  }

  onWeightChange(val: number): void {
    this.weightChange.emit(val);
  }

  onHeightChange(val: number): void {
    this.heightChange.emit(val);
  }
}
