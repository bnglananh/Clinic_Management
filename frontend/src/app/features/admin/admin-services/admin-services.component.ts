import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MedicalServiceItem } from '../../../core/models/admin.model';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ClinicIconComponent],
  template: `
    <app-page-header
      badgeText="DANH MỤC DỊCH VỤ & BẢNG GIÁ • UC022"
      title="Quản Lý Dịch Vụ Khám Bệnh, Cận Lâm Sàng & Bảng Giá"
      subtitle="Quản lý danh mục gói khám, chỉ định xét nghiệm, chẩn đoán hình ảnh và cập nhật bảng giá viện phí."
    >
      <div actions>
        <button class="btn-gold" (click)="openCreateModal()">
          <app-clinic-icon name="flask" [size]="14"></app-clinic-icon>
          <span>Thêm dịch vụ y tế mới</span>
        </button>
      </div>
    </app-page-header>

    <!-- Toolbar Filters -->
    <div class="clinic-card toolbar-card">
      <div class="search-box">
        <app-clinic-icon name="search" [size]="16" class="search-icon"></app-clinic-icon>
        <input
          type="text"
          placeholder="Tìm tên dịch vụ, mã kỹ thuật, phòng thực hiện..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          class="clinic-input search-input"
        />
      </div>

      <div class="category-tabs">
        <button
          type="button"
          class="category-tab"
          [class.active]="selectedCategoryFilter() === 'ALL'"
          (click)="selectedCategoryFilter.set('ALL')"
        >
          Tất cả ({{ allServices().length }})
        </button>
        <button
          type="button"
          class="category-tab"
          [class.active]="selectedCategoryFilter() === 'KHÁM BỆNH'"
          (click)="selectedCategoryFilter.set('KHÁM BỆNH')"
        >
          <app-clinic-icon name="stethoscope" [size]="13"></app-clinic-icon>
          Khám bệnh
        </button>
        <button
          type="button"
          class="category-tab"
          [class.active]="selectedCategoryFilter() === 'XÉT NGHIỆM'"
          (click)="selectedCategoryFilter.set('XÉT NGHIỆM')"
        >
          <app-clinic-icon name="flask" [size]="13"></app-clinic-icon>
          Xét nghiệm
        </button>
        <button
          type="button"
          class="category-tab"
          [class.active]="selectedCategoryFilter() === 'CHẨN ĐOÁN HÌNH ẢNH'"
          (click)="selectedCategoryFilter.set('CHẨN ĐOÁN HÌNH ẢNH')"
        >
          <app-clinic-icon name="xray" [size]="13"></app-clinic-icon>
          CĐ Hình ảnh
        </button>
        <button
          type="button"
          class="category-tab"
          [class.active]="selectedCategoryFilter() === 'CẬN LÂM SÀNG'"
          (click)="selectedCategoryFilter.set('CẬN LÂM SÀNG')"
        >
          <app-clinic-icon name="activity" [size]="13"></app-clinic-icon>
          Cận lâm sàng
        </button>
      </div>
    </div>

    <!-- Services Table -->
    <div class="clinic-card table-card">
      <div class="table-responsive">
        <table class="clinic-table">
          <thead>
            <tr>
              <th>Mã DV</th>
              <th>Tên dịch vụ kỹ thuật y tế</th>
              <th>Phân nhóm chuyên môn</th>
              <th>Địa điểm / Phòng</th>
              <th>Đơn vị & Thời lượng</th>
              <th>Đơn giá niêm yết</th>
              <th>Trạng thái</th>
              <th style="text-align: right;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (svc of filteredServices(); track svc.id) {
              <tr [class.inactive-row]="!svc.isActive">
                <td>
                  <span class="service-code">{{ svc.serviceCode }}</span>
                </td>
                <td>
                  <span class="service-name font-bold">{{ svc.serviceName }}</span>
                </td>
                <td>
                  <span class="category-badge" [class]="getCategoryClass(svc.category)">
                    {{ svc.category }}
                  </span>
                </td>
                <td>
                  <span class="room-name">
                    <app-clinic-icon name="map-pin" [size]="11"></app-clinic-icon>
                    {{ svc.roomName }}
                  </span>
                </td>
                <td>
                  <div class="unit-duration-box">
                    <span class="unit-text">{{ svc.unit }}</span>
                    <span class="duration-text">
                      <app-clinic-icon name="clock" [size]="11"></app-clinic-icon>
                      ~{{ svc.estimatedDurationMinutes }} phút
                    </span>
                  </div>
                </td>
                <td>
                  <span class="price-text font-bold text-teal">{{ svc.price | number }} đ</span>
                </td>
                <td>
                  <span
                    class="status-pill"
                    [class.active]="svc.isActive"
                    [class.inactive]="!svc.isActive"
                  >
                    <span class="dot"></span>
                    {{ svc.isActive ? 'Áp dụng' : 'Tạm ngưng' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="action-cell">
                    <button class="btn-edit-price" (click)="openEditPriceModal(svc)" title="Điều chỉnh đơn giá">
                      <app-clinic-icon name="edit" [size]="12"></app-clinic-icon>
                      <span>Đổi giá</span>
                    </button>
                    <button
                      class="btn-toggle-status"
                      [class.btn-pause]="svc.isActive"
                      [class.btn-resume]="!svc.isActive"
                      (click)="toggleServiceStatus(svc)"
                      [title]="svc.isActive ? 'Tạm ngưng dịch vụ này (BR-21)' : 'Mở lại dịch vụ'"
                    >
                      {{ svc.isActive ? 'Tạm ngưng' : 'Mở lại' }}
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-state">
                  <app-clinic-icon name="flask" [size]="32" class="empty-icon"></app-clinic-icon>
                  <p>Không tìm thấy dịch vụ y tế nào theo tiêu chí tìm kiếm.</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Price Modal -->
    @if (editPriceModalOpen() && selectedServiceForEdit()) {
      <div class="modal-backdrop" (click)="closeEditPriceModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title font-serif">
              <app-clinic-icon name="edit" [size]="18"></app-clinic-icon>
              <span>Cập Nhật Đơn Giá Dịch Vụ</span>
            </h3>
            <button class="modal-close" (click)="closeEditPriceModal()">
              <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
            </button>
          </div>

          <div class="modal-body">
            <div class="target-service-banner">
              <span class="target-code">{{ selectedServiceForEdit()!.serviceCode }}</span>
              <div class="target-details">
                <span class="target-name font-bold">{{ selectedServiceForEdit()!.serviceName }}</span>
                <span class="target-category">{{ selectedServiceForEdit()!.category }} • {{ selectedServiceForEdit()!.roomName }}</span>
              </div>
            </div>

            <form (ngSubmit)="submitUpdatePrice()" class="modal-form">
              <div class="form-group">
                <label>Đơn giá viện phí mới (VND) <span class="required">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="newPriceValue"
                  name="newPrice"
                  min="0"
                  step="5000"
                  required
                  class="clinic-input price-input"
                />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="closeEditPriceModal()">Hủy</button>
                <button type="submit" class="btn-submit">Lưu giá mới</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Create Service Modal -->
    @if (createModalOpen()) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal-card wide-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title font-serif">
              <app-clinic-icon name="plus" [size]="18"></app-clinic-icon>
              <span>Thêm Mới Dịch Vụ Kỹ Thuật Y Tế (UC022)</span>
            </h3>
            <button class="modal-close" (click)="closeCreateModal()">
              <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
            </button>
          </div>

          <form (ngSubmit)="submitCreateService()" class="modal-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Mã dịch vụ <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newServiceCode"
                  name="serviceCode"
                  placeholder="vd: US-TIM"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Phân loại chuyên môn <span class="required">*</span></label>
                <select [(ngModel)]="newCategory" name="category" class="clinic-select">
                  <option value="KHÁM BỆNH">Khám Bệnh</option>
                  <option value="XÉT NGHIỆM">Xét Nghiệm</option>
                  <option value="CHẨN ĐOÁN HÌNH ẢNH">Chẩn Đoán Hình Ảnh</option>
                  <option value="CẬN LÂM SÀNG">Cận Lâm Sàng</option>
                  <option value="THỦ THUẬT">Thủ Thuật</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>Tên dịch vụ kỹ thuật <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newServiceName"
                  name="serviceName"
                  placeholder="vd: Siêu âm tim Doppler màu"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Đơn vị tính <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newUnit"
                  name="unit"
                  placeholder="Lượt / Lần / Mẫu"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Thời lượng dự kiến (phút) <span class="required">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="newDuration"
                  name="duration"
                  min="5"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Phòng / Buồng kỹ thuật <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newRoomName"
                  name="room"
                  placeholder="vd: Phòng Siêu Âm 02"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Đơn giá niêm yết (VND) <span class="required">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="newServicePrice"
                  name="price"
                  min="0"
                  step="5000"
                  required
                  class="clinic-input"
                />
              </div>
            </div>

            @if (createFormError()) {
              <div class="error-banner">
                <app-clinic-icon name="alert-triangle" [size]="14"></app-clinic-icon>
                <span>{{ createFormError() }}</span>
              </div>
            }

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeCreateModal()">Hủy bỏ</button>
              <button type="submit" class="btn-submit">Lưu dịch vụ y tế</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .toolbar-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 20px;
        margin-bottom: 20px;
        gap: 16px;
        flex-wrap: wrap;
      }

      .search-box {
        position: relative;
        flex: 1;
        max-width: 420px;

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8C96A2;
        }

        .search-input {
          padding-left: 36px;
          width: 100%;
        }
      }

      .category-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .category-tab {
        background: #F6F3EC;
        border: 1px solid #E4DED2;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #5B6672;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
        }

        &.active {
          background: #0E4A55;
          border-color: #0E4A55;
          color: #FFFFFF;
          font-weight: 600;
        }
      }

      .table-card {
        padding: 0;
        overflow: hidden;
      }

      .clinic-table {
        width: 100%;
        border-collapse: collapse;

        th {
          background: #F8F6F0;
          color: #5B6672;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 12px 18px;
          border-bottom: 1px solid #E4DED2;
          text-align: left;
        }

        td {
          padding: 12px 18px;
          border-bottom: 1px solid #F0ECE1;
          font-size: 0.85rem;
          color: #1C2733;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: rgba(14, 74, 85, 0.02);
        }

        .inactive-row {
          background: rgba(0, 0, 0, 0.02);
          opacity: 0.65;
        }
      }

      .service-code {
        font-family: monospace;
        font-size: 0.8rem;
        font-weight: 700;
        background: rgba(28, 39, 51, 0.06);
        padding: 2px 6px;
        border-radius: 4px;
        color: #0E4A55;
      }

      .service-name {
        font-size: 0.92rem;
        color: #1C2733;
      }

      .category-badge {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 600;

        &.cat-kham {
          background: rgba(14, 74, 85, 0.12);
          color: #0E4A55;
        }
        &.cat-xetnghiem {
          background: rgba(184, 149, 90, 0.15);
          color: #8C6D34;
        }
        &.cat-hinhanh {
          background: rgba(94, 139, 126, 0.15);
          color: #2F5A4F;
        }
        &.cat-thamdo {
          background: rgba(28, 39, 51, 0.08);
          color: #1C2733;
        }
      }

      .room-name {
        font-size: 0.82rem;
        color: #5B6672;
      }

      .unit-duration-box {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 0.78rem;

        .unit-text {
          color: #1C2733;
        }

        .duration-text {
          color: #8C96A2;
        }
      }

      .price-text {
        font-size: 0.95rem;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 600;

        .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        &.active {
          background: rgba(94, 139, 126, 0.15);
          color: #2F5A4F;
          .dot {
            background: #5E8B7E;
          }
        }

        &.inactive {
          background: rgba(155, 61, 69, 0.12);
          color: #9B3D45;
          .dot {
            background: #9B3D45;
          }
        }
      }

      .action-cell {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-edit-price {
        background: rgba(14, 74, 85, 0.1);
        color: #0E4A55;
        border: 1px solid rgba(14, 74, 85, 0.25);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background: #0E4A55;
          color: #FFFFFF;
        }
      }

      .btn-toggle-status {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s ease;

        &.btn-pause {
          background: rgba(155, 61, 69, 0.1);
          color: #9B3D45;
          &:hover {
            background: #9B3D45;
            color: #FFFFFF;
          }
        }

        &.btn-resume {
          background: rgba(94, 139, 126, 0.12);
          color: #2F5A4F;
          &:hover {
            background: #5E8B7E;
            color: #FFFFFF;
          }
        }
      }

      .btn-gold {
        background: #B8955A;
        color: #FFFFFF;
        border: none;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background: #a3824b;
        }
      }

      .empty-state {
        text-align: center;
        padding: 48px 16px;
        color: #8C96A2;
        .empty-icon {
          font-size: 2.2rem;
          display: block;
          margin-bottom: 8px;
        }
      }

      // Modals
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(28, 39, 51, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-card {
        background: #FFFFFF;
        border-radius: 16px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        border: 1px solid #E4DED2;

        &.wide-card {
          max-width: 660px;
        }
      }

      .modal-header {
        padding: 16px 22px;
        background: #F8F6F0;
        border-bottom: 1px solid #E4DED2;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .modal-title {
          font-size: 1.15rem;
          color: #0E4A55;
          margin: 0;
        }

        .modal-close {
          background: transparent;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: #8C96A2;
        }
      }

      .modal-body {
        padding: 22px;
      }

      .target-service-banner {
        background: #F6F3EC;
        padding: 12px 16px;
        border-radius: 10px;
        border: 1px solid #E4DED2;
        margin-bottom: 18px;
        display: flex;
        gap: 12px;
        align-items: center;

        .target-code {
          font-family: monospace;
          background: #0E4A55;
          color: #FFFFFF;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .target-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.85rem;
        }
      }

      .modal-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 22px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;

        .full-width {
          grid-column: span 2;
        }
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1C2733;
        }

        .required {
          color: #9B3D45;
        }

        .price-input {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0E4A55;
        }
      }

      .error-banner {
        background: rgba(155, 61, 69, 0.1);
        border: 1px solid rgba(155, 61, 69, 0.3);
        padding: 8px 12px;
        border-radius: 8px;
        color: #9B3D45;
        font-size: 0.8125rem;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 10px;
        padding-top: 16px;
        border-top: 1px solid #F0ECE1;

        .btn-cancel {
          background: #F6F3EC;
          border: 1px solid #E4DED2;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-submit {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
          padding: 8px 22px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          &:hover {
            background: #145b68;
          }
        }
      }
    `,
  ],
})
export class AdminServicesComponent {
  private adminService = inject(AdminService);

