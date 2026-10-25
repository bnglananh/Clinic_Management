import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MedicalService } from '../../../core/services/medical.service';
import { QueueService } from '../../../core/services/queue.service';
import { NotificationService } from '../../../core/services/notification.service';
import { VitalSignCardComponent } from '../../../shared/components/vital-sign-card/vital-sign-card.component';
import { VitalTrendChartComponent } from '../../../shared/components/vital-trend-chart/vital-trend-chart.component';
import { Icd10SelectComponent } from '../../../shared/components/icd10-select/icd10-select.component';
import { DrugInteractionModalComponent } from '../../../shared/components/drug-interaction-modal/drug-interaction-modal.component';
import { EmrLockBadgeComponent } from '../../../shared/components/emr-lock-badge/emr-lock-badge.component';
import { AllergyBannerComponent } from '../../../shared/components/allergy-banner/allergy-banner.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';
import { ClinicIconComponent } from '../../../shared/components/clinic-icon/clinic-icon.component';
import {
  MedicineItem,
  ClinicalServiceOrder,
  VitalHistoryPoint,
} from '../../../core/models/medical-record.model';

@Component({
  selector: 'app-doctor-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    VitalSignCardComponent,
    VitalTrendChartComponent,
    Icd10SelectComponent,
    DrugInteractionModalComponent,
    EmrLockBadgeComponent,
    AllergyBannerComponent,
    StatusTagComponent,
    VndCurrencyPipe,
    ClinicIconComponent,
  ],
  template: `
    <div class="clinical-workspace">
      <!-- ==================== LEFT COLUMN: PATIENT QUEUE ==================== -->
      <aside class="queue-column">
        <div class="col-header">
          <div class="header-top">
            <span class="room-badge">PHÒNG 101</span>
            <span class="count-badge">{{ waitingCount() }} chờ</span>
          </div>
          <h3 class="col-title font-serif">Hàng Đợi Khám</h3>
          <button class="call-next-btn pulse-gold" (click)="onCallNextPatient()">
            <app-clinic-icon name="bell" [size]="16"></app-clinic-icon>
            <span>Gọi số tiếp theo</span>
          </button>
        </div>

        <div class="queue-list-container">
          <div class="queue-category-header">
            <span class="category-title">ĐANG KHÁM HIỆN TẠI</span>
          </div>
          @if (inProgressTicket(); as inProg) {
            <div
              class="queue-item active-calling"
              [class.selected]="selectedTicketNumber() === inProg.ticketNumber"
              (click)="selectPatient(inProg.ticketNumber, inProg.patientName, inProg.patientId)"
            >
              <div class="q-ticket-number">{{ inProg.ticketNumber }}</div>
              <div class="q-info">
                <span class="q-name">{{ inProg.patientName }}</span>
                <span class="q-sub">{{ inProg.roomName }}</span>
              </div>
              <span class="live-dot pulse-gold"></span>
            </div>
          } @else {
            <div class="empty-queue-sub">Chưa có lượt khám nào đang diễn ra.</div>
          }

          <!-- KHU VỰC: CHỜ KẾT QUẢ CLS (BỆNH NHÂN KHÔNG CẦN BỐC SỐ LẠI) -->
          <div class="queue-category-header mt-cls">
            <span class="category-title">CHỜ KẾT QUẢ CLS ({{ waitingResultsTickets().length }})</span>
            @if (resultsReadyCount() > 0) {
              <span class="badge-ready-pulse">
                <span class="dot-pulse-green-sm"></span>
                <span>{{ resultsReadyCount() }} ĐÃ CÓ KQ</span>
              </span>
            }
          </div>
          @for (ticket of waitingResultsTickets(); track ticket.id) {
            <div
              class="queue-item cls-card"
              [class.results-ready]="ticket.status === 'RESULTS_READY'"
              [class.waiting-cls]="ticket.status === 'WAITING_RESULTS'"
              [class.selected]="selectedTicketNumber() === ticket.ticketNumber"
              (click)="selectPatient(ticket.ticketNumber, ticket.patientName, ticket.patientId)"
            >
              <!-- Row 1: Số vé + Họ tên bệnh nhân (rộng rãi không bị dính chữ) + Huy hiệu ĐỦ KQ -->
              <div class="cls-header-row">
                <div class="cls-ticket-badge">{{ ticket.ticketNumber }}</div>
                <div class="cls-patient-name" [title]="ticket.patientName">{{ ticket.patientName }}</div>
                @if (ticket.status === 'RESULTS_READY') {
                  <span class="cls-ready-chip">ĐỦ KQ</span>
                }
              </div>

              <!-- Row 2: Tiến độ dịch vụ + Nút bấm hành động tương phản cao -->
              <div class="cls-action-row">
                <div class="cls-progress-badge">
                  @if (ticket.status === 'RESULTS_READY') {
                    <span class="status-indicator ready">
                      <span class="dot-pulse-green"></span>
                      <span>Đã có KQ ({{ ticket.clinicalServicesDone || 2 }}/{{ ticket.clinicalServicesTotal || 2 }})</span>
                    </span>
                  } @else {
                    <span class="status-indicator waiting">
                      <span class="dot-pulse-amber"></span>
                      <span>Đang làm ({{ ticket.clinicalServicesDone || 1 }}/{{ ticket.clinicalServicesTotal || 2 }})</span>
                    </span>
                  }
                </div>

                @if (ticket.status === 'RESULTS_READY') {
                  <button
                    type="button"
                    class="btn-recall-action"
                    title="Mời vào phòng kết luận ngay (Không bốc số lại)"
                    (click)="$event.stopPropagation(); recallPatient(ticket.ticketNumber, ticket.patientName, ticket.patientId)"
                  >
                    <span>Mời vào</span>
                    <app-clinic-icon name="check" [size]="12"></app-clinic-icon>
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn-simulate-action"
                    title="Mô phỏng: Phòng chức năng trả kết quả"
                    (click)="$event.stopPropagation(); simulateLabComplete(ticket.ticketNumber)"
                  >
                    + Trả KQ
                  </button>
                }
              </div>
            </div>
          }

          <div class="queue-category-header mt-cls">
            <span class="category-title">CHỜ KHÁM MỚI ({{ waitingTickets().length }})</span>
          </div>
          @for (ticket of waitingTickets(); track ticket.id) {
            <div
              class="queue-item waiting"
              [class.selected]="selectedTicketNumber() === ticket.ticketNumber"
              (click)="selectPatient(ticket.ticketNumber, ticket.patientName, ticket.patientId)"
            >
              <div class="q-ticket-number">{{ ticket.ticketNumber }}</div>
              <div class="q-info">
                <span class="q-name">{{ ticket.patientName }}</span>
                <span class="q-sub">Đến lúc: {{ ticket.checkinTime | date: 'HH:mm' }}</span>
              </div>
              <button
                class="quick-call-link"
                title="Gọi ngay"
                (click)="$event.stopPropagation(); callSpecificTicket(ticket.id, ticket.ticketNumber, ticket.patientName, ticket.patientId)"
              >
                Gọi →
              </button>
            </div>
          }

          <div class="queue-category-header mt-cls">
            <span class="category-title">ĐÃ KHÁM XONG ({{ completedTickets().length }})</span>
          </div>
          @for (ticket of completedTickets(); track ticket.id) {
            <div
              class="queue-item completed"
              [class.selected]="selectedTicketNumber() === ticket.ticketNumber"
              (click)="selectPatient(ticket.ticketNumber, ticket.patientName, ticket.patientId)"
            >
              <div class="q-ticket-number">{{ ticket.ticketNumber }}</div>
              <div class="q-info">
                <span class="q-name">{{ ticket.patientName }}</span>
                <span class="q-sub flex-align-center">
                  <app-clinic-icon name="lock" [size]="11"></app-clinic-icon>
                  Đã khóa EMR
                </span>
              </div>
              <span class="check-icon">
                <app-clinic-icon name="check" [size]="12"></app-clinic-icon>
              </span>
            </div>
          }
        </div>
      </aside>

      <!-- ==================== CENTER COLUMN: CLINICAL TABS ==================== -->
      <main class="examination-column">
        <!-- Patient Banner & EMR Status Bar -->
        <header class="patient-banner">
          <div class="banner-main">
            <div class="ticket-tag font-serif">{{ record().ticketNumber }}</div>
            <div class="patient-id-block">
              <div class="name-row">
                <h2 class="patient-display-name">{{ record().patientName }}</h2>
                <app-status-tag [status]="record().status"></app-status-tag>
              </div>
              <span class="patient-meta-text">
                {{ record().patientGender === 'MALE' ? 'Nam' : 'Nữ' }} • Sinh: {{ record().patientDob }} • Mã BN: {{ record().patientCode }} • BS: {{ record().doctorName }}
              </span>
            </div>
          </div>

          <div class="banner-right">
            <app-emr-lock-badge
              [isLocked]="record().isLocked"
              [version]="record().version"
              [amendments]="record().amendments"
              (addAmendment)="onAddAmendment($event)"
            ></app-emr-lock-badge>

            <div class="action-buttons">
              @if (!record().isLocked) {
                <button type="button" class="btn-save-draft" (click)="saveDraft()">
                  <app-clinic-icon name="file-text" [size]="14"></app-clinic-icon>
                  Lưu tạm
                </button>
                <button
                  type="button"
                  class="btn-complete-lock"
                  (click)="handleCompleteClick()"
                >
                  <app-clinic-icon name="lock" [size]="14"></app-clinic-icon>
                  Hoàn Tất & Khóa Bệnh Án
                </button>
              } @else {
                <button type="button" class="btn-print-emr" (click)="printRecord()">
                  <app-clinic-icon name="receipt" [size]="14"></app-clinic-icon>
                  <span>In Bệnh Án</span>
                </button>
              }
            </div>
          </div>
        </header>

        <!-- CLS State Alert Bar -->
        @if (record().status === 'WAITING_RESULTS') {
          <div class="cls-state-alert waiting">
            <app-clinic-icon name="clock" [size]="16"></app-clinic-icon>
            <span>Bệnh nhân đang thực hiện Cận lâm sàng ({{ completedServicesCount() }}/{{ record().services.length }} dịch vụ đã xong). Bác sĩ có thể gọi bệnh nhân tiếp theo trong hàng đợi trong lúc chờ kết quả.</span>
          </div>
        }
        @if (record().status === 'RESULTS_READY') {
          <div class="cls-state-alert ready">
            <app-clinic-icon name="check" [size]="16"></app-clinic-icon>
            <span>Bệnh nhân đã có đầy đủ kết quả Cận lâm sàng! Bác sĩ xem kết quả ở tab Dịch vụ và tiếp tục kết luận/kê đơn thuốc.</span>
          </div>
        }

        <!-- Navigation Tabs -->
        <nav class="exam-tabs">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'vitals'"
            (click)="activeTab.set('vitals')"
          >
            <app-clinic-icon name="stethoscope" [size]="16" class="tab-icon"></app-clinic-icon>
            <span>1. Sinh Hiệu & Triệu Chứng</span>
          </button>

          <button
            class="tab-btn"
            [class.active]="activeTab() === 'diagnosis'"
            (click)="activeTab.set('diagnosis')"
          >
            <app-clinic-icon name="clipboard" [size]="16" class="tab-icon"></app-clinic-icon>
            <span>2. Chẩn Đoán ICD-10</span>
            @if (record().diagnoses.length > 0) {
              <span class="tab-count-badge">{{ record().diagnoses.length }}</span>
            }
          </button>

          <button
            class="tab-btn"
            [class.active]="activeTab() === 'services'"
            (click)="activeTab.set('services')"
          >
            <app-clinic-icon name="flask" [size]="16" class="tab-icon"></app-clinic-icon>
            <span>3. Cận Lâm Sàng & Dịch Vụ</span>
            @if (record().services.length > 0) {
              <span class="tab-count-badge">{{ record().services.length }}</span>
            }
          </button>

          <button
            class="tab-btn"
            [class.active]="activeTab() === 'prescription'"
            (click)="activeTab.set('prescription')"
          >
            <app-clinic-icon name="pill" [size]="16" class="tab-icon"></app-clinic-icon>
            <span>4. Kê Đơn Thuốc & DDI</span>
            @if (currentInteractions().length > 0) {
              <span class="tab-alert-badge">
                <app-clinic-icon name="alert-triangle" [size]="12"></app-clinic-icon>
                {{ currentInteractions().length }}
              </span>
            } @else if (record().prescriptions.length > 0) {
              <span class="tab-count-badge">{{ record().prescriptions.length }}</span>
            }
          </button>
        </nav>

        <!-- Tab Content Containers -->
        <div class="tab-content-area">
          <!-- ===== TAB 1: VITALS & SYMPTOMS ===== -->
          @if (activeTab() === 'vitals') {
            <section class="tab-pane">
              <h3 class="pane-section-title">5 Chỉ Số Sinh Hiệu Khám Lâm Sàng</h3>

              <div class="vitals-cards-grid">
                <!-- Huyết áp -->
                <app-vital-sign-card
                  vitalType="bp"
                  label="Huyết Áp"
                  icon="stethoscope"
                  [systolic]="record().vitals.bloodPressureSystolic"
                  [diastolic]="record().vitals.bloodPressureDiastolic"
                  [isEditable]="!record().isLocked"
                  (systolicChange)="updateBpSystolic($event)"
                  (diastolicChange)="updateBpDiastolic($event)"
                ></app-vital-sign-card>

                <!-- Mạch -->
                <app-vital-sign-card
                  vitalType="heartRate"
                  label="Nhịp Tim / Mạch"
                  icon="heart-pulse"
                  unit="bpm"
                  [value]="record().vitals.heartRate"
                  [isEditable]="!record().isLocked"
                  (valueChange)="updateHeartRate($event)"
                ></app-vital-sign-card>

                <!-- Nhiệt độ -->
                <app-vital-sign-card
                  vitalType="temperature"
                  label="Nhiệt Độ"
                  icon="activity"
                  unit="°C"
                  [value]="record().vitals.temperature"
                  [isEditable]="!record().isLocked"
                  (valueChange)="updateTemperature($event)"
                ></app-vital-sign-card>

                <!-- SpO2 -->
                <app-vital-sign-card
                  vitalType="spo2"
                  label="SpO2"
                  icon="activity"
                  unit="%"
                  [value]="record().vitals.spo2"
                  [isEditable]="!record().isLocked"
                  (valueChange)="updateSpo2($event)"
                ></app-vital-sign-card>

                <!-- BMI + Weight / Height -->
                <app-vital-sign-card
                  vitalType="bmi"
                  label="Chỉ Số BMI"
                  icon="user"
                  [value]="record().vitals.bmi"
                  [weight]="record().vitals.weight"
                  [height]="record().vitals.height"
                  [isEditable]="!record().isLocked"
                  (weightChange)="updateWeight($event)"
                  (heightChange)="updateHeight($event)"
                ></app-vital-sign-card>
              </div>

              <!-- Time-Series Chart from Cassandra -->
              <app-vital-trend-chart [data]="vitalTrendsData"></app-vital-trend-chart>

              <!-- Clinical Symptoms Input -->
              <div class="form-section mt-4">
                <div class="form-group">
                  <label class="field-label">Lý do vào khám (Chief Complaint) <span class="req">*</span></label>
                  <input
                    type="text"
                    class="clinic-input"
                    [disabled]="record().isLocked"
                    [ngModel]="record().chiefComplaint"
                    (ngModelChange)="updateComplaint($event)"
                    placeholder="Ví dụ: Đau đầu dữ dội, hồi hộp đánh trống ngực..."
                  />
                </div>

                <div class="form-group">
                  <label class="field-label">Bệnh sử & Diễn tiến lâm sàng (Clinical History & Physical Findings)</label>
                  <textarea
                    rows="3"
                    class="clinic-textarea"
                    [disabled]="record().isLocked"
                    [ngModel]="record().clinicalSymptoms"
                    (ngModelChange)="updateSymptoms($event)"
                    placeholder="Ghi chép bệnh sử, triệu chứng cơ năng, thăm khám thực thể tuần hoàn, hô hấp, tiêu hóa..."
                  ></textarea>
                </div>
              </div>
            </section>
          }

          <!-- ===== TAB 2: ICD-10 DIAGNOSIS ===== -->
          @if (activeTab() === 'diagnosis') {
            <section class="tab-pane">
              <h3 class="pane-section-title">Chẩn Đoán Lâm Sàng & Phân Loại Bệnh ICD-10</h3>

              <div class="form-group mb-3">
                <label class="field-label">Chẩn đoán sơ bộ / Mô tả lâm sàng ban đầu</label>
                <input
                  type="text"
                  class="clinic-input"
                  [disabled]="record().isLocked"
                  [ngModel]="record().preliminaryDiagnosis"
                  (ngModelChange)="updatePrelimDiagnosis($event)"
                  placeholder="Ví dụ: Nghi ngờ Hội chứng vành cấp / Cơn tăng huyết áp khẩn cấp..."
                />
              </div>

              <div class="icd10-container">
                <label class="field-label">Mã chẩn đoán ICD-10 chính thức</label>
                <app-icd10-select
                  [catalog]="icdCatalog()"
                  [selectedList]="record().diagnoses"
                  [isLocked]="record().isLocked"
                  (addDiagnosis)="onAddDiagnosis($event)"
                  (removeDiagnosis)="onRemoveDiagnosis($event)"
                  (setPrimary)="onSetPrimaryDiagnosis($event)"
                ></app-icd10-select>
              </div>
            </section>
          }

          <!-- ===== TAB 3: CLINICAL SERVICES & LAB ===== -->
          @if (activeTab() === 'services') {
            <section class="tab-pane">
              <div class="services-header-row">
                <h3 class="pane-section-title">Chỉ Định Dịch Vụ Cận Lâm Sàng</h3>
                @if (!record().isLocked) {
                  <button
                    type="button"
                    class="btn-add-srv"
                    (click)="showServiceCatalog.set(!showServiceCatalog())"
                  >
                    {{ showServiceCatalog() ? 'Đóng bảng dịch vụ' : '+ Chỉ định dịch vụ mới' }}
                  </button>
                }
              </div>

              <!-- Available Services Catalog Dropdown / Picker -->
              @if (showServiceCatalog() && !record().isLocked) {
                <div class="service-catalog-card">
                  <div class="cat-title">DANH MỤC DỊCH VỤ KỸ THUẬT PHÒNG KHÁM</div>
                  <div class="service-grid">
                    @for (srv of availableServices(); track srv.id) {
                      <div class="service-picker-item" (click)="orderService(srv)">
                        <div class="srv-badge">{{ srv.category }}</div>
                        <strong class="srv-name">{{ srv.serviceName }}</strong>
                        <span class="srv-price">{{ srv.price | vndCurrency }}</span>
                        <span class="srv-add">+ Chọn</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- CLS Dispatch Bar: Chuyển đi cận lâm sàng (Không bốc số lại) -->
              @if (record().services.length > 0 && !record().isLocked) {
                <div class="cls-dispatch-bar">
                  <div class="dispatch-left">
                    <div class="dispatch-title">
                      <app-clinic-icon name="flask" [size]="16"></app-clinic-icon>
                      <strong>Điều phối Cận lâm sàng & Tạm hoãn phòng khám</strong>
                    </div>
                    <div class="dispatch-desc">
                      Chuyển bệnh nhân đi làm xét nghiệm/siêu âm. Hệ thống sẽ lưu nháp bệnh án, chuyển trạng thái sang <strong>"Chờ kết quả CLS"</strong> và giải phóng phòng để khám người tiếp theo mà <strong>không bắt bệnh nhân bốc số lại</strong>.
                    </div>
                  </div>
                  <div class="dispatch-right">
                    @if (record().status === 'WAITING_RESULTS') {
                      <div class="dispatched-tag">
                        <span class="dot-amber-spin"></span>
                        <span>Đang đi làm CLS</span>
                      </div>
                    } @else if (record().status === 'RESULTS_READY') {
                      <div class="dispatched-tag success">
                        <span class="dot-green-pulse"></span>
                        <span>Đã có đủ kết quả CLS</span>
                      </div>
                    } @else {
                      <button
                        type="button"
                        class="btn-send-to-cls"
                        (click)="onSendToClinicalServices()"
                      >
                        <app-clinic-icon name="flask" [size]="14"></app-clinic-icon>
                        <span>Chuyển đi cận lâm sàng</span>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Ordered Services Table -->
              <div class="services-table-wrap">
                <table class="services-table">
                  <thead>
                    <tr>
                      <th>Mã DV</th>
                      <th>Tên Dịch Vụ</th>
                      <th>Phân Loại</th>
                      <th>Đơn Giá</th>
                      <th>Trạng Thái</th>
                      <th>Kết Quả Tóm Tắt</th>
                      @if (!record().isLocked) {
                        <th>Thao Tác</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (srv of record().services; track srv.id) {
                      <tr>
                        <td class="font-bold text-teal">{{ srv.serviceCode }}</td>
                        <td><strong>{{ srv.serviceName }}</strong></td>
                        <td><span class="cat-pill">{{ srv.category }}</span></td>
                        <td>{{ srv.price | vndCurrency }}</td>
                        <td>
                          <span
                            class="srv-status-badge"
                            [class.done]="srv.status === 'COMPLETED'"
                          >
                            @if (srv.status === 'COMPLETED') {
                              <app-clinic-icon name="check" [size]="12"></app-clinic-icon>
                              <span>Đã có kết quả</span>
                            } @else {
                              <app-clinic-icon name="clock" [size]="12"></app-clinic-icon>
                              <span>Đang thực hiện</span>
                            }
                          </span>
                        </td>
                        <td>
                          @if (srv.status === 'COMPLETED') {
                            <div class="result-text">
                              <span>{{ srv.resultSummary }}</span>
                              @if (srv.completedAt) {
                                <small class="text-muted">({{ srv.completedAt }} - {{ srv.performedBy }})</small>
                              }
                            </div>
                          } @else {
                            <button
                              type="button"
                              class="btn-mock-result"
                              (click)="mockEnterResult(srv.id)"
                            >
                              Giả lập trả kết quả
                            </button>
                          }
                        </td>
                        @if (!record().isLocked) {
                          <td>
                            <button
                              type="button"
                              class="btn-remove-srv"
                              (click)="removeService(srv.id)"
                              title="Xóa chỉ định"
                            >
                              <app-clinic-icon name="close" [size]="13"></app-clinic-icon>
                            </button>
                          </td>
                        }
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="text-center py-4 text-muted">
                          Chưa có dịch vụ cận lâm sàng nào được chỉ định. Nhấn "+ Chỉ định dịch vụ mới" để thêm.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          <!-- ===== TAB 4: PRESCRIPTION & DDI ===== -->
          @if (activeTab() === 'prescription') {
            <section class="tab-pane">
              <div class="rx-header-row">
                <div>
                  <h3 class="pane-section-title">Kê Đơn Thuốc Điện Tử</h3>
                  <span class="rx-sub">Được bảo vệ bởi hệ thống kiểm soát Tương Tác Thuốc (DDI) & Dị Ứng</span>
                </div>

                <!-- DDI Indicator Badge -->
                <div class="ddi-status-badge" [class.alert]="currentInteractions().length > 0">
                  @if (currentInteractions().length > 0) {
                    <app-clinic-icon name="alert-triangle" [size]="15" class="ddi-icon"></app-clinic-icon>
                    <span>Cảnh báo: {{ currentInteractions().length }} tương tác nguy hiểm!</span>
                    <button class="btn-view-ddi" (click)="showDdiModal.set(true)">Chi tiết</button>
                  } @else {
                    <app-clinic-icon name="shield" [size]="15" class="ddi-icon"></app-clinic-icon>
                    <span>An toàn tương tác thuốc (Neo4j Checked)</span>
                  }
                </div>
              </div>

              <!-- Allergy Alerts if any -->
              @if (allergyAlerts().length > 0) {
                <div class="allergy-critical-box">
                  <app-clinic-icon name="alert-triangle" [size]="16" class="alert-icon"></app-clinic-icon>
                  <div class="alert-content">
                    @for (alert of allergyAlerts(); track alert) {
                      <p class="alert-msg">{{ alert }}</p>
                    }
                  </div>
                </div>
              }

              <!-- Add Medicine Form -->
              @if (!record().isLocked) {
                <div class="add-rx-panel">
                  <div class="rx-form-grid">
                    <div class="rx-field drug-select">
                      <label>Chọn thuốc:</label>
                      <select [(ngModel)]="newRxMedicineId" (ngModelChange)="onSelectCatalogMedicine($event)">
                        <option value="">-- Chọn thuốc từ danh mục --</option>
                        @for (med of medicineCatalog(); track med.id) {
                          <option [value]="med.id">
                            {{ med.name }} ({{ med.activeIngredient }} {{ med.strength }})
                          </option>
                        }
                      </select>
                    </div>

                    <div class="rx-field">
                      <label>Liều dùng:</label>
                      <input
                        type="text"
                        [(ngModel)]="newRxDosage"
                        placeholder="1 viên x 2 lần/ngày (sáng, tối)"
                      />
                    </div>

                    <div class="rx-field days-field">
                      <label>Số ngày:</label>
                      <input
                        type="number"
                        [(ngModel)]="newRxDays"
                        (ngModelChange)="recalcQuantity()"
                      />
                    </div>

                    <div class="rx-field qty-field">
                      <label>Số lượng:</label>
                      <input type="number" [(ngModel)]="newRxQty" />
                    </div>

                    <div class="rx-action">
                      <button
                        type="button"
                        class="btn-add-rx"
                        [disabled]="!newRxMedicineId"
                        (click)="addPrescriptionItem()"
                      >
                        + Thêm vào đơn
                      </button>
                    </div>
                  </div>
                </div>
              }

              <!-- Prescriptions Table -->
              <div class="rx-table-wrap">
                <table class="rx-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên Thuốc & Hoạt Chất</th>
                      <th>Liều Lượng & Cách Dùng</th>
                      <th>Số Ngày</th>
                      <th>Số Lượng</th>
                      <th>Đơn Vị</th>
                      @if (!record().isLocked) {
                        <th>Xóa</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (rx of record().prescriptions; track rx.id; let i = $index) {
                      <tr>
                        <td>{{ i + 1 }}</td>
                        <td>
                          <strong>{{ rx.medicineName }}</strong>
                          <div class="text-muted text-xs">
                            {{ rx.activeIngredient }} • {{ rx.strength }}
                          </div>
                        </td>
                        <td>
                          <span>{{ rx.dosage }}</span>
                          @if (rx.instructions) {
                            <div class="text-xs text-muted">{{ rx.instructions }}</div>
                          }
                        </td>
                        <td>{{ rx.durationDays }} ngày</td>
                        <td class="font-bold">{{ rx.totalQuantity }}</td>
                        <td>{{ rx.unit }}</td>
                        @if (!record().isLocked) {
                          <td>
                            <button
                              type="button"
                              class="btn-del-rx"
                              (click)="removePrescription(rx.id)"
                              title="Xóa thuốc khỏi đơn"
                            >
                              <app-clinic-icon name="close" [size]="13"></app-clinic-icon>
                            </button>
                          </td>
                        }
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="text-center py-4 text-muted">
                          Chưa có thuốc nào trong đơn. Chọn thuốc ở bảng trên để thêm.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Doctor Advice & Follow-up Section -->
              <div class="rx-footer-grid mt-4">
                <div class="form-group flex-1">
                  <label class="field-label">Lời dặn của bác sĩ điều trị</label>
                  <textarea
                    rows="3"
                    class="clinic-textarea"
                    [disabled]="record().isLocked"
                    [ngModel]="record().doctorAdvice"
                    (ngModelChange)="updateAdvice($event)"
                    placeholder="Chế độ ăn uống, tập luyện, triệu chứng bất thường cần tái khám ngay..."
                  ></textarea>
                </div>

                <div class="form-group follow-up-box">
                  <label class="field-label">Hẹn tái khám sau (ngày)</label>
                  <input
                    type="number"
                    class="clinic-input"
                    [disabled]="record().isLocked"
                    [(ngModel)]="record().followUpDays"
                  />
                  <small class="text-muted mt-1">Dự kiến: 30 ngày sau</small>
                </div>
              </div>
            </section>
          }
        </div>
      </main>

      <!-- ==================== RIGHT COLUMN: PATIENT SUMMARY & TIMELINE ==================== -->
      <aside class="summary-column" [class.collapsed]="isSummaryCollapsed()">
        <button
          type="button"
          class="collapse-toggle-btn"
          (click)="isSummaryCollapsed.set(!isSummaryCollapsed())"
          [title]="isSummaryCollapsed() ? 'Mở rộng bảng tóm tắt' : 'Thu nhỏ bảng tóm tắt'"
        >
          <app-clinic-icon
            name="chevron-right"
            [size]="13"
            [style.transform]="isSummaryCollapsed() ? 'rotate(180deg)' : 'none'"
          ></app-clinic-icon>
        </button>

        @if (!isSummaryCollapsed()) {
          <div class="summary-inner">
            <!-- Profile Card -->
            <div class="profile-card">
              <div class="avatar-circle">
                {{ record().patientName.charAt(0) }}
              </div>
              <h4 class="profile-name">{{ record().patientName }}</h4>
              <span class="profile-code">{{ record().patientCode }}</span>
              <div class="profile-meta">
                <span>Tuổi: 42 (1982)</span>
                <span>•</span>
                <span>BHYT: DN479...</span>
              </div>
            </div>

            <!-- Allergy Banner Component -->
            <div class="allergy-section">
              <app-allergy-banner
                [allergies]="record().allergies || []"
              ></app-allergy-banner>
            </div>

            <!-- Medical History Timeline -->
            <div class="history-timeline-box">
              <h5 class="history-title font-serif">Bệnh Sử Khám Cũ</h5>
              <div class="history-timeline">
                <div class="tl-visit">
                  <span class="v-date">15/02/2026</span>
                  <strong class="v-diag">Tăng huyết áp vô căn (I10)</strong>
                  <p class="v-note">HA: 138/88 mmHg. Kê Amlodipine 5mg.</p>
                </div>
                <div class="tl-visit">
                  <span class="v-date">25/01/2026</span>
                  <strong class="v-diag">Rối loạn mỡ máu (E78)</strong>
                  <p class="v-note">Cholesterol 6.5 mmol/L. Dặn tập thể dục và giảm tinh bột.</p>
                </div>
                <div class="tl-visit">
                  <span class="v-date">10/01/2026</span>
                  <strong class="v-diag">Viêm phế quản cấp (J20)</strong>
                  <p class="v-note">Ho khan, sốt nhẹ 38°C. Điều trị khỏi sau 7 ngày.</p>
                </div>
              </div>
            </div>
          </div>
        }
      </aside>

      <!-- Drug Interaction Modal -->
      <app-drug-interaction-modal
        [isVisible]="showDdiModal()"
        [interactions]="currentInteractions()"
        (cancel)="showDdiModal.set(false)"
        (confirmOverride)="onConfirmDdiOverride()"
      ></app-drug-interaction-modal>
    </div>

    <!-- ==================== DEDICATED PRINTABLE EMR DOCUMENT ==================== -->
    <div class="printable-emr-document">
      <div class="print-header">
        <div class="header-left">
          <div class="org-name">SỞ Y TẾ TP. HỒ CHÍ MINH</div>
          <div class="clinic-brand-title">PHÒNG KHÁM ĐA KHOA QUỐC TẾ SMART CLINIC</div>
          <div class="clinic-sub-info">Hệ Thống Bệnh Án Điện Tử EMR Đạt Chuẩn HL7/FHIR</div>
          <div class="clinic-contact">Địa chỉ: 123 Nguyễn Văn Cừ, Quận 5, TP.HCM • Hotline: 1900 6868</div>
        </div>
        <div class="header-right">
          <div class="qr-placeholder-box">
            <div class="qr-code-text">MÃ HỒ SƠ EMR</div>
            <div class="emr-id-badge">{{ record().id || 'EMR-1792338761646' }}</div>
          </div>
          <div class="ticket-stamp">
            <span class="stamp-lbl">SỐ TIẾP NHẬN:</span>
            <span class="stamp-val">{{ record().ticketNumber }}</span>
          </div>
        </div>
      </div>

      <div class="print-title-section">
        <h1 class="print-doc-title">HỒ SƠ BỆNH ÁN KHÁM BỆNH ĐIỆN TỬ</h1>
        <p class="print-doc-sub">(Phiếu khám bệnh & Kết luận điều trị ngoại trú)</p>
        <div class="meta-strip">
          <span><strong>Ngày khám:</strong> {{ record().visitDate ? (record().visitDate | date: 'dd/MM/yyyy HH:mm') : '18/10/2026 22:52' }}</span>
          <span><strong>Phòng khám:</strong> {{ record().roomName || 'Phòng Khám Nội 101' }}</span>
          <span><strong>Bác sĩ khám:</strong> {{ record().doctorName }}</span>
          <span><strong>Phiên bản:</strong> v{{ record().version }}.0 (Đã ký EMR)</span>
        </div>
      </div>

      <!-- I. THÔNG TIN HÀNH CHÍNH -->
      <section class="print-section">
        <div class="section-title-bar">I. THÔNG TIN HÀNH CHÍNH BỆNH NHÂN</div>
        <div class="info-table-grid">
          <div class="grid-cell"><span>Họ và tên:</span> <strong>{{ record().patientName | uppercase }}</strong></div>
          <div class="grid-cell"><span>Mã bệnh nhân:</span> <strong>{{ record().patientCode }}</strong></div>
          <div class="grid-cell"><span>Ngày sinh:</span> {{ record().patientDob }} ({{ record().patientGender === 'MALE' ? 'Nam' : 'Nữ' }})</div>
          <div class="grid-cell"><span>Điện thoại:</span> 0912 345 678</div>
          <div class="grid-cell span-2"><span>Địa chỉ cư trú:</span> Quận 5, TP. Hồ Chí Minh</div>
          <div class="grid-cell span-2"><span>Chuyên khoa:</span> {{ record().department || 'Khám Nội Tổng Quát' }}</div>
        </div>
      </section>

      <!-- II. TIỀN SỬ DỊ ỨNG -->
      <section class="print-section">
        <div class="section-title-bar">II. TIỀN SỬ DỊ ỨNG & CẢNH BÁO LÂM SÀNG</div>
        <div class="allergy-print-box">
          <strong>Cảnh báo dị ứng:</strong>
          @if (record().allergies && record().allergies!.length > 0) {
            <span class="allergy-alert-text text-danger">{{ record().allergies!.join(' • ') }}</span>
          } @else {
            <span>Chưa ghi nhận tiền sử dị ứng thuốc hay thực phẩm.</span>
          }
        </div>
      </section>

      <!-- III. KHÁM LÂM SÀNG & SINH HIỆU -->
      <section class="print-section">
        <div class="section-title-bar">III. KHÁM LÂM SÀNG & CHỈ SỐ SINH HIỆU</div>
        <div class="print-row">
          <strong>Lý do vào khám:</strong> {{ record().chiefComplaint || 'Khám kiểm tra sức khỏe' }}
        </div>
        <div class="print-row mt-1">
          <strong>Bệnh sử & Diễn tiến:</strong>
          <span>{{ record().clinicalSymptoms || 'Bệnh tỉnh, tiếp xúc tốt. Da niêm hồng, tim đều rõ, phổi không rale. Bụng mềm không đau khu trú.' }}</span>
        </div>

        <table class="print-vitals-table mt-2">
          <thead>
            <tr>
              <th>Huyết Áp</th>
              <th>Nhịp Tim / Mạch</th>
              <th>Nhiệt Độ</th>
              <th>SpO2</th>
              <th>Chiều Cao</th>
              <th>Cân Nặng</th>
              <th>BMI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{{ record().vitals.bloodPressureSystolic }}/{{ record().vitals.bloodPressureDiastolic }}</strong> mmHg</td>
              <td><strong>{{ record().vitals.heartRate }}</strong> bpm</td>
              <td><strong>{{ record().vitals.temperature }}</strong> °C</td>
              <td><strong>{{ record().vitals.spo2 || 98 }}</strong> %</td>
              <td>{{ record().vitals.height }} cm</td>
              <td>{{ record().vitals.weight }} kg</td>
              <td><strong>{{ record().vitals.bmi }}</strong></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- IV. CHẨN ĐOÁN (ICD-10) -->
      <section class="print-section">
        <div class="section-title-bar">IV. CHẨN ĐOÁN XÁC ĐỊNH (ICD-10)</div>
        @if (record().preliminaryDiagnosis) {
          <div class="print-row mb-1">
            <strong>Chẩn đoán sơ bộ:</strong> {{ record().preliminaryDiagnosis }}
          </div>
        }
        <table class="print-data-table">
          <thead>
            <tr>
              <th style="width: 120px;">Mã ICD-10</th>
              <th>Tên Bệnh Lý / Chẩn Đoán</th>
              <th style="width: 150px;">Phân Loại</th>
            </tr>
          </thead>
          <tbody>
            @for (diag of record().diagnoses; track diag.code) {
              <tr>
                <td class="font-bold">{{ diag.code }}</td>
                <td>{{ diag.nameVi }}</td>
                <td>
                  @if (diag.isPrimary) {
                    <strong class="badge-primary-diag">Bệnh chính</strong>
                  } @else {
                    <span>Bệnh kèm theo</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="text-center text-muted">Chưa ghi nhận mã chẩn đoán ICD-10</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <!-- V. CẬN LÂM SÀNG & DỊCH VỤ -->
      @if (record().services && record().services.length > 0) {
        <section class="print-section">
          <div class="section-title-bar">V. DỊCH VỤ KỸ THUẬT & CẬN LÂM SÀNG</div>
          <table class="print-data-table">
            <thead>
              <tr>
                <th style="width: 100px;">Mã DV</th>
                <th>Tên Dịch Vụ / Kỹ Thuật</th>
                <th style="width: 140px;">Phân Loại</th>
                <th>Kết Quả / Tình Trạng</th>
              </tr>
            </thead>
            <tbody>
              @for (srv of record().services; track srv.id) {
                <tr>
                  <td class="font-bold">{{ srv.serviceCode }}</td>
                  <td>{{ srv.serviceName }}</td>
                  <td>{{ srv.category }}</td>
                  <td>
                    @if (srv.status === 'COMPLETED') {
                      <span>{{ srv.resultSummary || 'Bình thường' }}</span>
                    } @else {
                      <span class="text-muted">Đang chờ thực hiện</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      <!-- VI. ĐƠN THUỐC ĐIỀU TRỊ -->
      <section class="print-section">
        <div class="section-title-bar">VI. ĐƠN THUỐC ĐIỀU TRỊ</div>
        <table class="print-data-table">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Tên Thuốc & Hoạt Chất, Hàm Lượng</th>
              <th style="width: 80px;">Số Lượng</th>
              <th style="width: 60px;">Đơn Vị</th>
              <th>Liều Lượng & Cách Dùng</th>
            </tr>
          </thead>
          <tbody>
            @for (rx of record().prescriptions; track rx.id; let i = $index) {
              <tr>
                <td class="text-center">{{ i + 1 }}</td>
                <td>
                  <strong>{{ rx.medicineName }}</strong> ({{ rx.strength }})
                  <div class="rx-sub-text">Hoạt chất: {{ rx.activeIngredient }}</div>
                </td>
                <td class="text-center font-bold">{{ rx.totalQuantity }}</td>
                <td class="text-center">{{ rx.unit }}</td>
                <td>
                  <strong>{{ rx.dosage }}</strong>
                  @if (rx.instructions) {
                    <div class="rx-sub-text">{{ rx.instructions }}</div>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="text-center text-muted">Không có chỉ định thuốc trong lượt khám này.</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <!-- VII. LỜI DẶN & HẸN TÁI KHÁM -->
      <section class="print-section">
        <div class="section-title-bar">VII. LỜI DẶN BÁC SĨ & HẸN TÁI KHÁM</div>
        <div class="print-row">
          <strong>Lời dặn của bác sĩ:</strong>
          <span>{{ record().doctorAdvice || 'Nghỉ ngơi hợp lý, uống nhiều nước, dùng thuốc đúng liều theo đơn.' }}</span>
        </div>
        <div class="print-row mt-1">
          <strong>Lịch hẹn tái khám:</strong>
          <span>{{ record().followUpDays ? (record().followUpDays + ' ngày sau (hoặc tái khám ngay khi có triệu chứng bất thường)') : 'Tái khám khi có bất thường' }}</span>
        </div>
      </section>

      <!-- VIII. PHỤ LỤC (NẾU CÓ) -->
      @if (record().amendments && record().amendments.length > 0) {
        <section class="print-section">
          <div class="section-title-bar">VIII. PHỤ LỤC BỔ SUNG BỆNH ÁN (EMR AUDIT)</div>
          @for (amd of record().amendments; track amd.id) {
            <div class="amd-print-item">
              <strong>Phiên bản v{{ amd.version }}.0: {{ amd.reason }}</strong> ({{ amd.createdAt }} - BS. {{ amd.doctorName }})
              <p class="amd-print-content">{{ amd.addendumContent }}</p>
            </div>
          }
        </section>
      }

      <!-- SIGNATURE SECTION -->
      <div class="print-signatures-row">
        <div class="sig-block">
          <div class="sig-role">BỆNH NHÂN / ĐẠI DIỆN GIA ĐÌNH</div>
          <div class="sig-sub">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">{{ record().patientName }}</div>
        </div>

        <div class="sig-block">
          <div class="sig-date">Ngày {{ record().visitDate ? (record().visitDate | date: 'dd') : '18' }} tháng {{ record().visitDate ? (record().visitDate | date: 'MM') : '10' }} năm 2026</div>
          <div class="sig-role">BÁC SĨ ĐIỀU TRỊ</div>
          <div class="sig-sub">(Ký số điện tử & đóng dấu)</div>
          <div class="sig-space digital-stamp">
            <div class="stamp-box">
              <span class="s-valid">✓ CHỨNG THỰC EMR HỢP LỆ</span>
              <span class="s-signer">{{ record().doctorName }}</span>
              <span class="s-time">Ký lúc: {{ record().visitDate ? (record().visitDate | date: 'dd/MM/yyyy HH:mm') : '18/10/2026 22:52' }}</span>
            </div>
          </div>
          <div class="sig-name">{{ record().doctorName }}</div>
        </div>
      </div>

      <div class="print-footer-notice">
        <span>* Hồ sơ bệnh án điện tử được bảo mật và lưu trữ bất biến trên hệ thống cơ sở dữ liệu Smart Clinic EMR.</span>
        <span>Mã tra cứu: {{ record().id || 'EMR-1792338761646' }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .clinical-workspace {
        display: grid;
        grid-template-columns: 280px 1fr 310px;
        height: calc(100vh - 75px);
        overflow: hidden;
        background: #F6F3EC;
        gap: 1px;
        position: relative;
      }

      /* ====== LEFT COLUMN: QUEUE ====== */
      .queue-column {
        background: #FFFFFF;
        border-right: 1px solid #E4DED2;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .col-header {
        padding: 16px;
        border-bottom: 1px solid #E4DED2;
        background: #FAF8F5;

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .room-badge {
          font-size: 0.72rem;
          font-weight: 700;
          background: #0E4A55;
          color: #FFFFFF;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .count-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #8C6D34;
        }

        .col-title {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
          color: #1C2733;
        }

        .call-next-btn {
          width: 100%;
          background: #B8955A;
          color: #FFFFFF;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: #a38249;
          }
        }
      }

      .queue-list-container {
        padding: 14px 12px;
        overflow-y: auto;
        flex: 1;
      }

      .queue-category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
        padding: 0 4px;

        &.mt-cls {
          margin-top: 20px;
        }

        .category-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748B;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .badge-ready-pulse {
          font-size: 0.68rem;
          font-weight: 700;
          color: #065F46;
          background: #DEF7EC;
          border: 1.5px solid #31C48D;
          padding: 3px 8px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(6, 95, 70, 0.12);
        }
      }

      .dot-pulse-green-sm {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10B981;
        display: inline-block;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: beacon-green 1.8s infinite;
      }

      .queue-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        border-radius: 10px;
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        gap: 10px;

        &:hover {
          border-color: #0E4A55;
          background: #FFFFFF;
        }

        &.selected {
          border-color: #0E4A55;
          background: rgba(14, 74, 85, 0.06);
        }

        &.active-calling {
          border-color: #B8955A;
          background: rgba(184, 149, 90, 0.12);

          .q-ticket-number {
            background: #B8955A;
            color: #FFFFFF;
          }
        }

        &.completed {
          opacity: 0.75;
          background: #F4EFEB;

          .check-icon {
            color: #5E8B7E;
            font-weight: bold;
          }
        }

        /* Dedicated CLS Queue Card with High Contrast & 2-Tier Layout */
        &.cls-card {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 12px 14px;
          gap: 9px;
          border-radius: 12px;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.1);
          }

          &.selected {
            border-color: #0E4A55 !important;
            box-shadow: 0 0 0 2px rgba(14, 74, 85, 0.25), 0 6px 16px rgba(14, 74, 85, 0.12) !important;
          }

          /* RESULTS READY: BOLD EMERALD ACCENTS, CRISP WHITE BASE */
          &.results-ready {
            border-color: #34D399;
            border-left: 5px solid #059669;
            background: #FFFFFF;

            &:hover {
              background: #F0FDF4;
              border-color: #059669;
              box-shadow: 0 6px 18px rgba(5, 150, 105, 0.2);
            }

            .cls-ticket-badge {
              background: #047857;
              color: #FFFFFF;
              box-shadow: 0 2px 5px rgba(4, 120, 87, 0.3);
            }
          }

          /* WAITING RESULTS: BOLD AMBER ACCENTS, CRISP WHITE BASE */
          &.waiting-cls {
            border-color: #FBBF24;
            border-left: 5px solid #D97706;
            background: #FFFFFF;

            &:hover {
              background: #FFFBEB;
              border-color: #D97706;
              box-shadow: 0 6px 18px rgba(217, 119, 6, 0.2);
            }

            .cls-ticket-badge {
              background: #B45309;
              color: #FFFFFF;
              box-shadow: 0 2px 5px rgba(180, 83, 9, 0.3);
            }
          }

          /* ROW 1: Header (Ticket + Full Name + Ready Chip) */
          .cls-header-row {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;

            .cls-ticket-badge {
              font-size: 0.88rem;
              font-weight: 800;
              padding: 4px 9px;
              border-radius: 7px;
              letter-spacing: 0.5px;
              flex-shrink: 0;
            }

            .cls-patient-name {
              font-size: 0.94rem;
              font-weight: 700;
              color: #0F172A;
              flex: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .cls-ready-chip {
              font-size: 0.65rem;
              font-weight: 800;
              background: #DEF7EC;
              color: #03543F;
              border: 1px solid #84E1BC;
              padding: 2px 7px;
              border-radius: 999px;
              flex-shrink: 0;
              letter-spacing: 0.5px;
            }
          }

          /* ROW 2: Action Row (Progress Status + Button) */
          .cls-action-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;
            padding-top: 6px;
            border-top: 1px dashed #E2E8F0;

            .cls-progress-badge {
              .status-indicator {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 0.78rem;
                font-weight: 600;

                &.ready {
                  color: #047857;
                }

                &.waiting {
                  color: #B45309;
                }
              }
            }

            .btn-recall-action {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
              color: #FFFFFF;
              border: none;
              padding: 5px 12px;
              border-radius: 7px;
              font-size: 0.8rem;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(4, 120, 87, 0.35);
              transition: all 0.15s ease;
              white-space: nowrap;

              &:hover {
                background: linear-gradient(135deg, #047857 0%, #064E3B 100%);
                transform: translateY(-1.5px);
                box-shadow: 0 4px 12px rgba(4, 120, 87, 0.45);
              }

              &:active {
                transform: translateY(0);
              }
            }

            .btn-simulate-action {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              background: #FEF3C7;
              color: #92400E;
              border: 1.5px solid #F59E0B;
              padding: 4px 10px;
              border-radius: 7px;
              font-size: 0.76rem;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.15s ease;
              white-space: nowrap;

              &:hover {
                background: #FDE68A;
                color: #78350F;
                border-color: #D97706;
                box-shadow: 0 2px 6px rgba(217, 119, 6, 0.2);
              }

              &:active {
                transform: translateY(0);
              }
            }
          }
        }

        .q-ticket-number {
          font-size: 1rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(14, 74, 85, 0.1);
          color: #0E4A55;
        }

        .q-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .q-name {
            font-size: 0.86rem;
            font-weight: 600;
            color: #1C2733;
          }

          .q-sub {
            font-size: 0.72rem;
            color: #8C96A2;
          }
        }

        .quick-call-link {
          border: none;
          background: transparent;
          color: #B8955A;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 4px 6px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #B8955A;
        }
      }

      .badge-ready-pulse {
        font-size: 0.7rem;
        font-weight: 700;
        color: #065F46;
        background: #DEF7EC;
        border: 1.5px solid #31C48D;
        padding: 3px 9px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 1px 3px rgba(6, 95, 70, 0.15);
      }

      .dot-pulse-green {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #10B981;
        display: inline-block;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: beacon-green 1.8s infinite;
      }

      .dot-pulse-amber {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #F59E0B;
        display: inline-block;
      }

      @keyframes beacon-green {
        0% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }

      .cls-dispatch-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%);
        border: 1px solid #A7F3D0;
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 20px;
        gap: 16px;

        .dispatch-left {
          flex: 1;

          .dispatch-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.92rem;
            color: #065F46;
            margin-bottom: 4px;
          }

          .dispatch-desc {
            font-size: 0.8rem;
            color: #047857;
            line-height: 1.4;

            strong {
              color: #064E3B;
            }
          }
        }

        .dispatch-right {
          flex-shrink: 0;

          .btn-send-to-cls {
            background: linear-gradient(135deg, #0E4A55 0%, #155E6C 100%);
            color: #FFFFFF;
            border: none;
            padding: 9px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.84rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(14, 74, 85, 0.25);
            transition: all 0.2s ease;

            &:hover {
              transform: translateY(-1.5px);
              box-shadow: 0 6px 16px rgba(14, 74, 85, 0.35);
            }
          }

          .dispatched-tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            background: #FEF3C7;
            border: 1px solid #FDE68A;
            border-radius: 8px;
            font-size: 0.82rem;
            font-weight: 600;
            color: #B45309;

            &.success {
              background: #DCFCE7;
              border-color: #86EFAC;
              color: #065F46;
            }
          }
        }
      }

      .cls-state-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        margin: 12px 20px 0 20px;

        &.waiting {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          color: #92400E;
        }

        &.ready {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #065F46;
        }
      }

      .empty-queue-sub {
        font-size: 0.78rem;
        color: #8C96A2;
        padding: 8px;
        text-align: center;
      }

      /* ====== CENTER COLUMN: EXAMINATION WORKSPACE ====== */
      .examination-column {
        background: #FAF8F5;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .patient-banner {
        background: #FFFFFF;
        border-bottom: 1px solid #E4DED2;
        padding: 14px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }

      .banner-main {
        display: flex;
        align-items: center;
        gap: 16px;

        .ticket-tag {
          font-size: 1.8rem;
          font-weight: 700;
          color: #0E4A55;
          background: rgba(14, 74, 85, 0.08);
          border: 1.5px solid rgba(14, 74, 85, 0.2);
          padding: 4px 14px;
          border-radius: 10px;
        }

        .patient-id-block {
          .name-row {
            display: flex;
            align-items: center;
            gap: 10px;

            .patient-display-name {
              margin: 0;
              font-size: 1.35rem;
              font-weight: 600;
              color: #1C2733;
            }
          }

          .patient-meta-text {
            font-size: 0.82rem;
            color: #5B6672;
          }
        }
      }

      .banner-right {
        display: flex;
        align-items: center;
        gap: 16px;

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-save-draft {
          background: #FFFFFF;
          border: 1px solid #D5CDBD;
          color: #1C2733;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.84rem;
          cursor: pointer;

          &:hover {
            background: #FAF8F5;
          }
        }

        .btn-complete-lock {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.84rem;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(14, 74, 85, 0.25);

          &:hover {
            background: #135d6b;
          }
        }

        .btn-print-emr {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #0E4A55 0%, #155E6C 100%);
          color: #FFFFFF;
          border: 1px solid rgba(14, 74, 85, 0.4);
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.84rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(14, 74, 85, 0.25);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

          &:hover {
            background: linear-gradient(135deg, #135d6b 0%, #1a7182 100%);
            box-shadow: 0 6px 18px rgba(14, 74, 85, 0.38);
            transform: translateY(-1.5px);
            color: #FFFFFF;
          }

          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 6px rgba(14, 74, 85, 0.2);
          }
        }
      }

      .exam-tabs {
        display: flex;
        background: #FFFFFF;
        border-bottom: 1px solid #E4DED2;
        padding: 0 20px;
        overflow-x: auto;
      }

      .tab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border: none;
        padding: 12px 18px;
        font-size: 0.88rem;
        font-weight: 600;
        color: #5B6672;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.15s ease;
        white-space: nowrap;

        &:hover {
          color: #0E4A55;
        }

        &.active {
          color: #0E4A55;
          border-bottom-color: #0E4A55;
        }

        .tab-icon {
          font-size: 1rem;
        }

        .tab-count-badge {
          background: #EAE6DF;
          color: #1C2733;
          font-size: 0.72rem;
          padding: 1px 6px;
          border-radius: 10px;
        }

        .tab-alert-badge {
          background: #9B3D45;
          color: #FFFFFF;
          font-size: 0.72rem;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 700;
        }
      }

      .tab-content-area {
        flex: 1;
        overflow-y: auto;
        padding: 20px 24px;
      }

      .tab-pane {
        animation: fadeIn 0.2s ease;
      }

      .pane-section-title {
        font-size: 1.05rem;
        font-weight: 600;
        color: #1C2733;
        margin: 0 0 14px 0;
      }

      .vitals-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 14px;
      }

      .field-label {
        display: block;
        font-size: 0.84rem;
        font-weight: 600;
        color: #1C2733;
        margin-bottom: 6px;

        .req {
          color: #9B3D45;
        }
      }

      .clinic-input, .clinic-textarea {
        width: 100%;
        border: 1px solid #E2DCD0;
        border-radius: 12px;
        padding: 9px 14px;
        font-size: 0.88rem;
        color: #1C2733;
        background: #FFFFFF;
        outline: none;
        box-sizing: border-box;
        transition: all 0.2s ease;

        &:focus {
          border-color: #0E4A55;
          box-shadow: 0 0 0 3px rgba(14, 74, 85, 0.1);
        }

        &:disabled {
          background: #FAF8F5;
          color: #5B6672;
          cursor: not-allowed;
        }
      }

      .services-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;

        .btn-add-srv {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }
      }

      .service-catalog-card {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;

        .cat-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #8C96A2;
          margin-bottom: 10px;
        }

        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 10px;
        }

        .service-picker-item {
          border: 1px solid #E4DED2;
          border-radius: 8px;
          padding: 10px 12px;
          cursor: pointer;
          background: #FAF8F5;
          transition: all 0.15s;

          &:hover {
            border-color: #0E4A55;
            background: #FFFFFF;
          }

          .srv-badge {
            font-size: 0.65rem;
            color: #0E4A55;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .srv-name {
            display: block;
            font-size: 0.84rem;
            color: #1C2733;
            margin-bottom: 4px;
          }

          .srv-price {
            font-size: 0.78rem;
            color: #8C6D34;
            font-weight: 600;
          }

          .srv-add {
            float: right;
            font-size: 0.75rem;
            color: #0E4A55;
            font-weight: 700;
          }
        }
      }

      .services-table-wrap, .rx-table-wrap {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        overflow: hidden;
      }

      .services-table, .rx-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;

        th {
          background: #F4EFEB;
          padding: 10px 14px;
          text-align: left;
          color: #5B6672;
          font-weight: 600;
          font-size: 0.78rem;
        }

        td {
          padding: 10px 14px;
          border-top: 1px solid #F0EAE1;
          color: #1C2733;
        }

        .cat-pill {
          font-size: 0.7rem;
          background: #EAE6DF;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .srv-status-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: #8C6D34;

          &.done {
            color: #5E8B7E;
          }
        }

        .btn-mock-result {
          background: rgba(184, 149, 90, 0.15);
          color: #8C6D34;
          border: 1px solid rgba(184, 149, 90, 0.3);
          border-radius: 6px;
          font-size: 0.74rem;
          padding: 4px 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-remove-srv, .btn-del-rx {
          border: none;
          background: transparent;
          color: #9B3D45;
          cursor: pointer;
          font-size: 0.95rem;
        }
      }

      .rx-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
        flex-wrap: wrap;
        gap: 12px;

        .rx-sub {
          font-size: 0.78rem;
          color: #5B6672;
        }
      }

      .ddi-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(94, 139, 126, 0.12);
        color: #2F5A4F;
        border: 1px solid #5E8B7E;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;

        &.alert {
          background: rgba(155, 61, 69, 0.12);
          color: #9B3D45;
          border-color: #9B3D45;

          .btn-view-ddi {
            background: #9B3D45;
            color: #FFFFFF;
            border: none;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.72rem;
            cursor: pointer;
          }
        }
      }

      .allergy-critical-box {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #FFF5F5;
        border: 1px solid #9B3D45;
        border-radius: 10px;
        padding: 10px 14px;
        margin-bottom: 14px;
        color: #9B3D45;
        font-size: 0.84rem;

        .alert-icon {
          font-size: 1.2rem;
        }

        .alert-msg {
          margin: 0;
          font-weight: 600;
        }
      }

      .add-rx-panel {
        background: #FFFFFF;
        border: 1px solid #E4DED2;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 14px;
      }

      .rx-form-grid {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        flex-wrap: wrap;

        .rx-field {
          display: flex;
          flex-direction: column;
          gap: 4px;

          label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #5B6672;
          }

          select, input {
            border: 1px solid #D5CDBD;
            border-radius: 6px;
            padding: 7px 10px;
            font-size: 0.85rem;
            outline: none;
            background: #FAF8F5;

            &:focus {
              border-color: #0E4A55;
              background: #FFFFFF;
            }
          }

          &.drug-select {
            flex: 2;
            min-width: 240px;
          }

          &.days-field {
            width: 70px;
          }

          &.qty-field {
            width: 70px;
          }
        }

        .btn-add-rx {
          background: #0E4A55;
          color: #FFFFFF;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;

          &:disabled {
            background: #D5CDBD;
            cursor: not-allowed;
          }
        }
      }

      .rx-footer-grid {
        display: flex;
        gap: 16px;

        .follow-up-box {
          width: 180px;
        }
      }

      /* ====== RIGHT COLUMN: PATIENT SUMMARY & TIMELINE ====== */
      .summary-column {
        background: #FFFFFF;
        border-left: 1px solid #E4DED2;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        position: relative;
        transition: width 0.2s ease;

        &.collapsed {
          width: 32px;
          min-width: 32px;
        }
      }

      .collapse-toggle-btn {
        position: absolute;
        top: 14px;
        left: 4px;
        z-index: 10;
        background: #FAF8F5;
        border: 1px solid #D5CDBD;
        border-radius: 4px;
        cursor: pointer;
        padding: 4px 6px;
        font-size: 0.72rem;
        color: #5B6672;

        &:hover {
          background: #0E4A55;
          color: #FFFFFF;
        }
      }

      .summary-inner {
        padding: 16px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .profile-card {
        text-align: center;
        background: #FAF8F5;
        border: 1px solid #E4DED2;
        border-radius: 12px;
        padding: 16px;

        .avatar-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #0E4A55;
          color: #FFFFFF;
          font-size: 1.4rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px auto;
        }

        .profile-name {
          margin: 0;
          font-size: 1.1rem;
          color: #1C2733;
        }

        .profile-code {
          font-size: 0.75rem;
          color: #8C96A2;
          font-weight: 600;
        }

        .profile-meta {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 0.78rem;
          color: #5B6672;
        }
      }

      .history-timeline-box {
        .history-title {
          font-size: 0.95rem;
          color: #1C2733;
          margin: 0 0 10px 0;
        }
      }

      .history-timeline {
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-left: 2px solid #E4DED2;
        padding-left: 12px;
        margin-left: 6px;
      }

      .tl-visit {
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: -17px;
          top: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0E4A55;
        }

        .v-date {
          font-size: 0.7rem;
          color: #8C96A2;
          display: block;
        }

        .v-diag {
          font-size: 0.82rem;
          color: #1C2733;
          display: block;
        }

        .v-note {
          font-size: 0.76rem;
          color: #5B6672;
          margin: 2px 0 0 0;
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* ==================== PRINT STYLES ==================== */
      .printable-emr-document {
        display: none;
      }

      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 12mm 12mm;
        }

        /* Hide the entire interactive workspace UI */
        .clinical-workspace,
        .queue-column,
        .examination-column,
        .summary-column,
        .patient-banner,
        .exam-tabs,
        .tab-content-area,
        .action-buttons,
        .collapse-toggle-btn,
        .call-next-btn,
        app-drug-interaction-modal,
        nav,
        header,
        button {
          display: none !important;
        }

        /* Render clean hospital-grade printable EMR sheet */
        .printable-emr-document {
          display: block !important;
          width: 100% !important;
          background: #FFFFFF !important;
          color: #000000 !important;
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 13px !important;
          line-height: 1.45 !important;
        }

        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #000000;
          padding-bottom: 8px;
          margin-bottom: 12px;

          .header-left {
            .org-name {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .clinic-brand-title {
              font-size: 15px;
              font-weight: 700;
              color: #0E4A55;
              margin: 2px 0;
            }
            .clinic-sub-info {
              font-size: 11px;
              font-style: italic;
              color: #444444;
            }
            .clinic-contact {
              font-size: 11px;
              color: #333333;
              margin-top: 2px;
            }
          }

          .header-right {
            text-align: right;

            .emr-id-badge {
              font-family: monospace;
              font-size: 12px;
              font-weight: 700;
              background: #F0F0F0;
              padding: 2px 6px;
              border: 1px solid #CCCCCC;
              display: inline-block;
            }
            .qr-code-text {
              font-size: 10px;
              font-weight: 600;
              color: #555555;
            }
            .ticket-stamp {
              margin-top: 4px;
              .stamp-lbl {
                font-size: 11px;
                margin-right: 4px;
              }
              .stamp-val {
                font-size: 16px;
                font-weight: 700;
                color: #0E4A55;
              }
            }
          }
        }

        .print-title-section {
          text-align: center;
          margin-bottom: 12px;

          .print-doc-title {
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
            margin: 0;
            color: #000000;
          }

          .print-doc-sub {
            font-size: 12px;
            font-style: italic;
            margin: 2px 0 6px 0;
            color: #444444;
          }

          .meta-strip {
            display: flex;
            justify-content: center;
            gap: 16px;
            font-size: 11.5px;
            background: #F8F8F8;
            padding: 4px 10px;
            border: 1px solid #E0E0E0;
          }
        }

        .print-section {
          margin-bottom: 10px;
          page-break-inside: avoid;

          .section-title-bar {
            font-size: 12.5px;
            font-weight: 700;
            text-transform: uppercase;
            background: #EEEEEE;
            padding: 3px 6px;
            border-left: 4px solid #0E4A55;
            margin-bottom: 6px;
          }

          .print-row {
            font-size: 12.5px;
            line-height: 1.5;
          }

          .info-table-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 12px;
            font-size: 12.5px;

            .span-2 {
              grid-column: span 2;
            }
          }

          .allergy-print-box {
            font-size: 12.5px;
            padding: 4px 8px;
            background: #FFF8F8;
            border: 1px solid #FFD6D6;

            .text-danger {
              color: #B71C1C;
              font-weight: 700;
            }
          }
        }

        .print-vitals-table,
        .print-data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
          font-size: 12px;

          th, td {
            border: 1px solid #333333;
            padding: 4px 6px;
            text-align: left;
          }

          th {
            background: #F2F2F2;
            font-weight: 700;
            font-size: 11.5px;
          }

          .text-center {
            text-align: center;
          }

          .font-bold {
            font-weight: 700;
          }

          .badge-primary-diag {
            font-weight: 700;
            color: #0E4A55;
          }

          .rx-sub-text {
            font-size: 11px;
            color: #555555;
          }
        }

        .print-signatures-row {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
          page-break-inside: avoid;

          .sig-block {
            text-align: center;
            width: 240px;

            .sig-date {
              font-size: 12px;
              font-style: italic;
              margin-bottom: 3px;
            }
            .sig-role {
              font-size: 12.5px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .sig-sub {
              font-size: 11px;
              font-style: italic;
              color: #555555;
            }
            .sig-space {
              height: 55px;
              display: flex;
              align-items: center;
              justify-content: center;

              &.digital-stamp {
                .stamp-box {
                  border: 1.5px dashed #0E4A55;
                  background: #F0F7F8;
                  padding: 4px 8px;
                  border-radius: 4px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;

                  .s-valid {
                    color: #0E4A55;
                    font-size: 10.5px;
                    font-weight: 700;
                  }
                  .s-signer {
                    font-size: 11px;
                    font-weight: 600;
                  }
                  .s-time {
                    font-size: 9.5px;
                    color: #666666;
                  }
                }
              }
            }
            .sig-name {
              font-size: 13px;
              font-weight: 700;
            }
          }
        }

        .print-footer-notice {
          border-top: 1px dotted #888888;
          margin-top: 16px;
          padding-top: 4px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #666666;
          font-style: italic;
        }
      }
    `,
  ],
})
export class DoctorWorkspaceComponent implements OnInit {
  private medicalService = inject(MedicalService);
  private queueService = inject(QueueService);
  private notifService = inject(NotificationService);

