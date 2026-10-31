import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, Subject, of, catchError, debounceTime, map, switchMap, tap, throwError } from 'rxjs';
import {
  MedicalRecord,
  VitalSigns,
  Icd10Item,
  ClinicalServiceOrder,
  PrescriptionItem,
  DrugInteractionWarning,
  MedicalRecordAmendment,
  VitalHistoryPoint,
  MedicineItem,
} from '../models/medical-record.model';
import {
  MOCK_ICD10_LIST,
  MOCK_MEDICINES,
  MOCK_AVAILABLE_SERVICES,
  INITIAL_ACTIVE_RECORD,
} from '../mock-data/doctor-mock-data';
import { QueueService } from './queue.service';
import { NotificationService } from './notification.service';
import { AuthService, apiErrorMessage } from './auth.service';
import { ApiResponse, unwrap } from './api';
import { Patient } from '../models/patient.model';

/** Kết quả kiểm tra an toàn đơn thuốc từ backend (đồ thị dược lý Neo4j). */
interface SafetyReport {
  blocking: boolean;
  interactions: DrugInteractionWarning[];
  contraindications: { drug: string; ingredient: string; icdCode: string; diseaseName: string; reason: string }[];
  allergyAlerts: { drug: string; ingredient: string; matchedBy: string; allergyNote: string }[];
  unknownDrugs: string[];
}

interface VitalPointDto {
  recordedAt: string;
  vitals: { bloodPressure: string; heartRate: number; temperature: number; weight: number; height: number; bmi: number };
}

