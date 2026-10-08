import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { QueueService } from '../../../core/services/queue.service';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusTagComponent, ClinicIconComponent],
  template: `
    <!-- Patient Hero Welcome -->
    <div class="patient-hero-banner">
      <div class="hero-text-content">
        <span class="welcome-badge">XIN CHÀO AN TÂM</span>
        <h1 class="hero-heading font-serif">Kính chào Quý khách, Phạm Văn An</h1>
        <p class="hero-desc">
          Chào mừng quý khách đến với Cổng chăm sóc sức khỏe trực tuyến Smart Clinic. Quý khách có 1 lịch hẹn khám trong ngày hôm nay.
        </p>
        <div class="hero-actions">
          <a routerLink="/patient/booking" class="btn-book-primary">
            <app-clinic-icon name="calendar" [size]="15"></app-clinic-icon>
            <span>Đặt lịch khám mới (4 bước nhanh)</span>
          </a>
          <a routerLink="/patient/records" class="btn-book-secondary">
            <app-clinic-icon name="clipboard" [size]="15"></app-clinic-icon>
            <span>Xem hồ sơ bệnh án cũ</span>
          </a>
          <a routerLink="/patient/profile" class="btn-book-secondary">
            <app-clinic-icon name="user" [size]="15"></app-clinic-icon>
            <span>Cập nhật thông tin cá nhân</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Active Appointment & Realtime Queue Card (Prominent Card) -->
    <div class="active-appointment-card clinic-card">
      <div class="card-badge-line">
        <span class="live-pill">
          <span class="pulse-dot"></span>
          LƯỢT KHÁM HÔM NAY (REALTIME)
        </span>
        <app-status-tag status="WAITING"></app-status-tag>
      </div>

      <div class="appointment-content-grid">
        <!-- Big Number Ticket -->
        <div class="ticket-big-box">
          <span class="ticket-label">SỐ THỨ TỰ CỦA BẠN</span>
          <span class="ticket-number font-serif pulse-gold">A-015</span>
          <span class="ticket-sub">Dự kiến gọi vào khám lúc: <strong>09:30</strong></span>
        </div>

        <!-- Appointment Details -->
        <div class="appointment-details">
          <div class="detail-row">
            <span class="d-icon">
              <app-clinic-icon name="medical-cross" [size]="18" color="#0E4A55"></app-clinic-icon>
            </span>
            <div class="d-text">
              <span class="d-label">Chuyên khoa & Phòng khám:</span>
              <span class="d-val">Khoa Tim Mạch • Phòng Khám Nội 101 (Tầng 1)</span>
            </div>
          </div>

          <div class="detail-row">
            <span class="d-icon">
              <app-clinic-icon name="stethoscope" [size]="18" color="#0E4A55"></app-clinic-icon>
            </span>
            <div class="d-text">
              <span class="d-label">Bác sĩ phụ trách:</span>
              <span class="d-val">TS.BS Trần Minh Hoàng (Chuyên khoa II)</span>
            </div>
          </div>

          <div class="detail-row">
            <span class="d-icon">
              <app-clinic-icon name="clock" [size]="18" color="#0E4A55"></app-clinic-icon>
            </span>
            <div class="d-text">
              <span class="d-label">Tình trạng hàng đợi hiện tại:</span>
              <span class="d-val text-teal">Phòng đang khám số <strong>A-012</strong> (Còn 2 người nữa tới lượt bạn)</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="appointment-card-actions">
          <button class="btn-ticket-print">
            <app-clinic-icon name="download" [size]="14"></app-clinic-icon>
            <span>In phiếu khám</span>
          </button>
          <button class="btn-ticket-reschedule">Dời lịch hẹn</button>
        </div>
      </div>
    </div>

    <!-- Quick Features Grid -->
    <div class="features-4-grid">
      <div class="feature-box clinic-card">
        <div class="f-icon">
          <app-clinic-icon name="clipboard" [size]="24" color="#0E4A55"></app-clinic-icon>
        </div>
        <h3 class="f-title">Hồ Sơ Y Tế & Kết Quả</h3>
        <p class="f-desc">Xem lại toàn bộ kết quả xét nghiệm, chẩn đoán hình ảnh và lịch sử thăm khám.</p>
        <a routerLink="/patient/records" class="f-link">Tra cứu hồ sơ →</a>
      </div>

      <div class="feature-box clinic-card">
        <div class="f-icon">
          <app-clinic-icon name="pill" [size]="24" color="#0E4A55"></app-clinic-icon>
        </div>
        <h3 class="f-title">Toa Thuốc Điện Tử</h3>
        <p class="f-desc">Toa thuốc có chữ ký số bác sĩ kèm hướng dẫn liều dùng và thời gian uống thuốc.</p>
        <a routerLink="/patient/records" class="f-link">Xem đơn thuốc →</a>
      </div>

      <div class="feature-box clinic-card">
        <div class="f-icon">
          <app-clinic-icon name="credit-card" [size]="24" color="#0E4A55"></app-clinic-icon>
        </div>
        <h3 class="f-title">Hóa Đơn & Thanh Toán</h3>
        <p class="f-desc">Thanh toán trực tuyến quét mã VietQR hoặc kiểm tra biên lai điện tử viện phí.</p>
        <a routerLink="/patient/billing" class="f-link">Xem hóa đơn →</a>
      </div>

      <div class="feature-box clinic-card">
        <div class="f-icon">
          <app-clinic-icon name="sparkle" [size]="24" color="#0E4A55"></app-clinic-icon>
        </div>
        <h3 class="f-title">Chăm Sóc & Đánh Giá</h3>
        <p class="f-desc">Đánh giá chất lượng dịch vụ phòng khám và gửi thắc mắc cho bác sĩ điều trị.</p>
        <a href="javascript:void(0)" class="f-link">Gửi đánh giá →</a>
      </div>
    </div>
  `,
  styles: [
    `
      .patient-hero-banner {
        background: linear-gradient(135deg, #1C2733 0%, #0E4A55 100%);
        border-radius: 20px;
        padding: 44px 48px;
        color: #FFFFFF;
        margin-bottom: 28px;
        position: relative;
        overflow: hidden;
      }

      .welcome-badge {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: #B8955A;
        background: rgba(184, 149, 90, 0.15);
        padding: 4px 12px;
        border-radius: 999px;
        display: inline-block;
        margin-bottom: 12px;
      }

      .hero-heading {
        font-size: 2.2rem;
        color: #F6F3EC;
        margin: 0 0 10px 0;
      }

      .hero-desc {
        color: rgba(246, 243, 236, 0.85);
        font-size: 0.95rem;
        max-width: 620px;
        margin: 0 0 24px 0;
        line-height: 1.5;
      }

      .hero-actions {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }

      .btn-book-primary {
        background: #B8955A;
        color: #FFFFFF;
        padding: 11px 22px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(184, 149, 90, 0.35);

        &:hover {
          background: #a38249;
        }
      }

      .btn-book-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.25);
        padding: 11px 20px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.18);
        }
      }

      // Active Appointment Card
      .active-appointment-card {
        padding: 28px 32px;
        margin-bottom: 32px;
        border: 1.5px solid rgba(184, 149, 90, 0.3);
        background: #FFFFFF;
      }

      .card-badge-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .live-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #0E4A55;

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #B8955A;
        }
      }

      .appointment-content-grid {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 32px;
        flex-wrap: wrap;
      }

      .ticket-big-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #FAF8F5;
        border: 1.5px solid #E4DED2;
        padding: 16px 28px;
        border-radius: 16px;
        text-align: center;
      }

      .ticket-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #8C96A2;
        letter-spacing: 0.06em;
      }

      .ticket-number {
        font-size: 2.75rem;
        font-weight: 700;
        color: #0E4A55;
        line-height: 1.1;
        margin: 4px 0;
      }

      .ticket-sub {
        font-size: 0.8rem;
        color: #5B6672;
      }

      .appointment-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 280px;
      }

      .detail-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .d-icon {
        font-size: 1.25rem;
      }

      .d-text {
        display: flex;
        flex-direction: column;
      }

      .d-label {
        font-size: 0.75rem;
        color: #8C96A2;
      }

      .d-val {
        font-size: 0.92rem;
        font-weight: 600;
        color: #1C2733;
      }

      .appointment-card-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .btn-ticket-print {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 10px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;

        &:hover {
          background: #135d6b;
        }
      }

      .btn-ticket-reschedule {
        background: transparent;
        border: 1px solid #E4DED2;
        color: #5B6672;
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 0.82rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #9B3D45;
          color: #9B3D45;
        }
      }

      // Features Grid
      .features-4-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
      }

      @media (max-width: 1024px) {
        .features-4-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .feature-box {
        padding: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .f-icon {
        font-size: 2rem;
        margin-bottom: 12px;
      }

      .f-title {
        font-size: 1.05rem;
        font-weight: 600;
        color: #1C2733;
        margin: 0 0 6px 0;
      }

      .f-desc {
        font-size: 0.82rem;
        color: #5B6672;
        margin: 0 0 16px 0;
        line-height: 1.45;
      }

      .f-link {
        font-size: 0.85rem;
        font-weight: 600;
        color: #0E4A55;
        text-decoration: none;

        &:hover {
          color: #B8955A;
        }
      }
    `,
  ],
})
export class PatientHomeComponent {
  private authService = inject(AuthService);
  private queueService = inject(QueueService);

  currentUser = this.authService.currentUser;
  todayTicket = signal({
    number: 'A-015',
    status: 'WAITING' as const,
    estimatedTime: '09:30',
    room: 'Phòng Khám Nội 101 (Tầng 1)',
    doctor: 'TS.BS Trần Minh Hoàng (Chuyên khoa II)',
    currentCalling: 'A-012',
    peopleAhead: 2,
  });

  printTicket(): void {
    window.print();
  }
}