  readonly record = this.medicalService.activeRecord;
  readonly icdCatalog = this.medicalService.icd10List;
  readonly medicineCatalog = this.medicalService.medicines;
  readonly availableServices = this.medicalService.availableServices;
  readonly currentInteractions = this.medicalService.currentInteractions;
  readonly allergyAlerts = this.medicalService.allergyWarnings;

  // Tabs state
  activeTab = signal<'vitals' | 'diagnosis' | 'services' | 'prescription'>('vitals');
  isSummaryCollapsed = signal(false);
  showServiceCatalog = signal(false);
  showDdiModal = signal(false);

  // Selected ticket tracking
  selectedTicketNumber = signal<string>('A-012');

  // Cassandra Vital History mock data
  vitalTrendsData: VitalHistoryPoint[] = [];

  // Prescription Form Model
  newRxMedicineId = '';
  newRxDosage = '1 viên/ngày (sau ăn)';
  newRxDays = 14;
  newRxQty = 14;

  ngOnInit(): void {
    this.loadVitalTrends();
  }

  loadVitalTrends(): void {
    this.medicalService.getVitalHistory(this.record().patientId).subscribe((data) => {
      this.vitalTrendsData = data;
    });
  }

  // Queue getters
  waitingTickets = () =>
    this.queueService.queueTickets().filter((t) => t.status === 'WAITING');

