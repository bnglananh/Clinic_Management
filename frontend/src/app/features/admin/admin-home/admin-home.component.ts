import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StockBadgeComponent } from '../../../shared/components/stock-badge/stock-badge.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';
import { AdminService } from '../../../core/services/admin.service';
import { PharmacyDrugItem } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    StatCardComponent,
    StockBadgeComponent,
    ClinicIconComponent,
  ],
  template: `
    <app-page-header
      badgeText="BÁO CÁO ĐIỀU HÀNH & QUẢN TRỊ • UC024"
      title="Báo Cáo Hoạt Động & Giám Sát Toàn Diện Phòng Khám"
      subtitle="Giám sát doanh thu viện phí, hiệu suất buồng khám, cảnh báo tồn kho dược phẩm (BR-22) và điều hành hệ thống."
    >
      <div actions>
        <button class="export-report-btn" (click)="exportExecutiveReport()">
          <app-clinic-icon name="download" [size]="16"></app-clinic-icon>
          <span>Xuất báo cáo viện phí & vận hành</span>
        </button>
      </div>
    </app-page-header>

    @if (exportSuccessMessage()) {
      <div class="toast-banner animate-fade-in-up">
        <div class="toast-content">
          <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
          <span>{{ exportSuccessMessage() }}</span>
        </div>
        <button class="toast-close" (click)="exportSuccessMessage.set('')">
          <app-clinic-icon name="close" [size]="14"></app-clinic-icon>
        </button>
      </div>
    }

    <!-- Top Key Metrics Cards -->
    <div class="admin-stats-grid">
      <app-stat-card
        title="Doanh thu hôm nay"
        value="42.850.000"
        unit="VND"
        subText="Đạt 115% kế hoạch chỉ tiêu ngày"
        trendText="15.2%"
        [trendPositive]="true"
        iconName="wallet"
        iconBg="rgba(94, 139, 126, 0.15)"
        iconColor="#5E8B7E"
      ></app-stat-card>

      <app-stat-card
        title="Lượt khám trong ngày"
        value="48"
        unit="lượt"
        subText="28 ca hoàn tất, 6 ca đang khám"
        iconName="users"
      ></app-stat-card>

      <app-stat-card
        title="Cảnh báo tồn kho thuốc"
        [value]="criticalStockDrugs().length.toString()"
        unit="mặt hàng"
        subText="Tồn kho ≤ 10 đơn vị (theo BR-22)"
        iconName="alert-triangle"
        iconBg="rgba(155, 61, 69, 0.15)"
        iconColor="#9B3D45"
        [isHighlight]="criticalStockDrugs().length > 0"
      ></app-stat-card>

      <app-stat-card
        title="Bác sĩ đang trực"
        [value]="activeDoctorsCount() + ' / ' + totalStaffCount()"
        unit="bác sĩ"
        subText="4 phòng khám chuyên khoa"
        iconName="stethoscope"
      ></app-stat-card>
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-main-grid">
      <!-- Left Column: Department Performance & Analytics -->
      <div class="left-col">
        <!-- Department Performance -->
        <div class="clinic-card card-section">
          <div class="section-header">
            <h3 class="section-title font-serif">Hiệu Suất Tiếp Nhận & Doanh Thu Theo Chuyên Khoa</h3>
            <span class="section-sub">Dữ liệu tổng hợp thời gian thực hôm nay</span>
          </div>

          <div class="dept-stats-list">
            <div class="dept-stat-row">
              <div class="dept-info">
                <span class="dept-name font-bold">Khoa Tim Mạch</span>
                <span class="dept-meta">18 lượt khám • 15.600.000 đ</span>
              </div>
              <div class="dept-progress-track">
                <div class="dept-progress-fill" style="width: 38%; background: #0E4A55;"></div>
              </div>
              <span class="dept-pct">38%</span>
            </div>

            <div class="dept-stat-row">
              <div class="dept-info">
                <span class="dept-name font-bold">Khoa Nội Tổng Quát</span>
                <span class="dept-meta">16 lượt khám • 12.450.000 đ</span>
              </div>
              <div class="dept-progress-track">
                <div class="dept-progress-fill" style="width: 29%; background: #5E8B7E;"></div>
              </div>
              <span class="dept-pct">29%</span>
            </div>

            <div class="dept-stat-row">
              <div class="dept-info">
                <span class="dept-name font-bold">Khoa Tiêu Hóa - Gan Mật</span>
                <span class="dept-meta">8 lượt khám • 7.800.000 đ</span>
              </div>
              <div class="dept-progress-track">
                <div class="dept-progress-fill" style="width: 18%; background: #B8955A;"></div>
              </div>
              <span class="dept-pct">18%</span>
            </div>

            <div class="dept-stat-row">
              <div class="dept-info">
                <span class="dept-name font-bold">Cận Lâm Sàng (XN & CĐHA)</span>
                <span class="dept-meta">24 chỉ định • 7.000.000 đ</span>
              </div>
              <div class="dept-progress-track">
                <div class="dept-progress-fill" style="width: 15%; background: #1C2733;"></div>
              </div>
              <span class="dept-pct">15%</span>
            </div>
          </div>
        </div>

        <!-- Quick Administration Navigation -->
        <div class="clinic-card card-section">
          <div class="section-header">
            <h3 class="section-title font-serif">Lối Tắt Quản Trị Hệ Thống</h3>
            <span class="section-sub">Truy cập nhanh các phân hệ nghiệp vụ Admin</span>
          </div>

          <div class="admin-nav-cards">
            <a routerLink="/admin/users" class="quick-admin-card">
              <span class="quick-icon">
                <app-clinic-icon name="shield" [size]="20"></app-clinic-icon>
              </span>
              <div class="quick-text">
                <span class="quick-title font-bold">Tài khoản & Phân quyền</span>
                <span class="quick-desc">Quản lý {{ totalStaffCount() }} nhân viên, cấp vai trò RBAC</span>
              </div>
              <app-clinic-icon name="chevron-right" [size]="16" class="quick-arrow"></app-clinic-icon>
            </a>

            <a routerLink="/admin/pharmacy" class="quick-admin-card">
              <span class="quick-icon">
                <app-clinic-icon name="pill" [size]="20"></app-clinic-icon>
              </span>
              <div class="quick-text">
                <span class="quick-title font-bold">Kho Dược & Tồn Kho</span>
                <span class="quick-desc">{{ totalDrugsCount() }} mặt hàng, cảnh báo tồn khẩn</span>
              </div>
              <app-clinic-icon name="chevron-right" [size]="16" class="quick-arrow"></app-clinic-icon>
            </a>

            <a routerLink="/admin/services" class="quick-admin-card">
              <span class="quick-icon">
                <app-clinic-icon name="flask" [size]="20"></app-clinic-icon>
              </span>
              <div class="quick-text">
                <span class="quick-title font-bold">Danh Mục Dịch Vụ & Bảng Giá</span>
                <span class="quick-desc">{{ totalServicesCount() }} dịch vụ khám và cận lâm sàng</span>
              </div>
              <app-clinic-icon name="chevron-right" [size]="16" class="quick-arrow"></app-clinic-icon>
            </a>

            <a routerLink="/admin/schedules" class="quick-admin-card">
              <span class="quick-icon">
                <app-clinic-icon name="calendar" [size]="20"></app-clinic-icon>
              </span>
              <div class="quick-text">
                <span class="quick-title font-bold">Lịch Trực Bác Sĩ</span>
                <span class="quick-desc">Phân ca sáng/chiều/tối & buồng khám</span>
              </div>
              <app-clinic-icon name="chevron-right" [size]="16" class="quick-arrow"></app-clinic-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- Right Column: Drug Low Stock Alert Card (BR-22) -->
      <div class="right-col">
        <div class="clinic-card alert-card">
          <div class="alert-top">
            <div class="alert-title-box">
              <span class="warning-badge">QUY TẮC BR-22 • TỒN KHO NGUY CẤP</span>
              <h3 class="clinic-section-title">Thuốc Cần Nhập Bổ Sung (≤ 10 đơn vị)</h3>
            </div>
            <a routerLink="/admin/pharmacy" class="restock-link-btn">Quản lý kho dược</a>
          </div>

          <div class="stock-list">
            @for (drug of criticalStockDrugs(); track drug.id) {
              <div class="stock-item">
                <div class="med-info">
                  <div class="med-code-name">
                    <span class="med-code">{{ drug.code }}</span>
                    <span class="med-name font-bold">{{ drug.name }}</span>
                  </div>
                  <span class="med-desc">{{ drug.activeIngredient }} • {{ drug.unit }}</span>
                  <span class="med-mfr">Lô: {{ drug.batchNumber }} - HSD: {{ drug.expiryDate }}</span>
                </div>
                <div class="stock-action-box">
                  <app-stock-badge
                    [stockQuantity]="drug.stockQuantity"
                    [unit]="drug.unit"
                  ></app-stock-badge>
                  <button class="quick-restock-btn" (click)="quickRestock(drug)">
                    Nhập 20 {{ drug.unit }}
                  </button>
                </div>
              </div>
            } @empty {
              <div class="no-critical-box">
                <app-clinic-icon name="check" [size]="24" class="safe-icon"></app-clinic-icon>
                <p>Kho dược an toàn. Hiện không có thuốc nào dưới ngưỡng cảnh báo 10 đơn vị.</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .export-report-btn {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 9px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background: #135d6b;
        }
      }

      .toast-banner {
        background: #0E4A55;
        color: #FFFFFF;
        padding: 12px 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
        box-shadow: 0 4px 12px rgba(14, 74, 85, 0.2);

        .toast-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          cursor: pointer;
          &:hover {
            color: #FFFFFF;
          }
        }
      }

      .admin-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      @media (max-width: 1200px) {
        .admin-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .dashboard-main-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 24px;
      }

      @media (max-width: 1100px) {
        .dashboard-main-grid {
          grid-template-columns: 1fr;
        }
      }

      .card-section {
        padding: 24px;
        margin-bottom: 24px;
      }

      .section-header {
        margin-bottom: 20px;

        .section-title {
          font-size: 1.15rem;
          color: #0E4A55;
          margin: 0 0 4px 0;
        }

        .section-sub {
          font-size: 0.8rem;
          color: #8C96A2;
        }
      }

      .dept-stats-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .dept-stat-row {
        display: flex;
        align-items: center;
        gap: 16px;

        .dept-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 220px;
        }

        .dept-name {
          font-size: 0.88rem;
          color: #1C2733;
        }

        .dept-meta {
          font-size: 0.75rem;
          color: #5B6672;
        }

        .dept-progress-track {
          flex: 1;
          height: 8px;
          background: #E4DED2;
          border-radius: 999px;
          overflow: hidden;
        }

        .dept-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .dept-pct {
          font-size: 0.82rem;
          font-weight: 700;
          color: #1C2733;
          width: 40px;
          text-align: right;
        }
      }

      .admin-nav-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      @media (max-width: 600px) {
        .admin-nav-cards {
          grid-template-columns: 1fr;
        }
      }

      .quick-admin-card {
        background: #F8F6F0;
        border: 1px solid #E4DED2;
        padding: 16px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 14px;
        text-decoration: none;
        transition: all 0.2s ease;

        &:hover {
          background: #FFFFFF;
          border-color: #0E4A55;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(14, 74, 85, 0.08);

          .quick-arrow {
            transform: translateX(4px);
            color: #0E4A55;
          }
        }

        .quick-icon {
          font-size: 1.4rem;
        }

        .quick-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .quick-title {
          font-size: 0.88rem;
          color: #1C2733;
        }

        .quick-desc {
          font-size: 0.75rem;
          color: #5B6672;
        }

        .quick-arrow {
          font-size: 1.1rem;
          color: #8C96A2;
          transition: transform 0.2s ease;
        }
      }

      .alert-card {
        padding: 24px;
        background: #FFFFFF;
      }

      .alert-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 12px;
      }

      .warning-badge {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #9B3D45;
        background: rgba(155, 61, 69, 0.12);
        padding: 3px 10px;
        border-radius: 999px;
        display: inline-block;
        margin-bottom: 6px;
      }

      .restock-link-btn {
        background: rgba(184, 149, 90, 0.15);
        color: #8C6C32;
        border: 1px solid #B8955A;
        padding: 6px 14px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.8rem;
        text-decoration: none;
        transition: all 0.2s ease;

        &:hover {
          background: #B8955A;
          color: #FFFFFF;
        }
      }

      .stock-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .stock-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        background: #FAF8F5;
        border-radius: 12px;
        border: 1px solid #E4DED2;
        gap: 12px;
      }

      .med-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .med-code-name {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .med-code {
        font-family: monospace;
        font-size: 0.75rem;
        background: rgba(155, 61, 69, 0.12);
        color: #9B3D45;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
      }

      .med-name {
        font-size: 0.9rem;
        color: #1C2733;
      }

      .med-desc {
        font-size: 0.78rem;
        color: #5B6672;
      }

      .med-mfr {
        font-size: 0.72rem;
        color: #8C96A2;
      }

      .stock-action-box {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
      }

      .quick-restock-btn {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.74rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #145b68;
        }
      }

      .no-critical-box {
        text-align: center;
        padding: 36px 16px;
        color: #5E8B7E;
        background: rgba(94, 139, 126, 0.08);
        border-radius: 12px;

        .safe-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 6px;
        }
      }
    `,
  ],
})
export class AdminHomeComponent {
  private adminService = inject(AdminService);
  private router = inject(Router);

  criticalStockDrugs = this.adminService.criticalStockDrugs;
  totalStaffCount = this.adminService.totalStaffCount;
  activeDoctorsCount = computed(() => this.adminService.activeDoctors().length);
  totalDrugsCount = computed(() => this.adminService.pharmacyDrugs().length);
  totalServicesCount = computed(() => this.adminService.medicalServices().length);

  exportSuccessMessage = signal<string>('');

  quickRestock(drug: PharmacyDrugItem): void {
    this.adminService.restockDrug(drug.id, 20);
    this.exportSuccessMessage.set(
      `Đã nhập bổ sung thành công 20 ${drug.unit} cho ${drug.name}. Tồn kho hiện tại: ${drug.stockQuantity + 20}.`
    );
  }

  exportExecutiveReport(): void {
    this.exportSuccessMessage.set(
      'Báo cáo điều hành & viện phí ngày 06/10/2026 đã được xuất thành công dưới định dạng PDF/Excel.'
    );
  }
}
