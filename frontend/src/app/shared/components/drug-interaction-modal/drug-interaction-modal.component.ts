import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrugInteractionWarning } from '../../../core/models/medical-record.model';
import { ClinicIconComponent } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-drug-interaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ClinicIconComponent],
  template: `
    @if (isVisible) {
      <div class="modal-overlay" (click)="onBackdropClick($event)">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <!-- Burgundy Critical Header -->
          <div class="modal-header">
            <div class="header-icon-box">
              <span class="warning-icon">
                <app-clinic-icon name="alert-triangle" [size]="22" color="#FFFFFF"></app-clinic-icon>
              </span>
            </div>
            <div class="header-text">
              <h3 class="modal-title font-serif">CẢNH BÁO TƯƠNG TÁC THUỐC (DDI)</h3>
              <span class="modal-subtitle">
                Được phát hiện bởi Engine Phân Tích Đồ Thị Tri Thức Dược (Neo4j Graph Database)
              </span>
            </div>
          </div>

          <!-- Body with list of drug interactions -->
          <div class="modal-body">
            <div class="interaction-alert-banner">
              <strong>Phát hiện {{ interactions.length }} cặp tương tác có nguy cơ lâm sàng cao trong đơn thuốc!</strong>
            </div>

            <div class="interaction-list">
              @for (item of interactions; track item.id) {
                <div class="interaction-card" [class]="'severity-' + item.severity.toLowerCase()">
                  <div class="card-top">
                    <div class="drug-pair">
                      <span class="drug-badge">{{ item.drugA }}</span>
                      <span class="conflict-sign">
                        <app-clinic-icon name="alert-triangle" [size]="14" color="#DC2626"></app-clinic-icon>
                      </span>
                      <span class="drug-badge">{{ item.drugB }}</span>
                    </div>
                    <span class="severity-pill" [class]="'pill-' + item.severity.toLowerCase()">
                      {{ item.severity === 'CRITICAL' ? 'NGUY HIỂM TÍNH MẠNG' : item.severity === 'MAJOR' ? 'MỨC ĐỘ NẶNG' : 'TRUNG BÌNH' }}
                    </span>
                  </div>

                  <h4 class="rule-title">{{ item.title }}</h4>

                  <div class="detail-grid">
                    <div class="detail-row">
                      <span class="dt-label">Cơ chế tương tác:</span>
                      <span class="dt-val">{{ item.mechanism }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="dt-label">Biểu hiện lâm sàng:</span>
                      <span class="dt-val text-burgundy font-bold">{{ item.clinicalEffect }}</span>
                    </div>
                    <div class="detail-row highlight-rec">
                      <span class="dt-label">Khuyến nghị xử trí:</span>
                      <span class="dt-val">{{ item.recommendation }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Mandatory acknowledgment checkbox -->
            <div class="mandatory-ack-box">
              <label class="ack-label">
                <input
                  type="checkbox"
                  class="ack-checkbox"
                  [checked]="isAcknowledged()"
                  (change)="isAcknowledged.set(!isAcknowledged())"
                />
                <span class="ack-text">
                  Tôi xác nhận đã xem xét đầy đủ các rủi ro tương tác thuốc nêu trên và chịu trách nhiệm chuyên môn khi chỉ định đơn thuốc này.
                </span>
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onCancel()">
              ← Quay lại chỉnh sửa đơn
            </button>
            <button
              type="button"
              class="btn-confirm-override"
              [disabled]="!isAcknowledged()"
              (click)="onConfirm()"
            >
              Chấp nhận rủi ro & Tiếp tục lưu
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
        animation: fadeIn 0.2s ease;
      }

      .modal-container {
        background: #FFFFFF;
        width: 100%;
        max-width: 680px;
        border-radius: 16px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
        border: 2px solid #9B3D45;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 90vh;
        animation: slideUp 0.25s ease;
      }

      .modal-header {
        background: linear-gradient(135deg, #7A2830 0%, #9B3D45 100%);
        color: #FFFFFF;
        padding: 18px 24px;
        display: flex;
        align-items: center;
        gap: 14px;

        .header-icon-box {
          background: rgba(255, 255, 255, 0.2);
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        .header-text {
          flex: 1;

          .modal-title {
            margin: 0;
            font-size: 1.15rem;
            font-weight: 700;
            letter-spacing: 0.02em;
          }

          .modal-subtitle {
            font-size: 0.76rem;
            color: rgba(255, 255, 255, 0.85);
          }
        }
      }

      .modal-body {
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
      }

      .interaction-alert-banner {
        background: rgba(155, 61, 69, 0.1);
        border: 1px solid rgba(155, 61, 69, 0.25);
        color: #9B3D45;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 0.88rem;
        margin-bottom: 16px;
      }

      .interaction-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .interaction-card {
        border-radius: 12px;
        padding: 14px 18px;
        border: 1px solid #E4DED2;
        background: #FAF8F5;

        &.severity-critical {
          border-color: #9B3D45;
          background: #FFF7F7;
        }

        &.severity-major {
          border-color: #B8955A;
          background: #FDFBF7;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .drug-pair {
          display: flex;
          align-items: center;
          gap: 8px;

          .drug-badge {
            background: #1C2733;
            color: #FFFFFF;
            font-weight: 700;
            font-size: 0.82rem;
            padding: 4px 10px;
            border-radius: 6px;
          }

          .conflict-sign {
            color: #9B3D45;
            font-size: 1rem;
            font-weight: bold;
          }
        }

        .severity-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;

          &.pill-critical {
            background: #9B3D45;
            color: #FFFFFF;
          }

          &.pill-major {
            background: #B8955A;
            color: #FFFFFF;
          }

          &.pill-moderate {
            background: #5E8B7E;
            color: #FFFFFF;
          }
        }

        .rule-title {
          margin: 0 0 10px 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1C2733;
        }

        .detail-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.82rem;

          .detail-row {
            display: flex;
            gap: 8px;

            .dt-label {
              min-width: 140px;
              color: #5B6672;
              font-weight: 600;
            }

            .dt-val {
              color: #1C2733;
              flex: 1;
            }

            &.highlight-rec {
              background: rgba(14, 74, 85, 0.06);
              padding: 6px 8px;
              border-radius: 6px;
              border-left: 3px solid #0E4A55;

              .dt-label {
                color: #0E4A55;
              }
            }
          }
        }
      }

      .mandatory-ack-box {
        margin-top: 20px;
        padding: 14px 16px;
        border-radius: 10px;
        background: #FAF8F5;
        border: 1.5px solid #D5CDBD;

        .ack-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;

          .ack-checkbox {
            margin-top: 3px;
            width: 18px;
            height: 18px;
            accent-color: #9B3D45;
            cursor: pointer;
          }

          .ack-text {
            font-size: 0.84rem;
            color: #1C2733;
            line-height: 1.4;
            font-weight: 600;
          }
        }
      }

      .modal-footer {
        padding: 16px 24px;
        background: #F8F6F2;
        border-top: 1px solid #E4DED2;
        display: flex;
        justify-content: flex-end;
        gap: 12px;

        button {
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel {
          background: #FFFFFF;
          border: 1px solid #D5CDBD;
          color: #1C2733;

          &:hover {
            background: #F0EAE1;
          }
        }

        .btn-confirm-override {
          background: #9B3D45;
          color: #FFFFFF;
          border: none;
          box-shadow: 0 4px 12px rgba(155, 61, 69, 0.3);

          &:disabled {
            background: #D5CDBD;
            color: #8C96A2;
            cursor: not-allowed;
            box-shadow: none;
          }

          &:not(:disabled):hover {
            background: #802f36;
          }
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `,
  ],
})
export class DrugInteractionModalComponent {
  @Input() isVisible = false;
  @Input() interactions: DrugInteractionWarning[] = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() confirmOverride = new EventEmitter<void>();

  isAcknowledged = signal(false);

  onBackdropClick(e: MouseEvent): void {
    if (!this.isAcknowledged()) {
      this.cancel.emit();
    }
  }

  onCancel(): void {
    this.isAcknowledged.set(false);
    this.cancel.emit();
  }

  onConfirm(): void {
    if (this.isAcknowledged()) {
      this.confirmOverride.emit();
      this.isAcknowledged.set(false);
    }
  }
}
