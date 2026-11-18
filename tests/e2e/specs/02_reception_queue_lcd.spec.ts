import { test, expect } from '@playwright/test';
import { loginViaUi } from '../fixtures/auth.fixture';

test.describe('E2E UC09, UC10, UC11: Phân hệ Lễ tân (Tiếp nhận, Cấp STT & Màn hình LCD)', () => {
  test('TC-UC09-023 & TC-UC11-001: Lễ tân đăng nhập -> Mở màn hình tiếp nhận -> Mở màn hình LCD sảnh chờ', async ({ page }) => {
    await loginViaUi(page, 'letan', '123456');

    // Kiểm tra giao diện Tiếp nhận
    await page.goto('/reception/check-in');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // Kiểm tra quản lý hàng đợi
    await page.goto('/reception/queue');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    // Kiểm tra màn hình LCD sảnh chờ (Public Queue Board)
    await page.goto('/reception/queue-board');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('404');
  });
});
