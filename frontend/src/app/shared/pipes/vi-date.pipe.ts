import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'viDate',
  standalone: true,
})
export class ViDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'date' | 'datetime' | 'time' = 'date'): string {
    if (!value) return '--';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '--';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (format === 'time') {
      return `${hours}:${minutes}`;
    }
    if (format === 'datetime') {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
  }
}
