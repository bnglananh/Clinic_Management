import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

interface PatientRecordItem {
  id: string;
  visitCode: string;
  visitDate: string;
  department: string;
  doctorName: string;
  doctorTitle: string;
  roomName: string;
  chiefComplaint: string;
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
    bmi: number;
  };
  diagnoses: {
    code: string;
    nameVi: string;
    isPrimary: boolean;
  }[];
  prescriptions: {
    name: string;
    strength: string;
    dosage: string;
    quantity: number;
    unit: string;
  }[];
  services: {
    name: string;
    category: string;
    result: string;
  }[];
  doctorAdvice: string;
  followUpDays?: number;
  isLocked: boolean;
  version: number;
}

@Component({
  selector: 'app-patient-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClinicIconComponent],
  template: `
    <div class="patient-records-page animate-fade-in-up">
      <!-- Header -->
      <div class="records-header">
        <span class="header-badge font-serif">SỔ TAY SỨC KHỎE ĐIỆN TỬ</span>
        <h1 class="page-title font-serif">Hồ Sơ Bệnh Án & Toa Thuốc</h1>
        <p class="page-subtitle">
          Toàn bộ lịch sử thăm khám, kết quả cận lâm sàng và toa thuốc điện tử được lưu trữ bất biến và bảo mật.
        </p>
      </div>

      <!-- Filter Controls Bar -->
      <div class="filters-bar clinic-card">
        <div class="filter-field">
          <label>Tìm kiếm từ khóa:</label>
          <input
            type="text"
            class="f-input"
            [(ngModel)]="searchKeyword"
            placeholder="Tìm theo tên bệnh, thuốc, bác sĩ..."
          />
        </div>

        <div class="filter-field">
          <label>Chuyên khoa:</label>
          <select class="f-select" [(ngModel)]="selectedDeptFilter">
            <option value="ALL">Tất cả chuyên khoa</option>
            <option value="Khoa Tim Mạch">Khoa Tim Mạch</option>
            <option value="Khoa Tiêu Hóa">Khoa Tiêu Hóa</option>
            <option value="Khoa Nội Tổng Quát">Khoa Nội Tổng Quát</option>
          </select>
        </div>

        <div class="filter-field">
          <label>Năm khám:</label>
          <select class="f-select" [(ngModel)]="selectedYearFilter">
            <option value="ALL">Tất cả các năm</option>
            <option value="2026">Năm 2026</option>
            <option value="2025">Năm 2025</option>
          </select>
        </div>

        <div class="filter-stat">
          <span>Tìm thấy: <strong>{{ filteredRecords().length }}</strong> lần khám</span>
        </div>
      </div>

      <!-- Visits Timeline List -->
      <div class="visits-container">
        @for (record of filteredRecords(); track record.id) {
          <div class="visit-card clinic-card">
            <!-- Visit Header Top Bar -->
            <div class="v-header">
              <div class="v-title-block">
                <span class="v-date-tag font-serif">{{ record.visitDate }}</span>
                <div>
                  <h3 class="v-dept">{{ record.department }} — {{ record.roomName }}</h3>
                  <span class="v-doc">Bác sĩ: <strong>{{ record.doctorTitle }} {{ record.doctorName }}</strong></span>
                </div>
              </div>

              <div class="v-status-block">
                <span class="emr-locked-pill">
                  <app-clinic-icon name="lock" [size]="14"></app-clinic-icon>
                  EMR Khóa v{{ record.version }}.0 (BR-23)
                </span>
                <span class="visit-code">{{ record.visitCode }}</span>
              </div>
            </div>

            <!-- Complaint & Vitals Strip -->
            <div class="v-mid-strip">
              <div class="complaint-box">
                <span class="sub-hdr">LÝ DO THĂM KHÁM:</span>
                <p>{{ record.chiefComplaint }}</p>
              </div>

              <div class="vitals-strip">
                <div class="vit-item">
                  <span class="vl">Huyết áp:</span>
                  <strong class="text-teal font-bold">{{ record.vitals.bloodPressure }}</strong>
                </div>
                <div class="vit-item">
                  <span class="vl">Mạch:</span>
                  <strong>{{ record.vitals.heartRate }} bpm</strong>
                </div>
                <div class="vit-item">
                  <span class="vl">Nhiệt độ:</span>
                  <strong>{{ record.vitals.temperature }} °C</strong>
                </div>
                <div class="vit-item">
                  <span class="vl">BMI:</span>
                  <strong>{{ record.vitals.bmi }} ({{ record.vitals.weight }}kg)</strong>
                </div>
              </div>
            </div>

            <!-- Diagnoses ICD-10 -->
            <div class="diag-section">
              <span class="sub-hdr">CHẨN ĐOÁN XÁC ĐỊNH (ICD-10):</span>
              <div class="diag-badges-wrap">
                @for (diag of record.diagnoses; track diag.code) {
                  <div class="diag-badge" [class.primary]="diag.isPrimary">
                    <span class="code">{{ diag.code }}</span>
                    <span class="name">{{ diag.nameVi }}</span>
                    @if (diag.isPrimary) {
                      <span class="role-tag">Chính</span>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Services & Tests Results if any -->
            @if (record.services && record.services.length > 0) {
              <div class="srv-section">
                <span class="sub-hdr">KẾT QUẢ CẬN LÂM SÀNG:</span>
                <div class="srv-results-list">
                  @for (srv of record.services; track srv.name) {
                    <div class="srv-res-card">
                      <div class="srv-top">
                        <span class="srv-cat">{{ srv.category }}</span>
                        <strong>{{ srv.name }}</strong>
                      </div>
                      <p class="srv-ans">Kết quả: {{ srv.result }}</p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Prescriptions Table -->
            @if (record.prescriptions && record.prescriptions.length > 0) {
              <div class="rx-section">
                <span class="sub-hdr">TOA THUỐC ĐIỆN TỬ ĐÃ KÊ:</span>
                <div class="rx-table-wrap">
                  <table class="rx-table">
                    <thead>
                      <tr>
                        <th>Tên Thuốc & Hàm Lượng</th>
                        <th>Liều Lượng & Cách Dùng</th>
                        <th>Số Lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of record.prescriptions; track p.name) {
                        <tr>
                          <td><strong>{{ p.name }}</strong> ({{ p.strength }})</td>
                          <td>{{ p.dosage }}</td>
                          <td><span class="font-bold">{{ p.quantity }} {{ p.unit }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Doctor Advice -->
            <div class="advice-box">
              <span class="sub-hdr">LỜI DẶN CỦA BÁC SĨ:</span>
              <p class="adv-text">{{ record.doctorAdvice }}</p>
              @if (record.followUpDays) {
                <div class="follow-up-pill">
                  <app-clinic-icon name="calendar" [size]="14"></app-clinic-icon>
                  <span>Hẹn tái khám sau: <strong>{{ record.followUpDays }} ngày</strong></span>
                </div>
              }
            </div>

            <!-- Footer Action Strip -->
            <div class="v-footer">
              <button class="btn-print-emr" (click)="printRecord()">
                <app-clinic-icon name="download" [size]="14"></app-clinic-icon>
                <span>In Toa Thuốc & Hồ Sơ</span>
              </button>
            </div>
          </div>
        } @empty {
          <div class="empty-state-box clinic-card">
            <span class="empty-icon">
              <app-clinic-icon name="clipboard" [size]="32" color="#B8955A"></app-clinic-icon>
            </span>
            <h3>Không tìm thấy lịch sử khám bệnh</h3>
            <p>Không có đợt khám nào phù hợp với bộ lọc tìm kiếm hiện tại.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .patient-records-page {
        max-width: 1080px;
        margin: 0 auto;
        padding-bottom: 40px;
      }

      .records-header {
        text-align: center;
        margin-bottom: 24px;

        .header-badge {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #B8955A;
          background: rgba(184, 149, 90, 0.15);
          padding: 4px 12px;
          border-radius: 999px;
          display: inline-block;
          margin-bottom: 8px;
        }

        .page-title {
          font-size: 2rem;
          color: #1C2733;
          margin: 0 0 8px 0;
        }

        .page-subtitle {
          font-size: 0.92rem;
          color: #5B6672;
          max-width: 620px;
          margin: 0 auto;
        }
      }

      .filters-bar {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 14px;
        padding: 16px 20px;
        display: flex;
        align-items: flex-end;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 180px;

          label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #5B6672;
          }

          .f-input, .f-select {
            border: 1px solid #E2DCD0;
            border-radius: 12px;
            padding: 9px 14px;
            font-size: 0.88rem;
            outline: none;
            background: #FFFFFF;
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

        .filter-stat {
          font-size: 0.82rem;
          color: #5B6672;
          padding-bottom: 8px;
        }
      }

      .visits-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .visit-card {
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 18px;
        padding: 28px;
        box-shadow: 0 8px 24px rgba(28, 39, 51, 0.05);

        .sub-hdr {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #8C96A2;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }
      }

      .v-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 16px;
        border-bottom: 1px solid #F0EAE1;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 12px;

        .v-title-block {
          display: flex;
          align-items: center;
          gap: 14px;

          .v-date-tag {
            font-size: 1.4rem;
            font-weight: 700;
            color: #0E4A55;
            background: rgba(14, 74, 85, 0.08);
            border: 1px solid rgba(14, 74, 85, 0.2);
            padding: 4px 12px;
            border-radius: 10px;
          }

          .v-dept {
            margin: 0 0 2px 0;
            font-size: 1.15rem;
            color: #1C2733;
          }

          .v-doc {
            font-size: 0.82rem;
            color: #5B6672;
          }
        }

        .v-status-block {
          display: flex;
          align-items: center;
          gap: 10px;

          .emr-locked-pill {
            font-size: 0.72rem;
            background: rgba(94, 139, 126, 0.15);
            color: #2F5A4F;
            border: 1px solid #5E8B7E;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
          }

          .visit-code {
            font-family: monospace;
            font-size: 0.78rem;
            color: #8C96A2;
          }
        }
      }

      .v-mid-strip {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 16px;
      }

      @media (max-width: 768px) {
        .v-mid-strip {
          grid-template-columns: 1fr;
        }
      }

      .complaint-box {
        p {
          margin: 0;
          font-size: 0.88rem;
          color: #1C2733;
          line-height: 1.45;
        }
      }

      .vitals-strip {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;

        .vit-item {
          display: flex;
          gap: 6px;
          font-size: 0.82rem;

          .vl {
            color: #5B6672;
          }
        }
      }

      .diag-section {
        margin-bottom: 16px;

        .diag-badges-wrap {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .diag-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FAF8F5;
          border: 1px solid #E4DED2;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.84rem;

          .code {
            font-weight: 700;
            color: #0E4A55;
          }

          &.primary {
            border-color: #0E4A55;
            background: rgba(14, 74, 85, 0.06);

            .role-tag {
              background: #0E4A55;
              color: #FFFFFF;
              font-size: 0.65rem;
              font-weight: 700;
              padding: 1px 6px;
              border-radius: 4px;
            }
          }
        }
      }

      .srv-section {
        margin-bottom: 16px;

        .srv-results-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (max-width: 768px) {
          .srv-results-list {
            grid-template-columns: 1fr;
          }
        }

        .srv-res-card {
          background: #FAF8F5;
          border: 1px solid #E4DED2;
          border-radius: 8px;
          padding: 10px 14px;

          .srv-top {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            .srv-cat {
              font-size: 0.68rem;
              background: #EAE6DF;
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: 700;
              color: #5B6672;
            }

            strong {
              font-size: 0.85rem;
              color: #1C2733;
            }
          }

          .srv-ans {
            margin: 0;
            font-size: 0.8rem;
            color: #5B6672;
          }
        }
      }

      .rx-section {
        margin-bottom: 16px;

        .rx-table-wrap {
          border: 1px solid #E4DED2;
          border-radius: 10px;
          overflow: hidden;
        }

        .rx-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;

          th {
            background: #F4EFEB;
            padding: 8px 12px;
            text-align: left;
            color: #5B6672;
            font-weight: 600;
            font-size: 0.78rem;
          }

          td {
            padding: 10px 12px;
            border-top: 1px solid #F0EAE1;
          }
        }
      }

      .advice-box {
        background: #FAF8F5;
        border-left: 3px solid #0E4A55;
        border-radius: 4px;
        padding: 12px 16px;
        margin-bottom: 16px;

        .adv-text {
          margin: 0;
          font-size: 0.85rem;
          color: #1C2733;
          line-height: 1.45;
        }

        .follow-up-pill {
          margin-top: 10px;
          font-size: 0.82rem;
          color: #0E4A55;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(14, 74, 85, 0.08);
          padding: 5px 12px;
          border-radius: 8px;
          font-weight: 500;
        }
      }

      .v-footer {
        display: flex;
        justify-content: flex-end;
        padding-top: 14px;
        border-top: 1px solid #F0EAE1;

        .btn-print-emr {
          background: #FFFFFF;
          border: 1px solid #E2DCD0;
          color: #0E4A55;
          padding: 9px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.84rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;

          &:hover {
            background: #FAF8F5;
            border-color: #0E4A55;
          }
        }
      }

      .empty-state-box {
        text-align: center;
        padding: 48px;
        background: #FFFFFF;
        border: 1px dashed #D5CDBD;
        border-radius: 16px;

        .empty-icon {
          font-size: 2.5rem;
        }

        h3 {
          margin: 12px 0 6px 0;
          color: #1C2733;
        }

        p {
          color: #8C96A2;
          font-size: 0.88rem;
        }
      }
    `,
  ],
})
export class PatientRecordsComponent {
  searchKeyword = '';
  selectedDeptFilter = 'ALL';
  selectedYearFilter = 'ALL';

