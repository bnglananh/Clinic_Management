import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { QueueTicket, QueueStatus, PriorityLevel } from '../models/queue.model';
import { Appointment } from '../models/appointment.model';
import { MOCK_QUEUE_TICKETS, MOCK_APPOINTMENTS } from '../mock-data/reception-mock-data';

@Injectable({
  providedIn: 'root',
})
export class QueueService {
  private queueTicketsSignal = signal<QueueTicket[]>(MOCK_QUEUE_TICKETS);
  private appointmentsSignal = signal<Appointment[]>(MOCK_APPOINTMENTS);

  public readonly queueTickets = this.queueTicketsSignal.asReadonly();
  public readonly appointments = this.appointmentsSignal.asReadonly();

  // Computed summary counts
  public readonly totalTickets = computed(() => this.queueTicketsSignal().length);
  public readonly waitingCount = computed(
    () => this.queueTicketsSignal().filter((t) => t.status === 'WAITING').length
  );
  public readonly inProgressCount = computed(
    () => this.queueTicketsSignal().filter((t) => t.status === 'IN_PROGRESS').length
  );
  public readonly completedCount = computed(
    () => this.queueTicketsSignal().filter((t) => t.status === 'COMPLETED').length
  );

  // Active currently called tickets
  public readonly currentCallingTickets = computed(() =>
    this.queueTicketsSignal().filter((t) => t.status === 'IN_PROGRESS')
  );

  getAppointments(): Observable<Appointment[]> {
    return of(this.appointmentsSignal()).pipe(delay(200));
  }

  getQueue(statusFilter?: QueueStatus): Observable<QueueTicket[]> {
    let list = this.queueTicketsSignal();
    if (statusFilter) {
      list = list.filter((t) => t.status === statusFilter);
    }
    return of(list).pipe(delay(200));
  }

  issueTicket(params: {
    patientId: string;
    patientCode: string;
    patientName: string;
    gender: 'NAM' | 'NU' | 'KHAC';
    yearOfBirth: number;
    phone: string;
    roomName: string;
    doctorId?: string;
    doctorName?: string;
    priority: PriorityLevel;
    appointmentId?: string;
    notes?: string;
  }): Observable<QueueTicket> {
    const list = this.queueTicketsSignal();
    // Generate next ticket number (e.g. A-015 or B-006 based on room)
    const prefix = params.roomName.includes('Tai Mũi Họng')
      ? 'B'
      : params.roomName.includes('Tiêu Hóa')
      ? 'C'
      : 'A';
    const sameRoomCount = list.filter((t) => t.ticketNumber.startsWith(prefix)).length;
    const nextSeq = String(sameRoomCount + 10).padStart(3, '0');
    const ticketNumber = `${prefix}-${nextSeq}`;

    const newTicket: QueueTicket = {
      id: `q-${Date.now()}`,
      ticketNumber,
      patientId: params.patientId,
      patientCode: params.patientCode,
      patientName: params.patientName,
      gender: params.gender,
      yearOfBirth: params.yearOfBirth,
      phone: params.phone,
      roomName: params.roomName,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      priority: params.priority,
      status: 'WAITING',
      checkinTime: new Date().toISOString(),
      estimatedTime: this.calculateEstimatedTime(),
      notes: params.notes,
    };

    return of(newTicket).pipe(
      delay(300),
      tap((ticket) => {
        // If from appointment, mark appointment as checked in
        if (params.appointmentId) {
          this.appointmentsSignal.update((apts) =>
            apts.map((a) =>
              a.id === params.appointmentId ? { ...a, status: 'CHECKED_IN' as const } : a
            )
          );
        }

        // Add to queue (if emergency or priority, insert after in_progress tickets)
        this.queueTicketsSignal.update((current) => {
          if (ticket.priority === 'EMERGENCY') {
            const firstWaitingIdx = current.findIndex((t) => t.status === 'WAITING');
            if (firstWaitingIdx !== -1) {
              const clone = [...current];
              clone.splice(firstWaitingIdx, 0, ticket);
              return clone;
            }
          }
          return [...current, ticket];
        });
      })
    );
  }

  promoteToTop(ticketId: string): Observable<boolean> {
    this.queueTicketsSignal.update((current) => {
      const targetIdx = current.findIndex((t) => t.id === ticketId);
      if (targetIdx === -1) return current;

      const target = current[targetIdx];
      // Only promote if still WAITING
      if (target.status !== 'WAITING') return current;

      const remaining = current.filter((t) => t.id !== ticketId);
      // Find position of first WAITING ticket
      const firstWaitingIdx = remaining.findIndex((t) => t.status === 'WAITING');
      const updatedTarget: QueueTicket = {
        ...target,
        priority: 'EMERGENCY',
        notes: (target.notes ? target.notes + ' • ' : '') + 'Được điều phối ưu tiên đầu hàng',
      };

      if (firstWaitingIdx === -1) {
        return [...remaining, updatedTarget];
      }

      const clone = [...remaining];
      clone.splice(firstWaitingIdx, 0, updatedTarget);
      return clone;
    });

    return of(true).pipe(delay(200));
  }

  callNextPatient(roomName = 'Phòng khám Nội 101'): QueueTicket | null {
    const list = this.queueTicketsSignal();
    const waiting = list.find((t) => t.status === 'WAITING' && (!roomName || t.roomName === roomName || true));
    if (!waiting) return null;

    let updatedTicket: QueueTicket | null = null;
    this.queueTicketsSignal.update((current) =>
      current.map((t) => {
        if (t.id === waiting.id) {
          updatedTicket = { ...t, status: 'IN_PROGRESS' };
          return updatedTicket;
        }
        return t;
      })
    );
    return updatedTicket;
  }

  createAppointment(params: {
    patientId: string;
    patientCode: string;
    patientName: string;
    phone: string;
    department: string;
    doctorId: string;
    doctorName: string;
    appointmentDate: string;
    timeSlot: string;
    reasonForVisit: string;
  }): Observable<Appointment> {
    const seq = String(this.appointmentsSignal().length + 1).padStart(4, '0');
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentCode: `LH-2026-${seq}`,
      patientId: params.patientId,
      patientCode: params.patientCode,
      patientName: params.patientName,
      phone: params.phone,
      department: params.department,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      appointmentDate: params.appointmentDate,
      timeSlot: params.timeSlot,
      reasonForVisit: params.reasonForVisit,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    this.appointmentsSignal.update((list) => [newApt, ...list]);
    return of(newApt).pipe(delay(250));
  }

  cancelAppointment(id: string): Observable<boolean> {
    this.appointmentsSignal.update((list) =>
      list.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' as const } : a))
    );
    return of(true).pipe(delay(200));
  }

  rescheduleAppointment(id: string, newDate: string, newTimeSlot: string): Observable<boolean> {
    this.appointmentsSignal.update((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              appointmentDate: newDate,
              timeSlot: newTimeSlot,
              status: 'CONFIRMED' as const,
            }
          : a
      )
    );
    return of(true).pipe(delay(200));
  }

  updateTicketStatus(ticketId: string, newStatus: QueueStatus): Observable<QueueTicket | null> {
    let updated: QueueTicket | null = null;
    this.queueTicketsSignal.update((current) =>
      current.map((t) => {
        if (t.id === ticketId) {
          updated = { ...t, status: newStatus };
          return updated;
        }
        return t;
      })
    );
    return of(updated).pipe(delay(200));
  }

  private calculateEstimatedTime(): string {
    const now = new Date();
    // Add 25 minutes for waiting
    now.setMinutes(now.getMinutes() + 25);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