  waitingResultsTickets = () =>
    this.queueService
      .queueTickets()
      .filter((t) => t.status === 'WAITING_RESULTS' || t.status === 'RESULTS_READY');

  resultsReadyCount = () => this.queueService.resultsReadyCount();

  inProgressTicket = () =>
    this.queueService.queueTickets().find((t) => t.status === 'IN_PROGRESS');

  completedTickets = () =>
    this.queueService.queueTickets().filter((t) => t.status === 'COMPLETED');

  waitingCount = () => this.waitingTickets().length;

  completedServicesCount = () =>
    this.record().services.filter((s) => s.status === 'COMPLETED').length;

  onSendToClinicalServices(): void {
    this.medicalService.sendPatientToClinicalServices();
  }

  recallPatient(ticketNumber: string, patientName: string, patientId: string): void {
    this.queueService.recallPatientForResults(ticketNumber);
    this.selectedTicketNumber.set(ticketNumber);
    this.medicalService.loadRecordForTicket(ticketNumber, patientName, patientId);
    this.loadVitalTrends();
  }

  simulateLabComplete(ticketNumber: string): void {
    const ticket = this.queueService.queueTickets().find((t) => t.ticketNumber === ticketNumber);
    const total = ticket?.clinicalServicesTotal || 2;
    this.queueService.updateClinicalProgress(ticketNumber, total, total);

    if (this.record().ticketNumber === ticketNumber) {
      this.record().services.forEach((s) => {
        this.medicalService.updateServiceResult(
          s.id,
          'Kết quả: Chỉ số sinh hóa trong ngưỡng an toàn. Hình ảnh không phát hiện sang thương.'
        );
      });
    }

    this.notifService.sendNotification({
      userId: 'usr-doc-01',
      title: 'Đã có kết quả Cận lâm sàng',
      content: `Lượt khám ${ticketNumber} (${ticket?.patientName || 'Bệnh nhân'}) đã có đủ kết quả xét nghiệm/siêu âm. Sẵn sàng gọi lại vào phòng kết luận.`,
      type: 'MEDICAL_RECORD',
      channel: 'IN_APP',
    });
  }

