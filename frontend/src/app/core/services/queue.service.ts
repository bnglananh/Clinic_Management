import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, of, catchError, map, tap, throwError } from 'rxjs';
import { QueueTicket, QueueStatus, PriorityLevel } from '../models/queue.model';
import { Appointment } from '../models/appointment.model';
import { ApiResponse, unwrap } from './api';
import { AuthService, apiErrorMessage } from './auth.service';

/** Trạng thái chỉ có ở giao diện (tiến độ cận lâm sàng, đã có mặt trước cửa) – giữ lại khi làm mới dữ liệu. */
type LocalOverlay = Pick<QueueTicket, 'clinicalServicesTotal' | 'clinicalServicesDone' | 'arrivedAtDoor'>;

const REFRESH_INTERVAL_MS = 10_000;

/**
 * Hàng đợi khám và lịch hẹn – dữ liệu lấy từ backend (MongoDB; số thứ tự cấp qua Redis INCR).
 * Danh sách tự làm mới mỗi 10 giây để màn hình sảnh chờ và bàn bác sĩ luôn đồng bộ.
 */
@Injectable({
  providedIn: 'root',
})
export class QueueService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private queueTicketsSignal = signal<QueueTicket[]>([]);
  private appointmentsSignal = signal<Appointment[]>([]);
  private overlay = new Map<string, LocalOverlay>();

  public readonly queueTickets = this.queueTicketsSignal.asReadonly();
  public readonly appointments = this.appointmentsSignal.asReadonly();
  public readonly lastError = signal<string>('');

  // Computed summary counts
  public readonly totalTickets = computed(() => this.queueTicketsSignal().length);
  public readonly waitingCount = computed(
    () => this.queueTicketsSignal().filter((t) => t.status === 'WAITING').length
  );
  public readonly inProgressCount = computed(
    () => this.queueTicketsSignal().filter((t) => t.status === 'IN_PROGRESS').length
  );
  public readonly waitingResultsCount = computed(
    () =>
      this.queueTicketsSignal().filter(
        (t) => t.status === 'WAITING_RESULTS' || t.status === 'RESULTS_READY'
      ).length
  );
  public readonly resultsReadyCount = computed(
    () => this.queueTicketsSignal().filter((t) => t.status === 'RESULTS_READY').length
  );
  public readonly completedCount = computed(
    () => this.queueTicketsSignal().filter((t) => t.status === 'COMPLETED').length
  );

  // Active currently called tickets
  public readonly currentCallingTickets = computed(() =>
    this.queueTicketsSignal().filter((t) => t.status === 'IN_PROGRESS')
  );

  constructor() {
    // Nạp lại khi đăng nhập / đổi tài khoản
    effect(() => {
      this.auth.currentUser();
      this.refresh();
    });
    setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
  }

  /** Tải lại hàng đợi (công khai) và lịch hẹn (theo vai trò người dùng). */
  refresh(): void {
    this.loadQueue().subscribe();
    this.loadAppointments().subscribe();
  }

  getAppointments(): Observable<Appointment[]> {
    return this.loadAppointments();
  }

  getQueue(statusFilter?: QueueStatus): Observable<QueueTicket[]> {
    return this.loadQueue().pipe(
      map((list) => (statusFilter ? list.filter((t) => t.status === statusFilter) : list))
    );
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
    return this.eager(unwrap(this.http.post<ApiResponse<QueueTicket>>('/api/reception/checkin', params)).pipe(
      tap(() => this.refresh()),
      catchError((err) => this.fail<QueueTicket>(err))
    ));
  }

  promoteToTop(ticketId: string): Observable<boolean> {
    return this.eager(this.http.post<ApiResponse<QueueTicket>>(`/api/queue/${ticketId}/promote`, {}).pipe(
      map(() => true),
      tap(() => this.loadQueue().subscribe()),
      catchError((err) => this.fail<boolean>(err))
    ));
  }

  /**
   * Gọi bệnh nhân kế tiếp: chọn vé WAITING đầu tiên theo thứ tự hàng đợi của server,
   * cập nhật ngay trên giao diện rồi ghi trạng thái IN_PROGRESS xuống backend.
   */
  callNextPatient(roomName = 'Phòng khám Nội 101'): QueueTicket | null {
    const waiting =
      this.queueTicketsSignal().find((t) => t.status === 'WAITING' && t.roomName === roomName) ??
      this.queueTicketsSignal().find((t) => t.status === 'WAITING');
    if (!waiting) return null;
    const updated: QueueTicket = { ...waiting, status: 'IN_PROGRESS' };
    this.patchLocal(updated);
    this.updateTicketStatus(waiting.id, 'IN_PROGRESS');
    return updated;
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
    return this.eager(unwrap(this.http.post<ApiResponse<Appointment>>('/api/appointments', params)).pipe(
      tap((apt) => this.appointmentsSignal.update((list) => [apt, ...list.filter((a) => a.id !== apt.id)])),
      catchError((err) => this.fail<Appointment>(err))
    ));
  }

  /** Giữ chỗ khung giờ 10 phút trên Redis trong lúc bệnh nhân hoàn tất đặt lịch. */
  lockSlot(doctorId: string, appointmentDate: string, timeSlot: string, ownerId: string):
    Observable<{ expiresInSeconds: number }> {
    return unwrap(
      this.http.post<ApiResponse<{ expiresInSeconds: number }>>('/api/appointments/slot-locks', {
        doctorId, appointmentDate, timeSlot, ownerId,
      })
    ).pipe(catchError((err) => throwError(() => new Error(apiErrorMessage(err)))));
  }

  releaseSlot(doctorId: string, appointmentDate: string, timeSlot: string, ownerId: string): void {
    this.http
      .post('/api/appointments/slot-locks/release', { doctorId, appointmentDate, timeSlot, ownerId })
      .subscribe({ error: () => undefined });
  }

  cancelAppointment(id: string, reason?: string): Observable<boolean> {
    return this.eager(this.http.put<ApiResponse<Appointment>>(`/api/appointments/${id}/cancel`, { reason }).pipe(
      tap((res) => this.replaceAppointment(res.data)),
      map(() => true),
      catchError((err) => this.fail<boolean>(err))
    ));
  }

  rescheduleAppointment(id: string, newDate: string, newTimeSlot: string): Observable<boolean> {
    return this.eager(this.http
      .put<ApiResponse<Appointment>>(`/api/appointments/${id}/reschedule`, {
        newAppointmentDate: newDate,
        newTimeSlot,
      })
      .pipe(
        tap((res) => this.replaceAppointment(res.data)),
        map(() => true),
        catchError((err) => this.fail<boolean>(err))
      ));
  }

  updateTicketStatus(ticketId: string, newStatus: QueueStatus): Observable<QueueTicket | null> {
    return this.eager(unwrap(
      this.http.patch<ApiResponse<QueueTicket>>(`/api/queue/${ticketId}/status`, { status: newStatus })
    ).pipe(
      map((ticket): QueueTicket | null => this.patchLocal(ticket)),
      catchError((err) => {
        this.loadQueue().subscribe(); // hoàn tác cập nhật lạc quan
        return this.fail<QueueTicket | null>(err);
      })
    ));
  }

  /** Chuyển bệnh nhân sang đi làm cận lâm sàng (WAITING_RESULTS). */
  sendToClinicalServices(ticketNumber: string, servicesCount: number): Observable<QueueTicket | null> {
    return this.updateByNumber(ticketNumber, 'WAITING_RESULTS', {
      clinicalServicesTotal: servicesCount,
      clinicalServicesDone: 0,
      arrivedAtDoor: false,
    });
  }

  /** Cập nhật tiến độ cận lâm sàng; đủ kết quả thì chuyển RESULTS_READY. */
  updateClinicalProgress(ticketNumber: string, doneCount: number, totalCount: number): Observable<QueueTicket | null> {
    const isAllDone = totalCount > 0 && doneCount >= totalCount;
    return this.updateByNumber(ticketNumber, isAllDone ? 'RESULTS_READY' : 'WAITING_RESULTS', {
      clinicalServicesTotal: totalCount,
      clinicalServicesDone: doneCount,
    });
  }

  /** Gọi lại bệnh nhân đã có kết quả vào phòng (RESULTS_READY → IN_PROGRESS). */
  recallPatientForResults(ticketNumber: string): Observable<QueueTicket | null> {
    return this.updateByNumber(ticketNumber, 'IN_PROGRESS', {});
  }

  /** Đánh dấu bệnh nhân đã có mặt trước cửa phòng (chỉ lưu trên giao diện). */
  togglePatientArrived(ticketNumber: string): Observable<QueueTicket | null> {
    const ticket = this.queueTicketsSignal().find((t) => t.ticketNumber === ticketNumber);
    if (!ticket) return of(null);
    this.setOverlay(ticket.id, { arrivedAtDoor: !ticket.arrivedAtDoor });
    return of(this.patchLocal({ ...ticket, arrivedAtDoor: !ticket.arrivedAtDoor }));
  }

  // ---------------------------------------------------------------------

  private loadQueue(): Observable<QueueTicket[]> {
    return unwrap(this.http.get<ApiResponse<QueueTicket[]>>('/api/queue')).pipe(
      map((list) => list.map((t) => ({ ...t, ...this.overlay.get(t.id) }))),
      tap((list) => {
        this.queueTicketsSignal.set(list);
        this.lastError.set('');
      }),
      catchError((err) => {
        this.lastError.set(apiErrorMessage(err));
        return of(this.queueTicketsSignal());
      })
    );
  }

  private loadAppointments(): Observable<Appointment[]> {
    const user = this.auth.currentUser();
    if (!user || !this.auth.isAuthenticated()) {
      this.appointmentsSignal.set([]);
      return of([]);
    }
    // Bệnh nhân chỉ xem lịch hẹn của chính mình
    const url = user.role === 'PATIENT' ? `/api/appointments/patient/${user.id}` : '/api/appointments';
    return unwrap(this.http.get<ApiResponse<Appointment[]>>(url)).pipe(
      tap((list) => this.appointmentsSignal.set(list)),
      catchError(() => of(this.appointmentsSignal()))
    );
  }

  private updateByNumber(ticketNumber: string, status: QueueStatus, local: Partial<LocalOverlay>):
    Observable<QueueTicket | null> {
    const ticket = this.queueTicketsSignal().find((t) => t.ticketNumber === ticketNumber);
    if (!ticket) return of(null);
    this.setOverlay(ticket.id, local);
    this.patchLocal({ ...ticket, ...local, status });
    return ticket.status === status ? of({ ...ticket, ...local }) : this.updateTicketStatus(ticket.id, status);
  }

  private setOverlay(id: string, values: Partial<LocalOverlay>): void {
    this.overlay.set(id, { ...this.overlay.get(id), ...values });
  }

  private patchLocal(ticket: QueueTicket): QueueTicket {
    const merged = { ...ticket, ...this.overlay.get(ticket.id) };
    this.queueTicketsSignal.update((list) => list.map((t) => (t.id === merged.id ? merged : t)));
    return merged;
  }

  private replaceAppointment(apt: Appointment): void {
    if (!apt) return;
    this.appointmentsSignal.update((list) => list.map((a) => (a.id === apt.id ? apt : a)));
  }

  /**
   * Chạy request ngay cả khi component không subscribe (giữ đúng hành vi của bản giả lập cũ);
   * người gọi vẫn có thể subscribe để nhận kết quả hoặc lỗi.
   */
  private eager<T>(source: Observable<T>): Observable<T> {
    const result = new ReplaySubject<T>(1);
    source.subscribe(result);
    return result.asObservable();
  }

  private fail<T>(err: unknown): Observable<T> {
    const message = apiErrorMessage(err);
    this.lastError.set(message);
    return throwError(() => new Error(message));
  }
}
