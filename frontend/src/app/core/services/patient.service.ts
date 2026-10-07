import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Patient } from '../models/patient.model';
import { MOCK_PATIENTS } from '../mock-data/reception-mock-data';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private patientsSignal = signal<Patient[]>(MOCK_PATIENTS);
  public readonly patients = this.patientsSignal.asReadonly();

  getPatients(searchQuery?: string): Observable<Patient[]> {
    let list = this.patientsSignal();
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.cccd.includes(q) ||
          p.phone.includes(q) ||
          p.patientCode.toLowerCase().includes(q)
      );
    }
    return of(list).pipe(delay(250));
  }

  getPatientById(id: string): Observable<Patient | undefined> {
    const found = this.patientsSignal().find((p) => p.id === id);
    return of(found).pipe(delay(150));
  }

  checkDuplicateCccd(cccd: string, excludeId?: string): boolean {
    const cleaned = cccd.trim();
    return this.patientsSignal().some(
      (p) => p.cccd === cleaned && (!excludeId || p.id !== excludeId)
    );
  }

  checkDuplicatePhone(phone: string, excludeId?: string): boolean {
    const cleaned = phone.replace(/\s+/g, '');
    return this.patientsSignal().some(
      (p) => p.phone.replace(/\s+/g, '') === cleaned && (!excludeId || p.id !== excludeId)
    );
  }

  createPatient(data: Omit<Patient, 'id' | 'patientCode' | 'createdAt' | 'totalVisits'>): Observable<Patient> {
    const currentList = this.patientsSignal();
    const newSeq = currentList.length + 900;
    const newPatient: Patient = {
      ...data,
      id: `p-${Date.now()}`,
      patientCode: `BN-2026-0${newSeq}`,
      createdAt: new Date().toISOString(),
      totalVisits: 1,
    };

    return of(newPatient).pipe(
      delay(300),
      tap((created) => {
        this.patientsSignal.update((list) => [created, ...list]);
      })
    );
  }

  updatePatient(id: string, updates: Partial<Patient>): Observable<Patient | null> {
    let updated: Patient | null = null;
    this.patientsSignal.update((list) =>
      list.map((item) => {
        if (item.id === id) {
          updated = { ...item, ...updates };
          return updated;
        }
        return item;
      })
    );
    return of(updated).pipe(delay(250));
  }
}
