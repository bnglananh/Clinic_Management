import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, ReplaySubject, of, catchError, map, tap, throwError } from 'rxjs';
import { Patient } from '../models/patient.model';
import { ApiResponse, unwrap } from './api';
import { AuthService, apiErrorMessage } from './auth.service';

/** Hồ sơ bệnh nhân (MongoDB collection patients) – dành cho lễ tân, bác sĩ, quản trị. */
@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private patientsSignal = signal<Patient[]>([]);
  public readonly patients = this.patientsSignal.asReadonly();

  constructor() {
    effect(() => {
      const role = this.auth.currentRole();
      if (role && role !== 'PATIENT') {
        this.getPatients().subscribe();
      } else {
        this.patientsSignal.set([]);
      }
    });
  }

  /** Tìm theo tên / mã BN / SĐT / CCCD (tìm kiếm chạy trên MongoDB). */
  getPatients(searchQuery?: string): Observable<Patient[]> {
    const q = searchQuery?.trim();
    const params = q ? new HttpParams().set('q', q) : undefined;
    return unwrap(this.http.get<ApiResponse<Patient[]>>('/api/patients', { params })).pipe(
      tap((list) => {
        if (!q) this.patientsSignal.set(list);
      }),
      catchError(() => of(q ? [] : this.patientsSignal()))
    );
  }

  getPatientById(id: string): Observable<Patient | undefined> {
    return unwrap(this.http.get<ApiResponse<Patient>>(`/api/patients/${id}`)).pipe(
      map((p) => p ?? undefined),
      catchError(() => of(undefined))
    );
  }

  /** Kiểm tra nhanh trên danh sách đã tải; backend vẫn kiểm tra lại khi lưu (BR-03). */
  checkDuplicateCccd(cccd: string, excludeId?: string): boolean {
    const cleaned = cccd.trim();
    return this.patientsSignal().some(
      (p) => p.cccd === cleaned && (!excludeId || p.id !== excludeId)
    );
  }

  checkDuplicatePhone(phone: string, excludeId?: string): boolean {
    const cleaned = phone.replace(/\s+/g, '');
    return this.patientsSignal().some(
      (p) => p.phone?.replace(/\s+/g, '') === cleaned && (!excludeId || p.id !== excludeId)
    );
  }

  createPatient(data: Omit<Patient, 'id' | 'patientCode' | 'createdAt' | 'totalVisits'>): Observable<Patient> {
    return this.eager(
      unwrap(this.http.post<ApiResponse<Patient>>('/api/patients', data)).pipe(
        tap((created) => this.patientsSignal.update((list) => [created, ...list])),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err))))
      )
    );
  }

  updatePatient(id: string, updates: Partial<Patient>): Observable<Patient | null> {
    return this.eager(
      unwrap(this.http.put<ApiResponse<Patient>>(`/api/patients/${id}`, updates)).pipe(
        tap((updated) =>
          this.patientsSignal.update((list) => list.map((p) => (p.id === id ? updated : p)))
        ),
        map((p): Patient | null => p),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err))))
      )
    );
  }

  private eager<T>(source: Observable<T>): Observable<T> {
    const result = new ReplaySubject<T>(1);
    source.subscribe(result);
    return result.asObservable();
  }
}