  records: PatientRecordItem[] = [
    {
      id: 'REC-01',
      visitCode: 'EMR-2026-0012',
      visitDate: '15/02/2026',
      department: 'Khoa Tim Mạch',
      doctorName: 'Trần Minh Hoàng',
      doctorTitle: 'TS.BS',
      roomName: 'Phòng khám Nội 101',
      chiefComplaint: 'Đau đầu âm ỉ vùng sau gáy, chóng mặt nhẹ khi thay đổi tư thế.',
      vitals: {
        bloodPressure: '142/90 mmHg',
        heartRate: 84,
        temperature: 36.7,
        weight: 69,
        height: 170,
        bmi: 23.9,
      },
      diagnoses: [
        { code: 'I10', nameVi: 'Tăng huyết áp vô căn (nguyên phát)', isPrimary: true },
        { code: 'E78.2', nameVi: 'Tăng lipid máu hỗn hợp', isPrimary: false },
      ],
      services: [
        { category: 'CẬN LÂM SÀNG', name: 'Điện tâm đồ vi tính 12 chuyển đạo (ECG)', result: 'Nhịp xoang đều 80ck/p, dày thất trái nhẹ.' },
        { category: 'XÉT NGHIỆM', name: 'Bộ mỡ máu toàn phần (Cholesterol, Triglyceride)', result: 'Cholesterol: 6.2 mmol/L (Cao), Triglyceride: 2.8 mmol/L.' },
      ],
      prescriptions: [
        { name: 'Amlor (Amlodipine)', strength: '5mg', dosage: '1 viên/ngày (uống vào 8h sáng sau ăn)', quantity: 30, unit: 'Viên' },
      ],
      doctorAdvice: 'Uống thuốc đều đặn vào mỗi buổi sáng. Ăn nhạt (<5g muối/ngày), hạn chế mỡ động vật. Đo huyết áp mỗi sáng tại nhà.',
      followUpDays: 30,
      isLocked: true,
      version: 1,
    },
    {
      id: 'REC-02',
      visitCode: 'EMR-2026-0008',
      visitDate: '25/01/2026',
      department: 'Khoa Tiêu Hóa',
      doctorName: 'Lê Quốc Hưng',
      doctorTitle: 'BS.CKI',
      roomName: 'Phòng khám Nội 103',
      chiefComplaint: 'Ợ chua nóng rát sau xương ức, đầy bụng khó tiêu sau bữa tối.',
      vitals: {
        bloodPressure: '135/85 mmHg',
        heartRate: 78,
        temperature: 36.8,
        weight: 70,
        height: 170,
        bmi: 24.2,
      },
      diagnoses: [
        { code: 'K21.0', nameVi: 'Bệnh trào ngược dạ dày - thực quản có viêm thực quản', isPrimary: true },
      ],
      services: [
        { category: 'CHẨN ĐOÁN HÌNH ẢNH', name: 'Siêu âm ổ bụng tổng quát màu Doppler', result: 'Gan nhiễm mỡ độ 1. Không sỏi túi mật.' },
      ],
      prescriptions: [
        { name: 'Nexium (Omeprazole)', strength: '20mg', dosage: '1 viên/ngày (trước ăn sáng 30 phút)', quantity: 14, unit: 'Viên' },
      ],
      doctorAdvice: 'Không nằm ngay sau khi ăn tối (chờ ít nhất 2 tiếng). Tránh uống cà phê, nước ngọt có ga và đồ chua cay.',
      followUpDays: 14,
      isLocked: true,
      version: 1,
    },
    {
      id: 'REC-03',
      visitCode: 'EMR-2026-0002',
      visitDate: '10/01/2026',
      department: 'Khoa Nội Tổng Quát',
      doctorName: 'Nguyễn Thị Mai Lan',
      doctorTitle: 'ThS.BS',
      roomName: 'Phòng khám Nội 102',
      chiefComplaint: 'Ho có đờm trắng đục, rát họng, sốt nhẹ về chiều.',
      vitals: {
        bloodPressure: '130/82 mmHg',
        heartRate: 88,
        temperature: 37.8,
        weight: 70,
        height: 170,
        bmi: 24.2,
      },
      diagnoses: [
        { code: 'J06.9', nameVi: 'Nhiễm trùng đường hô hấp trên cấp tính', isPrimary: true },
      ],
      services: [
        { category: 'XÉT NGHIỆM', name: 'Tổng phân tích tế bào máu ngoại vi (CBC)', result: 'Bạch cầu tăng nhẹ (10.5 G/L), Neutrophil 72%.' },
      ],
      prescriptions: [
        { name: 'Panadol Extra', strength: '500mg', dosage: '1 viên khi sốt > 38.5°C hoặc đau họng nhiều', quantity: 10, unit: 'Viên' },
      ],
      doctorAdvice: 'Súc miệng nước muối sinh lý 3 lần/ngày. Uống nhiều nước ấm (2 lít/ngày). Đeo khẩu trang khi ra ngoài.',
      followUpDays: 7,
      isLocked: true,
      version: 1,
    },
  ];

  filteredRecords = computed(() => {
    let list = this.records;
    const kw = this.searchKeyword.toLowerCase().trim();
    if (kw) {
      list = list.filter(
        (r) =>
          r.doctorName.toLowerCase().includes(kw) ||
          r.department.toLowerCase().includes(kw) ||
          r.diagnoses.some((d) => d.nameVi.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw)) ||
          r.prescriptions.some((p) => p.name.toLowerCase().includes(kw))
      );
    }

    if (this.selectedDeptFilter !== 'ALL') {
      list = list.filter((r) => r.department === this.selectedDeptFilter);
    }

    if (this.selectedYearFilter !== 'ALL') {
      list = list.filter((r) => r.visitDate.endsWith(this.selectedYearFilter));
    }

    return list;
  });

  printRecord(): void {
    window.print();
  }
}
