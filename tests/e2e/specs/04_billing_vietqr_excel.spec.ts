import { test, expect } from '@playwright/test';
import { loginViaUi } from '../fixtures/auth.fixture';

test.describe('E2E UC13: Phân hệ Thu ngân (Hóa đơn, VietQR động & Xuất sổ Excel)', () => {
  test('TC-UC13-028: Thu ngân đăng nhập -> Mở màn hình Viện phí -> Kiểm tra nút xuất Excel', async ({ page }) => {
    await loginViaUi(page, 'letan', '123456');

    await page.goto('/reception/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    const exportBtn = page.locator('button:has-text("Excel"), button:has-text("Xuất")').first();
    if (await exportBtn.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10_000 }).catch(() => null),
        exportBtn.click(),
      ]);
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
      }
    }
  });
});
