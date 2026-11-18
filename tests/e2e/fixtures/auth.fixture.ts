import { Page, expect } from '@playwright/test';

export async function loginViaUi(page: Page, username: string, password: string = '123456') {
  await page.goto('/auth/login');
  await page.locator('input[formcontrolname="username"], input[name="username"], input[type="text"]').first().fill(username);
  await page.locator('input[formcontrolname="password"], input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
}

export async function expectRedirectedToLogin(page: Page, protectedPath: string) {
  await page.goto(protectedPath);
  await expect(page).toHaveURL(/\/auth\/login/);
}