@Injectable({
  providedIn: 'root',
})
export class MedicalService {
  private queueService = inject(QueueService);
  private notifService = inject(NotificationService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  /** Kết quả kiểm tra an toàn đơn thuốc gần nhất (Neo4j). */
  private safetyReport = signal<SafetyReport | null>(null);
  private safetyCheck$ = new Subject<void>();

  // Active Medical Record Signal
  private activeRecordSignal = signal<MedicalRecord>(INITIAL_ACTIVE_RECORD);
  readonly activeRecord = this.activeRecordSignal.asReadonly();

  // Completed records storage (EMR Archive)
  private recordsArchiveSignal = signal<MedicalRecord[]>([]);
  readonly recordsArchive = this.recordsArchiveSignal.asReadonly();

  // Catalogs
  readonly icd10List = signal<Icd10Item[]>(MOCK_ICD10_LIST);
  readonly medicines = signal<MedicineItem[]>(MOCK_MEDICINES);
  readonly availableServices = signal<ClinicalServiceOrder[]>(MOCK_AVAILABLE_SERVICES);

  /** Tương tác thuốc - thuốc trong đơn hiện tại (truy vấn đồ thị Neo4j qua backend). */
  readonly currentInteractions = computed<DrugInteractionWarning[]>(() => {
    const prescriptions = this.activeRecordSignal().prescriptions;
    if (!prescriptions || prescriptions.length < 2) return [];
    // Backend trả về mã thuốc đã gửi đi; hiển thị lại bằng tên thuốc trong đơn
    const nameOf = (term: string) =>
      prescriptions.find((p) => p.medicineCode === term)?.medicineName ?? term;
    return (this.safetyReport()?.interactions ?? []).map((i) => ({
      ...i,
      drugA: nameOf(i.drugA),
      drugB: nameOf(i.drugB),
    }));
  });

  /** Cảnh báo dị ứng (theo hoạt chất / nhóm thuốc) và chống chỉ định theo bệnh nền. */
  readonly allergyWarnings = computed<string[]>(() => {
    if (!this.activeRecordSignal().prescriptions?.length) return [];
    const report = this.safetyReport();
    if (!report) return [];
    return [
      ...report.allergyAlerts.map(
        (a) => `CẢNH BÁO DỊ ỨNG: Tiền sử "${a.allergyNote}" trùng với thuốc "${a.drug}" (${a.ingredient} – nhóm ${a.matchedBy})!`
      ),
      ...report.contraindications.map(
        (c) => `CHỐNG CHỈ ĐỊNH: ${c.drug} (${c.ingredient}) với ${c.icdCode} – ${c.diseaseName}: ${c.reason}`
      ),
    ];
  });

  constructor() {
    // Mỗi khi đơn thuốc / chẩn đoán thay đổi → kiểm tra lại trên đồ thị (gộp các thay đổi liên tiếp)
    this.safetyCheck$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          const record = this.activeRecordSignal();
          if (!record.prescriptions?.length) return of(null);
          return unwrap(
            this.http.post<ApiResponse<SafetyReport>>('/api/prescriptions/safety-check', {
              drugs: record.prescriptions.map((p) => p.medicineCode || p.medicineName),
              patientId: record.patientId,
              icdCodes: record.diagnoses.map((d) => d.code),
              allergies: record.allergies ?? [],
            })
          ).pipe(catchError(() => of(null)));
        })
      )
      .subscribe((report) => this.safetyReport.set(report));

    effect(() => {
      const record = this.activeRecordSignal();
      record.prescriptions?.length;
      record.diagnoses?.length;
      this.safetyCheck$.next();
    });
  }

  /**
   * Load record for specific patient/ticket
   */
  loadRecordForTicket(ticketNumber: string, patientName: string, patientId: string): void {
    const current = this.activeRecordSignal();
    // If same ticket, don't re-create
    if (current.ticketNumber === ticketNumber && current.patientId === patientId && !current.isLocked) {
      return;
    }

    // Check if in archive
    const existing = this.recordsArchiveSignal().find((r) => r.ticketNumber === ticketNumber);
    if (existing) {
      this.activeRecordSignal.set(existing);
      return;
    }

    // Initialize new record
    const newRecord: MedicalRecord = {
      id: `EMR-${Date.now()}`,
      visitId: `VISIT-${ticketNumber}`,
      patientId: patientId || 'PAT-NEW',
      patientName: patientName || 'Bệnh nhân',
      patientDob: '01/01/1985',
      patientGender: 'MALE',
      patientCode: `BN-${ticketNumber}`,
      ticketNumber: ticketNumber,
      doctorId: this.auth.currentUser()?.id ?? 'usr-doc-01',
      doctorName: this.auth.currentUser()?.fullName ?? 'Bác sĩ khám',
      department: 'Nội tổng quát',
      roomName: 'Phòng khám Nội 101',
      visitDate: new Date().toISOString(),
      chiefComplaint: '',
      clinicalSymptoms: '',
      allergies: [],
      vitals: {
        temperature: 36.8,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 75,
        respiratoryRate: 18,
        weight: 65,
        height: 168,
        bmi: 23.03,
        spo2: 98,
        measuredAt: new Date().toISOString(),
      },
      diagnoses: [],
      services: [],
      prescriptions: [],
      doctorAdvice: '',
      followUpDays: 14,
      isLocked: false,
      status: 'IN_PROGRESS',
      version: 1,
      amendments: [],
    };

    this.activeRecordSignal.set(newRecord);

    // Bổ sung thông tin thật từ hồ sơ bệnh nhân (MongoDB): mã BN, ngày sinh, giới tính, dị ứng
    if (patientId) {
      unwrap(this.http.get<ApiResponse<Patient>>(`/api/patients/${patientId}`))
        .pipe(catchError(() => of(null)))
        .subscribe((patient) => {
          if (!patient) return;
          this.activeRecordSignal.update((r) =>
            r.id !== newRecord.id
              ? r
              : {
                  ...r,
                  patientCode: patient.patientCode,
                  patientName: patient.fullName,
                  patientDob: patient.dateOfBirth,
                  patientGender: patient.gender === 'NAM' ? 'MALE' : 'FEMALE',
                  allergies: patient.allergyHistory
                    ? patient.allergyHistory.split(/,\s*/).filter((a) => a.trim().length > 0)
                    : [],
                }
          );
        });
    }
  }

  /**
   * Update Vital Signs and recalculate BMI automatically
   */
  updateVitals(vitalsUpdate: Partial<VitalSigns>): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;

      const newVitals = { ...record.vitals, ...vitalsUpdate };
      if (newVitals.height && newVitals.weight && newVitals.height > 0) {
        const heightM = newVitals.height / 100;
        newVitals.bmi = parseFloat((newVitals.weight / (heightM * heightM)).toFixed(2));
      }
      return { ...record, vitals: newVitals };
    });
  }

  /**
   * Update clinical text (Chief complaint, symptoms, advice)
   */
  updateClinicalNotes(field: 'chiefComplaint' | 'clinicalSymptoms' | 'preliminaryDiagnosis' | 'doctorAdvice', value: string): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;
      return { ...record, [field]: value };
    });
  }

  /**
   * Add ICD-10 diagnosis
   */
  addDiagnosis(icd: Icd10Item): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;
      if (record.diagnoses.some((d) => d.code === icd.code)) return record;

      const isFirst = record.diagnoses.length === 0;
      return {
        ...record,
        diagnoses: [...record.diagnoses, { ...icd, isPrimary: isFirst }],
      };
    });
  }

  /**
   * Remove ICD-10 diagnosis
   */
  removeDiagnosis(code: string): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;
      const updated = record.diagnoses.filter((d) => d.code !== code);
      if (updated.length > 0 && !updated.some((d) => d.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return { ...record, diagnoses: updated };
    });
  }

  /**
   * Set primary diagnosis
   */
  setPrimaryDiagnosis(code: string): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;
      const updated = record.diagnoses.map((d) => ({
        ...d,
        isPrimary: d.code === code,
      }));
      return { ...record, diagnoses: updated };
    });
  }

  /**
   * Order a clinical / lab service
   */
  orderService(service: ClinicalServiceOrder): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;
      const newOrder: ClinicalServiceOrder = {
        ...service,
        id: `SRV-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        status: 'ORDERED',
      };
      return { ...record, services: [...record.services, newOrder] };
    });
  }

  /**
   * Chuyển bệnh nhân đi làm Cận Lâm Sàng (Tạm lưu Draft, cập nhật Queue sang WAITING_RESULTS)
   */
  sendPatientToClinicalServices(): void {
    const record = this.activeRecordSignal();
    if (!record.services || record.services.length === 0) return;

    this.activeRecordSignal.update((r) => ({
      ...r,
      status: 'WAITING_RESULTS',
    }));

    this.queueService.sendToClinicalServices(record.ticketNumber, record.services.length);

    this.notifService.sendNotification({
      userId: record.patientId || 'usr-pat-01',
      title: 'Chỉ định cận lâm sàng',
      content: `Bác sĩ ${record.doctorName} đã chỉ định ${record.services.length} dịch vụ kỹ thuật. Vui lòng di chuyển đến các phòng chức năng để thực hiện.`,
      type: 'QUEUE',
      referenceId: record.id,
      channel: 'IN_APP',
    });
  }

  /**
   * Update service result (Simulate lab return)
   * Tự động tính toán tiến độ: khi đủ tất cả dịch vụ sẽ chuyển sang RESULTS_READY và bắn notification
   */
  updateServiceResult(orderId: string, resultSummary: string): void {
    this.activeRecordSignal.update((record) => {
      const updatedServices = record.services.map((s) => {
        if (s.id === orderId) {
          return {
            ...s,
            resultSummary,
            status: 'COMPLETED' as const,
            completedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            performedBy: 'KTV. Phòng Xét Nghiệm / CĐHA',
          };
        }
        return s;
      });

      const doneCount = updatedServices.filter((s) => s.status === 'COMPLETED').length;
      const totalCount = updatedServices.length;
      const isAllDone = totalCount > 0 && doneCount >= totalCount;

      // Cập nhật tiến độ hàng đợi Real-time
      this.queueService.updateClinicalProgress(record.ticketNumber, doneCount, totalCount);

      if (isAllDone) {
        // Thông báo đến Bác sĩ
        this.notifService.sendNotification({
          userId: record.doctorId || 'usr-doc-01',
          title: 'Đã có đầy đủ kết quả CLS',
          content: `Bệnh nhân ${record.patientName} (${record.ticketNumber}) đã hoàn thành đủ ${totalCount}/${totalCount} dịch vụ cận lâm sàng. Sẵn sàng gọi vào phòng kết luận.`,
          type: 'MEDICAL_RECORD',
          referenceId: record.id,
          channel: 'IN_APP',
        });

        // Thông báo đến Bệnh nhân
        this.notifService.sendNotification({
          userId: record.patientId || 'usr-pat-01',
          title: 'Kết quả cận lâm sàng đã có',
          content: `Kết quả cận lâm sàng của bạn đã hoàn tất. Mời bạn quay trở lại ${record.roomName} để Bác sĩ đọc kết quả và kết luận.`,
          type: 'MEDICAL_RECORD',
          referenceId: record.id,
          channel: 'IN_APP',
        });
      }

      return {
        ...record,
        services: updatedServices,
        status: isAllDone ? 'RESULTS_READY' : record.status,
      };
    });
  }

  /**
   * Remove ordered service (only if not completed)
   */
  removeService(orderId: string): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;
      return {
        ...record,
        services: record.services.filter((s) => s.id !== orderId),
      };
    });
  }

  /**
   * Add prescription item
   */
  addPrescription(item: Omit<PrescriptionItem, 'id'>): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;
      const newRx: PrescriptionItem = {
        ...item,
        id: `RX-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      };
      return {
        ...record,
        prescriptions: [...record.prescriptions, newRx],
      };
    });
  }

  /**
   * Remove prescription item
   */
  removePrescription(id: string): void {
    this.activeRecordSignal.update((record) => {
      if (record.isLocked) return record;
      return {
        ...record,
        prescriptions: record.prescriptions.filter((p) => p.id !== id),
      };
    });
  }

  /**
   * Check interactions for any pair of medicines
   */
  checkDdi(prescriptions: PrescriptionItem[]): DrugInteractionWarning[] {
    if (!prescriptions || prescriptions.length < 2) return [];
    return this.safetyReport()?.interactions ?? [];
  }

  /**
   * Save draft record
   */
  saveDraft(): Observable<boolean> {
    return of(true);
  }

  /**
   * Complete and Lock EMR Record
   * Status transitions to COMPLETED, isLocked becomes true.
   * Queue ticket transitions from IN_PROGRESS to COMPLETED.
   */
  completeAndLockRecord(): Observable<MedicalRecord> {
    const current = this.activeRecordSignal();
    const v = current.vitals;
    const payload = {
      visitId: current.visitId,
      patientId: current.patientId,
      department: current.department,
      doctorName: current.doctorName,
      roomName: current.roomName,
      chiefComplaint: current.chiefComplaint,
      clinicalSymptoms: current.clinicalSymptoms,
      vitals: {
        bloodPressure: `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`,
        heartRate: v.heartRate,
        temperature: v.temperature,
        weight: v.weight,
        height: v.height,
        bmi: v.bmi,
        spo2: v.spo2,
      },
      diagnoses: current.diagnoses.map((d) => ({ code: d.code, nameVi: d.nameVi, isPrimary: !!d.isPrimary })),
      services: current.services.map((sv) => ({
        category: sv.category,
        name: sv.serviceName,
        result: sv.resultSummary,
        price: sv.price,
        status: sv.status,
      })),
      prescriptions: current.prescriptions.map((rx) => ({
        name: rx.medicineName,
        strength: rx.strength,
        dosage: rx.dosage,
        quantity: rx.totalQuantity,
        unit: rx.unit,
        instructions: rx.instructions,
      })),
      doctorAdvice: current.doctorAdvice,
      followUpDays: current.followUpDays,
    };

    // Lưu bệnh án (MongoDB, sinh hiệu ghi thêm vào Cassandra) rồi khóa – mỗi bước được ghi audit log
    const result = new ReplaySubject<MedicalRecord>(1);
    unwrap(this.http.post<ApiResponse<{ id: string }>>('/api/records', payload))
      .pipe(
        switchMap((saved) => unwrap(this.http.patch<ApiResponse<{ id: string }>>(`/api/records/${saved.id}/lock`, {}))),
        map((locked): MedicalRecord => ({
          ...current,
          id: locked.id,
          status: 'COMPLETED',
          isLocked: true,
          completedAt: new Date().toISOString(),
        })),
        tap((completedRecord) => {
          this.activeRecordSignal.set(completedRecord);
          this.recordsArchiveSignal.update((archive) => [
            completedRecord,
            ...archive.filter((r) => r.id !== completedRecord.id),
          ]);
          const ticket = this.queueService.queueTickets().find((t) => t.ticketNumber === current.ticketNumber);
          if (ticket) {
            this.queueService.updateTicketStatus(ticket.id, 'COMPLETED');
          }
        }),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Không lưu được bệnh án.'))))
      )
      .subscribe(result);
    return result.asObservable();
  }

  /**
   * Add amendment / supplementary version to locked EMR
   * Strictly no direct overwrite of past medical data; append audit addendum.
   */
  addAmendment(reason: string, addendumContent: string): Observable<MedicalRecordAmendment> {
    const current = this.activeRecordSignal();
    const newVersion = (current.version || 1) + 1;
    const newAmendment: MedicalRecordAmendment = {
      id: `AMD-${Date.now()}`,
      version: newVersion,
      createdAt: new Date().toLocaleString('vi-VN'),
      doctorName: current.doctorName || 'TS.BS Trần Minh Hoàng',
      reason,
      addendumContent,
    };

    const updatedRecord: MedicalRecord = {
      ...current,
      version: newVersion,
      amendments: [...current.amendments, newAmendment],
    };

    this.activeRecordSignal.set(updatedRecord);

    // Update archive
    this.recordsArchiveSignal.update((archive) =>
      archive.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );

    return of(newAmendment);
  }

  /**
   * Get vital trends time-series for a patient (Simulates Cassandra query)
   */
  getVitalHistory(patientId: string): Observable<VitalHistoryPoint[]> {
    return unwrap(
      this.http.get<ApiResponse<VitalPointDto[]>>(`/api/records/patient/${patientId}/vitals-history?limit=12`)
    ).pipe(
      map((points) =>
        points
          .slice()
          .reverse() // Cassandra trả mới nhất trước; biểu đồ vẽ từ cũ đến mới
          .map((p) => {
            const [systolic, diastolic] = (p.vitals.bloodPressure || '0/0').split('/').map((x) => Number(x) || 0);
            return {
              date: new Date(p.recordedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              systolic,
              diastolic,
              heartRate: p.vitals.heartRate,
              temperature: p.vitals.temperature,
              bmi: p.vitals.bmi,
              weight: p.vitals.weight,
            };
          })
      ),
      catchError(() => of([]))
    );
  }
}
