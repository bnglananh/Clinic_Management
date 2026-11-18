import { test, expect } from '@playwright/test';

test.describe('UI & Responsive Navigation (1920px & 375px)', () => {
  test('TC-UC01-039: Trang chủ và trang đăng nhập hiển thị không bị tràn ngang trên desktop/mobile', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    expect(overflow).toBeFalsy();
  });

  test('TC-UC01-018 (UI): Nút Đăng nhập xử lý khi để trống trường bắt buộc', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
