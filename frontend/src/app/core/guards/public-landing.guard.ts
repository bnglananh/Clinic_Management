import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicLandingGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const user = authService.currentUser();

  // If already logged in, redirect directly to their respective role portal
  if (user && user.role) {
    authService.redirectAfterLogin(user.role);
    return false;
  }

  // Not logged in: allow viewing the public clinic landing portal
  return true;
};
