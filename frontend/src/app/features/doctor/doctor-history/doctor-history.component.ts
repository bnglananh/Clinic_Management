import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicalService } from '../../../core/services/medical.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';
import { MedicalRecord } from '../../../core/models/medical-record.model';

@Component({
  selector: 'app-doctor-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    ClinicIconComponent,
  ],
  template: `
    <div class="doctor-history-page">
      <app-page-header
        badgeText="KHO LƯU TRỮ EMR"
        title="Lịch Sử Bệnh Án Điện Tử Đã Khóa"
        subtitle="Tuân thủ quy tắc BR-23: Hồ sơ y khoa đã hoàn tất được lưu trữ bất biến, bảo vệ tính pháp lý"
      >
        <div actions class="header-actions">
          <button class="btn-workspace" (click)="goToWorkspace()">
            ← Trở lại Clinical Workspace
          </button>
        </div>
      </app-page-header>

      <!-- Search bar -->
      <div class="search-panel">
        <div class="search-wrap">
          <app-clinic-icon name="search" [size]="16" class="search-icon"></app-clinic-icon>
          <input
            type="text"
            class="search-input"
            [(ngModel)]="searchKeyword"
            placeholder="Tìm theo Tên bệnh nhân, Mã hồ sơ, Số phiếu khám (A-012, Nguyễn Văn Hùng...)"
          />
        </div>
        <div class="stats-summary">
          <span>Tổng số hồ sơ đã khóa: <strong>{{ allRecords().length }}</strong></span>
        </div>
      </div>

      <!-- History Table -->
      <div class="history-table-card">
        <table class="hist-table">
          <thead>
            <tr>
              <th>Mã EMR</th>
              <th>Số Phiếu</th>
              <th>Bệnh Nhân</th>
              <th>Chẩn Đoán Chính</th>
              <th>Ngày Khám</th>
              <th>Bác Sĩ</th>
              <th>Phiên Bản / Phụ Lục</th>
              <th>Trạng Thái EMR</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            @for (rec of filteredRecords(); track rec.id) {
              <tr>
                <td><strong class="text-teal font-mono">{{ rec.id }}</strong></td>
                <td><span class="ticket-pill">{{ rec.ticketNumber }}</span></td>
                <td>
                  <strong>{{ rec.patientName }}</strong>
                  <div class="text-xs text-muted">{{ rec.patientCode }} • {{ rec.patientGender === 'MALE' ? 'Nam' : 'Nữ' }}</div>
                </td>
                <td>
                  @if (rec.diagnoses && rec.diagnoses.length > 0) {
                    <span>{{ rec.diagnoses[0].nameVi }}</span>
                    <small class="text-muted">({{ rec.diagnoses[0].code }})</small>
                  } @else {
                    <span class="text-muted">--</span>
                  }
                </td>
                <td>{{ rec.visitDate | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ rec.doctorName }}</td>
                <td>
                  <span class="version-tag">
                    v{{ rec.version }}.0
                    @if (rec.amendments && rec.amendments.length > 0) {
                      ({{ rec.amendments.length }} phụ lục)
                    }
                  </span>
                </td>
                <td>
                  <span class="locked-badge">
                    <app-clinic-icon name="lock" [size]="12"></app-clinic-icon>
                    <span>Đã khóa (BR-23)</span>
                  </span>
                </td>
                <td>
                  <button class="btn-view" (click)="viewRecordDetail(rec)">
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="text-center py-5 text-muted">
                  Không tìm thấy hồ sơ bệnh án nào phù hợp với từ khóa.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Detail Modal -->
      @if (selectedRecord(); as rec) {
        <div class="modal-overlay" (click)="selectedRecord.set(null)">
          <div class="detail-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="header-left">
                <span class="lock-icon">
                  <app-clinic-icon name="lock" [size]="18"></app-clinic-icon>
                </span>
                <div>
                  <h3 class="modal-title font-serif">Hồ Sơ Bệnh Án EMR (Đã Khóa)</h3>
                  <span class="modal-sub">Mã lưu trữ: {{ rec.id }} • Số phiếu: {{ rec.ticketNumber }} • Phiên bản v{{ rec.version }}.0</span>
                </div>
              </div>
              <button class="btn-close" (click)="selectedRecord.set(null)">
                <app-clinic-icon name="close" [size]="16"></app-clinic-icon>
              </button>
            </div>

            <div class="modal-body">
              <!-- Patient Info -->
              <div class="detail-section">
                <h4 class="sec-title">Thông Tin Hành Chính Bệnh Nhân</h4>
                <div class="info-grid">
                  <div><strong>Họ tên:</strong> {{ rec.patientName }}</div>
                  <div><strong>Mã bệnh nhân:</strong> {{ rec.patientCode }}</div>
                  <div><strong>Ngày sinh:</strong> {{ rec.patientDob }} ({{ rec.patientGender === 'MALE' ? 'Nam' : 'Nữ' }})</div>
                  <div><strong>Bác sĩ khám:</strong> {{ rec.doctorName }}</div>
                  <div><strong>Chuyên khoa:</strong> {{ rec.department }}</div>
                  <div><strong>Ngày khám:</strong> {{ rec.visitDate | date: 'dd/MM/yyyy HH:mm' }}</div>
                </div>
              </div>

              <!-- Vitals -->
              <div class="detail-section">
                <h4 class="sec-title">Sinh Hiệu Ghi Nhận</h4>
                <div class="vitals-row">
                  <div class="v-pill">HA: <strong>{{ rec.vitals.bloodPressureSystolic }}/{{ rec.vitals.bloodPressureDiastolic }}</strong> mmHg</div>
                  <div class="v-pill">Mạch: <strong>{{ rec.vitals.heartRate }}</strong> bpm</div>
                  <div class="v-pill">Nhiệt độ: <strong>{{ rec.vitals.temperature }}</strong> °C</div>
                  <div class="v-pill">SpO2: <strong>{{ rec.vitals.spo2 || 98 }}</strong> %</div>
                  <div class="v-pill">BMI: <strong>{{ rec.vitals.bmi }}</strong> ({{ rec.vitals.weight }}kg - {{ rec.vitals.height }}cm)</div>
                </div>
              </div>

              <!-- Diagnoses -->
              <div class="detail-section">
                <h4 class="sec-title">Chẩn Đoán ICD-10</h4>
                <div class="diag-list">
                  @for (d of rec.diagnoses; track d.code) {
                    <div class="diag-row">
                      <span class="code-badge">{{ d.code }}</span>
                      <span>{{ d.nameVi }}</span>
                      @if (d.isPrimary) {
                        <span class="prim-badge">Chính</span>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Prescriptions -->
              <div class="detail-section">
                <h4 class="sec-title">Đơn Thuốc Đã Kê</h4>
                <div class="rx-list">
                  @for (p of rec.prescriptions; track p.id) {
                    <div class="rx-row">
                      <strong>{{ p.medicineName }}</strong> ({{ p.activeIngredient }} {{ p.strength }})
                      — {{ p.dosage }} • Số lượng: {{ p.totalQuantity }} {{ p.unit }}
                    </div>
                  } @empty {
                    <div class="text-muted">Không kê đơn thuốc.</div>
                  }
                </div>
              </div>

              <!-- Amendments Timeline if any -->
              @if (rec.amendments && rec.amendments.length > 0) {
                <div class="detail-section">
                  <h4 class="sec-title">Phụ Lục Bổ Sung (Audit Trail)</h4>
                  <div class="amendments-list">
                    @for (amd of rec.amendments; track amd.id) {
                      <div class="amd-card">
                        <div class="amd-header">
                          <strong>Phiên bản v{{ amd.version }}.0 — {{ amd.reason }}</strong>
                          <small>{{ amd.createdAt }}</small>
                        </div>
                        <p class="amd-text">{{ amd.addendumContent }}</p>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="selectedRecord.set(null)">Đóng</button>
              <button class="btn-open-workspace" (click)="openInWorkspace(rec)">
                Mở trong Clinical Workspace (Thêm phụ lục) →
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .doctor-history-page {
        max-width: 1300px;
        margin: 0 auto;
      }

      .btn-workspace {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 10px 18px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
      }

      .search-panel {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        gap: 16px;
        flex-wrap: wrap;
      }

      .search-wrap {
        display: flex;
        align-items: center;
        background: #FFFFFF;
        border: 1px solid #E2DCD0;
        border-radius: 14px;
        padding: 4px 14px;
        flex: 1;
        max-width: 500px;
        box-shadow: 0 2px 6px rgba(28, 39, 51, 0.03);
        transition: all 0.25s ease;

        &:hover {
          border-color: #C8BFB0;
          box-shadow: 0 3px 8px rgba(28, 39, 51, 0.05);
        }

        &:focus-within {
          border-color: #0E4A55;
          box-shadow: 0 0 0 3.5px rgba(14, 74, 85, 0.12), 0 3px 10px rgba(14, 74, 85, 0.06);
        }

        .search-icon {
          color: #8C96A2;
          margin-right: 10px;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          padding: 8px 0;
        }
      }

      .stats-summary {
        font-size: 0.9rem;
        color: #5B6672;
      }

      .history-table-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(28, 39, 51, 0.05);
      }

      .hist-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.88rem;

        th {
          background: #F4EFEB;
          padding: 12px 16px;
          text-align: left;
          color: #5B6672;
          font-weight: 600;
          font-size: 0.8rem;
          border-bottom: 1px solid #E4DED2;
        }

        td {
          padding: 12px 16px;
          border-top: 1px solid #F0EAE1;
          color: #1C2733;
        }

        .ticket-pill {
          background: rgba(14, 74, 85, 0.08);
          color: #0E4A55;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .version-tag {
          font-size: 0.76rem;
          background: #EAE6DF;
          color: #1C2733;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
        }

        .locked-badge {
          font-size: 0.74rem;
          background: rgba(94, 139, 126, 0.15);
          color: #2F5A4F;
          border: 1px solid #5E8B7E;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
        }

        .btn-view {
          background: #FFFFFF;
          border: 1px solid #D5CDBD;
          color: #0E4A55;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;

          &:hover {
            background: #FAF8F5;
          }
        }
      }

      /* Modal */
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
      }

      .detail-modal {
        background: #FFFFFF;
        width: 100%;
        max-width: 720px;
        border-radius: 16px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.3);
        border: 1.5px solid #5E8B7E;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .modal-header {
        background: #FAF8F5;
        border-bottom: 1px solid #E4DED2;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .lock-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: rgba(94, 139, 126, 0.15);
            color: #5E8B7E;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .modal-title {
            margin: 0;
            font-size: 1.15rem;
            color: #1C2733;
          }

          .modal-sub {
            font-size: 0.75rem;
            color: #5B6672;
          }
        }

        .btn-close {
          border: none;
          background: transparent;
          font-size: 1.2rem;
          cursor: pointer;
        }
      }

      .modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .detail-section {
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        border-radius: 10px;
        padding: 14px;

        .sec-title {
          margin: 0 0 10px 0;
          font-size: 0.88rem;
          color: #0E4A55;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        font-size: 0.85rem;
      }

      .vitals-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;

        .v-pill {
          background: #FFFFFF;
          border: 1px solid #E4DED2;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.82rem;
        }
      }

      .diag-list, .rx-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.85rem;
      }

      .diag-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .code-badge {
          background: #0E4A55;
          color: #FFFFFF;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .prim-badge {
          background: #B8955A;
          color: #FFFFFF;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.68rem;
        }
      }

      .amendments-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .amd-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-left: 3px solid #0E4A55;
        border-radius: 6px;
        padding: 10px;

        .amd-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          margin-bottom: 4px;
        }

        .amd-text {
          margin: 0;
          font-size: 0.82rem;
          color: #5B6672;
        }
      }

      .modal-footer {
        padding: 14px 20px;
        background: #FAF8F5;
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

        .btn-secondary {
          background: #FFFFFF;
          border: 1px solid #D5CDBD;
          color: #1C2733;
        }

        .btn-open-workspace {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
        }
      }
    `,
  ],
})
export class DoctorHistoryComponent {
  private medicalService = inject(MedicalService);
  private router = inject(Router);

