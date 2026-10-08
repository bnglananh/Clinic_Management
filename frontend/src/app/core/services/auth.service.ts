import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
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
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals for reactive state management
  private currentUserSignal = signal<User | null>(this.getStoredUser());
  
  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  public readonly currentRole = computed(() => this.currentUserSignal()?.role ?? null);

  constructor(private router: Router) {}

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

  login(role: UserRole): Observable<User> {
    const user = MOCK_USERS[role];
    return of(user).pipe(
      delay(300),
      tap((loggedInUser) => {
        this.setUser(loggedInUser);
        this.redirectAfterLogin(loggedInUser.role);
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
}
