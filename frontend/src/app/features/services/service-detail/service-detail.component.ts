import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';
import { ServiceDetailService } from '../../../core/services/service-detail.service';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceDetail } from '../../../core/models/service-detail.model';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ClinicIconComponent, VndCurrencyPipe],
  template: `
    <div class="service-detail-shell">
      <!-- 1. Universal Smart Clinic Glass Header -->
      <header class="public-header glass-header" [class.scrolled]="isScrolled()">
        <div class="header-inner">
          <a routerLink="/" class="logo-group">
            <span class="logo-symbol">
              <app-clinic-icon name="medical-cross" [size]="20" color="#ECC880"></app-clinic-icon>
            </span>
            <div class="logo-text">
              <span class="logo-title font-serif">SMART CLINIC</span>
              <span class="logo-sub">PHÒNG KHÁM ĐA KHOA QUỐC TẾ</span>
            </div>
          </a>

          <!-- Main Navigation Links -->
          <nav class="nav-links">
            <a routerLink="/" fragment="services" class="nav-link active">Dịch Vụ & Bảng Giá</a>
            <a routerLink="/" fragment="doctors" class="nav-link">Bác Sĩ</a>
            <a routerLink="/" fragment="process" class="nav-link">Quy Trình Khám</a>
            <a routerLink="/" fragment="benefits" class="nav-link">Lợi Ích</a>
            <a routerLink="/" fragment="contact" class="nav-link">Liên Hệ</a>
            @if (!isAuthenticated()) {
              <a routerLink="/lobby-display" class="nav-link highlight-lobby" title="Màn hình gọi số sảnh chờ phòng khám">
                <span class="pulse-dot"></span> Bảng gọi số sảnh chờ
              </a>
            }
          </nav>

          <!-- Right Action Controls -->
          <div class="header-actions">
            @if (isAuthenticated()) {
              <div class="user-profile-widget">
                <a routerLink="/patient/dashboard" class="nav-profile-chip" title="Vào Cổng Bệnh Nhân & Quản lý hồ sơ">
                  <span class="chip-avatar-circle font-serif">{{ userMonogram() }}</span>
                  <span class="chip-user-info">
                    <span class="chip-user-name">{{ currentUser()?.fullName || 'Bệnh nhân' }}</span>
                    <span class="chip-role-badge">Cổng Bệnh Nhân</span>
                  </span>
                  <app-clinic-icon name="chevron-right" [size]="13" class="chip-arrow-icon"></app-clinic-icon>
                </a>
              </div>
            } @else {
              <a routerLink="/auth/login" class="nav-account-btn" title="Đăng nhập tài khoản">
                <span class="account-avatar-badge">
                  <app-clinic-icon name="user" [size]="14"></app-clinic-icon>
                </span>
                <span class="account-text-group">
                  <span class="acc-main">Đăng nhập</span>
                  <span class="acc-slash">/</span>
                  <span class="acc-sub">Đăng ký</span>
                </span>
              </a>
            }

            <button type="button" class="btn-primary-teal" (click)="bookThisService()">
              <app-clinic-icon name="calendar" [size]="15"></app-clinic-icon>
              <span>Đặt lịch khám</span>
            </button>
          </div>
        </div>
      </header>

      <!-- 2. Sub-Header: Back Navigation & Breadcrumb Trail -->
      <div class="sub-header-bar">
        <div class="sub-header-inner">
          <button type="button" class="btn-back-link" (click)="goBack()">
            <app-clinic-icon name="arrow-left" [size]="16"></app-clinic-icon>
            <span>Quay lại danh mục dịch vụ</span>
          </button>

          <nav class="breadcrumb-trail" aria-label="Breadcrumb">
            <a routerLink="/">Trang chủ</a>
            <span class="sep">/</span>
            <a routerLink="/" fragment="services">Dịch vụ & Bảng giá</a>
            <span class="sep">/</span>
            <span class="current-item">{{ service()?.name || 'Chi tiết dịch vụ' }}</span>
          </nav>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state-wrapper">
          <div class="spinner-medical-ring"></div>
          <h3 class="font-serif text-teal">Đang tải hồ sơ dịch vụ & trang thiết bị y khoa...</h3>
          <p class="text-muted">Hệ thống đang đồng bộ dữ liệu kỹ thuật và tiêu chuẩn chất lượng từ phòng khám.</p>
        </div>
      } @else if (!service()) {
        <div class="not-found-wrapper">
          <div class="not-found-panel">
            <div class="icon-warning-circle">
              <app-clinic-icon name="alert-triangle" [size]="36" color="#B8955A"></app-clinic-icon>
            </div>
            <h2 class="font-serif">Không tìm thấy thông tin dịch vụ y tế</h2>
            <p>Dịch vụ bạn đang tìm kiếm có thể đã được cập nhật hoặc không còn tồn tại trên hệ thống Smart Clinic.</p>
            <a routerLink="/" fragment="services" class="btn-return-catalog">
              Xem toàn bộ danh mục dịch vụ & bảng giá
            </a>
          </div>
        </div>
      } @else {
        <!-- 3. Regal Asymmetric 2-Column Hero Section -->
        <section class="luxury-hero-section">
          <div class="hero-backdrop" [style.background-image]="'url(' + service()!.bannerImage + ')'"></div>
          <div class="hero-overlay-gradient"></div>

          <div class="hero-container">
            <!-- Left Info Column -->
            <div class="hero-left-column">
              <!-- Badge Cluster -->
              <div class="hero-badge-cluster">
                <span class="pill-category">{{ service()!.category }}</span>
                @if (service()!.isPopular) {
                  <span class="pill-popular">
                    <app-clinic-icon name="sparkle" [size]="12"></app-clinic-icon>
                    <span>PHỔ BIẾN NHẤT</span>
                  </span>
                }
                <span class="pill-standard">
                  <app-clinic-icon name="shield-check" [size]="13" color="#ECC880"></app-clinic-icon>
                  <span>TIÊU CHUẨN ISO & JCI</span>
                </span>
              </div>

              <!-- Main Title & Subtitle -->
              <h1 class="hero-main-title font-serif">{{ service()!.name }}</h1>
              <p class="hero-main-subtitle">{{ service()!.subtitle }}</p>

              <!-- Quick Specs Grid (2x2 refined cards) -->
              <div class="hero-specs-grid">
                <div class="spec-card">
                  <div class="spec-icon-box">
                    <app-clinic-icon name="map-pin" [size]="18" color="#ECC880"></app-clinic-icon>
                  </div>
                  <div class="spec-text">
                    <span class="spec-label">Phòng thực hiện</span>
                    <span class="spec-value">{{ service()!.room }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <div class="spec-icon-box">
                    <app-clinic-icon name="clock" [size]="18" color="#ECC880"></app-clinic-icon>
                  </div>
                  <div class="spec-text">
                    <span class="spec-label">Thời lượng ước tính</span>
                    <span class="spec-value">{{ service()!.duration }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <div class="spec-icon-box">
                    <app-clinic-icon name="clipboard" [size]="18" color="#ECC880"></app-clinic-icon>
                  </div>
                  <div class="spec-text">
                    <span class="spec-label">Kết quả xuất viện</span>
                    <span class="spec-value">Số hóa tức thì trên EMR</span>
                  </div>
                </div>

                <div class="spec-card">
                  <div class="spec-icon-box">
                    <app-clinic-icon name="shield-check" [size]="18" color="#ECC880"></app-clinic-icon>
                  </div>
                  <div class="spec-text">
                    <span class="spec-label">Bảo hiểm áp dụng</span>
                    <span class="spec-value">Hỗ trợ BHYT & Bảo lãnh tư</span>
                  </div>
                </div>
              </div>

              <!-- Hero Actions Bar -->
              <div class="hero-actions-row">
                <button type="button" class="btn-hero-primary-gold" (click)="bookThisService()">
                  <app-clinic-icon name="calendar" [size]="18"></app-clinic-icon>
                  <span>ĐẶT LỊCH DỊCH VỤ NÀY</span>
                  <app-clinic-icon name="arrow-right" [size]="16"></app-clinic-icon>
                </button>

                <button type="button" class="btn-hero-secondary-tech" (click)="selectTab('equipment')">
                  <app-clinic-icon name="xray" [size]="17"></app-clinic-icon>
                  <span>Xem {{ service()!.equipment.length }} Thiết bị hiện đại</span>
                </button>
              </div>

              <!-- Reassurance Footnote -->
              <div class="hero-reassurance-note">
                <app-clinic-icon name="shield" [size]="14" color="#ECC880"></app-clinic-icon>
                <span>Cam kết 100% bác sĩ chuyên khoa thực hiện • Không phát sinh phụ phí • Hỗ trợ 24/7: <strong>1900 6868</strong></span>
              </div>
            </div>

            <!-- Right Visual Showcase Card Column -->
            <div class="hero-right-column">
              <div class="hero-visual-card">
                <div class="card-image-wrap">
                  <img [src]="service()!.bannerImage" [alt]="service()!.name" class="service-cover-img" />
                  <div class="image-gradient-shade"></div>

                  <!-- Floating Floating Gold Price Tag -->
                  <div class="floating-price-tag">
                    <span class="price-eyebrow">GIÁ NIÊM YẾT MINH BẠCH</span>
                    <div class="price-row font-serif">
                      <span class="price-num">{{ service()!.price | vndCurrency }}</span>
                    </div>
                    <span class="price-sub-note">Đã bao gồm vật tư & hồ sơ điện tử</span>
                  </div>

                  <!-- Floating Quality Badge -->
                  <div class="floating-trust-pill">
                    <app-clinic-icon name="sparkle" [size]="14" color="#ECC880"></app-clinic-icon>
                    <span>Đánh giá 4.98/5.0 từ hơn 1,400+ bệnh nhân</span>
                  </div>
                </div>

                <div class="card-bottom-info">
                  <div class="info-row">
                    <span class="info-title font-serif">Smart Clinic EMR Technology</span>
                    <span class="info-code">Mã kỹ thuật: {{ service()!.code }}</span>
                  </div>
                  <p class="info-desc">Hệ thống máy móc thế hệ mới nhập khẩu nguyên chiếc từ Hoa Kỳ, Nhật Bản và CHLB Đức.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. Interactive Sticky Capsule Segmented Navigation -->
        <nav class="sticky-capsule-nav">
          <div class="capsule-nav-container">
            <div class="capsule-nav-inner">
              <button
                type="button"
                class="capsule-btn"
                [class.active]="activeTab() === 'overview'"
                (click)="selectTab('overview')"
              >
                <app-clinic-icon name="file-text" [size]="15"></app-clinic-icon>
                <span>Tổng quan & Chỉ định</span>
              </button>

              <button
                type="button"
                class="capsule-btn highlight-gold"
                [class.active]="activeTab() === 'equipment'"
                (click)="selectTab('equipment')"
              >
                <app-clinic-icon name="xray" [size]="15"></app-clinic-icon>
                <span>Máy móc & Thiết bị ({{ service()!.equipment.length }})</span>
                <span class="gold-dot-pill">Hot</span>
              </button>

              <button
                type="button"
                class="capsule-btn"
                [class.active]="activeTab() === 'procedure'"
                (click)="selectTab('procedure')"
              >
                <app-clinic-icon name="activity" [size]="15"></app-clinic-icon>
                <span>Quy trình thực hiện</span>
              </button>

              <button
                type="button"
                class="capsule-btn"
                [class.active]="activeTab() === 'preparation'"
                (click)="selectTab('preparation')"
              >
                <app-clinic-icon name="shield" [size]="15"></app-clinic-icon>
                <span>Chuẩn bị trước khám</span>
              </button>

              <button
                type="button"
                class="capsule-btn"
                [class.active]="activeTab() === 'doctors'"
                (click)="selectTab('doctors')"
              >
                <app-clinic-icon name="stethoscope" [size]="15"></app-clinic-icon>
                <span>Bác sĩ chuyên khoa</span>
              </button>

              <button
                type="button"
                class="capsule-btn"
                [class.active]="activeTab() === 'faq'"
                (click)="selectTab('faq')"
              >
                <app-clinic-icon name="check-circle" [size]="15"></app-clinic-icon>
                <span>Hỏi đáp (FAQ)</span>
              </button>
            </div>
          </div>
        </nav>

        <!-- 5. Main Workspace Layout: Content Columns + Luxury Sticky Concierge -->
        <div class="workspace-body-container">
          <div class="content-primary-column">
            <!-- SECTION 1: OVERVIEW & CLINICAL INDICATIONS -->
            <section id="overview" class="luxury-widget-card">
              <div class="widget-header-row">
                <div class="section-tag-gold font-serif">MỤC 01 • THÔNG TIN CHUYÊN KHOA</div>
                <h2 class="widget-heading font-serif">Giới Thiệu Tổng Quan & Chỉ Định Khám</h2>
                <p class="widget-subheading">Tìm hiểu mục đích lâm sàng, giá trị tầm soát và thời điểm vàng nên thực hiện</p>
              </div>

              <div class="clinical-overview-prose" [innerHTML]="service()!.overviewHtml"></div>

              <!-- Indications & Symptoms Checklist -->
              <div class="indications-container">
                <div class="indications-head">
                  <div class="badge-icon-teal">
                    <app-clinic-icon name="check-circle" [size]="18" color="#0E4A55"></app-clinic-icon>
                  </div>
                  <div>
                    <h3 class="font-serif indications-title">Khi nào bạn nên chỉ định làm dịch vụ này?</h3>
                    <p class="indications-subtitle">Các triệu chứng cảnh báo và đối tượng được khuyến cáo thực hiện:</p>
                  </div>
                </div>

                <div class="indications-chips-grid">
                  @for (ind of service()!.clinicalIndications; track ind) {
                    <div class="indication-chip-item">
                      <div class="check-bubble">
                        <app-clinic-icon name="check" [size]="13" color="#0E4A55"></app-clinic-icon>
                      </div>
                      <span class="chip-label">{{ ind }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Contraindications Alert if any -->
              @if (service()!.contraindications && service()!.contraindications!.length > 0) {
                <div class="contraindications-alert-banner">
                  <div class="alert-icon-wrap">
                    <app-clinic-icon name="alert-triangle" [size]="20" color="#B45309"></app-clinic-icon>
                  </div>
                  <div class="alert-content">
                    <h4 class="font-bold">Lưu ý Chống chỉ định & Thận trọng:</h4>
                    <ul>
                      @for (contra of service()!.contraindications; track contra) {
                        <li>{{ contra }}</li>
                      }
                    </ul>
                  </div>
                </div>
              }

              <!-- 3 Quality Pillars Grid -->
              <div class="quality-pillars-grid">
                @for (c of service()!.qualityCommitments; track c.title) {
                  <div class="pillar-card">
                    <div class="pillar-icon-box">
                      <app-clinic-icon [name]="c.icon" [size]="22" color="#0E4A55"></app-clinic-icon>
                    </div>
                    <div class="pillar-details">
                      <h4 class="pillar-title font-bold">{{ c.title }}</h4>
                      <p class="pillar-desc">{{ c.desc }}</p>
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- SECTION 2: MODERN EQUIPMENT & MEDICAL TECHNOLOGY (CORE FOCUS) -->
            <section id="equipment" class="luxury-widget-card highlighted-tech-widget">
              <div class="widget-header-row">
                <div class="section-tag-gold font-serif">MỤC 02 • ĐẦU TƯ TRỌNG ĐIỂM • CÔNG NGHỆ CAO</div>
                <h2 class="widget-heading font-serif">Hệ Thống Máy Móc & Thiết Bị Y Khoa Hiện Đại</h2>
                <p class="widget-subheading">
                  Smart Clinic trang bị 100% máy móc thế hệ mới nhất nhập khẩu từ Hoa Kỳ, Nhật Bản và Châu Âu với chứng nhận FDA, CE, ISO
                </p>
              </div>

              <div class="equipment-cards-stack">
                @for (eq of service()!.equipment; track eq.name; let idx = $index) {
                  <article class="modern-equipment-card">
                    <!-- Ribbon Top: Origin, Manufacturer & Certifications -->
                    <div class="eq-top-ribbon">
                      <div class="eq-brand-badge">
                        <span class="flag-pill">
                          <app-clinic-icon name="shield-check" [size]="14"></app-clinic-icon>
                          {{ eq.origin }}
                        </span>
                        <span class="eq-maker-name">{{ eq.manufacturer }}</span>
                      </div>

                      <div class="eq-cert-cluster">
                        @for (cert of eq.certifications; track cert) {
                          <span class="cert-chip">{{ cert }}</span>
                        }
                      </div>
                    </div>

                    <!-- Equipment Inner Split: Image & Specs -->
                    <div class="eq-inner-grid">
                      <div class="eq-media-container">
                        <img [src]="eq.imageUrl" [alt]="eq.name" class="eq-visual-photo" loading="lazy" />
                        <div class="eq-hud-overlay">
                          <span class="eq-tagline-text">{{ eq.tagline }}</span>
                        </div>
                      </div>

                      <div class="eq-info-container">
                        <h3 class="eq-title-name font-serif">{{ eq.name }}</h3>
                        <p class="eq-lead-desc">{{ eq.description }}</p>

                        <!-- Tech Specs Table -->
                        <div class="eq-specs-table-box">
                          <div class="specs-table-head">
                            <app-clinic-icon name="activity" [size]="14" color="#0E4A55"></app-clinic-icon>
                            <span>THÔNG SỐ KỸ THUẬT VƯỢT TRỘI:</span>
                          </div>
                          <div class="specs-table-grid">
                            @for (spec of eq.techSpecs; track spec.label) {
                              <div class="spec-cell">
                                <span class="spec-cell-label">{{ spec.label }}</span>
                                <span class="spec-cell-value">{{ spec.value }}</span>
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Direct Benefits for Patients -->
                        <div class="eq-patient-benefits-box">
                          <div class="benefits-head">
                            <app-clinic-icon name="sparkle" [size]="14" color="#B8955A"></app-clinic-icon>
                            <span>Lợi ích trực tiếp cho bạn khi thực hiện bằng máy này:</span>
                          </div>
                          <ul class="benefits-points-list">
                            @for (b of eq.patientBenefits; track b) {
                              <li>
                                <div class="benefit-check-icon">
                                  <app-clinic-icon name="check" [size]="13" color="#0E4A55"></app-clinic-icon>
                                </div>
                                <span class="benefit-point-text">{{ b }}</span>
                              </li>
                            }
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>
                }
              </div>

              <!-- Lab Calibration & Quality Banner -->
              <div class="lab-quality-assurance-card">
                <div class="assurance-symbol">
                  <app-clinic-icon name="shield" [size]="28" color="#ECC880"></app-clinic-icon>
                </div>
                <div class="assurance-body">
                  <h4 class="font-serif assurance-heading">Cam Kết Độ Chính Xác & An Toàn Sinh Học Tuyệt Đối</h4>
                  <p>
                    Tất cả trang thiết bị tại Smart Clinic đều trải qua quy trình hiệu chuẩn định kỳ (Calibration) và kiểm soát chất lượng nội kiểm (QC) hàng ngày theo tiêu chuẩn ISO 13485 và ISO 15189 bởi đội ngũ kỹ sư được chứng nhận của hãng.
                  </p>
                </div>
              </div>
            </section>

            <!-- SECTION 3: PROCEDURE TIMELINE -->
            <section id="procedure" class="luxury-widget-card">
              <div class="widget-header-row">
                <div class="section-tag-gold font-serif">MỤC 03 • QUY TRÌNH CHUẨN Y KHOA</div>
                <h2 class="widget-heading font-serif">Quy Trình Các Bước Thực Hiện Minh Bạch</h2>
                <p class="widget-subheading">Mỗi bước được chuẩn hóa giúp tiết kiệm tối đa thời gian và mang lại cảm giác thoải mái nhất</p>
              </div>

              <div class="procedure-stepper-list">
                @for (step of service()!.procedureSteps; track step.stepNumber) {
                  <div class="stepper-node-card">
                    <div class="stepper-number-badge font-serif">
                      <span>0{{ step.stepNumber }}</span>
                    </div>

                    <div class="stepper-body">
                      <div class="stepper-top-meta">
                        <h3 class="stepper-title font-bold">{{ step.title }}</h3>
                        <span class="stepper-duration-pill">
                          <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
                          <span>{{ step.duration }}</span>
                        </span>
                      </div>
                      <p class="stepper-desc">{{ step.description }}</p>
                      @if (step.tips) {
                        <div class="stepper-tip-box">
                          <app-clinic-icon name="sparkle" [size]="14" color="#0E4A55"></app-clinic-icon>
                          <span><strong>Mẹo từ bác sĩ:</strong> {{ step.tips }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Results Delivery Assurance Box -->
              <div class="results-delivery-widget">
                <div class="delivery-icon-box">
                  <app-clinic-icon name="clipboard" [size]="24" color="#0E4A55"></app-clinic-icon>
                </div>
                <div class="delivery-body">
                  <h4 class="delivery-headline font-bold">Hình Thức & Thời Gian Bàn Giao Kết Quả</h4>
                  <p class="delivery-timing"><strong>Thời gian trả:</strong> {{ service()!.resultsTurnaroundTime }}</p>
                  <div class="delivery-formats-chips">
                    @for (fmt of service()!.resultsFormat; track fmt) {
                      <div class="format-chip">
                        <app-clinic-icon name="check-circle" [size]="13" color="#0E4A55"></app-clinic-icon>
                        <span>{{ fmt }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </section>

            <!-- SECTION 4: PREPARATION GUIDE -->
            <section id="preparation" class="luxury-widget-card">
              <div class="widget-header-row">
                <div class="section-tag-gold font-serif">MỤC 04 • DÀNH CHO NGƯỜI BỆNH</div>
                <h2 class="widget-heading font-serif">Hướng Dẫn Chuẩn Bị Trước Khi Đến Khám</h2>
                <p class="widget-subheading">Tuân thủ hướng dẫn giúp chỉ số đo đạc đạt độ chuẩn xác 100% và tiết kiệm thời gian chờ</p>
              </div>

              <div class="prep-cards-triplet">
                @for (prep of service()!.preparationInstructions; track prep.title) {
                  <div
                    class="prep-box-card"
                    [class.type-required]="prep.type === 'REQUIRED'"
                    [class.type-recommended]="prep.type === 'RECOMMENDED'"
                    [class.type-note]="prep.type === 'NOTE'"
                  >
                    <div class="prep-box-header">
                      <div class="prep-box-icon">
                        <app-clinic-icon [name]="prep.icon" [size]="18"></app-clinic-icon>
                      </div>
                      <span class="prep-level-badge">
                        @if (prep.type === 'REQUIRED') {
                          BẮT BUỘC
                        } @else if (prep.type === 'RECOMMENDED') {
                          KHUYÊN DÙNG
                        } @else {
                          LƯU Ý THÊM
                        }
                      </span>
                    </div>

                    <h3 class="prep-box-title font-bold">{{ prep.title }}</h3>
                    <p class="prep-box-text">{{ prep.details }}</p>
                  </div>
                }
              </div>
            </section>

            <!-- SECTION 5: SPECIALIST DOCTORS (NO PHOTO - PRESTIGIOUS MEDICAL EMBLEM) -->
            <section id="doctors" class="luxury-widget-card">
              <div class="widget-header-row">
                <div class="section-tag-gold font-serif">MỤC 05 • ĐỘI NGŨ CHUYÊN GIA TRỰC TIẾP</div>
                <h2 class="widget-heading font-serif">Đội Ngũ Bác Sĩ & Chuyên Gia Phụ Trách</h2>
                <p class="widget-subheading">Bác sĩ giàu kinh nghiệm công tác tại các bệnh viện hàng đầu trực tiếp thăm khám và tư vấn</p>
              </div>

              <div class="doctors-profile-deck">
                @for (doc of service()!.assignedDoctors; track doc.id) {
                  <div class="doctor-prestigious-card">
                    <div class="doc-emblem-badge">
                      <div class="emblem-inner-circle">
                        <app-clinic-icon name="stethoscope" [size]="28" color="#0E4A55"></app-clinic-icon>
                      </div>
                      <div class="doc-rating-capsule">
                        <app-clinic-icon name="sparkle" [size]="11" color="#ECC880"></app-clinic-icon>
                        <span>{{ doc.rating }}</span>
                      </div>
                    </div>

                    <div class="doc-content-side">
                      <div class="doc-dept-tag">{{ doc.specialty }}</div>
                      <h3 class="doc-full-name font-serif">{{ doc.name }}</h3>
                      <p class="doc-academic-title">{{ doc.title }}</p>

                      <div class="doc-meta-strip">
                        <span class="meta-tag">
                          <app-clinic-icon name="clock" [size]="13"></app-clinic-icon>
                          {{ doc.experience }}
                        </span>
                        <span class="meta-tag">
                          <app-clinic-icon name="calendar" [size]="13"></app-clinic-icon>
                          Lịch khám: {{ doc.availableDays }}
                        </span>
                      </div>

                      <div class="doc-card-action">
                        <button type="button" class="btn-book-with-doc" (click)="bookWithDoctor(doc.id)">
                          <app-clinic-icon name="calendar" [size]="14"></app-clinic-icon>
                          <span>Đặt lịch khám cùng Bác sĩ này</span>
                          <app-clinic-icon name="arrow-right" [size]="13"></app-clinic-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- SECTION 6: FAQS -->
            <section id="faq" class="luxury-widget-card">
              <div class="widget-header-row">
                <div class="section-tag-gold font-serif">MỤC 06 • GIẢI ĐÁP Y KHOA (FAQ)</div>
                <h2 class="widget-heading font-serif">Câu Hỏi Thường Gặp Về Dịch Vụ</h2>
                <p class="widget-subheading">Các giải đáp chi tiết từ hội đồng bác sĩ Smart Clinic</p>
              </div>

              <div class="faq-luxury-deck">
                @for (faq of service()!.faqs; track faq.question; let idx = $index) {
                  <details class="faq-bubble-item" [open]="idx === 0">
                    <summary class="faq-summary">
                      <span class="faq-q-badge font-serif">?</span>
                      <span class="faq-q-text font-serif">{{ faq.question }}</span>
                      <span class="faq-chevron">
                        <app-clinic-icon name="chevron-right" [size]="16"></app-clinic-icon>
                      </span>
                    </summary>
                    <div class="faq-body-text">
                      <p>{{ faq.answer }}</p>
                    </div>
                  </details>
                }
              </div>
            </section>
          </div>

          <!-- SIDEBAR: LUXURY CLINICAL CONCIERGE WIDGET -->
          <aside class="sidebar-concierge-column">
            <div class="sticky-concierge-card">
              <!-- Top Header Pill -->
              <div class="concierge-top-pill">
                <span class="live-status-dot"></span>
                <span>HỆ THỐNG ĐẶT LỊCH TRỰC TUYẾN 24/7</span>
              </div>

              <!-- Service Recap Box -->
              <div class="concierge-service-recap">
                <div class="service-recap-icon">
                  <app-clinic-icon [name]="service()!.icon" [size]="22" color="#0E4A55"></app-clinic-icon>
                </div>
                <div class="service-recap-info">
                  <h3 class="recap-name font-serif">{{ service()!.name }}</h3>
                  <span class="recap-room">
                    <app-clinic-icon name="map-pin" [size]="12"></app-clinic-icon>
                    {{ service()!.room }}
                  </span>
                </div>
              </div>

              <div class="concierge-divider"></div>

              <!-- Price Spotlight Block -->
              <div class="concierge-price-block">
                <span class="price-eyebrow-text">CHI PHÍ TRỌN GÓI NIÊM YẾT</span>
                <div class="price-figure-row font-serif">
                  <span class="price-figure">{{ service()!.price | vndCurrency }}</span>
                </div>
                <span class="price-guarantee-note">
                  <app-clinic-icon name="check-circle" [size]="13" color="#10B981"></app-clinic-icon>
                  Cam kết minh bạch • Không phát sinh bất kỳ phụ phí nào
                </span>
              </div>

              <!-- 4 Value Points -->
              <div class="concierge-values-list">
                <div class="value-item">
                  <div class="value-check">
                    <app-clinic-icon name="check" [size]="12" color="#0E4A55"></app-clinic-icon>
                  </div>
                  <span>Chủ động chọn ngày & khung giờ khám mong muốn</span>
                </div>
                <div class="value-item">
                  <div class="value-check">
                    <app-clinic-icon name="check" [size]="12" color="#0E4A55"></app-clinic-icon>
                  </div>
                  <span>Ưu tiên số thứ tự thông minh, không phải chờ đợi</span>
                </div>
                <div class="value-item">
                  <div class="value-check">
                    <app-clinic-icon name="check" [size]="12" color="#0E4A55"></app-clinic-icon>
                  </div>
                  <span>Được bác sĩ chuyên khoa đầu ngành trực tiếp khám</span>
                </div>
                <div class="value-item">
                  <div class="value-check">
                    <app-clinic-icon name="check" [size]="12" color="#0E4A55"></app-clinic-icon>
                  </div>
                  <span>Trả kết quả số hóa tức thì lên Cổng Bệnh Nhân</span>
                </div>
              </div>

              <!-- Main Booking CTA Button -->
              <button type="button" class="btn-concierge-book pulse-cta" (click)="bookThisService()">
                <app-clinic-icon name="calendar" [size]="18"></app-clinic-icon>
                <span>TIẾP TỤC ĐẶT LỊCH KHÁM</span>
                <app-clinic-icon name="arrow-right" [size]="16"></app-clinic-icon>
              </button>

              <!-- Medical Hotline Support -->
              <div class="concierge-support-footer">
                <div class="support-headset-icon">
                  <app-clinic-icon name="phone" [size]="16" color="#0E4A55"></app-clinic-icon>
                </div>
                <div class="support-meta">
                  <span class="support-label">Tổng đài tư vấn chuyên môn 24/7:</span>
                  <a href="tel:19006868" class="support-tel font-serif">1900 6868</a>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <!-- 6. Explore Related Clinical Services -->
        @if (relatedServices().length > 0) {
          <section class="related-catalog-section">
            <div class="related-catalog-container">
              <div class="catalog-section-header">
                <span class="section-tag-gold">DANH MỤC THAM KHẢO</span>
                <h2 class="font-serif section-main-title">Các Dịch Vụ & Kỹ Thuật Y Khoa Khác</h2>
                <p>Khám phá các kỹ thuật chẩn đoán hình ảnh và tầm soát sức khỏe toàn diện tại Smart Clinic</p>
              </div>

              <div class="related-services-grid">
                @for (rel of relatedServices(); track rel.code) {
                  <article class="related-service-card" (click)="viewOtherService(rel.code)">
                    <div class="rel-card-top">
                      <span class="rel-category-pill">{{ rel.category }}</span>
                      <span class="rel-price-text font-serif">{{ rel.price | vndCurrency }}</span>
                    </div>

                    <h3 class="rel-service-name font-serif">{{ rel.name }}</h3>
                    <p class="rel-service-desc">{{ rel.shortDescription }}</p>

                    <div class="rel-card-footer">
                      <span class="rel-room-location">
                        <app-clinic-icon name="map-pin" [size]="13" color="#5E8B7E"></app-clinic-icon>
                        {{ rel.room }}
                      </span>
                      <span class="rel-cta-action">
                        <span>Xem chi tiết & Máy móc</span>
                        <app-clinic-icon name="arrow-right" [size]="13"></app-clinic-icon>
                      </span>
                    </div>
                  </article>
                }
              </div>
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [
    `
      /* =====================================================================
         SMART CLINIC DESIGN SYSTEM - SERVICE DETAIL LUXURY SPECIFICATION
         ===================================================================== */
      :host {
        display: block;
        background-color: #F6F3EC;
        color: #1C2733;
        font-family: 'Be Vietnam Pro', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        min-height: 100vh;
      }

      .font-serif {
        font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      }

      /* 1. Header Styles (Synchronized with Public Landing Header) */
      .public-header {
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        height: 72px;
        z-index: 100;
        background: rgba(246, 243, 236, 0.94);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom: 1px solid rgba(228, 222, 210, 0.75);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

        &.scrolled {
          background: rgba(255, 255, 255, 0.96);
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
        gap: 16px;
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
          color: #ECC880;
          border: 1px solid #ECC880;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.15rem;
          box-shadow: 0 2px 6px rgba(14, 74, 85, 0.2);
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
          line-height: 1.15;
        }

        .logo-sub {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: #7A571B;
          font-weight: 700;
        }
      }

      .nav-links {
        display: flex;
        align-items: center;
        gap: 14px;

        @media (max-width: 1080px) {
          display: none;
        }
      }

      .nav-link {
        color: #111C26;
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 600;
        padding: 6px 14px;
        border-radius: 999px;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
          box-shadow: inset 0 0 0 1px rgba(14, 74, 85, 0.22);
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
        transition: all 0.25s ease;
        box-shadow: 0 1px 4px rgba(14, 74, 85, 0.05);

        .account-avatar-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0E4A55 0%, #1A6472 100%);
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          box-shadow: 0 2px 5px rgba(14, 74, 85, 0.2);
        }

        .account-text-group {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          line-height: 1;

          .acc-main {
            font-size: 0.84rem;
            font-weight: 750;
            color: #0E4A55;
          }

          .acc-slash {
            font-size: 0.75rem;
            font-weight: 600;
            color: #8C96A2;
          }

          .acc-sub {
            font-size: 0.82rem;
            font-weight: 600;
            color: #1C2733;
          }
        }

        &:hover {
          border-color: #0E4A55;
          background: #FAF9F6;
          box-shadow: 0 2px 8px rgba(14, 74, 85, 0.12);
        }
      }

      .user-profile-widget {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;

        .nav-profile-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          background: #FFFFFF;
          border: 1px solid rgba(184, 149, 90, 0.4);
          border-radius: 999px;
          padding: 4px 12px 4px 5px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 4px rgba(184, 149, 90, 0.08);

          &:hover {
            background-color: #FAF8F5;
            border-color: #B8955A;
            box-shadow: 0 3px 12px rgba(184, 149, 90, 0.16);
            transform: translateY(-1px);

            .chip-user-name {
              color: #0E4A55;
            }

            .chip-arrow-icon {
              transform: translateX(2px);
              color: #0E4A55;
            }
          }
        }

        .chip-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0E4A55 0%, #1A6472 100%);
          color: #ECC880;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(14, 74, 85, 0.2);
        }

        .chip-user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          white-space: nowrap;
        }

        .chip-user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1C2733;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .chip-role-badge {
          font-size: 0.68rem;
          font-weight: 600;
          color: #B8955A;
          white-space: nowrap;
        }

        .chip-arrow-icon {
          color: #B8955A;
          transition: transform 0.2s ease, color 0.2s ease;
        }
      }

      .btn-primary-teal {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #0E4A55;
        color: #FFFFFF;
        border: 1px solid #0E4A55;
        padding: 9px 18px;
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(14, 74, 85, 0.25);
        transition: all 0.25s ease;

        &:hover {
          background: #09343C;
          border-color: #09343C;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(14, 74, 85, 0.35);
        }
      }

      /* 2. Sub-Header (Back & Breadcrumbs) */
      .sub-header-bar {
        background: #FFFFFF;
        border-bottom: 1px solid #E4DED2;
        padding: 10px 0;
      }

      .sub-header-inner {
        max-width: 1360px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .btn-back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #F6F3EC;
        border: 1px solid #E4DED2;
        padding: 6px 14px;
        border-radius: 999px;
        color: #0E4A55;
        font-size: 0.825rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #0E4A55;
          color: #FFFFFF;
          border-color: #0E4A55;
        }
      }

      .breadcrumb-trail {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        color: #6B7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        a {
          color: #6B7280;
          text-decoration: none;
          transition: color 0.2s ease;
          &:hover {
            color: #0E4A55;
            text-decoration: underline;
          }
        }

        .sep {
          color: #D1D5DB;
        }

        .current-item {
          color: #0E4A55;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          display: none;
        }
      }

      /* Loading & Not Found */
      .loading-state-wrapper,
      .not-found-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 90px 24px;
        text-align: center;
      }

      .spinner-medical-ring {
        width: 48px;
        height: 48px;
        border: 4px solid #E4DED2;
        border-top-color: #0E4A55;
        border-radius: 50%;
        animation: ringSpin 0.75s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes ringSpin {
        to { transform: rotate(360deg); }
      }

      .not-found-panel {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 24px;
        padding: 48px 36px;
        max-width: 580px;
        box-shadow: 0 8px 30px rgba(28, 39, 51, 0.05);

        .icon-warning-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(184, 149, 90, 0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        h2 {
          color: #0E4A55;
          margin: 0 0 10px;
        }

        p {
          color: #5B6672;
          margin: 0 0 24px;
        }

        .btn-return-catalog {
          display: inline-block;
          background: #0E4A55;
          color: #FFFFFF;
          padding: 12px 24px;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.9rem;
        }
      }

      /* 3. Asymmetric 2-Column Luxury Hero Section */
      .luxury-hero-section {
        position: relative;
        background: #0A323A;
        color: #FFFFFF;
        overflow: hidden;
        padding: 60px 24px;
        border-bottom: 1px solid rgba(236, 200, 128, 0.2);
      }

      .hero-backdrop {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.18;
        filter: blur(3px);
      }

      .hero-overlay-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(10, 50, 58, 0.96) 0%, rgba(14, 74, 85, 0.92) 55%, rgba(15, 60, 68, 0.88) 100%);
      }

      .hero-container {
        position: relative;
        z-index: 10;
        max-width: 1360px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 440px;
        gap: 48px;
        align-items: center;

        @media (max-width: 1120px) {
          grid-template-columns: 1fr;
        }
      }

      .hero-badge-cluster {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;

        .pill-category {
          background: rgba(236, 200, 128, 0.2);
          color: #ECC880;
          border: 1px solid rgba(236, 200, 128, 0.45);
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 0.775rem;
          font-weight: 750;
          letter-spacing: 0.06em;
        }

        .pill-popular {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(135deg, #ECC880 0%, #D4AF37 100%);
          color: #1A3438;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 0.775rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .pill-standard {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 0.775rem;
          font-weight: 650;
        }
      }

      .hero-main-title {
        font-size: 2.75rem;
        line-height: 1.25;
        font-weight: 700;
        color: #FFFFFF;
        margin: 0 0 16px;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);

        @media (max-width: 768px) {
          font-size: 2.1rem;
        }
      }

      .hero-main-subtitle {
        font-size: 1.1rem;
        line-height: 1.65;
        color: #D3E0EA;
        max-width: 760px;
        margin: 0 0 32px;
      }

      /* Hero 2x2 Specs Grid */
      .hero-specs-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
        max-width: 720px;
        margin-bottom: 34px;

        @media (max-width: 640px) {
          grid-template-columns: 1fr;
        }
      }

      .spec-card {
        display: flex;
        align-items: center;
        gap: 14px;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 14px;
        padding: 12px 18px;
        backdrop-filter: blur(8px);
        transition: all 0.25s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(236, 200, 128, 0.4);
        }

        .spec-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(236, 200, 128, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .spec-text {
          display: flex;
          flex-direction: column;
        }

        .spec-label {
          font-size: 0.725rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94A3B8;
        }

        .spec-value {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
        }
      }

      .hero-actions-row {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
        margin-bottom: 24px;
      }

      .btn-hero-primary-gold {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #ECC880 0%, #D4AF37 100%);
        color: #0A323A;
        border: none;
        padding: 15px 32px;
        border-radius: 999px;
        font-size: 0.95rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(236, 200, 128, 0.35);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(236, 200, 128, 0.5);
        }
      }

      .btn-hero-secondary-tech {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.12);
        color: #FFFFFF;
        border: 1.5px solid rgba(255, 255, 255, 0.28);
        padding: 14px 26px;
        border-radius: 999px;
        font-size: 0.92rem;
        font-weight: 650;
        cursor: pointer;
        backdrop-filter: blur(6px);
        transition: all 0.25s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: #FFFFFF;
          transform: translateY(-1px);
        }
      }

      .hero-reassurance-note {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #CAD5DF;

        strong {
          color: #ECC880;
        }
      }

      /* Hero Visual Showcase Card (Right Column) */
      .hero-visual-card {
        background: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
        transition: transform 0.3s ease;

        &:hover {
          transform: translateY(-3px);
        }

        .card-image-wrap {
          position: relative;
          height: 270px;
          background: #0E4A55;
          overflow: hidden;

          .service-cover-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .image-gradient-shade {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(14, 74, 85, 0.85) 0%, transparent 60%);
          }

          .floating-price-tag {
            position: absolute;
            top: 18px;
            right: 18px;
            background: rgba(255, 255, 255, 0.96);
            border: 1.5px solid #ECC880;
            border-radius: 16px;
            padding: 10px 18px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
            text-align: right;
            backdrop-filter: blur(8px);

            .price-eyebrow {
              font-size: 0.65rem;
              font-weight: 800;
              letter-spacing: 0.08em;
              color: #7A571B;
              display: block;
              margin-bottom: 2px;
            }

            .price-num {
              font-size: 1.6rem;
              font-weight: 700;
              color: #0E4A55;
              line-height: 1.1;
            }

            .price-sub-note {
              font-size: 0.7rem;
              color: #5E8B7E;
              font-weight: 650;
              display: block;
            }
          }

          .floating-trust-pill {
            position: absolute;
            bottom: 16px;
            left: 16px;
            right: 16px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(14, 74, 85, 0.9);
            color: #FFFFFF;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 600;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(236, 200, 128, 0.35);
          }
        }

        .card-bottom-info {
          padding: 22px 24px;
          background: #FFFFFF;
          color: #1C2733;

          .info-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
          }

          .info-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #0E4A55;
          }

          .info-code {
            font-size: 0.775rem;
            font-weight: 700;
            color: #B8955A;
            background: #FDF9F0;
            padding: 2px 8px;
            border-radius: 6px;
            border: 1px solid #F0E6D2;
          }

          .info-desc {
            font-size: 0.88rem;
            line-height: 1.5;
            color: #5B6672;
            margin: 0;
          }
        }
      }

      /* 4. Interactive Sticky Capsule Segmented Navigation */
      .sticky-capsule-nav {
        position: sticky;
        top: 72px;
        z-index: 80;
        background: rgba(246, 243, 236, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid #E4DED2;
        padding: 10px 0;
      }

      .capsule-nav-container {
        max-width: 1360px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .capsule-nav-inner {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 4px;
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 999px;
        box-shadow: 0 4px 14px rgba(28, 39, 51, 0.04);

        &::-webkit-scrollbar {
          display: none;
        }
      }

      .capsule-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 18px;
        border: none;
        background: transparent;
        color: #4B5765;
        font-size: 0.88rem;
        font-weight: 650;
        border-radius: 999px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

        &:hover {
          color: #0E4A55;
          background: #F6F3EC;
        }

        &.active {
          background: #0E4A55;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(14, 74, 85, 0.25);
        }

        &.highlight-gold {
          color: #7A571B;

          &.active {
            background: #0E4A55;
            color: #FFFFFF;
          }
        }

        .gold-dot-pill {
          background: linear-gradient(135deg, #ECC880 0%, #D4AF37 100%);
          color: #1A3438;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
          text-transform: uppercase;
        }
      }

      /* 5. Main Workspace Layout */
      .workspace-body-container {
        max-width: 1360px;
        margin: 36px auto 80px;
        padding: 0 24px;
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 36px;
        align-items: start;

        @media (max-width: 1024px) {
          grid-template-columns: 1fr;
        }
      }

      .content-primary-column {
        min-width: 0;
      }

      /* Luxury Widget Cards */
      .luxury-widget-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 24px;
        padding: 38px;
        margin-bottom: 36px;
        box-shadow: 0 4px 20px rgba(28, 39, 51, 0.035);

        @media (max-width: 768px) {
          padding: 24px 18px;
          border-radius: 18px;
        }
      }

      .widget-header-row {
        margin-bottom: 28px;
        padding-bottom: 20px;
        border-bottom: 1px solid #F0ECE4;

        .section-tag-gold {
          font-size: 0.725rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #7A571B;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .widget-heading {
          font-size: 1.75rem;
          color: #0E4A55;
          margin: 0 0 6px;
          font-weight: 700;
        }

        .widget-subheading {
          font-size: 0.95rem;
          color: #5B6672;
          margin: 0;
        }
      }

      /* Section 1: Clinical Prose & Indications */
      .clinical-overview-prose {
        font-size: 1.02rem;
        line-height: 1.8;
        color: #2C3946;
        margin-bottom: 28px;

        p {
          margin-bottom: 14px;
        }
      }

      .indications-container {
        background: #FAF8F5;
        border: 1.5px solid #EFEAE2;
        border-radius: 20px;
        padding: 26px;
        margin-bottom: 26px;

        .indications-head {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 18px;

          .badge-icon-teal {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: #E6F4F5;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .indications-title {
            font-size: 1.15rem;
            color: #0E4A55;
            margin: 0 0 2px;
          }

          .indications-subtitle {
            font-size: 0.88rem;
            color: #64748B;
            margin: 0;
          }
        }
      }

      .indications-chips-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .indication-chip-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: #FFFFFF;
        border: 1px solid #E8E2D8;
        border-radius: 12px;
        padding: 12px 16px;
        font-size: 0.925rem;
        color: #1C2733;
        line-height: 1.55;

        .check-bubble {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #E6F4F5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
      }

      .contraindications-alert-banner {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        background: #FFFBEB;
        border: 1px solid #FDE68A;
        border-radius: 14px;
        padding: 18px 22px;
        margin-bottom: 28px;

        .alert-icon-wrap {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .alert-content {
          h4 {
            color: #92400E;
            margin: 0 0 6px;
            font-size: 0.95rem;
          }

          ul {
            margin: 0;
            padding-left: 18px;
            font-size: 0.88rem;
            color: #78350F;
          }
        }
      }

      .quality-pillars-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 18px;
        margin-top: 28px;
      }

      .pillar-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        background: #FAF8F5;
        border: 1px solid #EFEAE2;
        border-radius: 16px;
        padding: 20px;
        transition: all 0.2s ease;

        &:hover {
          background: #FFFFFF;
          border-color: #0E4A55;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(14, 74, 85, 0.05);
        }

        .pillar-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #E6F4F5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pillar-title {
          font-size: 0.95rem;
          color: #0E4A55;
          margin: 0 0 4px;
        }

        .pillar-desc {
          font-size: 0.825rem;
          color: #5B6672;
          margin: 0;
          line-height: 1.5;
        }
      }

      /* Section 2: High-Tech Equipment Cards Stack */
      .highlighted-tech-widget {
        border-color: #D2DCDE;
      }

      .equipment-cards-stack {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .modern-equipment-card {
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 6px 24px rgba(28, 39, 51, 0.04);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

        &:hover {
          border-color: #0E4A55;
          box-shadow: 0 12px 36px rgba(14, 74, 85, 0.09);
        }

        .eq-top-ribbon {
          background: #0E4A55;
          color: #FFFFFF;
          padding: 12px 24px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          .eq-brand-badge {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .flag-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(236, 200, 128, 0.22);
            color: #ECC880;
            border: 1px solid rgba(236, 200, 128, 0.45);
            padding: 3px 12px;
            border-radius: 999px;
            font-size: 0.775rem;
            font-weight: 750;
          }

          .eq-maker-name {
            font-size: 0.88rem;
            font-weight: 600;
            color: #E2E8F0;
          }

          .eq-cert-cluster {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .cert-chip {
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.25);
            color: #FFFFFF;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 0.725rem;
            font-weight: 650;
          }
        }

        .eq-inner-grid {
          display: grid;
          grid-template-columns: 310px 1fr;
          gap: 28px;
          padding: 28px;

          @media (max-width: 900px) {
            grid-template-columns: 1fr;
          }
        }

        .eq-media-container {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #0A323A;
          height: 100%;
          min-height: 270px;

          .eq-visual-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.4s ease;
          }

          &:hover .eq-visual-photo {
            transform: scale(1.04);
          }

          .eq-hud-overlay {
            position: absolute;
            bottom: 0;
            inset-inline: 0;
            background: linear-gradient(to top, rgba(10, 50, 58, 0.92) 0%, transparent 100%);
            padding: 24px 16px 14px;
            color: #FFFFFF;
            font-size: 0.8rem;
            line-height: 1.4;
            font-weight: 550;
          }
        }

        .eq-info-container {
          display: flex;
          flex-direction: column;

          .eq-title-name {
            font-size: 1.45rem;
            color: #0E4A55;
            font-weight: 700;
            margin: 0 0 8px;
          }

          .eq-lead-desc {
            font-size: 0.92rem;
            line-height: 1.65;
            color: #475569;
            margin: 0 0 18px;
          }
        }

        .eq-specs-table-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px 20px;
          margin-bottom: 20px;

          .specs-table-head {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.775rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            color: #0E4A55;
            margin-bottom: 12px;
          }

          .specs-table-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 20px;

            @media (max-width: 600px) {
              grid-template-columns: 1fr;
            }
          }

          .spec-cell {
            display: flex;
            flex-direction: column;

            .spec-cell-label {
              font-size: 0.75rem;
              color: #64748B;
              font-weight: 500;
            }

            .spec-cell-value {
              font-size: 0.88rem;
              font-weight: 700;
              color: #0F172A;
            }
          }
        }

        .eq-patient-benefits-box {
          .benefits-head {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.84rem;
            font-weight: 750;
            color: #7A571B;
            margin-bottom: 10px;
          }

          .benefits-points-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;

            li {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              font-size: 0.9rem;
              color: #1E293B;

              .benefit-check-icon {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #E6F4F5;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                margin-top: 1px;
              }
            }
          }
        }
      }

      .lab-quality-assurance-card {
        display: flex;
        align-items: center;
        gap: 20px;
        background: #0E4A55;
        color: #FFFFFF;
        border-radius: 18px;
        padding: 24px 28px;
        margin-top: 28px;

        .assurance-symbol {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(236, 200, 128, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .assurance-heading {
          color: #ECC880;
          font-size: 1.15rem;
          margin: 0 0 4px;
        }

        p {
          color: #E2E8F0;
          font-size: 0.9rem;
          line-height: 1.55;
          margin: 0;
        }
      }

      /* Section 3: Timeline Stepper */
      .procedure-stepper-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 26px;
      }

      .stepper-node-card {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        padding: 22px 24px;
        background: #FAF8F5;
        border: 1.5px solid #EFEAE2;
        border-radius: 18px;
        transition: all 0.2s ease;

        &:hover {
          background: #FFFFFF;
          border-color: #0E4A55;
          box-shadow: 0 6px 18px rgba(14, 74, 85, 0.05);
        }

        .stepper-number-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #0E4A55;
          color: #ECC880;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          font-weight: 750;
          flex-shrink: 0;
        }

        .stepper-body {
          flex: 1;

          .stepper-top-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 6px;
          }

          .stepper-title {
            font-size: 1.1rem;
            color: #0E4A55;
            margin: 0;
          }

          .stepper-duration-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #EFEAE2;
            color: #475569;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .stepper-desc {
            font-size: 0.92rem;
            line-height: 1.6;
            color: #4B5563;
            margin: 0 0 8px;
          }

          .stepper-tip-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #E6F4F5;
            border-radius: 8px;
            padding: 7px 12px;
            font-size: 0.84rem;
            color: #0E4A55;
          }
        }
      }

      .results-delivery-widget {
        display: flex;
        align-items: flex-start;
        gap: 18px;
        background: #F0FDF4;
        border: 1.5px solid #BBF7D0;
        border-radius: 18px;
        padding: 24px;

        .delivery-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #DCFCE7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .delivery-headline {
          font-size: 1.05rem;
          color: #166534;
          margin: 0 0 4px;
        }

        .delivery-timing {
          font-size: 0.9rem;
          color: #15803D;
          margin: 0 0 12px;
        }

        .delivery-formats-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .format-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #FFFFFF;
            border: 1px solid #86EFAC;
            color: #14532D;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 0.825rem;
            font-weight: 600;
          }
        }
      }

      /* Section 4: Preparation Cards Triplet */
      .prep-cards-triplet {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
      }

      .prep-box-card {
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 18px;
        padding: 24px;
        transition: all 0.2s ease;

        &.type-required {
          border-top: 4px solid #EF4444;
          background: #FFFBFB;
        }

        &.type-recommended {
          border-top: 4px solid #3B82F6;
          background: #FBFDFF;
        }

        &.type-note {
          border-top: 4px solid #10B981;
          background: #FBFFFD;
        }

        .prep-box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .prep-box-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #F6F3EC;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .prep-level-badge {
          font-size: 0.725rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }

        &.type-required .prep-level-badge {
          background: #FEE2E2;
          color: #991B1B;
        }

        &.type-recommended .prep-level-badge {
          background: #DBEAFE;
          color: #1E40AF;
        }

        &.type-note .prep-level-badge {
          background: #DCFCE7;
          color: #166534;
        }

        .prep-box-title {
          font-size: 1.05rem;
          color: #1C2733;
          margin: 0 0 6px;
        }

        .prep-box-text {
          font-size: 0.88rem;
          line-height: 1.6;
          color: #4B5765;
          margin: 0;
        }
      }

      /* Section 5: Doctor Profile Deck */
      .doctors-profile-deck {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
      }

      .doctor-prestigious-card {
        background: #FAF8F5;
        border: 1.5px solid #EFEAE2;
        border-radius: 20px;
        padding: 24px;
        display: flex;
        gap: 20px;
        transition: all 0.25s ease;

        &:hover {
          background: #FFFFFF;
          border-color: #0E4A55;
          box-shadow: 0 8px 24px rgba(14, 74, 85, 0.08);
          transform: translateY(-2px);
        }

        .doc-emblem-badge {
          position: relative;
          width: 74px;
          height: 74px;
          border-radius: 18px;
          background: linear-gradient(135deg, #E6F4F5 0%, #D4EEF2 100%);
          border: 2px solid #CCFBF1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(14, 74, 85, 0.08);

          .emblem-inner-circle {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .doc-rating-capsule {
            position: absolute;
            bottom: -8px;
            background: #0E4A55;
            color: #FFFFFF;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 0.725rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 3px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          }
        }

        .doc-content-side {
          flex: 1;

          .doc-dept-tag {
            font-size: 0.75rem;
            font-weight: 800;
            color: #7A571B;
            text-transform: uppercase;
            margin-bottom: 2px;
          }

          .doc-full-name {
            font-size: 1.25rem;
            font-weight: 700;
            color: #0E4A55;
            margin: 0 0 2px;
          }

          .doc-academic-title {
            font-size: 0.85rem;
            color: #64748B;
            margin: 0 0 10px;
          }

          .doc-meta-strip {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 14px;

            .meta-tag {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 0.825rem;
              color: #475569;
            }
          }

          .btn-book-with-doc {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #0E4A55;
            color: #FFFFFF;
            border: 1px solid #0E4A55;
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 0.825rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background: #09343C;
              transform: translateY(-1px);
            }
          }
        }
      }

      /* Section 6: FAQ */
      .faq-luxury-deck {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .faq-bubble-item {
        background: #FAF8F5;
        border: 1.5px solid #EFEAE2;
        border-radius: 16px;
        padding: 16px 20px;
        transition: all 0.2s ease;

        &[open] {
          background: #FFFFFF;
          border-color: #0E4A55;
          box-shadow: 0 4px 14px rgba(14, 74, 85, 0.06);
        }

        .faq-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          list-style: none;
          user-select: none;

          &::-webkit-details-marker {
            display: none;
          }

          .faq-q-badge {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #0E4A55;
            color: #ECC880;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.85rem;
            flex-shrink: 0;
          }

          .faq-q-text {
            flex: 1;
            font-size: 1.05rem;
            font-weight: 700;
            color: #1C2733;
          }

          .faq-chevron {
            color: #9CA3AF;
            transition: transform 0.2s ease;
          }
        }

        &[open] .faq-chevron {
          transform: rotate(90deg);
          color: #0E4A55;
        }

        .faq-body-text {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #F0ECE4;
          font-size: 0.94rem;
          line-height: 1.7;
          color: #4B5765;

          p {
            margin: 0;
          }
        }
      }

      /* SIDEBAR: STICKY CONCIERGE CARD */
      .sidebar-concierge-column {
        position: relative;
      }

      .sticky-concierge-card {
        position: sticky;
        top: 140px;
        background: #FFFFFF;
        border: 1.5px solid #E4DED2;
        border-radius: 24px;
        padding: 30px 26px;
        box-shadow: 0 10px 32px rgba(28, 39, 51, 0.07);

        .concierge-top-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #E6F4F5;
          color: #0E4A55;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.725rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          margin-bottom: 18px;

          .live-status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #10B981;
            box-shadow: 0 0 6px #10B981;
          }
        }

        .concierge-service-recap {
          display: flex;
          align-items: center;
          gap: 12px;

          .service-recap-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: #FAF8F5;
            border: 1px solid #EFEAE2;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .recap-name {
            font-size: 1.1rem;
            color: #0E4A55;
            font-weight: 700;
            margin: 0 0 2px;
            line-height: 1.35;
          }

          .recap-room {
            font-size: 0.775rem;
            color: #64748B;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
        }

        .concierge-divider {
          height: 1px;
          background: #F0ECE4;
          margin: 18px 0;
        }

        .concierge-price-block {
          margin-bottom: 22px;

          .price-eyebrow-text {
            font-size: 0.725rem;
            font-weight: 750;
            color: #7A571B;
            letter-spacing: 0.08em;
            display: block;
            margin-bottom: 2px;
          }

          .price-figure-row {
            .price-figure {
              font-size: 2.2rem;
              font-weight: 700;
              color: #0E4A55;
              line-height: 1.1;
            }
          }

          .price-guarantee-note {
            font-size: 0.775rem;
            color: #10B981;
            font-weight: 650;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
          }
        }

        .concierge-values-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;

          .value-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 0.86rem;
            color: #374151;
            line-height: 1.45;

            .value-check {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #E6F4F5;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin-top: 1px;
            }
          }
        }

        .btn-concierge-book {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #0E4A55 0%, #155E6C 100%);
          color: #FFFFFF;
          border: none;
          padding: 15px 20px;
          border-radius: 999px;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(14, 74, 85, 0.28);
          transition: all 0.25s ease;

          &:hover {
            background: #09343C;
            transform: translateY(-2px);
            box-shadow: 0 10px 26px rgba(14, 74, 85, 0.38);
          }
        }

        .pulse-cta {
          animation: subtlePulse 3.5s infinite;
        }

        @keyframes subtlePulse {
          0%, 100% {
            box-shadow: 0 6px 20px rgba(14, 74, 85, 0.28);
          }
          50% {
            box-shadow: 0 8px 28px rgba(236, 200, 128, 0.45);
          }
        }

        .concierge-support-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 22px;
          padding: 12px 14px;
          background: #FAF8F5;
          border: 1px solid #EFEAE2;
          border-radius: 14px;

          .support-headset-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #E6F4F5;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .support-label {
            font-size: 0.725rem;
            color: #64748B;
            display: block;
          }

          .support-tel {
            font-size: 1.1rem;
            font-weight: 750;
            color: #0E4A55;
            text-decoration: none;
          }
        }
      }

      /* 6. Related Catalog Section */
      .related-catalog-section {
        background: #FFFFFF;
        border-top: 1px solid #E4DED2;
        padding: 72px 24px;
      }

      .related-catalog-container {
        max-width: 1360px;
        margin: 0 auto;
      }

      .catalog-section-header {
        text-align: center;
        margin-bottom: 44px;

        .section-tag-gold {
          font-size: 0.775rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #7A571B;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }

        .section-main-title {
          font-size: 2rem;
          color: #0E4A55;
          margin: 0 0 8px;
        }

        p {
          color: #5B6672;
          margin: 0;
        }
      }

      .related-services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
      }

      .related-service-card {
        background: #FAF8F5;
        border: 1.5px solid #EFEAE2;
        border-radius: 20px;
        padding: 24px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        transition: all 0.25s ease;

        &:hover {
          background: #FFFFFF;
          border-color: #0E4A55;
          transform: translateY(-4px);
          box-shadow: 0 10px 26px rgba(14, 74, 85, 0.08);
        }

        .rel-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .rel-category-pill {
          font-size: 0.75rem;
          font-weight: 750;
          color: #7A571B;
          background: #FDF9F0;
          border: 1px solid #F0E6D2;
          padding: 3px 9px;
          border-radius: 6px;
        }

        .rel-price-text {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0E4A55;
        }

        .rel-service-name {
          font-size: 1.2rem;
          color: #0E4A55;
          font-weight: 700;
          margin: 0 0 8px;
          line-height: 1.35;
        }

        .rel-service-desc {
          font-size: 0.88rem;
          line-height: 1.55;
          color: #5B6672;
          margin: 0 0 16px;
          flex: 1;
        }

        .rel-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid #EFEAE2;
          font-size: 0.82rem;

          .rel-room-location {
            color: #475569;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .rel-cta-action {
            color: #0E4A55;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    `,
  ],
})
export class ServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceService = inject(ServiceDetailService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  userMonogram = computed(() => {
    const name = this.currentUser()?.fullName || '';
    if (!name) return 'SC';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  service = signal<ServiceDetail | null>(null);
  relatedServices = signal<ServiceDetail[]>([]);
  isLoading = signal<boolean>(true);
  activeTab = signal<string>('overview');
  isScrolled = signal<boolean>(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollPos = window.scrollY;
    this.isScrolled.set(scrollPos > 20);

    const sections = ['overview', 'equipment', 'procedure', 'preparation', 'doctors', 'faq'];
    for (let i = sections.length - 1; i >= 0; i--) {
      const id = sections[i];
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop - 180;
        if (scrollPos >= top) {
          this.activeTab.set(id);
          break;
        }
      }
    }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('code') || 'KB-TIMMACH';
      this.loadServiceData(code);
    });

    this.route.fragment.subscribe((frag) => {
      if (frag) {
        this.selectTab(frag);
      }
    });
  }

  loadServiceData(code: string): void {
    this.isLoading.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.serviceService.getServiceByCode(code).subscribe({
      next: (data) => {
        if (data) {
          this.service.set(data);
          this.serviceService.getRelatedServices(data.code).subscribe((rel) => {
            this.relatedServices.set(rel);
          });
        } else {
          this.service.set(null);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.service.set(null);
        this.isLoading.set(false);
      },
    });
  }

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
    const element = document.getElementById(tabId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }

  bookThisService(): void {
    const svc = this.service();
    if (!svc) return;

    const isAuth = this.authService.isAuthenticated();
    const role = this.authService.currentRole();

    if (isAuth && role === 'PATIENT') {
      this.router.navigate(['/patient/booking'], {
        queryParams: { serviceId: svc.code },
      });
    } else {
      this.router.navigate(['/auth/login'], {
        queryParams: {
          returnUrl: `/patient/booking?serviceId=${svc.code}`,
        },
      });
    }
  }

  bookWithDoctor(doctorId: string): void {
    const svc = this.service();
    const serviceCode = svc ? svc.code : '';

    const isAuth = this.authService.isAuthenticated();
    const role = this.authService.currentRole();

    if (isAuth && role === 'PATIENT') {
      this.router.navigate(['/patient/booking'], {
        queryParams: { serviceId: serviceCode, doctorId: doctorId },
      });
    } else {
      this.router.navigate(['/auth/login'], {
        queryParams: {
          returnUrl: `/patient/booking?serviceId=${serviceCode}&doctorId=${doctorId}`,
        },
      });
    }
  }

  viewOtherService(code: string): void {
    this.router.navigate(['/services', code]);
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
