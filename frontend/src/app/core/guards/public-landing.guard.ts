import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicLandingGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const user = authService.currentUser();

  // If already logged in as internal staff (ADMIN, DOCTOR, RECEPTIONIST), redirect to staff workspace
  if (user && user.role && user.role !== 'PATIENT') {
    authService.redirectAfterLogin(user.role);
    return false;
  }

  // Not logged in or logged in as PATIENT: allow viewing the full clinic landing portal
  return true;
};
