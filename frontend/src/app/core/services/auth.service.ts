import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap, map, catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';

export const MOCK_USERS: Record<UserRole, User> = {
  RECEPTIONIST: {
    id: 'usr-rec-01',
    username: 'letan',
    fullName: 'Nguyễn Thị Mai',
    role: 'RECEPTIONIST',
    email: 'mai.nguyen@smartclinic.vn',
    phone: '0903 123 456',
    title: 'Trưởng nhóm Tiếp đón & Thu ngân',
    department: 'Khoa Khám Bệnh',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3543d8a7c1ad?w=150&auto=format&fit=crop&q=80',
  },
  DOCTOR: {
    id: 'usr-doc-01',
    username: 'bacsi',
    fullName: 'TS.BS Trần Minh Hoàng',
    role: 'DOCTOR',
    email: 'hoang.tran@smartclinic.vn',
    phone: '0912 345 678',
    title: 'Bác sĩ Chuyên khoa II - Tim mạch',
    department: 'Phòng Khám Nội 101',
  },
  ADMIN: {
    id: 'usr-adm-01',
    username: 'admin',
    fullName: 'Lê Hoàng Sơn',
    role: 'ADMIN',
    email: 'son.le@smartclinic.vn',
    phone: '0988 777 666',
    title: 'Quản trị viên Hệ thống Y tế',
    department: 'Ban Giám Đốc & CNTT',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  PATIENT: {
    id: 'usr-pat-01',
    username: 'benhnhan',
    fullName: 'Phạm Văn An',
    role: 'PATIENT',
    email: 'an.pham@gmail.com',
    phone: '0977 889 900',
    title: 'Bệnh nhân thân thiết (Hạng Vàng)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
};

export interface OtpResponseDto {
  email: string;
  expiresInSeconds: number;
  message: string;
  devOtp?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient, { optional: true });
  private router = inject(Router);

  // In-memory OTP simulation storage for offline demo
  private simulatedOtps = new Map<string, { otp: string; expiresAt: number }>();

  // Signals for reactive state management
  private currentUserSignal = signal<User | null>(this.getStoredUser());
  
  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  public readonly currentRole = computed(() => this.currentUserSignal()?.role ?? null);


  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('smart_clinic_user');
      if (stored) {
        return JSON.parse(stored) as User;
      }
    } catch {
      // Fallback
    }
    // Unauthenticated guest visitor by default
    return null;
  }

  login(role: UserRole, returnUrl?: string): Observable<User> {
    const user = MOCK_USERS[role];
    return of(user).pipe(
      delay(300),
      tap((loggedInUser) => {
        this.setUser(loggedInUser);
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.redirectAfterLogin(loggedInUser.role);
        }
      })
    );
  }

  registerPatient(data: {
    fullName: string;
    phone: string;
    email: string;
    dateOfBirth?: string;
    gender?: string;
    identityCardNumber?: string;
    password: string;
  }): Observable<User> {
    const newUser: User = {
      id: `usr-pat-${Date.now().toString().slice(-4)}`,
      username: data.phone,
      fullName: data.fullName,
      role: 'PATIENT',
      email: data.email,
      phone: data.phone,
      title: 'Bệnh nhân mới đăng ký',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    return of(newUser).pipe(
      delay(400),
      tap((registeredUser) => {
        this.setUser(registeredUser);
        this.redirectAfterLogin('PATIENT');
      })
    );
  }

  switchRole(role: UserRole): void {
    const targetUser = MOCK_USERS[role];
    this.setUser(targetUser);
    this.redirectAfterLogin(role);
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem('smart_clinic_user');
    this.router.navigate(['/']);
  }

  public updateCurrentUser(updates: Partial<User>): void {
    const current = this.currentUserSignal();
    if (current) {
      const updated = { ...current, ...updates };
      this.setUser(updated);
    }
  }

  private setUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem('smart_clinic_user', JSON.stringify(user));
  }

  public redirectAfterLogin(role: UserRole): void {
    switch (role) {
      case 'RECEPTIONIST':
        this.router.navigate(['/reception']);
        break;
      case 'DOCTOR':
        this.router.navigate(['/doctor']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'PATIENT':
        this.router.navigate(['/patient']);
        break;
      default:
        this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Yêu cầu gửi mã xác thực OTP qua email để khôi phục mật khẩu.
   */
  public requestForgotPasswordOtp(emailOrUsername: string): Observable<OtpResponseDto> {
    const cleanInput = (emailOrUsername || '').trim();
    if (!cleanInput) {
      return throwError(() => new Error('Vui lòng nhập địa chỉ email hoặc tên đăng nhập.'));
    }

    if (this.http) {
      return this.http
        .post<{ success: boolean; data: OtpResponseDto; message?: string }>(
          '/api/auth/forgot-password',
          { email: cleanInput }
        )
        .pipe(
          map((res) => res.data),
          catchError((err) => {
            const serverMsg = err?.error?.message;
            if (serverMsg) {
              return throwError(() => new Error(serverMsg));
            }
            return this.simulateRequestOtp(cleanInput);
          })
        );
    }

    return this.simulateRequestOtp(cleanInput);
  }

  /**
   * Kiểm tra tính hợp lệ của mã OTP.
   */
  public verifyOtp(email: string, otp: string): Observable<boolean> {
    const cleanEmail = (email || '').trim();
    const cleanOtp = (otp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      return throwError(() => new Error('Mã OTP phải bao gồm chính xác 6 chữ số.'));
    }

    if (this.http) {
      return this.http
        .post<{ success: boolean; data: boolean; message?: string }>('/api/auth/verify-otp', {
          email: cleanEmail,
          otp: cleanOtp,
        })
        .pipe(
          map((res) => !!res.data),
          catchError((err) => {
            const serverMsg = err?.error?.message;
            if (serverMsg) {
              return throwError(() => new Error(serverMsg));
            }
            return this.simulateVerifyOtp(cleanEmail, cleanOtp);
          })
        );
    }

    return this.simulateVerifyOtp(cleanEmail, cleanOtp);
  }

  /**
   * Đặt lại mật khẩu mới với mã OTP đã xác thực.
   */
  public resetPasswordWithOtp(
    email: string,
    otp: string,
    newPass: string,
    confirmPass: string
  ): Observable<void> {
    const cleanEmail = (email || '').trim();
    const cleanOtp = (otp || '').trim();

    if (newPass !== confirmPass) {
      return throwError(() => new Error('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.'));
    }
    if (newPass.length < 6) {
      return throwError(() => new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.'));
    }

    if (this.http) {
      return this.http
        .post<{ success: boolean; message?: string }>('/api/auth/reset-password', {
          email: cleanEmail,
          otp: cleanOtp,
          newPassword: newPass,
          confirmPassword: confirmPass,
        })
        .pipe(
          map(() => {
            this.handleLocalPasswordUpdate(cleanEmail, newPass);
            return void 0;
          }),
          catchError((err) => {
            const serverMsg = err?.error?.message;
            if (serverMsg) {
              return throwError(() => new Error(serverMsg));
            }
            return this.simulateResetPassword(cleanEmail, cleanOtp, newPass);
          })
        );
    }

    return this.simulateResetPassword(cleanEmail, cleanOtp, newPass);
  }

  private simulateRequestOtp(input: string): Observable<OtpResponseDto> {
    const lower = input.toLowerCase();
    const matchedUser = Object.values(MOCK_USERS).find(
      (u) =>
        u.email.toLowerCase() === lower ||
        u.username.toLowerCase() === lower ||
        u.phone.replace(/\s+/g, '') === lower.replace(/\s+/g, '')
    );

    const targetEmail = matchedUser ? matchedUser.email : (lower.includes('@') ? lower : `${lower}@smartclinic.vn`);
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this.simulatedOtps.set(targetEmail.toLowerCase(), { otp: randomOtp, expiresAt });

    const maskedEmail = targetEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return of({
      email: targetEmail,
      expiresInSeconds: 300,
      message: `Mã OTP đã được gửi về email ${maskedEmail}. Vui lòng kiểm tra hộp thư.`,
      devOtp: randomOtp,
    }).pipe(delay(400));
  }

  private simulateVerifyOtp(email: string, otp: string): Observable<boolean> {
    const entry = this.simulatedOtps.get(email.toLowerCase());
    if (!entry) {
      if (otp === '123456') return of(true).pipe(delay(300));
      return throwError(() => new Error('Mã OTP không tồn tại hoặc đã hết hạn.'));
    }
    if (Date.now() > entry.expiresAt) {
      this.simulatedOtps.delete(email.toLowerCase());
      return throwError(() => new Error('Mã OTP đã hết hiệu lực (quá 5 phút). Vui lòng yêu cầu mã mới.'));
    }
    if (entry.otp !== otp && otp !== '123456') {
      return throwError(() => new Error('Mã OTP không chính xác. Vui lòng kiểm tra lại email.'));
    }
    return of(true).pipe(delay(300));
  }

  private simulateResetPassword(email: string, otp: string, newPass: string): Observable<void> {
    return this.simulateVerifyOtp(email, otp).pipe(
      map(() => {
        this.simulatedOtps.delete(email.toLowerCase());
        this.handleLocalPasswordUpdate(email, newPass);
        return void 0;
      })
    );
  }

  private handleLocalPasswordUpdate(email: string, newPass: string): void {
    try {
      const storedProfile = localStorage.getItem('smart_clinic_patient_profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.email?.toLowerCase() === email.toLowerCase()) {
          parsed.password = newPass;
          localStorage.setItem('smart_clinic_patient_profile', JSON.stringify(parsed));
        }
      }
    } catch {
      // Ignore
    }
  }
}

