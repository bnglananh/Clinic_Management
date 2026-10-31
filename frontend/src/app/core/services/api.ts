import { Observable, map } from 'rxjs';

/** Định dạng phản hồi chung của backend: { success, message, data, timestamp }. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

/** Lấy phần data từ ApiResponse. */
export function unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
  return source.pipe(map((res) => res.data));
}
