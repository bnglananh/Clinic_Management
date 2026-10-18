import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import {
  AppNotification,
  NotificationSummary,
  SendNotificationRequest,
  NotificationType,
} from '../models/notification.model';
import { catchError, of, tap } from 'rxjs';

const INITIAL_MOCK_NOTIFICATIONS: AppNotification[] = [
  // --- Patient notifications (usr-pat-01) ---
  {
    id: 'NOTIF-01',
    userId: 'usr-pat-01',
    title: 'Nhắc nhở: Lịch hẹn khám sắp diễn ra',
    content:
      'Quý khách có lịch hẹn khám Chuyên khoa Tim mạch vào lúc 08:30 ngày mai (19/10/2026) tại Phòng khám 101 với TS.BS Trần Minh Hoàng. Vui lòng có mặt trước 15 phút.',
    type: 'APPOINTMENT',
    referenceId: 'APT-2026-1001',
    channel: 'IN_APP',
    isRead: false,
    createdAt: '18/10/2026 14:00',
  },
  {
    id: 'NOTIF-02',
    userId: 'usr-pat-01',
    title: 'Đã có kết quả xét nghiệm cận lâm sàng',
    content:
      'Kết quả Xét nghiệm Tổng phân tích tế bào máu (CBC) và Điện tâm đồ (ECG) của bạn đã hoàn tất. Bạn có thể tra cứu chi tiết tại mục "Hồ sơ sức khỏe".',
    type: 'MEDICAL_RECORD',
    referenceId: 'LAB-2026-045',
    channel: 'IN_APP',
    isRead: false,
    createdAt: '18/10/2026 11:30',
  },
  {
    id: 'NOTIF-03',
    userId: 'usr-pat-01',
    title: 'Xác nhận thanh toán viện phí thành công',
    content:
      'Hóa đơn viện phí #HD-2026-089 với số tiền 350.000 ₫ đã được thanh toán thành công qua mã VietQR. Cảm ơn quý khách đã tin chọn Smart Clinic.',
    type: 'BILLING',
    referenceId: 'INV-2026-089',
    channel: 'IN_APP',
    isRead: true,
    readAt: '18/10/2026 10:45',
    createdAt: '18/10/2026 10:15',
  },
  {
    id: 'NOTIF-04',
    userId: 'usr-pat-01',
    title: 'Cập nhật tiến trình số thứ tự hàng đợi',
    content:
      'Số thứ tự STT-A012 của bạn tại Phòng khám Nội 101 hiện chỉ còn 2 lượt nữa là đến khám. Xin vui lòng chuẩn bị di chuyển vào sảnh chờ.',
    type: 'QUEUE',
    referenceId: 'QUEUE-015',
    channel: 'IN_APP',
    isRead: true,
    readAt: '18/10/2026 09:20',
    createdAt: '18/10/2026 09:05',
  },
  {
    id: 'NOTIF-05',
    userId: 'usr-pat-01',
    title: 'Chào mừng đến với Hệ thống Y tế Smart Clinic',
    content:
      'Tài khoản của bạn đã được liên kết hồ sơ y bạ điện tử (EMR). Tận hưởng các tiện ích đặt lịch khám ưu tiên và lưu trữ hồ sơ trọn đời.',
    type: 'SYSTEM',
    referenceId: 'SYS-WELCOME',
    channel: 'IN_APP',
    isRead: true,
    readAt: '17/10/2026 18:00',
    createdAt: '17/10/2026 08:00',
  },

  // --- Doctor notifications (usr-doc-01) ---
  {
    id: 'NOTIF-DOC-01',
    userId: 'usr-doc-01',
    title: 'Bệnh nhân mới vào hàng đợi khám',
    content:
      'Bệnh nhân Nguyễn Văn Hùng (Mã BN: BN-A-012, STT: A-012) đã hoàn tất thủ tục tiếp nhận và đang chờ khám tại Phòng 101.',
    type: 'QUEUE',
    referenceId: 'A-012',
    channel: 'IN_APP',
    isRead: false,
    createdAt: '18/10/2026 22:50',
  },
  {
    id: 'NOTIF-DOC-02',
    userId: 'usr-doc-01',
    title: 'Cận lâm sàng có kết quả: Điện tâm đồ (ECG)',
    content:
      'Kết quả cận lâm sàng của bệnh nhân Lê Thị Thu Thảo đã được phòng chức năng cập nhật. Vui lòng kiểm tra trên workspace.',
    type: 'MEDICAL_RECORD',
    referenceId: 'EMR-1792338761646',
    channel: 'IN_APP',
    isRead: false,
    createdAt: '18/10/2026 21:15',
  },
  {
    id: 'NOTIF-DOC-03',
    userId: 'usr-doc-01',
    title: 'Nhắc lịch ca khám lâm sàng',
    content:
      'Hôm nay bác sĩ có 12 ca hẹn khám tại Phòng Khám Nội 101. Ca đầu tiên bắt đầu lúc 08:00.',
    type: 'APPOINTMENT',
    referenceId: 'SCH-DOC-01',
    channel: 'IN_APP',
    isRead: true,
    readAt: '18/10/2026 08:05',
    createdAt: '18/10/2026 07:30',
  },

  // --- Receptionist notifications (usr-rec-01) ---
  {
    id: 'NOTIF-REC-01',
    userId: 'usr-rec-01',
    title: 'Hóa đơn viện phí mới cần thanh toán',
    content:
      'Bác sĩ Phòng 101 đã hoàn tất ca khám cho bệnh nhân Nguyễn Văn Hùng. Hóa đơn #HD-2026-104 (520.000 ₫) đang chờ thu ngân tiếp nhận.',
    type: 'BILLING',
    referenceId: 'HD-2026-104',
    channel: 'IN_APP',
    isRead: false,
    createdAt: '18/10/2026 22:55',
  },
  {
    id: 'NOTIF-REC-02',
    userId: 'usr-rec-01',
    title: 'Lịch hẹn trực tuyến mới từ bệnh nhân',
    content:
      'Bệnh nhân Trần Đại Nghĩa vừa đặt lịch hẹn khám Tim Mạch lúc 09:00 ngày mai. Vui lòng xác nhận check-in khi bệnh nhân đến.',
    type: 'APPOINTMENT',
    referenceId: 'APT-2026-1002',
    channel: 'IN_APP',
    isRead: false,
    createdAt: '18/10/2026 20:10',
  },

  // --- Admin notifications (usr-adm-01) ---
  {
    id: 'NOTIF-ADM-01',
    userId: 'usr-adm-01',
    title: 'Cảnh báo tồn kho dược xuống thấp',
    content:
      'Thuốc Amoxicillin 500mg hiện tồn kho còn 8 hộp (≤ 10 ngưỡng quy định). Vui lòng lập phiếu nhập kho bổ sung.',
    type: 'SYSTEM',
    referenceId: 'DRUG-001',
    channel: 'IN_APP',
    isRead: false,
    createdAt: '18/10/2026 19:40',
  },
  {
    id: 'NOTIF-ADM-02',
    userId: 'usr-adm-01',
    title: 'Sao lưu dữ liệu định kỳ MongoDB & Cassandra',
    content:
      'Hệ thống đã hoàn tất sao lưu dữ liệu toàn diện (Full Database Backup). Trạng thái: An toàn 100%.',
    type: 'SYSTEM',
    referenceId: 'BACKUP-2026-10',
    channel: 'IN_APP',
    isRead: true,
    readAt: '18/10/2026 04:00',
    createdAt: '18/10/2026 03:00',
  },
];

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly API_BASE = '/api/notifications';

  // Master reactive signal holding notifications list
  private notificationsSignal = signal<AppNotification[]>([]);
  public readonly notifications = this.notificationsSignal.asReadonly();

  // Dropdown open/close state
  public readonly isPanelOpen = signal<boolean>(false);

  // Active filter tab: 'ALL' | 'UNREAD' | NotificationType
  public readonly activeFilter = signal<'ALL' | 'UNREAD' | NotificationType>('ALL');

  // Loading state
  public readonly isLoading = signal<boolean>(false);

  // Computed unread count
  public readonly unreadCount = computed(() => {
    return this.notificationsSignal().filter((n) => !n.isRead).length;
  });

  // Filtered notifications based on tab
  public readonly filteredNotifications = computed(() => {
    const list = this.notificationsSignal();
    const filter = this.activeFilter();

    if (filter === 'ALL') return list;
    if (filter === 'UNREAD') return list.filter((n) => !n.isRead);
    return list.filter((n) => n.type === filter);
  });

  constructor() {
    // Automatically reload notifications when current user changes role / account
    effect(
      () => {
        const user = this.authService.currentUser();
        const userId = user?.id || 'usr-pat-01';
        this.fetchNotifications(userId);
      },
      { allowSignalWrites: true }
    );
  }

  public fetchNotifications(userId?: string): void {
    const uid = userId || this.authService.currentUser()?.id || 'usr-pat-01';
    this.isLoading.set(true);

    this.http
      .get<{ data: AppNotification[] }>(`${this.API_BASE}?userId=${uid}`)
      .pipe(
        catchError(() => {
          // If backend API is offline or returns error, load matching mock notifications
          const localList = INITIAL_MOCK_NOTIFICATIONS.filter((n) => n.userId === uid);
          return of({ data: localList.length > 0 ? localList : INITIAL_MOCK_NOTIFICATIONS });
        })
      )
      .subscribe({
        next: (res) => {
          this.notificationsSignal.set(res?.data || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  public markAsRead(notificationId: string): void {
    const uid = this.authService.currentUser()?.id || 'usr-pat-01';

    // Optimistic UI update
    this.notificationsSignal.update((list) =>
      list.map((item) =>
        item.id === notificationId
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )
    );

    this.http
      .patch(`${this.API_BASE}/${notificationId}/read?userId=${uid}`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  public markAllAsRead(): void {
    const uid = this.authService.currentUser()?.id || 'usr-pat-01';

    // Optimistic UI update
    this.notificationsSignal.update((list) =>
      list.map((item) => ({
        ...item,
        isRead: true,
        readAt: new Date().toISOString(),
      }))
    );

    this.http
      .patch(`${this.API_BASE}/mark-all-read?userId=${uid}`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  public deleteNotification(notificationId: string): void {
    const uid = this.authService.currentUser()?.id || 'usr-pat-01';

    this.notificationsSignal.update((list) =>
      list.filter((item) => item.id !== notificationId)
    );

    this.http
      .delete(`${this.API_BASE}/${notificationId}?userId=${uid}`)
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  public sendNotification(req: SendNotificationRequest): void {
    const now = new Date();
    const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()} ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      userId: req.userId,
      title: req.title,
      content: req.content,
      type: req.type,
      referenceId: req.referenceId,
      channel: req.channel || 'IN_APP',
      isRead: false,
      createdAt: timeStr,
    };

    // Prepend to list
    this.notificationsSignal.update((list) => [newNotif, ...list]);

    this.http
      .post(`${this.API_BASE}`, req)
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  public togglePanel(): void {
    this.isPanelOpen.update((v) => !v);
  }

  public closePanel(): void {
    this.isPanelOpen.set(false);
  }

  public openPanel(): void {
    this.isPanelOpen.set(true);
  }

  public setFilter(filter: 'ALL' | 'UNREAD' | NotificationType): void {
    this.activeFilter.set(filter);
  }
}
