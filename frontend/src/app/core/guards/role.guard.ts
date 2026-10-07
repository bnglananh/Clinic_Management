import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const role = authService.currentRole();

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // Role unauthorized, redirect to their home
    if (role) {
      authService.redirectAfterLogin(role);
    } else {
      router.navigate(['/auth/login']);
    }
    return false;
  };
};
