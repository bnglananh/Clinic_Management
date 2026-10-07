import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icd10Item } from '../../../core/models/medical-record.model';
import { ClinicIconComponent } from '../clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-icd10-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ClinicIconComponent],
  template: `
    <div class="icd10-wrapper">
      @if (!isLocked) {
        <div class="search-box-container">
          <div class="search-input-wrap">
            <span class="search-icon">
              <app-clinic-icon name="search" [size]="16" color="#8C96A2"></app-clinic-icon>
            </span>
            <input
              type="text"
              class="search-input"
              [(ngModel)]="searchQuery"
              (focus)="isDropdownOpen.set(true)"
              placeholder="Tìm kiếm mã ICD-10 hoặc tên bệnh (ví dụ: I10, Tăng huyết áp, Đái tháo đường...)"
            />
            @if (searchQuery) {
              <button class="clear-btn" (click)="searchQuery = ''">
                <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
              </button>
            }
          </div>

          <!-- Autocomplete Suggestions Dropdown -->
          @if (isDropdownOpen() && filteredList().length > 0) {
            <div class="dropdown-panel">
              <div class="dropdown-header">GỢI Ý DANH MỤC ICD-10</div>
              <ul class="suggestion-list">
                @for (item of filteredList(); track item.code) {
                  <li class="suggestion-item" (click)="selectItem(item)">
                    <span class="item-code">{{ item.code }}</span>
                    <div class="item-details">
                      <span class="item-name-vi">{{ item.nameVi }}</span>
                      @if (item.nameEn) {
                        <span class="item-name-en">{{ item.nameEn }}</span>
                      }
                    </div>
                    <span class="add-tag">+ Thêm</span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      }

      <!-- Selected Diagnoses List -->
      <div class="selected-diagnoses-list">
        @if (selectedList && selectedList.length > 0) {
          @for (item of selectedList; track item.code) {
            <div class="diagnosis-item" [class.is-primary]="item.isPrimary">
              <div class="badge-role" [class.primary]="item.isPrimary">
                {{ item.isPrimary ? 'CHẨN ĐOÁN CHÍNH' : 'KÈM THEO' }}
              </div>
              <div class="diag-content">
                <span class="diag-code">{{ item.code }}</span>
                <span class="diag-name">{{ item.nameVi }}</span>
              </div>

              @if (!isLocked) {
                <div class="diag-actions">
                  @if (!item.isPrimary) {
                    <button
                      type="button"
                      class="btn-make-primary"
                      title="Đặt làm chẩn đoán chính"
                      (click)="setPrimary.emit(item.code)"
                    >
                      Đặt làm chính
                    </button>
                  }
                  <button
                    type="button"
                    class="btn-remove"
                    title="Xóa chẩn đoán"
                    (click)="removeItem(item.code)"
                  >
                    <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
                  </button>
                </div>
              }
            </div>
          }
        } @else {
          <div class="no-diagnoses">
            <span class="empty-icon">
              <app-clinic-icon name="stethoscope" [size]="20" color="#8C96A2"></app-clinic-icon>
            </span>
            <span>Chưa ghi nhận mã chẩn đoán ICD-10 nào.</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .icd10-wrapper {
        position: relative;
      }

      .search-box-container {
        position: relative;
        margin-bottom: 14px;
      }

      .search-input-wrap {
        display: flex;
        align-items: center;
        background: #FAF8F5;
        border: 1.5px solid #D5CDBD;
        border-radius: 12px;
        padding: 4px 12px;
        transition: all 0.2s ease;

        &:focus-within {
          border-color: #0E4A55;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.1);
        }

        .search-icon {
          color: #8C96A2;
          font-size: 0.95rem;
          margin-right: 8px;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.9rem;
          color: #1C2733;
          padding: 8px 0;
        }

        .clear-btn {
          border: none;
          background: transparent;
          color: #8C96A2;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 4px;
          &:hover {
            color: #1C2733;
          }
        }
      }

      .dropdown-panel {
        position: absolute;
        top: 105%;
        left: 0;
        right: 0;
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(28, 39, 51, 0.15);
        z-index: 50;
        max-height: 260px;
        overflow-y: auto;
      }

      .dropdown-header {
        font-size: 0.7rem;
        font-weight: 700;
        color: #8C96A2;
        padding: 8px 12px;
        border-bottom: 1px solid #F0EAE1;
        letter-spacing: 0.05em;
      }

      .suggestion-list {
        list-style: none;
        margin: 0;
        padding: 4px 0;
      }

      .suggestion-item {
        display: flex;
        align-items: center;
        padding: 10px 14px;
        cursor: pointer;
        transition: background 0.15s ease;
        gap: 12px;

        &:hover {
          background: #F4EFEB;
        }

        .item-code {
          font-weight: 700;
          color: #0E4A55;
          background: rgba(14, 74, 85, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.85rem;
          min-width: 48px;
          text-align: center;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;

          .item-name-vi {
            font-size: 0.88rem;
            font-weight: 600;
            color: #1C2733;
          }

          .item-name-en {
            font-size: 0.75rem;
            color: #8C96A2;
            font-style: italic;
          }
        }

        .add-tag {
          font-size: 0.78rem;
          color: #B8955A;
          font-weight: 600;
        }
      }

      .selected-diagnoses-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .diagnosis-item {
        display: flex;
        align-items: center;
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 10px;
        padding: 10px 14px;
        gap: 12px;
        transition: all 0.2s ease;

        &.is-primary {
          border-color: rgba(14, 74, 85, 0.4);
          background: #FAFBFB;
        }

        .badge-role {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.04em;
          background: #EAE6DF;
          color: #5B6672;

          &.primary {
            background: #0E4A55;
            color: #FFFFFF;
          }
        }

        .diag-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;

          .diag-code {
            font-weight: 700;
            color: #0E4A55;
            font-size: 0.9rem;
          }

          .diag-name {
            font-size: 0.88rem;
            font-weight: 500;
            color: #1C2733;
          }
        }

        .diag-actions {
          display: flex;
          align-items: center;
          gap: 6px;

          .btn-make-primary {
            font-size: 0.72rem;
            background: rgba(184, 149, 90, 0.12);
            color: #8C6D34;
            border: 1px solid rgba(184, 149, 90, 0.3);
            border-radius: 6px;
            padding: 4px 8px;
            cursor: pointer;
            font-weight: 600;

            &:hover {
              background: #B8955A;
              color: #FFFFFF;
            }
          }

          .btn-remove {
            background: transparent;
            border: none;
            color: #9B3D45;
            font-size: 0.95rem;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;

            &:hover {
              background: rgba(155, 61, 69, 0.1);
            }
          }
        }
      }

      .no-diagnoses {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 24px;
        background: #FAF8F5;
        border: 1px dashed #D5CDBD;
        border-radius: 10px;
        color: #8C96A2;
        font-size: 0.85rem;

        .empty-icon {
          font-size: 1.2rem;
        }
      }
    `,
  ],
})
export class Icd10SelectComponent {
  @Input() catalog: Icd10Item[] = [];
  @Input() selectedList: Icd10Item[] = [];
  @Input() isLocked = false;

  @Output() addDiagnosis = new EventEmitter<Icd10Item>();
  @Output() removeDiagnosis = new EventEmitter<string>();
  @Output() setPrimary = new EventEmitter<string>();

  searchQuery = '';
  isDropdownOpen = signal(false);

  filteredList = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.catalog.slice(0, 8);

    return this.catalog
      .filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.nameVi.toLowerCase().includes(q) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(q))
      )
      .slice(0, 10);
  });

  selectItem(item: Icd10Item): void {
    this.addDiagnosis.emit(item);
    this.searchQuery = '';
    this.isDropdownOpen.set(false);
  }

  removeItem(code: string): void {
    this.removeDiagnosis.emit(code);
  }
}
