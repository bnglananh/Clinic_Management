import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { QueueService } from '../../../core/services/queue.service';
import { AuthService } from '../../../core/services/auth.service';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';
import { ClinicIconComponent, ClinicIconName } from '../../../shared/components/clinic-icon/clinic-icon.component';

interface DepartmentOption {
  id: string;
  name: string;
  icon: ClinicIconName;
  desc: string;
  room: string;
  basePrice: number;
}

interface DoctorOption {
  id: string;
  name: string;
  title: string;
  departmentId: string;
  departmentName: string;
  experienceYears: number;
  rating: number;
  avatarUrl: string;
}

interface TimeSlotOption {
  id: string;
  time: string;
  period: 'SÁNG' | 'CHIỀU';
  availableSeats: number;
}

@Component({
  selector: 'app-patient-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, VndCurrencyPipe, ClinicIconComponent],
  template: `
    <div class="booking-page-container animate-fade-in-up">
      <!-- Top Title Header -->
      <div class="booking-header">
        <span class="booking-badge font-serif">ĐẶT LỊCH KHÁM TRỰC TUYẾN</span>
        <h1 class="page-title font-serif">Đặt Lịch Thăm Khám Nhanh (Dưới 3 Phút)</h1>
        <p class="page-subtitle">
          Chủ động lựa chọn Chuyên khoa, Bác sĩ chuyên gia và Khung giờ thuận tiện nhất cho Quý khách.
        </p>
      </div>

      <!-- 4-Step Stepper Progress Bar -->
      @if (!isSuccess()) {
        <div class="stepper-bar">
          <div class="step-item" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1">
            <div class="step-circle">
              @if (currentStep() > 1) {
                <app-clinic-icon name="check" [size]="14"></app-clinic-icon>
              } @else {
                1
              }
            </div>
            <span class="step-label">Chuyên Khoa</span>
          </div>
          <div class="step-connector" [class.filled]="currentStep() > 1"></div>

          <div class="step-item" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2">
            <div class="step-circle">
              @if (currentStep() > 2) {
                <app-clinic-icon name="check" [size]="14"></app-clinic-icon>
              } @else {
                2
              }
            </div>
            <span class="step-label">Bác Sĩ Khám</span>
          </div>
          <div class="step-connector" [class.filled]="currentStep() > 2"></div>

          <div class="step-item" [class.active]="currentStep() === 3" [class.completed]="currentStep() > 3">
            <div class="step-circle">
              @if (currentStep() > 3) {
                <app-clinic-icon name="check" [size]="14"></app-clinic-icon>
              } @else {
                3
              }
            </div>
            <span class="step-label">Ngày & Giờ</span>
          </div>
          <div class="step-connector" [class.filled]="currentStep() > 3"></div>

          <div class="step-item" [class.active]="currentStep() === 4" [class.completed]="currentStep() > 4">
            <div class="step-circle">4</div>
            <span class="step-label">Xác Nhận</span>
          </div>
        </div>
      }

      <!-- ==================== STEP 1: CHỌN CHUYÊN KHOA ==================== -->
      @if (currentStep() === 1 && !isSuccess()) {
        <div class="step-card">
          <h2 class="step-heading">Bước 1: Chọn Chuyên Khoa Phù Hợp</h2>
          <p class="step-desc">Vui lòng chọn chuyên khoa theo tình trạng sức khỏe hoặc triệu chứng hiện tại của quý khách.</p>

          <div class="dept-grid">
            @for (dept of departments; track dept.id) {
              <div
                class="dept-card"
                [class.selected]="selectedDept()?.id === dept.id"
                (click)="selectedDept.set(dept)"
              >
                <div class="dept-icon-box">
                  <app-clinic-icon [name]="dept.icon" [size]="24" color="#0E4A55"></app-clinic-icon>
                </div>
                <h3 class="dept-name">{{ dept.name }}</h3>
                <p class="dept-desc">{{ dept.desc }}</p>
                <div class="dept-footer">
                  <span class="dept-room">{{ dept.room }}</span>
                  <span class="dept-price">{{ dept.basePrice | vndCurrency }}</span>
                </div>
              </div>
            }
          </div>

          <div class="step-actions">
            <a routerLink="/patient" class="btn-back">← Quay lại trang chủ</a>
            <button
              class="btn-next"
              [disabled]="!selectedDept()"
              (click)="nextStep()"
            >
              Tiếp tục: Chọn Bác sĩ →
            </button>
          </div>
        </div>
      }

      <!-- ==================== STEP 2: CHỌN BÁC SĨ ==================== -->
      @if (currentStep() === 2 && !isSuccess()) {
        <div class="step-card">
          <h2 class="step-heading">Bước 2: Chọn Bác Sĩ Chuyên Gia</h2>
          <p class="step-desc">Đội ngũ bác sĩ chuyên khoa đầu ngành tại Smart Clinic luôn sẵn sàng lắng nghe và đồng hành cùng quý khách.</p>

          <div class="doctors-grid">
            @for (doc of filteredDoctors(); track doc.id) {
              <div
                class="doctor-card"
                [class.selected]="selectedDoctor()?.id === doc.id"
                (click)="selectedDoctor.set(doc)"
              >
                <img [src]="doc.avatarUrl" [alt]="doc.name" class="doc-avatar" />
                <div class="doc-info">
                  <span class="doc-title-pill">{{ doc.title }}</span>
                  <h3 class="doc-name">{{ doc.name }}</h3>
                  <span class="doc-dept">{{ doc.departmentName }}</span>
                  <div class="doc-stats">
                    <span class="stat-exp">
                      <app-clinic-icon name="sparkle" [size]="14" color="#B8955A"></app-clinic-icon>
                      {{ doc.rating }} (Đánh giá xuất sắc)
                    </span>
                    <span class="stat-sep">•</span>
                    <span>{{ doc.experienceYears }} năm kinh nghiệm</span>
                  </div>
                </div>
                <div class="radio-indicator">
                  <div class="radio-inner" *ngIf="selectedDoctor()?.id === doc.id"></div>
                </div>
              </div>
            }
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="prevStep()">← Chọn lại chuyên khoa</button>
            <button
              class="btn-next"
              [disabled]="!selectedDoctor()"
              (click)="nextStep()"
            >
              Tiếp tục: Chọn Ngày & Giờ →
            </button>
          </div>
        </div>
      }

      <!-- ==================== STEP 3: CHỌN NGÀY & KHUNG GIỜ ==================== -->
      @if (currentStep() === 3 && !isSuccess()) {
        <div class="step-card">
          <h2 class="step-heading">Bước 3: Chọn Ngày Khám & Khung Giờ</h2>
          <p class="step-desc">Lựa chọn ngày và khung giờ còn trống phù hợp với kế hoạch cá nhân.</p>

          <!-- Day Selection Tabs -->
          <div class="days-selector">
            <span class="sub-label">Chọn ngày khám:</span>
            <div class="days-list">
              @for (day of availableDays; track day.date) {
                <div
                  class="day-btn"
                  [class.active]="selectedDate() === day.date"
                  (click)="selectedDate.set(day.date)"
                >
                  <span class="day-name">{{ day.dayOfWeek }}</span>
                  <span class="day-num">{{ day.dateDisplay }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Time Slots Grid -->
          <div class="slots-container">
            <div class="slot-group">
              <h4 class="period-title">Ca Sáng (08:00 - 11:30)</h4>
              <div class="slots-grid">
                @for (slot of morningSlots; track slot.id) {
                  <button
                    type="button"
                    class="slot-btn"
                    [class.selected]="selectedSlot()?.id === slot.id"
                    [disabled]="slot.availableSeats === 0"
                    (click)="selectedSlot.set(slot)"
                  >
                    <span class="slot-time">{{ slot.time }}</span>
                    <span class="slot-seats" [class.full]="slot.availableSeats === 0">
                      {{ slot.availableSeats > 0 ? 'Còn ' + slot.availableSeats + ' chỗ' : 'Kín lịch' }}
                    </span>
                  </button>
                }
              </div>
            </div>

            <div class="slot-group mt-4">
              <h4 class="period-title">Ca Chiều (13:30 - 17:00)</h4>
              <div class="slots-grid">
                @for (slot of afternoonSlots; track slot.id) {
                  <button
                    type="button"
                    class="slot-btn"
                    [class.selected]="selectedSlot()?.id === slot.id"
                    [disabled]="slot.availableSeats === 0"
                    (click)="selectedSlot.set(slot)"
                  >
                    <span class="slot-time">{{ slot.time }}</span>
                    <span class="slot-seats" [class.full]="slot.availableSeats === 0">
                      {{ slot.availableSeats > 0 ? 'Còn ' + slot.availableSeats + ' chỗ' : 'Kín lịch' }}
                    </span>
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="prevStep()">← Chọn lại bác sĩ</button>
            <button
              class="btn-next"
              [disabled]="!selectedDate() || !selectedSlot()"
              (click)="nextStep()"
            >
              Tiếp tục: Xác nhận thông tin →
            </button>
          </div>
        </div>
      }

      <!-- ==================== STEP 4: XÁC NHẬN ĐẶT LỊCH ==================== -->
      @if (currentStep() === 4 && !isSuccess()) {
        <div class="step-card">
          <h2 class="step-heading">Bước 4: Xác Nhận Đăng Ký Khám Bệnh</h2>
          <p class="step-desc">Vui lòng rà soát lại thông tin lịch hẹn và nhập mô tả triệu chứng ban đầu.</p>

          <div class="confirm-grid">
            <!-- Left: Appointment Summary Card -->
            <div class="summary-box">
              <h3 class="summary-title font-serif">Thông Tin Đặt Hẹn</h3>
              <div class="summary-item">
                <span class="s-label">Chuyên khoa:</span>
                <span class="s-val">{{ selectedDept()?.name }} ({{ selectedDept()?.room }})</span>
              </div>
              <div class="summary-item">
                <span class="s-label">Bác sĩ phụ trách:</span>
                <span class="s-val">{{ selectedDoctor()?.title }} {{ selectedDoctor()?.name }}</span>
              </div>
              <div class="summary-item">
                <span class="s-label">Ngày khám:</span>
                <span class="s-val text-teal font-bold">{{ selectedDate() }}</span>
              </div>
              <div class="summary-item">
                <span class="s-label">Khung giờ hẹn:</span>
                <span class="s-val text-gold font-bold">{{ selectedSlot()?.time }}</span>
              </div>
              <div class="summary-item total-item">
                <span class="s-label">Giá khám niêm yết:</span>
                <span class="s-val price-val">{{ selectedDept()?.basePrice | vndCurrency }}</span>
              </div>
            </div>

            <!-- Right: Patient Information Form -->
            <div class="patient-form-box">
              <h3 class="summary-title font-serif">Thông Tin Người Khám</h3>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Họ và tên bệnh nhân <span class="req">*</span></label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="patientFullName"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Số điện thoại liên hệ <span class="req">*</span></label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="patientPhone"
                    placeholder="0912 345 678"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Mã số thẻ BHYT (nếu có)</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="patientInsurance"
                  placeholder="Ví dụ: GD479..."
                />
              </div>

              <div class="form-group">
                <label class="form-label">Mô tả triệu chứng / Lý do khám bệnh <span class="req">*</span></label>
                <textarea
                  rows="3"
                  class="form-textarea"
                  [(ngModel)]="patientReason"
                  placeholder="Ví dụ: Đau đầu kéo dài 3 ngày, chóng mặt khi thay đổi tư thế, có tiền sử tăng huyết áp..."
                ></textarea>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-back" (click)="prevStep()">Chỉnh sửa ngày giờ</button>
            <button
              class="btn-confirm-submit"
              [disabled]="!patientFullName.trim() || !patientPhone.trim() || !patientReason.trim() || isSubmitting()"
              (click)="submitBooking()"
            >
              @if (isSubmitting()) {
                <span>Đang xác nhận...</span>
              } @else {
                <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
                <span>Xác Nhận Đặt Lịch Khám</span>
              }
            </button>
          </div>
        </div>
      }

      <!-- ==================== BOOKING SUCCESS SCREEN ==================== -->
      @if (isSuccess()) {
        <div class="success-card clinic-card animate-fade-in-up">
          <div class="success-icon-box">
            <app-clinic-icon name="check" [size]="32" color="#0E4A55"></app-clinic-icon>
          </div>
          <span class="success-badge">ĐẶT LỊCH THÀNH CÔNG</span>
          <h2 class="success-title font-serif">Lịch Khám Đã Được Xác Nhận!</h2>
          <p class="success-desc">
            Cảm ơn quý khách <strong>{{ patientFullName }}</strong>. Hệ thống đã ghi nhận lịch hẹn và gửi tin nhắn SMS xác nhận tới số điện thoại <strong>{{ patientPhone }}</strong>.
          </p>

          <div class="ticket-receipt-box">
            <div class="receipt-header">
              <span class="r-code">MÃ LỊCH HẸN: {{ bookedAppointment()?.appointmentCode }}</span>
              <span class="r-status">CONFIRMED</span>
            </div>
            <div class="receipt-body">
              <div class="r-line">
                <span>Chuyên khoa:</span>
                <strong>{{ selectedDept()?.name }}</strong>
              </div>
              <div class="r-line">
                <span>Phòng khám:</span>
                <strong>{{ selectedDept()?.room }}</strong>
              </div>
              <div class="r-line">
                <span>Bác sĩ:</span>
                <strong>{{ selectedDoctor()?.title }} {{ selectedDoctor()?.name }}</strong>
              </div>
              <div class="r-line">
                <span>Thời gian:</span>
                <strong class="text-teal">{{ selectedDate() }} • {{ selectedSlot()?.time }}</strong>
              </div>
            </div>
            <div class="receipt-footer">
              <small style="display: inline-flex; align-items: center; gap: 6px;">
                <app-clinic-icon name="alert-triangle" [size]="14" color="#B8955A"></app-clinic-icon>
                <span>Quý khách vui lòng có mặt trước khung giờ khám 15 phút tại Quầy Lễ Tân để hoàn tất thủ tục check-in nhận số thứ tự.</span>
              </small>
            </div>
          </div>

          <div class="success-actions">
            <a routerLink="/patient/queue" class="btn-track-queue">
              <app-clinic-icon name="clock" [size]="16"></app-clinic-icon>
              <span>Theo dõi số thứ tự & hàng đợi</span>
              <app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon>
            </a>
            <a routerLink="/patient" class="btn-return-home">
              Về trang chủ Cổng Bệnh Nhân
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .booking-page-container {
        max-width: 1040px;
        margin: 0 auto;
        padding-bottom: 40px;
      }

      .booking-header {
        text-align: center;
        margin-bottom: 28px;

        .booking-badge {
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
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.5;
        }
      }

      /* Stepper Bar */
      .stepper-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 32px;
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 16px;
        padding: 16px 28px;
        box-shadow: 0 4px 12px rgba(28, 39, 51, 0.04);
      }

      .step-item {
        display: flex;
        align-items: center;
        gap: 10px;

        .step-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #EAE6DF;
          color: #5B6672;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.88rem;
          transition: all 0.2s ease;
        }

        .step-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: #5B6672;
        }

        &.active {
          .step-circle {
            background: #0E4A55;
            color: #FFFFFF;
            box-shadow: 0 0 0 4px rgba(14, 74, 85, 0.2);
          }
          .step-label {
            color: #0E4A55;
            font-weight: 700;
          }
        }

        &.completed {
          .step-circle {
            background: #5E8B7E;
            color: #FFFFFF;
          }
          .step-label {
            color: #2F5A4F;
          }
        }
      }

      .step-connector {
        flex: 1;
        max-width: 60px;
        height: 2px;
        background: #E4DED2;
        margin: 0 12px;

        &.filled {
          background: #5E8B7E;
        }
      }

      .step-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 18px;
        padding: 32px;
        box-shadow: 0 8px 24px rgba(28, 39, 51, 0.06);

        .step-heading {
          font-size: 1.35rem;
          color: #1C2733;
          margin: 0 0 6px 0;
          font-weight: 700;
        }

        .step-desc {
          font-size: 0.88rem;
          color: #5B6672;
          margin: 0 0 24px 0;
        }
      }

      /* Step 1: Department Grid */
      .dept-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 28px;
      }

      @media (max-width: 900px) {
        .dept-grid {
          grid-template-columns: 1fr;
        }
      }

      .dept-card {
        background: #FAF8F5;
        border: 1.5px solid #E4DED2;
        border-radius: 14px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;

        &:hover {
          border-color: #0E4A55;
          transform: translateY(-2px);
          background: #FFFFFF;
          box-shadow: 0 6px 18px rgba(14, 74, 85, 0.1);
        }

        &.selected {
          border-color: #0E4A55;
          background: #FAFBFB;
          box-shadow: 0 0 0 2px #0E4A55;
        }

        .dept-icon-box {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }

        .dept-name {
          font-size: 1.1rem;
          color: #1C2733;
          margin: 0 0 6px 0;
          font-weight: 600;
        }

        .dept-desc {
          font-size: 0.8rem;
          color: #5B6672;
          line-height: 1.4;
          flex: 1;
          margin: 0 0 14px 0;
        }

        .dept-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid #E4DED2;

          .dept-room {
            font-size: 0.75rem;
            color: #8C96A2;
            font-weight: 600;
          }

          .dept-price {
            font-size: 0.88rem;
            color: #0E4A55;
            font-weight: 700;
          }
        }
      }

      /* Step 2: Doctor Grid */
      .doctors-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 28px;
      }

      @media (max-width: 800px) {
        .doctors-grid {
          grid-template-columns: 1fr;
        }
      }

      .doctor-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: #FAF8F5;
        border: 1.5px solid #E4DED2;
        border-radius: 14px;
        padding: 16px 20px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          background: #FFFFFF;
        }

        &.selected {
          border-color: #0E4A55;
          background: #FAFBFB;
          box-shadow: 0 0 0 2px #0E4A55;
        }

        .doc-avatar {
          width: 64px;
          height: 64px;
          border-radius: 14px;
          object-fit: cover;
          border: 1.5px solid #B8955A;
        }

        .doc-info {
          flex: 1;

          .doc-title-pill {
            font-size: 0.68rem;
            font-weight: 700;
            color: #0E4A55;
            background: rgba(14, 74, 85, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
          }

          .doc-name {
            font-size: 1.05rem;
            color: #1C2733;
            margin: 4px 0 2px 0;
            font-weight: 600;
          }

          .doc-dept {
            font-size: 0.78rem;
            color: #5B6672;
            display: block;
          }

          .doc-stats {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            color: #8C96A2;
            margin-top: 4px;

            .stat-exp {
              color: #B8955A;
              font-weight: 600;
            }
          }
        }

        .radio-indicator {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #D5CDBD;
          display: flex;
          align-items: center;
          justify-content: center;

          .radio-inner {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #0E4A55;
          }
        }
      }

      /* Step 3: Days & Slots */
      .days-selector {
        margin-bottom: 24px;

        .sub-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1C2733;
          margin-bottom: 10px;
        }

        .days-list {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .day-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 16px;
          border-radius: 12px;
          background: #FAF8F5;
          border: 1px solid #E4DED2;
          cursor: pointer;
          min-width: 90px;
          transition: all 0.2s ease;

          .day-name {
            font-size: 0.75rem;
            color: #8C96A2;
          }

          .day-num {
            font-size: 0.95rem;
            font-weight: 700;
            color: #1C2733;
            margin-top: 2px;
          }

          &:hover {
            border-color: #0E4A55;
          }

          &.active {
            background: #0E4A55;
            border-color: #0E4A55;

            .day-name, .day-num {
              color: #FFFFFF;
            }
          }
        }
      }

      .slot-group {
        .period-title {
          font-size: 0.92rem;
          font-weight: 600;
          color: #1C2733;
          margin: 0 0 10px 0;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        @media (max-width: 768px) {
          .slots-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .slot-btn {
          background: #FAF8F5;
          border: 1px solid #E4DED2;
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;

          .slot-time {
            font-size: 0.92rem;
            font-weight: 700;
            color: #1C2733;
          }

          .slot-seats {
            font-size: 0.7rem;
            color: #5E8B7E;
            font-weight: 600;

            &.full {
              color: #9B3D45;
            }
          }

          &:hover:not(:disabled) {
            border-color: #0E4A55;
            background: #FFFFFF;
          }

          &.selected {
            background: rgba(14, 74, 85, 0.1);
            border-color: #0E4A55;
            box-shadow: 0 0 0 2px #0E4A55;

            .slot-time {
              color: #0E4A55;
            }
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: #EAE6DF;
          }
        }
      }

      /* Step 4: Confirmation */
      .confirm-grid {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 24px;
        margin-bottom: 28px;
      }

      @media (max-width: 900px) {
        .confirm-grid {
          grid-template-columns: 1fr;
        }
      }

      .summary-box {
        background: #FAF8F5;
        border: 1.5px solid #E4DED2;
        border-radius: 14px;
        padding: 20px;

        .summary-title {
          font-size: 1.05rem;
          color: #1C2733;
          margin: 0 0 16px 0;
          border-bottom: 1px solid #E4DED2;
          padding-bottom: 8px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 12px;

          .s-label {
            color: #5B6672;
          }

          .s-val {
            color: #1C2733;
            text-align: right;
          }

          &.total-item {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px dashed #D5CDBD;

            .s-label {
              font-weight: 700;
              color: #1C2733;
            }

            .price-val {
              font-size: 1.15rem;
              font-weight: 700;
              color: #0E4A55;
            }
          }
        }
      }

      .patient-form-box {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 14px;
        padding: 20px;

        .summary-title {
          font-size: 1.05rem;
          color: #1C2733;
          margin: 0 0 16px 0;
          border-bottom: 1px solid #E4DED2;
          padding-bottom: 8px;
        }
      }

      .form-row {
        display: flex;
        gap: 14px;
      }

      .form-group {
        margin-bottom: 14px;

        .form-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #1C2733;
          margin-bottom: 6px;

          .req {
            color: #9B3D45;
          }
        }

        .form-input, .form-textarea {
          width: 100%;
          border: 1px solid #E2DCD0;
          border-radius: 12px;
          padding: 10px 14px;
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

      /* Step Actions */
      .step-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid #F0EAE1;

        .btn-back {
          background: transparent;
          border: 1px solid #D5CDBD;
          color: #5B6672;
          padding: 10px 22px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;

          &:hover {
            background: #FAF8F5;
            color: #1C2733;
          }
        }

        .btn-next {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
          padding: 11px 26px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(14, 74, 85, 0.25);
          transition: all 0.2s ease;

          &:disabled {
            background: #D5CDBD;
            cursor: not-allowed;
            box-shadow: none;
          }

          &:not(:disabled):hover {
            background: #135d6b;
          }
        }

        .btn-confirm-submit {
          background: #B8955A;
          color: #FFFFFF;
          border: none;
          padding: 12px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(184, 149, 90, 0.35);

          &:disabled {
            background: #D5CDBD;
            cursor: not-allowed;
            box-shadow: none;
          }

          &:not(:disabled):hover {
            background: #a38249;
          }
        }
      }

      /* Success Screen */
      .success-card {
        background: #FFFFFF;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        max-width: 640px;
        margin: 0 auto;
        box-shadow: 0 12px 32px rgba(28, 39, 51, 0.08);

        .success-icon-box {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #5E8B7E;
          color: #FFFFFF;
          font-size: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
        }

        .success-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: #5E8B7E;
          letter-spacing: 0.1em;
        }

        .success-title {
          font-size: 1.8rem;
          color: #1C2733;
          margin: 8px 0 12px 0;
        }

        .success-desc {
          font-size: 0.92rem;
          color: #5B6672;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }
      }

      .ticket-receipt-box {
        background: #FAF8F5;
        border: 1.5px dashed #D5CDBD;
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 28px;
        text-align: left;

        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #E4DED2;
          margin-bottom: 12px;

          .r-code {
            font-family: monospace;
            font-size: 1.05rem;
            font-weight: 700;
            color: #0E4A55;
          }

          .r-status {
            background: rgba(94, 139, 126, 0.15);
            color: #5E8B7E;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
          }
        }

        .receipt-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.88rem;

          .r-line {
            display: flex;
            justify-content: space-between;

            span {
              color: #5B6672;
            }

            strong {
              color: #1C2733;
            }
          }
        }

        .receipt-footer {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px dashed #E4DED2;
          color: #8C6D34;
        }
      }

      .success-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .btn-track-queue {
          background: #0E4A55;
          color: #FFFFFF;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s;

          &:hover {
            background: #135d6b;
          }
        }

        .btn-return-home {
          color: #5B6672;
          text-decoration: none;
          font-size: 0.88rem;

          &:hover {
            color: #1C2733;
          }
        }
      }
    `,
  ],
})
export class PatientBookingComponent {
  private queueService = inject(QueueService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentStep = signal<number>(1);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  bookedAppointment = signal<any | null>(null);

  // Department catalog
  departments: DepartmentOption[] = [
    { id: 'DEP-CARDIO', name: 'Khoa Tim Mạch', icon: 'heart-pulse', desc: 'Chẩn đoán và điều trị tăng huyết áp, rối loạn nhịp, bệnh tim thiếu máu cục bộ.', room: 'Phòng Khám Nội 101', basePrice: 200000 },
    { id: 'DEP-INTERNAL', name: 'Khoa Nội Tổng Quát', icon: 'stethoscope', desc: 'Thăm khám tầm soát bệnh lý toàn diện, đái tháo đường, rối loạn chuyển hóa.', room: 'Phòng Khám Nội 102', basePrice: 150000 },
    { id: 'DEP-DIGEST', name: 'Khoa Tiêu Hóa - Gan Mật', icon: 'activity', desc: 'Điều trị trào ngược dạ dày, viêm loét dạ dày tá tràng, gan nhiễm mỡ.', room: 'Phòng Khám Nội 103', basePrice: 180000 },
    { id: 'DEP-ENT', name: 'Khoa Tai Mũi Họng', icon: 'stethoscope', desc: 'Khám nội soi vòm họng, viêm mũi xoang, viêm amiđan và thính lực.', room: 'Phòng Khám 201', basePrice: 160000 },
    { id: 'DEP-NEURO', name: 'Khoa Thần Kinh', icon: 'activity', desc: 'Chữa trị đau nửa đầu Migraine, rối loạn tiền đình, mất ngủ kinh niên.', room: 'Phòng Khám 202', basePrice: 220000 },
    { id: 'DEP-ORTHO', name: 'Khoa Cơ Xương Khớp', icon: 'activity', desc: 'Thoái hóa khớp gối, đau thắt lưng, thoát vị đĩa đệm và loãng xương.', room: 'Phòng Khám 203', basePrice: 190000 },
  ];

  // Doctor list
  doctors: DoctorOption[] = [
    { id: 'DOC-01', name: 'TS.BS Trần Minh Hoàng', title: 'Bác sĩ Chuyên khoa II', departmentId: 'DEP-CARDIO', departmentName: 'Khoa Tim Mạch', experienceYears: 18, rating: 4.9, avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
    { id: 'DOC-02', name: 'ThS.BS Nguyễn Thị Mai Lan', title: 'Thạc sĩ Bác sĩ', departmentId: 'DEP-INTERNAL', departmentName: 'Khoa Nội Tổng Quát', experienceYears: 12, rating: 4.8, avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3543d8a7c1ad?w=150&auto=format&fit=crop&q=80' },
    { id: 'DOC-03', name: 'BS.CKI Lê Quốc Hưng', title: 'Bác sĩ CKI', departmentId: 'DEP-DIGEST', departmentName: 'Khoa Tiêu Hóa', experienceYears: 15, rating: 4.9, avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80' },
    { id: 'DOC-04', name: 'TS.BS Phạm Đức Trí', title: 'Tiến sĩ Y Khoa', departmentId: 'DEP-ENT', departmentName: 'Khoa Tai Mũi Họng', experienceYears: 20, rating: 4.95, avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80' },
  ];

  // Selected entities
  selectedDept = signal<DepartmentOption | null>(this.departments[0]);
  selectedDoctor = signal<DoctorOption | null>(this.doctors[0]);
  selectedDate = signal<string>('06/10/2026');
  selectedSlot = signal<TimeSlotOption | null>(null);

  // Patient inputs
  patientFullName = this.authService.currentUser()?.fullName || 'Phạm Văn An';
  patientPhone = this.authService.currentUser()?.phone || '0977 889 900';
  patientInsurance = 'GD4791234567890';
  patientReason = 'Đau đầu âm ỉ vùng sau gáy, huyết áp không ổn định.';

  // Available days generator
  availableDays = [
    { dayOfWeek: 'Hôm nay', date: '06/10/2026', dateDisplay: '06 Th10' },
    { dayOfWeek: 'Thứ Ba', date: '07/10/2026', dateDisplay: '07 Th10' },
    { dayOfWeek: 'Thứ Tư', date: '08/10/2026', dateDisplay: '08 Th10' },
    { dayOfWeek: 'Thứ Năm', date: '09/10/2026', dateDisplay: '09 Th10' },
    { dayOfWeek: 'Thứ Sáu', date: '10/10/2026', dateDisplay: '10 Th10' },
  ];

  morningSlots: TimeSlotOption[] = [
    { id: 'SLOT-01', time: '08:00 - 08:30', period: 'SÁNG', availableSeats: 3 },
    { id: 'SLOT-02', time: '08:30 - 09:00', period: 'SÁNG', availableSeats: 2 },
    { id: 'SLOT-03', time: '09:00 - 09:30', period: 'SÁNG', availableSeats: 0 },
    { id: 'SLOT-04', time: '09:30 - 10:00', period: 'SÁNG', availableSeats: 4 },
  ];

  afternoonSlots: TimeSlotOption[] = [
    { id: 'SLOT-05', time: '13:30 - 14:00', period: 'CHIỀU', availableSeats: 5 },
    { id: 'SLOT-06', time: '14:00 - 14:30', period: 'CHIỀU', availableSeats: 3 },
    { id: 'SLOT-07', time: '14:30 - 15:00', period: 'CHIỀU', availableSeats: 1 },
    { id: 'SLOT-08', time: '15:00 - 15:30', period: 'CHIỀU', availableSeats: 4 },
  ];

  filteredDoctors = () => {
    const dept = this.selectedDept();
    if (!dept) return this.doctors;
    const match = this.doctors.filter((d) => d.departmentId === dept.id);
    return match.length > 0 ? match : this.doctors;
  };

  nextStep(): void {
    if (this.currentStep() < 4) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  submitBooking(): void {
    this.isSubmitting.set(true);

    const doc = this.selectedDoctor()!;
    const dept = this.selectedDept()!;
    const user = this.authService.currentUser();

    this.queueService
      .createAppointment({
        patientId: user?.id || 'usr-pat-01',
        patientCode: 'BN-2026-0891',
        patientName: this.patientFullName,
        phone: this.patientPhone,
        department: dept.name,
        doctorId: doc.id,
        doctorName: doc.name,
        appointmentDate: this.selectedDate(),
        timeSlot: this.selectedSlot()?.time || '08:30 - 09:00',
        reasonForVisit: this.patientReason,
      })
      .subscribe((apt) => {
        this.isSubmitting.set(false);
        this.bookedAppointment.set(apt);
        this.isSuccess.set(true);
      });
  }
}
