import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Gắn JWT vào mọi request tới /api; nếu backend trả 401 (token hết hạn / đã thu hồi)
 * thì xóa phiên đăng nhập và đưa người dùng về trang đăng nhập.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isApi = req.url.startsWith('/api');
  const isLoginCall = req.url.startsWith('/api/auth/login') || req.url.startsWith('/api/auth/register');

  const authReq = isApi && token && !isLoginCall
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && isApi && !isLoginCall && token) {
        auth.handleSessionExpired();
      }
      return throwError(() => err);
    })
  );
};
