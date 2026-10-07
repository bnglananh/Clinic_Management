import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StockBadgeComponent } from '../../../shared/components/stock-badge/stock-badge.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';
import { PharmacyDrugItem } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-pharmacy',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, StockBadgeComponent, ClinicIconComponent],
  template: `
    <app-page-header
      badgeText="KHO DƯỢC & DANH MỤC THUỐC • UC020 & UC021"
      title="Quản Lý Kho Dược & Danh Mục Thuốc Phòng Khám"
      subtitle="Giám sát tồn kho thời gian thực, cảnh báo thuốc nguy cấp (≤ 10 đơn vị theo BR-22) và quản lý xuất nhập kho."
    >
      <div actions>
        <button class="btn-gold" (click)="openCreateDrugModal()">
          <app-clinic-icon name="plus" [size]="16"></app-clinic-icon>
          <span>Thêm thuốc mới</span>
        </button>
      </div>
    </app-page-header>

    <!-- Stock KPI Summary Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-info">
          <span class="kpi-label">Tổng danh mục thuốc</span>
          <span class="kpi-val">{{ allDrugs().length }}</span>
          <span class="kpi-sub">{{ activeDrugsCount() }} mặt hàng đang cung ứng</span>
        </div>
        <div class="kpi-icon teal"><app-clinic-icon name="pill" [size]="22"></app-clinic-icon></div>
      </div>

      <div class="kpi-card highlight-critical">
        <div class="kpi-info">
          <span class="kpi-label text-burgundy">Tồn nguy cấp (≤ 10 đơn vị)</span>
          <span class="kpi-val text-burgundy">{{ criticalDrugsCount() }}</span>
          <span class="kpi-sub">Cần tạo đơn nhập kho gấp theo BR-22</span>
        </div>
        <div class="kpi-icon burgundy"><app-clinic-icon name="alert-triangle" [size]="22"></app-clinic-icon></div>
      </div>

      <div class="kpi-card">
        <div class="kpi-info">
          <span class="kpi-label text-gold">Sắp hết (11 - 30 đơn vị)</span>
          <span class="kpi-val text-gold">{{ lowStockDrugsCount() }}</span>
          <span class="kpi-sub">Đang trong ngưỡng theo dõi bổ sung</span>
        </div>
        <div class="kpi-icon gold"><app-clinic-icon name="box" [size]="22"></app-clinic-icon></div>
      </div>

      <div class="kpi-card">
        <div class="kpi-info">
          <span class="kpi-label">Ngừng kinh doanh (BR-21)</span>
          <span class="kpi-val">{{ discontinuedCount() }}</span>
          <span class="kpi-sub">Lưu trữ lịch sử, không xóa vật lý</span>
        </div>
        <div class="kpi-icon slate"><app-clinic-icon name="lock" [size]="22"></app-clinic-icon></div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="clinic-card toolbar-card">
      <div class="search-box">
        <app-clinic-icon name="search" [size]="16" class="search-icon"></app-clinic-icon>
        <input
          type="text"
          placeholder="Tìm tên thuốc, mã biệt dược, hoạt chất, nhà SX..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          class="clinic-input search-input"
        />
      </div>

      <div class="filter-tabs">
        <button
          type="button"
          class="filter-tab"
          [class.active]="selectedStockFilter() === 'ALL'"
          (click)="selectedStockFilter.set('ALL')"
        >
          Tất cả ({{ allDrugs().length }})
        </button>
        <button
          type="button"
          class="filter-tab critical-tab"
          [class.active]="selectedStockFilter() === 'CRITICAL'"
          (click)="selectedStockFilter.set('CRITICAL')"
        >
          Nguy cấp ≤ 10 ({{ criticalDrugsCount() }})
        </button>
        <button
          type="button"
          class="filter-tab"
          [class.active]="selectedStockFilter() === 'LOW'"
          (click)="selectedStockFilter.set('LOW')"
        >
          Sắp hết ({{ lowStockDrugsCount() }})
        </button>
        <button
          type="button"
          class="filter-tab"
          [class.active]="selectedStockFilter() === 'ACTIVE'"
          (click)="selectedStockFilter.set('ACTIVE')"
        >
          Đang kinh doanh ({{ activeDrugsCount() }})
        </button>
        <button
          type="button"
          class="filter-tab"
          [class.active]="selectedStockFilter() === 'DISCONTINUED'"
          (click)="selectedStockFilter.set('DISCONTINUED')"
        >
          Ngừng bán ({{ discontinuedCount() }})
        </button>
      </div>
    </div>

    <!-- Drug Catalogue Table -->
    <div class="clinic-card table-card">
      <div class="table-responsive">
        <table class="clinic-table">
          <thead>
            <tr>
              <th>Mã biệt dược</th>
              <th>Tên thuốc & Hoạt chất</th>
              <th>Quy cách</th>
              <th>Đơn giá (Nhập / Bán)</th>
              <th style="min-width: 140px;">Tồn kho & Cảnh báo</th>
              <th>Lô & Hạn dùng</th>
              <th>Nhà sản xuất</th>
              <th>Trạng thái</th>
              <th style="text-align: right;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (drug of filteredDrugs(); track drug.id) {
              <tr [class.discontinued-row]="drug.status === 'DISCONTINUED'">
                <td>
                  <span class="drug-code">{{ drug.code }}</span>
                </td>
                <td>
                  <div class="drug-main-info">
                    <span class="drug-name font-bold">{{ drug.name }}</span>
                    <span class="drug-sub">{{ drug.activeIngredient }} • {{ drug.strength }}</span>
                  </div>
                </td>
                <td>
                  <span class="unit-badge">{{ drug.unit }}</span>
                </td>
                <td>
                  <div class="price-box">
                    <span class="sale-price font-bold text-teal">{{ drug.salePrice | number }} đ</span>
                    <span class="import-price">Vốn: {{ drug.importPrice | number }} đ</span>
                  </div>
                </td>
                <td>
                  <app-stock-badge
                    [stockQuantity]="drug.stockQuantity"
                    [unit]="drug.unit"
                  ></app-stock-badge>
                </td>
                <td>
                  <div class="batch-box">
                    <span class="batch-num">Lô: {{ drug.batchNumber }}</span>
                    <span class="expiry-date">HSD: {{ drug.expiryDate }}</span>
                  </div>
                </td>
                <td>
                  <span class="mfr-text">{{ drug.manufacturer }}</span>
                </td>
                <td>
                  <span
                    class="status-pill"
                    [class.active]="drug.status === 'ACTIVE'"
                    [class.discontinued]="drug.status === 'DISCONTINUED'"
                  >
                    {{ drug.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="action-cell">
                    <button
                      class="btn-restock"
                      (click)="openRestockModal(drug)"
                      title="Nhập thêm hàng vào kho"
                    >
                      + Nhập kho
                    </button>
                    <button
                      class="btn-toggle-status"
                      [class.btn-stop]="drug.status === 'ACTIVE'"
                      [class.btn-resume]="drug.status === 'DISCONTINUED'"
                      (click)="toggleDrugStatus(drug)"
                      [title]="drug.status === 'ACTIVE' ? 'Chuyển sang ngừng kinh doanh (BR-21)' : 'Kích hoạt lại thuốc này'"
                    >
                      {{ drug.status === 'ACTIVE' ? 'Ngừng bán' : 'Bán lại' }}
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="empty-state">
                  <app-clinic-icon name="pill" [size]="36" class="empty-icon"></app-clinic-icon>
                  <p>Không tìm thấy mặt hàng thuốc nào theo điều kiện tìm kiếm.</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Restock Modal (UC021) -->
    @if (restockModalOpen() && selectedDrugForRestock()) {
      <div class="modal-backdrop" (click)="closeRestockModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title font-serif">
              <app-clinic-icon name="box" [size]="18"></app-clinic-icon>
              <span>Nhập Kho Bổ Sung Thuốc</span>
            </h3>
            <button class="modal-close" (click)="closeRestockModal()">
              <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
            </button>
          </div>

          <div class="modal-body">
            <div class="target-drug-banner">
              <span class="target-code">{{ selectedDrugForRestock()!.code }}</span>
              <div class="target-details">
                <span class="target-name font-bold">{{ selectedDrugForRestock()!.name }}</span>
                <span class="target-current">Tồn kho hiện tại: <strong>{{ selectedDrugForRestock()!.stockQuantity }} {{ selectedDrugForRestock()!.unit }}</strong></span>
              </div>
            </div>

            <form (ngSubmit)="submitRestock()" class="modal-form">
              <div class="form-group">
                <label>Số lượng nhập thêm ({{ selectedDrugForRestock()!.unit }}) <span class="required">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="restockQuantity"
                  name="restockQty"
                  min="1"
                  required
                  class="clinic-input qty-input"
                />
              </div>

              <div class="form-group">
                <label>Số lô sản xuất mới</label>
                <input
                  type="text"
                  [(ngModel)]="restockBatchNumber"
                  name="batchNumber"
                  placeholder="Để trống nếu cùng lô cũ"
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Hạn sử dụng mới (YYYY-MM-DD)</label>
                <input
                  type="date"
                  [(ngModel)]="restockExpiryDate"
                  name="expiryDate"
                  class="clinic-input"
                />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="closeRestockModal()">Hủy</button>
                <button type="submit" class="btn-submit">Xác nhận nhập kho</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Create Drug Modal (UC020) -->
    @if (createModalOpen()) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal-card wide-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title font-serif">
              <app-clinic-icon name="plus" [size]="18"></app-clinic-icon>
              <span>Khai Báo Biệt Dược Mới (UC020)</span>
            </h3>
            <button class="modal-close" (click)="closeCreateModal()">
              <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
            </button>
          </div>

          <form (ngSubmit)="submitCreateDrug()" class="modal-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Mã biệt dược <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newDrugCode"
                  name="code"
                  placeholder="vd: KLA500"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Tên thương mại biệt dược <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newDrugName"
                  name="name"
                  placeholder="vd: Klacid 500mg"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Hoạt chất chính <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newActiveIngredient"
                  name="activeIngredient"
                  placeholder="vd: Clarithromycin"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Hàm lượng <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newStrength"
                  name="strength"
                  placeholder="vd: 500mg"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Đơn vị đóng gói <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newUnit"
                  name="unit"
                  placeholder="vd: Hộp 14 viên"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Số lượng tồn ban đầu <span class="required">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="newInitialStock"
                  name="stock"
                  min="0"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Giá nhập (VND) <span class="required">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="newImportPrice"
                  name="importPrice"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Giá bán niêm yết (VND) <span class="required">*</span></label>
                <input
                  type="number"
                  [(ngModel)]="newSalePrice"
                  name="salePrice"
                  required
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Số lô sản xuất</label>
                <input
                  type="text"
                  [(ngModel)]="newBatch"
                  name="batch"
                  placeholder="vd: KC-2026-05"
                  class="clinic-input"
                />
              </div>

              <div class="form-group">
                <label>Hạn sử dụng</label>
                <input
                  type="date"
                  [(ngModel)]="newExpiry"
                  name="expiry"
                  class="clinic-input"
                />
              </div>

              <div class="form-group full-width">
                <label>Hãng / Nhà sản xuất <span class="required">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="newManufacturer"
                  name="mfr"
                  placeholder="vd: Abbott Laboratories"
                  required
                  class="clinic-input"
                />
              </div>
            </div>

            @if (createFormError()) {
              <div class="error-banner">
                <app-clinic-icon name="alert-triangle" [size]="16"></app-clinic-icon>
                <span>{{ createFormError() }}</span>
              </div>
            }

            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeCreateModal()">Hủy bỏ</button>
              <button type="submit" class="btn-submit">Lưu danh mục thuốc</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      @media (max-width: 1200px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .kpi-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 14px;
        padding: 18px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        &.highlight-critical {
          border-color: rgba(155, 61, 69, 0.4);
          background: #FFF9F9;
        }

        .kpi-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-label {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #5B6672;
        }

        .kpi-val {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1C2733;
          line-height: 1.1;
        }

        .kpi-sub {
          font-size: 0.75rem;
          color: #8C96A2;
        }

        .kpi-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;

          &.teal {
            background: rgba(14, 74, 85, 0.1);
          }
          &.burgundy {
            background: rgba(155, 61, 69, 0.15);
          }
          &.gold {
            background: rgba(184, 149, 90, 0.15);
          }
          &.slate {
            background: rgba(28, 39, 51, 0.08);
          }
        }
      }

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

      .filter-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .filter-tab {
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

        &.critical-tab {
          color: #9B3D45;
          &.active {
            background: #9B3D45;
            border-color: #9B3D45;
            color: #FFFFFF;
          }
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

        .discontinued-row {
          background: rgba(0, 0, 0, 0.02);
          opacity: 0.65;
        }
      }

      .drug-code {
        font-family: monospace;
        font-size: 0.8rem;
        font-weight: 700;
        background: rgba(28, 39, 51, 0.06);
        padding: 2px 6px;
        border-radius: 4px;
        color: #0E4A55;
      }

      .drug-main-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .drug-name {
        font-size: 0.92rem;
        color: #1C2733;
      }

      .drug-sub {
        font-size: 0.76rem;
        color: #5B6672;
      }

      .unit-badge {
        font-size: 0.78rem;
        color: #5B6672;
        background: #F6F3EC;
        padding: 2px 8px;
        border-radius: 6px;
      }

      .price-box {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .sale-price {
          font-size: 0.88rem;
        }

        .import-price {
          font-size: 0.72rem;
          color: #8C96A2;
        }
      }

      .batch-box {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 0.75rem;

        .batch-num {
          color: #1C2733;
          font-weight: 500;
        }

        .expiry-date {
          color: #5B6672;
        }
      }

      .mfr-text {
        font-size: 0.8rem;
        color: #5B6672;
      }

      .status-pill {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 600;

        &.active {
          background: rgba(94, 139, 126, 0.15);
          color: #2F5A4F;
        }

        &.discontinued {
          background: rgba(155, 61, 69, 0.15);
          color: #9B3D45;
        }
      }

      .action-cell {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-restock {
        background: rgba(184, 149, 90, 0.15);
        color: #8C6C32;
        border: 1px solid #B8955A;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background: #B8955A;
          color: #FFFFFF;
        }
      }

      .btn-toggle-status {
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s ease;

        &.btn-stop {
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
        max-width: 500px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        border: 1px solid #E4DED2;

        &.wide-card {
          max-width: 680px;
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

      .target-drug-banner {
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

        .qty-input {
          font-size: 1.1rem;
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
export class AdminPharmacyComponent {
  private adminService = inject(AdminService);

  allDrugs = this.adminService.pharmacyDrugs;
  searchQuery = signal<string>('');
  selectedStockFilter = signal<string>('ALL');

  criticalDrugsCount = computed(
    () => this.allDrugs().filter((d) => d.status === 'ACTIVE' && d.stockQuantity <= 10).length
  );

  lowStockDrugsCount = computed(
    () => this.allDrugs().filter((d) => d.status === 'ACTIVE' && d.stockQuantity > 10 && d.stockQuantity <= 30).length
  );

  activeDrugsCount = computed(
    () => this.allDrugs().filter((d) => d.status === 'ACTIVE').length
  );

  discontinuedCount = computed(
    () => this.allDrugs().filter((d) => d.status === 'DISCONTINUED').length
  );

  filteredDrugs = computed(() => {
    let list = this.allDrugs();
    const filter = this.selectedStockFilter();

    if (filter === 'CRITICAL') {
      list = list.filter((d) => d.status === 'ACTIVE' && d.stockQuantity <= 10);
    } else if (filter === 'LOW') {
      list = list.filter((d) => d.status === 'ACTIVE' && d.stockQuantity > 10 && d.stockQuantity <= 30);
    } else if (filter === 'ACTIVE') {
      list = list.filter((d) => d.status === 'ACTIVE');
    } else if (filter === 'DISCONTINUED') {
      list = list.filter((d) => d.status === 'DISCONTINUED');
    }

    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.activeIngredient.toLowerCase().includes(q) ||
          d.manufacturer.toLowerCase().includes(q)
      );
    }
    return list;
  });

  // Restock Modal State (UC021)
  restockModalOpen = signal<boolean>(false);
  selectedDrugForRestock = signal<PharmacyDrugItem | null>(null);
  restockQuantity = 20;
  restockBatchNumber = '';
  restockExpiryDate = '';

  openRestockModal(drug: PharmacyDrugItem): void {
    this.selectedDrugForRestock.set(drug);
    this.restockQuantity = 20;
    this.restockBatchNumber = drug.batchNumber;
    this.restockExpiryDate = drug.expiryDate;
    this.restockModalOpen.set(true);
  }

  closeRestockModal(): void {
    this.restockModalOpen.set(false);
    this.selectedDrugForRestock.set(null);
  }

  submitRestock(): void {
    const drug = this.selectedDrugForRestock();
    if (!drug || this.restockQuantity <= 0) return;

    this.adminService.restockDrug(
      drug.id,
      this.restockQuantity,
      this.restockBatchNumber,
      this.restockExpiryDate
    );
    this.closeRestockModal();
  }

  // Soft status toggle (BR-21)
  toggleDrugStatus(drug: PharmacyDrugItem): void {
    this.adminService.toggleDrugStatus(drug.id);
  }

  // Create Drug Modal State (UC020)
  createModalOpen = signal<boolean>(false);
  createFormError = signal<string>('');

  newDrugCode = '';
  newDrugName = '';
  newActiveIngredient = '';
  newStrength = '';
  newUnit = 'Hộp 30 viên';
  newInitialStock = 50;
  newImportPrice = 150000;
  newSalePrice = 190000;
  newBatch = 'BATCH-2026-01';
  newExpiry = '2028-12-31';
  newManufacturer = '';

  openCreateDrugModal(): void {
    this.createFormError.set('');
    this.newDrugCode = '';
    this.newDrugName = '';
    this.newActiveIngredient = '';
    this.newStrength = '';
    this.newUnit = 'Hộp 30 viên';
    this.newInitialStock = 50;
    this.newImportPrice = 150000;
    this.newSalePrice = 190000;
    this.newBatch = 'BATCH-2026-01';
    this.newExpiry = '2028-12-31';
    this.newManufacturer = '';
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  submitCreateDrug(): void {
    if (
      !this.newDrugCode.trim() ||
      !this.newDrugName.trim() ||
      !this.newActiveIngredient.trim() ||
      !this.newStrength.trim() ||
      !this.newManufacturer.trim()
    ) {
      this.createFormError.set('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*).');
      return;
    }

    this.adminService.createDrug({
      code: this.newDrugCode.trim().toUpperCase(),
      name: this.newDrugName.trim(),
      activeIngredient: this.newActiveIngredient.trim(),
      strength: this.newStrength.trim(),
      unit: this.newUnit.trim(),
      importPrice: Number(this.newImportPrice),
      salePrice: Number(this.newSalePrice),
      stockQuantity: Number(this.newInitialStock),
      minAlertThreshold: 10, // BR-22
      batchNumber: this.newBatch.trim(),
      expiryDate: this.newExpiry,
      manufacturer: this.newManufacturer.trim(),
      status: 'ACTIVE',
    });

    this.closeCreateModal();
  }
}
