import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vndCurrency',
  standalone: true,
})
export class VndCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '0 ₫';
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  }
}