  searchKeyword = '';
  selectedRecord = signal<MedicalRecord | null>(null);

  // All completed records
  allRecords = computed(() => {
    const archive = this.medicalService.recordsArchive();
    const active = this.medicalService.activeRecord();
    const list = [...archive];
    if (active.isLocked && !list.some((r) => r.id === active.id)) {
      list.unshift(active);
    }
    return list;
  });

  filteredRecords = computed(() => {
    const kw = this.searchKeyword.toLowerCase().trim();
    if (!kw) return this.allRecords();

    return this.allRecords().filter(
      (r) =>
        r.patientName.toLowerCase().includes(kw) ||
        r.patientCode.toLowerCase().includes(kw) ||
        r.ticketNumber.toLowerCase().includes(kw) ||
        r.id.toLowerCase().includes(kw)
    );
  });

  viewRecordDetail(rec: MedicalRecord): void {
    this.selectedRecord.set(rec);
  }

  openInWorkspace(rec: MedicalRecord): void {
    this.medicalService.loadRecordForTicket(rec.ticketNumber, rec.patientName, rec.patientId);
    this.selectedRecord.set(null);
    this.router.navigate(['/doctor/workspace']);
  }

  goToWorkspace(): void {
    this.router.navigate(['/doctor/workspace']);
  }
}