  onCallNextPatient(): void {
    const next = this.queueService.callNextPatient();
    if (next) {
      this.selectedTicketNumber.set(next.ticketNumber);
      this.medicalService.loadRecordForTicket(next.ticketNumber, next.patientName, next.patientId);
      this.loadVitalTrends();
    }
  }

  callSpecificTicket(ticketId: string, ticketNumber: string, patientName: string, patientId: string): void {
    this.queueService.updateTicketStatus(ticketId, 'IN_PROGRESS');
    this.selectedTicketNumber.set(ticketNumber);
    this.medicalService.loadRecordForTicket(ticketNumber, patientName, patientId);
    this.loadVitalTrends();
  }

  selectPatient(ticketNumber: string, patientName: string, patientId: string): void {
    this.selectedTicketNumber.set(ticketNumber);
    this.medicalService.loadRecordForTicket(ticketNumber, patientName, patientId);
    this.loadVitalTrends();
  }

  // Vitals updates
  updateBpSystolic(val: number): void {
    this.medicalService.updateVitals({ bloodPressureSystolic: val });
  }

  updateBpDiastolic(val: number): void {
    this.medicalService.updateVitals({ bloodPressureDiastolic: val });
  }

  updateHeartRate(val: number): void {
    this.medicalService.updateVitals({ heartRate: val });
  }

