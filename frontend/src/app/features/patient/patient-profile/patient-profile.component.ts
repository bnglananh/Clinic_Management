import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { UserProfile } from '../../../core/models/user-profile.model';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

type ProfileTab = 'general' | 'medical' | 'security' | 'ecard';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ClinicIconComponent,
  ],
  template: `
    <div class="patient-profile-page animate-fade-in-up">
      <!-- Breadcrumb Navigation -->
      <nav class="profile-breadcrumb">
        <a routerLink="/patient" class="bc-link">
          <app-clinic-icon name="home" [size]="14"></app-clinic-icon>
          <span>Trang chủ</span>
        </a>
        <span class="bc-sep">/</span>
        <span class="bc-current">Hồ sơ cá nhân</span>
      </nav>

      <!-- Profile Header / Hero Card -->
      <div class="profile-hero-card clinic-card">
        <div class="hero-left">
          <div class="avatar-wrapper">
            <img [src]="profile()?.avatarUrl" [alt]="profile()?.fullName" class="avatar-img" />
            <button class="avatar-edit-btn" (click)="toggleAvatarModal()" title="Thay đổi ảnh đại diện">
              <app-clinic-icon name="edit" [size]="14"></app-clinic-icon>
            </button>
          </div>
          <div class="user-meta">
            <div class="name-tier-row">
              <h1 class="user-full-name font-serif">{{ profile()?.fullName }}</h1>
              <span class="vip-badge">
                <app-clinic-icon name="sparkle" [size]="13" color="#B8955A"></app-clinic-icon>
                {{ profile()?.membershipTier || 'Hạng Vàng VIP' }}
              </span>
            </div>
            <div class="sub-meta-row">
              <span class="meta-tag code-tag">
                <app-clinic-icon name="ticket" [size]="13"></app-clinic-icon>
                Mã BN: <strong>{{ profile()?.patientCode }}</strong>
              </span>
              <span class="meta-tag">
                <app-clinic-icon name="phone" [size]="13"></app-clinic-icon>
                {{ profile()?.phone }}
              </span>
              <span class="meta-tag">
                <app-clinic-icon name="mail" [size]="13"></app-clinic-icon>
                {{ profile()?.email }}
              </span>
              <span class="meta-tag verify-tag">
                <app-clinic-icon name="shield-check" [size]="13" color="#0E4A55"></app-clinic-icon>
                Đã định danh CCCD
              </span>
            </div>
          </div>
        </div>

        <div class="hero-quick-stats">
          <div class="stat-mini-box">
            <span class="stat-val">{{ profile()?.totalVisits || 4 }}</span>
            <span class="stat-lbl">Lượt đã khám</span>
          </div>
          <div class="stat-mini-box">
            <span class="stat-val blood-val">{{ profile()?.bloodType || 'O+' }}</span>
            <span class="stat-lbl">Nhóm máu</span>
          </div>
          <div class="stat-mini-box">
            <span class="stat-val tier-val">15%</span>
            <span class="stat-lbl">Ưu đãi viện phí</span>
          </div>
        </div>
      </div>

      <!-- Toast Feedback Message -->
      @if (feedbackMsg()) {
        <div class="feedback-toast" [class.error]="feedbackType() === 'error'">
          <app-clinic-icon [name]="feedbackType() === 'success' ? 'check' : 'alert-triangle'" [size]="18"></app-clinic-icon>
          <span>{{ feedbackMsg() }}</span>
          <button class="toast-close-btn" (click)="feedbackMsg.set('')">✕</button>
        </div>
      }

      <!-- Main Profile Workspace -->
      <div class="profile-layout-grid">
        <!-- Sidebar Navigation Tabs -->
        <aside class="profile-tabs-sidebar clinic-card">
          <div class="sidebar-header">
            <span class="sb-title">DANH MỤC THÔNG TIN</span>
          </div>
          <nav class="sidebar-nav">
            <button
              id="tab-btn-general"
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'general'"
              (click)="setActiveTab('general')"
            >
              <div class="tab-icon-box">
                <app-clinic-icon name="user" [size]="16"></app-clinic-icon>
              </div>
              <div class="tab-btn-text">
                <span class="tab-title">Thông tin hành chính</span>
                <span class="tab-desc">Họ tên, CCCD, ngày sinh, liên hệ</span>
              </div>
              <span class="tab-indicator"></span>
            </button>

            <button
              id="tab-btn-medical"
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'medical'"
              (click)="setActiveTab('medical')"
            >
              <div class="tab-icon-box">
                <app-clinic-icon name="heart-pulse" [size]="16"></app-clinic-icon>
              </div>
              <div class="tab-btn-text">
                <span class="tab-title">Hồ sơ y tế & Dị ứng</span>
                <span class="tab-desc">Nhóm máu, dị ứng, liên hệ khẩn cấp</span>
              </div>
              <span class="tab-indicator"></span>
            </button>

            <button
              id="tab-btn-security"
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'security'"
              (click)="setActiveTab('security')"
            >
              <div class="tab-icon-box">
                <app-clinic-icon name="lock" [size]="16"></app-clinic-icon>
              </div>
              <div class="tab-btn-text">
                <span class="tab-title">Tài khoản & Bảo mật</span>
                <span class="tab-desc">Đổi mật khẩu, xác thực phiên</span>
              </div>
              <span class="tab-indicator"></span>
            </button>

            <button
              id="tab-btn-ecard"
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'ecard'"
              (click)="setActiveTab('ecard')"
            >
              <div class="tab-icon-box">
                <app-clinic-icon name="credit-card" [size]="16"></app-clinic-icon>
              </div>
              <div class="tab-btn-text">
                <span class="tab-title">Thẻ khám bệnh điện tử</span>
                <span class="tab-desc">Mã QR tiếp đón, quyền lợi VIP</span>
              </div>
              <span class="tab-indicator"></span>
            </button>
          </nav>

          <div class="sidebar-footer-tip">
            <app-clinic-icon name="shield-check" [size]="16" color="#5E8B7E"></app-clinic-icon>
            <p>Dữ liệu bệnh án và nhân thân được mã hóa theo tiêu chuẩn bảo mật y tế HIPAA & Bộ Y Tế.</p>
          </div>
        </aside>

        <!-- Main Content Canvas -->
        <main class="profile-content-pane clinic-card">
          <!-- TAB 1: THÔNG TIN HÀNH CHÍNH & LIÊN LẠC -->
          @if (activeTab() === 'general') {
            <div class="tab-section animate-fade-in">
              <div class="section-top-bar">
                <div>
                  <h2 class="section-heading font-serif">Thông tin hành chính & Liên hệ</h2>
                  <p class="section-sub">
                    Quản lý thông tin định danh cá nhân và phương thức liên lạc nhận kết quả khám và nhắc lịch
                  </p>
                </div>
                <div class="last-updated-badge">
                  Cập nhật: {{ profile()?.updatedAt || '2026-10-06' }}
                </div>
              </div>

              <form [formGroup]="generalForm" (ngSubmit)="saveGeneralInfo()" class="profile-form">
                <div class="form-row-grid">
                  <!-- Họ và tên -->
                  <div class="form-group col-span-2">
                    <label class="form-label" for="fullName">
                      Họ và tên bệnh nhân <span class="req">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      formControlName="fullName"
                      class="form-control"
                      placeholder="Nguyễn Văn A"
                    />
                    @if (generalForm.get('fullName')?.touched && generalForm.get('fullName')?.invalid) {
                      <span class="field-error">Vui lòng nhập họ và tên hợp lệ (từ 2 đến 100 ký tự)</span>
                    }
                  </div>

                  <!-- Mã bệnh nhân (Readonly) -->
                  <div class="form-group">
                    <label class="form-label">Mã bệnh nhân (Cố định)</label>
                    <div class="readonly-badge-input">
                      <app-clinic-icon name="ticket" [size]="14"></app-clinic-icon>
                      <span>{{ profile()?.patientCode }}</span>
                    </div>
                  </div>

                  <!-- Tên đăng nhập (Readonly) -->
                  <div class="form-group">
                    <label class="form-label">Tên tài khoản</label>
                    <div class="readonly-badge-input">
                      <app-clinic-icon name="user" [size]="14"></app-clinic-icon>
                      <span>{{ profile()?.username }}</span>
                    </div>
                  </div>

                  <!-- Ngày sinh -->
                  <div class="form-group">
                    <label class="form-label" for="dateOfBirth">Ngày sinh <span class="req">*</span></label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      formControlName="dateOfBirth"
                      class="form-control"
                    />
                  </div>

                  <!-- Giới tính -->
                  <div class="form-group">
                    <label class="form-label" for="gender">Giới tính <span class="req">*</span></label>
                    <select id="gender" formControlName="gender" class="form-control">
                      <option value="NAM">Nam</option>
                      <option value="NU">Nữ</option>
                      <option value="KHAC">Khác</option>
                    </select>
                  </div>

                  <!-- Số điện thoại -->
                  <div class="form-group">
                    <label class="form-label" for="phone">
                      Số điện thoại di động <span class="req">*</span>
                    </label>
                    <div class="input-with-icon">
                      <span class="input-icon-prefix">+84</span>
                      <input
                        id="phone"
                        type="tel"
                        formControlName="phone"
                        class="form-control with-prefix"
                        placeholder="0977889900"
                      />
                    </div>
                    @if (generalForm.get('phone')?.touched && generalForm.get('phone')?.invalid) {
                      <span class="field-error">Số điện thoại không đúng định dạng di động Việt Nam</span>
                    }
                  </div>

                  <!-- Email -->
                  <div class="form-group">
                    <label class="form-label" for="email">
                      Địa chỉ email <span class="req">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      formControlName="email"
                      class="form-control"
                      placeholder="vidu@domain.vn"
                    />
                    @if (generalForm.get('email')?.touched && generalForm.get('email')?.invalid) {
                      <span class="field-error">Địa chỉ email không đúng định dạng hợp lệ</span>
                    }
                  </div>

                  <!-- Số CCCD / CMND -->
                  <div class="form-group">
                    <label class="form-label" for="identityCardNumber">
                      Số CCCD / Định danh cá nhân (12 số) <span class="req">*</span>
                    </label>
                    <input
                      id="identityCardNumber"
                      type="text"
                      formControlName="identityCardNumber"
                      class="form-control"
                      placeholder="079090001234"
                      maxlength="12"
                    />
                  </div>

                  <!-- Số thẻ BHYT -->
                  <div class="form-group">
                    <label class="form-label" for="healthInsuranceNumber">
                      Số thẻ Bảo hiểm y tế (BHYT)
                    </label>
                    <input
                      id="healthInsuranceNumber"
                      type="text"
                      formControlName="healthInsuranceNumber"
                      class="form-control"
                      placeholder="GD4797931234567"
                    />
                  </div>

                  <!-- Địa chỉ cư trú -->
                  <div class="form-group col-span-2">
                    <label class="form-label" for="address">
                      Địa chỉ thường trú / Nơi ở hiện tại <span class="req">*</span>
                    </label>
                    <textarea
                      id="address"
                      formControlName="address"
                      rows="2"
                      class="form-control textarea"
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    ></textarea>
                  </div>
                </div>

                <div class="form-actions-bar">
                  <button
                    type="submit"
                    class="btn-save-primary"
                    [disabled]="generalForm.invalid || isSaving()"
                  >
                    @if (isSaving()) {
                      <span class="btn-spinner"></span>
                      <span>Đang lưu thông tin...</span>
                    } @else {
                      <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
                      <span>Lưu thay đổi hành chính</span>
                    }
                  </button>
                  <button type="button" class="btn-reset-secondary" (click)="resetGeneralForm()">
                    Khôi phục ban đầu
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- TAB 2: HỒ SƠ Y TẾ & DỊ ỨNG -->
          @if (activeTab() === 'medical') {
            <div class="tab-section animate-fade-in">
              <div class="section-top-bar">
                <div>
                  <h2 class="section-heading font-serif">Hồ sơ sức khỏe & Tiền sử dị ứng</h2>
                  <p class="section-sub">
                    Thông tin y khoa quan trọng phục vụ bác sĩ trong việc cảnh báo tương tác thuốc DDI và sơ cứu khẩn cấp
                  </p>
                </div>
              </div>

              <!-- DDI & Allergy Medical Notice Box -->
              <div class="medical-alert-banner">
                <div class="alert-icon-wrap">
                  <app-clinic-icon name="alert-triangle" [size]="20" color="#9B3D45"></app-clinic-icon>
                </div>
                <div class="alert-text-wrap">
                  <span class="alert-title">LƯU Ý ĐẶC BIỆT VỀ TIỀN SỬ DỊ ỨNG (BR-03 / DDI)</span>
                  <p class="alert-p">
                    Khi ghi nhận tiền sử dị ứng thuốc (như Penicillin, Cephalosporin, Aspirin...), hệ thống tự động
                    kết nối cơ sở tri thức để cảnh báo xung đột (DDI) ngay tại màn hình kê đơn của bác sĩ khám.
                  </p>
                </div>
              </div>

              <form [formGroup]="medicalForm" (ngSubmit)="saveMedicalInfo()" class="profile-form">
                <div class="form-row-grid">
                  <!-- Nhóm máu -->
                  <div class="form-group">
                    <label class="form-label" for="bloodType">Nhóm máu hệ ABO & Rh</label>
                    <select id="bloodType" formControlName="bloodType" class="form-control">
                      <option value="O+">O+ (Rh Dương)</option>
                      <option value="O-">O- (Rh Âm)</option>
                      <option value="A+">A+ (Rh Dương)</option>
                      <option value="A-">A- (Rh Âm)</option>
                      <option value="B+">B+ (Rh Dương)</option>
                      <option value="B-">B- (Rh Âm)</option>
                      <option value="AB+">AB+ (Rh Dương)</option>
                      <option value="AB-">AB- (Rh Âm)</option>
                    </select>
                  </div>

                  <!-- Tình trạng định danh y tế -->
                  <div class="form-group">
                    <label class="form-label">Tình trạng hồ sơ EMR</label>
                    <div class="readonly-badge-input">
                      <app-clinic-icon name="shield-check" [size]="14" color="#0E4A55"></app-clinic-icon>
                      <span>Hồ sơ EMR hoạt động • Sẵn sàng tiếp nhận</span>
                    </div>
                  </div>

                  <!-- Tiền sử dị ứng thuốc & thực phẩm -->
                  <div class="form-group col-span-2">
                    <label class="form-label" for="allergies">
                      Tiền sử dị ứng thuốc & Thực phẩm (Nếu có)
                    </label>
                    <textarea
                      id="allergies"
                      formControlName="allergies"
                      rows="2"
                      class="form-control textarea allergy-input"
                      placeholder="Ví dụ: Dị ứng Penicillin, Hải sản (Tôm, Cua), Sulfamid..."
                    ></textarea>
                    <span class="field-hint">Ghi rõ tên nhóm thuốc hoặc thực phẩm từng gây mẩn đỏ, khó thở, sốc phản vệ</span>
                  </div>

                  <!-- Tiền sử bệnh lý nền & gia đình -->
                  <div class="form-group col-span-2">
                    <label class="form-label" for="medicalNotes">
                      Tiền sử bệnh lý bản thân & Gia đình
                    </label>
                    <textarea
                      id="medicalNotes"
                      formControlName="medicalNotes"
                      rows="2"
                      class="form-control textarea"
                      placeholder="Ví dụ: Tăng huyết áp nhẹ, Đái tháo đường type 2, Hen suyễn..."
                    ></textarea>
                  </div>
                </div>

                <!-- Emergency Contact Block -->
                <div class="emergency-contact-box">
                  <div class="em-header">
                    <div class="em-icon">
                      <app-clinic-icon name="phone" [size]="16" color="#0E4A55"></app-clinic-icon>
                    </div>
                    <div>
                      <h3 class="em-title">Thông tin người liên hệ khẩn cấp (Emergency Contact)</h3>
                      <p class="em-desc">Phòng khám sẽ liên lạc với người thân trong trường hợp khẩn cấp y tế</p>
                    </div>
                  </div>

                  <div class="form-row-grid">
                    <div class="form-group">
                      <label class="form-label" for="emergencyContactName">Họ tên người thân</label>
                      <input
                        id="emergencyContactName"
                        type="text"
                        formControlName="emergencyContactName"
                        class="form-control"
                        placeholder="Nguyễn Thị B (Vợ / Chồng / Bố mẹ)"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="emergencyContactPhone">Số điện thoại người thân</label>
                      <input
                        id="emergencyContactPhone"
                        type="tel"
                        formControlName="emergencyContactPhone"
                        class="form-control"
                        placeholder="0988112233"
                      />
                    </div>
                  </div>
                </div>

                <div class="form-actions-bar">
                  <button
                    type="submit"
                    class="btn-save-primary"
                    [disabled]="medicalForm.invalid || isSaving()"
                  >
                    @if (isSaving()) {
                      <span class="btn-spinner"></span>
                      <span>Đang lưu thông tin...</span>
                    } @else {
                      <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
                      <span>Lưu hồ sơ y tế & cấp cứu</span>
                    }
                  </button>
                  <button type="button" class="btn-reset-secondary" (click)="resetMedicalForm()">
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- TAB 3: TÀI KHOẢN & BẢO MẬT (UC01 - ĐỔI MẬT KHẨU) -->
          @if (activeTab() === 'security') {
            <div class="tab-section animate-fade-in">
              <div class="section-top-bar">
                <div>
                  <h2 class="section-heading font-serif">Bảo mật tài khoản & Đổi mật khẩu</h2>
                  <p class="section-sub">
                    Thực hiện nghiệp vụ UC01 (Bước 4): Đổi mật khẩu bảo mật và kiểm tra quy tắc an toàn (SRS BR 4.1 & BR 4.2)
                  </p>
                </div>
              </div>

              <div class="security-rules-card">
                <span class="rules-card-title">Quy định bảo mật mật khẩu Smart Clinic:</span>
                <ul class="rules-list">
                  <li>
                    <app-clinic-icon name="check" [size]="13" color="#5E8B7E"></app-clinic-icon>
                    Mật khẩu mới tối thiểu 6 ký tự để đảm bảo an toàn truy cập dữ liệu bệnh án.
                  </li>
                  <li>
                    <app-clinic-icon name="check" [size]="13" color="#5E8B7E"></app-clinic-icon>
                    Mật khẩu mới không được trùng với mật khẩu hiện tại (BR 4.2).
                  </li>
                  <li>
                    <app-clinic-icon name="check" [size]="13" color="#5E8B7E"></app-clinic-icon>
                    Hệ thống tự động kiểm tra chính xác mật khẩu cũ trước khi cập nhật (BR 4.1).
                  </li>
                </ul>
              </div>

              <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="profile-form max-w-lg">
                <!-- Mật khẩu hiện tại -->
                <div class="form-group">
                  <label class="form-label" for="currentPassword">
                    Mật khẩu hiện tại <span class="req">*</span>
                  </label>
                  <div class="input-password-wrap">
                    <input
                      id="currentPassword"
                      [type]="showCurrentPass() ? 'text' : 'password'"
                      formControlName="currentPassword"
                      class="form-control"
                      placeholder="Nhập mật khẩu đang sử dụng"
                    />
                    <button
                      type="button"
                      class="pass-toggle-btn"
                      (click)="showCurrentPass.set(!showCurrentPass())"
                    >
                      <app-clinic-icon [name]="showCurrentPass() ? 'unlock' : 'lock'" [size]="15"></app-clinic-icon>
                    </button>
                  </div>
                </div>

                <!-- Mật khẩu mới -->
                <div class="form-group">
                  <label class="form-label" for="newPassword">
                    Mật khẩu mới (Tối thiểu 6 ký tự) <span class="req">*</span>
                  </label>
                  <div class="input-password-wrap">
                    <input
                      id="newPassword"
                      [type]="showNewPass() ? 'text' : 'password'"
                      formControlName="newPassword"
                      class="form-control"
                      placeholder="Nhập mật khẩu mới"
                    />
                    <button
                      type="button"
                      class="pass-toggle-btn"
                      (click)="showNewPass.set(!showNewPass())"
                    >
                      <app-clinic-icon [name]="showNewPass() ? 'unlock' : 'lock'" [size]="15"></app-clinic-icon>
                    </button>
                  </div>
                  @if (passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.invalid) {
                    <span class="field-error">Mật khẩu mới phải có tối thiểu 6 ký tự</span>
                  }
                </div>

                <!-- Xác nhận mật khẩu mới -->
                <div class="form-group">
                  <label class="form-label" for="confirmPassword">
                    Xác nhận mật khẩu mới <span class="req">*</span>
                  </label>
                  <div class="input-password-wrap">
                    <input
                      id="confirmPassword"
                      [type]="showConfirmPass() ? 'text' : 'password'"
                      formControlName="confirmPassword"
                      class="form-control"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      class="pass-toggle-btn"
                      (click)="showConfirmPass.set(!showConfirmPass())"
                    >
                      <app-clinic-icon [name]="showConfirmPass() ? 'unlock' : 'lock'" [size]="15"></app-clinic-icon>
                    </button>
                  </div>
                </div>

                <div class="form-actions-bar">
                  <button
                    type="submit"
                    class="btn-save-primary"
                    [disabled]="passwordForm.invalid || isChangingPass()"
                  >
                    @if (isChangingPass()) {
                      <span class="btn-spinner"></span>
                      <span>Đang cập nhật mật khẩu...</span>
                    } @else {
                      <app-clinic-icon name="lock" [size]="16"></app-clinic-icon>
                      <span>Cập nhật mật khẩu mới</span>
                    }
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- TAB 4: THẺ KHÁM BỆNH ĐIỆN TỬ (SMART HEALTH CARD) -->
          @if (activeTab() === 'ecard') {
            <div class="tab-section animate-fade-in">
              <div class="section-top-bar">
                <div>
                  <h2 class="section-heading font-serif">Thẻ khám bệnh điện tử & Đặc quyền VIP</h2>
                  <p class="section-sub">
                    Quý khách có thể xuất trình thẻ điện tử này tại cây Kiosk tự động để lấy số thứ tự ưu tiên ngay khi đến phòng khám
                  </p>
                </div>
              </div>

              <!-- Luxury Smart Health Card Component -->
              <div class="ecard-showcase-container">
                <div class="smart-health-card">
                  <div class="card-chip-line">
                    <div class="clinic-brand-mark">
                      <div class="plus-icon-box">+</div>
                      <div class="clinic-text-box">
                        <span class="b-main">SMART CLINIC</span>
                        <span class="b-sub">ELECTRONIC HEALTH CARD</span>
                      </div>
                    </div>
                    <div class="vip-emblem">
                      <span class="emblem-star">★</span>
                      <span class="emblem-txt">VIP MEMBER</span>
                    </div>
                  </div>

                  <div class="card-chip-graphic">
                    <div class="chip-shape"></div>
                    <div class="contactless-waves">
                      <span>)</span><span>)</span><span>)</span>
                    </div>
                  </div>

                  <div class="card-patient-info">
                    <span class="card-label">BỆNH NHÂN / PATIENT</span>
                    <h3 class="card-name">{{ profile()?.fullName?.toUpperCase() }}</h3>
                  </div>

                  <div class="card-bottom-row">
                    <div class="card-col">
                      <span class="card-label">MÃ BỆNH NHÂN</span>
                      <span class="card-val font-mono">{{ profile()?.patientCode }}</span>
                    </div>
                    <div class="card-col">
                      <span class="card-label">CCCD / ĐỊNH DANH</span>
                      <span class="card-val font-mono">{{ profile()?.identityCardNumber }}</span>
                    </div>
                    <div class="card-col">
                      <span class="card-label">NHÓM MÁU</span>
                      <span class="card-val blood-tag">{{ profile()?.bloodType || 'O+' }}</span>
                    </div>
                    <div class="card-col card-qr-col">
                      <!-- Mock QR Code Box -->
                      <div class="mock-qr-code" title="Mã QR định danh tiếp đón">
                        <div class="qr-matrix"></div>
                        <span class="qr-code-txt">SCAN ME</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Membership Perks Box -->
                <div class="perks-panel clinic-card">
                  <h3 class="perks-title font-serif">
                    <app-clinic-icon name="sparkle" [size]="16" color="#B8955A"></app-clinic-icon>
                    Đặc quyền Hạng Vàng VIP
                  </h3>
                  <div class="perks-grid">
                    <div class="perk-item">
                      <div class="perk-icon">⚡</div>
                      <div>
                        <strong>Ưu tiên số thứ tự:</strong>
                        <p>Được đưa vào luồng ưu tiên hàng đợi tiếp đón và buồng khám bác sĩ chuyên khoa.</p>
                      </div>
                    </div>
                    <div class="perk-item">
                      <div class="perk-icon">🏷️</div>
                      <div>
                        <strong>Ưu đãi 15% viện phí:</strong>
                        <p>Áp dụng tự động trên toàn bộ hóa đơn tiền khám và các dịch vụ cận lâm sàng.</p>
                      </div>
                    </div>
                    <div class="perk-item">
                      <div class="perk-icon">📱</div>
                      <div>
                        <strong>Nhắc lịch tái khám tự động:</strong>
                        <p>Thông báo kết quả xét nghiệm và lịch hẹn qua Zalo & SMS cá nhân 24h trước giờ khám.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </main>
      </div>

      <!-- Avatar Picker Modal -->
      @if (showAvatarModal()) {
        <div class="modal-backdrop" (click)="toggleAvatarModal()">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title font-serif">Chọn ảnh đại diện mới</h3>
              <button class="modal-close-btn" (click)="toggleAvatarModal()">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-intro">Chọn một trong các ảnh chân dung chuẩn hoặc nhập đường dẫn ảnh:</p>
              <div class="preset-avatars-grid">
                @for (av of presetAvatars; track av) {
                  <button
                    type="button"
                    class="avatar-option-btn"
                    [class.selected]="selectedAvatarUrl() === av"
                    (click)="selectedAvatarUrl.set(av)"
                  >
                    <img [src]="av" alt="Avatar option" class="avatar-option-img" />
                  </button>
                }
              </div>
              <div class="custom-url-group">
                <label class="form-label">Hoặc nhập URL ảnh trực tiếp:</label>
                <input
                  type="text"
                  [value]="selectedAvatarUrl()"
                  (input)="onCustomAvatarInput($event)"
                  class="form-control"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-save-primary" (click)="saveAvatar()">
                <app-clinic-icon name="check" [size]="15"></app-clinic-icon>
                <span>Xác nhận cập nhật</span>
              </button>
              <button type="button" class="btn-reset-secondary" (click)="toggleAvatarModal()">
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .patient-profile-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding-bottom: 3rem;
      }

      /* Breadcrumb */
      .profile-breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #64748b;
      }
      .bc-link {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: #0E4A55;
        font-weight: 500;
        text-decoration: none;
        transition: color 0.15s ease;
      }
      .bc-link:hover {
        color: #5E8B7E;
      }
      .bc-sep {
        color: #cbd5e1;
      }
      .bc-current {
        font-weight: 600;
        color: #1e293b;
      }

      /* Hero Card */
      .profile-hero-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
        padding: 1.75rem 2rem;
        background: linear-gradient(135deg, #ffffff 0%, #FAF8F5 100%);
        border: 1px solid #E4DFD5;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(14, 74, 85, 0.05);
      }
      .hero-left {
        display: flex;
        align-items: center;
        gap: 1.75rem;
      }
      .avatar-wrapper {
        position: relative;
        flex-shrink: 0;
      }
      .avatar-img {
        width: 92px;
        height: 92px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #FAF8F5;
        box-shadow: 0 4px 14px rgba(14, 74, 85, 0.18);
      }
      .avatar-edit-btn {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: #0E4A55;
        color: #ffffff;
        border: 2px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        transition: transform 0.15s ease, background-color 0.15s ease;
      }
      .avatar-edit-btn:hover {
        background-color: #5E8B7E;
        transform: scale(1.1);
      }

      .user-meta {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .name-tier-row {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        flex-wrap: wrap;
      }
      .user-full-name {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #0E4A55;
        line-height: 1.2;
      }
      .vip-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.3rem 0.75rem;
        background: #FDF8ED;
        color: #926C2A;
        border: 1px solid #E8D3A7;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }
      .sub-meta-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .meta-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.82rem;
        color: #475569;
        background-color: #f1f5f9;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
      }
      .code-tag {
        background-color: #EBF3F4;
        color: #0E4A55;
        font-weight: 600;
      }
      .verify-tag {
        background-color: #E8F5E9;
        color: #1b5e20;
        font-weight: 600;
      }

      .hero-quick-stats {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .stat-mini-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 1.25rem;
        background: #ffffff;
        border: 1px solid #E4DFD5;
        border-radius: 12px;
        min-width: 105px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      }
      .stat-val {
        font-size: 1.5rem;
        font-weight: 800;
        color: #0E4A55;
        line-height: 1.1;
      }
      .blood-val {
        color: #9B3D45;
      }
      .tier-val {
        color: #B8955A;
      }
      .stat-lbl {
        font-size: 0.72rem;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        margin-top: 0.25rem;
      }

      /* Toast Feedback */
      .feedback-toast {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.9rem 1.25rem;
        background-color: #ECFDF5;
        color: #065F46;
        border: 1px solid #A7F3D0;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(6, 95, 70, 0.08);
      }
      .feedback-toast.error {
        background-color: #FEF2F2;
        color: #991B1B;
        border-color: #FECACA;
        box-shadow: 0 4px 12px rgba(153, 27, 27, 0.08);
      }
      .toast-close-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: currentColor;
        font-size: 1.1rem;
        cursor: pointer;
        opacity: 0.6;
      }
      .toast-close-btn:hover {
        opacity: 1;
      }

      /* Main Grid Layout */
      .profile-layout-grid {
        display: grid;
        grid-template-columns: 310px 1fr;
        gap: 1.5rem;
        align-items: start;
      }

      /* Sidebar Navigation */
      .profile-tabs-sidebar {
        padding: 1.25rem;
        background: #ffffff;
        border: 1px solid #E4DFD5;
        border-radius: 14px;
      }
      .sidebar-header {
        padding: 0.5rem 0.5rem 0.85rem;
        border-bottom: 1px solid #f1f5f9;
        margin-bottom: 0.5rem;
      }
      .sb-title {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #94a3b8;
        text-transform: uppercase;
      }
      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .tab-btn {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.85rem 1rem;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 10px;
        text-align: left;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
        width: 100%;

        * {
          pointer-events: none;
        }
      }
      .tab-btn:hover {
        background-color: #F8FAFC;
      }
      .tab-btn.active {
        background-color: #EBF3F4;
        border-color: #C5DFE2;
      }
      .tab-icon-box {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background-color: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
      .tab-btn.active .tab-icon-box {
        background-color: #0E4A55;
        color: #ffffff;
      }
      .tab-btn-text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        overflow: hidden;
      }
      .tab-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: #1e293b;
      }
      .tab-btn.active .tab-title {
        color: #0E4A55;
      }
      .tab-desc {
        font-size: 0.75rem;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tab-indicator {
        position: absolute;
        right: 0;
        top: 25%;
        bottom: 25%;
        width: 3px;
        background-color: #0E4A55;
        border-radius: 4px 0 0 4px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .tab-btn.active .tab-indicator {
        opacity: 1;
      }
      .sidebar-footer-tip {
        margin-top: 1.5rem;
        padding: 1rem;
        background-color: #F7FAF8;
        border: 1px dashed #C8E0D8;
        border-radius: 10px;
        display: flex;
        gap: 0.65rem;
        font-size: 0.78rem;
        color: #475569;
        line-height: 1.45;
      }

      /* Main Content Pane */
      .profile-content-pane {
        padding: 2rem 2.25rem;
        background: #ffffff;
        border: 1px solid #E4DFD5;
        border-radius: 16px;
        min-height: 540px;
      }
      .section-top-bar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1.5rem;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid #f1f5f9;
        margin-bottom: 1.5rem;
      }
      .section-heading {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
        color: #0E4A55;
      }
      .section-sub {
        margin: 0.35rem 0 0;
        font-size: 0.85rem;
        color: #64748b;
        line-height: 1.4;
      }
      .last-updated-badge {
        font-size: 0.75rem;
        color: #64748b;
        background-color: #f1f5f9;
        padding: 0.3rem 0.65rem;
        border-radius: 6px;
        white-space: nowrap;
      }

      /* Form Styles */
      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .form-row-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem 1.5rem;
      }
      .col-span-2 {
        grid-column: span 2;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .form-label {
        font-size: 0.84rem;
        font-weight: 600;
        color: #334155;
      }
      .req {
        color: #dc2626;
      }
      .form-control {
        width: 100%;
        padding: 0.65rem 0.85rem;
        font-size: 0.9rem;
        color: #1e293b;
        background-color: #ffffff;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .form-control:focus {
        border-color: #0E4A55;
        box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.1);
      }
      .form-control.textarea {
        resize: vertical;
        font-family: inherit;
      }
      .allergy-input {
        border-color: #F87171;
        background-color: #FFFDFD;
      }
      .allergy-input:focus {
        border-color: #9B3D45;
        box-shadow: 0 0 0 3px rgba(155, 61, 69, 0.12);
      }
      .readonly-badge-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 0.85rem;
        background-color: #F8FAFC;
        border: 1.5px dashed #cbd5e1;
        border-radius: 8px;
        font-size: 0.88rem;
        color: #475569;
        font-weight: 600;
      }
      .input-with-icon {
        display: flex;
        align-items: stretch;
      }
      .input-icon-prefix {
        display: flex;
        align-items: center;
        padding: 0 0.75rem;
        background-color: #f1f5f9;
        border: 1.5px solid #cbd5e1;
        border-right: none;
        border-radius: 8px 0 0 8px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
      }
      .form-control.with-prefix {
        border-radius: 0 8px 8px 0;
      }
      .field-error {
        font-size: 0.75rem;
        color: #dc2626;
        font-weight: 500;
      }
      .field-hint {
        font-size: 0.75rem;
        color: #64748b;
      }

      /* Alert Banner */
      .medical-alert-banner {
        display: flex;
        gap: 1rem;
        padding: 1.1rem 1.35rem;
        background: #FDF4F4;
        border: 1px solid #F5C6C6;
        border-left: 4px solid #9B3D45;
        border-radius: 10px;
        margin-bottom: 1.5rem;
      }
      .alert-icon-wrap {
        flex-shrink: 0;
        margin-top: 0.1rem;
      }
      .alert-title {
        display: block;
        font-size: 0.82rem;
        font-weight: 700;
        color: #9B3D45;
        letter-spacing: 0.04em;
      }
      .alert-p {
        margin: 0.25rem 0 0;
        font-size: 0.84rem;
        color: #601A24;
        line-height: 1.45;
      }

      /* Emergency Contact Block */
      .emergency-contact-box {
        padding: 1.25rem;
        background-color: #FAF8F5;
        border: 1px solid #E8E2D7;
        border-radius: 12px;
      }
      .em-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .em-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background-color: #EBF3F4;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .em-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: #0E4A55;
      }
      .em-desc {
        margin: 0.15rem 0 0;
        font-size: 0.78rem;
        color: #64748b;
      }

      /* Action Buttons */
      .form-actions-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;
      }
      .btn-save-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #0E4A55 0%, #156270 100%);
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(14, 74, 85, 0.2);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .btn-save-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(14, 74, 85, 0.3);
      }
      .btn-save-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-reset-secondary {
        padding: 0.75rem 1.25rem;
        background: #ffffff;
        color: #475569;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .btn-reset-secondary:hover {
        background-color: #f1f5f9;
      }
      .btn-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      /* Security Rules Card */
      .security-rules-card {
        padding: 1rem 1.25rem;
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        margin-bottom: 1.5rem;
      }
      .rules-card-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #0E4A55;
      }
      .rules-list {
        margin: 0.5rem 0 0;
        padding-left: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .rules-list li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.82rem;
        color: #475569;
      }
      .max-w-lg {
        max-width: 520px;
      }
      .input-password-wrap {
        position: relative;
      }
      .pass-toggle-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
      }
      .pass-toggle-btn:hover {
        color: #0E4A55;
      }

      /* E-Card Luxury Styling */
      .ecard-showcase-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        align-items: center;
      }
      .smart-health-card {
        width: 100%;
        max-width: 540px;
        height: 290px;
        background: linear-gradient(135deg, #093740 0%, #0E4A55 50%, #175765 100%);
        border-radius: 20px;
        padding: 1.75rem 2rem;
        color: #ffffff;
        box-shadow: 0 16px 36px rgba(14, 74, 85, 0.35);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      .smart-health-card::before {
        content: '';
        position: absolute;
        top: -60px;
        right: -60px;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(184, 149, 90, 0.25) 0%, transparent 70%);
        pointer-events: none;
      }
      .card-chip-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .clinic-brand-mark {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .plus-icon-box {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #B8955A;
        color: #093740;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 1.25rem;
      }
      .clinic-text-box {
        display: flex;
        flex-direction: column;
      }
      .b-main {
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
      .b-sub {
        font-size: 0.65rem;
        letter-spacing: 0.12em;
        opacity: 0.75;
      }
      .vip-emblem {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.3rem 0.75rem;
        background: rgba(184, 149, 90, 0.2);
        border: 1px solid #B8955A;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        color: #E2CA9E;
        letter-spacing: 0.06em;
      }
      .emblem-star {
        color: #FACC15;
      }
      .card-chip-graphic {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .chip-shape {
        width: 44px;
        height: 34px;
        background: linear-gradient(135deg, #d4af37 0%, #f6e07a 50%, #aa820a 100%);
        border-radius: 6px;
        box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
      }
      .contactless-waves {
        font-size: 1.25rem;
        letter-spacing: -2px;
        opacity: 0.6;
        font-weight: 300;
      }
      .card-patient-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .card-name {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #FFFFFF !important;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      }
      .card-bottom-row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
      }
      .card-col {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .card-label {
        font-size: 0.62rem;
        letter-spacing: 0.08em;
        color: rgba(255, 255, 255, 0.75) !important;
        font-weight: 600;
      }
      .card-val {
        font-size: 0.95rem;
        font-weight: 600;
        color: #FFFFFF !important;
      }
      .blood-tag {
        color: #FCA5A5;
        font-weight: 800;
      }
      .card-qr-col {
        align-items: center;
      }
      .mock-qr-code {
        width: 52px;
        height: 52px;
        background: #ffffff;
        border-radius: 6px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
      }
      .qr-matrix {
        width: 32px;
        height: 32px;
        background-image: radial-gradient(#0E4A55 40%, transparent 40%),
          radial-gradient(#0E4A55 40%, transparent 40%);
        background-size: 8px 8px;
        background-position: 0 0, 4px 4px;
      }
      .qr-code-txt {
        font-size: 0.5rem;
        color: #0E4A55;
        font-weight: 800;
      }

      /* Perks Panel */
      .perks-panel {
        width: 100%;
        max-width: 540px;
        padding: 1.5rem;
        background: #ffffff;
        border: 1px solid #E4DFD5;
        border-radius: 14px;
      }
      .perks-title {
        margin: 0 0 1rem;
        font-size: 1.1rem;
        color: #0E4A55;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .perks-grid {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .perk-item {
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        font-size: 0.85rem;
        color: #334155;
        line-height: 1.4;
      }
      .perk-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      /* Avatar Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1050;
      }
      .modal-box {
        width: 90%;
        max-width: 480px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        animation: scaleUp 0.2s ease-out;
      }
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f1f5f9;
      }
      .modal-title {
        margin: 0;
        font-size: 1.2rem;
        color: #0E4A55;
      }
      .modal-close-btn {
        background: none;
        border: none;
        font-size: 1.1rem;
        color: #64748b;
        cursor: pointer;
      }
      .modal-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .modal-intro {
        margin: 0;
        font-size: 0.85rem;
        color: #64748b;
      }
      .preset-avatars-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.85rem;
      }
      .avatar-option-btn {
        background: none;
        border: 3px solid transparent;
        border-radius: 50%;
        padding: 2px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .avatar-option-btn:hover {
        transform: scale(1.05);
      }
      .avatar-option-btn.selected {
        border-color: #0E4A55;
        box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.2);
      }
      .avatar-option-img {
        width: 68px;
        height: 68px;
        border-radius: 50%;
        object-fit: cover;
      }
      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        background-color: #F8FAFC;
        border-top: 1px solid #f1f5f9;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes scaleUp {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

      @media (max-width: 900px) {
        .profile-layout-grid {
          grid-template-columns: 1fr;
        }
        .profile-hero-card {
          flex-direction: column;
          align-items: flex-start;
        }
        .hero-quick-stats {
          width: 100%;
          justify-content: space-between;
        }
        .form-row-grid {
          grid-template-columns: 1fr;
        }
        .col-span-2 {
          grid-column: span 1;
        }
      }
    `,
  ],
})
export class PatientProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(UserProfileService);
  private route = inject(ActivatedRoute);

  public readonly profile = this.profileService.profile;
  public readonly activeTab = signal<ProfileTab>('general');
  public readonly isSaving = signal<boolean>(false);
  public readonly isChangingPass = signal<boolean>(false);
  public readonly feedbackMsg = signal<string>('');
  public readonly feedbackType = signal<'success' | 'error'>('success');

  public readonly showCurrentPass = signal<boolean>(false);
  public readonly showNewPass = signal<boolean>(false);
  public readonly showConfirmPass = signal<boolean>(false);

  public readonly showAvatarModal = signal<boolean>(false);
  public readonly selectedAvatarUrl = signal<string>('');

  public readonly presetAvatars: string[] = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  ];

  public generalForm!: FormGroup;
  public medicalForm!: FormGroup;
  public passwordForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.populateForms();
    this.selectedAvatarUrl.set(this.profile()?.avatarUrl || this.presetAvatars[0]);

    this.route.queryParams.subscribe((params) => {
      if (params['tab'] && ['general', 'medical', 'security', 'ecard'].includes(params['tab'])) {
        this.activeTab.set(params['tab'] as ProfileTab);
      }
    });
  }

  private initForms(): void {
    this.generalForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      dateOfBirth: ['', Validators.required],
      gender: ['NAM', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^(0|84)(3|5|7|8|9)[0-9]{8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      identityCardNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,12}$/)]],
      healthInsuranceNumber: [''],
      address: ['', Validators.required],
    });

    this.medicalForm = this.fb.group({
      bloodType: ['O+'],
      allergies: [''],
      medicalNotes: [''],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  private populateForms(): void {
    const p = this.profile();
    if (!p) return;

    this.generalForm.patchValue({
      fullName: p.fullName || '',
      dateOfBirth: p.dateOfBirth || '',
      gender: p.gender || 'NAM',
      phone: p.phone ? p.phone.replace(/\s+/g, '') : '',
      email: p.email || '',
      identityCardNumber: p.identityCardNumber || '',
      healthInsuranceNumber: p.healthInsuranceNumber || '',
      address: p.address || '',
    });

    this.medicalForm.patchValue({
      bloodType: p.bloodType || 'O+',
      allergies: p.allergies || '',
      medicalNotes: p.medicalNotes || '',
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactPhone: p.emergencyContactPhone || '',
    });
  }

  setActiveTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    this.feedbackMsg.set('');
  }

  saveGeneralInfo(): void {
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.feedbackMsg.set('');

    const formVal = this.generalForm.value;
    const current = this.profile();

    this.profileService
      .updateProfile({
        ...formVal,
        bloodType: current.bloodType,
        allergies: current.allergies,
        medicalNotes: current.medicalNotes,
        emergencyContactName: current.emergencyContactName,
        emergencyContactPhone: current.emergencyContactPhone,
        avatarUrl: current.avatarUrl,
      })
      .subscribe({
        next: (saved) => {
          this.isSaving.set(false);
          this.showFeedback('Cập nhật thông tin hành chính thành công!', 'success');
        },
        error: (err) => {
          this.isSaving.set(false);
          this.showFeedback(err.message || 'Có lỗi xảy ra khi lưu thông tin.', 'error');
        },
      });
  }

  resetGeneralForm(): void {
    this.populateForms();
    this.feedbackMsg.set('');
  }

  saveMedicalInfo(): void {
    this.isSaving.set(true);
    this.feedbackMsg.set('');

    const formVal = this.medicalForm.value;
    const current = this.profile();

    this.profileService
      .updateProfile({
        fullName: current.fullName,
        dateOfBirth: current.dateOfBirth,
        gender: current.gender,
        phone: current.phone,
        email: current.email,
        address: current.address,
        identityCardNumber: current.identityCardNumber,
        healthInsuranceNumber: current.healthInsuranceNumber,
        bloodType: formVal.bloodType,
        allergies: formVal.allergies,
        medicalNotes: formVal.medicalNotes,
        emergencyContactName: formVal.emergencyContactName,
        emergencyContactPhone: formVal.emergencyContactPhone,
        avatarUrl: current.avatarUrl,
      })
      .subscribe({
        next: (saved) => {
          this.isSaving.set(false);
          this.showFeedback('Cập nhật hồ sơ y tế & tiền sử dị ứng thành công!', 'success');
        },
        error: (err) => {
          this.isSaving.set(false);
          this.showFeedback(err.message || 'Có lỗi xảy ra khi lưu thông tin y tế.', 'error');
        },
      });
  }

  resetMedicalForm(): void {
    this.populateForms();
    this.feedbackMsg.set('');
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.showFeedback('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.', 'error');
      return;
    }

    if (newPassword === currentPassword) {
      this.showFeedback('Mật khẩu mới không được trùng với mật khẩu hiện tại (BR 4.2).', 'error');
      return;
    }

    this.isChangingPass.set(true);
    this.feedbackMsg.set('');

    this.profileService
      .changePassword({ currentPassword, newPassword, confirmPassword })
      .subscribe({
        next: () => {
          this.isChangingPass.set(false);
          this.passwordForm.reset();
          this.showFeedback('Đổi mật khẩu bảo mật thành công!', 'success');
        },
        error: (err) => {
          this.isChangingPass.set(false);
          this.showFeedback(err.message || 'Mật khẩu hiện tại không chính xác.', 'error');
        },
      });
  }

  toggleAvatarModal(): void {
    this.showAvatarModal.set(!this.showAvatarModal());
    this.selectedAvatarUrl.set(this.profile()?.avatarUrl || this.presetAvatars[0]);
  }

  onCustomAvatarInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedAvatarUrl.set(input.value);
  }

  saveAvatar(): void {
    const url = this.selectedAvatarUrl();
    if (url) {
      this.profileService.updateAvatar(url).subscribe({
        next: () => {
          this.toggleAvatarModal();
          this.showFeedback('Cập nhật ảnh đại diện thành công!', 'success');
        },
      });
    }
  }

  private showFeedback(msg: string, type: 'success' | 'error'): void {
    this.feedbackMsg.set(msg);
    this.feedbackType.set(type);
    setTimeout(() => {
      if (this.feedbackMsg() === msg) {
        this.feedbackMsg.set('');
      }
    }, 4500);
  }
}
