import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicalRecordAmendment } from '../../../core/models/medical-record.model';
import { ClinicIconComponent } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-emr-lock-badge',
  standalone: true,
  imports: [CommonModule, FormsModule, ClinicIconComponent],
  template: `
    <div class="emr-lock-container">
      @if (isLocked) {
        <div class="lock-indicator locked">
          <span class="lock-icon">
            <app-clinic-icon name="lock" [size]="16" color="#5E8B7E"></app-clinic-icon>
          </span>
          <div class="lock-info">
            <span class="lock-label">HỒ SƠ ĐÃ KHÓA (BR-23)</span>
            <span class="lock-sub">
              Phiên bản v{{ version }}.0
              @if (amendments && amendments.length > 0) {
                • ({{ amendments.length }} phụ lục bổ sung)
              }
            </span>
          </div>
        </div>

        <div class="amendment-actions">
          @if (amendments && amendments.length > 0) {
            <button
              type="button"
              class="btn-view-history"
              (click)="showHistoryModal.set(true)"
            >
              <app-clinic-icon name="file-text" [size]="14"></app-clinic-icon>
              <span>Xem lịch sử bổ sung ({{ amendments.length }})</span>
            </button>
          }

          <button
            type="button"
            class="btn-add-amendment"
            (click)="showAddendumModal.set(true)"
          >
            + Thêm phụ lục bổ sung
          </button>
        </div>
      } @else {
        <div class="lock-indicator draft">
          <span class="live-dot pulse-teal"></span>
          <div class="lock-info">
            <span class="lock-label">ĐANG KHÁM (CHƯA KHÓA)</span>
            <span class="lock-sub">Có thể chỉnh sửa trực tiếp các tab</span>
          </div>
        </div>
      }

      <!-- Add Addendum Modal -->
      @if (showAddendumModal()) {
        <div class="modal-overlay" (click)="showAddendumModal.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="m-icon">
                <app-clinic-icon name="edit" [size]="20" color="#0E4A55"></app-clinic-icon>
              </span>
              <div>
                <h4 class="m-title font-serif">Thêm Phụ Lục Bổ Sung Hồ Sơ Bệnh Án</h4>
                <span class="m-sub">Quy tắc BR-23: Hồ sơ đã khóa chỉ được cập nhật qua phụ lục minh bạch, không ghi đè dữ liệu gốc.</span>
              </div>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Lý do bổ sung phụ lục <span class="required">*</span></label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="amendmentReason"
                  placeholder="Ví dụ: Bổ sung diễn tiến tái khám nhanh / Đính chính lời dặn dùng thuốc..."
                />
              </div>

              <div class="form-group">
                <label class="form-label">Nội dung phụ lục y khoa <span class="required">*</span></label>
                <textarea
                  rows="4"
                  class="form-textarea"
                  [(ngModel)]="amendmentContent"
                  placeholder="Nhập chi tiết thông tin lâm sàng bổ sung, kết quả theo dõi hoặc điều chỉnh dặn dò..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="showAddendumModal.set(false)">Hủy bỏ</button>
              <button
                type="button"
                class="btn-save-amendment"
                [disabled]="!amendmentReason.trim() || !amendmentContent.trim()"
                (click)="submitAmendment()"
              >
                Lưu Phụ Lục (Tạo phiên bản v{{ version + 1 }}.0)
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Version History Timeline Modal -->
      @if (showHistoryModal()) {
        <div class="modal-overlay" (click)="showHistoryModal.set(false)">
          <div class="modal-card history-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="m-icon">
                <app-clinic-icon name="file-text" [size]="20" color="#0E4A55"></app-clinic-icon>
              </span>
              <div>
                <h4 class="m-title font-serif">Lịch Sử Phiên Bản & Phụ Lục Bổ Sung</h4>
                <span class="m-sub">Theo dõi chuỗi bổ sung EMR theo thời gian</span>
              </div>
            </div>

            <div class="modal-body">
              <div class="timeline-container">
                <!-- Base record v1.0 -->
                <div class="timeline-item base-item">
                  <div class="tl-bullet base-bullet">1.0</div>
                  <div class="tl-content">
                    <div class="tl-top">
                      <strong class="tl-title">Hồ sơ khám gốc (Khóa lần đầu)</strong>
                      <span class="tl-time">v1.0</span>
                    </div>
                    <p class="tl-desc">Hoàn tất quá trình thăm khám lâm sàng và khóa hồ sơ EMR ban đầu.</p>
                  </div>
                </div>

                <!-- Amendments list -->
                @for (item of amendments; track item.id) {
                  <div class="timeline-item amendment-item">
                    <div class="tl-bullet amd-bullet">{{ item.version }}.0</div>
                    <div class="tl-content">
                      <div class="tl-top">
                        <strong class="tl-title">{{ item.reason }}</strong>
                        <span class="tl-time">{{ item.createdAt }}</span>
                      </div>
                      <span class="tl-doctor">Bác sĩ ghi nhận: {{ item.doctorName }}</span>
                      <div class="tl-addendum-box">
                        {{ item.addendumContent }}
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="showHistoryModal.set(false)">Đóng</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .emr-lock-container {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .lock-indicator {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 6px 14px;
        border-radius: 10px;

        &.locked {
          background: rgba(94, 139, 126, 0.15);
          border: 1.5px solid #5E8B7E;
          color: #2F5A4F;

          .lock-icon {
            font-size: 1.2rem;
          }
        }

        &.draft {
          background: rgba(14, 74, 85, 0.08);
          border: 1.5px dashed #0E4A55;
          color: #0E4A55;
        }

        .lock-info {
          display: flex;
          flex-direction: column;
        }

        .lock-label {
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .lock-sub {
          font-size: 0.7rem;
          color: #5B6672;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0E4A55;
        }
      }

      .amendment-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-add-amendment {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #135d6b;
        }
      }

      .btn-view-history {
        background: #FFFFFF;
        color: #1C2733;
        border: 1px solid #D5CDBD;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #FAF8F5;
        }
      }

      /* Modal styling */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.65);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }

      .modal-card {
        background: #FFFFFF;
        width: 100%;
        max-width: 580px;
        border-radius: 14px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
        border: 1px solid #E4DED2;
        overflow: hidden;

        &.history-modal {
          max-width: 650px;
        }
      }

      .modal-header {
        background: #F4EFEB;
        padding: 16px 20px;
        border-bottom: 1px solid #E4DED2;
        display: flex;
        align-items: center;
        gap: 12px;

        .m-icon {
          font-size: 1.4rem;
        }

        .m-title {
          margin: 0;
          font-size: 1.05rem;
          color: #1C2733;
          font-weight: 700;
        }

        .m-sub {
          font-size: 0.74rem;
          color: #5B6672;
        }
      }

      .modal-body {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }

      .form-group {
        margin-bottom: 14px;

        .form-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #1C2733;
          margin-bottom: 6px;

          .required {
            color: #9B3D45;
          }
        }

        .form-input, .form-textarea {
          width: 100%;
          border: 1px solid #E2DCD0;
          border-radius: 12px;
          padding: 9px 14px;
          font-size: 0.88rem;
          color: #1C2733;
          background: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;

          &:hover {
            border-color: #C8BFB0;
          }

          &:focus {
            border-color: #0E4A55;
            background: #FFFFFF;
            box-shadow: 0 0 0 3.5px rgba(14, 74, 85, 0.12);
          }
        }
      }

      .timeline-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: relative;
        padding-left: 10px;

        &::before {
          content: '';
          position: absolute;
          left: 23px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: #E4DED2;
        }
      }

      .timeline-item {
        display: flex;
        gap: 14px;
        position: relative;
        z-index: 1;

        .tl-bullet {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: #FFFFFF;
          flex-shrink: 0;

          &.base-bullet {
            background: #5E8B7E;
          }

          &.amd-bullet {
            background: #0E4A55;
          }
        }

        .tl-content {
          flex: 1;
          background: #FAF8F5;
          border: 1px solid #E4DED2;
          border-radius: 10px;
          padding: 10px 14px;

          .tl-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;

            .tl-title {
              font-size: 0.88rem;
              color: #1C2733;
            }

            .tl-time {
              font-size: 0.72rem;
              color: #8C96A2;
            }
          }

          .tl-desc {
            font-size: 0.8rem;
            color: #5B6672;
            margin: 0;
          }

          .tl-doctor {
            font-size: 0.74rem;
            color: #0E4A55;
            font-weight: 600;
            display: block;
            margin-bottom: 6px;
          }

          .tl-addendum-box {
            background: #FFFFFF;
            border-left: 3px solid #0E4A55;
            padding: 6px 10px;
            font-size: 0.82rem;
            color: #1C2733;
            border-radius: 4px;
          }
        }
      }

      .modal-footer {
        padding: 14px 20px;
        background: #F8F6F2;
        border-top: 1px solid #E4DED2;
        display: flex;
        justify-content: flex-end;
        gap: 10px;

        button {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .btn-cancel {
          background: #FFFFFF;
          border: 1px solid #D5CDBD;
          color: #1C2733;
        }

        .btn-save-amendment {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;

          &:disabled {
            background: #D5CDBD;
            cursor: not-allowed;
          }
        }
      }
    `,
  ],
})
export class EmrLockBadgeComponent {
  @Input() isLocked = false;
  @Input() version = 1;
  @Input() amendments: MedicalRecordAmendment[] = [];

  @Output() addAmendment = new EventEmitter<{ reason: string; content: string }>();

  showAddendumModal = signal(false);
  showHistoryModal = signal(false);

  amendmentReason = '';
  amendmentContent = '';

  submitAmendment(): void {
    if (this.amendmentReason.trim() && this.amendmentContent.trim()) {
      this.addAmendment.emit({
        reason: this.amendmentReason.trim(),
        content: this.amendmentContent.trim(),
      });
      this.amendmentReason = '';
      this.amendmentContent = '';
      this.showAddendumModal.set(false);
    }
  }
}