  updateTemperature(val: number): void {
    this.medicalService.updateVitals({ temperature: val });
  }

  updateSpo2(val: number): void {
    this.medicalService.updateVitals({ spo2: val });
  }

  updateWeight(val: number): void {
    this.medicalService.updateVitals({ weight: val });
  }

  updateHeight(val: number): void {
    this.medicalService.updateVitals({ height: val });
  }

  // Clinical notes
  updateComplaint(val: string): void {
    this.medicalService.updateClinicalNotes('chiefComplaint', val);
  }

  updateSymptoms(val: string): void {
    this.medicalService.updateClinicalNotes('clinicalSymptoms', val);
  }

  updatePrelimDiagnosis(val: string): void {
    this.medicalService.updateClinicalNotes('preliminaryDiagnosis', val);
  }

  updateAdvice(val: string): void {
    this.medicalService.updateClinicalNotes('doctorAdvice', val);
  }

  // ICD-10
  onAddDiagnosis(item: any): void {
    this.medicalService.addDiagnosis(item);
  }

  onRemoveDiagnosis(code: string): void {
    this.medicalService.removeDiagnosis(code);
  }

  onSetPrimaryDiagnosis(code: string): void {
    this.medicalService.setPrimaryDiagnosis(code);
  }

  // Services
  orderService(service: ClinicalServiceOrder): void {
    this.medicalService.orderService(service);
    this.showServiceCatalog.set(false);
  }

