import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ClinicIconComponent, ClinicIconName } from '../../../shared/components/clinic-icon/clinic-icon.component';

interface PublicService {
  code: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  room: string;
  icon: ClinicIconName;
  description: string;
}

interface PublicDoctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  room: string;
  scheduleDays: string;
  avatarUrl: string;
  experience: string;
}

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ClinicIconComponent],
  template: `
    <div class="landing-container">
      <!-- 1. Sticky Transparent Glass Header -->
      <header class="public-header glass-header" [class.scrolled]="isScrolled()">
        <div class="header-inner">
          <a routerLink="/" class="logo-group">
            <span class="logo-symbol">
              <app-clinic-icon name="medical-cross" [size]="20" color="#B8955A"></app-clinic-icon>
            </span>
            <div class="logo-text">
              <span class="logo-title font-serif">SMART CLINIC</span>
              <span class="logo-sub">PHÒNG KHÁM ĐA KHOA QUỐC TẾ</span>
            </div>
          </a>

          <!-- Anchor Navigation Links -->
          <nav class="nav-links">
            <a
              href="#services"
              (click)="scrollToSection($event, 'services')"
              class="nav-link"
              [class.active]="activeSection() === 'services'"
            >
              Dịch Vụ & Giá
            </a>
            <a
              href="#doctors"
              (click)="scrollToSection($event, 'doctors')"
              class="nav-link"
              [class.active]="activeSection() === 'doctors'"
            >
              Bác Sĩ
            </a>
            <a
              href="#process"
              (click)="scrollToSection($event, 'process')"
              class="nav-link"
              [class.active]="activeSection() === 'process'"
            >
              Quy Trình Khám
            </a>
            <a
              href="#benefits"
              (click)="scrollToSection($event, 'benefits')"
              class="nav-link"
              [class.active]="activeSection() === 'benefits'"
            >
              Lợi Ích
            </a>
            <a
              href="#contact"
              (click)="scrollToSection($event, 'contact')"
              class="nav-link"
              [class.active]="activeSection() === 'contact'"
            >
              Liên Hệ
            </a>
            <a routerLink="/lobby-display" class="nav-link highlight-lobby">
              <span class="pulse-dot"></span> Bảng gọi số sảnh chờ
            </a>
          </nav>

          <!-- Action Buttons -->
          <div class="header-actions">
            <a routerLink="/auth/login" class="nav-account-btn" title="Cổng đăng nhập và đăng ký tài khoản">
              <span class="account-avatar-badge">
                <app-clinic-icon name="user" [size]="14"></app-clinic-icon>
              </span>
              <span class="account-text-group">
                <span class="acc-main">Đăng nhập</span>
                <span class="acc-slash">/</span>
                <span class="acc-sub">Đăng ký</span>
              </span>
            </a>
            <button (click)="goToBooking()" class="btn-primary-teal">
              <app-clinic-icon name="calendar" [size]="15"></app-clinic-icon>
              <span>Đặt lịch khám</span>
            </button>
          </div>
        </div>
      </header>

      <!-- 2. Hero Section -->
      <section class="hero-section">
        <div class="hero-inner">
          <div class="hero-content">
            <div class="hero-badge">
              <app-clinic-icon name="sparkle" [size]="14" color="#B8955A"></app-clinic-icon>
              <span>TIÊU CHUẨN Y KHOA HIỆN ĐẠI • HỒ SƠ EMR THÔNG MINH</span>
            </div>

            <h1 class="hero-title font-serif">
              Chăm sóc tận tâm,<br />
              <span class="text-gold">quy trình minh bạch.</span>
            </h1>

            <p class="hero-desc">
              Hệ thống EMR thông minh kết nối bác sĩ chuyên khoa đầu ngành, theo dõi số thứ tự khám bệnh thời gian thực và quản lý hồ sơ sức khỏe trọn đời hoàn toàn trực tuyến.
            </p>

            <div class="hero-cta-group">
              <button (click)="goToBooking()" class="btn-hero-booking">
                <span class="btn-title-with-icon">
                  <app-clinic-icon name="calendar" [size]="18" color="#FFFFFF"></app-clinic-icon>
                  <span>Đặt lịch khám ngay</span>
                </span>
                <span class="btn-subtext">Chỉ mất 2 phút • Không cần chờ đợi</span>
              </button>

              <a routerLink="/auth/login" class="btn-hero-staff">
                <span class="btn-title-with-icon">
                  <app-clinic-icon name="shield-check" [size]="18" color="#0E4A55"></app-clinic-icon>
                  <span>Cổng nhân viên nội bộ</span>
                </span>
                <span class="btn-subtext">Bác sĩ • Lễ tân • Quản trị</span>
              </a>
            </div>

            <!-- Micro feature pills -->
            <div class="hero-pills">
              <span class="pill-item">
                <app-clinic-icon name="check" [size]="14" color="#5E8B7E"></app-clinic-icon>
                <span>Không chen lấn xếp hàng</span>
              </span>
              <span class="pill-item">
                <app-clinic-icon name="check" [size]="14" color="#5E8B7E"></app-clinic-icon>
                <span>Tra cứu đơn thuốc & xét nghiệm online</span>
              </span>
              <span class="pill-item">
                <app-clinic-icon name="check" [size]="14" color="#5E8B7E"></app-clinic-icon>
                <span>Thanh toán VietQR tức thì</span>
              </span>
            </div>
          </div>

          <!-- Hero Right Visual Graphic -->
          <div class="hero-visual">
            <div class="visual-art-card">
              <div class="visual-glow-circle"></div>
              
              <!-- Floating Multi-Room Live Queue Monitor Card -->
              <div class="floating-ticket-card">
                <div class="ticket-header">
                  <span class="ticket-badge">ĐIỀU PHỐI KHÁM CÁC BUỒNG</span>
                  <span class="live-tag"><span class="live-dot"></span> LIVE REAL-TIME</span>
                </div>

                <div class="rooms-queue-list">
                  @for (st of liveStations; track st.room) {
                    <div class="room-queue-row" [class.is-calling]="st.status === 'CALLING'">
                      <div class="room-col-info">
                        <div class="r-top">
                          <span class="r-name">{{ st.room }}</span>
                          <span class="r-spec">{{ st.specialty }}</span>
                        </div>
                        <span class="r-doc">{{ st.doc }}</span>
                      </div>
                      <div class="room-col-ticket">
                        <div class="r-ticket-box">
                          <span class="r-stt-label">Đang gọi</span>
                          <span class="r-ticket font-serif font-bold">{{ st.ticket }}</span>
                        </div>
                        <span class="r-status-pill" [class.calling]="st.status === 'CALLING'">
                          {{ st.status === 'CALLING' ? 'Mời vào' : 'Đang khám' }}
                        </span>
                      </div>
                    </div>
                  }
                </div>

                <div class="ticket-card-footer">
                  <a routerLink="/lobby-display" class="link-full-lobby">
                    <span>Màn hình sảnh chờ</span>
                    <app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon>
                  </a>
                  <a routerLink="/patient/queue" class="link-my-ticket" title="Tra cứu số thứ tự của bạn">
                    <app-clinic-icon name="ticket" [size]="14"></app-clinic-icon>
                    <span>Tra cứu lượt khám</span>
                  </a>
                </div>
              </div>

              <!-- Secondary Floating Badge -->
              <div class="floating-mini-badge">
                <app-clinic-icon name="file-text" [size]="20" color="#E6CE9F"></app-clinic-icon>
                <div class="badge-text">
                  <span class="b-title">Bệnh án điện tử EMR</span>
                  <span class="b-desc">Bảo mật chuẩn Bộ Y Tế</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Trust Counter Strip -->
      <section class="trust-strip">
        <div class="trust-inner">
          <div class="trust-item">
            <span class="trust-num font-serif text-teal">15+</span>
            <span class="trust-label">Bác sĩ chuyên khoa & Tiến sĩ đầu ngành</span>
          </div>
          <div class="trust-divider"></div>
          <div class="trust-item">
            <span class="trust-num font-serif text-gold">100%</span>
            <span class="trust-label">Hồ sơ bệnh án điện tử số hóa minh bạch</span>
          </div>
          <div class="trust-divider"></div>
          <div class="trust-item">
            <span class="trust-num font-serif text-teal">07:00 - 20:30</span>
            <span class="trust-label">Phục vụ liên tục cả tuần (kể cả Thứ 7, CN)</span>
          </div>
          <div class="trust-divider"></div>
          <div class="trust-item">
            <span class="trust-num font-serif text-burgundy">&lt; 15 phút</span>
            <span class="trust-label">Thời gian chờ khám trung bình tối ưu</span>
          </div>
        </div>
      </section>

      <!-- 4. Services & Specialties Section -->
      <section id="services" class="section-container">
        <div class="section-header-center">
          <span class="section-tag">DANH MỤC DỊCH VỤ Y TẾ • SRS 3.3.1</span>
          <h2 class="section-heading font-serif">Dịch Vụ Khám Bệnh & Bảng Giá Công Khai</h2>
          <p class="section-subheading">
            Bệnh nhân hoàn toàn chủ động tra cứu chi tiết giá khám, xét nghiệm và kỹ thuật cận lâm sàng trước khi đến phòng khám.
          </p>
        </div>

        <!-- Service Search & Filter Toolbar -->
        <div class="service-search-bar">
          <div class="search-input-box">
            <app-clinic-icon name="search" [size]="18" class="search-icon"></app-clinic-icon>
            <input
              type="text"
              placeholder="Nhập tên dịch vụ, xét nghiệm hoặc kỹ thuật cần tìm (vd: tim mạch, ECG, siêu âm, máu)..."
              [(ngModel)]="serviceSearchQuery"
              class="clinic-input search-input"
            />
          </div>

          <div class="category-filter-chips">
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedServiceCategory === 'ALL'"
              (click)="selectedServiceCategory = 'ALL'"
            >
              Tất cả ({{ publicServices.length }})
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedServiceCategory === 'KHÁM BỆNH'"
              (click)="selectedServiceCategory = 'KHÁM BỆNH'"
            >
              Khám Bệnh
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedServiceCategory === 'CHẨN ĐOÁN HÌNH ẢNH'"
              (click)="selectedServiceCategory = 'CHẨN ĐOÁN HÌNH ẢNH'"
            >
              CĐ Hình Ảnh
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedServiceCategory === 'XÉT NGHIỆM'"
              (click)="selectedServiceCategory = 'XÉT NGHIỆM'"
            >
              Xét Nghiệm
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedServiceCategory === 'CẬN LÂM SÀNG'"
              (click)="selectedServiceCategory = 'CẬN LÂM SÀNG'"
            >
              Cận Lâm Sàng
            </button>
          </div>
        </div>

        <!-- Services Grid -->
        <div class="services-grid">
          @for (svc of filteredPublicServices(); track svc.code) {
            <div class="service-card animate-card-pop">
              <div class="card-top">
                <span class="svc-icon">
                  <app-clinic-icon [name]="svc.icon" [size]="24" color="#0E4A55"></app-clinic-icon>
                </span>
                <span class="svc-cat">{{ svc.category }}</span>
              </div>
              <h3 class="svc-title font-bold">{{ svc.name }}</h3>
              <p class="svc-desc">{{ svc.description }}</p>
              
              <div class="svc-meta">
                <span class="meta-item">
                  <app-clinic-icon name="map-pin" [size]="14" color="#5E8B7E"></app-clinic-icon> {{ svc.room }}
                </span>
                <span class="meta-item">
                  <app-clinic-icon name="clock" [size]="14" color="#5E8B7E"></app-clinic-icon> {{ svc.duration }}
                </span>
              </div>

              <div class="svc-footer">
                <div class="svc-price-box">
                  <span class="price-label">Giá niêm yết:</span>
                  <span class="price-val font-bold text-teal">{{ svc.price | number }} đ</span>
                </div>
                <button (click)="goToBooking(svc.name)" class="btn-book-service">
                  Đặt khám
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- 5. Doctor Team Showcase -->
      <section id="doctors" class="section-container bg-warm">
        <div class="section-header-center">
          <span class="section-tag">ĐỘI NGŨ CHUYÊN GIA</span>
          <h2 class="section-heading font-serif">Bác Sĩ Chuyên Khoa Giàu Kinh Nghiệm</h2>
          <p class="section-subheading">
            Đội ngũ Tiến sĩ, Thạc sĩ và Bác sĩ CKI công tác tại các bệnh viện tuyến trung ương trực tiếp thăm khám và tư vấn.
          </p>
        </div>

        <div class="doctors-grid">
          @for (doc of publicDoctors; track doc.id) {
            <div class="doctor-card">
              <div class="doc-image-wrap">
                <img [src]="doc.avatarUrl" [alt]="doc.name" class="doc-img" />
                <span class="doc-room-tag">
                  <app-clinic-icon name="map-pin" [size]="13" color="#ffffff"></app-clinic-icon> {{ doc.room }}
                </span>
              </div>
              <div class="doc-body">
                <span class="doc-specialty text-teal font-bold">{{ doc.specialty }}</span>
                <h3 class="doc-name font-bold">{{ doc.name }}</h3>
                <span class="doc-title">{{ doc.title }} • {{ doc.experience }}</span>

                <div class="doc-schedule-box">
                  <span class="sch-icon">
                    <app-clinic-icon name="calendar" [size]="15" color="#5E8B7E"></app-clinic-icon>
                  </span>
                  <span class="sch-text">Lịch trực: <strong>{{ doc.scheduleDays }}</strong></span>
                </div>

                <button (click)="goToBookingWithDoctor(doc.name)" class="btn-book-doctor">
                  <span>Đặt lịch với bác sĩ này</span>
                  <app-clinic-icon name="arrow-right" [size]="14"></app-clinic-icon>
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- 6. 4-Step Clinical Process -->
      <section id="process" class="section-container">
        <div class="section-header-center">
          <span class="section-tag">HƯỚNG DẪN BỆNH NHÂN</span>
          <h2 class="section-heading font-serif">Quy Trình Khám Chữa Bệnh 4 Bước</h2>
          <p class="section-subheading">
            Tối ưu hóa từng điểm chạm giúp bạn tiết kiệm thời gian, theo dõi tiến trình khám minh bạch và nhận kết quả tức thì.
          </p>
        </div>

        <div class="process-steps-grid">
          <div class="step-card">
            <div class="step-number font-serif">01</div>
            <div class="step-icon">
              <app-clinic-icon name="calendar" [size]="28" color="#0E4A55"></app-clinic-icon>
            </div>
            <h3 class="step-title font-bold">Đặt Lịch Hẹn Online</h3>
            <p class="step-desc">
              Chọn chuyên khoa, bác sĩ và khung giờ mong muốn qua website trong chưa đầy 2 phút.
            </p>
          </div>

          <div class="step-card">
            <div class="step-number font-serif">02</div>
            <div class="step-icon">
              <app-clinic-icon name="ticket" [size]="28" color="#0E4A55"></app-clinic-icon>
            </div>
            <h3 class="step-title font-bold">Check-in & Nhận Số</h3>
            <p class="step-desc">
              Quét mã QR tại quầy tiếp đón hoặc Kiosk sảnh để nhận số thứ tự thông minh và phân buồng khám ngay lập tức.
            </p>
          </div>

          <div class="step-card">
            <div class="step-number font-serif">03</div>
            <div class="step-icon">
              <app-clinic-icon name="stethoscope" [size]="28" color="#0E4A55"></app-clinic-icon>
            </div>
            <h3 class="step-title font-bold">Khám & Cận Lâm Sàng</h3>
            <p class="step-desc">
              Bác sĩ thăm khám, chỉ định xét nghiệm/chẩn đoán hình ảnh. Toàn bộ kết quả cập nhật số hóa trực tiếp lên EMR.
            </p>
          </div>

          <div class="step-card">
            <div class="step-number font-serif">04</div>
            <div class="step-icon">
              <app-clinic-icon name="credit-card" [size]="28" color="#0E4A55"></app-clinic-icon>
            </div>
            <h3 class="step-title font-bold">Thanh Toán & Nhận Đơn</h3>
            <p class="step-desc">
              Thanh toán linh hoạt tiền mặt hoặc quét mã VietQR 24/7. Nhận đơn thuốc điện tử và hướng dẫn chăm sóc online.
            </p>
          </div>
        </div>

        <!-- Payment Highlight Banner -->
        <div class="payment-highlight-banner">
          <span class="pay-icon">
            <app-clinic-icon name="sparkle" [size]="22" color="#B8955A"></app-clinic-icon>
          </span>
          <div class="pay-text">
            <strong>Hỗ trợ thanh toán đa kênh:</strong> Thanh toán tiền mặt tại quầy thu ngân hoặc quét mã VietQR tự động qua ứng dụng ngân hàng số không cần chờ lấy hóa đơn giấy.
          </div>
        </div>
      </section>

      <!-- 7. System Benefits -->
      <section id="benefits" class="section-container bg-dark-slate">
        <div class="section-header-center dark-theme">
          <span class="section-tag gold-tag">CÔNG NGHỆ EMR THẾ HỆ MỚI</span>
          <h2 class="section-heading font-serif text-white">Lợi Ích Vượt Trội Dành Cho Bạn</h2>
          <p class="section-subheading text-muted">
            Trải nghiệm y tế chuẩn quốc tế, xóa bỏ hoàn toàn cảnh chen lấn, sổ khám giấy rách nát và thất lạc kết quả.
          </p>
        </div>

        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="b-icon-wrap">
              <app-clinic-icon name="clock" [size]="26" color="#B8955A"></app-clinic-icon>
            </div>
            <h3 class="b-title font-bold">Theo Dõi Số Thứ Tự Realtime</h3>
            <p class="b-desc">
              Biết chính xác có bao nhiêu người đang chờ phía trước và thời gian ước tính đến lượt bạn, theo dõi trực tiếp trên điện thoại.
            </p>
          </div>

          <div class="benefit-card">
            <div class="b-icon-wrap">
              <app-clinic-icon name="file-text" [size]="26" color="#B8955A"></app-clinic-icon>
            </div>
            <h3 class="b-title font-bold">Bệnh Án & Đơn Thuốc Online</h3>
            <p class="b-desc">
              Xem lại toàn bộ lịch sử khám bệnh, chỉ số cận lâm sàng, hình ảnh X-quang/siêu âm và đơn thuốc bất kỳ lúc nào.
            </p>
          </div>

          <div class="benefit-card">
            <div class="b-icon-wrap">
              <app-clinic-icon name="bell" [size]="26" color="#B8955A"></app-clinic-icon>
            </div>
            <h3 class="b-title font-bold">Nhắc Hẹn Tái Khám Tự Động</h3>
            <p class="b-desc">
              Nhận thông báo nhắc lịch hẹn, kết quả xét nghiệm hoàn tất và hướng dẫn dùng thuốc đúng giờ qua hệ thống.
            </p>
          </div>

          <div class="benefit-card">
            <div class="b-icon-wrap">
              <app-clinic-icon name="shield" [size]="26" color="#B8955A"></app-clinic-icon>
            </div>
            <h3 class="b-title font-bold">Bảo Mật Dữ Liệu Tuyệt Đối</h3>
            <p class="b-desc">
              Tuân thủ tiêu chuẩn an toàn dữ liệu y tế, kiểm soát phân quyền nghiêm ngặt, bảo vệ quyền riêng tư người bệnh.
            </p>
          </div>
        </div>
      </section>

      <!-- 8. Contact & Working Hours -->
      <section id="contact" class="section-container">
        <div class="contact-grid">
          <div class="contact-info-panel">
            <span class="section-tag">LIÊN HỆ & ĐỊA ĐIỂM</span>
            <h2 class="contact-title font-serif">Sẵn Sàng Hỗ Trợ Bạn 7 Ngày Trong Tuần</h2>
            <p class="contact-lead">
              Đội ngũ chăm sóc khách hàng và tư vấn y khoa luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn.
            </p>

            <div class="contact-items">
              <div class="c-item">
                <span class="c-icon">
                  <app-clinic-icon name="map-pin" [size]="18" color="#0E4A55"></app-clinic-icon>
                </span>
                <div class="c-details">
                  <span class="c-label">Địa chỉ phòng khám:</span>
                  <span class="c-value font-bold">123 Đường Sức Khỏe, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </div>
              </div>

              <div class="c-item">
                <span class="c-icon">
                  <app-clinic-icon name="phone" [size]="18" color="#0E4A55"></app-clinic-icon>
                </span>
                <div class="c-details">
                  <span class="c-label">Tổng đài đặt hẹn & CSKH:</span>
                  <span class="c-value font-bold text-teal">1900 6868 • 028 3822 9999</span>
                </div>
              </div>

              <div class="c-item">
                <span class="c-icon">
                  <app-clinic-icon name="clock" [size]="18" color="#0E4A55"></app-clinic-icon>
                </span>
                <div class="c-details">
                  <span class="c-label">Giờ làm việc:</span>
                  <span class="c-value font-bold">Thứ Hai – Chủ Nhật: 07:00 – 20:30 (Khám cả ngày Lễ)</span>
                </div>
              </div>

              <div class="c-item">
                <span class="c-icon">
                  <app-clinic-icon name="mail" [size]="18" color="#0E4A55"></app-clinic-icon>
                </span>
                <div class="c-details">
                  <span class="c-label">Email hỗ trợ:</span>
                  <span class="c-value">support&#64;smartclinic.vn</span>
                </div>
              </div>
            </div>
          </div>

          <div class="contact-map-mockup">
            <div class="map-card">
              <div class="map-badge">VỊ TRÍ TRUNG TÂM QUẬN 1</div>
              <div class="map-visual">
                <div class="map-grid-lines"></div>
                <div class="map-pin-pulse">
                  <span class="pin-symbol">
                    <app-clinic-icon name="medical-cross" [size]="16" color="#ffffff"></app-clinic-icon>
                  </span>
                  <span class="pin-label">Smart Clinic EMR</span>
                </div>
              </div>
              <div class="map-footer">
                <span style="display: inline-flex; align-items: center; gap: 8px;">
                  <app-clinic-icon name="car" [size]="16" color="#5E8B7E"></app-clinic-icon>
                  Có bãi đỗ xe ô tô & xe máy miễn phí cho bệnh nhân
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 9. Public Footer -->
      <footer class="public-footer">
        <div class="footer-inner">
          <div class="footer-top">
            <div class="footer-brand">
              <div class="f-logo">
                <app-clinic-icon name="medical-cross" [size]="20" color="#B8955A"></app-clinic-icon>
                SMART CLINIC
              </div>
              <p class="f-desc">
                Hệ thống phòng khám đa khoa quốc tế ứng dụng công nghệ EMR hiện đại hàng đầu Việt Nam.
              </p>
            </div>

            <div class="footer-links-group">
              <h4 class="f-col-title">Về Chúng Tôi</h4>
              <a href="#services" (click)="scrollToSection($event, 'services')">Dịch vụ & Bảng giá</a>
              <a href="#doctors" (click)="scrollToSection($event, 'doctors')">Đội ngũ bác sĩ</a>
              <a href="#process" (click)="scrollToSection($event, 'process')">Quy trình khám bệnh</a>
            </div>

            <div class="footer-links-group">
              <h4 class="f-col-title">Cổng Dịch Vụ</h4>
              <button (click)="goToBooking()" class="footer-link-btn">Đặt lịch hẹn trực tuyến</button>
              <a routerLink="/lobby-display">Màn hình gọi số sảnh chờ</a>
              <a routerLink="/auth/login" class="staff-portal-link">
                <app-clinic-icon name="shield-check" [size]="14"></app-clinic-icon> Cổng nhân viên nội bộ
              </a>
            </div>

            <div class="footer-links-group">
              <h4 class="f-col-title">Chính Sách & Quy Định</h4>
              <span>Chính sách bảo mật y tế</span>
              <span>Quy định khám chữa bệnh</span>
              <span>Quyền lợi người bệnh</span>
            </div>
          </div>

          <div class="footer-bottom">
            <span>© 2026 Smart Clinic EMR. Bản quyền thuộc về Hệ thống Quản lý Y tế Đa Khoa.</span>
            <div class="f-bottom-links">
              <span>Tiêu chuẩn HL7 & FHIR</span>
              <span>•</span>
              <a routerLink="/auth/login" class="staff-link">Đăng nhập nhân viên nội bộ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .landing-container {
        font-family: 'Plus Jakarta Sans', sans-serif;
        background-color: #F6F3EC;
        color: #1C2733;
        min-height: 100vh;
        overflow-x: hidden;
      }

      // 1. Sticky Transparent Glass Header
      .public-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 72px;
        z-index: 100;
        transition: all 0.3s ease;
        background: rgba(246, 243, 236, 0.85);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(228, 222, 210, 0.6);

        &.scrolled {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 4px 20px rgba(28, 39, 51, 0.06);
        }
      }

      .header-inner {
        max-width: 1360px;
        margin: 0 auto;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
      }

      .logo-group {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;

        .logo-symbol {
          width: 38px;
          height: 38px;
          background: #0E4A55;
          color: #B8955A;
          border: 1px solid #B8955A;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.15rem;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-title {
          font-size: 1.125rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #0E4A55;
        }

        .logo-sub {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: #B8955A;
          font-weight: 600;
        }
      }

      .nav-links {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-shrink: 0;

        @media (max-width: 960px) {
          display: none;
        }
      }

      .nav-link {
        color: #111C26;
        text-decoration: none;
        font-size: 0.91rem;
        font-weight: 600;
        padding: 7px 15px;
        border-radius: 999px;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        cursor: pointer;
        white-space: nowrap;

        &:hover {
          color: #0E4A55;
          background: rgba(14, 74, 85, 0.08);
          transform: translateY(-1px);
        }

        &.active {
          color: #0E4A55;
          font-weight: 700;
          background: rgba(14, 74, 85, 0.12);
          box-shadow: inset 0 0 0 1px rgba(14, 74, 85, 0.25);
        }

        &.highlight-lobby {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #0E4A55;
          font-weight: 650;
          background: rgba(14, 74, 85, 0.08);
          padding: 6px 14px;
          border-radius: 999px;
          border: 1.5px solid rgba(14, 74, 85, 0.25);
          white-space: nowrap;

          .pulse-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #5E8B7E;
            box-shadow: 0 0 6px #5E8B7E;
          }
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .nav-account-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #FFFFFF;
        border: 1.5px solid #D2DCDE;
        padding: 6px 14px 6px 7px;
        border-radius: 999px;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 1px 4px rgba(14, 74, 85, 0.06);

        .account-avatar-badge {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0E4A55 0%, #1A6472 100%);
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
          box-shadow: 0 2px 5px rgba(14, 74, 85, 0.2);
        }

        .account-text-group {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          line-height: 1;

          .acc-main {
            font-size: 0.85rem;
            font-weight: 750;
            color: #0E4A55;
            transition: color 0.2s ease;
          }

          .acc-slash {
            font-size: 0.78rem;
            font-weight: 600;
            color: #7A8894;
          }

          .acc-sub {
            font-size: 0.84rem;
            font-weight: 600;
            color: #1A2834;
            transition: color 0.2s ease;
          }
        }

        &:hover {
          border-color: #0E4A55;
          background: #FAFDFD;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(14, 74, 85, 0.12);

          .account-avatar-badge {
            background: linear-gradient(135deg, #B8955A 0%, #9B7432 100%);
            transform: scale(1.08);
          }

          .account-text-group {
            .acc-sub {
              color: #0E4A55;
            }
          }
        }
      }

      .btn-primary-teal {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #0E4A55;
        color: #FFFFFF;
        border: none;
        padding: 9px 20px;
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.25s ease;
        box-shadow: 0 4px 12px rgba(14, 74, 85, 0.2);

        &:hover {
          background: #145b68;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(14, 74, 85, 0.3);
        }
      }

      // 2. Hero Section
      .hero-section {
        padding: 140px 24px 80px 24px;
        position: relative;
        background: radial-gradient(circle at 80% 20%, rgba(184, 149, 90, 0.08) 0%, transparent 60%);
      }

      .hero-inner {
        max-width: 1360px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 48px;
        align-items: center;

        @media (max-width: 980px) {
          grid-template-columns: 1fr;
          gap: 36px;
        }
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(184, 149, 90, 0.15);
        color: #8C6D34;
        border: 1px solid rgba(184, 149, 90, 0.35);
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        margin-bottom: 20px;
      }

      .hero-title {
        font-size: 3.2rem;
        line-height: 1.15;
        color: #0E4A55;
        margin: 0 0 20px 0;

        @media (max-width: 600px) {
          font-size: 2.3rem;
        }

        .text-gold {
          color: #B8955A;
        }
      }

      .hero-desc {
        font-size: 1.05rem;
        line-height: 1.6;
        color: #273644;
        font-weight: 450;
        max-width: 580px;
        margin-bottom: 32px;
      }

      .hero-cta-group {
        display: flex;
        align-items: stretch;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 28px;
      }

      .btn-hero-booking,
      .btn-hero-staff {
        width: 280px;
        min-height: 72px;
        padding: 13px 22px;
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        text-decoration: none;
        box-sizing: border-box;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        .btn-title-with-icon {
          display: inline-flex;
          align-items: center;
          gap: 10px;

          span {
            font-size: 1.05rem;
            font-weight: 700;
            line-height: 1.25;
          }
        }

        .btn-subtext {
          font-size: 0.74rem;
          margin-top: 4px;
          line-height: 1.3;
        }

        @media (max-width: 650px) {
          width: 100%;
        }
      }

      .btn-hero-booking {
        background: #0E4A55;
        color: #FFFFFF;
        border: 1.5px solid transparent;
        box-shadow: 0 8px 24px rgba(14, 74, 85, 0.25);

        .btn-subtext {
          color: rgba(255, 255, 255, 0.85);
          font-weight: 450;
        }

        &:hover {
          background: #145b68;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(14, 74, 85, 0.35);
        }
      }

      .btn-hero-staff {
        background: #FFFFFF;
        border: 1.5px solid #D5CEBE;
        color: #111C26;
        box-shadow: 0 4px 16px rgba(28, 39, 51, 0.05);

        .btn-subtext {
          color: #4A5968;
          font-weight: 500;
        }

        app-clinic-icon {
          color: #0E4A55;
          transition: transform 0.2s ease;
        }

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
          background: #FAFDFD;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(14, 74, 85, 0.14);

          app-clinic-icon {
            transform: scale(1.08);
          }
        }
      }

      .hero-pills {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;

        .pill-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: #5E8B7E;
          font-weight: 600;
        }
      }

      // Hero Right Visual
      .hero-visual {
        position: relative;
        display: flex;
        justify-content: center;
      }

      .visual-art-card {
        width: 100%;
        max-width: 440px;
        height: 480px;
        background: linear-gradient(145deg, #1C2733 0%, #10242B 100%);
        border-radius: 24px;
        padding: 24px;
        position: relative;
        box-shadow: 0 24px 60px rgba(28, 39, 51, 0.25);
        border: 1px solid rgba(184, 149, 90, 0.3);
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .visual-glow-circle {
        position: absolute;
        top: -30px;
        right: -30px;
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(184, 149, 90, 0.3) 0%, transparent 70%);
        pointer-events: none;
      }

      // Floating Multi-Room Queue Monitor
      .floating-ticket-card {
        background: rgba(255, 255, 255, 0.98);
        border-radius: 20px;
        padding: 20px;
        border: 1.5px solid #B8955A;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
        position: relative;
        z-index: 2;
        animation: floatCard 4s ease-in-out infinite alternate;
      }

      @keyframes floatCard {
        from {
          transform: translateY(0);
        }
        to {
          transform: translateY(-8px);
        }
      }

      .ticket-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #ECE6DB;

        .ticket-badge {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #0E4A55;
        }

        .live-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #5E8B7E;
          display: inline-flex;
          align-items: center;
          gap: 6px;

          .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #5E8B7E;
            box-shadow: 0 0 6px #5E8B7E;
            animation: pulseDot 1.5s infinite;
          }
        }
      }

      @keyframes pulseDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }

      .rooms-queue-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .room-queue-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 11px;
        background: #FAF7F2;
        border: 1px solid #E8E2D5;
        border-radius: 9px;
        transition: all 0.2s ease;

        &.is-calling {
          background: rgba(184, 149, 90, 0.12);
          border-color: rgba(184, 149, 90, 0.5);
          box-shadow: 0 2px 8px rgba(184, 149, 90, 0.12);
        }

        .room-col-info {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .r-top {
            display: flex;
            align-items: center;
            gap: 6px;

            .r-name {
              font-size: 0.8125rem;
              font-weight: 700;
              color: #1C2733;
            }

            .r-spec {
              font-size: 0.65rem;
              color: #0E4A55;
              background: rgba(14, 74, 85, 0.08);
              padding: 1px 5px;
              border-radius: 4px;
              font-weight: 600;
            }
          }

          .r-doc {
            font-size: 0.7rem;
            color: #5B6672;
          }
        }

        .room-col-ticket {
          display: flex;
          align-items: center;
          gap: 8px;

          .r-ticket-box {
            display: flex;
            flex-direction: column;
            align-items: flex-end;

            .r-stt-label {
              font-size: 0.6rem;
              color: #8C96A2;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }

            .r-ticket {
              font-size: 1.1rem;
              color: #0E4A55;
              letter-spacing: 0.03em;
              line-height: 1.1;
            }
          }

          .r-status-pill {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 3px 7px;
            border-radius: 6px;
            background: rgba(94, 139, 126, 0.14);
            color: #5E8B7E;

            &.calling {
              background: #0E4A55;
              color: #FFFFFF;
              box-shadow: 0 2px 6px rgba(14, 74, 85, 0.25);
            }
          }
        }
      }

      .ticket-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 10px;
        border-top: 1px dashed #E4DED2;
        gap: 8px;

        .link-full-lobby {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #0E4A55;
          text-decoration: none;
          transition: color 0.2s ease;

          &:hover {
            color: #B8955A;
          }
        }

        .link-my-ticket {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #8C6D34;
          text-decoration: none;
          background: rgba(184, 149, 90, 0.12);
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(184, 149, 90, 0.22);
          }
        }
      }

      .floating-mini-badge {
        position: absolute;
        bottom: 16px;
        right: -14px;
        background: rgba(28, 39, 51, 0.9);
        border: 1px solid #B8955A;
        border-radius: 12px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 3;
        color: #FFFFFF;

        .badge-icon {
          font-size: 1.3rem;
        }

        .badge-text {
          display: flex;
          flex-direction: column;
        }

        .b-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #E6CE9F;
        }

        .b-desc {
          font-size: 0.6875rem;
          color: rgba(255, 255, 255, 0.7);
        }
      }

      // 3. Trust Strip
      .trust-strip {
        background: #FFFFFF;
        border-top: 1px solid #E4DED2;
        border-bottom: 1px solid #E4DED2;
        padding: 32px 24px;
      }

      .trust-inner {
        max-width: 1360px;
        margin: 0 auto;
        display: flex;
        justify-content: space-around;
        align-items: center;
        flex-wrap: wrap;
        gap: 24px;
      }

      .trust-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 4px;

        .trust-num {
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1;
        }

        .trust-label {
          font-size: 0.84rem;
          color: #273644;
          font-weight: 550;
          max-width: 220px;
        }
      }

      .trust-divider {
        width: 1px;
        height: 48px;
        background: #E4DED2;

        @media (max-width: 800px) {
          display: none;
        }
      }

      // General Section Styles
      .section-container {
        padding: 90px 24px;
        max-width: 1360px;
        margin: 0 auto;
        scroll-margin-top: 86px;
        transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1);

        &.bg-warm {
          max-width: 100%;
          background: #FAF8F5;
        }

        &.bg-dark-slate {
          max-width: 100%;
          background: #1C2733;
          color: #FFFFFF;
        }
      }

      .section-header-center {
        text-align: center;
        max-width: 720px;
        margin: 0 auto 50px auto;

        .section-tag {
          font-size: 0.78rem;
          font-weight: 750;
          letter-spacing: 0.08em;
          color: #8C6524;
          text-transform: uppercase;
          display: block;
          margin-bottom: 10px;

          &.gold-tag {
            color: #E6CE9F;
          }
        }

        .section-heading {
          font-size: 2.3rem;
          color: #0E4A55;
          margin: 0 0 14px 0;

          &.text-white {
            color: #FFFFFF;
          }
        }

        .section-subheading {
          font-size: 0.98rem;
          color: #273644;
          font-weight: 450;
          line-height: 1.6;

          &.text-muted {
            color: rgba(255, 255, 255, 0.85);
          }
        }
      }

      // 4. Services Section
      .service-search-bar {
        max-width: 900px;
        margin: 0 auto 36px auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .search-input-box {
        position: relative;
        width: 100%;

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: #8C96A2;
        }

        .search-input {
          padding: 14px 20px 14px 46px;
          border-radius: 16px;
          border: 1px solid #E2DCD0;
          font-size: 0.92rem;
          width: 100%;
          background: #FFFFFF;
          box-shadow: 0 4px 14px rgba(28, 39, 51, 0.04);
          transition: all 0.2s ease;

          &:hover {
            border-color: #C8BFB0;
          }

          &:focus {
            outline: none;
            border-color: #0E4A55;
            box-shadow: 0 0 0 3.5px rgba(14, 74, 85, 0.12), 0 4px 16px rgba(14, 74, 85, 0.06);
          }
        }
      }

      .category-filter-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .chip-btn {
        background: #FFFFFF;
        border: 1.5px solid #D2CABA;
        padding: 8px 18px;
        border-radius: 999px;
        font-size: 0.84rem;
        font-weight: 600;
        color: #1A2834;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #0E4A55;
          color: #0E4A55;
          background: #F4FAF9;
        }

        &.active {
          background: #0E4A55;
          border-color: #0E4A55;
          color: #FFFFFF;
          font-weight: 700;
        }
      }

      .services-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;

        @media (max-width: 1100px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 700px) {
          grid-template-columns: 1fr;
        }
      }

      .service-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 16px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(28, 39, 51, 0.08);
          border-color: #0E4A55;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .svc-icon {
          font-size: 1.8rem;
        }

        .svc-cat {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0E4A55;
          background: rgba(14, 74, 85, 0.08);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .svc-title {
          font-size: 1.05rem;
          color: #1C2733;
          margin: 0 0 8px 0;
        }

        .svc-desc {
          font-size: 0.84rem;
          color: #2D3A47;
          line-height: 1.55;
          margin-bottom: 16px;
          flex: 1;
        }

        .svc-meta {
          display: flex;
          gap: 14px;
          font-size: 0.78rem;
          font-weight: 550;
          color: #384858;
          margin-bottom: 18px;
          border-top: 1px solid #EAE4D6;
          padding-top: 12px;
        }

        .svc-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .svc-price-box {
          display: flex;
          flex-direction: column;

          .price-label {
            font-size: 0.72rem;
            color: #4A5A6A;
            font-weight: 600;
          }

          .price-val {
            font-size: 1.15rem;
          }
        }

        .btn-book-service {
          background: rgba(14, 74, 85, 0.08);
          color: #0E4A55;
          border: 1.5px solid rgba(14, 74, 85, 0.35);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #0E4A55;
            color: #FFFFFF;
          }
        }
      }

      // 5. Doctors Grid
      .doctors-grid {
        max-width: 1360px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 28px;

        @media (max-width: 1000px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 650px) {
          grid-template-columns: 1fr;
        }
      }

      .doctor-card {
        background: #FFFFFF;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid #E4DED2;
        box-shadow: 0 4px 16px rgba(28, 39, 51, 0.04);
        transition: transform 0.25s ease;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(28, 39, 51, 0.09);
        }

        .doc-image-wrap {
          height: 240px;
          position: relative;
          background: #E4DED2;

          .doc-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .doc-room-tag {
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: rgba(28, 39, 51, 0.85);
            color: #FFFFFF;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            backdrop-filter: blur(4px);
          }
        }

        .doc-body {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .doc-specialty {
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .doc-name {
          font-size: 1.15rem;
          color: #1C2733;
          margin: 0;
        }

        .doc-title {
          font-size: 0.84rem;
          color: #334150;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .doc-schedule-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F4EFE6;
          border: 1px solid #E2D9C8;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          color: #15222E;
          font-weight: 550;
          margin-bottom: 14px;
        }

        .btn-book-doctor {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
          padding: 10px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #145b68;
          }
        }
      }

      // 6. 4-Step Process
      .process-steps-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
        margin-bottom: 32px;

        @media (max-width: 1000px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .step-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 16px;
        padding: 28px 22px;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;

        &:hover {
          transform: translateY(-4px);
          border-color: #0E4A55;
          box-shadow: 0 14px 30px rgba(14, 74, 85, 0.1);

          .step-number {
            color: #B8955A;
            transform: scale(1.05);
          }
        }

        .step-number {
          font-size: 2.4rem;
          font-weight: 800;
          color: #0E4A55;
          line-height: 1;
          letter-spacing: -0.02em;
          transition: color 0.25s ease, transform 0.25s ease;
        }

        .step-icon {
          font-size: 2rem;
        }

        .step-title {
          font-size: 1.05rem;
          color: #0E4A55;
          margin: 0;
        }

        .step-desc {
          font-size: 0.84rem;
          color: #2D3A47;
          line-height: 1.55;
          margin: 0;
        }
      }

      .payment-highlight-banner {
        background: rgba(184, 149, 90, 0.12);
        border: 1px solid rgba(184, 149, 90, 0.4);
        padding: 16px 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 0.875rem;
        color: #1C2733;

        .pay-icon {
          font-size: 1.4rem;
        }
      }

      // 7. Benefits Section
      .benefits-grid {
        max-width: 1360px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;

        @media (max-width: 1100px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .benefit-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 28px 22px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition: transform 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #B8955A;
          transform: translateY(-3px);
        }

        .b-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(184, 149, 90, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        .b-title {
          font-size: 1.05rem;
          color: #E6CE9F;
          margin: 0;
        }

        .b-desc {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.6;
          margin: 0;
        }
      }

      // 8. Contact Section
      .contact-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 48px;
        align-items: center;

        @media (max-width: 900px) {
          grid-template-columns: 1fr;
        }
      }

      .contact-info-panel {
        display: flex;
        flex-direction: column;
        gap: 14px;

        .contact-title {
          font-size: 2.2rem;
          color: #0E4A55;
          margin: 0;
        }

        .contact-lead {
          font-size: 0.95rem;
          color: #2C3946;
          font-weight: 450;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .contact-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .c-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .c-icon {
          font-size: 1.3rem;
          margin-top: 2px;
        }

        .c-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .c-label {
          font-size: 0.78rem;
          color: #4A5968;
          font-weight: 600;
        }

        .c-value {
          font-size: 0.92rem;
          color: #1C2733;
        }
      }

      .contact-map-mockup {
        .map-card {
          background: #FFFFFF;
          border: 1px solid #E4DED2;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(28, 39, 51, 0.06);
        }

        .map-badge {
          background: #1C2733;
          color: #E6CE9F;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 8px 16px;
        }

        .map-visual {
          height: 260px;
          background: #EAE6DC;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          .map-grid-lines {
            position: absolute;
            inset: 0;
            background-image: linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
            background-size: 24px 24px;
          }

          .map-pin-pulse {
            position: relative;
            background: #0E4A55;
            color: #FFFFFF;
            padding: 8px 16px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 0.875rem;
            box-shadow: 0 8px 20px rgba(14, 74, 85, 0.35);
            border: 2px solid #B8955A;

            .pin-symbol {
              color: #B8955A;
            }
          }
        }

        .map-footer {
          padding: 14px 20px;
          font-size: 0.8125rem;
          color: #5E8B7E;
          font-weight: 600;
          background: #FAF8F5;
        }
      }

      // 9. Public Footer
      .public-footer {
        background: #1C2733;
        color: #FFFFFF;
        padding: 60px 24px 30px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .footer-inner {
        max-width: 1360px;
        margin: 0 auto;
      }

      .footer-top {
        display: grid;
        grid-template-columns: 1.5fr 1fr 1fr 1fr;
        gap: 40px;
        margin-bottom: 48px;

        @media (max-width: 900px) {
          grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .footer-brand {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .f-logo {
          font-size: 1.2rem;
          font-weight: 700;
          color: #B8955A;
          letter-spacing: 0.05em;
        }

        .f-desc {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.6;
          max-width: 320px;
        }
      }

      .footer-links-group {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .f-col-title {
          font-size: 0.875rem;
          color: #E6CE9F;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        a, span, .footer-link-btn {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.8125rem;
          background: transparent;
          border: none;
          text-align: left;
          padding: 0;
          cursor: pointer;
          transition: color 0.2s ease;

          &:hover {
            color: #FFFFFF;
          }
        }

        .staff-portal-link {
          color: #B8955A;
          font-weight: 600;
        }
      }

      .footer-bottom {
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);

        .f-bottom-links {
          display: flex;
          align-items: center;
          gap: 10px;

          .staff-link {
            color: #B8955A;
            text-decoration: none;
            font-weight: 600;
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    `,
  ],
})
export class LandingHomeComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isScrolled = signal<boolean>(false);
  activeSection = signal<string>('hero');
  serviceSearchQuery = '';
  selectedServiceCategory = 'ALL';

  liveStations = [
    {
      room: 'Phòng Nội 101',
      specialty: 'Tim Mạch',
      doc: 'TS.BS Trần Minh Hoàng',
      ticket: 'A011',
      status: 'CALLING',
    },
    {
      room: 'Phòng Nội 102',
      specialty: 'Nội Tổng Quát',
      doc: 'BS.CKII Lê Thị Mai',
      ticket: 'B005',
      status: 'SERVING',
    },
    {
      room: 'Phòng TMH 103',
      specialty: 'Tai Mũi Họng',
      doc: 'ThS.BS Nguyễn Văn An',
      ticket: 'C002',
      status: 'CALLING',
    },
    {
      room: 'Xét Nghiệm TT',
      specialty: 'Lấy Mẫu Máu & Sinh Hóa',
      doc: 'KTV Trưởng Kim Chi',
      ticket: 'X014',
      status: 'SERVING',
    },
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'scroll',
        () => {
          this.isScrolled.set(window.scrollY > 20);
          this.detectActiveSection();
        },
        { passive: true }
      );
    }
  }

  scrollToSection(event: Event, sectionId: string): void {
    if (event) {
      event.preventDefault();
    }
    this.activeSection.set(sectionId);
    if (typeof document === 'undefined') return;

    const el = document.getElementById(sectionId);
    if (el) {
      const headerOffset = 82;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // Trigger luxurious pulse highlight animation on target section
      el.classList.remove('section-scroll-focused');
      void el.offsetWidth; // trigger reflow
      el.classList.add('section-scroll-focused');

      setTimeout(() => {
        el.classList.remove('section-scroll-focused');
      }, 1600);
    }
  }

  private detectActiveSection(): void {
    if (typeof document === 'undefined') return;
    const sections = ['services', 'doctors', 'process', 'benefits', 'contact'];
    const scrollPos = window.scrollY + 140;

    for (const secId of sections) {
      const el = document.getElementById(secId);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          this.activeSection.set(secId);
          return;
        }
      }
    }
    if (window.scrollY < 200) {
      this.activeSection.set('hero');
    }
  }

  publicServices: PublicService[] = [
    {
      code: 'KB-TIMMACH',
      name: 'Khám Chuyên Khoa Tim Mạch',
      category: 'KHÁM BỆNH',
      price: 200000,
      duration: '20 phút',
      room: 'Phòng khám Nội 101',
      icon: 'heart-pulse',
      description: 'Thăm khám, đo huyết áp, đánh giá nguy cơ xơ vữa, suy tim và bệnh mạch vành.',
    },
    {
      code: 'KB-NOITQ',
      name: 'Khám Nội Tổng Quát Toàn Diện',
      category: 'KHÁM BỆNH',
      price: 150000,
      duration: '15 phút',
      room: 'Phòng khám Nội 102',
      icon: 'stethoscope',
      description: 'Tầm soát tổng quan sức khỏe, phát hiện sớm các bệnh lý mãn tính đái tháo đường, gan, thận.',
    },
    {
      code: 'ECG-12C',
      name: 'Điện Tâm Đồ 12 Chuyển Đạo (ECG)',
      category: 'CẬN LÂM SÀNG',
      price: 100000,
      duration: '10 phút',
      room: 'Phòng Đo Điện Tim (ECG)',
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

  publicDoctors: PublicDoctor[] = [
    {
      id: 'doc-01',
      name: 'TS.BS Trần Minh Hoàng',
      title: 'Tiến sĩ Y khoa • Trưởng khoa',
      specialty: 'Khoa Tim Mạch',
      room: 'Phòng khám Nội 101',
      scheduleDays: 'Thứ 2 – Thứ 7 (Ca Sáng & Chiều)',
      experience: '22 năm kinh nghiệm',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=350&auto=format&fit=crop&q=80',
    },
    {
      id: 'doc-02',
      name: 'ThS.BS Nguyễn Thị Mai Lan',
      title: 'Thạc sĩ Bác sĩ Nội trú',
      specialty: 'Khoa Nội Tổng Quát',
      room: 'Phòng khám Nội 102',
      scheduleDays: 'Thứ 2 – Chủ Nhật (Ca Sáng)',
      experience: '14 năm kinh nghiệm',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3543d8a7c1ad?w=350&auto=format&fit=crop&q=80',
    },
    {
      id: 'doc-03',
      name: 'BS.CKI Lê Quốc Hưng',
      title: 'Bác sĩ Chuyên khoa I',
      specialty: 'Khoa Tiêu Hóa - Gan Mật',
      room: 'Phòng khám Nội 103',
      scheduleDays: 'Thứ 2 – Thứ 6 (Ca Sáng)',
      experience: '16 năm kinh nghiệm',
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=350&auto=format&fit=crop&q=80',
    },
  ];

  filteredPublicServices = computed(() => {
    let list = this.publicServices;
    if (this.selectedServiceCategory !== 'ALL') {
      list = list.filter((s) => s.category === this.selectedServiceCategory);
    }
    const q = this.serviceSearchQuery.trim().toLowerCase();
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

  goToBooking(serviceName?: string): void {
    if (!this.authService.isAuthenticated()) {
      // Auto login as demo PATIENT or take to booking
      this.authService.login('PATIENT').subscribe(() => {
        this.router.navigate(['/patient/booking']);
      });
    } else {
      this.router.navigate(['/patient/booking']);
    }
  }

  goToBookingWithDoctor(doctorName: string): void {
    if (!this.authService.isAuthenticated()) {
      this.authService.login('PATIENT').subscribe(() => {
        this.router.navigate(['/patient/booking']);
      });
    } else {
      this.router.navigate(['/patient/booking']);
    }
  }
}
