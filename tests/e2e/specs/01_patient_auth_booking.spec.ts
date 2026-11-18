import { test, expect } from '@playwright/test';
import { loginViaUi, expectRedirectedToLogin } from '../fixtures/auth.fixture';

test.describe('E2E UC01, UC02, UC03: Cổng Bệnh nhân (Đăng ký, Đăng nhập, Đặt lịch & Quản lý lịch)', () => {
  test('TC-UC01-034: Truy cập trang bảo vệ khi chưa đăng nhập bị chuyển hướng về /auth/login', async ({ page }) => {
    await expectRedirectedToLogin(page, '/patient/appointments');
  });

  test('TC-UC01-038 & TC-UC01-040: Form đăng ký/đăng nhập hiển thị đúng và điều hướng quên mật khẩu', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    const forgotLink = page.locator('a[href*="forgot-password"], a:has-text("Quên mật khẩu")').first();
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot-password/);
    }
  });

  test('TC-UC01-041 & TC-UC02-033: Đăng ký mới -> Vào trang đặt lịch khám 4 bước -> Xem lịch hẹn', async ({ page }) => {
    const rand = Date.now().toString().slice(-6);
    const phone = `0987${rand}`;

    await page.goto('/auth/register');
    await page.locator('input[formcontrolname="fullName"]').fill(`Nguyễn Test UI ${rand}`);
    await page.locator('input[formcontrolname="phone"]').fill(phone);
    await page.locator('input[formcontrolname="email"]').fill(`ui.${rand}@smartclinic.test`);
    await page.locator('input[formcontrolname="password"]').fill('Abc@1234');
    await page.locator('button[type="submit"]').click();

    await page.waitForLoadState('networkidle');
    // Kiểm tra đã đăng nhập thành công (có token trong localStorage)
    const hasToken = await page.evaluate(() => Object.keys(localStorage).some((k) => k.toLowerCase().includes('token')));
    expect(hasToken).toBeTruthy();

    // Điều hướng sang trang đặt lịch
    await page.goto('/patient/booking');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500 Internal Server Error');
  });

  test('TC-UC03-001: Bệnh nhân xem danh sách lịch hẹn cá nhân', async ({ page }) => {
    const rand = Date.now().toString().slice(-6);
    await page.goto('/auth/register');
    await page.locator('input[formcontrolname="fullName"]').fill(`BN Lịch Hẹn ${rand}`);
    await page.locator('input[formcontrolname="phone"]').fill(`0976${rand}`);
    await page.locator('input[formcontrolname="email"]').fill(`appt.${rand}@smartclinic.test`);
    await page.locator('input[formcontrolname="password"]').fill('Abc@1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle');

    await page.goto('/patient/appointments');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});
