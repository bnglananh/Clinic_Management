import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { UserProfile, UpdateProfilePayload, ChangePasswordPayload } from '../models/user-profile.model';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'smart_clinic_patient_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr-pat-01',
  patientCode: 'BN-2026-001',
  username: 'benhnhan',
  fullName: 'Phạm Văn An',
  dateOfBirth: '1990-05-15',
  gender: 'NAM',
  phone: '0977 889 900',
  email: 'an.pham@gmail.com',
  address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  identityCardNumber: '079090001234',
  healthInsuranceNumber: 'GD4797931234567',
  bloodType: 'O+',
  allergies: 'Dị ứng Penicillin, Hải sản (Tôm, Cua)',
  medicalNotes: 'Tiền sử tăng huyết áp nhẹ độ 1, theo dõi định kỳ',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  role: 'PATIENT',
  membershipTier: 'Hạng Vàng VIP',
  emergencyContactName: 'Nguyễn Thị Thu Hà (Vợ)',
  emergencyContactPhone: '0988 112 233',
  totalVisits: 4,
  createdAt: '2024-01-10',
  updatedAt: '2026-10-06',
};

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private profileSignal = signal<UserProfile>(this.loadStoredProfile());
  public readonly profile = this.profileSignal.asReadonly();

  // Mock stored password for validation
  private currentStoredPassword = 'password123';

  constructor(private authService: AuthService) {}

  private loadStoredProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as UserProfile;
      }
    } catch {
      // Ignore
    }
    return DEFAULT_PROFILE;
  }

  private saveProfile(profile: UserProfile): void {
    this.profileSignal.set(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore
    }
    // Synchronize with AuthService's currentUser
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.role === 'PATIENT') {
      this.authService.updateCurrentUser({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
      });
    }
  }

  getProfile(): Observable<UserProfile> {
    return of(this.profileSignal()).pipe(delay(150));
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email.trim())) {
      return throwError(() => new Error('Địa chỉ email không đúng định dạng hợp lệ.'));
    }

    // Validate phone number
    const phoneClean = payload.phone.replace(/\s+/g, '');
    if (!/^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(phoneClean)) {
      return throwError(() => new Error('Số điện thoại không đúng định dạng di động Việt Nam.'));
    }

    const current = this.profileSignal();
    const updated: UserProfile = {
      ...current,
      fullName: payload.fullName.trim(),
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      address: payload.address.trim(),
      identityCardNumber: payload.identityCardNumber.trim(),
      healthInsuranceNumber: payload.healthInsuranceNumber.trim(),
      bloodType: payload.bloodType,
      allergies: payload.allergies.trim(),
      medicalNotes: payload.medicalNotes.trim(),
      emergencyContactName: payload.emergencyContactName?.trim(),
      emergencyContactPhone: payload.emergencyContactPhone?.trim(),
      avatarUrl: payload.avatarUrl || current.avatarUrl,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    return of(updated).pipe(
      delay(300),
      tap((saved) => this.saveProfile(saved))
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    // SRS UC01 BR 4.1: Kiểm tra mật khẩu hiện tại
    if (payload.currentPassword !== this.currentStoredPassword) {
      return throwError(() => new Error('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.'));
    }

    // Kiểm tra mật khẩu xác nhận
    if (payload.newPassword !== payload.confirmPassword) {
      return throwError(() => new Error('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.'));
    }

    // SRS UC01 BR 4.2: Mật khẩu mới không trùng mật khẩu cũ và tối thiểu 6 ký tự
    if (payload.newPassword === payload.currentPassword) {
      return throwError(() => new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại.'));
    }

    if (payload.newPassword.length < 6) {
      return throwError(() => new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.'));
    }

    this.currentStoredPassword = payload.newPassword;
    return of(void 0).pipe(delay(300));
  }

  updateAvatar(avatarUrl: string): Observable<UserProfile> {
    const current = this.profileSignal();
    const updated: UserProfile = {
      ...current,
      avatarUrl,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    return of(updated).pipe(
      delay(200),
      tap((saved) => this.saveProfile(saved))
    );
  }
}
