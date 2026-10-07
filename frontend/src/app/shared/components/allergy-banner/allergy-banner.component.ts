import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClinicIconComponent } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-allergy-banner',
  standalone: true,
  imports: [CommonModule, ClinicIconComponent],
  template: `
    @if (allergyText && allergyText.trim() && !allergyText.toLowerCase().includes('không')) {
      <div class="allergy-banner animate-fade-in-up">
        <div class="allergy-icon-circle">
          <app-clinic-icon name="alert-triangle" [size]="18" color="#9B3D45"></app-clinic-icon>
        </div>
        <div class="allergy-content">
          <span class="allergy-title">CẢNH BÁO TIỀN SỬ DỊ ỨNG THUỐC & THỰC PHẨM</span>
          <p class="allergy-detail">{{ allergyText }}</p>
        </div>
        <div class="allergy-tag">
          <span>NGUY CƠ CAO</span>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .allergy-banner {
        background: linear-gradient(90deg, rgba(155, 61, 69, 0.12) 0%, rgba(155, 61, 69, 0.05) 100%);
        border: 1.5px solid rgba(155, 61, 69, 0.35);
        border-left: 4px solid #9B3D45;
        border-radius: 12px;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;
      }

      .allergy-icon-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(155, 61, 69, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.15rem;
        flex-shrink: 0;
      }

      .allergy-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .allergy-title {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #9B3D45;
      }

      .allergy-detail {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 600;
        color: #1C2733;
        line-height: 1.4;
      }

      .allergy-tag {
        background: #9B3D45;
        color: #FFFFFF;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 4px 10px;
        border-radius: 999px;
        flex-shrink: 0;
      }
    `,
  ],
})
export class AllergyBannerComponent {
  @Input() allergyText?: string;

  @Input()
  set allergies(val: string[] | string | undefined) {
    if (Array.isArray(val)) {
      this.allergyText = val.join(', ');
    } else if (typeof val === 'string') {
      this.allergyText = val;
    }
  }
}
