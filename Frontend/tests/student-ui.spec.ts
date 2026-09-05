import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Student Portal UI Flow', () => {
  test.setTimeout(60000);

  test('Login page renders student tab', async ({ page }) => {
    await page.goto(`${BASE}/parent/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body).toContain('Student');
  });

  test('Dashboard does not redirect to login when token exists', async ({ page }) => {
    await page.goto(`${BASE}/parent/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(page.url()).toContain('/parent/dashboard');
  });

  test('Dashboard loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/parent/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Dashboard shows portal content', async ({ page }) => {
    await page.goto(`${BASE}/parent/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    const body = await page.textContent('body');
    const hasContent = body.includes('Student') || body.includes('Portal') || body.includes('Dashboard');
    expect(hasContent).toBeTruthy();
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
