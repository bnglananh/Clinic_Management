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
      badgeText="BÁO CÁO ĐIỀU HÀNH & QUẢN TRỊ"
      title="Báo Cáo Hoạt Động & Giám Sát Toàn Diện Phòng Khám"
      subtitle="Giám sát doanh thu viện phí, hiệu suất buồng khám, cảnh báo tồn kho dược phẩm và điều hành hệ thống."
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
        subText="Tồn kho dưới ngưỡng tối thiểu (≤ 10 đơn vị)"
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

      <!-- Right Column: Drug Low Stock Alert Card -->
      <div class="right-col">
        <div class="clinic-card alert-card">
          <div class="alert-top">
            <div class="alert-title-box">
              <span class="warning-badge">CẢNH BÁO • TỒN KHO NGUY CẤP</span>
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
    <!-- Executive Report PDF Modal Viewer -->
    @if (isReportModalOpen()) {
      <div class="report-modal-backdrop" (click)="closeReportModal()">
        <div class="report-modal-dialog" (click)="$event.stopPropagation()">
          <!-- Top Bar -->
          <div class="modal-top-bar">
            <div class="modal-title-wrap">
              <div class="modal-tags">
                <span class="report-type-badge">TÀI LIỆU BÁO CÁO VIỆN PHÍ CHUẨN A4 / PDF</span>
                <span class="report-ref">Mã: BC-DH-20261006</span>
              </div>
              <h2 class="modal-top-title font-serif">Bản Xem Trước Báo Cáo Hoạt Động & Doanh Thu Viện Phí</h2>
            </div>
            <div class="modal-actions-wrap">
              <button class="modal-btn-print" (click)="printReport()">
                <app-clinic-icon name="download" [size]="15"></app-clinic-icon>
                <span>In / Lưu PDF</span>
              </button>
              <button class="modal-btn-close" (click)="closeReportModal()">
                <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
              </button>
            </div>
          </div>

          <!-- Document Preview Canvas -->
          <div class="report-preview-scroll">
            <div class="report-a4-sheet" id="printable-report">
              <!-- Official Document Header -->
              <div class="sheet-header">
                <div class="sheet-clinic-info">
                  <div class="clinic-emblem">
                    <app-clinic-icon name="activity" [size]="24"></app-clinic-icon>
                  </div>
                  <div>
                    <h1 class="clinic-official-name">PHÒNG KHÁM ĐA KHOA QUỐC TẾ SMART CLINIC</h1>
                    <p class="clinic-address">341/13A Khuông Việt, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh</p>
                    <p class="clinic-sub-meta">Hotline: 1900 6868 • Email: bcaudit&#64;smartclinic.vn • Website: smartclinic.vn</p>
                  </div>
                </div>
                <div class="sheet-audit-box">
                  <div class="audit-row"><span>MÃ BÁO CÁO:</span> <strong>BC-DH-20261006</strong></div>
                  <div class="audit-row"><span>NGÀY TRÍCH XUẤT:</span> <strong>06/10/2026 17:30</strong></div>
                  <div class="audit-row"><span>KỲ BÁO CÁO:</span> <strong>Ca ngày 06/10/2026</strong></div>
                  <div class="audit-row"><span>TRẠNG THÁI:</span> <span class="status-approved">CHÍNH THỨC</span></div>
                </div>
              </div>

              <div class="sheet-divider"></div>

              <!-- Sheet Title -->
              <div class="sheet-title-center">
                <h2 class="main-report-heading">BÁO CÁO HOẠT ĐỘNG VẬN HÀNH & VIỆN PHÍ TỔNG HỢP</h2>
                <p class="main-report-sub">Trích xuất tự động từ Hệ thống Quản trị & Điều hành Y tế Toàn diện</p>
              </div>

              <!-- Section 1: KPI Summary -->
              <div class="sheet-section">
                <h3 class="sheet-sec-heading">I. TỔNG QUAN CHỈ SỐ HOẠT ĐỘNG TRONG NGÀY</h3>
                <div class="sheet-kpi-grid">
                  <div class="sheet-kpi-item">
                    <span class="kpi-title">Tổng doanh thu viện phí</span>
                    <span class="kpi-number text-teal">42.850.000 VNĐ</span>
                    <span class="kpi-desc">↑ 15.2% (Đạt 115% kế hoạch ngày)</span>
                  </div>
                  <div class="sheet-kpi-item">
                    <span class="kpi-title">Lượt tiếp nhận khám</span>
                    <span class="kpi-number">48 lượt bệnh</span>
                    <span class="kpi-desc">28 ca hoàn tất • 6 ca đang khám</span>
                  </div>
                  <div class="sheet-kpi-item">
                    <span class="kpi-title">Bác sĩ & Nhân sự trực</span>
                    <span class="kpi-number">{{ activeDoctorsCount() }} / {{ totalStaffCount() }} nhân sự</span>
                    <span class="kpi-desc">4 phòng khám chuyên khoa vận hành</span>
                  </div>
                  <div class="sheet-kpi-item">
                    <span class="kpi-title">Cảnh báo dược phẩm tồn thấp</span>
                    <span class="kpi-number text-burgundy">{{ criticalStockDrugs().length }} mặt hàng</span>
                    <span class="kpi-desc">Tồn kho ≤ 10 đơn vị cần bổ sung</span>
                  </div>
                </div>
              </div>

              <!-- Section 2: Department Revenue -->
              <div class="sheet-section">
                <h3 class="sheet-sec-heading">II. DOANH THU & HIỆU SUẤT THEO CHUYÊN KHOA TIẾP NHẬN</h3>
                <table class="sheet-table">
                  <thead>
                    <tr>
                      <th style="width: 50px;">STT</th>
                      <th>Chuyên khoa / Dịch vụ</th>
                      <th class="text-center" style="width: 110px;">Lượt khám</th>
                      <th class="text-right" style="width: 160px;">Doanh thu (VNĐ)</th>
                      <th class="text-center" style="width: 90px;">Tỷ trọng</th>
                      <th class="text-center" style="width: 130px;">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-center">01</td>
                      <td><strong>Khoa Tim Mạch</strong></td>
                      <td class="text-center">18 lượt</td>
                      <td class="text-right font-bold">15.600.000</td>
                      <td class="text-center">38%</td>
                      <td class="text-center"><span class="table-tag-success">Vượt chỉ tiêu</span></td>
                    </tr>
                    <tr>
                      <td class="text-center">02</td>
                      <td><strong>Khoa Nội Tổng Quát</strong></td>
                      <td class="text-center">16 lượt</td>
                      <td class="text-right font-bold">12.450.000</td>
                      <td class="text-center">29%</td>
                      <td class="text-center"><span class="table-tag-normal">Ổn định</span></td>
                    </tr>
                    <tr>
                      <td class="text-center">03</td>
                      <td><strong>Khoa Tiêu Hóa - Gan Mật</strong></td>
                      <td class="text-center">8 lượt</td>
                      <td class="text-right font-bold">7.800.000</td>
                      <td class="text-center">18%</td>
                      <td class="text-center"><span class="table-tag-normal">Ổn định</span></td>
                    </tr>
                    <tr>
                      <td class="text-center">04</td>
                      <td><strong>Cận Lâm Sàng (Xét nghiệm & CĐHA)</strong></td>
                      <td class="text-center">24 chỉ định</td>
                      <td class="text-right font-bold">7.000.000</td>
                      <td class="text-center">15%</td>
                      <td class="text-center"><span class="table-tag-normal">Ổn định</span></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="table-total-row">
                      <td colspan="2" class="text-center font-bold">TỔNG DOANH THU VIỆN PHÍ NGÀY</td>
                      <td class="text-center font-bold">48 lượt khám</td>
                      <td class="text-right font-bold text-teal" style="font-size: 1rem;">42.850.000 VNĐ</td>
                      <td class="text-center font-bold">100%</td>
                      <td class="text-center font-bold text-teal">ĐẠT 115%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Section 3: Critical Drug Stock List -->
              <div class="sheet-section">
                <h3 class="sheet-sec-heading">III. DANH MỤC THUỐC CẢNH BÁO TỒN KHO NGUY CẤP (≤ 10 ĐƠN VỊ)</h3>
                <table class="sheet-table">
                  <thead>
                    <tr>
                      <th style="width: 80px;">Mã thuốc</th>
                      <th>Tên thuốc & Biệt dược</th>
                      <th>Hoạt chất chính</th>
                      <th>Lô sản xuất - HSD</th>
                      <th class="text-center" style="width: 80px;">Đơn vị</th>
                      <th class="text-center" style="width: 90px;">Tồn kho</th>
                      <th class="text-center" style="width: 130px;">Khuyến nghị</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (drug of criticalStockDrugs(); track drug.id) {
                      <tr>
                        <td class="text-center font-mono font-bold">{{ drug.code }}</td>
                        <td><strong>{{ drug.name }}</strong></td>
                        <td>{{ drug.activeIngredient }}</td>
                        <td>{{ drug.batchNumber }} (HSD: {{ drug.expiryDate }})</td>
                        <td class="text-center">{{ drug.unit }}</td>
                        <td class="text-center font-bold text-burgundy">{{ drug.stockQuantity }}</td>
                        <td class="text-center"><span class="table-tag-warn">Nhập bổ sung gấp</span></td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="text-center text-teal" style="padding: 16px;">
                          Tất cả mặt hàng trong kho dược hiện ở mức an toàn trên 10 đơn vị.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Signatures -->
              <div class="sheet-signatures">
                <div class="sig-column">
                  <span class="sig-title">NGƯỜI LẬP BÁO CÁO</span>
                  <span class="sig-instruction">(Ký, ghi rõ họ tên)</span>
                  <div class="sig-placeholder"></div>
                  <span class="sig-name">Quản trị viên Hệ thống</span>
                </div>

                <div class="sig-column">
                  <span class="sig-title">KẾ TOÁN TRƯỞNG</span>
                  <span class="sig-instruction">(Ký, ghi rõ họ tên)</span>
                  <div class="sig-placeholder"></div>
                  <span class="sig-name">Trần Thị Thu Hà</span>
                </div>

                <div class="sig-column">
                  <span class="sig-title">GIÁM ĐỐC ĐIỀU HÀNH</span>
                  <span class="sig-instruction">(Ký, đóng dấu phê duyệt)</span>
                  <div class="sig-placeholder sig-stamp-wrap">
                    <span class="stamp-box">SMART CLINIC • ĐÃ DUYỆT</span>
                  </div>
                  <span class="sig-name">BS. CKII. Nguyễn Văn An</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="sheet-footer">
                <span>Hệ thống Quản lý Y tế Smart Clinic • Báo cáo xuất tự động lúc 06/10/2026 17:30</span>
                <span>Trang 1 / 1 • Lưu trữ nội bộ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
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

      /* Executive Report Modal Styles */
      .report-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(14, 20, 28, 0.75);
        backdrop-filter: blur(5px);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .report-modal-dialog {
        background: #1C2733;
        border-radius: 16px;
        width: 100%;
        max-width: 980px;
        max-height: 92vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      .modal-top-bar {
        padding: 16px 24px;
        background: #0E4A55;
        color: #FFFFFF;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      }

      .modal-tags {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
      }

      .report-type-badge {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        background: #B8955A;
        color: #1C2733;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .report-ref {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.75);
        font-family: monospace;
      }

      .modal-top-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #FFFFFF;
        margin: 0;
      }

      .modal-actions-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .modal-btn-print {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #B8955A;
        color: #1C2733;
        font-weight: 700;
        font-size: 0.825rem;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background: #c9a66b;
          transform: translateY(-1px);
        }
      }

      .modal-btn-close {
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: #FFFFFF;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      }

      .report-preview-scroll {
        padding: 30px 20px;
        overflow-y: auto;
        background: #24303d;
        display: flex;
        justify-content: center;
        flex: 1;
      }

      .report-a4-sheet {
        background: #FFFFFF;
        color: #1C2733;
        width: 100%;
        max-width: 820px;
        padding: 40px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        font-family: 'Times New Roman', Times, serif;
      }

      .sheet-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 16px;
      }

      .sheet-clinic-info {
        display: flex;
        gap: 14px;
        align-items: center;
      }

      .clinic-emblem {
        width: 44px;
        height: 44px;
        background: #0E4A55;
        color: #FFFFFF;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .clinic-official-name {
        font-size: 0.98rem;
        font-weight: 800;
        color: #0E4A55;
        margin: 0 0 4px 0;
        letter-spacing: 0.02em;
      }

      .clinic-address, .clinic-sub-meta {
        font-size: 0.76rem;
        color: #555555;
        margin: 2px 0;
        font-family: sans-serif;
      }

      .sheet-audit-box {
        text-align: right;
        font-size: 0.76rem;
        font-family: sans-serif;
        color: #333;
        background: #F6F3EC;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #E4DED2;
      }

      .audit-row {
        margin-bottom: 3px;
        &:last-child { margin-bottom: 0; }
        span { color: #666; margin-right: 4px; }
      }

      .status-approved {
        background: #dcfce7;
        color: #15803d;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.72rem;
      }

      .sheet-divider {
        height: 2px;
        background: #0E4A55;
        margin: 12px 0 20px 0;
      }

      .sheet-title-center {
        text-align: center;
        margin-bottom: 24px;
      }

      .main-report-heading {
        font-size: 1.35rem;
        font-weight: 800;
        color: #0E4A55;
        margin: 0 0 6px 0;
        letter-spacing: 0.04em;
      }

      .main-report-sub {
        font-size: 0.82rem;
        color: #666666;
        font-style: italic;
        margin: 0;
        font-family: sans-serif;
      }

      .sheet-section {
        margin-bottom: 22px;
      }

      .sheet-sec-heading {
        font-size: 0.85rem;
        font-weight: 700;
        color: #0E4A55;
        border-bottom: 1.5px solid #0E4A55;
        padding-bottom: 4px;
        margin: 0 0 12px 0;
        letter-spacing: 0.03em;
        font-family: sans-serif;
      }

      .sheet-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .sheet-kpi-item {
        border: 1px solid #E4DED2;
        background: #FAF8F5;
        padding: 10px 12px;
        border-radius: 6px;
        font-family: sans-serif;
      }

      .kpi-title {
        display: block;
        font-size: 0.74rem;
        color: #666666;
        margin-bottom: 4px;
      }

      .kpi-number {
        display: block;
        font-size: 1rem;
        font-weight: 800;
        color: #1C2733;
      }

      .kpi-desc {
        display: block;
        font-size: 0.68rem;
        color: #888888;
        margin-top: 3px;
      }

      .text-teal { color: #0E4A55 !important; }
      .text-burgundy { color: #9B3D45 !important; }

      .sheet-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
        font-family: sans-serif;

        th, td {
          border: 1px solid #D0C9BE;
          padding: 8px 10px;
        }

        th {
          background: #EFEBE4;
          color: #0E4A55;
          font-weight: 700;
          text-align: left;
        }

        .table-total-row {
          background: #E8F0F1;
          border-top: 2px solid #0E4A55;
        }

        .table-tag-success {
          color: #15803d;
          font-weight: 700;
          font-size: 0.76rem;
        }

        .table-tag-normal {
          color: #475569;
          font-size: 0.76rem;
        }

        .table-tag-warn {
          color: #b91c1c;
          font-weight: 700;
          font-size: 0.76rem;
        }
      }

      .sheet-signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 35px;
        padding-top: 15px;
        font-family: sans-serif;
      }

      .sig-column {
        width: 30%;
        text-align: center;
      }

      .sig-title {
        display: block;
        font-size: 0.8rem;
        font-weight: 700;
        color: #1C2733;
      }

      .sig-instruction {
        display: block;
        font-size: 0.7rem;
        font-style: italic;
        color: #777;
        margin-top: 2px;
      }

      .sig-placeholder {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sig-stamp-wrap {
        position: relative;
      }

      .stamp-box {
        border: 2px dashed #9B3D45;
        color: #9B3D45;
        font-weight: 800;
        font-size: 0.7rem;
        padding: 4px 8px;
        border-radius: 4px;
        transform: rotate(-6deg);
        letter-spacing: 0.05em;
      }

      .sig-name {
        display: block;
        font-size: 0.82rem;
        font-weight: 700;
        color: #1C2733;
      }

      .sheet-footer {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #D0C9BE;
        margin-top: 25px;
        padding-top: 8px;
        font-size: 0.7rem;
        color: #888888;
        font-family: sans-serif;
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
  isReportModalOpen = signal<boolean>(false);

  quickRestock(drug: PharmacyDrugItem): void {
    this.adminService.restockDrug(drug.id, 20);
    this.exportSuccessMessage.set(
      `Đã nhập bổ sung thành công 20 ${drug.unit} cho ${drug.name}. Tồn kho hiện tại: ${drug.stockQuantity + 20}.`
    );
  }

  exportExecutiveReport(): void {
    this.isReportModalOpen.set(true);
    this.exportSuccessMessage.set(
      'Báo cáo điều hành & viện phí ngày 06/10/2026 đã sẵn sàng. Quý vị có thể xem và in/lưu dưới định dạng PDF.'
    );
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
  }

  printReport(): void {
    const printContent = document.getElementById('printable-report');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Báo Cáo Viện Phí & Vận Hành - Smart Clinic</title>
            <meta charset="utf-8" />
            <style>
              @page { size: A4 portrait; margin: 12mm 15mm; }
              body { font-family: 'Times New Roman', Times, serif; color: #111; margin: 0; padding: 15px; font-size: 13px; line-height: 1.45; background: #fff; }
              .sheet-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0E4A55; padding-bottom: 12px; margin-bottom: 14px; }
              .sheet-clinic-info { display: flex; gap: 12px; align-items: center; }
              .clinic-emblem { width: 36px; height: 36px; border-radius: 6px; background: #0E4A55; color: #fff; display: flex; align-items: center; justify-content: center; }
              .clinic-official-name { font-size: 15px; font-weight: bold; color: #0E4A55; margin: 0 0 3px 0; text-transform: uppercase; }
              .clinic-address, .clinic-sub-meta { font-size: 11px; color: #444; margin: 1px 0; }
              .sheet-audit-box { font-size: 11px; text-align: right; }
              .audit-row { margin-bottom: 2px; }
              .status-approved { background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
              .sheet-title-center { text-align: center; margin: 18px 0 20px 0; }
              .main-report-heading { font-size: 18px; font-weight: bold; color: #0E4A55; margin: 0 0 4px 0; text-transform: uppercase; }
              .main-report-sub { font-size: 12px; color: #666; font-style: italic; margin: 0; }
              .sheet-sec-heading { font-size: 12px; font-weight: bold; color: #0E4A55; margin: 16px 0 8px 0; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
              .sheet-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
              .sheet-kpi-item { border: 1px solid #ddd; padding: 8px 10px; border-radius: 4px; background: #fafafa; }
              .kpi-title { font-size: 10.5px; color: #555; display: block; margin-bottom: 2px; }
              .kpi-number { font-size: 14px; font-weight: bold; color: #111; display: block; }
              .kpi-desc { font-size: 9.5px; color: #777; margin-top: 2px; display: block; }
              .text-teal { color: #0E4A55; }
              .text-burgundy { color: #9B3D45; }
              table.sheet-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11.5px; }
              table.sheet-table th, table.sheet-table td { border: 1px solid #bbb; padding: 6px 8px; }
              table.sheet-table th { background: #f0f4f5; color: #0E4A55; font-weight: bold; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .font-mono { font-family: monospace; }
              .table-total-row { background: #e9f2f4; }
              .table-tag-success { color: #15803d; font-weight: bold; }
              .table-tag-normal { color: #475569; }
              .table-tag-warn { color: #b91c1c; font-weight: bold; }
              .sheet-signatures { display: flex; justify-content: space-between; margin-top: 30px; page-break-inside: avoid; }
              .sig-column { width: 30%; text-align: center; }
              .sig-title { font-weight: bold; font-size: 11px; display: block; text-transform: uppercase; }
              .sig-instruction { font-size: 10px; font-style: italic; color: #666; display: block; margin-top: 2px; }
              .sig-placeholder { height: 55px; display: flex; align-items: center; justify-content: center; }
              .stamp-box { border: 2px dashed #9B3D45; color: #9B3D45; padding: 4px 8px; font-size: 9.5px; font-weight: bold; border-radius: 4px; transform: rotate(-5deg); }
              .sig-name { font-weight: bold; font-size: 11.5px; display: block; }
              .sheet-footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9.5px; color: #777; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
}
