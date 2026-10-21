import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { QueueService } from '../../../core/services/queue.service';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { ClinicIconComponent, ClinicIconName } from '../../../shared/components/clinic-icon/clinic-icon.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

interface ServiceItem {
  code: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  room: string;
  icon: ClinicIconName;
  description: string;
  isPopular?: boolean;
}

interface DoctorItem {
  id: string;
  name: string;
  title: string;
  specialty: string;
  room: string;
  scheduleDays: string;
  experience: string;
}

interface EquipmentItem {
  name: string;
  model: string;
  origin: string;
  certifications: string[];
  highlight: string;
  description: string;
  relatedServiceCode: string;
}

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusTagComponent, ClinicIconComponent, VndCurrencyPipe],
  template: `
    <div class="patient-dashboard-container">
      <!-- 1. Patient Hero Welcome Banner -->
      <div class="patient-hero-banner">
        <div class="hero-text-content">
          <span class="welcome-badge">XIN CHÀO AN TÂM</span>
          <h1 class="hero-heading font-serif">Kính chào Quý khách, {{ currentUser()?.fullName || 'Phạm Văn An' }}</h1>
          <p class="hero-desc">
            Chào mừng quý khách đến với Cổng chăm sóc sức khỏe trực tuyến Smart Clinic. Quý khách có 1 lượt khám đang diễn ra trong ngày hôm nay.
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

      <!-- 2. Active Appointment & Realtime Queue Card (Prominent Card) -->
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
            <span class="ticket-number font-serif pulse-gold">{{ todayTicket().number }}</span>
            <span class="ticket-sub">Dự kiến gọi vào khám lúc: <strong>{{ todayTicket().estimatedTime }}</strong></span>
          </div>

          <!-- Appointment Details -->
          <div class="appointment-details">
            <div class="detail-row">
              <span class="d-icon">
                <app-clinic-icon name="medical-cross" [size]="18" color="#0E4A55"></app-clinic-icon>
              </span>
              <div class="d-text">
                <span class="d-label">Chuyên khoa & Phòng khám:</span>
                <span class="d-val">{{ todayTicket().room }}</span>
              </div>
            </div>

            <div class="detail-row">
              <span class="d-icon">
                <app-clinic-icon name="stethoscope" [size]="18" color="#0E4A55"></app-clinic-icon>
              </span>
              <div class="d-text">
                <span class="d-label">Bác sĩ phụ trách:</span>
                <span class="d-val">{{ todayTicket().doctor }}</span>
              </div>
            </div>

            <div class="detail-row">
              <span class="d-icon">
                <app-clinic-icon name="clock" [size]="18" color="#0E4A55"></app-clinic-icon>
              </span>
              <div class="d-text">
                <span class="d-label">Tình trạng hàng đợi hiện tại:</span>
                <span class="d-val text-teal">Phòng đang khám số <strong>{{ todayTicket().currentCalling }}</strong> (Còn {{ todayTicket().peopleAhead }} người nữa tới lượt bạn)</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="appointment-card-actions">
            <button class="btn-ticket-print" (click)="printTicket()">
              <app-clinic-icon name="download" [size]="14"></app-clinic-icon>
              <span>In phiếu khám</span>
            </button>
            <a routerLink="/patient/queue" class="btn-ticket-reschedule">Xem tiến trình sảnh</a>
          </div>
        </div>
      </div>

      <!-- 3. Quick Features 4-Grid -->
      <div class="features-4-grid">
        <div class="feature-box clinic-card">
          <div class="f-icon">
            <app-clinic-icon name="clipboard" [size]="24" color="#0E4A55"></app-clinic-icon>
          </div>
          <h3 class="f-title font-serif">Hồ Sơ Y Tế & Kết Quả</h3>
          <p class="f-desc">Xem lại toàn bộ kết quả xét nghiệm, chẩn đoán hình ảnh và lịch sử thăm khám.</p>
          <a routerLink="/patient/records" class="f-link">Tra cứu hồ sơ →</a>
        </div>

        <div class="feature-box clinic-card">
          <div class="f-icon">
            <app-clinic-icon name="pill" [size]="24" color="#0E4A55"></app-clinic-icon>
          </div>
          <h3 class="f-title font-serif">Toa Thuốc Điện Tử</h3>
          <p class="f-desc">Toa thuốc có chữ ký số bác sĩ kèm hướng dẫn liều dùng và thời gian uống thuốc.</p>
          <a routerLink="/patient/records" class="f-link">Xem đơn thuốc →</a>
        </div>

        <div class="feature-box clinic-card">
          <div class="f-icon">
            <app-clinic-icon name="credit-card" [size]="24" color="#0E4A55"></app-clinic-icon>
          </div>
          <h3 class="f-title font-serif">Hóa Đơn & Thanh Toán</h3>
          <p class="f-desc">Thanh toán trực tuyến quét mã VietQR hoặc kiểm tra biên lai điện tử viện phí.</p>
          <a routerLink="/patient/billing" class="f-link">Xem hóa đơn →</a>
        </div>

        <div class="feature-box clinic-card">
          <div class="f-icon">
            <app-clinic-icon name="sparkle" [size]="24" color="#0E4A55"></app-clinic-icon>
          </div>
          <h3 class="f-title font-serif">Chăm Sóc & Đánh Giá</h3>
          <p class="f-desc">Đánh giá chất lượng dịch vụ phòng khám và gửi thắc mắc cho bác sĩ điều trị.</p>
          <a routerLink="/patient/records" class="f-link">Gửi đánh giá →</a>
        </div>
      </div>

      <!-- 4. Dịch Vụ Khám Bệnh & Bảng Giá Công Khai -->
      <section class="portal-section services-section">
        <div class="section-title-wrap">
          <span class="section-tag-gold">DỊCH VỤ Y TẾ & BẢNG GIÁ</span>
          <h2 class="section-main-heading font-serif">Dịch Vụ Khám & Thiết Bị Y Khoa Toàn Diện</h2>
          <p class="section-sub-desc">
            Bệnh nhân hoàn toàn chủ động tra cứu chi tiết kỹ thuật y khoa, thông số máy móc hiện đại và bảng giá niêm yết minh bạch.
          </p>
          <div class="gold-line-decor"></div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="services-toolbar">
          <div class="category-tabs" role="tablist">
            @for (cat of serviceCategories; track cat.key) {
              <button
                type="button"
                role="tab"
                class="tab-btn"
                [class.active]="selectedCategory() === cat.key"
                (click)="setCategory(cat.key)"
              >
                <span>{{ cat.label }}</span>
                <span class="tab-count">({{ getCategoryCount(cat.key) }})</span>
              </button>
            }
          </div>

          <div class="search-box">
            <span class="search-icon">
              <app-clinic-icon name="search" [size]="16"></app-clinic-icon>
            </span>
            <input
              type="text"
              class="search-input"
              [(ngModel)]="searchQuery"
              placeholder="Tìm kiếm dịch vụ, kỹ thuật (tim mạch, siêu âm, ECG)..."
            />
            @if (searchQuery()) {
              <button class="clear-btn" (click)="searchQuery.set('')">✕</button>
            }
          </div>
        </div>

        <!-- Services Grid -->
        <div class="services-cards-grid">
          @for (svc of filteredServices(); track svc.code) {
            <article class="svc-card clinic-card">
              <div class="svc-card-header">
                <div class="svc-icon-box">
                  <app-clinic-icon [name]="svc.icon" [size]="22" color="#0E4A55"></app-clinic-icon>
                </div>
                <div class="svc-badges">
                  @if (svc.isPopular) {
                    <span class="badge-hot">PHỔ BIẾN</span>
                  }
                  <span class="badge-cat">{{ svc.category }}</span>
                </div>
              </div>

              <div class="svc-card-body">
                <h3 class="svc-title font-serif" (click)="viewDetail(svc.code)" title="Xem chi tiết kỹ thuật & thiết bị">
                  {{ svc.name }}
                </h3>
                <p class="svc-desc">{{ svc.description }}</p>

                <div class="svc-meta-row">
                  <span class="meta-item">
                    <app-clinic-icon name="map-pin" [size]="13" color="#718096"></app-clinic-icon>
                    <span>{{ svc.room }}</span>
                  </span>
                  <span class="meta-item">
                    <app-clinic-icon name="clock" [size]="13" color="#718096"></app-clinic-icon>
                    <span>{{ svc.duration }}</span>
                  </span>
                </div>
              </div>

              <div class="svc-card-footer">
                <div class="price-box">
                  <span class="price-lbl">Giá niêm yết</span>
                  <span class="price-val font-serif">{{ svc.price | vndCurrency }}</span>
                </div>

                <div class="action-btns">
                  <button type="button" class="btn-detail-link" (click)="viewDetail(svc.code)" title="Xem chi tiết dịch vụ & hệ thống máy móc">
                    <app-clinic-icon name="eye" [size]="14"></app-clinic-icon>
                    <span>Chi tiết máy móc</span>
                  </button>
                  <button type="button" class="btn-book-link" (click)="bookService(svc.code)">
                    <span>Đặt khám</span>
                    <app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon>
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      </section>

      <!-- 5. Hệ Thống Máy Móc & Thiết Bị Y Khoa Hiện Đại -->
      <section class="portal-section equipment-section">
        <div class="section-title-wrap">
          <span class="section-tag-gold">CÔNG NGHỆ CHẨN ĐOÁN CAO CẤP</span>
          <h2 class="section-main-heading font-serif">Hệ Thống Máy Móc & Thiết Bị Tiêu Chuẩn Quốc Tế</h2>
          <p class="section-sub-desc">
            Smart Clinic trang bị 100% thiết bị thế hệ mới nhập khẩu từ Hoa Kỳ, Nhật Bản và Châu Âu với chứng nhận FDA, CE Mark và ISO 13485.
          </p>
          <div class="gold-line-decor"></div>
        </div>

        <div class="equipment-grid">
          @for (eq of modernEquipment; track eq.name) {
            <div class="eq-card clinic-card">
              <div class="eq-header">
                <div class="eq-icon-circle">
                  <app-clinic-icon name="sparkle" [size]="20" color="#B8955A"></app-clinic-icon>
                </div>
                <div class="eq-origin-tags">
                  <span class="origin-badge">{{ eq.origin }}</span>
                  @for (cert of eq.certifications; track cert) {
                    <span class="cert-badge">{{ cert }}</span>
                  }
                </div>
              </div>

              <h3 class="eq-name font-serif">{{ eq.name }}</h3>
              <span class="eq-model text-teal font-bold">{{ eq.model }}</span>
              <p class="eq-highlight">{{ eq.highlight }}</p>
              <p class="eq-desc">{{ eq.description }}</p>

              <div class="eq-footer">
                <a [routerLink]="['/services', eq.relatedServiceCode]" class="eq-link">
                  <span>Khám phá dịch vụ áp dụng máy này</span>
                  <app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon>
                </a>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- 6. Đội Ngũ Bác Sĩ Chuyên Khoa Giàu Kinh Nghiệm -->
      <section class="portal-section doctors-section">
        <div class="section-title-wrap">
          <span class="section-tag-gold">ĐỘI NGŨ CHUYÊN GIA</span>
          <h2 class="section-main-heading font-serif">Bác Sĩ Chuyên Khoa Đầu Ngành</h2>
          <p class="section-sub-desc">
            Các Tiến sĩ, Thạc sĩ giàu kinh nghiệm công tác tại các bệnh viện tuyến trung ương trực tiếp thăm khám và tư vấn.
          </p>
          <div class="gold-line-decor"></div>
        </div>

        <div class="doctors-grid">
          @for (doc of publicDoctors; track doc.id) {
            <div class="doc-card clinic-card">
              <div class="doc-header-top">
                <div class="doc-badge-icon">
                  <app-clinic-icon name="stethoscope" [size]="22" color="#0E4A55"></app-clinic-icon>
                </div>
                <span class="doc-room-tag">
                  <app-clinic-icon name="map-pin" [size]="13" color="#0E4A55"></app-clinic-icon> {{ doc.room }}
                </span>
              </div>
              <div class="doc-body">
                <span class="doc-specialty text-teal font-bold">{{ doc.specialty }}</span>
                <h3 class="doc-name font-serif">{{ doc.name }}</h3>
                <span class="doc-title">{{ doc.title }} • {{ doc.experience }}</span>

                <div class="doc-schedule-box">
                  <span class="sch-icon">
                    <app-clinic-icon name="calendar" [size]="15" color="#5E8B7E"></app-clinic-icon>
                  </span>
                  <span class="sch-text">Lịch trực: <strong>{{ doc.scheduleDays }}</strong></span>
                </div>

                <a routerLink="/patient/booking" class="btn-book-doctor">
                  <span>Đặt lịch với bác sĩ này</span>
                  <app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon>
                </a>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- 7. Quy Trình Khám Chữa Bệnh 4 Bước -->
      <section class="portal-section process-section">
        <div class="section-title-wrap">
          <span class="section-tag-gold">HƯỚNG DẪN KHÁM BỆNH</span>
          <h2 class="section-main-heading font-serif">Quy Trình Khám Chữa Bệnh 4 Bước Tinh Gọn</h2>
          <p class="section-sub-desc">
            Mọi quy trình được số hóa minh bạch giúp người bệnh tiết kiệm thời gian, không phải chờ đợi và nhận kết quả tức thì.
          </p>
          <div class="gold-line-decor"></div>
        </div>

        <div class="steps-4-grid">
          <div class="step-box clinic-card">
            <span class="step-num font-serif">01</span>
            <div class="step-icon">
              <app-clinic-icon name="calendar" [size]="24" color="#0E4A55"></app-clinic-icon>
            </div>
            <h3 class="step-title font-bold">Đặt Lịch Hẹn Online</h3>
            <p class="step-desc">Chủ động chọn chuyên khoa, bác sĩ và khung giờ khám mong muốn trên website chỉ mất 2 phút.</p>
          </div>

          <div class="step-box clinic-card">
            <span class="step-num font-serif">02</span>
            <div class="step-icon">
              <app-clinic-icon name="ticket" [size]="24" color="#0E4A55"></app-clinic-icon>
            </div>
            <h3 class="step-title font-bold">Check-in Nhận Số Thứ Tự</h3>
            <p class="step-desc">Đến phòng khám, quét mã QR tại Kiosk sảnh để nhận phiếu khám và phòng khám tự động.</p>
          </div>

          <div class="step-box clinic-card">
            <span class="step-num font-serif">03</span>
            <div class="step-icon">
              <app-clinic-icon name="stethoscope" [size]="24" color="#0E4A55"></app-clinic-icon>
            </div>
            <h3 class="step-title font-bold">Bác Sĩ Thăm Khám</h3>
            <p class="step-desc">Bác sĩ khám lâm sàng, thực hiện cận lâm sàng với hệ thống máy móc chuẩn quốc tế.</p>
          </div>

          <div class="step-box clinic-card">
            <span class="step-num font-serif">04</span>
            <div class="step-icon">
              <app-clinic-icon name="credit-card" [size]="24" color="#0E4A55"></app-clinic-icon>
            </div>
            <h3 class="step-title font-bold">Thanh Toán & Nhận Đơn</h3>
            <p class="step-desc">Quét mã VietQR thanh toán tức thì, xem toa thuốc điện tử và kết quả xét nghiệm trực tuyến.</p>
          </div>
        </div>
      </section>

      <!-- 8. Hotline & Thông Tin Liên Hệ Hỗ Trợ -->
      <section class="patient-contact-banner">
        <div class="contact-inner">
          <div class="contact-info">
            <span class="c-tag">TỔNG ĐÀI HỖ TRỢ 24/7</span>
            <h3 class="c-title font-serif">Cần hỗ trợ y tế khẩn cấp hoặc tư vấn dịch vụ?</h3>
            <p class="c-desc">
              Đội ngũ điều dưỡng và nhân viên chăm sóc khách hàng của Smart Clinic luôn sẵn sàng đồng hành cùng quý khách.
            </p>
          </div>
          <div class="contact-actions">
            <a href="tel:19006868" class="btn-hotline">
              <app-clinic-icon name="phone" [size]="18" color="#FFFFFF"></app-clinic-icon>
              <span>Hotline: 1900 6868</span>
            </a>
            <a routerLink="/" class="btn-view-public-home">
              <app-clinic-icon name="home" [size]="16" color="#0E4A55"></app-clinic-icon>
              <span>Xem trang chủ phòng khám</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .patient-dashboard-container {
        padding-bottom: 48px;
      }

      .patient-hero-banner {
        background: linear-gradient(135deg, #1C2733 0%, #0E4A55 100%);
        border-radius: 20px;
        padding: 40px 44px;
        color: #FFFFFF;
        margin-bottom: 28px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(14, 74, 85, 0.15);
      }

      .welcome-badge {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: #B8955A;
        background: rgba(184, 149, 90, 0.18);
        padding: 4px 12px;
        border-radius: 999px;
        display: inline-block;
        margin-bottom: 12px;
      }

      .hero-heading {
        font-size: 2.1rem;
        color: #F6F3EC;
        margin: 0 0 10px 0;
      }

      .hero-desc {
        color: rgba(246, 243, 236, 0.85);
        font-size: 0.95rem;
        max-width: 660px;
        margin: 0 0 24px 0;
        line-height: 1.5;
      }

      .hero-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .btn-book-primary {
        background: #B8955A;
        color: #FFFFFF;
        padding: 10px 20px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.88rem;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(184, 149, 90, 0.35);

        &:hover {
          background: #a38249;
          transform: translateY(-1px);
        }
      }

      .btn-book-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.25);
        padding: 10px 18px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.88rem;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.18);
        }
      }

      // Active Appointment Card
      .active-appointment-card {
        padding: 26px 30px;
        margin-bottom: 28px;
        background: #FFFFFF;
        border-radius: 16px;
        border: 1.5px solid rgba(184, 149, 90, 0.3);
        box-shadow: 0 6px 20px rgba(184, 149, 90, 0.08);
      }

      .card-badge-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 14px;
        border-bottom: 1px dashed rgba(228, 222, 210, 0.8);
      }

      .live-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(14, 74, 85, 0.08);
        color: #0E4A55;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 4px 12px;
        border-radius: 999px;
      }

      .pulse-dot {
        width: 8px;
        height: 8px;
        background: #D97706;
        border-radius: 50%;
        animation: pulse 1.8s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }

      .appointment-content-grid {
        display: grid;
        grid-template-columns: 240px 1fr auto;
        gap: 28px;
        align-items: center;

        @media (max-width: 992px) {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }

      .ticket-big-box {
        background: #F6F3EC;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 18px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .ticket-label {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #718096;
        margin-bottom: 4px;
      }

      .ticket-number {
        font-size: 2.8rem;
        font-weight: 800;
        color: #0E4A55;
        line-height: 1.1;
      }

      .ticket-sub {
        font-size: 0.78rem;
        color: #718096;
        margin-top: 6px;

        strong {
          color: #1C2733;
        }
      }

      .appointment-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .detail-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .d-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(14, 74, 85, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .d-text {
        display: flex;
        flex-direction: column;
      }

      .d-label {
        font-size: 0.74rem;
        color: #718096;
      }

      .d-val {
        font-size: 0.92rem;
        font-weight: 600;
        color: #1C2733;

        &.text-teal {
          color: #0E4A55;
        }
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
        padding: 9px 18px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;

        &:hover {
          background: #09343c;
        }
      }

      .btn-ticket-reschedule {
        background: transparent;
        color: #718096;
        border: 1px solid #CBD5E0;
        padding: 8px 18px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 500;
        text-decoration: none;
        text-align: center;
        transition: all 0.2s;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
        }
      }

      // Quick Features 4-Grid
      .features-4-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 18px;
        margin-bottom: 40px;

        @media (max-width: 992px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 576px) {
          grid-template-columns: 1fr;
        }
      }

      .feature-box {
        background: #FFFFFF;
        border: 1px solid rgba(228, 222, 210, 0.8);
        border-radius: 14px;
        padding: 22px;
        display: flex;
        flex-direction: column;
        transition: all 0.25s ease;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(28, 39, 51, 0.08);
          border-color: #B8955A;
        }
      }

      .f-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(14, 74, 85, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
      }

      .f-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #1C2733;
        margin: 0 0 6px 0;
      }

      .f-desc {
        font-size: 0.82rem;
        color: #718096;
        line-height: 1.45;
        margin: 0 0 16px 0;
        flex: 1;
      }

      .f-link {
        font-size: 0.82rem;
        font-weight: 600;
        color: #0E4A55;
        text-decoration: none;
        align-self: flex-start;

        &:hover {
          color: #B8955A;
        }
      }

      // Shared Section Styling
      .portal-section {
        background: #FFFFFF;
        border: 1px solid rgba(228, 222, 210, 0.8);
        border-radius: 20px;
        padding: 36px 36px;
        margin-bottom: 32px;
        box-shadow: 0 4px 18px rgba(28, 39, 51, 0.04);
      }

      .section-title-wrap {
        text-align: center;
        max-width: 720px;
        margin: 0 auto 30px auto;
      }

      .section-tag-gold {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: #B8955A;
        background: rgba(184, 149, 90, 0.12);
        padding: 3px 12px;
        border-radius: 999px;
        display: inline-block;
        margin-bottom: 10px;
      }

      .section-main-heading {
        font-size: 1.85rem;
        color: #1C2733;
        margin: 0 0 10px 0;
      }

      .section-sub-desc {
        font-size: 0.9rem;
        color: #718096;
        line-height: 1.5;
        margin: 0;
      }

      .gold-line-decor {
        width: 48px;
        height: 2px;
        background: #B8955A;
        margin: 14px auto 0 auto;
        border-radius: 2px;
      }

      // 4. Services Section
      .services-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .category-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .tab-btn {
        background: #F6F3EC;
        border: 1px solid #E4DED2;
        padding: 7px 14px;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 600;
        color: #1C2733;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;

        &:hover {
          border-color: #B8955A;
          color: #0E4A55;
        }

        &.active {
          background: #0E4A55;
          color: #FFFFFF;
          border-color: #0E4A55;

          .tab-count {
            color: #ECC880;
          }
        }
      }

      .tab-count {
        font-size: 0.72rem;
        opacity: 0.85;
      }

      .search-box {
        position: relative;
        min-width: 280px;

        @media (max-width: 600px) {
          width: 100%;
        }
      }

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #718096;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 8px 32px 8px 36px;
        border: 1px solid #E4DED2;
        border-radius: 10px;
        font-size: 0.85rem;
        background: #FAFAFA;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #0E4A55;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.1);
        }
      }

      .clear-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #A0AEC0;
        cursor: pointer;
        font-size: 0.8rem;
      }

      .services-cards-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;

        @media (max-width: 1100px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 680px) {
          grid-template-columns: 1fr;
        }
      }

      .svc-card {
        background: #FFFFFF;
        border: 1px solid rgba(228, 222, 210, 0.9);
        border-radius: 16px;
        padding: 22px;
        display: flex;
        flex-direction: column;
        transition: all 0.25s ease;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(28, 39, 51, 0.08);
          border-color: #B8955A;
        }
      }

      .svc-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }

      .svc-icon-box {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(14, 74, 85, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .svc-badges {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .badge-hot {
        background: #FEE2E2;
        color: #DC2626;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
      }

      .badge-cat {
        background: #F6F3EC;
        color: #0E4A55;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
      }

      .svc-card-body {
        flex: 1;
        margin-bottom: 16px;
      }

      .svc-title {
        font-size: 1.15rem;
        color: #1C2733;
        margin: 0 0 8px 0;
        cursor: pointer;
        line-height: 1.35;
        transition: color 0.2s;

        &:hover {
          color: #B8955A;
        }
      }

      .svc-desc {
        font-size: 0.83rem;
        color: #718096;
        line-height: 1.45;
        margin: 0 0 14px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .svc-meta-row {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }

      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
        color: #718096;
      }

      .svc-card-footer {
        padding-top: 14px;
        border-top: 1px dashed rgba(228, 222, 210, 0.8);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }

      .price-box {
        display: flex;
        flex-direction: column;
      }

      .price-lbl {
        font-size: 0.68rem;
        color: #718096;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .price-val {
        font-size: 1.15rem;
        font-weight: 700;
        color: #0E4A55;
      }

      .action-btns {
        display: flex;
        gap: 8px;
      }

      .btn-detail-link {
        background: transparent;
        color: #0E4A55;
        border: 1px solid #CBD5E0;
        padding: 7px 12px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;

        &:hover {
          border-color: #0E4A55;
          background: rgba(14, 74, 85, 0.05);
        }
      }

      .btn-book-link {
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;

        &:hover {
          background: #B8955A;
        }
      }

      // 5. Equipment Section
      .equipment-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 22px;

        @media (max-width: 900px) {
          grid-template-columns: 1fr;
        }
      }

      .eq-card {
        background: #FAFAFA;
        border: 1px solid #E4DED2;
        border-radius: 16px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        transition: all 0.25s;

        &:hover {
          border-color: #B8955A;
          background: #FFFFFF;
          box-shadow: 0 8px 24px rgba(28, 39, 51, 0.07);
        }
      }

      .eq-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        flex-wrap: wrap;
        gap: 8px;
      }

      .eq-icon-circle {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(184, 149, 90, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .eq-origin-tags {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .origin-badge {
        background: #0E4A55;
        color: #FFFFFF;
        font-size: 0.68rem;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 6px;
      }

      .cert-badge {
        background: rgba(184, 149, 90, 0.18);
        color: #8C6F34;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 3px 7px;
        border-radius: 6px;
      }

      .eq-name {
        font-size: 1.25rem;
        color: #1C2733;
        margin: 0 0 4px 0;
      }

      .eq-model {
        font-size: 0.85rem;
        margin-bottom: 8px;
        display: block;
      }

      .eq-highlight {
        font-size: 0.84rem;
        font-weight: 600;
        color: #4A5568;
        margin: 0 0 8px 0;
        line-height: 1.4;
      }

      .eq-desc {
        font-size: 0.82rem;
        color: #718096;
        line-height: 1.45;
        margin: 0 0 16px 0;
        flex: 1;
      }

      .eq-footer {
        padding-top: 12px;
        border-top: 1px dashed rgba(228, 222, 210, 0.8);
      }

      .eq-link {
        font-size: 0.82rem;
        font-weight: 600;
        color: #0E4A55;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;

        &:hover {
          color: #B8955A;
        }
      }

      // 6. Doctors Section
      .doctors-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;

        @media (max-width: 992px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .doc-card {
        background: #FFFFFF;
        border: 1px solid rgba(228, 222, 210, 0.8);
        border-radius: 16px;
        padding: 22px;
        display: flex;
        flex-direction: column;
        transition: all 0.25s ease;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 22px rgba(28, 39, 51, 0.08);
          border-color: #B8955A;
        }
      }

      .doc-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }

      .doc-badge-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(14, 74, 85, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .doc-room-tag {
        font-size: 0.75rem;
        color: #0E4A55;
        font-weight: 600;
        background: #F6F3EC;
        padding: 4px 10px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .doc-specialty {
        font-size: 0.78rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 4px;
        display: block;
      }

      .doc-name {
        font-size: 1.2rem;
        color: #1C2733;
        margin: 0 0 4px 0;
      }

      .doc-title {
        font-size: 0.8rem;
        color: #718096;
        margin-bottom: 14px;
        display: block;
      }

      .doc-schedule-box {
        background: #F6F3EC;
        border-radius: 8px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.78rem;
        color: #4A5568;
        margin-bottom: 16px;
      }

      .btn-book-doctor {
        background: transparent;
        color: #0E4A55;
        border: 1px solid #0E4A55;
        padding: 9px 16px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s;

        &:hover {
          background: #0E4A55;
          color: #FFFFFF;
        }
      }

      // 7. Process Section
      .steps-4-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 18px;

        @media (max-width: 992px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 576px) {
          grid-template-columns: 1fr;
        }
      }

      .step-box {
        background: #F6F3EC;
        border: 1px solid #E4DED2;
        border-radius: 14px;
        padding: 22px;
        display: flex;
        flex-direction: column;
        position: relative;
        transition: all 0.25s;

        &:hover {
          background: #FFFFFF;
          border-color: #B8955A;
          box-shadow: 0 6px 20px rgba(28, 39, 51, 0.06);
        }
      }

      .step-num {
        font-size: 1.6rem;
        font-weight: 800;
        color: #B8955A;
        margin-bottom: 6px;
      }

      .step-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(14, 74, 85, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }

      .step-title {
        font-size: 1rem;
        color: #1C2733;
        margin: 0 0 6px 0;
      }

      .step-desc {
        font-size: 0.8rem;
        color: #718096;
        line-height: 1.45;
        margin: 0;
      }

      // 8. Contact Banner
      .patient-contact-banner {
        background: linear-gradient(135deg, #1C2733 0%, #0E4A55 100%);
        border-radius: 20px;
        padding: 34px 40px;
        color: #FFFFFF;
      }

      .contact-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        flex-wrap: wrap;
      }

      .contact-info {
        max-width: 580px;
      }

      .c-tag {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: #B8955A;
        background: rgba(184, 149, 90, 0.18);
        padding: 3px 10px;
        border-radius: 999px;
        display: inline-block;
        margin-bottom: 8px;
      }

      .c-title {
        font-size: 1.5rem;
        color: #F6F3EC;
        margin: 0 0 6px 0;
      }

      .c-desc {
        font-size: 0.88rem;
        color: rgba(246, 243, 236, 0.85);
        margin: 0;
        line-height: 1.45;
      }

      .contact-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .btn-hotline {
        background: #DC2626;
        color: #FFFFFF;
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 700;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;

        &:hover {
          background: #B91C1C;
        }
      }

      .btn-view-public-home {
        background: #F6F3EC;
        color: #0E4A55;
        padding: 10px 18px;
        border-radius: 10px;
        font-size: 0.88rem;
        font-weight: 600;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;

        &:hover {
          background: #FFFFFF;
        }
      }
    `,
  ],
})
export class PatientHomeComponent {
  private authService = inject(AuthService);
  private queueService = inject(QueueService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  todayTicket = signal({
    number: 'A-015',
    status: 'WAITING' as const,
    estimatedTime: '09:30',
    room: 'Khoa Tim Mạch • Phòng Khám Nội 101 (Tầng 1)',
    doctor: 'TS.BS Trần Minh Hoàng (Chuyên khoa II)',
    currentCalling: 'A-012',
    peopleAhead: 2,
  });

  serviceCategories = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'KHÁM BỆNH', label: 'Khám bệnh' },
    { key: 'CẬN LÂM SÀNG', label: 'Cận lâm sàng' },
    { key: 'CHẨN ĐOÁN HÌNH ẢNH', label: 'CĐHA' },
    { key: 'XÉT NGHIỆM', label: 'Xét nghiệm' },
  ];

  selectedCategory = signal<string>('ALL');
  searchQuery = signal<string>('');

  publicServices: ServiceItem[] = [
    {
      code: 'KB-TIMMACH',
      name: 'Khám Chuyên Khoa Tim Mạch Toàn Diện',
      category: 'KHÁM BỆNH',
      price: 200000,
      duration: '20 - 30 phút',
      room: 'Phòng khám Nội 101',
      icon: 'heart-pulse',
      description: 'Thăm khám, đo huyết áp, đánh giá nguy cơ xơ vữa, suy tim và bệnh mạch vành.',
      isPopular: true,
    },
    {
      code: 'KB-NOITQ',
      name: 'Khám Nội Tổng Quát & Tầm Soát',
      category: 'KHÁM BỆNH',
      price: 150000,
      duration: '15 - 20 phút',
      room: 'Phòng khám Nội 102',
      icon: 'stethoscope',
      description: 'Đánh giá chỉ số sinh hiệu, tầm soát các bệnh mạn tính tiểu đường, mỡ máu, gout.',
      isPopular: true,
    },
    {
      code: 'KB-COXUONG',
      name: 'Khám Cơ Xương Khớp & Cột Sống',
      category: 'KHÁM BỆNH',
      price: 180000,
      duration: '20 phút',
      room: 'Phòng khám Ngoại 201',
      icon: 'activity',
      description: 'Khám thoái hóa khớp, thoát vị đĩa đệm, đau dây thần kinh tọa và bệnh gút.',
    },
    {
      code: 'CLS-ECG',
      name: 'Điện Tâm Đồ 12 Chuyển Đạo Kỹ Thuật Số',
      category: 'CẬN LÂM SÀNG',
      price: 80000,
      duration: '10 phút',
      room: 'Phòng Thăm Dò Chức Năng',
      icon: 'activity',
      description: 'Phát hiện rối loạn nhịp tim, thiếu máu cơ tim và biến chứng tim mạch sớm.',
    },
    {
      code: 'US-BUNGTQ',
      name: 'Siêu Âm Ổ Bụng Tổng Quát Doppler',
      category: 'CHẨN ĐOÁN HÌNH ẢNH',
      price: 250000,
      duration: '15 phút',
      room: 'Phòng Siêu Âm 01',
      icon: 'xray',
      description: 'Khảo sát gan mật, thận, tụy, lách, tiền liệt tuyến và hệ tiêu hóa rõ nét.',
      isPopular: true,
    },
    {
      code: 'XR-NGUC',
      name: 'X-Quang Ngực Thẳng Kỹ Thuật Số (DR)',
      category: 'CHẨN ĐOÁN HÌNH ẢNH',
      price: 150000,
      duration: '10 phút',
      room: 'Phòng X-Quang Kỹ Thuật Số',
      icon: 'xray',
      description: 'Hình ảnh phổi, bóng tim và lồng ngực kỹ thuật số độ phân giải cao, liều tia thấp.',
    },
    {
      code: 'XN-CBC24',
      name: 'Tổng Phân Tích Tế Bào Máu (CBC 24)',
      category: 'XÉT NGHIỆM',
      price: 120000,
      duration: '30 phút',
      room: 'Phòng Xét Nghiệm Trung Tâm',
      icon: 'flask',
      description: 'Đánh giá thiếu máu, tình trạng viêm nhiễm, tiểu cầu và các chỉ số máu cơ bản.',
    },
  ];

  filteredServices = computed(() => {
    let list = this.publicServices;
    const cat = this.selectedCategory();
    if (cat !== 'ALL') {
      list = list.filter((s) => s.category === cat);
    }
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.room.toLowerCase().includes(q)
      );
    }
    return list;
  });

  modernEquipment: EquipmentItem[] = [
    {
      name: 'Máy Siêu Âm Tim 4D Ma Trận GE Vivid E95',
      model: 'GE Healthcare Vivid E95 4D Matrix',
      origin: 'Hoa Kỳ (GE Healthcare)',
      certifications: ['FDA (Hoa Kỳ)', 'CE Mark', 'ISO 13485'],
      highlight: 'Công nghệ đầu dò ma trận 4V-D và kiến trúc xử lý hình ảnh cSound™',
      description: 'Dựng hình thể tích buồng tim và dòng máu chuyển động 4D thời gian thực. Tự động đo phân suất tống máu EF bằng AI, phát hiện tổn thương cơ tim giai đoạn sớm.',
      relatedServiceCode: 'KB-TIMMACH',
    },
    {
      name: 'Hệ Thống X-Quang Kỹ Thuật Số Carestream DRX',
      model: 'Carestream DRX-Evolution Plus',
      origin: 'Hoa Kỳ (Carestream)',
      certifications: ['FDA (Hoa Kỳ)', 'CE Mark'],
      highlight: 'Tấm cảm biến phẳng Cesium Iodide (CsI) giảm 50% liều tia bức xạ',
      description: 'Chụp X-quang kỹ thuật số thế hệ mới cho hình ảnh xương khớp và lồng ngực sắc nét trong 3 giây, tự động truyền PACS không cần rửa phim nhựa độc hại.',
      relatedServiceCode: 'XR-NGUC',
    },
    {
      name: 'Hệ Thống Phân Tích Tự Động Roche Cobas Pro',
      model: 'Roche Cobas Pro Integrated Solutions',
      origin: 'Thụy Sĩ & CHLB Đức',
      certifications: ['FDA Approved', 'CE-IVD', 'ISO 15189'],
      highlight: 'Công suất lên tới 2.200 xét nghiệm/giờ với độ lặp lại chính xác tuyệt đối',
      description: 'Tự động hóa hoàn toàn quy trình xét nghiệm sinh hóa, miễn dịch và huyết học, trả kết quả xét nghiệm lên hồ sơ EMR trực tuyến sau 30-45 phút.',
      relatedServiceCode: 'XN-CBC24',
    },
    {
      name: 'Máy Điện Tim 12 Cần Nihon Kohden Cardiofax',
      model: 'Nihon Kohden Cardiofax M (ECG-2350)',
      origin: 'Nhật Bản (Nihon Kohden)',
      certifications: ['JIS (Nhật Bản)', 'CE Mark'],
      highlight: 'Phần mềm phân tích điện tim thông minh ECAPS 12C đạt độ chính xác cao',
      description: 'Ghi nhận và phân tích đồng thời 12 đạo trình điện tim, lọc nhiễu tự động và cảnh báo tức thời các đợt loạn nhịp tim nguy hiểm hoặc thiếu máu cơ tim cấp.',
      relatedServiceCode: 'CLS-ECG',
    },
  ];

  publicDoctors: DoctorItem[] = [
    {
      id: 'doc-01',
      name: 'TS.BS Trần Minh Hoàng',
      title: 'Tiến sĩ Y khoa • Bác sĩ Chuyên khoa II',
      specialty: 'Khoa Tim Mạch',
      room: 'Phòng khám Nội 101 (Tầng 1)',
      scheduleDays: 'Thứ 2 – Thứ 7 (Ca Sáng & Chiều)',
      experience: '22 năm kinh nghiệm',
    },
    {
      id: 'doc-02',
      name: 'ThS.BS Nguyễn Thị Mai Lan',
      title: 'Thạc sĩ Bác sĩ Nội trú',
      specialty: 'Khoa Nội Tổng Quát',
      room: 'Phòng khám Nội 102 (Tầng 1)',
      scheduleDays: 'Thứ 2 – Chủ Nhật (Ca Sáng)',
      experience: '14 năm kinh nghiệm',
    },
    {
      id: 'doc-03',
      name: 'BS.CKI Lê Quốc Hưng',
      title: 'Bác sĩ Chuyên khoa I',
      specialty: 'Khoa Tiêu Hóa - Gan Mật',
      room: 'Phòng khám Nội 103 (Tầng 1)',
      scheduleDays: 'Thứ 2 – Thứ 6 (Ca Sáng)',
      experience: '16 năm kinh nghiệm',
    },
  ];

  setCategory(key: string): void {
    this.selectedCategory.set(key);
  }

  getCategoryCount(key: string): number {
    if (key === 'ALL') return this.publicServices.length;
    return this.publicServices.filter((s) => s.category === key).length;
  }

  viewDetail(code: string): void {
    this.router.navigate(['/services', code]);
  }

  bookService(code: string): void {
    this.router.navigate(['/patient/booking'], { queryParams: { serviceId: code } });
  }

  printTicket(): void {
    window.print();
  }
}