  mockEnterResult(orderId: string): void {
    this.medicalService.updateServiceResult(
      orderId,
      'Chỉ số trong giới hạn sinh lý bình thường. Không phát hiện tổn thương bất thường.'
    );
  }

  removeService(orderId: string): void {
    this.medicalService.removeService(orderId);
  }

  // Prescription Form
  onSelectCatalogMedicine(medId: string): void {
    const med = this.medicineCatalog().find((m) => m.id === medId);
    if (med) {
      if (med.defaultDosage) this.newRxDosage = med.defaultDosage;
      this.recalcQuantity();
    }
  }

  recalcQuantity(): void {
    this.newRxQty = this.newRxDays * 1;
  }

  addPrescriptionItem(): void {
    const med = this.medicineCatalog().find((m) => m.id === this.newRxMedicineId);
    if (!med) return;

    this.medicalService.addPrescription({
      medicineId: med.id,
      medicineCode: med.code,
      medicineName: med.name,
      activeIngredient: med.activeIngredient,
      strength: med.strength,
      unit: med.unit,
      dosage: this.newRxDosage,
      durationDays: this.newRxDays,
      totalQuantity: this.newRxQty,
      instructions: `Uống theo chỉ dẫn, liệu trình ${this.newRxDays} ngày.`,
    });

    // Reset input
    this.newRxMedicineId = '';

    // Check if new addition triggered DDI
    if (this.currentInteractions().length > 0) {
      this.showDdiModal.set(true);
    }
  }

