import { Component, signal, computed, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';

export interface UpcomingTicket {
  ticketNumber: string;
  patientCodeHidden: string;
  estimatedTime: string;
  status: 'READY' | 'WAITING';
  waitOrder: number; // 1, 2, 3...
}

export interface ClinicRoomStation {
  id: string;
  roomCode: string;
  roomName: string;
  specialty: string;
  category: 'KHAM_BENH' | 'CAN_LAM_SANG';
  doctorName: string;
  location: string;
  seriesPrefix: string;
  currentTicket: string;
  status: 'CALLING' | 'SERVING';
  calledAt: string;
  totalWaitingCount: number;
  upcomingTickets: UpcomingTicket[];
}

@Component({
  selector: 'app-lobby-display',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ClinicIconComponent],
  template: `
    <div class="lobby-screen">
      <!-- Top Screen Bar -->
      <header class="lobby-header">
        <div class="header-brand">
          <span class="brand-plus">
            <app-clinic-icon name="medical-cross" [size]="24" color="#B8955A"></app-clinic-icon>
          </span>
          <div class="brand-info">
            <h1 class="brand-title font-serif">SMART CLINIC • HỆ THỐNG GỌI SỐ SẢNH CHỜ</h1>
            <span class="brand-subtitle">
              MÀN HÌNH ĐIỆN TỬ CÔNG CỘNG • ĐIỀU PHỐI RIÊNG BIỆT TỪNG PHÒNG KHÁM (KHÔNG GỘP SỐ)
            </span>
          </div>
        </div>

        <div class="header-right">
          <!-- Quick Ticket Lookup -->
          <div class="search-box">
            <app-clinic-icon name="search" [size]="15" color="#B8955A"></app-clinic-icon>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearchTicket($event)"
              placeholder="Tra cứu số thứ tự của bạn (VD: A012, B006...)"
              class="search-input"
            />
            @if (searchQuery()) {
              <button class="btn-clear-search" (click)="clearSearch()">×</button>
            }
          </div>

          <!-- Digital Clock -->
          <div class="digital-clock">
            <span class="clock-time font-bold">{{ currentTime() }}</span>
            <span class="clock-date">Thứ Ba, 06/10/2026</span>
          </div>

          <a routerLink="/" class="btn-return-home" title="Trở về trang chủ">
            <app-clinic-icon name="logout" [size]="14"></app-clinic-icon>
            <span>Trang chủ</span>
          </a>
        </div>
      </header>

      <!-- Search Result Alert (if search query matches) -->
      @if (searchResult(); as result) {
        <div class="search-result-banner animate-fade-in">
          <div class="result-badge">
            <app-clinic-icon name="check" [size]="16" color="#0E4A55"></app-clinic-icon>
            <span>KẾT QUẢ TRA CỨU: {{ result.ticket.ticketNumber }}</span>
          </div>
          <div class="result-text">
            Số của bạn thuộc về <strong>{{ result.room.roomName }} ({{ result.room.specialty }})</strong>.
            @if (result.ticket.status === 'READY') {
              <span class="status-urgent">⚡ Chuẩn bị vào buồng khám (Ước tính {{ result.ticket.estimatedTime }})</span>
            } @else {
              <span>Vị trí thứ {{ result.ticket.waitOrder }} trong hàng đợi • Ước tính lượt khám: {{ result.ticket.estimatedTime }}</span>
            }
          </div>
          <button class="btn-focus-room" (click)="selectRoom(result.room.id)">
            Xem phòng này
          </button>
        </div>
      }

      <!-- Main Stage: Big Calling Announcement for Selected Room -->
      @if (selectedRoom(); as room) {
        <div class="calling-hero-banner" [class.is-calling]="room.status === 'CALLING'">
          <div class="hero-top-bar">
            <div class="calling-tag">
              <span class="pulse-beacon"></span>
              <app-clinic-icon name="bell" [size]="18" color="#B8955A"></app-clinic-icon>
              <span>
                {{ room.status === 'CALLING' ? 'MỜI BỆNH NHÂN CÓ SỐ THỨ TỰ SAU VÀO PHÒNG KHÁM' : 'ĐANG KHÁM PHỤC VỤ TẠI BUỒNG' }}
              </span>
            </div>

            <!-- Auto-rotate Control -->
            <div class="hero-controls">
              <button
                type="button"
                class="btn-audio-call"
                (click)="playCallChime(room)"
                [class.chime-active]="isChiming()"
                title="Phát loa gọi số buồng khám này"
              >
                <app-clinic-icon name="bell" [size]="15" color="#E6CE9F"></app-clinic-icon>
                <span>Phát loa gọi số</span>
              </button>

              <div class="auto-rotate-pill" (click)="toggleAutoRotate()">
                <span class="dot-status" [class.on]="autoRotate()"></span>
                <span>Tự động chuyển phòng: {{ autoRotate() ? autoRotateCountdown() + 's' : 'Đã tạm dừng' }}</span>
              </div>
            </div>
          </div>

          <div class="hero-calling-row">
            <div class="hero-ticket-box">
              <div class="ticket-prefix-row">
                <span class="ticket-prefix">SỐ THỨ TỰ HIỆN TẠI</span>
                <span class="series-tag">Series {{ room.seriesPrefix }}</span>
              </div>
              <span class="hero-ticket-num font-serif font-bold">{{ room.currentTicket }}</span>
              <span class="called-time-label">Gọi lúc {{ room.calledAt }}</span>
            </div>

            <div class="hero-arrow">
              <app-clinic-icon name="arrow-right" [size]="36" color="#B8955A"></app-clinic-icon>
            </div>

            <div class="hero-room-box">
              <div class="room-top-tags">
                <span class="room-code-tag">{{ room.roomCode }}</span>
                <span class="room-status-badge" [class.calling]="room.status === 'CALLING'">
                  {{ room.status === 'CALLING' ? 'Đang gọi bệnh nhân' : 'Đang khám' }}
                </span>
              </div>
              <h2 class="hero-room-name font-bold">{{ room.roomName }}</h2>
              <div class="hero-room-meta">
                <span class="meta-specialty">{{ room.specialty }}</span>
                <span class="meta-divider">•</span>
                <span class="meta-doc">{{ room.doctorName }}</span>
                <span class="meta-divider">•</span>
                <span class="meta-loc">{{ room.location }}</span>
              </div>
            </div>
          </div>

          <!-- Subsequent / Upcoming Queue Numbers for This Room (Tách riêng theo nghiệp vụ) -->
          <div class="room-upcoming-strip">
            <div class="upcoming-header">
              <div class="upcoming-title-group">
                <app-clinic-icon name="clock" [size]="16" color="#B8955A"></app-clinic-icon>
                <span class="upcoming-title">
                  CÁC SỐ THỨ TỰ TIẾP THEO ĐANG CHỜ CỦA {{ room.roomName | uppercase }}:
                </span>
                <span class="waiting-count-badge">{{ room.totalWaitingCount }} người đang đợi lượt</span>
              </div>
              <span class="upcoming-hint">
                * Dãy số {{ room.seriesPrefix }}-xxx độc lập theo chuyên khoa, không gộp với phòng khác
              </span>
            </div>

            <div class="upcoming-tickets-grid">
              @for (ticket of room.upcomingTickets; track ticket.ticketNumber) {
                <div class="upcoming-ticket-card" [class.is-ready]="ticket.status === 'READY'">
                  <!-- Top Row: STT Badge & Estimated Time -->
                  <div class="u-card-top-row">
                    <span class="u-order-badge">LƯỢT #{{ ticket.waitOrder }}</span>
                    <span class="u-time-badge">
                      <app-clinic-icon name="clock" [size]="12" color="#FFDE82"></app-clinic-icon>
                      <span>Dự kiến {{ ticket.estimatedTime }}</span>
                    </span>
                  </div>

                  <!-- Middle: Big Radiant Number -->
                  <div class="u-card-num-box font-serif font-bold">
                    {{ ticket.ticketNumber }}
                  </div>

                  <!-- Status Banner -->
                  <div class="u-status-banner" [class.ready]="ticket.status === 'READY'">
                    @if (ticket.status === 'READY') {
                      <span class="pulse-sparkle">⚡</span>
                      <span class="status-label">Chuẩn bị vào buồng</span>
                    } @else {
                      <span class="status-dot"></span>
                      <span class="status-label">Đang chờ tại sảnh</span>
                    }
                  </div>

                  <!-- Bottom: Patient Anonymous Code -->
                  <div class="u-card-patient-row">
                    <span class="patient-lbl">Mã bệnh nhân:</span>
                    <span class="patient-val font-semibold">{{ ticket.patientCodeHidden }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Category Filter & Room Grid Section -->
      <div class="stations-section">
        <div class="stations-header-row">
          <div class="header-left-col">
            <h2 class="section-heading font-serif">DANH SÁCH CÁC PHÒNG KHÁM & BUỒNG CHUYÊN KHOA</h2>
            <p class="section-sub">
              Nhấp vào từng phòng bên dưới để xem chi tiết lượt số đang phục vụ và các số thứ tự tiếp theo của riêng phòng đó.
            </p>
          </div>

          <!-- Category filter buttons -->
          <div class="category-filter-pills">
            <button
              class="cat-pill"
              [class.active]="selectedCategory() === 'ALL'"
              (click)="setCategory('ALL')"
            >
              Tất cả buồng khám ({{ allStations.length }})
            </button>
            <button
              class="cat-pill"
              [class.active]="selectedCategory() === 'KHAM_BENH'"
              (click)="setCategory('KHAM_BENH')"
            >
              Khám Bác Sĩ (5)
            </button>
            <button
              class="cat-pill"
              [class.active]="selectedCategory() === 'CAN_LAM_SANG'"
              (click)="setCategory('CAN_LAM_SANG')"
            >
              Cận Lâm Sàng & Xét Nghiệm (3)
            </button>
          </div>
        </div>

        <!-- Room Cards Grid -->
        <div class="stations-grid">
          @for (station of filteredStations(); track station.id) {
            <div
              class="station-card"
              [class.is-selected]="selectedRoomId() === station.id"
              [class.is-calling]="station.status === 'CALLING'"
              (click)="selectRoom(station.id)"
            >
              <!-- Card Top -->
              <div class="card-room-header">
                <div class="card-title-group">
                  <span class="room-code-mini">{{ station.roomCode }}</span>
                  <span class="station-room-name">{{ station.roomName }}</span>
                </div>
                <span
                  class="station-status-pill"
                  [class.calling]="station.status === 'CALLING'"
                  [class.serving]="station.status === 'SERVING'"
                >
                  {{ station.status === 'CALLING' ? 'Đang gọi vào' : 'Đang khám' }}
                </span>
              </div>

              <!-- Specialty & Doctor -->
              <div class="station-sub-info">
                <span class="station-specialty font-semibold">{{ station.specialty }}</span>
                <span class="station-doc">{{ station.doctorName }}</span>
              </div>

              <!-- Serving Number Highlight -->
              <div class="station-ticket-display">
                <div class="stt-meta">
                  <span class="stt-label">Số đang phục vụ:</span>
                  <span class="stt-series">Series {{ station.seriesPrefix }}</span>
                </div>
                <span class="stt-val font-serif font-bold">{{ station.currentTicket }}</span>
              </div>

              <!-- Next Upcoming Numbers of this Room (Không gộp) -->
              <div class="card-upcoming-preview">
                <span class="preview-label">Số tiếp theo:</span>
                <div class="preview-pills">
                  @for (t of station.upcomingTickets.slice(0, 3); track t.ticketNumber) {
                    <span class="preview-pill" [class.ready]="t.status === 'READY'">
                      {{ t.ticketNumber }}
                    </span>
                  }
                  @if (station.upcomingTickets.length > 3) {
                    <span class="preview-pill more">+{{ station.upcomingTickets.length - 3 }}</span>
                  }
                </div>
              </div>

              <!-- Card Footer -->
              <div class="station-footer">
                <span class="waiting-total">
                  <app-clinic-icon name="users" [size]="13" color="#B8955A"></app-clinic-icon>
                  {{ station.totalWaitingCount }} người đang đợi
                </span>
                <span class="select-hint">
                  {{ selectedRoomId() === station.id ? '✓ Đang hiển thị chi tiết' : 'Bấm để xem số sau →' }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Privacy & Audio Disclaimer Footer -->
      <footer class="lobby-footer">
        <span class="footer-note">
          <app-clinic-icon name="shield" [size]="14" color="#5E8B7E"></app-clinic-icon>
          Bảo mật dữ liệu y tế: Màn hình sảnh chờ chỉ hiển thị số thứ tự và buồng khám, bảo vệ danh tính bệnh nhân.
        </span>
        <span class="footer-note">
          Hệ thống phát thanh gọi loa tự động theo từng buồng khám chuyên khoa
          <app-clinic-icon name="activity" [size]="14" color="#5E8B7E"></app-clinic-icon>
        </span>
      </footer>
    </div>
  `,
  styles: [
    `
      .lobby-screen {
        min-height: 100vh;
        background-color: #121A22;
        color: #FFFFFF;
        display: flex;
        flex-direction: column;
        padding: 24px 32px;
        box-sizing: border-box;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }

      .lobby-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        gap: 20px;
        flex-wrap: wrap;
      }

      .header-brand {
        display: flex;
        align-items: center;
        gap: 16px;

        .brand-plus {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #0E4A55;
          color: #B8955A;
          border: 1.5px solid #B8955A;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .brand-info {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-size: 1.35rem;
          color: #E6CE9F;
          letter-spacing: 0.04em;
          margin: 0;
        }

        .brand-subtitle {
          font-size: 0.73rem;
          color: rgba(255, 255, 255, 0.65);
          letter-spacing: 0.06em;
          margin-top: 2px;
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .search-box {
        position: relative;
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        padding: 0 12px;
        gap: 8px;
        transition: all 0.2s ease;

        &:focus-within {
          border-color: #B8955A;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 12px rgba(184, 149, 90, 0.25);
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #FFFFFF;
          font-size: 0.8125rem;
          width: 270px;
          height: 38px;

          &::placeholder {
            color: rgba(255, 255, 255, 0.45);
          }
        }

        .btn-clear-search {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;

          &:hover {
            color: #FFFFFF;
          }
        }
      }

      .digital-clock {
        display: flex;
        flex-direction: column;
        align-items: flex-end;

        .clock-time {
          font-size: 1.7rem;
          color: #FFFFFF;
          font-family: monospace;
          line-height: 1;
        }

        .clock-date {
          font-size: 0.78rem;
          color: #B8955A;
        }
      }

      .btn-return-home {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #FFFFFF;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.84rem;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: #B8955A;
        }
      }

      // Search Result Banner
      .search-result-banner {
        margin-top: 16px;
        background: linear-gradient(135deg, rgba(14, 74, 85, 0.9) 0%, rgba(28, 39, 51, 0.95) 100%);
        border: 1.5px solid #5E8B7E;
        border-radius: 12px;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

        .result-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #B8955A;
          color: #121A22;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .result-text {
          flex: 1;
          font-size: 0.88rem;
          color: #FFFFFF;

          strong {
            color: #E6CE9F;
          }

          .status-urgent {
            color: #FFDE82;
            font-weight: 700;
            margin-left: 8px;
          }
        }

        .btn-focus-room {
          background: #0E4A55;
          border: 1px solid #5E8B7E;
          color: #FFFFFF;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #14616f;
          }
        }
      }

      // Hero Calling Banner
      .calling-hero-banner {
        margin: 22px 0 26px 0;
        background: linear-gradient(135deg, rgba(14, 74, 85, 0.7) 0%, rgba(28, 39, 51, 0.95) 100%);
        border: 2px solid #B8955A;
        border-radius: 20px;
        padding: 24px 32px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(184, 149, 90, 0.12);
        display: flex;
        flex-direction: column;
        gap: 20px;
        transition: all 0.3s ease;

        &.is-calling {
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 24px rgba(184, 149, 90, 0.3);
        }
      }

      .hero-top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .calling-tag {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        font-weight: 700;
        color: #E6CE9F;
        letter-spacing: 0.05em;

        .pulse-beacon {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #B8955A;
          box-shadow: 0 0 12px #B8955A;
          animation: beaconPulse 1.5s infinite;
        }
      }

      @keyframes beaconPulse {
        0% {
          transform: scale(0.9);
          opacity: 1;
        }
        50% {
          transform: scale(1.4);
          opacity: 0.4;
        }
        100% {
          transform: scale(0.9);
          opacity: 1;
        }
      }

      .hero-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .btn-audio-call {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(184, 149, 90, 0.15);
        border: 1px solid rgba(184, 149, 90, 0.4);
        color: #E6CE9F;
        padding: 5px 12px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(184, 149, 90, 0.3);
          border-color: #B8955A;
        }

        &.chime-active {
          animation: chimePulse 0.6s infinite alternate;
          background: #B8955A;
          color: #121A22;
        }
      }

      @keyframes chimePulse {
        from {
          transform: scale(1);
        }
        to {
          transform: scale(1.05);
        }
      }

      .auto-rotate-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 5px 12px;
        border-radius: 8px;
        font-size: 0.78rem;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .dot-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #5B6672;

          &.on {
            background: #4ade80;
            box-shadow: 0 0 8px #4ade80;
          }
        }
      }

      .hero-calling-row {
        display: flex;
        align-items: center;
        gap: 36px;
        flex-wrap: wrap;
      }

      .hero-ticket-box {
        background: rgba(0, 0, 0, 0.45);
        border: 2px dashed #B8955A;
        border-radius: 16px;
        padding: 16px 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 180px;

        .ticket-prefix-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .ticket-prefix {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.08em;
        }

        .series-tag {
          font-size: 0.68rem;
          background: rgba(184, 149, 90, 0.2);
          color: #E6CE9F;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 700;
        }

        .hero-ticket-num {
          font-size: 4.2rem;
          line-height: 1;
          color: #B8955A;
          text-shadow: 0 0 24px rgba(184, 149, 90, 0.6);
        }

        .called-time-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 4px;
        }
      }

      .hero-arrow {
        color: #5E8B7E;
        animation: arrowShift 1.5s ease-in-out infinite alternate;
      }

      @keyframes arrowShift {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(8px);
        }
      }

      .hero-room-box {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;

        .room-top-tags {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .room-code-tag {
          background: #0E4A55;
          color: #E6CE9F;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 2px 10px;
          border-radius: 6px;
          border: 1px solid rgba(184, 149, 90, 0.3);
        }

        .room-status-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(94, 139, 126, 0.3);
          color: #72baaa;

          &.calling {
            background: #B8955A;
            color: #121A22;
          }
        }

        .hero-room-name {
          font-size: 2.3rem;
          color: #FFFFFF;
          margin: 0;
          line-height: 1.15;
        }

        .hero-room-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          flex-wrap: wrap;

          .meta-specialty {
            color: #E6CE9F;
            font-weight: 600;
          }

          .meta-doc {
            color: rgba(255, 255, 255, 0.85);
          }

          .meta-loc {
            color: #5E8B7E;
          }

          .meta-divider {
            color: rgba(255, 255, 255, 0.3);
          }
        }
      }

      // Room Upcoming Strip (Tách riêng từng phòng)
      .room-upcoming-strip {
        background: rgba(18, 26, 34, 0.7);
        border: 1.5px solid rgba(184, 149, 90, 0.35);
        border-radius: 16px;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
      }

      .upcoming-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        padding-bottom: 8px;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.12);

        .upcoming-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .upcoming-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFF2D1;
          letter-spacing: 0.05em;
        }

        .waiting-count-badge {
          font-size: 0.78rem;
          background: rgba(184, 149, 90, 0.22);
          color: #FFDE82;
          border: 1.5px solid rgba(184, 149, 90, 0.5);
          padding: 3px 12px;
          border-radius: 999px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(184, 149, 90, 0.15);
        }

        .upcoming-hint {
          font-size: 0.78rem;
          color: #B5C4D0;
          font-style: italic;
          font-weight: 500;
        }
      }

      .upcoming-tickets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
        gap: 16px;
      }

      .upcoming-ticket-card {
        background: rgba(255, 255, 255, 0.08);
        border: 1.5px solid rgba(255, 255, 255, 0.18);
        border-radius: 16px;
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);

        &:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 222, 130, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        &.is-ready {
          border: 2px solid #FFDE82;
          background: linear-gradient(145deg, rgba(184, 149, 90, 0.25) 0%, rgba(14, 74, 85, 0.35) 100%);
          box-shadow: 0 6px 20px rgba(184, 149, 90, 0.25);

          .u-order-badge {
            background: #FFDE82;
            color: #121A22;
            font-weight: 800;
          }

          .u-card-num-box {
            color: #FFF2C6;
            text-shadow: 0 0 16px rgba(255, 222, 130, 0.6);
          }

          .u-status-banner {
            background: rgba(255, 222, 130, 0.25);
            border-color: rgba(255, 222, 130, 0.6);
            color: #FFE699;
            font-weight: 700;

            .pulse-sparkle {
              color: #FFDE82;
              font-size: 0.9rem;
            }
          }
        }

        .u-card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .u-order-badge {
          font-size: 0.74rem;
          font-weight: 700;
          color: #E2E8F0;
          background: rgba(255, 255, 255, 0.14);
          padding: 3px 9px;
          border-radius: 6px;
          letter-spacing: 0.04em;
        }

        .u-time-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: #FFFFFF;
          font-weight: 600;
          background: rgba(0, 0, 0, 0.35);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .u-card-num-box {
          font-size: 2.35rem;
          line-height: 1;
          color: #FFE699;
          letter-spacing: -0.01em;
          text-align: center;
          padding: 6px 0;
        }

        .u-status-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 0.77rem;
          color: #E2E8F0;
          font-weight: 600;

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #94A3B8;
            flex-shrink: 0;
          }
        }

        .u-card-patient-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px dashed rgba(255, 255, 255, 0.14);
          font-size: 0.75rem;

          .patient-lbl {
            color: #94A3B8;
            font-size: 0.74rem;
          }

          .patient-val {
            color: #FFFFFF;
            font-family: monospace;
            font-size: 0.78rem;
            letter-spacing: 0.04em;
            background: rgba(255, 255, 255, 0.1);
            padding: 2px 8px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
        }
      }

      // Stations Section
      .stations-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-bottom: 24px;
      }

      .stations-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 12px;

        .header-left-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .section-heading {
          font-size: 1.15rem;
          color: #E6CE9F;
          margin: 0;
          letter-spacing: 0.04em;
        }

        .section-sub {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }
      }

      .category-filter-pills {
        display: flex;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);

        .cat-pill {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          padding: 6px 14px;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            color: #FFFFFF;
          }

          &.active {
            background: #0E4A55;
            color: #E6CE9F;
            border: 1px solid rgba(184, 149, 90, 0.4);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          }
        }
      }

      .stations-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;

        @media (max-width: 1400px) {
          grid-template-columns: repeat(3, 1fr);
        }

        @media (max-width: 1000px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 650px) {
          grid-template-columns: 1fr;
        }
      }

      .station-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1.5px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        cursor: pointer;
        transition: all 0.22s ease;
        position: relative;
        overflow: hidden;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(184, 149, 90, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        &.is-selected {
          border-color: #B8955A;
          background: rgba(184, 149, 90, 0.1);
          box-shadow: 0 8px 24px rgba(184, 149, 90, 0.2), inset 0 0 16px rgba(184, 149, 90, 0.08);

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #B8955A, #E6CE9F);
          }
        }

        &.is-calling {
          border-left: 3.5px solid #B8955A;
        }

        .card-room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }

        .card-title-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .room-code-mini {
          font-size: 0.68rem;
          background: rgba(255, 255, 255, 0.1);
          color: #E6CE9F;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
        }

        .station-room-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .station-status-pill {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 5px;

          &.calling {
            background: #B8955A;
            color: #121A22;
          }

          &.serving {
            background: rgba(94, 139, 126, 0.25);
            color: #5E8B7E;
          }
        }

        .station-sub-info {
          display: flex;
          flex-direction: column;
          gap: 1px;

          .station-specialty {
            font-size: 0.8rem;
            color: #E6CE9F;
          }

          .station-doc {
            font-size: 0.72rem;
            color: rgba(255, 255, 255, 0.6);
          }
        }

        .station-ticket-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.35);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);

          .stt-meta {
            display: flex;
            flex-direction: column;
          }

          .stt-label {
            font-size: 0.72rem;
            color: rgba(255, 255, 255, 0.6);
          }

          .stt-series {
            font-size: 0.66rem;
            color: #B8955A;
            font-weight: 600;
          }

          .stt-val {
            font-size: 1.85rem;
            line-height: 1;
            color: #E6CE9F;
          }
        }

        .card-upcoming-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          padding: 5px 8px;
          border-radius: 6px;

          .preview-label {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.5);
            flex-shrink: 0;
          }

          .preview-pills {
            display: flex;
            gap: 4px;
            align-items: center;
            overflow: hidden;
          }

          .preview-pill {
            font-size: 0.72rem;
            font-weight: 700;
            background: rgba(255, 255, 255, 0.09);
            color: rgba(255, 255, 255, 0.85);
            padding: 2px 6px;
            border-radius: 4px;

            &.ready {
              background: rgba(184, 149, 90, 0.25);
              color: #FFDE82;
            }

            &.more {
              background: transparent;
              color: rgba(255, 255, 255, 0.4);
              font-size: 0.68rem;
            }
          }
        }

        .station-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
          margin-top: 2px;

          .waiting-total {
            color: #B8955A;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-weight: 600;
          }

          .select-hint {
            color: rgba(255, 255, 255, 0.4);
            font-size: 0.68rem;
          }
        }
      }

      // Lobby Footer
      .lobby-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        padding-top: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        flex-wrap: wrap;
        gap: 8px;

        .footer-note {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
      }

      .animate-fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class LobbyDisplayComponent implements OnInit, OnDestroy {
  currentTime = signal<string>(new Date().toLocaleTimeString('vi-VN'));
  selectedRoomId = signal<string>('room-101');
  selectedCategory = signal<'ALL' | 'KHAM_BENH' | 'CAN_LAM_SANG'>('ALL');
  autoRotate = signal<boolean>(true);
  autoRotateCountdown = signal<number>(8);
  searchQuery = signal<string>('');
  isChiming = signal<boolean>(false);

  private timerInterval?: ReturnType<typeof setInterval>;
  private autoRotateInterval?: ReturnType<typeof setInterval>;

  // Dữ liệu độc lập theo từng loại phòng khám (Nghiệp vụ tách biệt số, không gộp số)
  allStations: ClinicRoomStation[] = [
    {
      id: 'room-101',
      roomCode: 'P.101',
      roomName: 'Phòng Khám Nội 101',
      specialty: 'Khám Tim Mạch',
      category: 'KHAM_BENH',
      doctorName: 'TS.BS Trần Minh Hoàng',
      location: 'Tầng 1 - Khu A',
      seriesPrefix: 'A',
      currentTicket: 'A011',
      status: 'CALLING',
      calledAt: '08:42',
      totalWaitingCount: 5,
      upcomingTickets: [
        {
          ticketNumber: 'A012',
          patientCodeHidden: 'BN-***89',
          estimatedTime: '08:55',
          status: 'READY',
          waitOrder: 1,
        },
        {
          ticketNumber: 'A013',
          patientCodeHidden: 'BN-***12',
          estimatedTime: '09:10',
          status: 'WAITING',
          waitOrder: 2,
        },
        {
          ticketNumber: 'A014',
          patientCodeHidden: 'BN-***45',
          estimatedTime: '09:25',
          status: 'WAITING',
          waitOrder: 3,
        },
        {
          ticketNumber: 'A015',
          patientCodeHidden: 'BN-***77',
          estimatedTime: '09:40',
          status: 'WAITING',
          waitOrder: 4,
        },
        {
          ticketNumber: 'A016',
          patientCodeHidden: 'BN-***91',
          estimatedTime: '09:55',
          status: 'WAITING',
          waitOrder: 5,
        },
      ],
    },
    {
      id: 'room-102',
      roomCode: 'P.102',
      roomName: 'Phòng Khám Nội 102',
      specialty: 'Khám Nội Tổng Quát',
      category: 'KHAM_BENH',
      doctorName: 'ThS.BS Lê Hồng Phúc',
      location: 'Tầng 1 - Khu A',
      seriesPrefix: 'B',
      currentTicket: 'B005',
      status: 'SERVING',
      calledAt: '08:35',
      totalWaitingCount: 5,
      upcomingTickets: [
        {
          ticketNumber: 'B006',
          patientCodeHidden: 'BN-***23',
          estimatedTime: '08:50',
          status: 'READY',
          waitOrder: 1,
        },
        {
          ticketNumber: 'B007',
          patientCodeHidden: 'BN-***67',
          estimatedTime: '09:05',
          status: 'WAITING',
          waitOrder: 2,
        },
        {
          ticketNumber: 'B008',
          patientCodeHidden: 'BN-***88',
          estimatedTime: '09:20',
          status: 'WAITING',
          waitOrder: 3,
        },
        {
          ticketNumber: 'B009',
          patientCodeHidden: 'BN-***04',
          estimatedTime: '09:35',
          status: 'WAITING',
          waitOrder: 4,
        },
        {
          ticketNumber: 'B010',
          patientCodeHidden: 'BN-***39',
          estimatedTime: '09:50',
          status: 'WAITING',
          waitOrder: 5,
        },
      ],
    },
    {
      id: 'room-103',
      roomCode: 'P.103',
      roomName: 'Phòng Khám Nội 103',
      specialty: 'Khám Tiêu Hóa - Gan Mật',
      category: 'KHAM_BENH',
      doctorName: 'BSCKII Nguyễn Hoàng Long',
      location: 'Tầng 1 - Khu A',
      seriesPrefix: 'C',
      currentTicket: 'C002',
      status: 'CALLING',
      calledAt: '08:40',
      totalWaitingCount: 4,
      upcomingTickets: [
        {
          ticketNumber: 'C003',
          patientCodeHidden: 'BN-***18',
          estimatedTime: '08:55',
          status: 'READY',
          waitOrder: 1,
        },
        {
          ticketNumber: 'C004',
          patientCodeHidden: 'BN-***52',
          estimatedTime: '09:10',
          status: 'WAITING',
          waitOrder: 2,
        },
        {
          ticketNumber: 'C005',
          patientCodeHidden: 'BN-***76',
          estimatedTime: '09:25',
          status: 'WAITING',
          waitOrder: 3,
        },
        {
          ticketNumber: 'C006',
          patientCodeHidden: 'BN-***99',
          estimatedTime: '09:40',
          status: 'WAITING',
          waitOrder: 4,
        },
      ],
    },
    {
      id: 'room-201',
      roomCode: 'P.201',
      roomName: 'Phòng Khám Tai Mũi Họng 201',
      specialty: 'Khám Tai Mũi Họng & Nội Soi',
      category: 'KHAM_BENH',
      doctorName: 'BSCKI Phạm Thu Thảo',
      location: 'Tầng 2 - Khu B',
      seriesPrefix: 'H',
      currentTicket: 'H008',
      status: 'CALLING',
      calledAt: '08:43',
      totalWaitingCount: 4,
      upcomingTickets: [
        {
          ticketNumber: 'H009',
          patientCodeHidden: 'BN-***31',
          estimatedTime: '08:58',
          status: 'READY',
          waitOrder: 1,
        },
        {
          ticketNumber: 'H010',
          patientCodeHidden: 'BN-***74',
          estimatedTime: '09:12',
          status: 'WAITING',
          waitOrder: 2,
        },
        {
          ticketNumber: 'H011',
          patientCodeHidden: 'BN-***85',
          estimatedTime: '09:26',
          status: 'WAITING',
          waitOrder: 3,
        },
        {
          ticketNumber: 'H012',
          patientCodeHidden: 'BN-***19',
          estimatedTime: '09:40',
          status: 'WAITING',
          waitOrder: 4,
        },
      ],
    },
    {
      id: 'room-202',
      roomCode: 'P.202',
      roomName: 'Phòng Khám Nhi 202',
      specialty: 'Khám Nhi Khoa & Tiêm Ngừa',
      category: 'KHAM_BENH',
      doctorName: 'BS. Nguyễn Mai Trang',
      location: 'Tầng 2 - Khu B',
      seriesPrefix: 'N',
      currentTicket: 'N004',
      status: 'SERVING',
      calledAt: '08:38',
      totalWaitingCount: 4,
      upcomingTickets: [
        {
          ticketNumber: 'N005',
          patientCodeHidden: 'BN-***08',
          estimatedTime: '08:52',
          status: 'READY',
          waitOrder: 1,
        },
        {
          ticketNumber: 'N006',
          patientCodeHidden: 'BN-***41',
          estimatedTime: '09:06',
          status: 'WAITING',
          waitOrder: 2,
        },
        {
          ticketNumber: 'N007',
          patientCodeHidden: 'BN-***62',
          estimatedTime: '09:20',
          status: 'WAITING',
          waitOrder: 3,
        },
        {
          ticketNumber: 'N008',
          patientCodeHidden: 'BN-***95',
          estimatedTime: '09:34',
          status: 'WAITING',
          waitOrder: 4,
        },
      ],
    },
    {
      id: 'room-s01',
      roomCode: 'P.SA01',
      roomName: 'Phòng Siêu Âm 01',
      specialty: 'Siêu Âm Doppler Ổ Bụng & Tim',
      category: 'CAN_LAM_SANG',
      doctorName: 'ThS.BS Đặng Quốc Huy',
      location: 'Tầng 2 - Cận Lâm Sàng',
      seriesPrefix: 'S',
      currentTicket: 'S008',
      status: 'SERVING',
      calledAt: '08:30',
      totalWaitingCount: 4,
      upcomingTickets: [
        {
          ticketNumber: 'S009',
          patientCodeHidden: 'BN-***15',
          estimatedTime: '08:50',
          status: 'READY',
          waitOrder: 1,
        },
        {
          ticketNumber: 'S010',
          patientCodeHidden: 'BN-***58',
          estimatedTime: '09:05',
          status: 'WAITING',
          waitOrder: 2,
        },
        {
          ticketNumber: 'S011',
          patientCodeHidden: 'BN-***83',
          estimatedTime: '09:20',
          status: 'WAITING',
          waitOrder: 3,
        },
        {
          ticketNumber: 'S012',
          patientCodeHidden: 'BN-***26',
          estimatedTime: '09:35',
          status: 'WAITING',
          waitOrder: 4,
        },
      ],
    },
    {
      id: 'room-xn',
      roomCode: 'P.XN',
      roomName: 'Phòng Xét Nghiệm Trung Tâm',
      specialty: 'Lấy Mẫu Máu & Sinh Hóa Nước Tiểu',
      category: 'CAN_LAM_SANG',
      doctorName: 'KTV Trưởng CN. Hoàng Kim',
      location: 'Tầng Trệt - Khu Xét Nghiệm',
      seriesPrefix: 'X',
      currentTicket: 'X014',
      status: 'SERVING',
      calledAt: '08:38',
      totalWaitingCount: 5,
      upcomingTickets: [
        {
          ticketNumber: 'X015',
          patientCodeHidden: 'BN-***02',
          estimatedTime: '08:45',
          status: 'READY',
          waitOrder: 1,
        },
        {
          ticketNumber: 'X016',
          patientCodeHidden: 'BN-***35',
          estimatedTime: '08:52',
          status: 'WAITING',
          waitOrder: 2,
        },
        {
          ticketNumber: 'X017',
          patientCodeHidden: 'BN-***71',
          estimatedTime: '09:00',
          status: 'WAITING',
          waitOrder: 3,
        },
        {
          ticketNumber: 'X018',
          patientCodeHidden: 'BN-***93',
          estimatedTime: '09:08',
          status: 'WAITING',
          waitOrder: 4,
        },
        {
          ticketNumber: 'X019',
          patientCodeHidden: 'BN-***16',
          estimatedTime: '09:15',
          status: 'WAITING',
          waitOrder: 5,
        },
      ],
    },
    {
      id: 'room-ecg',
      roomCode: 'P.ECG',
      roomName: 'Phòng Đo Điện Tim (ECG)',
      specialty: 'Đo Điện Tâm Đồ 12 Chuyển Đạo',
      category: 'CAN_LAM_SANG',
      doctorName: 'ĐD. Phan Bảo Trâm',
      location: 'Tầng 1 - Cận Lâm Sàng',
      seriesPrefix: 'E',
      currentTicket: 'E003',
      status: 'CALLING',
      calledAt: '08:44',
      totalWaitingCount: 3,
      upcomingTickets: [
        {
          ticketNumber: 'E004',
          patientCodeHidden: 'BN-***48',
          estimatedTime: '08:55',
          status: 'READY',
          waitOrder: 1,
        },
        {
          ticketNumber: 'E005',
          patientCodeHidden: 'BN-***79',
          estimatedTime: '09:05',
          status: 'WAITING',
          waitOrder: 2,
        },
        {
          ticketNumber: 'E006',
          patientCodeHidden: 'BN-***07',
          estimatedTime: '09:15',
          status: 'WAITING',
          waitOrder: 3,
        },
      ],
    },
  ];

  filteredStations = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'ALL') {
      return this.allStations;
    }
    return this.allStations.filter((s) => s.category === cat);
  });

  selectedRoom = computed(() => {
    const id = this.selectedRoomId();
    return this.allStations.find((s) => s.id === id) || this.allStations[0];
  });

  searchResult = computed(() => {
    const q = this.searchQuery().trim().toUpperCase();
    if (!q || q.length < 2) return null;

    for (const room of this.allStations) {
      if (room.currentTicket.toUpperCase() === q) {
        return {
          room,
          ticket: {
            ticketNumber: room.currentTicket,
            patientCodeHidden: 'Đang phục vụ',
            estimatedTime: 'Hiện tại',
            status: 'READY' as const,
            waitOrder: 0,
          },
        };
      }
      const foundUpcoming = room.upcomingTickets.find(
        (t) => t.ticketNumber.toUpperCase() === q
      );
      if (foundUpcoming) {
        return {
          room,
          ticket: foundUpcoming,
        };
      }
    }
    return null;
  });

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      // Clock timer
      this.timerInterval = setInterval(() => {
        this.currentTime.set(new Date().toLocaleTimeString('vi-VN'));
      }, 1000);

      // Auto rotate rooms
      this.startAutoRotate();
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
    }
  }

  startAutoRotate(): void {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
    }
    this.autoRotateCountdown.set(8);
    this.autoRotateInterval = setInterval(() => {
      if (!this.autoRotate()) return;

      const current = this.autoRotateCountdown();
      if (current <= 1) {
        // Switch to next room
        this.rotateNextRoom();
        this.autoRotateCountdown.set(8);
      } else {
        this.autoRotateCountdown.set(current - 1);
      }
    }, 1000);
  }

  rotateNextRoom(): void {
    const list = this.filteredStations();
    if (list.length === 0) return;
    const currentIndex = list.findIndex((s) => s.id === this.selectedRoomId());
    const nextIndex = (currentIndex + 1) % list.length;
    this.selectedRoomId.set(list[nextIndex].id);
  }

  selectRoom(id: string): void {
    this.selectedRoomId.set(id);
    // Pause auto rotate countdown when user explicitly clicks a room
    this.autoRotate.set(false);
  }

  setCategory(category: 'ALL' | 'KHAM_BENH' | 'CAN_LAM_SANG'): void {
    this.selectedCategory.set(category);
    // Select first room of new category
    const list = this.filteredStations();
    if (list.length > 0) {
      this.selectedRoomId.set(list[0].id);
    }
  }

  toggleAutoRotate(): void {
    const next = !this.autoRotate();
    this.autoRotate.set(next);
    if (next) {
      this.autoRotateCountdown.set(8);
    }
  }

  onSearchTicket(val: string): void {
    this.searchQuery.set(val);
    const res = this.searchResult();
    if (res) {
      this.selectedRoomId.set(res.room.id);
      this.autoRotate.set(false);
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  playCallChime(room: ClinicRoomStation): void {
    this.isChiming.set(true);

    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        
        // Hospital 2-tone Ding-Dong chime (523.25Hz -> 659.25Hz)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        const gain2 = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain1.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.5);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.35); // E5
        gain2.gain.setValueAtTime(0.25, audioCtx.currentTime + 0.35);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);

        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(audioCtx.currentTime + 0.35);
        osc2.stop(audioCtx.currentTime + 0.9);
      }
    } catch {
      // Ignore audio context autoplay restrictions gracefully
    }

    setTimeout(() => {
      this.isChiming.set(false);
    }, 1200);
  }
}
