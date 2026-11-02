import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';

/** Tài khoản demo (mật khẩu 123456) – dùng cho nút chọn vai trò nhanh ở trang đăng nhập. */
export const DEMO_ACCOUNTS: Record<UserRole, string> = {
  RECEPTIONIST: 'letan',
  DOCTOR: 'bacsi',
  ADMIN: 'admin',
  PATIENT: 'benhnhan',
};
export const DEMO_PASSWORD = '123456';

export interface OtpResponseDto {
  email: string;
  expiresInSeconds: number;
  message: string;
  devOtp?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface LoginResponseDto {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: User;
}

const USER_KEY = 'smart_clinic_user';
const TOKEN_KEY = 'smart_clinic_token';

/** Lấy thông báo lỗi tiếng Việt từ response của backend. */
export function apiErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Không kết nối được máy chủ. Vui lòng kiểm tra backend đã chạy chưa.';
    return err.error?.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSignal = signal<User | null>(this.read<User>(USER_KEY));
  private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly token = this.tokenSignal.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.currentUserSignal() && !!this.tokenSignal());
  public readonly currentRole = computed(() => this.currentUserSignal()?.role ?? null);

  /** Đăng nhập bằng tên đăng nhập / email / SĐT. Backend trả về JWT. */
  login(username: string, password: string, returnUrl?: string): Observable<User> {
    return this.http
      .post<ApiResponse<LoginResponseDto>>('/api/auth/login', { username: username.trim(), password })
      .pipe(
        map((res) => this.startSession(res.data)),
        tap((user) => this.navigateAfterLogin(user.role, returnUrl)),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Đăng nhập thất bại.'))))
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
    return this.http.post<ApiResponse<LoginResponseDto>>('/api/auth/register', data).pipe(
      map((res) => this.startSession(res.data)),
      tap(() => this.redirectAfterLogin('PATIENT')),
      catchError((err) => throwError(() => new Error(apiErrorMessage(err, 'Đăng ký thất bại.'))))
    );
  }

  /** Chuyển nhanh sang tài khoản demo của vai trò khác (chỉ phục vụ trình diễn). */
  switchRole(role: UserRole): void {
    this.revokeCurrentToken();
    this.clearSession();
    this.login(DEMO_ACCOUNTS[role], DEMO_PASSWORD).subscribe({
      error: () => this.router.navigate(['/auth/login']),
    });
  }

  logout(): void {
    this.revokeCurrentToken();
    this.clearSession();
    this.router.navigate(['/']);
  }

  /** Gọi khi backend trả 401: token hết hạn hoặc đã bị thu hồi. */
  handleSessionExpired(): void {
    if (!this.tokenSignal()) return;
    this.clearSession();
    this.router.navigate(['/auth/login'], { queryParams: { expired: 1 } });
  }

  public updateCurrentUser(updates: Partial<User>): void {
    const current = this.currentUserSignal();
    if (current) {
      const updated = { ...current, ...updates };
      this.currentUserSignal.set(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  }

  public redirectAfterLogin(role: UserRole): void {
    const home: Record<UserRole, string> = {
      RECEPTIONIST: '/reception',
      DOCTOR: '/doctor',
      ADMIN: '/admin',
      PATIENT: '/patient',
    };
    this.router.navigate([home[role] ?? '/auth/login']);
  }

  // ---------------------------------------------------------------------
  // Quên mật khẩu (OTP lưu trên Redis, hết hạn sau 5 phút)
  // ---------------------------------------------------------------------

  public requestForgotPasswordOtp(emailOrUsername: string): Observable<OtpResponseDto> {
    const cleanInput = (emailOrUsername || '').trim();
    if (!cleanInput) {
      return throwError(() => new Error('Vui lòng nhập địa chỉ email hoặc tên đăng nhập.'));
    }
    return this.http
      .post<ApiResponse<OtpResponseDto>>('/api/auth/forgot-password', { email: cleanInput })
      .pipe(
        map((res) => res.data),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err))))
      );
  }

  public verifyOtp(email: string, otp: string): Observable<boolean> {
    const cleanOtp = (otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return throwError(() => new Error('Mã OTP phải bao gồm chính xác 6 chữ số.'));
    }
    return this.http
      .post<ApiResponse<boolean>>('/api/auth/verify-otp', { email: (email || '').trim(), otp: cleanOtp })
      .pipe(
        map((res) => !!res.data),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err))))
      );
  }

  public resetPasswordWithOtp(email: string, otp: string, newPass: string, confirmPass: string): Observable<void> {
    if (newPass !== confirmPass) {
      return throwError(() => new Error('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.'));
    }
    if (newPass.length < 6) {
      return throwError(() => new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.'));
    }
    return this.http
      .post<ApiResponse<void>>('/api/auth/reset-password', {
        email: (email || '').trim(),
        otp: (otp || '').trim(),
        newPassword: newPass,
        confirmPassword: confirmPass,
      })
      .pipe(
        map(() => void 0),
        catchError((err) => throwError(() => new Error(apiErrorMessage(err))))
      );
  }

  // ---------------------------------------------------------------------

  private startSession(res: LoginResponseDto): User {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.tokenSignal.set(res.accessToken);
    this.currentUserSignal.set(res.user);
    return res.user;
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  /** Báo backend thu hồi token (đưa vào blacklist Redis); lỗi mạng thì bỏ qua. */
  private revokeCurrentToken(): void {
    const token = this.tokenSignal();
    if (!token) return;
    this.http
      .post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } })
      .subscribe({ error: () => undefined });
  }

  private navigateAfterLogin(role: UserRole, returnUrl?: string): void {
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.redirectAfterLogin(role);
    }
  }

  private read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