  removePrescription(id: string): void {
    this.medicalService.removePrescription(id);
  }

  onConfirmDdiOverride(): void {
    this.showDdiModal.set(false);
  }

  // Complete and Lock Record
  handleCompleteClick(): void {
    // If there are unconfirmed DDI interactions, prompt warning modal first
    if (this.currentInteractions().length > 0) {
      this.showDdiModal.set(true);
      return;
    }
    this.medicalService.completeAndLockRecord();

    // Thông báo cho bệnh nhân và thu ngân khi bệnh án được hoàn tất và khóa
    this.notifService.sendNotification({
      userId: this.record().patientId || 'usr-pat-01',
      title: 'Hồ sơ bệnh án điện tử (EMR) đã hoàn tất',
      content: `TS.BS ${this.record().doctorName} đã hoàn tất và ký số khóa bệnh án (Số phiếu: ${this.record().ticketNumber}). Bạn có thể xem kết luận và đơn thuốc.`,
      type: 'MEDICAL_RECORD',
      referenceId: this.record().id,
      channel: 'IN_APP',
    });
  }

  // Add amendment
  onAddAmendment(event: { reason: string; content: string }): void {
    this.medicalService.addAmendment(event.reason, event.content);
  }

  saveDraft(): void {
    this.medicalService.saveDraft();
  }

  printRecord(): void {
    window.print();
  }
}
