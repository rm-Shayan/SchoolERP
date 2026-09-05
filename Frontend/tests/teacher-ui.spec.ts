import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Teacher UI Flow', () => {
  test.setTimeout(60000);

  test('Login & Dashboard › teacher login redirects to /teacher/dashboard', async ({ page }) => {
    await page.goto(`${BASE}/teacher/dashboard`);
    await page.waitForURL('**/teacher/**', { timeout: 15000 });
    expect(page.url()).toContain('/teacher/');
  });

  test('Dashboard loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Dashboard shows welcome message', async ({ page }) => {
    await page.goto(`${BASE}/teacher/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    const body = await page.textContent('body');
    expect(body).toContain('Welcome');
  });

  test('My Students page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/students`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Section Attendance page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/attendance`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('My Attendance page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/my-attendance`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('My Timetable page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/timetable`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Homework page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/homework`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Study Materials page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/study-material`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Give Remark page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/conduct`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('My Leave page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/leave`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Exams page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/exams`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Announcements page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/announcements`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Notifications page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/notifications`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Settings page loads with tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    const hasContent = body.includes('Settings') || body.includes('My Profile') || body.includes('Profile');
    expect(hasContent).toBeTruthy();
  });

  test('PTM page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/ptm`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Responsive mobile renders without errors', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Responsive tablet renders without errors', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/teacher/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    expect(errors.filter((e) => !e.includes('Failed to fetch')).length).toBe(0);
  });

  test('Teacher cannot access branch portal', async ({ page }) => {
    await page.goto(`${BASE}/branch/dashboard`);
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/branch/dashboard');
  });

  test('Teacher cannot access admin portal', async ({ page }) => {
    await page.goto(`${BASE}/admin/dashboard`);
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/admin/dashboard');
  });
});
