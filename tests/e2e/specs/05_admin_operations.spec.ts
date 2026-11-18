import { test, expect } from '@playwright/test';
import { loginViaUi } from '../fixtures/auth.fixture';

test.describe('E2E UC19-UC24: Phân hệ Quản trị viên (Tài khoản, Thuốc, Tồn kho, Dịch vụ, Lịch trực, Dashboard)', () => {
  test('TC-UC19-025 & TC-UC24-019: Admin đăng nhập -> Kiểm tra các phân hệ quản trị và Dashboard', async ({ page }) => {
    await loginViaUi(page, 'admin', '123456');

    const adminRoutes = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/patients',
      '/admin/pharmacy/drugs',
      '/admin/pharmacy/inventory',
      '/admin/services',
      '/admin/schedules',
      '/admin/audit-logs',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toContainText('500 Internal Server Error');
    }
  });
});
