import { test, expect } from '@playwright/test';
import { loginViaUi } from '../fixtures/auth.fixture';

test.describe('E2E UC14-UC18: Phân hệ Bác sĩ (Khám bệnh, EMR, Cận lâm sàng & An toàn kê đơn Neo4j)', () => {
  test('TC-UC14-018 & TC-UC15-025: Bác sĩ đăng nhập -> Mở buồng khám và giao diện bệnh án EMR', async ({ page }) => {
    await loginViaUi(page, 'bacsi', '123456');

    await page.goto('/doctor/consultation');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/doctor/emr');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500 Internal Server Error');
  });
});
