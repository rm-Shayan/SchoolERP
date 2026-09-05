import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Parent Portal UI Flow', () => {
  test.setTimeout(60000);

  test('Login page renders parent tab', async ({ page }) => {
    await page.goto(`${BASE}/parent/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).toContain('Parent');
  });

  test('Dashboard redirects to login when no token', async ({ page }) => {
    await page.goto(`${BASE}/parent/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.removeItem('parentToken');
      localStorage.removeItem('parentProfile');
      localStorage.removeItem('studentToken');
      localStorage.removeItem('studentProfile');
    });
    await page.goto(`${BASE}/parent/dashboard`);
    await page.waitForTimeout(5000);
    expect(page.url()).toContain('/parent/login');
  });

  test('Dashboard loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/parent/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Dashboard shows portal tabs', async ({ page }) => {
    await page.goto(`${BASE}/parent/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}
    await page.waitForTimeout(5000);
    const body = await page.textContent('body');
    const hasTabs = body.includes('Overview') || body.includes('Attendance') || body.includes('Fees') || body.includes('No linked');
    expect(hasTabs).toBeTruthy();
  });

  test('Responsive mobile renders without errors', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/parent/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });
});