  allServices = this.adminService.medicalServices;
  searchQuery = signal<string>('');
  selectedCategoryFilter = signal<string>('ALL');

  filteredServices = computed(() => {
    let list = this.allServices();
    const cat = this.selectedCategoryFilter();
    if (cat !== 'ALL') {
      list = list.filter((s) => s.category === cat);
    }
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.serviceName.toLowerCase().includes(q) ||
          s.serviceCode.toLowerCase().includes(q) ||
          s.roomName.toLowerCase().includes(q)
      );
    }
    return list;
  });

  getCategoryClass(category: string): string {
    switch (category) {
      case 'KHÁM BỆNH':
        return 'cat-kham';
      case 'XÉT NGHIỆM':
        return 'cat-xetnghiem';
      case 'CHẨN ĐOÁN HÌNH ẢNH':
        return 'cat-hinhanh';
      default:
        return 'cat-thamdo';
    }
  }

  // Edit Price Modal
  editPriceModalOpen = signal<boolean>(false);
  selectedServiceForEdit = signal<MedicalServiceItem | null>(null);
  newPriceValue = 0;

  openEditPriceModal(svc: MedicalServiceItem): void {
    this.selectedServiceForEdit.set(svc);
    this.newPriceValue = svc.price;
    this.editPriceModalOpen.set(true);
  }

  closeEditPriceModal(): void {
    this.editPriceModalOpen.set(false);
    this.selectedServiceForEdit.set(null);
  }

  submitUpdatePrice(): void {
    const svc = this.selectedServiceForEdit();
    if (!svc || this.newPriceValue < 0) return;

    this.adminService.updateServicePrice(svc.id, Number(this.newPriceValue));
    this.closeEditPriceModal();
  }

  // Soft status toggle (BR-21)
  toggleServiceStatus(svc: MedicalServiceItem): void {
    this.adminService.toggleServiceStatus(svc.id);
  }

  // Create Service Modal
  createModalOpen = signal<boolean>(false);
  createFormError = signal<string>('');

  newServiceCode = '';
  newServiceName = '';
  newCategory: 'KHÁM BỆNH' | 'XÉT NGHIỆM' | 'CHẨN ĐOÁN HÌNH ẢNH' | 'CẬN LÂM SÀNG' | 'THỦ THUẬT' = 'KHÁM BỆNH';
  newUnit = 'Lần';
  newDuration = 20;
  newRoomName = '';
  newServicePrice = 200000;

  openCreateModal(): void {
    this.createFormError.set('');
    this.newServiceCode = '';
    this.newServiceName = '';
    this.newCategory = 'KHÁM BỆNH';
    this.newUnit = 'Lần';
    this.newDuration = 20;
    this.newRoomName = '';
    this.newServicePrice = 200000;
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  submitCreateService(): void {
    if (!this.newServiceCode.trim() || !this.newServiceName.trim() || !this.newRoomName.trim()) {
      this.createFormError.set('Vui lòng nhập đầy đủ các trường thông tin bắt buộc (*).');
      return;
    }

    this.adminService.createMedicalService({
      serviceCode: this.newServiceCode.trim().toUpperCase(),
      serviceName: this.newServiceName.trim(),
      category: this.newCategory,
      price: Number(this.newServicePrice),
      roomName: this.newRoomName.trim(),
      unit: this.newUnit.trim(),
      estimatedDurationMinutes: Number(this.newDuration),
      isActive: true,
    });

    this.closeCreateModal();
  }
}
