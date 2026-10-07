import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
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
  MOCK_DRUG_INTERACTIONS,
  MOCK_AVAILABLE_SERVICES,
  MOCK_VITAL_HISTORY,
  INITIAL_ACTIVE_RECORD,
} from '../mock-data/doctor-mock-data';
import { QueueService } from './queue.service';

@Injectable({
  providedIn: 'root',
})
export class MedicalService {
  private queueService = inject(QueueService);

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

  // Computed: Detect Drug-Drug Interactions in current prescription
  readonly currentInteractions = computed<DrugInteractionWarning[]>(() => {
    const record = this.activeRecordSignal();
    const prescriptions = record.prescriptions;
    if (!prescriptions || prescriptions.length < 2) return [];

    const activeIngredients = prescriptions.map((p) => p.activeIngredient.toLowerCase());
    const warnings: DrugInteractionWarning[] = [];

    for (const rule of MOCK_DRUG_INTERACTIONS) {
      const drugA = rule.drugA.toLowerCase();
      const drugB = rule.drugB.toLowerCase();
      const hasA = activeIngredients.some((ing) => ing.includes(drugA));
      const hasB = activeIngredients.some((ing) => ing.includes(drugB));

      if (hasA && hasB) {
        warnings.push(rule);
      }
    }

    return warnings;
  });

  // Computed: Allergy check
  readonly allergyWarnings = computed<string[]>(() => {
    const record = this.activeRecordSignal();
    const allergies = record.allergies || [];
    const prescriptions = record.prescriptions || [];
    const alerts: string[] = [];

    for (const allergy of allergies) {
      const lowerAllergy = allergy.toLowerCase();
      for (const rx of prescriptions) {
        if (
          rx.medicineName.toLowerCase().includes(lowerAllergy) ||
          rx.activeIngredient.toLowerCase().includes(lowerAllergy) ||
          (lowerAllergy.includes('penicillin') && rx.activeIngredient.toLowerCase().includes('amoxicillin')) ||
          (lowerAllergy.includes('aspirin') && rx.activeIngredient.toLowerCase().includes('aspirin'))
        ) {
          alerts.push(
            `CẢNH BÁO DỊ ỨNG: Bệnh nhân có tiền sử dị ứng với "${allergy}", trùng với thuốc "${rx.medicineName}" (${rx.activeIngredient})!`
          );
        }
      }
    }
    return alerts;
  });

  /**
   * Load record for specific patient/ticket
   */
  loadRecordForTicket(ticketNumber: string, patientName: string, patientId: string): void {
    const current = this.activeRecordSignal();
    // If same ticket, don't re-create
    if (current.ticketNumber === ticketNumber && !current.isLocked) {
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
      doctorId: 'DOC-01',
      doctorName: 'TS.BS Trần Minh Hoàng',
      department: 'Nội tổng quát',
      roomName: 'Phòng khám Nội 101',
      visitDate: new Date().toISOString(),
      chiefComplaint: '',
      clinicalSymptoms: '',
      allergies: ['Penicillin (Phát ban)'],
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
   * Update service result (Simulate lab return)
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
      return { ...record, services: updatedServices };
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
    const activeIngredients = prescriptions.map((p) => p.activeIngredient.toLowerCase());
    const warnings: DrugInteractionWarning[] = [];

    for (const rule of MOCK_DRUG_INTERACTIONS) {
      const drugA = rule.drugA.toLowerCase();
      const drugB = rule.drugB.toLowerCase();
      const hasA = activeIngredients.some((ing) => ing.includes(drugA));
      const hasB = activeIngredients.some((ing) => ing.includes(drugB));

      if (hasA && hasB) {
        warnings.push(rule);
      }
    }
    return warnings;
  }

  /**
   * Save draft record
   */
  saveDraft(): Observable<boolean> {
    return of(true);
  }

  /**
   * Complete and Lock EMR Record (BR-23)
   * Status transitions to COMPLETED, isLocked becomes true.
   * Queue ticket transitions from IN_PROGRESS to COMPLETED.
   */
  completeAndLockRecord(): Observable<MedicalRecord> {
    const current = this.activeRecordSignal();
    const completedRecord: MedicalRecord = {
      ...current,
      status: 'COMPLETED',
      isLocked: true,
      completedAt: new Date().toISOString(),
    };

    this.activeRecordSignal.set(completedRecord);

    // Save to archive
    this.recordsArchiveSignal.update((archive) => {
      const filtered = archive.filter((r) => r.id !== completedRecord.id);
      return [completedRecord, ...filtered];
    });

    // Update queue status in QueueService to COMPLETED
    const ticket = this.queueService.queueTickets().find((t) => t.ticketNumber === current.ticketNumber);
    if (ticket) {
      this.queueService.updateTicketStatus(ticket.id, 'COMPLETED');
    }

    return of(completedRecord);
  }

  /**
   * Add amendment / supplementary version to locked EMR (BR-23)
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
    const history = MOCK_VITAL_HISTORY[patientId] || [
      { date: '01/01/2026', systolic: 130, diastolic: 85, heartRate: 80, temperature: 36.7, bmi: 23.0, weight: 67 },
      { date: '15/01/2026', systolic: 125, diastolic: 82, heartRate: 78, temperature: 36.6, bmi: 23.2, weight: 67.5 },
      { date: '01/02/2026', systolic: 122, diastolic: 80, heartRate: 75, temperature: 36.8, bmi: 23.1, weight: 67.2 },
      { date: '20/02/2026', systolic: 128, diastolic: 84, heartRate: 79, temperature: 36.7, bmi: 23.3, weight: 67.8 },
      { date: '05/03/2026', systolic: 120, diastolic: 80, heartRate: 74, temperature: 36.5, bmi: 23.0, weight: 67.0 },
    ];
    return of(history);
  }
}
